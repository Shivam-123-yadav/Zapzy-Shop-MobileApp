from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from decimal import Decimal
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken # type: ignore
from .models import Address, Wishlist, WishlistItem, Cart, CartItem, Order, OrderItem, OrderTracking
from products.models import Product


@csrf_exempt
def register_view(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        mobile = data.get('mobile', '').strip()
        password = data.get('password', '')

        # Validation
        if not name:
            return JsonResponse({'error': 'Name is required'}, status=400)

        if not email:
            return JsonResponse({'error': 'Email is required'}, status=400)

        if not mobile:
            return JsonResponse({'error': 'Mobile number is required'}, status=400)

        if len(mobile) != 10 or not mobile.isdigit():
            return JsonResponse({'error': 'Enter valid 10 digit mobile number'}, status=400)

        if not password or len(password) < 6:
            return JsonResponse({'error': 'Password must be at least 6 characters'}, status=400)

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return JsonResponse({'error': 'User with this email already exists'}, status=400)

        if User.objects.filter(username=email).exists():
            return JsonResponse({'error': 'User with this email already exists'}, status=400)

        # Create user
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=name.split()[0] if name else '',
            last_name=' '.join(name.split()[1:]) if len(name.split()) > 1 else ''
        )

        return JsonResponse({
            'message': 'User registered successfully',
            'user': {
                'id': user.id,
                'name': user.get_full_name(),
                'email': user.email,
            }
        }, status=201)

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': 'Registration failed'}, status=500)


@csrf_exempt
def login_view(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        # Validation
        if not email:
            return JsonResponse({'error': 'Email is required'}, status=400)

        if not password:
            return JsonResponse({'error': 'Password is required'}, status=400)

        # Authenticate user
        user = authenticate(request, username=email, password=password)

        if user is not None:
            refresh = RefreshToken.for_user(user)
            return JsonResponse({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'name': user.get_full_name() or user.username,
                    'email': user.email,
                },
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=200)
        else:
            return JsonResponse({'error': 'Invalid email or password'}, status=401)

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': 'Login failed'}, status=500)


@csrf_exempt
def forgot_password_view(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
        email = data.get('email', '').strip().lower()

        # Validation
        if not email:
            return JsonResponse({'error': 'Email is required'}, status=400)

        # Check if user exists
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal if email exists or not for security
            return JsonResponse({
                'message': 'If an account with this email exists, a password reset link has been sent.'
            }, status=200)

        # In a real application, you would:
        # 1. Generate a password reset token
        # 2. Send an email with reset link
        # 3. Store the token with expiration

        # For now, we'll just return success message
        return JsonResponse({
            'message': 'If an account with this email exists, a password reset link has been sent.'
        }, status=200)

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': 'Password reset request failed'}, status=500)


@csrf_exempt
@require_http_methods(["GET", "POST"])
def address_list_create(request):
    """List all addresses for the authenticated user or create a new address."""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    user = request.user

    if request.method == 'GET':
        addresses = Address.objects.filter(user=user)
        address_data = []
        for addr in addresses:
            address_data.append({
                'id': addr.id,
                'type': addr.type,
                'name': addr.name,
                'phone': addr.phone,
                'address_line_1': addr.address_line_1,
                'address_line_2': addr.address_line_2,
                'city': addr.city,
                'state': addr.state,
                'postal_code': addr.postal_code,
                'country': addr.country,
                'is_default': addr.is_default,
            })
        return JsonResponse({'addresses': address_data}, status=200)

    elif request.method == 'POST':
        try:
            if not request.body:
                return JsonResponse({'error': 'Empty request body'}, status=400)
            data = json.loads(request.body)
            address = Address.objects.create(
                user=user,
                type=data.get('type', 'home'),
                name=data['name'],
                phone=data['phone'],
                address_line_1=data['address_line_1'],
                address_line_2=data.get('address_line_2', ''),
                city=data['city'],
                state=data['state'],
                postal_code=data['postal_code'],
                country=data.get('country', 'India'),
                is_default=data.get('is_default', False)
            )

            # If this is set as default, unset other defaults
            if address.is_default:
                Address.objects.filter(user=user).exclude(id=address.id).update(is_default=False)

            return JsonResponse({
                'message': 'Address created successfully',
                'address': {
                    'id': address.id,
                    'type': address.type,
                    'name': address.name,
                    'phone': address.phone,
                    'address_line_1': address.address_line_1,
                    'address_line_2': address.address_line_2,
                    'city': address.city,
                    'state': address.state,
                    'postal_code': address.postal_code,
                    'country': address.country,
                    'is_default': address.is_default,
                }
            }, status=201)

        except KeyError as e:
            return JsonResponse({'error': f'Missing required field: {str(e)}'}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': f'Failed to create address: {str(e)}'}, status=500)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def address_detail(request, address_id):
    """Retrieve, update, or delete a specific address."""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    user = request.user

    try:
        address = Address.objects.get(id=address_id, user=user)
    except Address.DoesNotExist:
        return JsonResponse({'error': 'Address not found'}, status=404)

    if request.method == 'GET':
        return JsonResponse({
            'address': {
                'id': address.id,
                'type': address.type,
                'name': address.name,
                'phone': address.phone,
                'address_line_1': address.address_line_1,
                'address_line_2': address.address_line_2,
                'city': address.city,
                'state': address.state,
                'postal_code': address.postal_code,
                'country': address.country,
                'is_default': address.is_default,
            }
        }, status=200)

    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            address.type = data.get('type', address.type)
            address.name = data.get('name', address.name)
            address.phone = data.get('phone', address.phone)
            address.address_line_1 = data.get('address_line_1', address.address_line_1)
            address.address_line_2 = data.get('address_line_2', address.address_line_2)
            address.city = data.get('city', address.city)
            address.state = data.get('state', address.state)
            address.postal_code = data.get('postal_code', address.postal_code)
            address.country = data.get('country', address.country)
            address.is_default = data.get('is_default', address.is_default)
            address.save()

            # If this is set as default, unset other defaults
            if address.is_default:
                Address.objects.filter(user=user).exclude(id=address.id).update(is_default=False)

            return JsonResponse({
                'message': 'Address updated successfully',
                'address': {
                    'id': address.id,
                    'type': address.type,
                    'name': address.name,
                    'phone': address.phone,
                    'address_line_1': address.address_line_1,
                    'address_line_2': address.address_line_2,
                    'city': address.city,
                    'state': address.state,
                    'postal_code': address.postal_code,
                    'country': address.country,
                    'is_default': address.is_default,
                }
            }, status=200)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': 'Failed to update address'}, status=500)

    elif request.method == 'DELETE':
        address.delete()
        return JsonResponse({'message': 'Address deleted successfully'}, status=200)


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Profile

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    profile, created = Profile.objects.get_or_create(user=request.user)

    if request.method == 'GET':
        return Response({
            "name": request.user.get_full_name() or request.user.username,
            "email": request.user.email,
            "phone": profile.phone,
        })

    if request.method == 'PUT':
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip().lower()
        phone = request.data.get('phone', '').strip()

        # Update name (first_name and last_name)
        if name:
            name_parts = name.split()
            request.user.first_name = name_parts[0] if name_parts else ''
            request.user.last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''

        # Update email if changed and not taken
        if email and email != request.user.email:
            if User.objects.filter(email=email).exclude(id=request.user.id).exists():
                return Response({"error": "Email already in use"}, status=400)
            request.user.email = email

        request.user.save()

        profile.phone = phone
        profile.save()

        return Response({"message": "Profile updated successfully"})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def wishlist_view(request):
    """Get user's wishlist items."""
    wishlist, created = Wishlist.objects.get_or_create(user=request.user)
    items = wishlist.items.all().select_related('product')

    wishlist_data = []
    for item in items:
        product = item.product
        wishlist_data.append({
            'id': str(item.id),
            'product_id': product.id,
            'name': product.name,
            'price': product.price,
            'original_price': product.original_price,
            'discount_percentage': product.discount_percentage,
            'image': request.build_absolute_uri(product.image.url) if product.image else None,
            'rating': product.rating,
            'review_count': product.review_count,
            'added_at': item.added_at.isoformat(),
        })

    return Response({'wishlist_items': wishlist_data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_wishlist_view(request):
    """Add product to user's wishlist."""
    product_id = request.data.get('product_id')
    if not product_id:
        return Response({'error': 'Product ID is required'}, status=400)

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)

    wishlist, created = Wishlist.objects.get_or_create(user=request.user)

    # Check if item already exists
    if WishlistItem.objects.filter(wishlist=wishlist, product=product).exists():
        return Response({'message': 'Product already in wishlist'})

    WishlistItem.objects.create(wishlist=wishlist, product=product)
    return Response({'message': 'Product added to wishlist'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_wishlist_view(request, item_id):
    """Remove item from user's wishlist."""
    try:
        wishlist = Wishlist.objects.get(user=request.user)
        item = WishlistItem.objects.get(id=item_id, wishlist=wishlist)
        item.delete()
        return Response({'message': 'Item removed from wishlist'})
    except Wishlist.DoesNotExist:
        return Response({'error': 'Wishlist not found'}, status=404)
    except WishlistItem.DoesNotExist:
        return Response({'error': 'Item not found in wishlist'}, status=404)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_wishlist_view(request):
    """Clear all items from user's wishlist."""
    try:
        wishlist = Wishlist.objects.get(user=request.user)
        wishlist.items.all().delete()
        return Response({'message': 'Wishlist cleared'})
    except Wishlist.DoesNotExist:
        return Response({'error': 'Wishlist not found'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def cart_view(request):
    """Get user's cart items."""
    cart, created = Cart.objects.get_or_create(user=request.user)
    items = cart.items.all().select_related('product')

    cart_data = []
    for item in items:
        product = item.product
        cart_data.append({
            'id': str(item.id),
            'product_id': product.id,
            'name': product.name,
            'price': product.price,
            'original_price': product.original_price,
            'discount_percentage': product.discount_percentage,
            'image': request.build_absolute_uri(product.image.url) if product.image else None,
            'rating': product.rating,
            'review_count': product.review_count,
            'quantity': item.quantity,
            'subtotal': item.subtotal,
            'added_at': item.added_at.isoformat(),
        })

    return Response({
        'cart_items': cart_data,
        'total_items': cart.total_items,
        'total_price': cart.total_price
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart_view(request):
    """Add product to user's cart."""
    product_id = request.data.get('product_id')
    quantity = request.data.get('quantity', 1)

    if not product_id:
        return Response({'error': 'Product ID is required'}, status=400)

    try:
        quantity = int(quantity)
        if quantity < 1:
            return Response({'error': 'Quantity must be at least 1'}, status=400)
    except (ValueError, TypeError):
        return Response({'error': 'Invalid quantity'}, status=400)

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)

    cart, created = Cart.objects.get_or_create(user=request.user)

    # Check if item already exists in cart
    cart_item, created = CartItem.objects.get_or_create(
        cart=cart,
        product=product,
        defaults={'quantity': quantity}
    )

    if not created:
        # Item already exists, update quantity
        cart_item.quantity += quantity
        cart_item.save()

    return Response({
        'message': 'Product added to cart',
        'cart_item_id': cart_item.id,
        'quantity': cart_item.quantity
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_cart_item_view(request, item_id):
    """Update quantity of cart item."""
    quantity = request.data.get('quantity')

    if quantity is None:
        return Response({'error': 'Quantity is required'}, status=400)

    try:
        quantity = int(quantity)
        if quantity < 1:
            return Response({'error': 'Quantity must be at least 1'}, status=400)
    except (ValueError, TypeError):
        return Response({'error': 'Invalid quantity'}, status=400)

    try:
        cart = Cart.objects.get(user=request.user)
        item = CartItem.objects.get(id=item_id, cart=cart)
        item.quantity = quantity
        item.save()
        return Response({
            'message': 'Cart item updated',
            'quantity': item.quantity,
            'subtotal': item.subtotal
        })
    except Cart.DoesNotExist:
        return Response({'error': 'Cart not found'}, status=404)
    except CartItem.DoesNotExist:
        return Response({'error': 'Item not found in cart'}, status=404)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_from_cart_view(request, item_id):
    """Remove item from user's cart."""
    try:
        cart = Cart.objects.get(user=request.user)
        item = CartItem.objects.get(id=item_id, cart=cart)
        item.delete()
        return Response({'message': 'Item removed from cart'})
    except Cart.DoesNotExist:
        return Response({'error': 'Cart not found'}, status=404)
    except CartItem.DoesNotExist:
        return Response({'error': 'Item not found in cart'}, status=404)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_cart_view(request):
    """Clear all items from user's cart."""
    try:
        cart = Cart.objects.get(user=request.user)
        cart.items.all().delete()
        return Response({'message': 'Cart cleared'})
    except Cart.DoesNotExist:
        return Response({'error': 'Cart not found'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order_view(request):
    """Create a new order from user's cart."""
    try:
        # Get user's cart
        cart = Cart.objects.get(user=request.user)
        cart_items = cart.items.all()

        if not cart_items.exists():
            return Response({'error': 'Cart is empty'}, status=400)

        print(f"Cart has {cart_items.count()} items")

        # Get delivery details from request
        delivery_address_id = request.data.get('delivery_address_id')
        delivery_slot_date = request.data.get('delivery_slot_date')
        delivery_slot_time = request.data.get('delivery_slot_time')
        payment_method = request.data.get('payment_method', 'upi')

        print(f"Creating order for user {request.user.id} with delivery_address_id: {delivery_address_id}")

        if not all([delivery_address_id, delivery_slot_date, delivery_slot_time]):
            return Response({'error': 'Delivery address and slot are required'}, status=400)

        # Get delivery address
        try:
            delivery_address = Address.objects.get(id=delivery_address_id, user=request.user)
        except Address.DoesNotExist:
            # Try to find any address for this user as fallback
            user_addresses = Address.objects.filter(user=request.user)
            if user_addresses.exists():
                delivery_address = user_addresses.first()
            else:
                return Response({'error': 'No delivery addresses found. Please add an address.'}, status=404)

        # Calculate totals
        subtotal = sum(item.subtotal for item in cart_items)
        delivery_fee = Decimal('40.00')  # Fixed delivery fee
        discount = Decimal('0.00')  # TODO: Implement coupon system
        tax = subtotal * Decimal('0.18')  # 18% GST
        total = subtotal + delivery_fee - discount + tax

        # Create order
        try:
            order = Order.objects.create(
                user=request.user,
                payment_method=payment_method,
                delivery_address=delivery_address,
                delivery_slot_date=delivery_slot_date,
                delivery_slot_time=delivery_slot_time,
                subtotal=subtotal,
                delivery_fee=delivery_fee,
                discount=discount,
                tax=tax,
                total=total,
            )
        except Exception as e:
            return Response({'error': f'Failed to create order: {str(e)}'}, status=500)

        # Create order items from cart items
        order_items = []
        for cart_item in cart_items:
            try:
                subtotal = cart_item.product.price * cart_item.quantity
                order_item = OrderItem.objects.create(
                    order=order,
                    product=cart_item.product,
                    quantity=cart_item.quantity,
                    price=cart_item.product.price,
                    subtotal=subtotal,
                )
                order_items.append(order_item)
            except Exception as e:
                return Response({'error': f'Failed to create order item: {str(e)}'}, status=500)

        # Create initial tracking entry
        try:
            estimated_delivery = order.created_at.replace(hour=14, minute=0, second=0, microsecond=0)
            OrderTracking.objects.create(
                order=order,
                status='placed',
                message='Order placed successfully',
                estimated_delivery=estimated_delivery,
            )
        except Exception as e:
            return Response({'error': f'Failed to create order tracking: {str(e)}'}, status=500)

        # Clear the cart
        cart_items.delete()

        return Response({
            'message': 'Order created successfully',
            'order_id': order.id,
            'order_number': order.order_number,
            'total': str(order.total),
            'estimated_delivery': order.created_at.isoformat(),
        }, status=201)

    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_list_view(request):
    """Get user's order history."""
    orders = Order.objects.filter(user=request.user).select_related('delivery_address')

    order_data = []
    for order in orders:
        order_items = OrderItem.objects.filter(order=order).select_related('product')
        tracking = OrderTracking.objects.filter(order=order).order_by('-timestamp').first()

        order_data.append({
            'id': order.id,
            'order_number': order.order_number,
            'status': order.status,
            'total': str(order.total),
            'created_at': order.created_at,
            'delivery_slot_date': order.delivery_slot_date,
            'delivery_slot_time': order.delivery_slot_time,
            'pricing': {
                'subtotal': str(order.subtotal),
                'delivery_fee': str(order.delivery_fee),
                'discount': str(order.discount),
                'tax': str(order.tax),
            },
            'delivery_address': {
                'id': order.delivery_address.id,
                'name': order.delivery_address.name,
                'phone': order.delivery_address.phone,
                'address_line_1': order.delivery_address.address_line_1,
                'city': order.delivery_address.city,
                'state': order.delivery_address.state,
                'postal_code': order.delivery_address.postal_code,
            } if order.delivery_address else None,
            'items': [{
                'id': item.id,
                'product_id': item.product.id,
                'name': item.product.name,
                'quantity': item.quantity,
                'price': str(item.price),
                'image': item.product.image.url if item.product.image else None,
            } for item in order_items],
            'tracking': {
                'status': tracking.status if tracking else 'placed',
                'message': tracking.message if tracking else 'Order placed',
                'timestamp': tracking.timestamp if tracking else order.created_at,
            } if tracking else None,
        })

    return Response(order_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_detail_view(request, order_id):
    """Get detailed information about a specific order."""
    try:
        order = Order.objects.select_related('user', 'delivery_address').get(id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)

    order_items = OrderItem.objects.filter(order=order).select_related('product')
    tracking_history = OrderTracking.objects.filter(order=order).order_by('timestamp')

    order_data = {
        'id': order.id,
        'order_number': order.order_number,
        'status': order.status,
        'payment_method': order.payment_method,
        'payment_status': order.payment_status,
        'delivery_address': {
            'id': order.delivery_address.id,
            'name': order.delivery_address.name,
            'phone': order.delivery_address.phone,
            'address_line_1': order.delivery_address.address_line_1,
            'address_line_2': order.delivery_address.address_line_2,
            'city': order.delivery_address.city,
            'state': order.delivery_address.state,
            'postal_code': order.delivery_address.postal_code,
        } if order.delivery_address else None,
        'delivery_slot_date': order.delivery_slot_date,
        'delivery_slot_time': order.delivery_slot_time,
        'pricing': {
            'subtotal': str(order.subtotal),
            'delivery_fee': str(order.delivery_fee),
            'discount': str(order.discount),
            'tax': str(order.tax),
            'total': str(order.total),
        },
        'items': [{
            'id': item.id,
            'product_id': item.product.id,
            'name': item.product.name,
            'quantity': item.quantity,
            'price': str(item.price),
            'subtotal': str(item.subtotal),
            'image': item.product.image.url if item.product.image else None,
        } for item in order_items],
        'tracking_history': [{
            'status': tracking.status,
            'message': tracking.message,
            'timestamp': tracking.timestamp,
            'estimated_delivery': tracking.estimated_delivery,
        } for tracking in tracking_history],
        'created_at': order.created_at,
        'updated_at': order.updated_at,
        'delivered_at': order.delivered_at,
    }

    return Response(order_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_tracking_view(request, order_id):
    """Get tracking information for a specific order."""
    try:
        order = Order.objects.get(id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)

    tracking_history = OrderTracking.objects.filter(order=order).order_by('timestamp')

    tracking_data = {
        'order_id': order.id,
        'order_number': order.order_number,
        'current_status': order.status,
        'tracking_history': [{
            'status': tracking.status,
            'message': tracking.message,
            'timestamp': tracking.timestamp,
            'estimated_delivery': tracking.estimated_delivery,
        } for tracking in tracking_history],
    }

    return Response(tracking_data)


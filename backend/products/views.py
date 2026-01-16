from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from .models import Product, Category

@csrf_exempt
@require_http_methods(["GET"])
def product_list(request):
    """List all active products with optional filtering."""
    try:
        # Get query parameters
        category_id = request.GET.get('category')
        search = request.GET.get('search')
        limit = int(request.GET.get('limit', 20))
        offset = int(request.GET.get('offset', 0))

        # Base queryset
        products = Product.objects.filter(is_active=True)

        # Apply filters
        if category_id:
            products = products.filter(category_id=category_id)

        if search:
            products = products.filter(name__icontains=search)

        # Pagination
        total_count = products.count()
        products = products[offset:offset + limit]

        # Serialize products
        product_data = []
        for product in products:
            product_data.append({
                'id': product.id,
                'name': product.name,
                'description': product.description,
                'price': float(product.price),
                'original_price': float(product.original_price) if product.original_price else None,
                'discount_percentage': product.discount_percentage,
                'category': {
                    'id': product.category.id,
                    'name': product.category.name,
                },
                'image': request.build_absolute_uri(product.image.url) if product.image else None,
                'images': product.images,
                'stock': product.stock,
                'rating': float(product.rating),
                'review_count': product.review_count,
            })

        return JsonResponse({
            'products': product_data,
            'total_count': total_count,
            'has_more': offset + limit < total_count,
        }, status=200)

    except Exception as e:
        return JsonResponse({'error': f'Failed to fetch products: {str(e)}'}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def product_detail(request, product_id):
    """Get detailed information about a specific product."""
    try:
        product = Product.objects.get(id=product_id, is_active=True)

        return JsonResponse({
            'product': {
                'id': product.id,
                'name': product.name,
                'description': product.description,
                'price': float(product.price),
                'original_price': float(product.original_price) if product.original_price else None,
                'discount_percentage': product.discount_percentage,
                'category': {
                    'id': product.category.id,
                    'name': product.category.name,
                },
                'image': request.build_absolute_uri(product.image.url) if product.image else None,
                'images': product.images,
                'stock': product.stock,
                'rating': float(product.rating),
                'review_count': product.review_count,
                'created_at': product.created_at.isoformat(),
            }
        }, status=200)

    except Product.DoesNotExist:
        return JsonResponse({'error': 'Product not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': f'Failed to fetch product: {str(e)}'}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def category_list(request):
    """List all categories."""
    try:
        categories = Category.objects.all()
        category_data = []

        for category in categories:
            category_data.append({
                'id': category.id,
                'name': category.name,
                'description': category.description,
                'image': request.build_absolute_uri(category.image.url) if category.image else None,
                'product_count': category.products.filter(is_active=True).count(),
            })

        return JsonResponse({'categories': category_data}, status=200)

    except Exception as e:
        return JsonResponse({'error': f'Failed to fetch categories: {str(e)}'}, status=500)

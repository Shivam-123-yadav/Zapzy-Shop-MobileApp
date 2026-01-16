from django.db import models
from decimal import Decimal
from django.contrib.auth.models import User
from products.models import Product

class Address(models.Model):
    ADDRESS_TYPES = [
        ('home', 'Home'),
        ('work', 'Work'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    type = models.CharField(max_length=10, choices=ADDRESS_TYPES, default='home')
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    address_line_1 = models.CharField(max_length=255)
    address_line_2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=10)
    country = models.CharField(max_length=100, default='India')
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Address'
        verbose_name_plural = 'Addresses'
        ordering = ['-is_default', '-created_at']

    def __str__(self):
        return f"{self.name} - {self.type} ({self.city})"

class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart of {self.user.username}"

    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())

    @property
    def total_price(self):
        return sum(item.subtotal for item in self.items.all())

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['cart', 'product']

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"

    @property
    def subtotal(self):
        return Decimal(self.product.price) * Decimal(self.quantity)

class Wishlist(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wishlist')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Wishlist of {self.user.username}"

class WishlistItem(models.Model):
    wishlist = models.ForeignKey(Wishlist, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['wishlist', 'product']

    def __str__(self):
        return f"{self.product.name} in {self.wishlist.user.username}'s wishlist"


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone = models.CharField(max_length=15, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    def __str__(self):
        return self.user.username


class Order(models.Model):
    ORDER_STATUS = [
        ('placed', 'Placed'),
        ('confirmed', 'Confirmed'),
        ('packed', 'Packed'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    PAYMENT_METHODS = [
        ('upi', 'UPI'),
        ('netbanking', 'Net Banking'),
        ('wallet', 'Digital Wallet'),
        ('cod', 'Cash on Delivery'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    order_number = models.CharField(max_length=20, unique=True)
    status = models.CharField(max_length=20, choices=ORDER_STATUS, default='placed')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='upi')
    payment_status = models.CharField(max_length=20, default='pending')

    # Delivery details
    delivery_address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, blank=True)
    delivery_slot_date = models.DateField()
    delivery_slot_time = models.CharField(max_length=50)

    # Pricing
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order {self.order_number} by {self.user.username}"

    def save(self, *args, **kwargs):
        if not self.order_number:
            # Generate order number: ORD + timestamp + random 4 digits
            import random
            import time
            timestamp = str(int(time.time()))
            random_digits = str(random.randint(1000, 9999))
            self.order_number = f"ORD{timestamp}{random_digits}"
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Price at time of order
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.product.name} in Order {self.order.order_number}"

    def save(self, *args, **kwargs):
        if self.subtotal is None:
            self.subtotal = Decimal(self.price) * Decimal(self.quantity)
        super().save(*args, **kwargs)


class OrderTracking(models.Model):
    TRACKING_STATUS = [
        ('placed', 'Order Placed'),
        ('confirmed', 'Order Confirmed'),
        ('packed', 'Order Packed'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='tracking_history')
    status = models.CharField(max_length=20, choices=TRACKING_STATUS)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    estimated_delivery = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.order.order_number} - {self.status} at {self.timestamp}"
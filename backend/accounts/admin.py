from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import Address, Cart, CartItem, Wishlist, WishlistItem, Order, OrderItem, OrderTracking

# Extend the default UserAdmin to show related data
class CustomUserAdmin(UserAdmin):
    list_display = UserAdmin.list_display + ('address_count', 'cart_items', 'wishlist_items')
    list_filter = UserAdmin.list_filter + ('date_joined',)

    def address_count(self, obj):
        return obj.addresses.count()
    address_count.short_description = 'Addresses'

    def cart_items(self, obj):
        try:
            return obj.cart.total_items
        except:
            return 0
    cart_items.short_description = 'Cart Items'

    def wishlist_items(self, obj):
        try:
            return obj.wishlist.items.count()
        except:
            return 0
    wishlist_items.short_description = 'Wishlist Items'

# Unregister the default User admin and register our custom one
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ['user', 'type', 'name', 'phone', 'city', 'state', 'is_default', 'created_at']
    list_filter = ['type', 'city', 'state', 'country', 'is_default', 'created_at']
    search_fields = ['user__username', 'user__email', 'name', 'phone', 'city', 'state']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-is_default', '-created_at']

    fieldsets = (
        ('User & Type', {
            'fields': ('user', 'type', 'is_default')
        }),
        ('Contact Information', {
            'fields': ('name', 'phone')
        }),
        ('Address Details', {
            'fields': ('address_line_1', 'address_line_2', 'city', 'state', 'postal_code', 'country')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_items', 'total_price', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at', 'total_items', 'total_price']
    ordering = ['-updated_at']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user').prefetch_related('items__product')

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['cart', 'product', 'quantity', 'subtotal', 'added_at']
    list_filter = ['added_at', 'cart__user']
    search_fields = ['cart__user__username', 'product__name']
    readonly_fields = ['added_at', 'subtotal']
    ordering = ['-added_at']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('cart__user', 'product')

@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ['user', 'item_count', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-updated_at']

    def item_count(self, obj):
        return obj.items.count()
    item_count.short_description = 'Items'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user').prefetch_related('items__product')

@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ['wishlist', 'product', 'added_at']
    list_filter = ['added_at', 'wishlist__user']
    search_fields = ['wishlist__user__username', 'product__name']
    readonly_fields = ['added_at']
    ordering = ['-added_at']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('wishlist__user', 'product')


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['subtotal']
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


class OrderTrackingInline(admin.TabularInline):
    model = OrderTracking
    extra = 0
    readonly_fields = ['timestamp']
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'user', 'status', 'payment_method', 'total', 'delivery_slot_date', 'delivery_slot_time', 'created_at']
    list_filter = ['status', 'payment_method', 'payment_status', 'delivery_slot_date', 'created_at']
    search_fields = ['order_number', 'user__username', 'user__email']
    readonly_fields = ['order_number', 'created_at', 'updated_at', 'delivered_at']
    ordering = ['-created_at']
    inlines = [OrderItemInline, OrderTrackingInline]

    fieldsets = (
        ('Order Information', {
            'fields': ('order_number', 'user', 'status', 'payment_method', 'payment_status')
        }),
        ('Delivery Details', {
            'fields': ('delivery_address', 'delivery_slot_date', 'delivery_slot_time')
        }),
        ('Pricing', {
            'fields': ('subtotal', 'delivery_fee', 'discount', 'tax', 'total')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'delivered_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'delivery_address')


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product', 'quantity', 'price', 'subtotal']
    list_filter = ['order__status', 'order__created_at']
    search_fields = ['order__order_number', 'product__name']
    readonly_fields = ['subtotal']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('order', 'product')


@admin.register(OrderTracking)
class OrderTrackingAdmin(admin.ModelAdmin):
    list_display = ['order', 'status', 'message', 'timestamp', 'estimated_delivery']
    list_filter = ['status', 'timestamp']
    search_fields = ['order__order_number', 'message']
    readonly_fields = ['timestamp']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('order')

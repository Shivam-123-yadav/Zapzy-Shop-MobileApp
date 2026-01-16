from django.contrib import admin
from .models import Category, Product

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'product_count', 'created_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['name']

    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = 'Products'

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'original_price', 'stock', 'rating', 'is_active', 'created_at']
    list_filter = ['category', 'is_active', 'created_at', 'updated_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at', 'discount_percentage']
    ordering = ['-created_at']
    list_editable = ['is_active', 'stock']

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'category', 'image', 'images')
        }),
        ('Pricing', {
            'fields': ('price', 'original_price', 'discount_percentage')
        }),
        ('Inventory & Status', {
            'fields': ('stock', 'is_active')
        }),
        ('Reviews', {
            'fields': ('rating', 'review_count')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('category')

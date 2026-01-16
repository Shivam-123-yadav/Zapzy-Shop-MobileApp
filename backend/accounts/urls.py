from django.urls import path
from . import views
from .views import profile_view, wishlist_view, add_to_wishlist_view, remove_from_wishlist_view, clear_wishlist_view, cart_view, add_to_cart_view, update_cart_item_view, remove_from_cart_view, clear_cart_view, create_order_view, order_list_view, order_detail_view, order_tracking_view
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('forgot-password/', views.forgot_password_view, name='forgot_password'),
    path('addresses/', views.address_list_create, name='address_list_create'),
    path('addresses/<int:address_id>/', views.address_detail, name='address_detail'),
    path('profile/', profile_view, name='profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('wishlist/', wishlist_view, name='wishlist'),
    path('wishlist/add/', add_to_wishlist_view, name='add_to_wishlist'),
    path('wishlist/remove/<int:item_id>/', remove_from_wishlist_view, name='remove_from_wishlist'),
    path('wishlist/clear/', clear_wishlist_view, name='clear_wishlist'),
    path('cart/', cart_view, name='cart'),
    path('cart/add/', add_to_cart_view, name='add_to_cart'),
    path('cart/update/<int:item_id>/', update_cart_item_view, name='update_cart_item'),
    path('cart/remove/<int:item_id>/', remove_from_cart_view, name='remove_from_cart'),
    path('cart/clear/', clear_cart_view, name='clear_cart'),
    path('orders/', order_list_view, name='order_list'),
    path('orders/create/', create_order_view, name='create_order'),
    path('orders/<int:order_id>/', order_detail_view, name='order_detail'),
    path('orders/<int:order_id>/tracking/', order_tracking_view, name='order_tracking'),
]
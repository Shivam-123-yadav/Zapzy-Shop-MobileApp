import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cartAPI } from '../services/api';
import { Coupon, DeliverySlot, OrderSummary } from '../types';
import { useAuth } from './AuthContext';

// Adapt API CartItem to frontend CartItem
interface CartItem {
  id: string;
  product_id: number;
  name: string;
  price: number;
  original_price: number | null;
  discount_percentage: number;
  image: string;
  rating: number;
  review_count: number;
  quantity: number;
  subtotal: number;
  added_at: string;
}

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  error: string | null;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  getTotalPrice: () => number;
  getDeliveryFee: () => number;
  getGrandTotal: () => number;
  appliedCoupon: Coupon | null;
  applyCoupon: (coupon: Coupon | null) => void;
  selectedDeliverySlot: DeliverySlot | null;
  setDeliverySlot: (slot: DeliverySlot | null) => void;
  getOrderSummary: () => OrderSummary;
  minimumOrderValue: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [selectedDeliverySlot, setSelectedDeliverySlot] = useState<DeliverySlot | null>(null);
  const minimumOrderValue = 200; // Minimum order value for checkout

  // Load cart when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      // Clear cart when user logs out
      setCartItems([]);
      setError(null);
    }
  }, [isAuthenticated]);

  const refreshCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const cartData = await cartAPI.getCart();
      setCartItems(cartData.cart_items);
    } catch (err: any) {
      // Only set error if it's not an auth error (401)
      if (err.response?.status !== 401) {
        setError(err.error || 'Failed to load cart');
      }
      console.error('Error loading cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: number, quantity: number = 1) => {
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to add items to cart');
    }
    try {
      setError(null);
      await cartAPI.addToCart(productId, quantity);
      await refreshCart(); // Refresh cart to get updated data
    } catch (err: any) {
      setError(err.error || 'Failed to add item to cart');
      throw err;
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to update cart');
    }
    if (quantity <= 0) {
      await removeFromCart(id);
      return;
    }
    try {
      setError(null);
      await cartAPI.updateCartItem(id, quantity);
      await refreshCart(); // Refresh cart to get updated data
    } catch (err: any) {
      setError(err.error || 'Failed to update item quantity');
      throw err;
    }
  };

  const removeFromCart = async (id: string) => {
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to remove items from cart');
    }
    try {
      setError(null);
      await cartAPI.removeFromCart(id);
      await refreshCart(); // Refresh cart to get updated data
    } catch (err: any) {
      setError(err.error || 'Failed to remove item from cart');
      throw err;
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) {
      throw new Error('User must be authenticated to clear cart');
    }
    try {
      setError(null);
      await cartAPI.clearCart();
      setCartItems([]);
      setAppliedCoupon(null);
      setSelectedDeliverySlot(null);
    } catch (err: any) {
      setError(err.error || 'Failed to clear cart');
      throw err;
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getDeliveryFee = () => {
    const total = getTotalPrice();
    return total >= 500 ? 0 : 40;
  };

  const getDiscount = () => {
    if (!appliedCoupon) return 0;
    const total = getTotalPrice();
    if (appliedCoupon.minimumOrderValue && total < appliedCoupon.minimumOrderValue) {
      return 0;
    }
    return appliedCoupon.discountType === 'percentage'
      ? (total * appliedCoupon.discountValue) / 100
      : appliedCoupon.discountValue;
  };

  const getGrandTotal = () => {
    return getTotalPrice() + getDeliveryFee() - getDiscount();
  };

  const applyCoupon = (coupon: Coupon | null) => {
    setAppliedCoupon(coupon);
  };

  const setDeliverySlot = (slot: DeliverySlot | null) => {
    setSelectedDeliverySlot(slot);
  };

  const getOrderSummary = (): OrderSummary => {
    const itemTotal = getTotalPrice();
    const deliveryFee = getDeliveryFee();
    const discount = getDiscount();
    const grandTotal = itemTotal + deliveryFee - discount;

    return {
      itemTotal,
      deliveryFee,
      discount,
      grandTotal,
      couponApplied: appliedCoupon || undefined,
      deliverySlot: selectedDeliverySlot || undefined,
    };
  };

  const value: CartContextType = {
    cartItems,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
    getTotalPrice,
    getDeliveryFee,
    getGrandTotal,
    appliedCoupon,
    applyCoupon,
    selectedDeliverySlot,
    setDeliverySlot,
    getOrderSummary,
    minimumOrderValue,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
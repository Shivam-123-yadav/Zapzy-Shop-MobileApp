import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { wishlistAPI, WishlistItem as APIWishlistItem } from '../services/api';
import { useAuth } from './AuthContext';

export interface WishlistItem {
  id: string;
  product_id: number;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  rating?: number;
  reviews?: number;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  addToWishlist: (productId: number, product: Omit<WishlistItem, 'id'>) => Promise<void>;
  removeFromWishlist: (itemId: string) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
  clearWishlist: () => Promise<void>;
  loadWishlist: () => Promise<void>;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Convert API wishlist item to frontend format
  const convertAPIItem = (item: APIWishlistItem): WishlistItem => ({
    id: item.id,
    product_id: item.product_id,
    name: item.name,
    price: item.price,
    originalPrice: item.original_price || undefined,
    discount: item.discount_percentage || undefined,
    image: item.image,
    rating: item.rating || undefined,
    reviews: item.review_count || undefined,
  });

  // Load wishlist from backend
  const loadWishlist = async () => {
    if (authLoading || !isAuthenticated) {
      setWishlist([]);
      return;
    }
    
    try {
      setLoading(true);
      const response = await wishlistAPI.getWishlist();
      const convertedItems = response.wishlist_items.map(convertAPIItem);
      setWishlist(convertedItems);
    } catch (error) {
      console.error('Error loading wishlist:', error);
      // Keep local state if API fails
    } finally {
      setLoading(false);
    }
  };

  // Add item to wishlist
  const addToWishlist = async (productId: number, product: Omit<WishlistItem, 'id'>) => {
    try {
      // Optimistically update UI
      const tempItem: WishlistItem = {
        ...product,
        id: `temp-${Date.now()}`, // Temporary ID
        product_id: productId,
      };
      setWishlist(prev => [...prev, tempItem]);

      await wishlistAPI.addToWishlist(productId);
      // Reload to get actual data from backend
      await loadWishlist();
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      // Revert optimistic update
      setWishlist(prev => prev.filter(item => item.product_id !== productId));
      throw error;
    }
  };

  // Remove item from wishlist
  const removeFromWishlist = async (itemId: string) => {
    const itemToRemove = wishlist.find(item => item.id === itemId);
    try {
      // Optimistically update UI
      setWishlist(prev => prev.filter(item => item.id !== itemId));

      await wishlistAPI.removeFromWishlist(itemId);
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      // Revert optimistic update
      if (itemToRemove) {
        setWishlist(prev => [...prev, itemToRemove]);
      }
      throw error;
    }
  };

  // Check if product is in wishlist
  const isInWishlist = (productId: number) => {
    return wishlist.some(item => item.product_id === productId);
  };

  // Clear wishlist
  const clearWishlist = async () => {
    try {
      // Optimistically update UI
      setWishlist([]);

      await wishlistAPI.clearWishlist();
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      // Reload to get actual state
      await loadWishlist();
      throw error;
    }
  };

  // Load wishlist on mount and when auth state changes
  useEffect(() => {
    loadWishlist();
  }, [isAuthenticated, authLoading]);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        loadWishlist,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
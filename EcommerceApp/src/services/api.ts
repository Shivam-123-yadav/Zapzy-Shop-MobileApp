import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for the backend API
const API_BASE_URL = 'http://10.0.2.2:8000/api';

// Define the order API interface
interface OrderAPI {
  createOrder: (orderData: {
    delivery_address_id: number;
    delivery_slot_date: string;
    delivery_slot_time: string;
    payment_method: string;
  }) => Promise<{
    message: string;
    order_id: number;
    order_number: string;
    total: string;
    estimated_delivery: string;
  }>;
  getOrders: () => Promise<any[]>;
  getOrderDetail: (orderId: number) => Promise<any>;
  getOrderTracking: (orderId: number) => Promise<any>;
}

// Define the extended API interface
interface ExtendedAPI extends ReturnType<typeof axios.create> {
  order: OrderAPI;
}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
}) as ExtendedAPI;

// Variables to store auth tokens
let accessToken: string | null = null;
let refreshToken: string | null = null;
let isRefreshing = false;
let failedQueue: any[] = [];
let logoutCallback: (() => void) | null = null;

// Function to set logout callback
export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

// Function to process failed queue
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Function to set auth tokens
export const setAuthTokens = async (access: string | null, refresh: string | null) => {
  accessToken = access;
  refreshToken = refresh;
  if (access) {
    await AsyncStorage.setItem('access_token', access);
  } else {
    await AsyncStorage.removeItem('access_token');
  }
  if (refresh) {
    await AsyncStorage.setItem('refresh_token', refresh);
  } else {
    await AsyncStorage.removeItem('refresh_token');
  }
};

// Function to load tokens from storage
export const loadAuthTokens = async () => {
  try {
    accessToken = await AsyncStorage.getItem('access_token');
    refreshToken = await AsyncStorage.getItem('refresh_token');
    console.log('loadAuthTokens - accessToken loaded:', accessToken ? 'present' : 'null');
    console.log('loadAuthTokens - refreshToken loaded:', refreshToken ? 'present' : 'null');
  } catch (error) {
    console.error('Error loading tokens:', error);
  }
};

// Function to refresh access token
const refreshAccessToken = async () => {
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/accounts/token/refresh/`, {
      refresh: refreshToken,
    });

    const newAccessToken = response.data.access;
    accessToken = newAccessToken;
    await AsyncStorage.setItem('access_token', newAccessToken);
    return newAccessToken;
  } catch (error: any) {
    // If refresh fails, clear tokens
    console.log('Token refresh failed:', error.response?.data);
    await setAuthTokens(null, null);
    
    // If token is blacklisted or invalid, trigger logout
    if (error.response?.data?.code === 'token_not_valid' || 
        error.response?.data?.detail?.includes('blacklisted') ||
        error.response?.status === 401) {
      console.log('Token is invalid/blacklisted, triggering logout');
      if (logoutCallback) {
        logoutCallback();
      }
    }
    
    throw error;
  }
};

// Request interceptor to add auth header
api.interceptors.request.use(
  (config) => {
    console.log('API Request interceptor - accessToken:', accessToken ? 'present' : 'null');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      console.log('API Request - Added Authorization header');
    } else {
      console.log('API Request - No accessToken available');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if it's a token blacklist error
      if (error.response?.data?.code === 'token_not_valid' && 
          error.response?.data?.detail?.includes('blacklisted')) {
        console.log('Token is blacklisted, logging out user');
        if (logoutCallback) {
          logoutCallback();
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, add to queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken();
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Types for API responses
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  mobile: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  access?: string;
  refresh?: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

// Address types
export interface Address {
  id: number;
  type: string;
  name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export interface AddressListResponse {
  addresses: Address[];
}

export interface AddressCreateData {
  type?: string;
  name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string;
  is_default?: boolean;
}

export interface AddressResponse {
  message: string;
  address: Address;
}

// Product types
export interface Category {
  id: number;
  name: string;
  description: string;
  image: string;
  product_count: number;
}

export interface CategoryListResponse {
  categories: Category[];
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  discount_percentage: number;
  category: {
    id: number;
    name: string;
  };
  image: string;
  images: string[];
  stock: number;
  rating: number;
  review_count: number;
  created_at?: string;
}

export interface ProductListResponse {
  products: Product[];
  total_count: number;
  has_more: boolean;
}

export interface WishlistItem {
  id: string;
  product_id: number;
  name: string;
  price: number;
  original_price: number | null;
  discount_percentage: number;
  image: string;
  rating: number;
  review_count: number;
  added_at: string;
}

export interface WishlistResponse {
  wishlist_items: WishlistItem[];
}

export interface CartItem {
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

export interface CartResponse {
  cart_items: CartItem[];
  total_items: number;
  total_price: number;
}

// Authentication API functions
export const authAPI = {
  // Login user
  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/accounts/login/', data);
      if (response.data.access && response.data.refresh) {
        setAuthTokens(response.data.access, response.data.refresh);
      }
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Network error. Please try again.' };
    }
  },

  // Register new user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>('/accounts/register/', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Network error. Please try again.' };
    }
  },

  // Forgot password
  forgotPassword: async (data: ForgotPasswordData): Promise<ForgotPasswordResponse> => {
    try {
      const response = await api.post<ForgotPasswordResponse>('/accounts/forgot-password/', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Network error. Please try again.' };
    }
  },

  // Get user profile
  getProfile: async (): Promise<{ name: string; email: string; phone: string }> => {
    try {
      const response = await api.get('/accounts/profile/');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Network error. Please try again.' };
    }
  },

  // Update user profile
  updateProfile: async (data: { name?: string; email?: string; phone?: string }): Promise<{ message: string }> => {
    try {
      const response = await api.put('/accounts/profile/', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Network error. Please try again.' };
    }
  },

  // Logout user (if needed for future)
  logout: async (): Promise<void> => {
    try {
      await api.post('/accounts/logout/');
    } catch (error) {
      // Handle logout error silently
      console.error('Logout error:', error);
    } finally {
      setAuthTokens(null, null);
    }
  },
};

// Address API functions
export const addressAPI = {
  // Get all addresses for the user
  getAddresses: async (): Promise<AddressListResponse> => {
    try {
      const response = await api.get<AddressListResponse>('/accounts/addresses/');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Network error. Please try again.' };
    }
  },

  // Create a new address
  createAddress: async (data: AddressCreateData): Promise<AddressResponse> => {
    try {
      const response = await api.post<AddressResponse>('/accounts/addresses/', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Network error. Please try again.' };
    }
  },

  // Update an existing address
  updateAddress: async (addressId: number, data: Partial<AddressCreateData>): Promise<AddressResponse> => {
    try {
      const response = await api.put<AddressResponse>(`/accounts/addresses/${addressId}/`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Network error. Please try again.' };
    }
  },

  // Delete an address
  deleteAddress: async (addressId: number): Promise<{ message: string }> => {
    try {
      const response = await api.delete<{ message: string }>(`/accounts/addresses/${addressId}/`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Network error. Please try again.' };
    }
  },
};

// Product API functions
export const productAPI = {
  // Get all products with optional filtering
  getProducts: async (params?: {
    category?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ProductListResponse> => {
    try {
      const response = await api.get<ProductListResponse>('/products/products/', { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Network error. Please try again.' };
    }
  },

  // Get product details by ID
  getProduct: async (productId: number): Promise<{ product: Product }> => {
    try {
      const response = await api.get<{ product: Product }>(`/products/products/${productId}/`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Network error. Please try again.' };
    }
  },

  // Get all categories
  getCategories: async (): Promise<CategoryListResponse> => {
    try {
      const response = await api.get<CategoryListResponse>('/products/categories/');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Network error. Please try again.' };
    }
  },
};

// Wishlist API functions
export const wishlistAPI = {
  // Get user's wishlist
  getWishlist: async (): Promise<WishlistResponse> => {
    try {
      const response = await api.get<WishlistResponse>('/accounts/wishlist/');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Network error. Please try again.' };
    }
  },

  // Add product to wishlist
  addToWishlist: async (productId: number): Promise<{ message: string }> => {
    try {
      const response = await api.post<{ message: string }>('/accounts/wishlist/add/', {
        product_id: productId,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Network error. Please try again.' };
    }
  },

  // Remove item from wishlist
  removeFromWishlist: async (itemId: string): Promise<{ message: string }> => {
    try {
      const response = await api.delete<{ message: string }>(`/accounts/wishlist/remove/${itemId}/`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Network error. Please try again.' };
    }
  },

  // Clear wishlist
  clearWishlist: async (): Promise<{ message: string }> => {
    try {
      const response = await api.delete<{ message: string }>('/accounts/wishlist/clear/');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Network error. Please try again.' };
    }
  },
};

// Cart API functions
export const cartAPI = {
  // Get user's cart
  getCart: async (): Promise<CartResponse> => {
    try {
      const response = await api.get<CartResponse>('/accounts/cart/');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Network error. Please try again.' };
    }
  },

  // Add product to cart
  addToCart: async (productId: number, quantity: number = 1): Promise<{ message: string; cart_item_id: number; quantity: number }> => {
    try {
      const response = await api.post<{ message: string; cart_item_id: number; quantity: number }>('/accounts/cart/add/', {
        product_id: productId,
        quantity: quantity,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Network error. Please try again.' };
    }
  },

  // Update cart item quantity
  updateCartItem: async (itemId: string, quantity: number): Promise<{ message: string; quantity: number; subtotal: number }> => {
    try {
      const response = await api.put<{ message: string; quantity: number; subtotal: number }>(`/accounts/cart/update/${itemId}/`, {
        quantity: quantity,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Network error. Please try again.' };
    }
  },

  // Remove item from cart
  removeFromCart: async (itemId: string): Promise<{ message: string }> => {
    try {
      const response = await api.delete<{ message: string }>(`/accounts/cart/remove/${itemId}/`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Network error. Please try again.' };
    }
  },

  // Clear cart
  clearCart: async (): Promise<{ message: string }> => {
    try {
      const response = await api.delete<{ message: string }>('/accounts/cart/clear/');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Network error. Please try again.' };
    }
  },

  // Order APIs
  order: {
    createOrder: async (orderData: {
      delivery_address_id: number;
      delivery_slot_date: string;
      delivery_slot_time: string;
      payment_method: string;
    }): Promise<{
      message: string;
      order_id: number;
      order_number: string;
      total: string;
      estimated_delivery: string;
    }> => {
      try {
        const response = await api.post<{
          message: string;
          order_id: number;
          order_number: string;
          total: string;
          estimated_delivery: string;
        }>('/accounts/orders/create/', orderData);
        return response.data;
      } catch (error: any) {
        if (error.response?.data) {
          throw error.response.data;
        }
        throw { error: 'Network error. Please try again.' };
      }
    },

    getOrders: async (): Promise<any[]> => {
      try {
        const response = await api.get<any[]>('/accounts/orders/');
        return response.data;
      } catch (error: any) {
        if (error.response?.data) {
          throw error.response.data;
        }
        throw { error: 'Network error. Please try again.' };
      }
    },

    getOrderDetail: async (orderId: number): Promise<any> => {
      try {
        const response = await api.get<any>(`/accounts/orders/${orderId}/`);
        return response.data;
      } catch (error: any) {
        if (error.response?.data) {
          throw error.response.data;
        }
        throw { error: 'Network error. Please try again.' };
      }
    },

    getOrderTracking: async (orderId: number): Promise<any> => {
      try {
        const response = await api.get<any>(`/accounts/orders/${orderId}/tracking/`);
        return response.data;
      } catch (error: any) {
        if (error.response?.data) {
          throw error.response.data;
        }
        throw { error: 'Network error. Please try again.' };
      }
    },
  },
};

// Order API functions
export const orderAPI = {
  // Get all orders for the user
  getOrders: async (): Promise<any[]> => {
    try {
      const response = await api.get<any[]>('/accounts/orders/');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Network error. Please try again.' };
    }
  },

  // Create a new order
  createOrder: async (data: {
    delivery_address_id: number;
    delivery_slot_date: string;
    delivery_slot_time: string;
    payment_method: string;
  }): Promise<{
    message: string;
    order_id: number;
    order_number: string;
    total: string;
    estimated_delivery: string;
  }> => {
    try {
      const response = await api.post<{
        message: string;
        order_id: number;
        order_number: string;
        total: string;
        estimated_delivery: string;
      }>('/accounts/orders/create/', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Network error. Please try again.' };
    }
  },

  // Get order details
  getOrderDetail: async (orderId: number): Promise<any> => {
    try {
      const response = await api.get<any>(`/accounts/orders/${orderId}/`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Network error. Please try again.' };
    }
  },

  // Get order tracking
  getOrderTracking: async (orderId: number): Promise<any> => {
    try {
      const response = await api.get<any>(`/accounts/orders/${orderId}/tracking/`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Network error. Please try again.' };
    }
  },
};

export default api;
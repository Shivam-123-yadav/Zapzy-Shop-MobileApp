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

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrderValue?: number;
  description: string;
  validUntil: Date;
}

export interface DeliverySlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
}

export interface OrderSummary {
  itemTotal: number;
  deliveryFee: number;
  discount: number;
  grandTotal: number;
  couponApplied?: Coupon;
  deliverySlot?: DeliverySlot;
}

export interface CreateOrderData {
  items: CartItem[];
  summary: OrderSummary;
  deliveryAddress: string | DeliveryAddress;
  deliverySlot?: DeliverySlot;
  paymentMethod: string;
  estimatedDelivery: Date;
  customerName: string;
  customerPhone: string;
}

export type OrderStatus = 'placed' | 'packed' | 'out_for_delivery' | 'delivered';

export interface OrderTracking {
  status: OrderStatus;
  timestamp: Date;
  message: string;
  estimatedDelivery?: Date;
}

export interface DeliveryAddress {
  id: number;
  name: string;
  phone: string;
  address: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  summary: OrderSummary;
  deliveryAddress?: DeliveryAddress;
  deliverySlot?: DeliverySlot;
  paymentMethod: string;
  status: OrderStatus;
  tracking: OrderTracking[];
  createdAt: Date;
  estimatedDelivery: Date;
  customerName: string;
  customerPhone: string;
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Home: undefined;
  ProductDetails: { product: any };
  Cart: undefined;
  Checkout: undefined;
  OrderTracking: { orderId: string };
  Profile: undefined;
  EditProfile: undefined;
  AddressBook: undefined;
  Settings: undefined;
  HelpSupport: undefined;
  Wishlist: undefined;
  PaymentMethods: undefined;
  OrderHistory: undefined;
  Subscriptions: undefined;
};
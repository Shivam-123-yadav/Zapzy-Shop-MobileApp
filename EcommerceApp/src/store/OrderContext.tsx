import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { Order, OrderStatus, OrderTracking, CreateOrderData } from '../types';
import { orderAPI } from '../services/api';
import { useAuth } from './AuthContext';

interface OrderContextType {
  orders: Order[];
  currentOrder: Order | null;
  createOrder: (orderData: CreateOrderData, onOrderCreated?: (orderId: string) => void) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, message?: string) => void;
  getOrderById: (orderId: string) => Order | undefined;
  clearCurrentOrder: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

interface OrderProviderProps {
  children: ReactNode;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const { isAuthenticated } = useAuth();

  // Load orders from backend when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    } else {
      // Clear orders when user logs out
      setOrders([]);
      setCurrentOrder(null);
    }
  }, [isAuthenticated]);

  const loadOrders = async () => {
    try {
      const ordersData = await orderAPI.getOrders();
      const formattedOrders: Order[] = ordersData.map((order: any) => ({
        id: order.id.toString(),
        orderNumber: order.order_number,
        status: order.status as OrderStatus,
        paymentMethod: order.payment_method,
        deliveryAddress: order.delivery_address ? {
          id: order.delivery_address.id,
          name: order.delivery_address.name,
          phone: order.delivery_address.phone,
          address: `${order.delivery_address.address_line_1}, ${order.delivery_address.city}, ${order.delivery_address.state} ${order.delivery_address.postal_code}`,
        } : undefined,
        deliverySlot: {
          id: '1',
          date: order.delivery_slot_date,
          time: order.delivery_slot_time,
          available: true,
        },
        items: order.items.map((item: any) => ({
          id: item.id.toString(),
          productId: item.product_id.toString(),
          name: item.name,
          quantity: item.quantity,
          price: parseFloat(item.price),
          image: item.image,
        })),
        summary: {
          itemTotal: parseFloat(order.pricing?.subtotal || '0'),
          deliveryFee: parseFloat(order.pricing?.delivery_fee || '0'),
          discount: parseFloat(order.pricing?.discount || '0'),
          grandTotal: parseFloat(order.total),
        },
        subtotal: parseFloat(order.pricing?.subtotal || '0'),
        deliveryFee: parseFloat(order.pricing?.delivery_fee || '0'),
        discount: parseFloat(order.pricing?.discount || '0'),
        tax: parseFloat(order.pricing?.tax || '0'),
        total: parseFloat(order.total),
        tracking: order.tracking ? [{
          status: order.tracking.status as OrderStatus,
          timestamp: new Date(order.tracking.timestamp),
          message: order.tracking.message,
          estimatedDelivery: order.tracking.estimated_delivery ? new Date(order.tracking.estimated_delivery) : undefined,
        }] : [],
        createdAt: new Date(order.created_at),
        estimatedDelivery: order.tracking?.estimated_delivery ? new Date(order.tracking.estimated_delivery) : new Date(),
        customerName: order.delivery_address?.name || 'Customer',
        customerPhone: order.delivery_address?.phone || '',
      }));
      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  // Mock push notification function
  const sendPushNotification = (title: string, message: string) => {
    // In a real app, this would integrate with Firebase, OneSignal, or similar
    console.log('🔔 Push Notification:', title, message);

    // For demo purposes, show alert (in real app, use proper push notification)
    Alert.alert(title, message);
  };

  const createOrder = async (orderData: CreateOrderData, onOrderCreated?: (orderId: string) => void) => {
    try {
      // Validate delivery address
      if (!orderData.deliveryAddress || (typeof orderData.deliveryAddress === 'object' && !orderData.deliveryAddress.id)) {
        throw new Error('Please select a delivery address');
      }

      // Transform the order data for the API
      const deliveryAddressId = typeof orderData.deliveryAddress === 'object' ? orderData.deliveryAddress.id : parseInt(orderData.deliveryAddress);
      
      // Convert delivery slot date from "Today"/"Tomorrow" to actual date
      let deliveryDate = new Date().toISOString().split('T')[0]; // Default to today
      if (orderData.deliverySlot?.date === 'Tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        deliveryDate = tomorrow.toISOString().split('T')[0];
      } else if (orderData.deliverySlot?.date === 'Today') {
        deliveryDate = new Date().toISOString().split('T')[0];
      }
      
      const apiOrderData = {
        delivery_address_id: deliveryAddressId,
        delivery_slot_date: deliveryDate,
        delivery_slot_time: orderData.deliverySlot?.time || '2:00 PM - 4:00 PM',
        payment_method: orderData.paymentMethod || 'upi',
      };

      const response = await orderAPI.createOrder(apiOrderData);

      // Create a local order object for the frontend
      const newOrder: Order = {
        id: response.order_id.toString(),
        orderNumber: response.order_number,
        items: orderData.items,
        summary: orderData.summary,
        deliveryAddress: typeof orderData.deliveryAddress === 'string' ? {
          id: 1,
          name: orderData.customerName,
          phone: orderData.customerPhone,
          address: orderData.deliveryAddress,
        } : orderData.deliveryAddress,
        deliverySlot: orderData.deliverySlot,
        paymentMethod: orderData.paymentMethod,
        status: 'placed',
        tracking: [{
          status: 'placed',
          timestamp: new Date(),
          message: 'Order placed successfully',
          estimatedDelivery: new Date(response.estimated_delivery),
        }],
        createdAt: new Date(),
        estimatedDelivery: new Date(response.estimated_delivery),
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
      };

      setOrders(prev => [newOrder, ...prev]);
      setCurrentOrder(newOrder);

      // Send initial notification
      sendPushNotification(
        'Order Placed! 🎉',
        `Your order ${response.order_number} has been placed successfully.`
      );

      // Call the callback if provided
      if (onOrderCreated) {
        onOrderCreated(newOrder.id);
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      Alert.alert('Error', error.error || 'Failed to create order');
      throw error;
    }
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, customMessage?: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        const statusMessages = {
          placed: 'Order placed successfully',
          packed: 'Your order has been packed and is ready for delivery',
          out_for_delivery: 'Your order is out for delivery',
          delivered: 'Your order has been delivered successfully',
        };

        const message = customMessage || statusMessages[status];

        const newTracking: OrderTracking = {
          status,
          timestamp: new Date(),
          message,
          estimatedDelivery: status === 'delivered' ? undefined : order.estimatedDelivery,
        };

        const updatedOrder = {
          ...order,
          status,
          tracking: [...order.tracking, newTracking],
        };

        // Send push notification for status update
        const statusTitles = {
          placed: 'Order Placed',
          packed: 'Order Packed! 📦',
          out_for_delivery: 'Out for Delivery! 🚚',
          delivered: 'Order Delivered! ✅',
        };

        sendPushNotification(
          statusTitles[status],
          message
        );

        // Update current order if it's the one being updated
        if (currentOrder?.id === orderId) {
          setCurrentOrder(updatedOrder);
        }

        return updatedOrder;
      }
      return order;
    }));
  };

  const getOrderById = (orderId: string) => {
    return orders.find(order => order.id === orderId);
  };

  const clearCurrentOrder = () => {
    setCurrentOrder(null);
  };

  // Mock order status updates for demo (in real app, this would come from backend)
  useEffect(() => {
    if (orders.length > 0) {
      const interval = setInterval(() => {
        orders.forEach(order => {
          const timeSinceOrder = Date.now() - order.createdAt.getTime();
          const minutesSinceOrder = timeSinceOrder / (1000 * 60);

          if (order.status === 'placed' && minutesSinceOrder > 5) {
            updateOrderStatus(order.id, 'packed');
          } else if (order.status === 'packed' && minutesSinceOrder > 10) {
            updateOrderStatus(order.id, 'out_for_delivery');
          } else if (order.status === 'out_for_delivery' && minutesSinceOrder > 15) {
            updateOrderStatus(order.id, 'delivered');
          }
        });
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]); // Removed updateOrderStatus from dependencies to avoid infinite loop

  return (
    <OrderContext.Provider value={{
      orders,
      currentOrder,
      createOrder,
      updateOrderStatus,
      getOrderById,
      clearCurrentOrder,
    }}>
      {children}
    </OrderContext.Provider>
  );
};
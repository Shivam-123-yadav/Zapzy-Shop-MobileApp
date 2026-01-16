import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Header } from '../components';
import { useOrder } from '../store/OrderContext';
import { OrderStatus } from '../types';

type RootStackParamList = {
  Home: undefined;
  Cart: undefined;
  Checkout: undefined;
  OrderTracking: { orderId: string };
  Profile: undefined;
};

type OrderTrackingScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'OrderTracking'
>;

type OrderTrackingScreenRouteProp = RouteProp<
  RootStackParamList,
  'OrderTracking'
>;

const OrderTrackingScreen: React.FC = () => {
  const navigation = useNavigation<OrderTrackingScreenNavigationProp>();
  const route = useRoute<OrderTrackingScreenRouteProp>();
  const { orderId } = route.params;
  const { getOrderById, updateOrderStatus } = useOrder();

  const order = getOrderById(orderId);

  if (!order) {
    return (
      <View style={styles.container}>
        <Header title="Order Tracking" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'placed': return '📋';
      case 'packed': return '📦';
      case 'out_for_delivery': return '🚚';
      case 'delivered': return '✅';
      default: return '⏳';
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'placed': return '#007bff';
      case 'packed': return '#28a745';
      case 'out_for_delivery': return '#ffc107';
      case 'delivered': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  const getStatusTitle = (status: OrderStatus) => {
    switch (status) {
      case 'placed': return 'Order Placed';
      case 'packed': return 'Order Packed';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      default: return 'Processing';
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEstimatedDelivery = () => {
    if (order.status === 'delivered') {
      return 'Delivered';
    }
    return `Estimated: ${formatDate(order.estimatedDelivery)}`;
  };

  const renderTrackingItem = ({ item, index }: { item: any; index: number }) => {
    const isCompleted = index < order.tracking.length;
    const trackingItem = order.tracking[index] || item;

    return (
      <View style={styles.trackingItem}>
        <View style={styles.trackingLeft}>
          <View style={[
            styles.statusIcon,
            { backgroundColor: isCompleted ? getStatusColor(trackingItem.status) : '#f0f0f0' },
            isCompleted && styles.statusIconActive
          ]}>
            <Text style={styles.iconText}>
              {isCompleted ? getStatusIcon(trackingItem.status) : '⏳'}
            </Text>
          </View>
          {index < 3 && (
            <View style={[
              styles.connector,
              { backgroundColor: isCompleted && index < order.tracking.length - 1 ? '#28a745' : '#e9ecef' }
            ]} />
          )}
        </View>
        <View style={styles.trackingRight}>
          <Text style={[
            styles.statusTitle,
            { color: isCompleted ? '#1a1a1a' : '#999' }
          ]}>
            {getStatusTitle(trackingItem.status)}
          </Text>
          {isCompleted && (
            <>
              <Text style={styles.statusMessage}>{trackingItem.message}</Text>
              <Text style={styles.statusTime}>{formatDate(trackingItem.timestamp)}</Text>
            </>
          )}
          {trackingItem.estimatedDelivery && isCompleted && (
            <Text style={styles.estimatedTime}>
              {getEstimatedDelivery()}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderOrderItem = ({ item }: { item: any }) => (
    <View style={styles.orderItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
      </View>
      <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
    </View>
  );

  const handleStatusUpdate = () => {
    const statuses: OrderStatus[] = ['placed', 'packed', 'out_for_delivery', 'delivered'];
    const currentIndex = statuses.indexOf(order.status);
    if (currentIndex < statuses.length - 1) {
      const nextStatus = statuses[currentIndex + 1];
      updateOrderStatus(order.id, nextStatus);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Order Tracking" />

      <FlatList
        data={[
          { type: 'header', order },
          { type: 'tracking', tracking: order.tracking },
          { type: 'items', items: order.items },
          { type: 'summary', summary: order.summary },
        ]}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        renderItem={({ item }: { item: any }) => {
          switch (item.type) {
            case 'header':
              return (
                <View style={styles.headerSection}>
                  <View style={styles.headerTop}>
                    <Text style={styles.orderId}>Order #{item.order.id}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(item.order.status) + '15' }
                    ]}>
                      <Text style={[styles.statusBadgeText, { color: getStatusColor(item.order.status) }]}>
                        {getStatusIcon(item.order.status)} {getStatusTitle(item.order.status)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.deliveryCard}>
                    <Text style={styles.deliveryLabel}>Estimated Delivery</Text>
                    <Text style={styles.deliveryInfo}>{getEstimatedDelivery()}</Text>
                  </View>
                </View>
              );

            case 'tracking':
              return (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Order Progress</Text>
                  <View style={styles.trackingContainer}>
                    <FlatList
                      data={[
                        { status: 'placed' },
                        { status: 'packed' },
                        { status: 'out_for_delivery' },
                        { status: 'delivered' },
                      ]}
                      keyExtractor={(trackingItem) => trackingItem.status}
                      renderItem={renderTrackingItem}
                      showsVerticalScrollIndicator={false}
                    />
                  </View>
                </View>
              );

            case 'items':
              return (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Order Items</Text>
                  <View style={styles.itemsContainer}>
                    <FlatList
                      data={item.items}
                      keyExtractor={(orderItem) => orderItem.id}
                      renderItem={renderOrderItem}
                      showsVerticalScrollIndicator={false}
                    />
                  </View>
                </View>
              );

            case 'summary':
              return (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Payment Summary</Text>
                  <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Item Total</Text>
                      <Text style={styles.summaryValue}>₹{item.summary.itemTotal}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Delivery Fee</Text>
                      <Text style={styles.summaryValue}>₹{item.summary.deliveryFee}</Text>
                    </View>
                    {item.summary.discount > 0 && (
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Discount</Text>
                        <Text style={[styles.summaryValue, styles.discountText]}>-₹{item.summary.discount}</Text>
                      </View>
                    )}
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                      <Text style={styles.totalLabel}>Grand Total</Text>
                      <Text style={styles.totalValue}>₹{item.summary.grandTotal}</Text>
                    </View>
                  </View>

                  {order.status !== 'delivered' && (
                    <TouchableOpacity
                      style={styles.updateButton}
                      onPress={handleStatusUpdate}
                    >
                      <Text style={styles.updateButtonText}>
                        Update Status (Demo)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );

            default:
              return null;
          }
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    paddingBottom: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    fontWeight: '500',
  },
  backButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 12,
    borderRadius: 0,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deliveryCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  deliveryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  deliveryInfo: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  trackingContainer: {
    paddingVertical: 8,
  },
  trackingItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  trackingLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  statusIconActive: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  iconText: {
    fontSize: 20,
  },
  connector: {
    width: 3,
    height: 36,
    marginTop: 4,
    borderRadius: 2,
  },
  trackingRight: {
    flex: 1,
    paddingTop: 4,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  statusTime: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  estimatedTime: {
    fontSize: 12,
    color: '#007bff',
    marginTop: 6,
    fontWeight: '600',
  },
  itemsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 4,
    fontWeight: '500',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    padding: 18,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  discountText: {
    color: '#28a745',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007bff',
  },
  updateButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    elevation: 2,
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default OrderTrackingScreen;
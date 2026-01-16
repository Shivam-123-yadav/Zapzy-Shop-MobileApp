import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../store/AuthContext';
import { useCart } from '../store/CartContext';
import { useOrder } from '../store/OrderContext';
import { Coupon, DeliverySlot } from '../types';
import { addressAPI, Address } from '../services/api';

type RootStackParamList = {
  Home: undefined;
  ProductDetails: { product: any };
  Cart: undefined;
  Checkout: undefined;
  OrderTracking: { orderId: string };
  Profile: undefined;
  AddressBook: undefined;
};

type CheckoutScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Checkout'
>;

const CheckoutScreen = () => {
  const navigation = useNavigation<CheckoutScreenNavigationProp>();
  const {
    cartItems,
    getOrderSummary,
    appliedCoupon,
    applyCoupon,
    selectedDeliverySlot,
    setDeliverySlot,
    minimumOrderValue,
    clearCart,
  } = useCart();
  const { createOrder } = useOrder();
  const { isAuthenticated, loading: authLoading, logout } = useAuth();

  const [couponCode, setCouponCode] = useState('');
  const [showDeliverySlots, setShowDeliverySlots] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      const fetchAddresses = async () => {
        // Wait for authentication to be ready
        if (authLoading) {
          console.log('CheckoutScreen - Auth still loading, skipping address fetch');
          return;
        }

        if (!isAuthenticated) {
          console.log('CheckoutScreen - User not authenticated, skipping address fetch');
          return;
        }

        try {
          console.log('CheckoutScreen - Fetching addresses...');
          const response = await addressAPI.getAddresses();
          console.log('Fetched addresses:', response.addresses);
          setAddresses(response.addresses);
          const defaultAddr = response.addresses.find(addr => addr.is_default) || response.addresses[0];
          setSelectedAddress(defaultAddr || null);
          console.log('Selected address:', defaultAddr);
          
          // If no addresses, redirect to address book
          if (!response.addresses || response.addresses.length === 0) {
            Alert.alert(
              'No Delivery Address',
              'Please add a delivery address to place an order.',
              [
                {
                  text: 'Add Address',
                  onPress: () => navigation.navigate('AddressBook'),
                },
                {
                  text: 'Cancel',
                  onPress: () => navigation.goBack(),
                  style: 'cancel',
                },
              ]
            );
          }
        } catch (error: any) {
          console.error('Error fetching addresses:', error);
          
          // Check if it's an authentication error
          if (error.response?.status === 401 || 
              error.response?.data?.code === 'token_not_valid' ||
              error.response?.data?.detail?.includes('blacklisted')) {
            console.log('Authentication error, redirecting to login');
            Alert.alert(
              'Session Expired',
              'Your session has expired. Please log in again.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // Trigger logout and navigation to login
                    logout();
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Home' as any }], // Navigate to Home which will show Login due to auth state
                    });
                  },
                },
              ]
            );
          } else {
            Alert.alert('Error', 'Failed to load addresses. Please try again.');
          }
        }
      };
      fetchAddresses();
    }, [authLoading, isAuthenticated])
  );

  const orderSummary = getOrderSummary();

  const availableCoupons: Coupon[] = [
    {
      id: '1',
      code: 'SAVE10',
      discountType: 'percentage',
      discountValue: 10,
      minimumOrderValue: 300,
      description: '10% off on orders above ₹300',
      validUntil: new Date('2026-12-31'),
    },
    {
      id: '2',
      code: 'FLAT50',
      discountType: 'fixed',
      discountValue: 50,
      minimumOrderValue: 400,
      description: 'Flat ₹50 off on orders above ₹400',
      validUntil: new Date('2026-12-31'),
    },
  ];

  const deliverySlots: DeliverySlot[] = [
    { id: '1', date: 'Today', time: '2:00 PM - 4:00 PM', available: true },
    { id: '2', date: 'Today', time: '4:00 PM - 6:00 PM', available: true },
    { id: '3', date: 'Today', time: '6:00 PM - 8:00 PM', available: false },
    { id: '4', date: 'Tomorrow', time: '10:00 AM - 12:00 PM', available: true },
    { id: '5', date: 'Tomorrow', time: '2:00 PM - 4:00 PM', available: true },
    { id: '6', date: 'Tomorrow', time: '4:00 PM - 6:00 PM', available: true },
  ];

  const sections = [
    {
      title: 'Order Items',
      data: [{ type: 'cartItems', items: cartItems }],
      renderItem: () => (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛍️ Order Items ({cartItems.length})</Text>
          <View style={styles.itemsContainer}>
            {cartItems.map((item) => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.itemImageContainer}>
                  <Image
                    source={{ uri: item.image }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View style={styles.quantityBadge}>
                    <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                  </View>
                </View>
                <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
              </View>
            ))}
          </View>
        </View>
      ),
    },
    {
      title: 'Delivery Address',
      data: [{ type: 'address' }],
      renderItem: () => (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Delivery Address</Text>
          <View style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <Text style={styles.addressLabel}>{selectedAddress?.type || 'Home'}</Text>
            </View>
            <Text style={styles.addressText}>
              {selectedAddress ? `${selectedAddress.address_line_1}${selectedAddress.address_line_2 ? ', ' + selectedAddress.address_line_2 : ''}\n${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.postal_code}\nPhone: ${selectedAddress.phone}` : 'No address selected'}
            </Text>
            <TouchableOpacity style={styles.changeButton} onPress={() => navigation.navigate('AddressBook')}>
              <Text style={styles.changeButtonText}>Change Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      ),
    },
    {
      title: 'Delivery Time Slot',
      data: [{ type: 'deliverySlot' }],
      renderItem: () => (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏰ Delivery Time Slot</Text>
          <TouchableOpacity
            style={styles.deliverySlotSelector}
            onPress={() => setShowDeliverySlots(!showDeliverySlots)}
          >
            <View style={styles.slotSelectorContent}>
              <Text style={styles.slotSelectorIcon}>📅</Text>
              <Text style={styles.deliverySlotText}>
                {selectedDeliverySlot
                  ? `${selectedDeliverySlot.date} - ${selectedDeliverySlot.time}`
                  : 'Select delivery time slot'
                }
              </Text>
            </View>
            <Text style={styles.dropdownIcon}>{showDeliverySlots ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showDeliverySlots && (
            <View style={styles.slotsContainer}>
              {deliverySlots.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.slotItem,
                    !item.available && styles.slotUnavailable,
                    selectedDeliverySlot?.id === item.id && styles.slotSelected,
                  ]}
                  onPress={() => item.available && selectDeliverySlot(item)}
                  disabled={!item.available}
                >
                  <View style={styles.slotContent}>
                    <Text style={[
                      styles.slotDate,
                      !item.available && styles.slotTextUnavailable,
                      selectedDeliverySlot?.id === item.id && styles.slotTextSelected,
                    ]}>
                      {item.date}
                    </Text>
                    <Text style={[
                      styles.slotTime,
                      !item.available && styles.slotTextUnavailable,
                      selectedDeliverySlot?.id === item.id && styles.slotTextSelected,
                    ]}>
                      {item.time}
                    </Text>
                  </View>
                  {!item.available ? (
                    <View style={styles.unavailableBadge}>
                      <Text style={styles.unavailableText}>Unavailable</Text>
                    </View>
                  ) : selectedDeliverySlot?.id === item.id && (
                    <Text style={styles.selectedIcon}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ),
    },
    {
      title: 'Coupon',
      data: [{ type: 'coupon' }],
      renderItem: () => (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎟️ Apply Coupon</Text>
          {appliedCoupon ? (
            <View style={styles.appliedCouponCard}>
              <View style={styles.couponIcon}>
                <Text style={styles.couponIconText}>🎉</Text>
              </View>
              <View style={styles.couponInfo}>
                <Text style={styles.couponCode}>{appliedCoupon.code}</Text>
                <Text style={styles.couponDescription}>{appliedCoupon.description}</Text>
              </View>
              <TouchableOpacity style={styles.removeCouponButton} onPress={removeCoupon}>
                <Text style={styles.removeCouponText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponInputContainer}>
              <TextInput
                style={styles.couponInput}
                placeholder="Enter coupon code"
                placeholderTextColor="#999"
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.applyButton} onPress={applyCouponCode}>
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ),
    },
    {
      title: 'Payment Method',
      data: [{ type: 'payment' }],
      renderItem: () => (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Payment Method</Text>
          <View style={styles.paymentMethods}>
            <TouchableOpacity
              style={[
                styles.paymentMethod,
                selectedPaymentMethod === 'upi' && styles.paymentMethodSelected,
              ]}
              onPress={() => setSelectedPaymentMethod('upi')}
            >
              <View style={styles.paymentMethodContent}>
                <Text style={styles.paymentMethodIcon}>📱</Text>
                <View style={styles.paymentMethodInfo}>
                  <Text style={[
                    styles.paymentMethodText,
                    selectedPaymentMethod === 'upi' && styles.paymentMethodTextSelected,
                  ]}>
                    UPI
                  </Text>
                  <Text style={styles.paymentSubtext}>Google Pay, PhonePe, Paytm</Text>
                </View>
              </View>
              {selectedPaymentMethod === 'upi' && (
                <Text style={styles.selectedCheckmark}>✓</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentMethod,
                selectedPaymentMethod === 'netbanking' && styles.paymentMethodSelected,
              ]}
              onPress={() => setSelectedPaymentMethod('netbanking')}
            >
              <View style={styles.paymentMethodContent}>
                <Text style={styles.paymentMethodIcon}>🏦</Text>
                <View style={styles.paymentMethodInfo}>
                  <Text style={[
                    styles.paymentMethodText,
                    selectedPaymentMethod === 'netbanking' && styles.paymentMethodTextSelected,
                  ]}>
                    Net Banking
                  </Text>
                </View>
              </View>
              {selectedPaymentMethod === 'netbanking' && (
                <Text style={styles.selectedCheckmark}>✓</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentMethod,
                selectedPaymentMethod === 'wallet' && styles.paymentMethodSelected,
              ]}
              onPress={() => setSelectedPaymentMethod('wallet')}
            >
              <View style={styles.paymentMethodContent}>
                <Text style={styles.paymentMethodIcon}>👛</Text>
                <View style={styles.paymentMethodInfo}>
                  <Text style={[
                    styles.paymentMethodText,
                    selectedPaymentMethod === 'wallet' && styles.paymentMethodTextSelected,
                  ]}>
                    Digital Wallet
                  </Text>
                </View>
              </View>
              {selectedPaymentMethod === 'wallet' && (
                <Text style={styles.selectedCheckmark}>✓</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ),
    },
    {
      title: 'Order Summary',
      data: [{ type: 'summary' }],
      renderItem: () => (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Item Total</Text>
              <Text style={styles.summaryValue}>₹{orderSummary.itemTotal}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={[
                styles.summaryValue,
                orderSummary.deliveryFee === 0 && styles.freeDeliveryValue
              ]}>
                {orderSummary.deliveryFee === 0 ? 'FREE 🎉' : `₹${orderSummary.deliveryFee}`}
              </Text>
            </View>

            {orderSummary.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.discountLabel}>Discount ({appliedCoupon?.code})</Text>
                <Text style={styles.discountValue}>-₹{orderSummary.discount}</Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalValue}>₹{orderSummary.grandTotal}</Text>
            </View>
          </View>
        </View>
      ),
    },
  ];

  const applyCouponCode = () => {
    const coupon = availableCoupons.find(c => c.code.toLowerCase() === couponCode.toLowerCase());
    if (coupon) {
      if (orderSummary.itemTotal < (coupon.minimumOrderValue || 0)) {
        Alert.alert('Invalid Coupon', `Minimum order value for this coupon is ₹${coupon.minimumOrderValue}`);
        return;
      }
      applyCoupon(coupon);
      setCouponCode('');
      Alert.alert('Success', 'Coupon applied successfully!');
    } else {
      Alert.alert('Invalid Coupon', 'Please enter a valid coupon code');
    }
  };

  const removeCoupon = () => {
    applyCoupon(null);
  };

  const selectDeliverySlot = (slot: DeliverySlot) => {
    setDeliverySlot(slot);
    setShowDeliverySlots(false);
  };

  const handlePayment = async () => {
    if (orderSummary.itemTotal < minimumOrderValue) {
      Alert.alert('Minimum Order Value', `Please add items worth at least ₹${minimumOrderValue} to proceed`);
      return;
    }

    if (!selectedDeliverySlot) {
      Alert.alert('Delivery Slot Required', 'Please select a delivery time slot');
      return;
    }

    if (!selectedAddress) {
      Alert.alert('Delivery Address Required', 'Please select a delivery address');
      return;
    }

    const paymentMethodNames = {
      upi: 'UPI',
      netbanking: 'Net Banking',
      wallet: 'Digital Wallet',
    };

    // Create order using the backend API
    try {
      await createOrder({
        items: cartItems,
        summary: orderSummary,
        deliveryAddress: {
          id: selectedAddress.id,
          name: selectedAddress.name,
          phone: selectedAddress.phone,
          address: `${selectedAddress.address_line_1}${selectedAddress.address_line_2 ? ', ' + selectedAddress.address_line_2 : ''}, ${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.postal_code}`,
        },
        deliverySlot: selectedDeliverySlot,
        paymentMethod: selectedPaymentMethod,
        estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000),
        customerName: selectedAddress.name,
        customerPhone: selectedAddress.phone,
      }, (orderId) => {
        clearCart();
        navigation.navigate('OrderTracking', { orderId });
      });

      Alert.alert(
        'Payment Successful',
        `Your order has been placed successfully using ${paymentMethodNames[selectedPaymentMethod as keyof typeof paymentMethodNames]}!`,
        [
          {
            text: 'Track Order',
            onPress: () => {},
          },
        ]
      );
    } catch (error) {
      // Error is already handled in the createOrder function
      console.error('Order creation failed:', error);
    }
  };

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If not authenticated, this shouldn't happen since AppNavigator handles this
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Please log in to continue</Text>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' as any }] })}
        >
          <Text style={styles.loginButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButtonContainer}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerRight}>
          <Text style={styles.secureIcon}>🔒</Text>
        </View>
      </View>

      <FlatList
        data={sections}
        keyExtractor={(item, index) => `${item.title}-${index}`}
        renderItem={({ item }) => item.renderItem()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        style={styles.flatList}
      />

      {orderSummary.itemTotal < minimumOrderValue && (
        <View style={styles.minimumOrderWarning}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Add ₹{minimumOrderValue - orderSummary.itemTotal} more to proceed
          </Text>
        </View>
      )}

      <View style={styles.paymentContainer}>
        <TouchableOpacity
          style={[
            styles.paymentButton,
            (orderSummary.itemTotal < minimumOrderValue || !selectedDeliverySlot || !selectedAddress) && styles.paymentButtonDisabled,
          ]}
          onPress={handlePayment}
          disabled={orderSummary.itemTotal < minimumOrderValue || !selectedDeliverySlot || !selectedAddress}
          activeOpacity={0.8}
        >
          <View style={styles.paymentButtonContent}>
            <View>
              <Text style={[
                styles.paymentButtonAmount,
                (orderSummary.itemTotal < minimumOrderValue || !selectedDeliverySlot || !selectedAddress) && styles.paymentButtonTextDisabled,
              ]}>
                ₹{orderSummary.grandTotal}
              </Text>
              <Text style={[
                styles.paymentButtonLabel,
                (orderSummary.itemTotal < minimumOrderValue || !selectedDeliverySlot || !selectedAddress) && styles.paymentButtonTextDisabled,
              ]}>
                TOTAL AMOUNT
              </Text>
            </View>
            <View style={styles.paymentButtonRight}>
              <Text style={[
                styles.paymentButtonText,
                (orderSummary.itemTotal < minimumOrderValue || !selectedDeliverySlot || !selectedAddress) && styles.paymentButtonTextDisabled,
              ]}>
                Place Order
              </Text>
              <Text style={[
                styles.paymentButtonArrow,
                (orderSummary.itemTotal < minimumOrderValue || !selectedDeliverySlot || !selectedAddress) && styles.paymentButtonTextDisabled,
              ]}>
                →
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CheckoutScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  backButton: {
    fontSize: 22,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: 0.3,
  },
  headerRight: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secureIcon: {
    fontSize: 20,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 140,
  },
  flatList: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  itemsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f8f8f8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  itemImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  itemUnit: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  quantityBadge: {
    backgroundColor: '#f8f8f8',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
    fontWeight: '700',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: 0.2,
  },
  addressCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f8f8f8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ff7e8b',
    backgroundColor: '#fff0f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    letterSpacing: 0.3,
  },
  addressText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    fontWeight: '500',
  },
  changeButton: {
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ff7e8b',
    borderRadius: 10,
    shadowColor: '#ff7e8b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  deliverySlotSelector: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f8f8f8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  slotSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  slotSelectorIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  deliverySlotText: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '600',
    flex: 1,
  },
  dropdownIcon: {
    fontSize: 16,
    color: '#666',
    fontWeight: '700',
  },
  slotsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#f8f8f8',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  slotItem: {
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotSelected: {
    backgroundColor: '#fff0f2',
  },
  slotUnavailable: {
    backgroundColor: '#f8f8f8',
  },
  slotContent: {
    flex: 1,
  },
  slotDate: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  slotTime: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  slotTextSelected: {
    color: '#ff7e8b',
  },
  slotTextUnavailable: {
    color: '#999',
  },
  unavailableBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unavailableText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  selectedIcon: {
    fontSize: 20,
    color: '#ff7e8b',
    fontWeight: '700',
  },
  couponInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  couponInput: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  applyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  appliedCouponCard: {
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  couponIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  couponIconText: {
    fontSize: 24,
  },
  couponInfo: {
    flex: 1,
  },
  couponCode: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2e7d32',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  couponDescription: {
    fontSize: 13,
    color: '#2e7d32',
    fontWeight: '600',
  },
  removeCouponButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ff4757',
  },
  removeCouponText: {
    fontSize: 18,
    color: '#ff4757',
    fontWeight: '700',
  },
  paymentMethods: {
    gap: 12,
  },
  paymentMethod: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  paymentMethodSelected: {
    borderColor: '#ff7e8b',
    backgroundColor: '#fff0f2',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  paymentMethodTextSelected: {
    color: '#ff7e8b',
  },
  paymentSubtext: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  selectedCheckmark: {
    fontSize: 20,
    color: '#ff7e8b',
    fontWeight: '800',
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f8f8f8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '700',
  },
  freeDeliveryValue: {
    color: '#4CAF50',
    fontWeight: '800',
  },
  discountLabel: {
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: '700',
  },
  discountValue: {
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  totalRow: {
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: 0.3,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ff7e8b',
    letterSpacing: 0.3,
  },
  minimumOrderWarning: {
    backgroundColor: '#fff3cd',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ffeaa7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  paymentContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  paymentButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  paymentButtonDisabled: {
    backgroundColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  paymentButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentButtonAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  paymentButtonLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  paymentButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.3,
  },
  paymentButtonArrow: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  paymentButtonTextDisabled: {
    color: '#999',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
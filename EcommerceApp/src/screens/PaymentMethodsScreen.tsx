import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Home: undefined;
  ProductDetails: { product: any };
  Cart: undefined;
  Profile: undefined;
  EditProfile: undefined;
  AddressBook: undefined;
  Settings: undefined;
  HelpSupport: undefined;
  Wishlist: undefined;
  PaymentMethods: undefined;
  OrderTracking: { orderId: string };
  OrderHistory: undefined;
  Subscriptions: undefined;
};

type PaymentMethodsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PaymentMethods'
>;

interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'netbanking' | 'wallet';
  name: string;
  details: string;
  isDefault: boolean;
  expiryDate?: string;
  cardNumber?: string;
}

const PaymentMethodsScreen = () => {
  const navigation = useNavigation<PaymentMethodsScreenNavigationProp>();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      name: 'HDFC Credit Card',
      details: '**** **** **** 1234',
      cardNumber: '4111111111111234',
      expiryDate: '12/26',
      isDefault: true,
    },
    {
      id: '2',
      type: 'upi',
      name: 'Google Pay UPI',
      details: 'user@okhdfcbank',
      isDefault: false,
    },
    {
      id: '3',
      type: 'wallet',
      name: 'Paytm Wallet',
      details: 'Balance: ₹1,250',
      isDefault: false,
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedType, setSelectedType] = useState<'card' | 'upi' | 'netbanking' | 'wallet'>('card');

  const handleAddPaymentMethod = () => {
    setSelectedType('card');
    setShowAddForm(true);
  };

  const handleAddCard = () => {
    Alert.alert(
      'Add Card',
      'Card addition feature coming soon! For now, you can use existing saved cards.',
      [{ text: 'OK' }]
    );
    setShowAddForm(false);
  };

  const handleAddUPI = () => {
    Alert.alert(
      'Add UPI ID',
      'UPI ID addition feature coming soon! For now, you can use existing UPI IDs.',
      [{ text: 'OK' }]
    );
    setShowAddForm(false);
  };

  const handleAddNetBanking = () => {
    Alert.alert(
      'Add Net Banking',
      'Net banking addition feature coming soon! For now, you can use existing methods.',
      [{ text: 'OK' }]
    );
    setShowAddForm(false);
  };

  const handleAddWallet = () => {
    Alert.alert(
      'Add Wallet',
      'Wallet addition feature coming soon! For now, you can use existing wallets.',
      [{ text: 'OK' }]
    );
    setShowAddForm(false);
  };

  const handleDeletePaymentMethod = (methodId: string, methodName: string) => {
    Alert.alert(
      'Delete Payment Method',
      `Remove "${methodName}" from your saved payment methods?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
          }
        }
      ]
    );
  };

  const handleSetDefault = (methodId: string) => {
    setPaymentMethods(prev => prev.map(method => ({
      ...method,
      isDefault: method.id === methodId
    })));
  };

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'card': return '💳';
      case 'upi': return '📱';
      case 'netbanking': return '🏦';
      case 'wallet': return '👛';
      default: return '💳';
    }
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'card': return '#ff7e8b';
      case 'upi': return '#25D366';
      case 'netbanking': return '#007bff';
      case 'wallet': return '#FF6B6B';
      default: return '#ff7e8b';
    }
  };

  const renderPaymentMethod = ({ item }: { item: PaymentMethod }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentType}>
          <View style={[styles.iconContainer, { backgroundColor: getPaymentTypeColor(item.type) }]}>
            <Text style={styles.paymentIcon}>{getPaymentIcon(item.type)}</Text>
          </View>
          <View>
            <Text style={styles.paymentName}>{item.name}</Text>
            <Text style={styles.paymentDetails}>{item.details}</Text>
          </View>
        </View>
        <View style={styles.paymentActions}>
          {item.isDefault && <Text style={styles.defaultBadge}>DEFAULT</Text>}
          <TouchableOpacity onPress={() => handleDeletePaymentMethod(item.id, item.name)}>
            <Text style={styles.deleteButton}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {item.expiryDate && (
        <View style={styles.cardDetails}>
          <Text style={styles.expiryText}>Expires: {item.expiryDate}</Text>
        </View>
      )}

      {!item.isDefault && (
        <TouchableOpacity
          style={styles.setDefaultButton}
          onPress={() => handleSetDefault(item.id)}
        >
          <Text style={styles.setDefaultText}>Set as Default</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAddForm = () => {
    if (!showAddForm) return null;

    return (
      <View style={styles.addForm}>
        <Text style={styles.formTitle}>Add Payment Method</Text>

        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, selectedType === 'card' && styles.typeButtonActive]}
            onPress={() => setSelectedType('card')}
          >
            <Text style={[styles.typeButtonText, selectedType === 'card' && styles.typeButtonTextActive]}>
              💳 Card
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeButton, selectedType === 'upi' && styles.typeButtonActive]}
            onPress={() => setSelectedType('upi')}
          >
            <Text style={[styles.typeButtonText, selectedType === 'upi' && styles.typeButtonTextActive]}>
              📱 UPI
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeButton, selectedType === 'netbanking' && styles.typeButtonActive]}
            onPress={() => setSelectedType('netbanking')}
          >
            <Text style={[styles.typeButtonText, selectedType === 'netbanking' && styles.typeButtonTextActive]}>
              🏦 Net Banking
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeButton, selectedType === 'wallet' && styles.typeButtonActive]}
            onPress={() => setSelectedType('wallet')}
          >
            <Text style={[styles.typeButtonText, selectedType === 'wallet' && styles.typeButtonTextActive]}>
              👛 Wallet
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowAddForm(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              switch (selectedType) {
                case 'card': handleAddCard(); break;
                case 'upi': handleAddUPI(); break;
                case 'netbanking': handleAddNetBanking(); break;
                case 'wallet': handleAddWallet(); break;
              }
            }}
          >
            <Text style={styles.addButtonText}>Add {selectedType.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>💳</Text>
      <Text style={styles.emptyTitle}>No payment methods saved</Text>
      <Text style={styles.emptySubtitle}>
        Add your payment methods to make checkout faster and easier.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Payment Methods</Text>
      </View>

      {renderAddForm()}

      <FlatList
        data={paymentMethods}
        renderItem={renderPaymentMethod}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.paymentList}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {!showAddForm && (
        <TouchableOpacity style={styles.addPaymentButton} onPress={handleAddPaymentMethod}>
          <Text style={styles.addPaymentText}>+ Add Payment Method</Text>
        </TouchableOpacity>
      )}

      <View style={styles.securityNote}>
        <Text style={styles.securityText}>
          🔒 Your payment information is encrypted and secure
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#ff7e8b',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  paymentList: {
    padding: 20,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  paymentType: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentIcon: {
    fontSize: 18,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  paymentDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  paymentActions: {
    alignItems: 'flex-end',
  },
  defaultBadge: {
    backgroundColor: '#ff7e8b',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 8,
  },
  deleteButton: {
    fontSize: 18,
  },
  cardDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  expiryText: {
    fontSize: 14,
    color: '#666',
  },
  setDefaultButton: {
    marginTop: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ff7e8b',
    borderRadius: 8,
    alignItems: 'center',
  },
  setDefaultText: {
    color: '#ff7e8b',
    fontSize: 14,
    fontWeight: '600',
  },
  addPaymentButton: {
    backgroundColor: '#ff7e8b',
    margin: 20,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  addPaymentText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  addForm: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  typeButtonActive: {
    backgroundColor: '#ff7e8b',
    borderColor: '#ff7e8b',
  },
  typeButtonText: {
    fontSize: 12,
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#ff7e8b',
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  securityNote: {
    padding: 20,
    alignItems: 'center',
  },
  securityText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default PaymentMethodsScreen;
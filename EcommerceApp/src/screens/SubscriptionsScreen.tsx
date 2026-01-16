import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Switch,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  ProductDetails: { product: any };
  Cart: undefined;
  Profile: undefined;
  OrderTracking: { orderId: string };
  OrderHistory: undefined;
  Subscriptions: undefined;
};

type SubscriptionsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Subscriptions'
>;

interface SubscriptionItem {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  price: number;
  image: string;
}

const SubscriptionsScreen = () => {
  const navigation = useNavigation<SubscriptionsScreenNavigationProp>();

  // Mock subscription data
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([
    {
      id: '1',
      name: 'Fresh Milk (1L)',
      frequency: 'daily',
      isActive: false,
      price: 60,
      image: 'https://via.placeholder.com/100x100/87CEEB/ffffff?text=Milk',
    },
    {
      id: '2',
      name: 'Organic Vegetables Pack',
      frequency: 'weekly',
      isActive: true,
      price: 200,
      image: 'https://via.placeholder.com/100x100/32CD32/ffffff?text=Veggies',
    },
    {
      id: '3',
      name: 'Bread & Eggs',
      frequency: 'weekly',
      isActive: false,
      price: 120,
      image: 'https://via.placeholder.com/100x100/F4A460/ffffff?text=Bread',
    },
    {
      id: '4',
      name: 'Fruits Basket',
      frequency: 'weekly',
      isActive: false,
      price: 300,
      image: 'https://via.placeholder.com/100x100/FF6347/ffffff?text=Fruits',
    },
  ]);

  const toggleSubscription = (id: string) => {
    setSubscriptions(prev =>
      prev.map(sub =>
        sub.id === id
          ? { ...sub, isActive: !sub.isActive }
          : sub
      )
    );
  };

  const handleSubscribe = (item: SubscriptionItem) => {
    Alert.alert(
      'Subscribe',
      `Subscribe to ${item.name} for ₹${item.price}/${item.frequency}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: () => {
            toggleSubscription(item.id);
            Alert.alert('Success', `Subscribed to ${item.name}!`);
          },
        },
      ]
    );
  };

  const renderSubscriptionItem = ({ item }: { item: SubscriptionItem }) => (
    <View style={styles.subscriptionCard}>
      <View style={styles.itemInfo}>
        <Image
          source={{ uri: item.image }}
          style={styles.itemImage}
          resizeMode="cover"
        />
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>₹{item.price} / {item.frequency}</Text>
        </View>
      </View>

      <View style={styles.subscriptionControls}>
        {item.isActive ? (
          <View style={styles.activeContainer}>
            <Text style={styles.activeText}>Active</Text>
            <Switch
              value={item.isActive}
              onValueChange={() => toggleSubscription(item.id)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={item.isActive ? '#007bff' : '#f4f3f4'}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={() => handleSubscribe(item)}
          >
            <Text style={styles.subscribeButtonText}>Subscribe</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscriptions</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Daily Essentials Subscription</Text>
        <Text style={styles.infoText}>
          Subscribe to your favorite daily essentials and get them delivered automatically.
          Save time and never run out of essentials!
        </Text>
      </View>

      <FlatList
        data={subscriptions}
        keyExtractor={(item) => item.id}
        renderItem={renderSubscriptionItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Subscriptions can be paused or cancelled anytime from your profile.
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
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 24,
    color: '#333',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  infoContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 100,
  },
  subscriptionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 15,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
  },
  subscriptionControls: {
    alignItems: 'center',
  },
  activeContainer: {
    alignItems: 'center',
  },
  activeText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subscribeButton: {
    backgroundColor: '#ff7e8b',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    padding: 15,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default SubscriptionsScreen;
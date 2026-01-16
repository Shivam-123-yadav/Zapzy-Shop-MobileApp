import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useWishlist, WishlistItem } from '../store/WishlistContext';
import { useCart } from '../store/CartContext';

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
  OrderTracking: { orderId: string };
  OrderHistory: undefined;
  Subscriptions: undefined;
};

type WishlistScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Wishlist'
>;

const WishlistScreen = () => {
  const navigation = useNavigation<WishlistScreenNavigationProp>();
  const { wishlist, removeFromWishlist, clearWishlist, loading } = useWishlist();
  const { addToCart } = useCart();

  const handleRemoveItem = (itemId: string, itemName: string) => {
    Alert.alert(
      'Remove from Wishlist',
      `Remove "${itemName}" from your wishlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFromWishlist(itemId);
            } catch (error) {
              Alert.alert('Error', `Failed to remove "${itemName}" from wishlist`);
            }
          }
        }
      ]
    );
  };

  const handleClearWishlist = async () => {
    Alert.alert(
      'Clear Wishlist',
      'Are you sure you want to clear your entire wishlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearWishlist();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear wishlist');
            }
          }
        }
      ]
    );
  };

  const handleViewProduct = (item: WishlistItem) => {
    // Navigate to product details
    navigation.navigate('ProductDetails', { product: { ...item, id: item.product_id } });
  };

  const handleAddToCart = async (item: WishlistItem) => {
    try {
      await addToCart(item.product_id, 1);
      Alert.alert('Success', `"${item.name}" added to cart!`);
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to add product to cart');
    }
  };

  const renderWishlistItem = ({ item }: { item: WishlistItem }) => (
    <View style={styles.wishlistItem}>
      <TouchableOpacity
        style={styles.productInfo}
        onPress={() => handleViewProduct(item)}
      >
        <View style={styles.productImage}>
          <Image
            source={{ uri: item.image }}
            style={styles.productImageContent}
            resizeMode="cover"
          />
        </View>

        <View style={styles.productDetails}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>₹{item.price}</Text>
            {item.originalPrice && (
              <Text style={styles.originalPrice}>₹{item.originalPrice}</Text>
            )}
            {item.discount && (
              <Text style={styles.discountBadge}>{item.discount}% OFF</Text>
            )}
          </View>

          {item.rating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>⭐ {item.rating}</Text>
              {item.reviews && (
                <Text style={styles.reviewsText}>({item.reviews})</Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.addToCartButton]}
          onPress={() => handleAddToCart(item)}
        >
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => handleRemoveItem(item.id, item.name)}
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyWishlist = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>❤️</Text>
      <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
      <Text style={styles.emptySubtitle}>
        Save items you love for later and never miss out on great deals!
      </Text>
      <TouchableOpacity
        style={styles.shopNowButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.shopNowText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Wishlist</Text>
        {wishlist.length > 0 && !loading && (
          <TouchableOpacity onPress={handleClearWishlist} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading wishlist...</Text>
        </View>
      ) : wishlist.length > 0 ? (
        <FlatList
          data={wishlist}
          renderItem={renderWishlistItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.wishlistContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyWishlist()
      )}

      {wishlist.length > 0 && !loading && (
        <View style={styles.footer}>
          <Text style={styles.itemCount}>
            {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} in wishlist
          </Text>
        </View>
      )}
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
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#ff7e8b',
    fontWeight: '600',
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#ff4444',
    fontWeight: '600',
  },
  wishlistContainer: {
    padding: 20,
  },
  wishlistItem: {
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
  productInfo: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  productImage: {
    width: 80,
    height: 80,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  productImageContent: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff7e8b',
    marginRight: 10,
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  discountBadge: {
    backgroundColor: '#ff7e8b',
    color: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginRight: 5,
  },
  reviewsText: {
    fontSize: 14,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToCartButton: {
    backgroundColor: '#ff7e8b',
    marginRight: 10,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  removeButtonText: {
    color: '#666',
    fontSize: 14,
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
  shopNowButton: {
    backgroundColor: '#ff7e8b',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  shopNowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  itemCount: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default WishlistScreen;
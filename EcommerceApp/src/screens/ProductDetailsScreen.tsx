import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCart } from '../store/CartContext';

type RootStackParamList = {
  Home: undefined;
  ProductDetails: { product: any };
  Cart: undefined;
  Profile: undefined;
};

type ProductDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ProductDetails'
>;

const ProductDetailsScreen = () => {
  const navigation = useNavigation<ProductDetailsScreenNavigationProp>();
  const route = useRoute();
  const { product } = route.params as { product: any };
  const { addToCart } = useCart();

  const handleAddToCart = async () => {
    try {
      await addToCart(product.id, 1);
      Alert.alert('Success', 'Product added to cart successfully!');
      navigation.navigate('Cart');
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to add product to cart');
    }
  };

  const handleNotifyMe = () => {
    Alert.alert(
      'Notify Me',
      `You will be notified when ${product?.name || 'this product'} becomes available.`,
      [{ text: 'OK' }]
    );
    // TODO: Implement actual notification registration
    console.log('Notify me for product:', product?.id);
  };

  // Check if product is valid
  if (!product || typeof product.name !== 'string') {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 50 }}>Product not found</Text>
      </View>
    );
  }

  const imageUri = typeof product.image === 'string' && product.image ? product.image : 'https://via.placeholder.com/300x300/f0f0f0/cccccc?text=No+Image';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.cartButton}>🛒</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.productImage}
            resizeMode="cover"
          />
          {typeof product.discount_percentage === 'number' && product.discount_percentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{product.discount_percentage}% OFF</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>${product.price || 0}</Text>
            {product.original_price && (
              <Text style={styles.originalPrice}>${product.original_price}</Text>
            )}
          </View>

          {typeof product.rating === 'number' && product.rating > 0 && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>⭐ {product.rating} ({typeof product.review_count === 'number' ? product.review_count : 0} reviews)</Text>
            </View>
          )}

          {typeof product.stock === 'number' && product.stock <= 0 && (
            <View style={styles.unavailableContainer}>
              <Text style={styles.unavailableText}>🚫 Currently Unavailable</Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* Category */}
          <Text style={styles.sectionTitle}>Category</Text>
          <Text style={styles.productDescription}>{product.category?.name || 'Unknown'}</Text>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.productDescription}>
            Fresh and high-quality {product.name?.toLowerCase() || 'product'} sourced directly from trusted farmers.
            Perfect for your daily needs with the best quality assurance. Our products are carefully
            selected and delivered fresh to your doorstep within minutes.
          </Text>

          <View style={styles.divider} />

          {/* Nutritional Info */}
          <Text style={styles.sectionTitle}>Why choose us?</Text>
          <View style={styles.featuresList}>
            <Text style={styles.featureItem}>✓ Fresh & Hygienic</Text>
            <Text style={styles.featureItem}>✓ Quality Assured</Text>
            <Text style={styles.featureItem}>✓ Fast Delivery</Text>
            <Text style={styles.featureItem}>✓ Best Price</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {product.stock > 0 ? (
          <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
            <Text style={styles.addToCartButtonText}>Add to Cart</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.notifyMeButton} onPress={handleNotifyMe}>
            <Text style={styles.notifyMeButtonText}>🔔 Notify Me</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default ProductDetailsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  /* Header */
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
  cartButton: {
    fontSize: 20,
  },

  /* Content */
  content: {
    flex: 1,
  },

  /* Product Image */
  imageContainer: {
    height: 250,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
    borderRadius: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ff7e8b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  /* Product Info */
  productInfo: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  ratingContainer: {
    marginBottom: 15,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  unavailableContainer: {
    marginBottom: 15,
  },
  unavailableText: {
    fontSize: 14,
    color: '#dc3545',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  productDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 10,
  },
  featuresList: {
    marginTop: 10,
  },
  featureItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    paddingLeft: 5,
  },

  /* Bottom Bar */
  bottomBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  addToCartButton: {
    backgroundColor: '#ff7e8b',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notifyMeButton: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  notifyMeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

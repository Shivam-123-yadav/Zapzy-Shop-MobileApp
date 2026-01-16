import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomButton, CustomInput, Header, Loader } from '../components';
import { productAPI, Product, Category } from '../services/api';
import { useWishlist } from '../store/WishlistContext';
import { useCart } from '../store/CartContext';

type RootStackParamList = {
  Home: undefined;
  ProductDetails: { product: any };
  Cart: undefined;
  Checkout: undefined;
  Profile: undefined;
  Wishlist: undefined;
  Search: { query?: string; category?: string };
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  OrderTracking: { orderId: string };
  EditProfile: undefined;
  AddressBook: undefined;
  Settings: undefined;
  HelpSupport: undefined;
  PaymentMethods: undefined;
  OrderHistory: undefined;
  Subscriptions: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

const { width } = Dimensions.get('window');

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
}

interface Banner {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  actionText: string;
}

const banners: Banner[] = [
  {
    id: '1',
    image: 'https://via.placeholder.com/400x200/ff7e8b/ffffff?text=Welcome+to+Zapzy',
    title: 'Welcome to Zapzy',
    subtitle: 'Discover amazing products at great prices',
    actionText: 'Shop Now'
  },
  {
    id: '2',
    image: 'https://via.placeholder.com/400x200/4CAF50/ffffff?text=New+Arrivals',
    title: 'New Arrivals',
    subtitle: 'Check out our latest products',
    actionText: 'Explore'
  },
  {
    id: '3',
    image: 'https://via.placeholder.com/400x200/FF9800/ffffff?text=Special+Offers',
    title: 'Special Offers',
    subtitle: 'Limited time deals on selected items',
    actionText: 'View Deals'
  },
];

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { addToWishlist, removeFromWishlist, isInWishlist, wishlist } = useWishlist();
  const { addToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoiceSearchActive, setIsVoiceSearchActive] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

  // Create display categories (All + API categories)
  const displayCategories = React.useMemo(() => [
    { id: '1', name: 'All', icon: '🛒' },
    ...categories.map(cat => ({ id: cat.id.toString(), name: cat.name, icon: '📦' }))
  ], [categories]);

  // Fetch products and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [productsResponse, categoriesResponse] = await Promise.all([
          productAPI.getProducts(),
          productAPI.getCategories()
        ]);
        setProducts(productsResponse.products);
        setCategories(categoriesResponse.categories);
        setFilteredProducts(productsResponse.products);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load products. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filterProducts = useCallback(() => {
    let filtered = products;

    if (selectedCategory !== '1') {
      const categoryId = parseInt(selectedCategory);
      filtered = filtered.filter(product => product.category.id === categoryId);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [selectedCategory, searchQuery, products]);

  useEffect(() => {
    filterProducts();
  }, [selectedCategory, searchQuery, filterProducts]);

  const startVoiceSearch = () => {
    Alert.alert('Voice Search', 'Voice search feature coming soon!');
  };

  const stopVoiceSearch = () => {
    setIsVoiceSearchActive(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const suggestions = products
        .filter(product => product.name.toLowerCase().includes(query.toLowerCase()))
        .map(product => product.name)
        .slice(0, 5);
      setSearchSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    navigation.navigate('Search', { query: suggestion });
  };

  const toggleWishlist = async (product: Product) => {
    try {
      if (isInWishlist(product.id)) {
        // Find the wishlist item and remove it
        const wishlistItem = wishlist.find(item => item.product_id === product.id);
        if (wishlistItem) {
          await removeFromWishlist(wishlistItem.id);
        }
      } else {
        // Add to wishlist
        await addToWishlist(product.id, {
          product_id: product.id,
          name: product.name,
          price: product.price,
          originalPrice: product.original_price || undefined,
          discount: product.discount_percentage || undefined,
          image: product.image,
          rating: product.rating || undefined,
          reviews: product.review_count || undefined,
        });
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product.id, 1);
      Alert.alert('Success', `${product.name} added to cart!`);
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to add product to cart');
    }
  };

  const renderBanner = ({ item }: { item: Banner }) => (
    <TouchableOpacity style={styles.bannerCard} activeOpacity={0.9}>
      <Image source={{ uri: item.image }} style={styles.bannerImage} />
      <View style={styles.bannerOverlay}>
        <Text style={styles.bannerTitle}>{item.title}</Text>
        <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
        <CustomButton
          title={item.actionText}
          variant="outline"
          size="small"
          style={styles.bannerButton}
          textStyle={{ color: '#fff', borderColor: '#fff' }}
          onPress={() => Alert.alert('Banner Action', item.actionText)}
        />
      </View>
    </TouchableOpacity>
  );

  const renderCategory = ({ item }: { item: { id: string; name: string; icon: string } }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.categoryItemSelected
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text style={[
        styles.categoryText,
        selectedCategory === item.id && styles.categoryTextSelected
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }: { item: Product }) => {
    const imageUri = typeof item.image === 'string' && item.image ? item.image : 'https://via.placeholder.com/100x100/f0f0f0/cccccc?text=No+Image';

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetails', { product: item })}
      >
        <View style={styles.productImageContainer}>
          <View style={styles.productImageWrapper}>
            <Image
              source={{ uri: imageUri }}
              style={styles.productImageActual}
              resizeMode="cover"
            />
        </View>
        {item.discount_percentage > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{item.discount_percentage}% OFF</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.wishlistButton}
          onPress={() => toggleWishlist(item)}
        >
          <Text style={styles.wishlistIcon}>
            {isInWishlist(item.id) ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name || 'Product'}</Text>

        <View style={styles.priceContainer}>
          <Text style={styles.productPrice}>${item.price || 0}</Text>
          {item.original_price && (
            <Text style={styles.originalPrice}>${item.original_price}</Text>
          )}
        </View>

        <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>⭐ {item.rating || 0} ({item.review_count || 0})</Text>
        </View>

        <CustomButton
          title="ADD"
          variant="primary"
          size="small"
          style={styles.addButton}
          onPress={() => handleAddToCart(item)}
        />
      </View>
    </TouchableOpacity>
    );
  };

  const sections = React.useMemo(() => [
    {
      title: 'location',
      data: [{ type: 'location' }],
      renderItem: () => (
        <View style={styles.locationBar}>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>⚡ Delivery in 8 mins</Text>
            <Text style={styles.locationAddress}>📍 Sector 62, Noida</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileEmoji}>👤</Text>
          </TouchableOpacity>
        </View>
      ),
    },
    {
      title: 'search',
      data: [{ type: 'search' }],
      renderItem: () => (
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <CustomInput
              placeholder="Search for atta, dal, coke..."
              value={searchQuery}
              onChangeText={handleSearch}
              containerStyle={styles.searchInputContainer}
              inputStyle={styles.searchInput}
            />
            <TouchableOpacity
              style={[styles.voiceButton, isVoiceSearchActive && styles.voiceButtonActive]}
              onPress={isVoiceSearchActive ? stopVoiceSearch : startVoiceSearch}
            >
              <Text style={styles.voiceIcon}>
                {isVoiceSearchActive ? '🎤' : '🎙️'}
              </Text>
            </TouchableOpacity>
          </View>
          {showSuggestions && searchSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {searchSuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => selectSuggestion(suggestion)}
                >
                  <Text style={styles.suggestionIcon}>🔍</Text>
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ),
    },
    {
      title: 'banners',
      data: [{ type: 'banners' }],
      renderItem: () => (
        <View style={styles.bannersContainer}>
          <FlatList
            data={banners}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `banner-${item.id}-${index}`}
            renderItem={renderBanner}
            pagingEnabled
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / width);
              setCurrentBannerIndex(index);
            }}
          />
          <View style={styles.bannerIndicators}>
            {banners.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.bannerIndicator,
                  index === currentBannerIndex && styles.bannerIndicatorActive,
                ]}
              />
            ))}
          </View>
        </View>
      ),
    },
    {
      title: 'categories',
      data: [{ type: 'categories' }],
      renderItem: () => (
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <FlatList
            data={displayCategories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `category-${item.id}-${index}`}
            renderItem={renderCategory}
            contentContainerStyle={styles.categoryList}
          />
        </View>
      ),
    },
    {
      title: 'products',
      data: [{ type: 'products' }],
      renderItem: () => (
        <View style={styles.productsContainer}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === '1' ? 'Fresh Picks' : `${displayCategories.find(c => c.id === selectedCategory)?.name} Products`}
          </Text>
          <FlatList
            data={filteredProducts}
            keyExtractor={(item, index) => `product-${item.id}-${index}`}
            renderItem={renderProduct}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.productsGrid}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyText}>No products found</Text>
                <CustomButton
                  title="Clear Filters"
                  variant="outline"
                  onPress={() => {
                    setSelectedCategory('1');
                    setSearchQuery('');
                  }}
                />
              </View>
            }
          />
        </View>
      ),
    },
  ], [displayCategories, filteredProducts, selectedCategory, searchQuery, showSuggestions, searchSuggestions, isVoiceSearchActive, currentBannerIndex, banners]);

  return (
    <View style={styles.container}>
      <Header
        title="Zapzy"
        rightIcon="🛒"
        onRightPress={() => {
          console.log('Cart icon pressed!');
          Alert.alert('Cart', 'Cart icon clicked!');
          navigation.navigate('Cart');
        }}
      />

      {isLoading ? (
        <Loader message="Loading products..." />
      ) : sections.length > 0 ? (
        <FlatList
          data={sections}
          keyExtractor={(item, index) => `section-${item.title}-${index}`}
          renderItem={({ item }) => item.renderItem()}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, marginTop: 10 }}
        />
      ) : null}

      {isVoiceSearchActive && (
        <Loader
          message="Listening..."
          overlay
          color="#ff7e8b"
        />
      )}
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingTop: 70, // Add padding for the absolute positioned Header
  },

  /* LOCATION BAR */
  locationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 13,
    color: '#ff7e8b',
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  locationAddress: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  profileEmoji: {
    fontSize: 22,
  },

  /* SEARCH */
  searchWrapper: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInputContainer: {
    flex: 1,
    marginRight: 10,
  },
  searchInput: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  voiceButtonActive: {
    backgroundColor: '#ff7e8b',
    borderColor: '#ff7e8b',
  },
  voiceIcon: {
    fontSize: 16,
  },

  /* SEARCH SUGGESTIONS */
  suggestionsContainer: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  suggestionIcon: {
    fontSize: 14,
    marginRight: 12,
    opacity: 0.6,
  },
  suggestionText: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },

  /* BANNERS */
  /* BANNERS */
  bannersContainer: {
    marginBottom: 20,
  },
  bannerCard: {
    width: width - 40,
    height: 150,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 16,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 12,
  },
  bannerButton: {
    alignSelf: 'flex-start',
  },
  bannerIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  bannerIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  bannerIndicatorActive: {
    backgroundColor: '#ff7e8b',
  },

  /* CATEGORIES */
  categoriesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 16,
    marginHorizontal: 20,
    letterSpacing: 0.3,
  },
  categoryList: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#f0f0f0',
    minWidth: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryItemSelected: {
    backgroundColor: '#ff7e8b',
    borderColor: '#ff7e8b',
    transform: [{ scale: 1.02 }],
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 0.2,
  },
  categoryTextSelected: {
    color: '#fff',
  },

  /* PRODUCTS */
  productsContainer: {
    flex: 1,
  },
  productsGrid: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 6,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f8f8f8',
  },
  productImageContainer: {
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  productImageWrapper: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    fontSize: 56,
  },
  productImageActual: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff7e8b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#ff7e8b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  discountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  wishlistIcon: {
    fontSize: 18,
  },
  etaBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  etaText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
    marginRight: 8,
    letterSpacing: 0.3,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  ratingContainer: {
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#ff7e8b',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#ff7e8b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  /* EMPTY STATE */
  emptyContainer: {
    alignItems: 'center',
    padding: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 17,
    color: '#666',
    marginBottom: 24,
    fontWeight: '600',
  },
});
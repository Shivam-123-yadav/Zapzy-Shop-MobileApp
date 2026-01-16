import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { CartProvider } from './src/store/CartContext';
import { OrderProvider } from './src/store/OrderContext';
import { WishlistProvider } from './src/store/WishlistContext';
import { AuthProvider } from './src/store/AuthContext';
import { loadAuthTokens } from './src/services/api';

const App = () => {
  useEffect(() => {
    // Load auth tokens on app start
    loadAuthTokens();
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <OrderProvider>
          <WishlistProvider>
            <AppNavigator />
          </WishlistProvider>
        </OrderProvider>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;

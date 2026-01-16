# Mobile Ecommerce App

A full-stack ecommerce application built with Django REST API backend and React Native mobile frontend. This project provides a complete shopping experience including product browsing, cart management, wishlist, orders, and order tracking.

## 📋 Project Structure

<img width="421" height="904" alt="eco1" src="https://github.com/user-attachments/assets/96110af5-a2e9-4ba5-8648-bc08894f9054" />

<img width="427" height="887" alt="eco2" src="https://github.com/user-attachments/assets/881d398f-bdbc-42ea-a029-1b4ab9fde4d7" />

```
mobile-app/
├── backend/              # Django REST API
│   ├── accounts/        # User authentication & profiles
│   ├── products/        # Product catalog
│   ├── manage.py
│   └── db.sqlite3
└── EcommerceApp/        # React Native mobile app
    ├── src/
    │   ├── screens/     # App screens
    │   ├── components/  # Reusable components
    │   ├── services/    # API integration
    │   ├── store/       # Context/State management
    │   ├── navigation/  # Navigation setup
    │   └── utils/       # Utility functions
    ├── android/
    ├── ios/
    └── package.json
```

<img width="422" height="859" alt="eco4" src="https://github.com/user-attachments/assets/83495f64-9d89-4475-ab04-c3d2f9097415" />

<img width="429" height="893" alt="eco7" src="https://github.com/user-attachments/assets/089e4437-663b-4ff2-bd96-4b21f2a78b53" />

<img width="428" height="885" alt="eco8" src="https://github.com/user-attachments/assets/8ece7a8d-9a36-447c-94e8-37a6d4a46f09" />

## 🚀 Features

### Backend (Django)
- **User Authentication**: JWT-based authentication with token refresh
- **User Profiles**: Manage user information and preferences
- **Products**: Browse products with categories and images
- **Shopping Cart**: Add/remove items, manage quantities
- **Wishlist**: Save favorite products
- **Orders**: Create and manage orders
- **Order Tracking**: Track order status and delivery

### Frontend (React Native)
- **Authentication**: Login and Registration
- **Product Catalog**: Browse and search products
- **Product Details**: View full product information
- **Shopping Cart**: Manage cart items with quantity control
- **Wishlist**: Save and manage favorite products
- **Checkout**: Complete purchases with order details
- **Order History**: View past orders
- **Order Tracking**: Real-time order status tracking
- **User Profile**: Edit profile information
- **Address Book**: Manage delivery addresses
- **Payment Methods**: Save payment information
- **Settings**: App preferences and configurations

## 🛠️ Tech Stack

### Backend
- **Framework**: Django 5.2.10
- **API**: Django REST Framework
- **Authentication**: Simple JWT
- **Database**: SQLite (development), upgradeable to PostgreSQL
- **CORS**: django-cors-headers

### Frontend
- **Framework**: React Native (Expo/CLI)
- **Language**: TypeScript
- **Navigation**: React Navigation
- **State Management**: Context API
- **HTTP Client**: Axios

## 📦 Installation

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn
- Android SDK (for Android development)
- Xcode (for iOS development on macOS)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
   - **Windows**:
   ```bash
   venv\Scripts\activate
   ```
   - **macOS/Linux**:
   ```bash
   source venv/bin/activate
   ```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run migrations:
```bash
python manage.py migrate
```

6. Create a superuser (admin account):
```bash
python manage.py createsuperuser
```

7. Start the development server:
```bash
python manage.py runserver
```

The backend will run at `http://127.0.0.1:8000/`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd EcommerceApp
```

2. Install dependencies:
```bash
npm install
# OR
yarn install
```

3. Update API endpoint in `src/services/api.ts`:
```typescript
const BASE_URL = 'http://YOUR_BACKEND_IP:8000/api/';
```

4. Start the Metro bundler:
```bash
npm start
# OR
yarn start
```

5. Run on Android:
```bash
npm run android
# OR
yarn android
```

6. Run on iOS (macOS only):
```bash
npm run ios
# OR
yarn ios
```

## 🔗 API Endpoints

### Authentication
- `POST /api/accounts/register/` - Register new user
- `POST /api/accounts/login/` - Login user
- `POST /api/accounts/token/refresh/` - Refresh JWT token

### Products
- `GET /api/products/` - List all products
- `GET /api/products/{id}/` - Get product details
- `GET /api/products/category/{category}/` - Get products by category

### Cart
- `GET /api/accounts/cart/` - Get user's cart
- `POST /api/accounts/cart/add/` - Add item to cart
- `PUT /api/accounts/cart/update/` - Update cart item
- `DELETE /api/accounts/cart/remove/` - Remove item from cart

### Wishlist
- `GET /api/accounts/wishlist/` - Get user's wishlist
- `POST /api/accounts/wishlist/add/` - Add to wishlist
- `DELETE /api/accounts/wishlist/remove/` - Remove from wishlist

### Orders
- `GET /api/accounts/orders/` - List user's orders
- `POST /api/accounts/orders/create/` - Create new order
- `GET /api/accounts/orders/{id}/` - Get order details
- `GET /api/accounts/orders/{id}/tracking/` - Get order tracking

## 🔐 Configuration

### Backend Settings (`backend/settings.py`)
- Modify `DEBUG` for production
- Update `ALLOWED_HOSTS` with your domain/IP
- Configure database settings
- Set up email backend for password reset

### Frontend Settings (`src/services/api.ts`)
- Update `BASE_URL` to match your backend server
- Configure API timeout values
- Add authentication headers if needed

## 📱 Common Tasks

### Add a New Product via Django Admin
1. Start the development server
2. Go to `http://127.0.0.1:8000/admin/`
3. Login with your superuser credentials
4. Navigate to Products and add a new product

### Rebuild Mobile App Cache
```bash
# Android
npm run android -- --reset-cache

# iOS
yarn ios --reset-cache
```

### Reset Database
```bash
rm db.sqlite3
python manage.py migrate
python manage.py createsuperuser
```

## 🐛 Troubleshooting

### Backend Issues
- **Port already in use**: `python manage.py runserver 8001`
- **Module not found**: Ensure virtual environment is activated and dependencies installed
- **Migration errors**: `python manage.py migrate --run-syncdb`

### Frontend Issues
- **Metro bundler issues**: Clear cache with `npm start -- --reset-cache`
- **Android build fails**: `cd android && ./gradlew clean && cd ..`
- **Connection refused**: Verify backend is running and API URL is correct

## 📝 Project Notes

- Database migrations are tracked in `accounts/migrations/` and `products/migrations/`
- Media files (product images) are stored in `backend/media/products/`
- Environment-specific settings should be managed via `.env` files
- API authentication uses JWT tokens in `Authorization: Bearer <token>` header

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Commit: `git commit -m 'Add your feature'`
4. Push: `git push origin feature/your-feature`
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 📞 Support

For issues and questions, please create an issue in the repository or contact the development team.

---

**Last Updated**: January 2026

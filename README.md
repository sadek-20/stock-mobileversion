# Inventory Management Backend API

Clean Node.js + Express + MongoDB backend for inventory management with business logic validation.

## Features

- User authentication with JWT
- Product management
- Stock movement tracking (IN/OUT)
- Cash transaction management
- Currency exchange operations
- Debt tracking and payment records

## Business Logic Validations

- **Stock Movements**: OUT quantity cannot exceed available stock
- **Currency Exchange**: USD exchanges must be at least $100
- **Cash Transactions**: Payment type is required (CASH, CARD, TRANSFER, MOBILE)
- **Debt Management**: Debt amount must be positive

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file with:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/inventory_db
JWT_SECRET=your_jwt_secret_key_here
```

## Running the Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Products
- `POST /api/products` - Create product
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Stock Movements
- `POST /api/stock-movements` - Create stock movement
- `GET /api/stock-movements` - Get all stock movements
- `GET /api/stock-movements/:id` - Get stock movement by ID

### Cash Transactions
- `POST /api/cash` - Create cash transaction
- `GET /api/cash` - Get all cash transactions
- `GET /api/cash/summary/daily` - Get daily summary
- `GET /api/cash/:id` - Get cash transaction by ID

### Currency Exchange
- `POST /api/currency-exchange` - Create exchange record
- `GET /api/currency-exchange` - Get all exchanges
- `GET /api/currency-exchange/:id` - Get exchange by ID
- `DELETE /api/currency-exchange/:id` - Delete exchange

### Debts
- `POST /api/debts` - Create debt record
- `GET /api/debts` - Get all debts
- `GET /api/debts/:id` - Get debt by ID
- `PUT /api/debts/:id` - Update debt
- `POST /api/debts/:id/payment` - Record payment
- `DELETE /api/debts/:id` - Delete debt

## Authentication

Most endpoints require a JWT token. Include it in the Authorization header:

```
Authorization: Bearer <your_token>
```

## Example Requests

### Register User
```json
POST /api/auth/register
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "password123",
  "role": "admin"
}
```

### Create Product
```json
POST /api/products
{
  "name": "Laptop",
  "sku": "LAP-001",
  "description": "Dell Laptop",
  "category": "Electronics",
  "price": 1200,
  "currentStock": 10,
  "unit": "piece"
}
```

### Create Stock Movement (IN)
```json
POST /api/stock-movements
{
  "product": "product_id_here",
  "type": "IN",
  "quantity": 50,
  "reason": "New stock arrival"
}
```

### Create Stock Movement (OUT)
```json
POST /api/stock-movements
{
  "product": "product_id_here",
  "type": "OUT",
  "quantity": 5,
  "reason": "Sale"
}
```

### Create Cash Transaction
```json
POST /api/cash
{
  "transactionType": "SALE",
  "amount": 250,
  "paymentType": "CASH",
  "description": "Product sale"
}
```

### Create Currency Exchange
```json
POST /api/currency-exchange
{
  "fromCurrency": "USD",
  "toCurrency": "EUR",
  "fromAmount": 150,
  "exchangeRate": 0.92
}
```

### Create Debt
```json
POST /api/debts
{
  "customerName": "John Doe",
  "customerContact": "+1234567890",
  "amount": 500,
  "description": "Product purchase on credit",
  "dueDate": "2024-12-31"
}
```

### Record Debt Payment
```json
POST /api/debts/:id/payment
{
  "paymentAmount": 200
}
```

## Project Structure

```
├── config/
│   └── database.js          # MongoDB connection
├── models/
│   ├── User.js             # User model
│   ├── Product.js          # Product model
│   ├── StockMovement.js    # Stock movement model
│   ├── Cash.js             # Cash transaction model
│   ├── CurrencyExchange.js # Currency exchange model
│   └── Debt.js             # Debt model
├── controllers/
│   ├── authController.js          # Auth logic
│   ├── productController.js       # Product logic
│   ├── stockMovementController.js # Stock logic
│   ├── cashController.js          # Cash logic
│   ├── currencyExchangeController.js # Exchange logic
│   └── debtController.js          # Debt logic
├── routes/
│   ├── authRoutes.js              # Auth routes
│   ├── productRoutes.js           # Product routes
│   ├── stockMovementRoutes.js     # Stock routes
│   ├── cashRoutes.js              # Cash routes
│   ├── currencyExchangeRoutes.js  # Exchange routes
│   └── debtRoutes.js              # Debt routes
├── middleware/
│   ├── authMiddleware.js   # JWT authentication
│   └── errorHandler.js     # Error handling
├── .env                    # Environment variables
├── server.js              # Main server file
└── package.json           # Dependencies
```

## Testing with Postman

1. Register a new user
2. Login to get JWT token
3. Add the token to Authorization header for protected routes
4. Test all endpoints with sample data

## Notes

- All routes except register and login require authentication
- MongoDB must be running locally or provide a remote connection string
- Business logic validations are enforced at the controller level
- Ready to connect to mobile apps via REST API

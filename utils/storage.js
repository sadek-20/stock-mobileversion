import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  PRODUCTS: '@store_products',
  TRANSACTIONS: '@store_transactions',
  CASH_ENTRIES: '@store_cash_entries',
  EXCHANGES: '@store_exchanges',
  USER: '@store_user',
};

const INITIAL_PRODUCTS = [
  { id: '1', name: 'Sugar', quantity: 100, unit: 'kg' },
  { id: '2', name: 'Rice', quantity: 150, unit: 'kg' },
  { id: '3', name: 'Cooking Oil', quantity: 50, unit: 'liters' },
  { id: '4', name: 'Flour', quantity: 200, unit: 'kg' },
  { id: '5', name: 'Salt', quantity: 75, unit: 'kg' },
];

export const initializeStorage = async () => {
  try {
    const existingProducts = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!existingProducts) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.PRODUCTS,
        JSON.stringify(INITIAL_PRODUCTS)
      );
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};

export const getProducts = async () => {
  try {
    const products = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return products ? JSON.parse(products) : INITIAL_PRODUCTS;
  } catch (error) {
    console.error('Error getting products:', error);
    return INITIAL_PRODUCTS;
  }
};

export const updateProductQuantity = async (productId, quantity) => {
  try {
    const products = await getProducts();
    const updatedProducts = products.map((product) =>
      product.id === productId
        ? { ...product, quantity: product.quantity + quantity }
        : product
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.PRODUCTS,
      JSON.stringify(updatedProducts)
    );
    return updatedProducts;
  } catch (error) {
    console.error('Error updating product quantity:', error);
    throw error;
  }
};

export const addTransaction = async (transaction) => {
  try {
    const transactions = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const transactionList = transactions ? JSON.parse(transactions) : [];
    transactionList.push({
      ...transaction,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    });
    await AsyncStorage.setItem(
      STORAGE_KEYS.TRANSACTIONS,
      JSON.stringify(transactionList)
    );
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

export const addCashEntry = async (entry) => {
  try {
    const entries = await AsyncStorage.getItem(STORAGE_KEYS.CASH_ENTRIES);
    const entryList = entries ? JSON.parse(entries) : [];
    entryList.push({
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    });
    await AsyncStorage.setItem(
      STORAGE_KEYS.CASH_ENTRIES,
      JSON.stringify(entryList)
    );
  } catch (error) {
    console.error('Error adding cash entry:', error);
    throw error;
  }
};

export const addExchange = async (exchange) => {
  try {
    const exchanges = await AsyncStorage.getItem(STORAGE_KEYS.EXCHANGES);
    const exchangeList = exchanges ? JSON.parse(exchanges) : [];
    exchangeList.push({
      ...exchange,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    });
    await AsyncStorage.setItem(
      STORAGE_KEYS.EXCHANGES,
      JSON.stringify(exchangeList)
    );
  } catch (error) {
    console.error('Error adding exchange:', error);
    throw error;
  }
};

export const saveUser = async (user) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
};

export const getUser = async () => {
  try {
    const user = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const clearUser = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  } catch (error) {
    console.error('Error clearing user:', error);
    throw error;
  }
};

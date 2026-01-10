import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';

const API_URL = 'http://192.168.100.105:5000/api';

const StockContext = createContext(null);

export const StockProvider = ({ children }) => {
  const { token } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ----------------------------------
     AUTH HEADERS
  ---------------------------------- */
  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  /* ----------------------------------
     FETCH ALL PRODUCTS
  ---------------------------------- */
  const fetchProducts = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/products`, {
        headers: authHeaders(),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setProducts(data.data);
      return data.data;
    } catch (err) {
      console.error('Fetch products error:', err);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------
     CREATE PRODUCT
  ---------------------------------- */
  const createProduct = async (productData) => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(productData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      await fetchProducts();
      return { success: true, data };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------
     STOCK IN / OUT
  ---------------------------------- */
  const stockMovement = async ({ productId, type, quantity, description }) => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/stock-movements`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          product: productId,
          type,
          quantity,
          description,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      // Refresh product list to get updated stock
      await fetchProducts();

      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------
     STOCK IN
  ---------------------------------- */
  const stockIn = (productId, quantity, description) => {
    return stockMovement({
      productId,
      type: 'IN',
      quantity,
      description,
    });
  };

  /* ----------------------------------
     STOCK OUT
  ---------------------------------- */
  const stockOut = (productId, quantity, description) => {
    return stockMovement({
      productId,
      type: 'OUT',
      quantity,
      description,
    });
  };

  /* ----------------------------------
     AUTO LOAD PRODUCTS
  ---------------------------------- */
  useEffect(() => {
    if (token) fetchProducts();
  }, [token]);

  return (
    <StockContext.Provider
      value={{
        products,
        loading,
        fetchProducts,
        createProduct,
        stockIn,
        stockOut,
      }}
    >
      {children}
    </StockContext.Provider>
  );
};

export const useStock = () => {
  const ctx = useContext(StockContext);
  if (!ctx) throw new Error('useStock must be used inside StockProvider');
  return ctx;
};

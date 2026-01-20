import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';

const API_URL = 'http://192.168.100.105:5000/api';

const CashContext = createContext(null);

export const CashProvider = ({ children }) => {
  const { token } = useAuth();

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ----------------------------------
     AUTH HEADERS
  ---------------------------------- */
  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  /* ----------------------------------
     FETCH CASH SUMMARY
     (balance + transactions)
  ---------------------------------- */
  const fetchCash = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/cash`, {
        headers: authHeaders(),
      });

      //   console.log(res, 'in context');
      const data = await res.json();
      //   console.log(data, 'inghjkhl;j');

      if (!res.ok) throw new Error(data.message);

      setBalance(data.totalAmount);
      setTransactions(data);

      return data;
    } catch (err) {
      console.error('Fetch cash error:', err);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------
     ADD CASH (SALE, INCOME)
  ---------------------------------- */
  const addCash = async ({ amount, paymentType, description }) => {
    try {
      setLoading(true);

      if (!paymentType) {
        throw new Error('Payment type is required');
      }

      const res = await fetch(`${API_URL}/cash`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          amount,
          paymentType,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      await fetchCash();

      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------
     REMOVE CASH (EXPENSE / WITHDRAW)
  ---------------------------------- */
  const removeCash = async ({ amount, paymentType, description }) => {
    try {
      setLoading(true);

      if (!paymentType) {
        throw new Error('Payment type is required');
      }

      const res = await fetch(`${API_URL}/cash/out`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          amount,
          paymentType,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      await fetchCash();

      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------
     AUTO LOAD WHEN LOGGED IN
  ---------------------------------- */
  useEffect(() => {
    if (token) {
      fetchCash();
    }
  }, [token]);

  return (
    <CashContext.Provider
      value={{
        balance,
        transactions,
        loading,
        fetchCash,
        addCash,
        removeCash,
      }}
    >
      {children}
    </CashContext.Provider>
  );
};

export const useCash = () => {
  const ctx = useContext(CashContext);
  if (!ctx) throw new Error('useCash must be used inside CashProvider');
  return ctx;
};

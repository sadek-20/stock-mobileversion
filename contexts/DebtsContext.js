import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';

const API_URL = 'http://192.168.100.105:5000/api';

const DebtsContext = createContext(null);

export const DebtsProvider = ({ children }) => {
  const { token } = useAuth();

  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(false);

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  const fetchDebts = async ({ status, customerName } = {}) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (customerName) params.append('customerName', customerName);

      const url = `${API_URL}/debts${params.toString() ? `?${params.toString()}` : ''}`;

      const res = await fetch(url, {
        headers: authHeaders(),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch debts');

      const list = data.data || data || [];
      // normalize id field to `id` to match local usage
      const mapped = Array.isArray(list)
        ? list.map((d) => ({ ...d, id: d.id || d._id }))
        : [{ ...list, id: list.id || list._id }];

      setDebts(mapped);
      return mapped;
    } catch (err) {
      console.error('Fetch debts error:', err);
      Alert.alert('Error', err.message);
      setDebts([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createDebt = async (debtData) => {
    console.log(debtData, 'dababa');
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/debts`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(debtData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create debt');

      await fetchDebts();
      return { success: true, data: data.data };
    } catch (err) {
      console.error('Create debt error:', err);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateDebt = async (id, updates) => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/debts/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update debt');

      await fetchDebts();
      return { success: true, data: data.data };
    } catch (err) {
      console.error('Update debt error:', err);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteDebt = async (id) => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/debts/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete debt');

      await fetchDebts();
      return { success: true, message: data.message };
    } catch (err) {
      console.error('Delete debt error:', err);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const recordPayment = async (id, paymentAmount) => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/debts/${id}/payment`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ paymentAmount }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to record payment');

      await fetchDebts();
      return { success: true, data: data.data };
    } catch (err) {
      console.error('Record payment error:', err);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchDebts();
  }, [token]);

  return (
    <DebtsContext.Provider
      value={{
        debts,
        loading,
        fetchDebts,
        createDebt,
        updateDebt,
        deleteDebt,
        recordPayment,
      }}
    >
      {children}
    </DebtsContext.Provider>
  );
};

export const useDebts = () => {
  const ctx = useContext(DebtsContext);
  if (!ctx) throw new Error('useDebts must be used inside DebtsProvider');
  return ctx;
};

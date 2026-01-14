import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const API_URL = 'http://192.168.100.105:5000/api';

// console.log(API_URL, 'api');

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  // console.log(checkUser);

  const checkUser = async () => {
    try {
      // Try to get token from AsyncStorage
      const savedToken = await AsyncStorage.getItem('auth_token');
      const savedUser = await AsyncStorage.getItem('auth_user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));

        // Optional: Validate token with backend
        // await validateToken(savedToken);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  // Register/Signup function
  const signup = async (userData) => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userData.username,
          email: userData.email,
          password: userData.password,
          name: userData.fullName,
          phone: userData.phone,
          role: 'user',
        }),
      });

      // console.log(response);

      const result = await response.json();

      // console.log(await response, 'in auth contex');

      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }

      // ✅ HALKAN ISTICMAAL DATA-DA REGISTER-KA
      const { token, user } = result.data;

      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(user));

      setToken(token);
      setUser(user);

      return { success: true, message: result.message };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed',
      };
    } finally {
      setLoading(false);
    }
  };

  // Login function with both demo and API support
  const login = async (identifier, password) => {
    try {
      setLoading(true);

      // Demo login (fallback if API is not available)
      if (identifier === 'admin' && password === 'admin') {
        const demoUser = {
          id: '1',
          username: 'admin',
          fullName: 'Admin User',
          email: 'admin@example.com',
          phone: '+1234567890',
          role: 'admin',
          loggedInAt: new Date().toISOString(),
        };

        await AsyncStorage.setItem('auth_user', JSON.stringify(demoUser));
        await AsyncStorage.setItem('demo_mode', 'true');
        setUser(demoUser);
        setToken('demo-token');

        return { success: true, message: 'Demo login successful' };
      }

      // Try API login
      let loginIdentifier = identifier;

      // Determine if identifier is email or username
      const isEmail = /\S+@\S+\.\S+/.test(identifier);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [isEmail ? 'email' : 'username']: identifier,
          password: password,
        }),
      });

      const data = await response.json();

      // console.log(data, 'data token');

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Save token and user data
      const token = data?.data?.token;
      const user = data?.data?.user;

      if (!token) {
        Alert.alert('Login failed', 'Token not returned from server');
        return;
      }

      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(user));
      // Clear demo mode if exists

      setToken(data.token);
      setUser(data.user);

      return { success: true, message: 'Login successful' };
    } catch (error) {
      console.error('Login error:', error);

      // Fallback to checking local storage for demo users
      if (
        error.message.includes('Network') ||
        error.message.includes('Failed to fetch')
      ) {
        // Network error - try local storage
        const localUserKey = `user_${identifier}`;
        const userData = await AsyncStorage.getItem(localUserKey);

        if (userData) {
          const parsedUser = JSON.parse(userData);
          if (parsedUser.password === password) {
            const { password, ...userWithoutPassword } = parsedUser;

            await AsyncStorage.setItem(
              'auth_user',
              JSON.stringify(userWithoutPassword)
            );
            await AsyncStorage.setItem('demo_mode', 'true');
            setUser(userWithoutPassword);
            setToken('demo-token');

            return {
              success: true,
              message: 'Offline login successful (using local data)',
            };
          }
        }
      }

      return {
        success: false,
        message:
          error.message || 'Login failed. Please check your credentials.',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // If in demo mode, just clear local storage
      const demoMode = await AsyncStorage.getItem('demo_mode');

      if (demoMode === 'true') {
        await AsyncStorage.removeItem('auth_user');
        await AsyncStorage.removeItem('demo_mode');
      } else if (token) {
        // Call logout API if we have a valid token
        try {
          await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (apiError) {
          console.error('Logout API error:', apiError);
          // Continue with local logout even if API fails
        }

        // Clear stored data
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('auth_user');
      }

      setUser(null);
      setToken(null);

      // Navigate to login
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Validate token with backend (optional)
  const validateToken = async (tokenToValidate) => {
    try {
      const response = await fetch(`${API_URL}/auth/validate`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${tokenToValidate}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  // Get authenticated fetch headers
  const getAuthHeaders = () => {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token && token !== 'demo-token') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        signup,
        getAuthHeaders,
        isAuthenticated,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

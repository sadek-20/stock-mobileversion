// app/_layout.jsx
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { StockProvider } from '../contexts/StockContext';
import { CashProvider } from '../contexts/CashContext'; // Adjust path as needed
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { initializeStorage } from '../utils/storage';
import TransactionHistoryScreen from './TransactionHistory'; // Add this import

/* ---------------- ANDROID SAFE LOADER ---------------- */
function AndroidSafeLoader({ size = 'large', color = '#3b82f6' }) {
  const boxSize = size === 'large' ? 50 : 40;

  return (
    <View
      style={{
        width: boxSize,
        height: boxSize,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

/* ---------------- ROOT NAV ---------------- */
function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (loading) return;

    const inTabs = segments[0] === '(tabs)';
    const isLogin = segments[0] === 'login';
    const isSignup = segments[0] === 'signup';
    const isNotFound = segments[0] === '+not-found';
    const isProductDetails = segments[0] === 'product-details';
    const isTransactionHistory = segments[0] === 'TransactionHistory';

    if (
      !user &&
      (inTabs || isNotFound || isProductDetails || isTransactionHistory)
    ) {
      router.replace('/login');
    } else if (user && (isLogin || isSignup)) {
      router.replace('/(tabs)');
    }

    if (!initialized) {
      setInitialized(true);
    }
  }, [user, loading, segments]);

  /* ---------- SAFE LOADING SCREEN ---------- */
  if (loading || !initialized) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <View style={styles.logoInner} />
            </View>
          </View>

          <AndroidSafeLoader size="large" color="#3b82f6" />

          <View style={styles.loadingTextContainer}>
            <View style={styles.loadingTextWrapper}>
              <View style={styles.loadingTextLine} />
              <View
                style={[styles.loadingTextLine, styles.loadingTextLineShort]}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f8fafc' },
      }}
    >
      <Stack.Screen name="login" options={{ animation: 'fade' }} />
      <Stack.Screen name="signup" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen
        name="out"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          headerShown: true,
          title: 'Stock Out',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
            color: '#1e293b',
          },
          headerTintColor: '#3b82f6',
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="product-details"
        options={{
          animation: 'slide_from_right',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="TransactionHistory"
        options={{
          animation: 'slide_from_right',
          headerShown: true,
          title: 'Transaction History',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
            color: '#1e293b',
          },
          headerTintColor: '#3b82f6',
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="in"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          headerShown: true,
          title: 'Stock In',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: '600',
            color: '#1e293b',
          },
          headerTintColor: '#3b82f6',
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="edit-product"
        options={{
          animation: 'slide_from_right',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="+not-found"
        options={{ animation: 'fade', presentation: 'modal' }}
      />
    </Stack>
  );
}

/* ---------------- STORAGE LOADING SCREEN ---------------- */
function LoadingScreen() {
  return (
    <SafeAreaView style={styles.loadingContainer}>
      <View style={styles.loadingContent}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <View style={styles.logoInner} />
          </View>
        </View>

        {/* Android only supports small / large */}
        <AndroidSafeLoader size="small" color="#3b82f6" />

        <View style={styles.loadingTextContainer}>
          <View style={styles.loadingTextWrapper}>
            <View style={styles.loadingTextLine} />
            <View
              style={[styles.loadingTextLine, styles.loadingTextLineShort]}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ---------------- ROOT ---------------- */
export default function RootLayout() {
  const [storageReady, setStorageReady] = useState(false);
  useFrameworkReady();

  useEffect(() => {
    const init = async () => {
      try {
        await initializeStorage();
      } catch (error) {
        console.error('Failed to initialize storage:', error);
      } finally {
        setStorageReady(true);
      }
    };

    init();
  }, []);

  if (!storageReady) {
    return (
      <SafeAreaProvider>
        <LoadingScreen />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StockProvider>
          <CashProvider>
            <RootLayoutNav />
            <StatusBar style="dark" backgroundColor="#ffffff" />
          </CashProvider>
        </StockProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  logoInner: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    transform: [{ rotate: '45deg' }],
  },
  loadingTextContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  loadingTextWrapper: {
    alignItems: 'center',
  },
  loadingTextLine: {
    width: 120,
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 6,
  },
  loadingTextLineShort: {
    width: 80,
  },
});

import { Tabs } from 'expo-router';
import {
  Package,
  ArrowDownToLine,
  Banknote,
  ArrowLeftRight,
  CreditCard,
} from 'lucide-react-native';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor:
            Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.95)' : '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          // Android: Kor u qaad tabbar si looga fogaado navigation buttons
          height: Platform.select({
            ios: 85 + insets.bottom,
            android: 95, // Kor loo qaaday
          }),
          paddingBottom: Platform.select({
            ios: insets.bottom,
            android: 25, // Kor loo qaaday
          }),
          paddingTop: 10,
          // Elevation sare u qaad Android
          elevation: Platform.select({
            ios: 8,
            android: 20, // Kor loo qaaday
          }),
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: Platform.select({
              ios: -2,
              android: -4, // Kor loo qaaday
            }),
          },
          shadowOpacity: Platform.select({
            ios: 0.05,
            android: 0.1, // Kor loo qaaday
          }),
          shadowRadius: Platform.select({
            ios: 10,
            android: 15, // Kor loo qaaday
          }),
          // Android: Ku dar border transparent si loo siiyo space dheeraad ah
          borderBottomWidth: Platform.select({
            ios: 0,
            android: 8,
          }),
          borderBottomColor: 'transparent',
        },
        headerShown: false,
        tabBarHideOnKeyboard: true,
        // Disable swipe gestures on Android to prevent navigation issues
        swipeEnabled: Platform.OS === 'ios',
      }}
      sceneContainerStyle={{
        backgroundColor: '#f8fafc',
        paddingTop: Platform.OS === 'ios' ? insets.top : 0,
        // Add bottom padding so content doesn't hide behind elevated tabbar
        paddingBottom: Platform.select({
          ios: 0,
          android: 20,
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.tabIconContainer}>
              <View
                style={[
                  styles.iconWrapper,
                  focused && styles.iconWrapperActive,
                  Platform.OS === 'android' && styles.androidIconWrapper,
                ]}
              >
                {Platform.OS === 'ios' && (
                  <BlurView
                    intensity={focused ? 80 : 20}
                    style={styles.blurView}
                    tint="light"
                  >
                    <Package
                      color={focused ? '#3b82f6' : color}
                      size={size * 0.8}
                      strokeWidth={focused ? 2.5 : 2}
                    />
                  </BlurView>
                )}
                {Platform.OS === 'android' && (
                  <Package
                    color={focused ? '#ffffff' : color}
                    size={size * 0.8}
                    strokeWidth={focused ? 2.5 : 2}
                  />
                )}
              </View>
              {focused && (
                <View
                  style={[
                    styles.activeDot,
                    Platform.OS === 'android' && styles.androidActiveDot,
                  ]}
                />
              )}
            </View>
          ),
          tabBarLabel: ({ focused, color }) => (
            <Text
              style={[
                styles.tabLabel,
                focused && styles.tabLabelActive,
                Platform.OS === 'android' && styles.androidTabLabel,
              ]}
            >
              Products
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="in"
        options={{
          title: 'Stock In',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.tabIconContainer}>
              <View
                style={[
                  styles.iconWrapper,
                  focused && styles.iconWrapperActive,
                  Platform.OS === 'android' && styles.androidIconWrapper,
                ]}
              >
                {Platform.OS === 'ios' && (
                  <BlurView
                    intensity={focused ? 80 : 20}
                    style={styles.blurView}
                    tint="light"
                  >
                    <ArrowDownToLine
                      color={focused ? '#3b82f6' : color}
                      size={size * 0.8}
                      strokeWidth={focused ? 2.5 : 2}
                    />
                  </BlurView>
                )}
                {Platform.OS === 'android' && (
                  <ArrowDownToLine
                    color={focused ? '#ffffff' : color}
                    size={size * 0.8}
                    strokeWidth={focused ? 2.5 : 2}
                  />
                )}
              </View>
              {focused && (
                <View
                  style={[
                    styles.activeDot,
                    Platform.OS === 'android' && styles.androidActiveDot,
                  ]}
                />
              )}
            </View>
          ),
          tabBarLabel: ({ focused, color }) => (
            <Text
              style={[
                styles.tabLabel,
                focused && styles.tabLabelActive,
                Platform.OS === 'android' && styles.androidTabLabel,
              ]}
            >
              Stock In
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="cash"
        options={{
          title: 'Cash',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.tabIconContainer}>
              <View
                style={[
                  styles.iconWrapper,
                  focused && styles.iconWrapperActive,
                  Platform.OS === 'android' && styles.androidIconWrapper,
                ]}
              >
                {Platform.OS === 'ios' && (
                  <BlurView
                    intensity={focused ? 80 : 20}
                    style={styles.blurView}
                    tint="light"
                  >
                    <Banknote
                      color={focused ? '#3b82f6' : color}
                      size={size * 0.8}
                      strokeWidth={focused ? 2.5 : 2}
                    />
                  </BlurView>
                )}
                {Platform.OS === 'android' && (
                  <Banknote
                    color={focused ? '#ffffff' : color}
                    size={size * 0.8}
                    strokeWidth={focused ? 2.5 : 2}
                  />
                )}
              </View>
              {focused && (
                <View
                  style={[
                    styles.activeDot,
                    Platform.OS === 'android' && styles.androidActiveDot,
                  ]}
                />
              )}
            </View>
          ),
          tabBarLabel: ({ focused, color }) => (
            <Text
              style={[
                styles.tabLabel,
                focused && styles.tabLabelActive,
                Platform.OS === 'android' && styles.androidTabLabel,
              ]}
            >
              Cash
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="exchange"
        options={{
          title: 'Exchange',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.tabIconContainer}>
              <View
                style={[
                  styles.iconWrapper,
                  focused && styles.iconWrapperActive,
                  Platform.OS === 'android' && styles.androidIconWrapper,
                ]}
              >
                {Platform.OS === 'ios' && (
                  <BlurView
                    intensity={focused ? 80 : 20}
                    style={styles.blurView}
                    tint="light"
                  >
                    <ArrowLeftRight
                      color={focused ? '#3b82f6' : color}
                      size={size * 0.8}
                      strokeWidth={focused ? 2.5 : 2}
                    />
                  </BlurView>
                )}
                {Platform.OS === 'android' && (
                  <ArrowLeftRight
                    color={focused ? '#ffffff' : color}
                    size={size * 0.8}
                    strokeWidth={focused ? 2.5 : 2}
                  />
                )}
              </View>
              {focused && (
                <View
                  style={[
                    styles.activeDot,
                    Platform.OS === 'android' && styles.androidActiveDot,
                  ]}
                />
              )}
            </View>
          ),
          tabBarLabel: ({ focused, color }) => (
            <Text
              style={[
                styles.tabLabel,
                focused && styles.tabLabelActive,
                Platform.OS === 'android' && styles.androidTabLabel,
              ]}
            >
              Exchange
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="debts"
        options={{
          title: 'Debts',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.tabIconContainer}>
              <View
                style={[
                  styles.iconWrapper,
                  focused && styles.iconWrapperActive,
                  Platform.OS === 'android' && styles.androidIconWrapper,
                ]}
              >
                {Platform.OS === 'ios' && (
                  <BlurView
                    intensity={focused ? 80 : 20}
                    style={styles.blurView}
                    tint="light"
                  >
                    <CreditCard
                      color={focused ? '#3b82f6' : color}
                      size={size * 0.8}
                      strokeWidth={focused ? 2.5 : 2}
                    />
                  </BlurView>
                )}
                {Platform.OS === 'android' && (
                  <CreditCard
                    color={focused ? '#ffffff' : color}
                    size={size * 0.8}
                    strokeWidth={focused ? 2.5 : 2}
                  />
                )}
              </View>
              {focused && (
                <View
                  style={[
                    styles.activeDot,
                    Platform.OS === 'android' && styles.androidActiveDot,
                  ]}
                />
              )}
            </View>
          ),
          tabBarLabel: ({ focused, color }) => (
            <Text
              style={[
                styles.tabLabel,
                focused && styles.tabLabelActive,
                Platform.OS === 'android' && styles.androidTabLabel,
              ]}
            >
              Debts
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
  },
  iconWrapper: {
    width: Platform.select({
      ios: 44,
      android: 40,
    }),
    height: Platform.select({
      ios: 44,
      android: 40,
    }),
    borderRadius: Platform.select({
      ios: 14,
      android: 12,
    }),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Platform.select({
      ios: 'transparent',
      android: '#f8fafc',
    }),
    overflow: 'hidden',
  },
  androidIconWrapper: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconWrapperActive: {
    backgroundColor: Platform.select({
      ios: 'rgba(59, 130, 246, 0.1)',
      android: '#3b82f6',
    }),
    shadowColor: '#3b82f6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: Platform.select({
      ios: 0.15,
      android: 0.3,
    }),
    shadowRadius: Platform.select({
      ios: 8,
      android: 10,
    }),
    elevation: Platform.select({
      ios: 4,
      android: 12,
    }),
  },
  blurView: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3b82f6',
    marginTop: Platform.select({
      ios: 6,
      android: 8,
    }),
  },
  androidActiveDot: {
    backgroundColor: '#ffffff',
    marginTop: 8,
  },
  tabLabel: {
    fontSize: Platform.select({
      ios: 11,
      android: 10,
    }),
    fontWeight: '600',
    color: '#64748b',
    marginTop: Platform.select({
      ios: 4,
      android: 6,
    }),
    letterSpacing: -0.2,
  },
  tabLabelActive: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  androidTabLabel: {
    fontSize: 10,
    marginTop: 6,
  },
});

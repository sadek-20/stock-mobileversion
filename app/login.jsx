import { use, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Link, router } from 'expo-router';
import {
  Eye,
  EyeOff,
  User,
  Lock,
  Store,
  ArrowRight,
  UserPlus,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Fadlan buuxi', 'Geli username-ka iyo password-ka');
      return;
    }

    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (!result.success) {
      return Alert.alert('Login-ku waa fashilantay', result.message);
    }

    // Navigate to the tabs group after successful login
    router.replace('/(tabs)');
  };

  const disabled = loading || !username.trim() || !password.trim();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <LinearGradient
          colors={['#0f172a', '#1e293b']}
          style={styles.background}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Store size={40} color="#ffffff" />
              </View>
              <Text style={styles.title}>StockMaster</Text>
              <Text style={styles.subtitle}>Maamul Hantida</Text>
            </View>

            {/* Form */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Login</Text>

              {/* Username */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Username</Text>
                <View style={styles.inputWrapper}>
                  <User size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Geli username"
                    placeholderTextColor="#94a3b8"
                    style={styles.input}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Geli password"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPassword}
                    style={styles.input}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#64748b" />
                    ) : (
                      <Eye size={20} color="#64748b" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  disabled && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={disabled}
              >
                <LinearGradient
                  colors={
                    disabled ? ['#94a3b8', '#94a3b8'] : ['#3b82f6', '#2563eb']
                  }
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Login</Text>
                      <ArrowRight size={20} color="#ffffff" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Demo Hint */}
              <View style={styles.demoHint}>
                <Text style={styles.demoText}>Demo: admin / admin</Text>
              </View>

              {/* Signup Link */}
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Ma haysaa akoon?</Text>
                <Link href="/signup" asChild>
                  <TouchableOpacity style={styles.signupButton}>
                    <UserPlus size={16} color="#3b82f6" />
                    <Text style={styles.signupButtonText}>
                      Sameey Akoon Cusub
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    minHeight: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#0f172a',
    minHeight: 50,
  },
  eyeButton: {
    padding: 8,
    marginLeft: 8,
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 16,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  demoHint: {
    alignItems: 'center',
    marginBottom: 20,
  },
  demoText: {
    fontSize: 14,
    color: '#64748b',
  },
  signupContainer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  signupText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  signupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
});

import { useState } from 'react';
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
  StatusBar,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import {
  Eye,
  EyeOff,
  User,
  Lock,
  Store,
  Mail,
  Phone,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SignupScreen({ navigation }) {
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Fadlan geli magaca oo dhan';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Fadlan geli username';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username waa inuu ahaadaa ugu yaraan 3 xaraf';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Fadlan geli email-ka';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email-ku waa khalad';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Fadlan geli lambarka taleefanka';
    }

    if (!formData.password) {
      newErrors.password = 'Fadlan geli password';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password waa inuu ahaadaa ugu yaraan 6 xaraf';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Fadlan celi password-ka';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Password-ku ma qabanayso';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      Alert.alert('Fadlan buuxi', 'Buuxi meelaha khaladka ah');
      return;
    }

    setLoading(true);
    const result = await signup(formData);
    setLoading(false);

    console.log('result in signUp screen', result);

    if (result.success) {
      Alert.alert(
        'Guul',
        'Akoonka waa la sameeyay! Waxaa laguu soo dhaweeyay.',
        [
          {
            text: 'Okay',
            onPress: () => {
              // User is automatically logged in after signup
            },
          },
        ]
      );
    } else {
      Alert.alert('Qalad', result.message);
      console.log(result);
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const disabled =
    loading ||
    !formData.fullName.trim() ||
    !formData.username.trim() ||
    !formData.email.trim() ||
    !formData.phone.trim() ||
    !formData.password ||
    !formData.confirmPassword;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.background}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Store size={40} color="#ffffff" />
            </View>
            <Text style={styles.title}>StockMaster</Text>
            <Text style={styles.subtitle}>Sameey Akoon Cusub</Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Is-diiwaangeli</Text>

            {/* Full Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Magaca Oo Dhan</Text>
              <View style={styles.inputWrapper}>
                <User size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  value={formData.fullName}
                  onChangeText={(value) => updateFormData('fullName', value)}
                  placeholder="Geli magacaaga oo dhan"
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
              {errors.fullName ? (
                <Text style={styles.errorText}>{errors.fullName}</Text>
              ) : null}
            </View>

            {/* Username */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.inputWrapper}>
                <User size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  value={formData.username}
                  onChangeText={(value) => updateFormData('username', value)}
                  placeholder="Geli username"
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
              {errors.username ? (
                <Text style={styles.errorText}>{errors.username}</Text>
              ) : null}
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Mail size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  placeholder="Geli email-kaaga"
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
              {errors.email ? (
                <Text style={styles.errorText}>{errors.email}</Text>
              ) : null}
            </View>

            {/* Phone */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Lambarka Taleefanka</Text>
              <View style={styles.inputWrapper}>
                <Phone size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  value={formData.phone}
                  onChangeText={(value) => updateFormData('phone', value)}
                  placeholder="Geli lambarka taleefanka"
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                />
              </View>
              {errors.phone ? (
                <Text style={styles.errorText}>{errors.phone}</Text>
              ) : null}
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  placeholder="Samee password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  returnKeyType="next"
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
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password}</Text>
              ) : null}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Celinta Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  value={formData.confirmPassword}
                  onChangeText={(value) =>
                    updateFormData('confirmPassword', value)
                  }
                  placeholder="Celi password-ka"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showConfirmPassword}
                  style={styles.input}
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#64748b" />
                  ) : (
                    <Eye size={20} color="#64748b" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              ) : null}
            </View>

            {/* Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Shuruudaha Password:</Text>
              <View style={styles.requirementItem}>
                <CheckCircle
                  size={16}
                  color={formData.password.length >= 6 ? '#10b981' : '#94a3b8'}
                />
                <Text style={styles.requirementText}>Ugu yaraan 6 xaraf</Text>
              </View>
              <View style={styles.requirementItem}>
                <CheckCircle
                  size={16}
                  color={
                    formData.password === formData.confirmPassword &&
                    formData.confirmPassword.length > 0
                      ? '#10b981'
                      : '#94a3b8'
                  }
                />
                <Text style={styles.requirementText}>
                  Password-ku waa inay isku mid yihiin
                </Text>
              </View>
            </View>

            {/* Signup Button */}
            <TouchableOpacity
              style={[
                styles.signupButton,
                disabled && styles.signupButtonDisabled,
              ]}
              onPress={handleSignup}
              disabled={disabled}
            >
              <LinearGradient
                colors={
                  disabled ? ['#94a3b8', '#94a3b8'] : ['#10b981', '#059669']
                }
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Text style={styles.signupButtonText}>Sameey Akoon</Text>
                    <ArrowRight size={20} color="#ffffff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Hore u haysaa akoon?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                style={styles.loginButton}
              >
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
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
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b981',
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
    marginBottom: 16,
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
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  requirementsContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    color: '#64748b',
  },
  signupButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 16,
  },
  signupButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
  },
  signupButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  loginContainer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  loginText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  loginButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
});

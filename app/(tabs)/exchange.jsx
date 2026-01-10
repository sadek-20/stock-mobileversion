import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { addExchange } from '../../utils/storage';
import {
  ArrowLeftRight,
  Calculator,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ExchangeScreen() {
  const [ksh, setKsh] = useState('');
  const [rate, setRate] = useState('');
  const [usd, setUsd] = useState('');
  const [loading, setLoading] = useState(false);
  const [exchangeDirection, setExchangeDirection] = useState('KSH to USD'); // 'KSH to USD' or 'USD to KSH'
  const [showValidation, setShowValidation] = useState(false);

  const calculateExchange = (amount, exchangeRate, direction) => {
    if (!amount || !exchangeRate || parseFloat(exchangeRate) <= 0) {
      return '';
    }

    const amountValue = parseFloat(amount);
    const rateValue = parseFloat(exchangeRate);

    if (amountValue > 0 && rateValue > 0) {
      if (direction === 'KSH to USD') {
        const usdValue = amountValue / rateValue;
        return usdValue.toFixed(2);
      } else {
        const kshValue = amountValue * rateValue;
        return kshValue.toFixed(2);
      }
    }
    return '';
  };

  const handleAmountChange = (value) => {
    if (exchangeDirection === 'KSH to USD') {
      setKsh(value);
      const calculatedUSD = calculateExchange(value, rate, exchangeDirection);
      setUsd(calculatedUSD);
    } else {
      setUsd(value);
      const calculatedKSH = calculateExchange(value, rate, exchangeDirection);
      setKsh(calculatedKSH);
    }
  };

  const handleRateChange = (value) => {
    setRate(value);
    if (exchangeDirection === 'KSH to USD') {
      const calculatedUSD = calculateExchange(ksh, value, exchangeDirection);
      setUsd(calculatedUSD);
    } else {
      const calculatedKSH = calculateExchange(usd, value, exchangeDirection);
      setKsh(calculatedKSH);
    }
  };

  const toggleExchangeDirection = () => {
    const newDirection =
      exchangeDirection === 'KSH to USD' ? 'USD to KSH' : 'KSH to USD';
    setExchangeDirection(newDirection);

    // Swap values
    const temp = ksh;
    setKsh(usd);
    setUsd(temp);
  };

  const handleSubmit = async () => {
    if (!ksh || parseFloat(ksh) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (!rate || parseFloat(rate) <= 0) {
      Alert.alert('Invalid Rate', 'Please enter a valid exchange rate');
      return;
    }

    const kshValue = parseFloat(ksh);
    const usdValue = parseFloat(usd);

    // Validation rules
    if (usdValue < 100) {
      Alert.alert('Minimum Amount', 'USD amount must be at least $100');
      return;
    }

    if (kshValue < 1000) {
      Alert.alert(
        'Low Amount Warning',
        `Amount is less than 1,000 KSH ($${usdValue.toFixed(
          2
        )}).\n\nTransaction fees may be high relative to the amount.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => processExchange(),
            style: 'default',
          },
        ]
      );
      return;
    }

    processExchange();
  };

  const processExchange = async () => {
    setLoading(true);

    try {
      await addExchange({
        ksh: parseFloat(ksh),
        rate: parseFloat(rate),
        usd: parseFloat(usd),
        direction: exchangeDirection,
        date: new Date().toISOString(),
      });

      Alert.alert(
        'Exchange Successful!',
        `${ksh} KSH ↔ $${usd} USD\nRate: ${rate} KSH/USD`,
        [
          {
            text: 'OK',
            onPress: () => {
              setKsh('');
              setRate('');
              setUsd('');
              setShowValidation(false);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Exchange Failed',
        'Unable to process exchange. Please try again.'
      );
      console.error('Exchange error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value, type) => {
    if (!value) return '';
    const numValue = parseFloat(value);
    if (type === 'KSH') {
      return numValue.toLocaleString('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } else {
      return numValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  };

  const getValidationStatus = () => {
    if (!ksh || !usd || !rate) return null;

    const kshValue = parseFloat(ksh);
    const usdValue = parseFloat(usd);

    if (usdValue < 100) {
      return { type: 'error', message: 'Minimum $100 required' };
    }
    if (kshValue < 1000) {
      return { type: 'warning', message: 'Amount < 1,000 KSH' };
    }
    return { type: 'success', message: 'Ready to exchange' };
  };

  const validation = getValidationStatus();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.headerContent}>
              <ArrowLeftRight size={32} color="#ffffff" />
              <Text style={styles.headerTitle}>Currency Exchange</Text>
              <Text style={styles.headerSubtitle}>
                Convert between KSH and USD
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.content}>
          {/* Exchange Direction Toggle */}
          <View style={styles.card}>
            <View style={styles.directionContainer}>
              <TouchableOpacity
                style={[
                  styles.directionButton,
                  exchangeDirection === 'KSH to USD' &&
                    styles.directionButtonActive,
                ]}
                onPress={() => setExchangeDirection('KSH to USD')}
              >
                <Text
                  style={[
                    styles.directionText,
                    exchangeDirection === 'KSH to USD' &&
                      styles.directionTextActive,
                  ]}
                >
                  KSH → USD
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.swapButton}
                onPress={toggleExchangeDirection}
              >
                <RefreshCw size={20} color="#64748b" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.directionButton,
                  exchangeDirection === 'USD to KSH' &&
                    styles.directionButtonActive,
                ]}
                onPress={() => setExchangeDirection('USD to KSH')}
              >
                <Text
                  style={[
                    styles.directionText,
                    exchangeDirection === 'USD to KSH' &&
                      styles.directionTextActive,
                  ]}
                >
                  USD → KSH
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Amount Input Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Exchange Details</Text>

            {/* Source Amount */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {exchangeDirection === 'KSH to USD'
                  ? 'Kenyan Shillings (KSH)'
                  : 'US Dollars (USD)'}
                <Text style={styles.required}> *</Text>
              </Text>
              <View style={styles.currencyInputContainer}>
                <Text style={styles.currencySymbol}>
                  {exchangeDirection === 'KSH to USD' ? 'KSH' : 'USD'}
                </Text>
                <TextInput
                  style={styles.currencyInput}
                  placeholder={
                    exchangeDirection === 'KSH to USD'
                      ? 'Enter amount in KSH'
                      : 'Enter amount in USD'
                  }
                  value={exchangeDirection === 'KSH to USD' ? ksh : usd}
                  onChangeText={handleAmountChange}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#94a3b8"
                  returnKeyType="done"
                />
              </View>
            </View>

            {/* Exchange Rate */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Exchange Rate (KSH/USD)<Text style={styles.required}> *</Text>
              </Text>
              <View style={styles.rateInputContainer}>
                <TrendingUp size={20} color="#64748b" style={styles.rateIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter current exchange rate"
                  value={rate}
                  onChangeText={handleRateChange}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#94a3b8"
                />
                <Text style={styles.rateUnit}>KSH per USD</Text>
              </View>
              <Text style={styles.rateHint}>
                Current market rate: ~150 KSH/USD
              </Text>
            </View>
          </View>

          {/* Result Card */}
          {(ksh || usd) && (
            <View style={styles.resultCard}>
              <Text style={styles.resultCardTitle}>Conversion Result</Text>

              <View style={styles.resultDisplay}>
                <View style={styles.resultAmount}>
                  <Text style={styles.resultLabel}>
                    {exchangeDirection === 'KSH to USD'
                      ? 'KSH Amount'
                      : 'USD Amount'}
                  </Text>
                  <Text style={styles.resultValue}>
                    {exchangeDirection === 'KSH to USD'
                      ? `${formatCurrency(ksh, 'KSH')} KSH`
                      : `${formatCurrency(usd, 'USD')} USD`}
                  </Text>
                </View>

                <ArrowLeftRight
                  size={24}
                  color="#8b5cf6"
                  style={styles.resultArrow}
                />

                <View style={styles.resultAmount}>
                  <Text style={styles.resultLabel}>
                    {exchangeDirection === 'KSH to USD'
                      ? 'USD Amount'
                      : 'KSH Amount'}
                  </Text>
                  <Text style={styles.resultValue}>
                    {exchangeDirection === 'KSH to USD'
                      ? `${formatCurrency(usd, 'USD')} USD`
                      : `${formatCurrency(ksh, 'KSH')} KSH`}
                  </Text>
                </View>
              </View>

              {/* Validation Messages */}
              {validation && (
                <View
                  style={[
                    styles.validationContainer,
                    validation.type === 'error' && styles.validationError,
                    validation.type === 'warning' && styles.validationWarning,
                    validation.type === 'success' && styles.validationSuccess,
                  ]}
                >
                  {validation.type === 'error' && (
                    <AlertTriangle size={16} color="#ef4444" />
                  )}
                  {validation.type === 'warning' && (
                    <AlertTriangle size={16} color="#f59e0b" />
                  )}
                  <Text style={styles.validationText}>
                    {validation.message}
                  </Text>
                </View>
              )}

              {/* Quick Info */}
              <View style={styles.quickInfo}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Rate</Text>
                  <Text style={styles.infoValue}>{rate || '0'} KSH/USD</Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Fee Estimate</Text>
                  <Text style={styles.infoValue}>~1.5%</Text>
                </View>
              </View>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
              (!usd || parseFloat(usd) < 100) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading || !usd || parseFloat(usd) < 100}
          >
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <ArrowLeftRight size={22} color="#ffffff" />
                <Text style={styles.submitButtonText}>
                  {validation?.type === 'warning'
                    ? 'Proceed with Exchange'
                    : 'Exchange Currency'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Help Card */}
          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>💱 Exchange Guidelines</Text>
            <View style={styles.guideline}>
              <View style={styles.guidelineDot} />
              <Text style={styles.guidelineText}>
                Minimum exchange: $100 USD
              </Text>
            </View>
            <View style={styles.guideline}>
              <View style={styles.guidelineDot} />
              <Text style={styles.guidelineText}>
                Warning for amounts below 1,000 KSH
              </Text>
            </View>
            <View style={styles.guideline}>
              <View style={styles.guidelineDot} />
              <Text style={styles.guidelineText}>
                Transaction fee: ~1.5% of amount
              </Text>
            </View>
            <View style={styles.guideline}>
              <View style={styles.guidelineDot} />
              <Text style={styles.guidelineText}>
                Rates are updated based on market prices
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  content: {
    padding: 16,
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 20,
  },
  directionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  directionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  directionButtonActive: {
    backgroundColor: '#f5f3ff',
    borderColor: '#8b5cf6',
  },
  directionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  directionTextActive: {
    color: '#7c3aed',
  },
  swapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10,
  },
  required: {
    color: '#ef4444',
  },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  currencySymbol: {
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    height: '100%',
    textAlignVertical: 'center',
    paddingVertical: 18,
  },
  currencyInput: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'right',
  },
  rateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
  },
  rateIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1e293b',
  },
  rateUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 12,
  },
  rateHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    fontStyle: 'italic',
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#f5f3ff',
    shadowColor: '#8b5cf6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  resultCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7c3aed',
    marginBottom: 20,
  },
  resultDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  resultAmount: {
    flex: 1,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  resultValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  resultArrow: {
    marginHorizontal: 16,
  },
  validationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    marginBottom: 16,
  },
  validationError: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  validationWarning: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  validationSuccess: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  validationText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    color: '#dc2626',
  },
  quickInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  infoDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e2e8f0',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#8b5cf6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  helpCard: {
    backgroundColor: '#faf5ff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f3e8ff',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c3aed',
    marginBottom: 12,
  },
  guideline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  guidelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#a78bfa',
    marginRight: 12,
  },
  guidelineText: {
    fontSize: 14,
    color: '#6d28d9',
    flex: 1,
  },
});

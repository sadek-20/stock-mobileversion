import { useState } from 'react';
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
import { addCashEntry } from '../../utils/storage';
import { Banknote, Smartphone, CreditCard, Save } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function CashEntryScreen() {
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('Cash');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert(
        'Invalid Amount',
        'Please enter a valid amount greater than 0'
      );
      return;
    }

    setLoading(true);

    try {
      const amt = parseFloat(amount);
      await addCashEntry({
        amount: amt,
        paymentType,
        description: description.trim() || 'Cash Entry',
        date: new Date().toISOString(),
      });

      Alert.alert(
        'Success!',
        `Cash entry of ${amt.toLocaleString()} KSH recorded via ${paymentType}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setAmount('');
              setDescription('');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Operation Failed',
        'There was an error recording the cash entry. Please try again.'
      );
      console.error('Cash entry error:', error);
    } finally {
      setLoading(false);
    }
  };

  const paymentOptions = [
    { id: 'Cash', label: 'Cash', icon: Banknote, color: '#10b981' },
    { id: 'M-Pesa', label: 'M-Pesa', icon: Smartphone, color: '#06b6d4' },
    { id: 'Card', label: 'Card', icon: CreditCard, color: '#8b5cf6' },
  ];

  const formatAmount = (value) => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');

    // Handle multiple decimal points
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }

    return numericValue;
  };

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
            colors={['#3b82f6', '#2563eb']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.headerContent}>
              <Banknote size={32} color="#ffffff" />
              <Text style={styles.headerTitle}>Cash Entry</Text>
              <Text style={styles.headerSubtitle}>
                Record cash transactions
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.content}>
          {/* Amount Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Amount Details</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Amount (KSH) <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>KSH</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  value={amount}
                  onChangeText={(text) => setAmount(formatAmount(text))}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#94a3b8"
                  returnKeyType="done"
                />
              </View>
              {amount && (
                <Text style={styles.amountInWords}>
                  {Number(amount).toLocaleString('en-KE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  Kenyan Shillings
                </Text>
              )}
            </View>

            {/* Payment Type */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Payment Method</Text>
              <View style={styles.paymentGrid}>
                {paymentOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = paymentType === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.paymentOption,
                        isSelected && styles.paymentOptionSelected,
                      ]}
                      onPress={() => setPaymentType(option.id)}
                    >
                      <View
                        style={[
                          styles.paymentIconContainer,
                          isSelected && { backgroundColor: option.color },
                        ]}
                      >
                        <Icon
                          size={22}
                          color={isSelected ? '#ffffff' : option.color}
                        />
                      </View>
                      <Text
                        style={[
                          styles.paymentLabel,
                          isSelected && styles.paymentLabelSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {isSelected && (
                        <View
                          style={[
                            styles.selectionDot,
                            { backgroundColor: option.color },
                          ]}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., Sales revenue, Expense payment, Cash deposit..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                maxLength={200}
                placeholderTextColor="#94a3b8"
              />
              <Text style={styles.charCount}>
                {description.length}/200 characters
              </Text>
            </View>
          </View>

          {/* Recent Transactions Preview */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quick Info</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Today's Entries</Text>
                <Text style={styles.infoValue}>0</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Total Today</Text>
                <Text style={styles.infoValue}>KSH 0</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Most Used</Text>
                <Text style={styles.infoValue}>Cash</Text>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
              !amount && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading || !amount}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Save size={22} color="#ffffff" />
                <Text style={styles.submitButtonText}>Record Cash Entry</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Help Text */}
          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>💡 Quick Tips</Text>
            <Text style={styles.helpText}>
              • Record all cash inflows and outflows{'\n'}• Use descriptions for
              better tracking{'\n'}• Select the correct payment method{'\n'}•
              Review entries in the transactions history
            </Text>
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
  amountInputContainer: {
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
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    height: '100%',
    textAlignVertical: 'center',
    paddingVertical: 18,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'right',
  },
  amountInWords: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
    fontStyle: 'italic',
  },
  paymentGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  paymentOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    position: 'relative',
  },
  paymentOptionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    transform: [{ scale: 1.02 }],
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 4,
  },
  paymentLabelSelected: {
    color: '#1e40af',
    fontWeight: '700',
  },
  selectionDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  input: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: '#1e293b',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  charCount: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
    marginTop: 6,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    textAlign: 'center',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#10b981',
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
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#0c4a6e',
    lineHeight: 22,
  },
});

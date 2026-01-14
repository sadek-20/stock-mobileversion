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
  RefreshControl,
} from 'react-native';
import {
  Banknote,
  Smartphone,
  CreditCard,
  Save,
  TrendingUp,
  Calendar,
  Clock,
  List,
  ExternalLink,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCash } from '../../contexts/CashContext';
import { useNavigation } from '@react-navigation/native';

export default function CashEntryScreen() {
  const navigation = useNavigation();
  const { addCash, balance, transactions, fetchCash } = useCash();

  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('Cash');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate today's totals
  const calculateTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    let todayEntries = 0;
    let todayTotal = 0;
    let paymentCounts = {};

    if (transactions && Array.isArray(transactions)) {
      transactions.forEach((transaction) => {
        if (!transaction?.createdAt) return;

        const transactionDate = new Date(transaction.createdAt)
          .toISOString()
          .split('T')[0];

        if (transactionDate === today) {
          todayEntries++;
          todayTotal += transaction.amount || 0;

          // Count payment types
          const type = transaction.paymentType || 'Unknown';
          paymentCounts[type] = (paymentCounts[type] || 0) + 1;
        }
      });
    }

    // Find most used payment method today
    let mostUsed = 'None';
    let maxCount = 0;
    Object.entries(paymentCounts).forEach(([method, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostUsed = method;
      }
    });

    return { todayEntries, todayTotal, mostUsed };
  };

  const { todayEntries, todayTotal, mostUsed } = calculateTodayStats();

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert(
        'Invalid Amount',
        'Please enter a valid amount greater than 0'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const amt = parseFloat(amount);
      const result = await addCash({
        amount: amt,
        paymentType,
        description: description.trim() || `${paymentType} Entry`,
      });

      if (result.success) {
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
      } else {
        Alert.alert(
          'Operation Failed',
          result.message || 'Failed to record transaction'
        );
      }
    } catch (error) {
      Alert.alert(
        'Operation Failed',
        'There was an error recording the cash entry. Please try again.'
      );
      console.error('Cash entry error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    if (fetchCash) {
      setIsLoading(true);
      try {
        await fetchCash();
      } catch (error) {
        console.error('Failed to refresh:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const paymentOptions = [
    { id: 'Cash', label: 'Cash', icon: Banknote, color: '#10b981' },
    { id: 'M-Pesa', label: 'M-Pesa', icon: Smartphone, color: '#06b6d4' },
    { id: 'Card', label: 'Card', icon: CreditCard, color: '#8b5cf6' },
  ];

  const formatAmount = (value) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return numericValue;
  };

  // Get latest transactions for preview
  const recentTransactions = Array.isArray(transactions)
    ? transactions.slice(0, 3)
    : [];

  const handleViewAll = () => {
    if (navigation) {
      navigation.navigate('TransactionHistory');
    }
  };

  const handleTransactionPress = (transaction) => {
    // Navigate to transaction detail or show modal
    Alert.alert(
      'Transaction Details',
      `Amount: ${transaction.amount} KSH\nType: ${
        transaction.paymentType
      }\nDescription: ${transaction.description}\nDate: ${new Date(
        transaction.createdAt
      ).toLocaleString()}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={['#3b82f6']}
          />
        }
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
              <Text style={styles.headerTitle}>Cash Management</Text>
              <Text style={styles.headerSubtitle}>
                Balance:{' '}
                {(balance || 0).toLocaleString('en-KE', {
                  style: 'currency',
                  currency: 'KES',
                  minimumFractionDigits: 2,
                })}
              </Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefresh}
                disabled={isLoading}
              >
                <Text style={styles.refreshText}>
                  {isLoading ? 'Refreshing...' : 'Refresh Data'}
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.content}>
          {/* Amount Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Record New Transaction</Text>

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

          {/* Stats Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Today's Summary</Text>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={handleViewAll}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <ExternalLink size={14} color="#3b82f6" />
              </TouchableOpacity>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: '#f0f9ff' }]}>
                  <Calendar size={20} color="#0369a1" />
                </View>
                <Text style={styles.statLabel}>Entries</Text>
                <Text style={styles.statValue}>{todayEntries}</Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: '#f0fdf4' }]}>
                  <TrendingUp size={20} color="#059669" />
                </View>
                <Text style={styles.statLabel}>Total</Text>
                <Text style={styles.statValue}>
                  {todayTotal.toLocaleString('en-KE', {
                    style: 'currency',
                    currency: 'KES',
                    minimumFractionDigits: 0,
                  })}
                </Text>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                  <Clock size={20} color="#d97706" />
                </View>
                <Text style={styles.statLabel}>Most Used</Text>
                <Text style={[styles.statValue, { fontSize: 14 }]}>
                  {mostUsed}
                </Text>
              </View>
            </View>
          </View>

          {/* Recent Transactions Preview */}
          {recentTransactions.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Recent Transactions</Text>
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={handleViewAll}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                  <ExternalLink size={14} color="#3b82f6" />
                </TouchableOpacity>
              </View>
              {recentTransactions.map((transaction, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.transactionItem}
                  onPress={() => handleTransactionPress(transaction)}
                >
                  <View style={styles.transactionLeft}>
                    <View
                      style={[
                        styles.transactionIcon,
                        {
                          backgroundColor:
                            (transaction.amount || 0) > 0
                              ? '#dcfce7'
                              : '#fee2e2',
                        },
                      ]}
                    >
                      {(transaction.amount || 0) > 0 ? (
                        <TrendingUp size={16} color="#059669" />
                      ) : (
                        <TrendingUp
                          size={16}
                          color="#dc2626"
                          style={{ transform: [{ rotate: '90deg' }] }}
                        />
                      )}
                    </View>
                    <View>
                      <Text
                        style={styles.transactionDescription}
                        numberOfLines={1}
                      >
                        {transaction.description ||
                          `${transaction.paymentType || 'Unknown'} Transaction`}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {transaction.createdAt
                          ? new Date(transaction.createdAt).toLocaleDateString(
                              'en-KE',
                              {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )
                          : 'Unknown date'}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      (transaction.amount || 0) > 0
                        ? styles.positiveAmount
                        : styles.negativeAmount,
                    ]}
                  >
                    {(transaction.amount || 0) > 0 ? '+' : ''}
                    {(transaction.amount || 0).toLocaleString('en-KE', {
                      style: 'currency',
                      currency: 'KES',
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (isSubmitting || !amount) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || !amount}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Save size={22} color="#ffffff" />
                <Text style={styles.submitButtonText}>Record Cash Entry</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={handleViewAll}
            >
              <View
                style={[styles.quickActionIcon, { backgroundColor: '#3b82f6' }]}
              >
                <List size={24} color="#ffffff" />
              </View>
              <Text style={styles.quickActionText}>View All Transactions</Text>
            </TouchableOpacity>
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
    marginBottom: 8,
  },
  refreshButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    marginTop: 8,
  },
  refreshText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
    maxWidth: 200,
  },
  transactionDate: {
    fontSize: 12,
    color: '#64748b',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
  positiveAmount: {
    color: '#059669',
  },
  negativeAmount: {
    color: '#dc2626',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
    borderRadius: 16,
    marginBottom: 16,
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  quickActionButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
});

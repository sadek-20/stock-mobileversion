import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
  Animated,
  RefreshControl,
} from 'react-native';
import {
  Search,
  Filter,
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  Banknote,
  Smartphone,
  CreditCard,
  X,
  Info,
  ChevronLeft,
  Check,
  BarChart3,
  Wallet,
  Clock,
  Hash,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCash } from '../contexts/CashContext';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function TransactionHistoryScreen() {
  const navigation = useNavigation();
  const {
    transactions = {},
    balance = 0,
    fetchCash,
    loading = false,
  } = useCash();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    paymentType: 'all',
    dateRange: 'all',
    transactionType: 'all',
  });
  // removed sortOrder UI — always sort by newest
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Initialize with fade animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // Initialize filtered transactions
  useEffect(() => {
    const sourceData = transactions?.data || transactions || [];
    const sourceArray = Array.isArray(sourceData) ? sourceData : [];
    setFilteredTransactions(sourceArray);
  }, [transactions]);

  // Filter and sort transactions
  useEffect(() => {
    const sourceData = transactions?.data || transactions || [];
    let sourceArray = Array.isArray(sourceData) ? [...sourceData] : [];

    // Apply search filter
    if (searchQuery?.trim()) {
      sourceArray = sourceArray.filter(
        (transaction) =>
          transaction?.description
            ?.toLowerCase()
            ?.includes(searchQuery.toLowerCase()) ||
          transaction?.paymentType
            ?.toLowerCase()
            ?.includes(searchQuery.toLowerCase()) ||
          transaction?.notes?.toLowerCase()?.includes(searchQuery.toLowerCase())
      );
    }

    // Apply payment type filter
    if (selectedFilters.paymentType !== 'all') {
      sourceArray = sourceArray.filter((transaction) => {
        const transactionType = transaction?.paymentType || '';
        const filterType = selectedFilters.paymentType;
        return (
          transactionType.toLowerCase() === filterType.toLowerCase() ||
          transactionType.toLowerCase().replace('-', '') ===
            filterType.toLowerCase()
        );
      });
    }

    // Apply transaction type filter
    if (selectedFilters.transactionType !== 'all') {
      sourceArray = sourceArray.filter((transaction) => {
        const amount = transaction?.amount || 0;
        return selectedFilters.transactionType === 'income'
          ? amount > 0
          : amount < 0;
      });
    }

    // Apply date range filter
    if (selectedFilters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (selectedFilters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(filterDate.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(filterDate.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(filterDate.getFullYear() - 1);
          break;
      }

      sourceArray = sourceArray.filter((transaction) => {
        if (!transaction?.createdAt) return false;
        const transactionDate = new Date(transaction.createdAt);
        return transactionDate >= filterDate;
      });
    }

    // Always sort by newest (date descending)
    sourceArray.sort((a, b) => {
      const dateA = new Date(a?.createdAt || 0);
      const dateB = new Date(b?.createdAt || 0);
      return dateB - dateA;
    });

    setFilteredTransactions(sourceArray);
  }, [transactions, searchQuery, selectedFilters]);

  const onRefresh = async () => {
    if (!fetchCash) return;

    setRefreshing(true);
    try {
      await fetchCash();
    } catch (error) {
      console.error('Refresh error:', error);
      Alert.alert('Error', 'Failed to refresh transactions');
    } finally {
      setRefreshing(false);
    }
  };

  const calculateStats = () => {
    if (!Array.isArray(filteredTransactions)) {
      return {
        totalIncome: 0,
        totalExpense: 0,
        totalTransactions: 0,
        averageTransaction: 0,
        highestTransaction: 0,
        cashCount: 0,
        mpesaCount: 0,
        cardCount: 0,
      };
    }

    let totalIncome = 0;
    let totalExpense = 0;
    let cashCount = 0;
    let mpesaCount = 0;
    let cardCount = 0;
    let highestTransaction = 0;

    filteredTransactions.forEach((transaction) => {
      const amount = transaction?.amount || 0;
      const paymentType = transaction?.paymentType?.toLowerCase() || '';

      if (amount > 0) {
        totalIncome += amount;
      } else {
        totalExpense += Math.abs(amount);
      }

      if (Math.abs(amount) > highestTransaction) {
        highestTransaction = Math.abs(amount);
      }

      if (paymentType.includes('cash')) cashCount++;
      else if (paymentType.includes('mpesa') || paymentType.includes('pesa'))
        mpesaCount++;
      else if (paymentType.includes('card')) cardCount++;
    });

    const totalTransactions = filteredTransactions.length;
    const averageTransaction =
      totalTransactions > 0
        ? (totalIncome + totalExpense) / totalTransactions
        : 0;

    return {
      totalIncome,
      totalExpense,
      totalTransactions,
      averageTransaction,
      highestTransaction,
      cashCount,
      mpesaCount,
      cardCount,
    };
  };

  const stats = calculateStats();

  const getPaymentIcon = (type) => {
    if (!type) return Banknote;
    const typeLower = type.toLowerCase();
    if (typeLower.includes('cash')) return Banknote;
    if (typeLower.includes('mpesa') || typeLower.includes('pesa'))
      return Smartphone;
    if (typeLower.includes('card')) return CreditCard;
    return Banknote;
  };

  const getPaymentColor = (type) => {
    if (!type) return '#64748b';
    const typeLower = type.toLowerCase();
    if (typeLower.includes('cash')) return '#10b981';
    if (typeLower.includes('mpesa') || typeLower.includes('pesa'))
      return '#06b6d4';
    if (typeLower.includes('card')) return '#8b5cf6';
    return '#64748b';
  };

  const formatCurrency = (amount) => {
    return (amount || 0).toLocaleString('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    });
  };

  const formatDetailedCurrency = (amount) => {
    return (amount || 0).toLocaleString('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return (
          'Today, ' +
          date.toLocaleTimeString('en-KE', {
            hour: '2-digit',
            minute: '2-digit',
          })
        );
      } else if (diffDays === 1) {
        return (
          'Yesterday, ' +
          date.toLocaleTimeString('en-KE', {
            hour: '2-digit',
            minute: '2-digit',
          })
        );
      } else if (diffDays < 7) {
        return date.toLocaleDateString('en-KE', {
          weekday: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });
      } else {
        return date.toLocaleDateString('en-KE', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch (error) {
      return 'Invalid date';
    }
  };

  const renderTransactionItem = ({ item, index }) => {
    const Icon = getPaymentIcon(item?.paymentType);
    const iconColor = getPaymentColor(item?.paymentType);
    const amount = item?.amount || 0;
    const isIncome = amount > 0;
    const paymentType = item?.paymentType || 'Unknown';
    const description = item?.description || `${paymentType} Transaction`;

    return (
      <Animated.View
        style={[
          styles.transactionCard,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.transactionContent}
          onPress={() => {
            setSelectedTransaction(item);
            setDetailModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.transactionLeft}>
            <View
              style={[
                styles.transactionIconContainer,
                { backgroundColor: isIncome ? '#dcfce710' : '#fee2e210' },
              ]}
            >
              <View
                style={[
                  styles.transactionIcon,
                  { backgroundColor: iconColor + '20' },
                ]}
              >
                <Icon size={20} color={iconColor} />
              </View>
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionDescription} numberOfLines={1}>
                {description}
              </Text>
              <View style={styles.transactionMeta}>
                <View style={styles.transactionMetaItem}>
                  <Clock size={12} color="#94a3b8" />
                  <Text style={styles.transactionDate}>
                    {formatDate(item?.createdAt)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.paymentTypeBadge,
                    { backgroundColor: iconColor + '10' },
                  ]}
                >
                  <Text style={[styles.paymentTypeText, { color: iconColor }]}>
                    {paymentType}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.transactionRight}>
            <Text
              style={[
                styles.transactionAmount,
                isIncome ? styles.positiveAmount : styles.negativeAmount,
              ]}
            >
              {isIncome ? '+' : '-'}
              {formatCurrency(Math.abs(amount))}
            </Text>
            <View style={styles.transactionStatus}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isIncome ? '#10b981' : '#ef4444' },
                ]}
              />
              <Text style={styles.statusText}>
                {isIncome ? 'Income' : 'Expense'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        {item?.notes && (
          <View style={styles.notesPreview}>
            <Info size={14} color="#94a3b8" />
            <Text style={styles.notesPreviewText} numberOfLines={1}>
              {item.notes}
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyStateIcon}>
        <Wallet size={80} color="#cbd5e1" />
      </View>
      <Text style={styles.emptyStateTitle}>No transactions yet</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery ||
        selectedFilters.paymentType !== 'all' ||
        selectedFilters.dateRange !== 'all'
          ? 'No transactions match your search criteria'
          : 'Start recording your financial transactions to see them here'}
      </Text>
      {(searchQuery ||
        selectedFilters.paymentType !== 'all' ||
        selectedFilters.dateRange !== 'all') && (
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={() => {
            setSearchQuery('');
            setSelectedFilters({
              paymentType: 'all',
              dateRange: 'all',
              transactionType: 'all',
            });
          }}
        >
          <Text style={styles.emptyStateButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderListHeader = () => (
    <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
      {/* Header */}
      <LinearGradient
        colors={['#3b82f6', '#2563eb']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <ChevronLeft size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Transaction History</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => setStatsModalVisible(true)}
              >
                <BarChart3 size={22} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => {}}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Download size={22} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Wallet size={20} color="#ffffff" />
            </View>
            <Text style={styles.balanceAmount}>
              {formatDetailedCurrency(balance)}
            </Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <TrendingUp size={16} color="#86efac" />
                <Text style={styles.positiveText}>
                  {formatCurrency(stats.totalIncome)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryItem}>
                <TrendingDown size={16} color="#fca5a5" />
                <Text style={styles.negativeText}>
                  {formatCurrency(stats.totalExpense)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Filter size={20} color="#3b82f6" />
          {(selectedFilters.paymentType !== 'all' ||
            selectedFilters.dateRange !== 'all' ||
            selectedFilters.transactionType !== 'all') && (
            <View style={styles.filterBadge} />
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalTransactions}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, styles.statCardIncome]}>
          <Text style={[styles.statValue, styles.statValueIncome]}>
            {formatCurrency(stats.totalIncome)}
          </Text>
          <Text style={styles.statLabel}>Income</Text>
        </View>
        <View style={[styles.statCard, styles.statCardExpense]}>
          <Text style={[styles.statValue, styles.statValueExpense]}>
            {formatCurrency(stats.totalExpense)}
          </Text>
          <Text style={styles.statLabel}>Expense</Text>
        </View>
      </View>

      {/* List header */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Recent Transactions</Text>
        <Text style={styles.listCount}>
          {filteredTransactions.length} transactions
        </Text>
      </View>
    </Animated.View>
  );

  const renderListEmpty = () =>
    loading && !refreshing ? (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    ) : (
      renderEmptyState()
    );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3b82f6" />
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item, index) =>
          item?._id || item?.id || `transaction-${index}`
        }
        ListHeaderComponent={renderListHeader}
        ListHeaderComponentStyle={{ backgroundColor: '#ffffff' }}
        ListEmptyComponent={renderListEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
      />

      {/* Transaction Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <View style={styles.detailModal}>
              {selectedTransaction && (
                <>
                  <View style={styles.detailHeader}>
                    <View
                      style={[
                        styles.detailIcon,
                        {
                          backgroundColor:
                            getPaymentColor(selectedTransaction.paymentType) +
                            '20',
                        },
                      ]}
                    >
                      {React.createElement(
                        getPaymentIcon(selectedTransaction.paymentType),
                        {
                          size: 30,
                          color: getPaymentColor(
                            selectedTransaction.paymentType
                          ),
                        }
                      )}
                    </View>
                    <Text style={styles.detailAmount}>
                      {formatDetailedCurrency(
                        Math.abs(selectedTransaction.amount || 0)
                      )}
                    </Text>
                    <Text
                      style={[
                        styles.detailType,
                        {
                          color:
                            (selectedTransaction.amount || 0) > 0
                              ? '#10b981'
                              : '#ef4444',
                        },
                      ]}
                    >
                      {(selectedTransaction.amount || 0) > 0
                        ? 'INCOME'
                        : 'EXPENSE'}
                    </Text>
                  </View>

                  <View style={styles.detailContent}>
                    <DetailRow
                      label="Description"
                      value={
                        selectedTransaction.description || 'No description'
                      }
                    />
                    <DetailRow
                      label="Payment Method"
                      value={selectedTransaction.paymentType || 'Unknown'}
                    />
                    <DetailRow
                      label="Date"
                      value={formatDate(selectedTransaction.createdAt)}
                    />
                    {selectedTransaction.notes && (
                      <DetailRow
                        label="Notes"
                        value={selectedTransaction.notes}
                      />
                    )}
                  </View>

                  <View style={styles.detailActions}>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setDetailModalVisible(false)}
                    >
                      <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Statistics Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={statsModalVisible}
        onRequestClose={() => setStatsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <View style={styles.statsModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Transaction Statistics</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setStatsModalVisible(false)}
                >
                  <X size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.statsContent}
                showsVerticalScrollIndicator={false}
              >
                <StatCard
                  title="Total Transactions"
                  value={stats.totalTransactions.toString()}
                  icon={<Hash size={24} color="#3b82f6" />}
                />
                <StatCard
                  title="Total Income"
                  value={formatCurrency(stats.totalIncome)}
                  icon={<TrendingUp size={24} color="#10b981" />}
                />
                <StatCard
                  title="Total Expense"
                  value={formatCurrency(stats.totalExpense)}
                  icon={<TrendingDown size={24} color="#ef4444" />}
                />
                <StatCard
                  title="Average Transaction"
                  value={formatCurrency(stats.averageTransaction)}
                  icon={<BarChart3 size={24} color="#8b5cf6" />}
                />
                <StatCard
                  title="Highest Transaction"
                  value={formatCurrency(stats.highestTransaction)}
                  icon={<TrendingUp size={24} color="#f59e0b" />}
                />

                <Text style={styles.paymentStatsTitle}>Payment Methods</Text>
                <View style={styles.paymentStats}>
                  <PaymentStat
                    type="Cash"
                    count={stats.cashCount}
                    color="#10b981"
                  />
                  <PaymentStat
                    type="M-Pesa"
                    count={stats.mpesaCount}
                    color="#06b6d4"
                  />
                  <PaymentStat
                    type="Card"
                    count={stats.cardCount}
                    color="#8b5cf6"
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// Helper Components
const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const StatCard = ({ title, value, icon }) => (
  <View style={styles.statCardModal}>
    <View style={styles.statCardLeft}>
      {icon}
      <Text style={styles.statCardTitle}>{title}</Text>
    </View>
    <Text style={styles.statCardValue}>{value}</Text>
  </View>
);

const PaymentStat = ({ type, count, color }) => (
  <View style={styles.paymentStat}>
    <View style={[styles.paymentDot, { backgroundColor: color }]} />
    <Text style={styles.paymentType}>{type}</Text>
    <Text style={styles.paymentCount}>{count}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    top: 20,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerContent: {
    paddingHorizontal: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 12,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 20,
    padding: 20,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.92)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  balanceAmount: {
    fontSize: 38,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 16,
    letterSpacing: -0.8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  positiveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#a7f3d0',
  },
  negativeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fecaca',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  filterButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardIncome: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  statCardExpense: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statValueIncome: {
    color: '#059669',
  },
  statValueExpense: {
    color: '#dc2626',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  listCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  transactionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  transactionContent: {
    padding: 18,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  transactionIconContainer: {
    marginRight: 14,
    marginTop: 2,
  },
  transactionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
    lineHeight: 20,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  transactionMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  paymentTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  paymentTypeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    lineHeight: 24,
  },
  positiveAmount: {
    color: '#059669',
  },
  negativeAmount: {
    color: '#dc2626',
  },
  transactionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  notesPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  notesPreviewText: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    paddingTop: 80,
  },
  emptyStateIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
    lineHeight: 28,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 28,
    maxWidth: 300,
    lineHeight: 22,
  },
  emptyStateButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: '#3b82f6',
    borderRadius: 14,
  },
  emptyStateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  detailModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    paddingTop: 24,
  },
  detailHeader: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  detailAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  detailType: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailContent: {
    padding: 24,
  },
  detailRow: {
    marginBottom: 22,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    lineHeight: 22,
  },
  detailActions: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  closeButton: {
    paddingVertical: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  statsModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    paddingTop: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContent: {
    padding: 24,
    paddingBottom: 40,
  },
  statCardModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3b82f6',
  },
  paymentStatsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 28,
    marginBottom: 18,
    letterSpacing: -0.3,
  },
  paymentStats: {
    gap: 14,
  },
  paymentStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  paymentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 14,
  },
  paymentType: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  paymentCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b82f6',
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl as RC,
} from 'react-native';
import {
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  Download,
  TrendingUp,
  Banknote,
  Smartphone,
  CreditCard,
  X,
  Info,
  ChevronLeft,
  Check,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCash } from '../contexts/CashContext';
import { useNavigation } from '@react-navigation/native';

export default function TransactionHistoryScreen() {
  const navigation = useNavigation();
  const {
    transactions = [],
    balance = 0,
    fetchCash,
    loading = false,
  } = useCash();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    paymentType: 'all',
    dateRange: 'all',
    transactionType: 'all',
  });
  const [sortOrder, setSortOrder] = useState('newest');
  const [isDownloading, setIsDownloading] = useState(false);

  // Initialize filtered transactions
  useEffect(() => {
    setFilteredTransactions(transactions);
  }, [transactions]);

  // Filter and sort transactions
  useEffect(() => {
    if (!Array.isArray(transactions)) return;

    let result = [...transactions];

    // Apply search filter
    if (searchQuery.trim()) {
      result = result.filter(
        (transaction) =>
          (transaction.description?.toLowerCase() || '').includes(
            searchQuery.toLowerCase()
          ) ||
          (transaction.paymentType?.toLowerCase() || '').includes(
            searchQuery.toLowerCase()
          )
      );
    }

    // Apply payment type filter
    if (selectedFilters.paymentType !== 'all') {
      result = result.filter(
        (transaction) => transaction.paymentType === selectedFilters.paymentType
      );
    }

    // Apply transaction type filter
    if (selectedFilters.transactionType !== 'all') {
      result = result.filter((transaction) =>
        selectedFilters.transactionType === 'income'
          ? (transaction.amount || 0) > 0
          : (transaction.amount || 0) < 0
      );
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
      }

      result = result.filter((transaction) => {
        if (!transaction.createdAt) return false;
        const transactionDate = new Date(transaction.createdAt);
        return transactionDate >= filterDate;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      const amountA = Math.abs(a.amount || 0);
      const amountB = Math.abs(b.amount || 0);

      switch (sortOrder) {
        case 'newest':
          return dateB - dateA;
        case 'oldest':
          return dateA - dateB;
        case 'highest':
          return amountB - amountA;
        case 'lowest':
          return amountA - amountB;
        default:
          return 0;
      }
    });

    setFilteredTransactions(result);
  }, [transactions, searchQuery, selectedFilters, sortOrder]);

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

  const handleBack = () => {
    if (navigation) {
      navigation.goBack();
    }
  };

  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      // Simulate download process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Prepare data for download
      const exportData = filteredTransactions.map((t) => ({
        Amount: t.amount || 0,
        Type: t.amount > 0 ? 'Income' : 'Expense',
        'Payment Method': t.paymentType || 'Unknown',
        Description: t.description || '',
        Date: new Date(t.createdAt).toLocaleString(),
        Notes: t.notes || '',
      }));

      // In a real app, you would save this as CSV or PDF
      Alert.alert(
        'Export Ready',
        `Exported ${exportData.length} transactions.\n\n(In a real app, this would download a CSV file)`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Export Failed', 'Failed to export transactions');
      console.error('Export error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const getPaymentIcon = (type) => {
    switch (type) {
      case 'Cash':
        return Banknote;
      case 'M-Pesa':
        return Smartphone;
      case 'Card':
        return CreditCard;
      default:
        return Banknote;
    }
  };

  const getPaymentColor = (type) => {
    switch (type) {
      case 'Cash':
        return '#10b981';
      case 'M-Pesa':
        return '#06b6d4';
      case 'Card':
        return '#8b5cf6';
      default:
        return '#64748b';
    }
  };

  const calculateSummary = () => {
    let totalIncome = 0;
    let totalExpense = 0;

    filteredTransactions.forEach((transaction) => {
      const amount = transaction.amount || 0;
      if (amount > 0) {
        totalIncome += amount;
      } else {
        totalExpense += Math.abs(amount);
      }
    });

    return { totalIncome, totalExpense };
  };

  const { totalIncome, totalExpense } = calculateSummary();

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-KE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const renderTransactionItem = ({ item, index }) => {
    const Icon = getPaymentIcon(item.paymentType);
    const iconColor = getPaymentColor(item.paymentType);
    const isIncome = (item.amount || 0) > 0;

    return (
      <TouchableOpacity
        style={styles.transactionCard}
        onPress={() => {
          Alert.alert(
            'Transaction Details',
            `Amount: ${(item.amount || 0).toLocaleString('en-KE', {
              style: 'currency',
              currency: 'KES',
              minimumFractionDigits: 2,
            })}\n\nType: ${item.paymentType || 'Unknown'}\n\nDescription: ${
              item.description || 'No description'
            }\n\nDate: ${formatDate(item.createdAt)}\n\n${
              item.notes ? `Notes: ${item.notes}` : ''
            }`,
            [{ text: 'OK' }]
          );
        }}
        activeOpacity={0.7}
      >
        <View style={styles.transactionHeader}>
          <View style={styles.transactionLeft}>
            <View
              style={[
                styles.transactionIcon,
                { backgroundColor: isIncome ? '#dcfce7' : '#fee2e2' },
              ]}
            >
              <Icon size={18} color={iconColor} />
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionDescription} numberOfLines={1}>
                {item.description ||
                  `${item.paymentType || 'Unknown'} Transaction`}
              </Text>
              <View style={styles.transactionMeta}>
                <Text style={styles.transactionDate}>
                  {formatDate(item.createdAt)}
                </Text>
                <View
                  style={[
                    styles.paymentTypeBadge,
                    { backgroundColor: `${iconColor}20` },
                  ]}
                >
                  <Text style={[styles.paymentTypeText, { color: iconColor }]}>
                    {item.paymentType || 'Unknown'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <Text
            style={[
              styles.transactionAmount,
              isIncome ? styles.positiveAmount : styles.negativeAmount,
            ]}
          >
            {isIncome ? '+' : '-'}
            {Math.abs(item.amount || 0).toLocaleString('en-KE', {
              style: 'currency',
              currency: 'KES',
              minimumFractionDigits: 2,
            })}
          </Text>
        </View>
        {item.notes && (
          <View style={styles.notesContainer}>
            <Info size={14} color="#64748b" />
            <Text style={styles.notesText} numberOfLines={2}>
              {item.notes}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const clearFilters = () => {
    setSelectedFilters({
      paymentType: 'all',
      dateRange: 'all',
      transactionType: 'all',
    });
    setSearchQuery('');
    setSortOrder('newest');
  };

  const handleApplyFilters = () => {
    setFilterModalVisible(false);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Calendar size={64} color="#cbd5e1" />
      <Text style={styles.emptyStateTitle}>No transactions found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery ||
        selectedFilters.paymentType !== 'all' ||
        selectedFilters.dateRange !== 'all'
          ? 'Try adjusting your search or filters'
          : 'Start by recording your first transaction in the Cash Entry screen'}
      </Text>
      {(searchQuery ||
        selectedFilters.paymentType !== 'all' ||
        selectedFilters.dateRange !== 'all') && (
        <TouchableOpacity
          style={styles.emptyStateButton}
          onPress={clearFilters}
        >
          <Text style={styles.emptyStateButtonText}>Clear All Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const handleFilterChange = (filterType, value) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transaction History</Text>
          <TouchableOpacity
            style={[
              styles.downloadButton,
              isDownloading && styles.downloadButtonDisabled,
            ]}
            onPress={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Download size={22} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>
            {(balance || 0).toLocaleString('en-KE', {
              style: 'currency',
              currency: 'KES',
              minimumFractionDigits: 2,
            })}
          </Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <TrendingUp size={16} color="#059669" />
              <Text style={[styles.summaryText, styles.positiveText]}>
                +
                {totalIncome.toLocaleString('en-KE', {
                  style: 'currency',
                  currency: 'KES',
                  minimumFractionDigits: 0,
                })}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <TrendingUp
                size={16}
                color="#dc2626"
                style={{ transform: [{ rotate: '90deg' }] }}
              />
              <Text style={[styles.summaryText, styles.negativeText]}>
                -
                {totalExpense.toLocaleString('en-KE', {
                  style: 'currency',
                  currency: 'KES',
                  minimumFractionDigits: 0,
                })}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Search and Filter Bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
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
        </TouchableOpacity>
      </View>

      {/* Sort Options */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sortContainer}
        contentContainerStyle={styles.sortContent}
      >
        {['newest', 'oldest', 'highest', 'lowest'].map((sort) => (
          <TouchableOpacity
            key={sort}
            style={[
              styles.sortButton,
              sortOrder === sort && styles.sortButtonActive,
            ]}
            onPress={() => setSortOrder(sort)}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortOrder === sort && styles.sortButtonTextActive,
              ]}
            >
              {sort.charAt(0).toUpperCase() + sort.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Active Filters */}
      {(selectedFilters.paymentType !== 'all' ||
        selectedFilters.dateRange !== 'all' ||
        selectedFilters.transactionType !== 'all' ||
        searchQuery) && (
        <View style={styles.activeFilters}>
          <Text style={styles.activeFiltersTitle}>Active Filters:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterChips}>
              {selectedFilters.paymentType !== 'all' && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>
                    Payment: {selectedFilters.paymentType}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleFilterChange('paymentType', 'all')}
                  >
                    <X size={14} color="#64748b" />
                  </TouchableOpacity>
                </View>
              )}
              {selectedFilters.dateRange !== 'all' && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>
                    Date: {selectedFilters.dateRange}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleFilterChange('dateRange', 'all')}
                  >
                    <X size={14} color="#64748b" />
                  </TouchableOpacity>
                </View>
              )}
              {selectedFilters.transactionType !== 'all' && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>
                    Type: {selectedFilters.transactionType}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleFilterChange('transactionType', 'all')}
                  >
                    <X size={14} color="#64748b" />
                  </TouchableOpacity>
                </View>
              )}
              {searchQuery && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>
                    Search: "{searchQuery}"
                  </Text>
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={14} color="#64748b" />
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Transaction Count */}
      <View style={styles.transactionCount}>
        <Text style={styles.transactionCountText}>
          {filteredTransactions.length} transaction
          {filteredTransactions.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Transactions List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : filteredTransactions.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item, index) =>
            `${item.id || index}-${item.createdAt || Date.now()}`
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RC
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3b82f6']}
              tintColor="#3b82f6"
            />
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Transactions</Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={styles.modalClose}
              >
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterOptions}>
              {/* Payment Type Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Payment Type</Text>
                {['all', 'Cash', 'M-Pesa', 'Card'].map((type) => {
                  const Icon = getPaymentIcon(type);
                  return (
                    <TouchableOpacity
                      key={type}
                      style={styles.filterOption}
                      onPress={() => handleFilterChange('paymentType', type)}
                    >
                      <View style={styles.filterOptionLeft}>
                        {type !== 'all' && (
                          <View
                            style={[
                              styles.filterIcon,
                              { backgroundColor: `${getPaymentColor(type)}20` },
                            ]}
                          >
                            <Icon size={18} color={getPaymentColor(type)} />
                          </View>
                        )}
                        <Text style={styles.filterOptionText}>
                          {type === 'all' ? 'All Payment Methods' : type}
                        </Text>
                      </View>
                      {selectedFilters.paymentType === type && (
                        <Check size={20} color="#3b82f6" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Transaction Type Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Transaction Type</Text>
                {['all', 'income', 'expense'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.filterOption}
                    onPress={() => handleFilterChange('transactionType', type)}
                  >
                    <Text style={styles.filterOptionText}>
                      {type === 'all'
                        ? 'All Transactions'
                        : type === 'income'
                        ? 'Income Only'
                        : 'Expense Only'}
                    </Text>
                    {selectedFilters.transactionType === type && (
                      <Check size={20} color="#3b82f6" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Date Range Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Date Range</Text>
                {['all', 'today', 'week', 'month'].map((range) => (
                  <TouchableOpacity
                    key={range}
                    style={styles.filterOption}
                    onPress={() => handleFilterChange('dateRange', range)}
                  >
                    <View style={styles.filterOptionLeft}>
                      <Calendar size={18} color="#64748b" />
                      <Text style={styles.filterOptionText}>
                        {range === 'all'
                          ? 'All Time'
                          : range === 'today'
                          ? 'Today'
                          : range === 'week'
                          ? 'Last 7 Days'
                          : 'Last 30 Days'}
                      </Text>
                    </View>
                    {selectedFilters.dateRange === range && (
                      <Check size={20} color="#3b82f6" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalApply}
                onPress={handleApplyFilters}
              >
                <Text style={styles.modalApplyText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButtonDisabled: {
    opacity: 0.5,
  },
  balanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  positiveText: {
    color: '#86efac',
  },
  negativeText: {
    color: '#fca5a5',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  sortContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sortContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  sortButtonActive: {
    backgroundColor: '#3b82f6',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  sortButtonTextActive: {
    color: '#ffffff',
  },
  activeFilters: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  activeFiltersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipText: {
    fontSize: 12,
    color: '#64748b',
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearAllText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
  transactionCount: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  transactionCountText: {
    fontSize: 14,
    color: '#64748b',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  transactionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  transactionDate: {
    fontSize: 12,
    color: '#64748b',
  },
  paymentTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  paymentTypeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  positiveAmount: {
    color: '#059669',
  },
  negativeAmount: {
    color: '#dc2626',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  notesText: {
    flex: 1,
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterOptions: {
    maxHeight: 400,
  },
  filterSection: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  filterOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#1e293b',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  modalApply: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    alignItems: 'center',
  },
  modalApplyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

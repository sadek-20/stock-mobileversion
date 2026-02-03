import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  RefreshControl,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  CreditCard,
  Plus,
  User,
  Phone,
  Calendar,
  Clock,
  Trash2,
  Edit,
  CheckCircle,
  ChevronRight,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDebts } from '../../contexts/DebtsContext';

export default function DebtsScreen() {
  const { debts, loading, fetchDebts, createDebt, updateDebt, deleteDebt } =
    useDebts();

  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerContact: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
  });

  const [dateField, setDateField] = useState('date');

  const loadDebts = async () => {
    try {
      await fetchDebts();
    } catch (error) {
      Alert.alert('Error', 'Failed to load debts');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDebts();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDebts();
    setRefreshing(false);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      handleInputChange(dateField, selectedDate.toISOString().split('T')[0]);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleAddDebt = async () => {
    if (
      !formData.customerName.trim() ||
      !formData.amount ||
      parseFloat(formData.amount) <= 0
    ) {
      Alert.alert('Error', 'Please enter valid customer name and amount');
      return;
    }

    try {
      const debtData = {
        customerName: formData.customerName,
        customerContact: formData.customerContact,
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: formData.date,
        dueDate: formData.dueDate,
        status: 'PENDING', // Uppercase as per your data
      };

      const res = await createDebt(debtData);

      if (!res || !res.success) {
        throw new Error(res?.message || 'Failed to add debt');
      }

      Alert.alert('Success', 'Debt added successfully');
      resetForm();
      setShowAddForm(false);
      await loadDebts();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add debt');
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerContact: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
    });
    setSelectedDebt(null);
  };

  const handleEditDebt = (debt) => {
    setSelectedDebt(debt);
    setFormData({
      customerName: debt.customerName || '',
      customerContact: debt.customerContact || '',
      amount: debt.amount ? debt.amount.toString() : '',
      description: debt.description || '',
      date: debt.date
        ? debt.date.split('T')[0]
        : new Date().toISOString().split('T')[0],
      dueDate: debt.dueDate
        ? debt.dueDate.split('T')[0]
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
    });
    setShowAddForm(true);
  };

  const handleUpdateDebt = async () => {
    if (!selectedDebt) return;

    try {
      const res = await updateDebt(selectedDebt.id, {
        customerName: formData.customerName,
        customerContact: formData.customerContact,
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: formData.date,
        dueDate: formData.dueDate,
      });

      if (!res || !res.success) {
        throw new Error(res?.message || 'Failed to update debt');
      }

      Alert.alert('Success', 'Debt updated successfully');
      resetForm();
      setShowAddForm(false);
      await loadDebts();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update debt');
    }
  };

  const handleMarkPaid = async (debt) => {
    Alert.alert(
      'Mark as Paid',
      `Mark ${debt.customerName}'s debt of KSH ${debt.amount} as paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Paid',
          onPress: async () => {
            try {
              const res = await updateDebt(debt.id, {
                status: 'PAID',
                paidAt: new Date().toISOString(),
                amountPaid: debt.amount,
              });

              if (!res || !res.success) {
                throw new Error(res?.message || 'Failed to update debt');
              }

              await loadDebts();
              Alert.alert('Success', 'Debt marked as paid');
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to update debt');
            }
          },
        },
      ],
    );
  };

  const handleDeleteDebt = async (debt) => {
    Alert.alert(
      'Delete Debt',
      `Are you sure you want to delete ${debt.customerName}'s debt?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await deleteDebt(debt.id);

              if (!res || !res.success) {
                throw new Error(res?.message || 'Failed to delete debt');
              }

              await loadDebts();
              Alert.alert('Success', 'Debt deleted successfully');
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete debt');
            }
          },
        },
      ],
    );
  };

  const totalPending = debts
    .filter((d) => d.status === 'PENDING')
    .reduce((sum, debt) => sum + (debt.amount || 0), 0);

  const totalPaid = debts
    .filter((d) => d.status === 'PAID')
    .reduce((sum, debt) => sum + (debt.amount || 0), 0);

  const overdueDebts = debts.filter((debt) => {
    if (debt.status === 'PENDING' && debt.dueDate) {
      const daysRemaining = getDaysRemaining(debt.dueDate);
      return daysRemaining < 0;
    }
    return false;
  });

  const renderDebtItem = ({ item }) => {
    const daysRemaining = getDaysRemaining(item.dueDate);
    const isOverdue =
      daysRemaining !== null && daysRemaining < 0 && item.status === 'PENDING';
    const isDueSoon =
      daysRemaining !== null &&
      daysRemaining >= 0 &&
      daysRemaining <= 3 &&
      item.status === 'PENDING';
    const isPaid = item.status === 'PAID';

    return (
      <View
        style={[
          styles.debtCard,
          isPaid && styles.debtCardPaid,
          isOverdue && styles.debtCardOverdue,
          isDueSoon && styles.debtCardDueSoon,
        ]}
      >
        <View style={styles.debtHeader}>
          <View style={styles.debtPerson}>
            <View
              style={[
                styles.statusIndicator,
                isPaid
                  ? styles.statusPaid
                  : isOverdue
                    ? styles.statusOverdue
                    : isDueSoon
                      ? styles.statusDueSoon
                      : styles.statusPending,
              ]}
            >
              <User size={16} color={isPaid ? '#ffffff' : '#ffffff'} />
            </View>
            <Text
              style={[styles.debtName, isPaid && styles.debtNamePaid]}
              numberOfLines={1}
            >
              {item.customerName || 'Unknown Customer'}
            </Text>
          </View>
          <Text
            style={[
              styles.debtAmount,
              isPaid && styles.debtAmountPaid,
              isOverdue && styles.debtAmountOverdue,
            ]}
          >
            KSH {(item.amount || 0).toLocaleString()}
          </Text>
        </View>

        {item.customerContact && (
          <View style={styles.debtDetail}>
            <Phone size={14} color="#94a3b8" />
            <Text style={styles.debtDetailText}>{item.customerContact}</Text>
          </View>
        )}

        {item.description && (
          <Text style={styles.debtDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.debtMeta}>
          <View style={styles.metaItem}>
            <Calendar size={12} color="#94a3b8" />
            <Text style={styles.metaText}>
              {item.date ? formatDate(item.date) : 'No date'}
            </Text>
          </View>

          {item.dueDate && item.status === 'PENDING' && (
            <View style={styles.metaItem}>
              <Clock
                size={12}
                color={
                  isOverdue ? '#ef4444' : isDueSoon ? '#f59e0b' : '#94a3b8'
                }
              />
              <Text
                style={[
                  styles.metaText,
                  isOverdue && styles.overdueText,
                  isDueSoon && styles.dueSoonText,
                ]}
              >
                {isOverdue
                  ? `Overdue ${Math.abs(daysRemaining)}d`
                  : daysRemaining === 0
                    ? 'Due today'
                    : `Due in ${daysRemaining}d`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.debtFooter}>
          <View style={styles.statusBadge}>
            {isPaid ? (
              <View style={styles.paidBadge}>
                <CheckCircle size={14} color="#059669" />
                <Text style={styles.paidBadgeText}>PAID</Text>
              </View>
            ) : (
              <View
                style={[
                  styles.pendingBadge,
                  isOverdue && styles.overdueBadge,
                  isDueSoon && styles.dueSoonBadge,
                ]}
              >
                <Text
                  style={[
                    styles.pendingBadgeText,
                    isOverdue && styles.overdueBadgeText,
                    isDueSoon && styles.dueSoonBadgeText,
                  ]}
                >
                  {isOverdue ? 'OVERDUE' : 'PENDING'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actionButtons}>
            {item.status === 'PENDING' && (
              <TouchableOpacity
                style={styles.paidButton}
                onPress={() => handleMarkPaid(item)}
              >
                <CheckCircle size={16} color="#ffffff" />
                <Text style={styles.paidButtonText}>Mark Paid</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditDebt(item)}
            >
              <Edit size={16} color="#3b82f6" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteDebt(item)}
            >
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#7c3aed', '#6d28d9']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <CreditCard size={32} color="#ffffff" />
          <Text style={styles.headerTitle}>Debt Management</Text>
          <Text style={styles.headerSubtitle}>
            Track and manage outstanding debts
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Debts</Text>
            <Text style={styles.statValue}>{debts.length}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={[styles.statValue, styles.pendingAmount]}>
              KSH {totalPending.toLocaleString()}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Paid</Text>
            <Text style={[styles.statValue, styles.paidAmount]}>
              KSH {totalPaid.toLocaleString()}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={debts}
        renderItem={renderDebtItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#7c3aed']}
            tintColor="#7c3aed"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <CreditCard size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Debts Recorded</Text>
            <Text style={styles.emptySubtitle}>
              Add your first debt to start tracking
            </Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={() => setShowAddForm(true)}
            >
              <Plus size={20} color="#ffffff" />
              <Text style={styles.addFirstButtonText}>Add First Debt</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Add/Edit Debt Modal */}
      <Modal
        visible={showAddForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAddForm(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalTitle}>
                {selectedDebt ? 'Edit Debt' : 'Add New Debt'}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Customer Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter customer name"
                  value={formData.customerName}
                  onChangeText={(text) =>
                    handleInputChange('customerName', text)
                  }
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter phone number"
                  value={formData.customerContact}
                  onChangeText={(text) =>
                    handleInputChange('customerContact', text)
                  }
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount (KSH) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChangeText={(text) => handleInputChange('amount', text)}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.dateRow}>
                <View style={styles.dateInputGroup}>
                  <Text style={styles.inputLabel}>Date</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => {
                      setDateField('date');
                      setShowDatePicker(true);
                    }}
                  >
                    <Calendar size={18} color="#64748b" />
                    <Text style={styles.dateText}>
                      {formData.date
                        ? formatDate(formData.date)
                        : 'Select date'}
                    </Text>
                    <ChevronRight size={18} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                <View style={styles.dateInputGroup}>
                  <Text style={styles.inputLabel}>Due Date</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => {
                      setDateField('dueDate');
                      setShowDatePicker(true);
                    }}
                  >
                    <Clock size={18} color="#64748b" />
                    <Text style={styles.dateText}>
                      {formData.dueDate
                        ? formatDate(formData.dueDate)
                        : 'Select due date'}
                    </Text>
                    <ChevronRight size={18} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={new Date(formData[dateField] || new Date())}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                />
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter description (optional)"
                  value={formData.description}
                  onChangeText={(text) =>
                    handleInputChange('description', text)
                  }
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={selectedDebt ? handleUpdateDebt : handleAddDebt}
                >
                  <Text style={styles.saveButtonText}>
                    {selectedDebt ? 'Update Debt' : 'Save Debt'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Floating Action Button */}
      {!showAddForm && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            resetForm();
            setShowAddForm(true);
          }}
        >
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      )}
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
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 24,
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
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  pendingAmount: {
    color: '#ef4444',
  },
  paidAmount: {
    color: '#10b981',
  },
  overdueCount: {
    color: '#dc2626',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  debtCard: {
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
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  debtCardPaid: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  debtCardOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  debtCardDueSoon: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  debtPerson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPending: {
    backgroundColor: '#3b82f6',
  },
  statusPaid: {
    backgroundColor: '#10b981',
  },
  statusOverdue: {
    backgroundColor: '#ef4444',
  },
  statusDueSoon: {
    backgroundColor: '#f59e0b',
  },
  debtName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flexShrink: 1,
  },
  debtNamePaid: {
    color: '#64748b',
  },
  debtAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ef4444',
  },
  debtAmountPaid: {
    color: '#10b981',
    textDecorationLine: 'line-through',
  },
  debtAmountOverdue: {
    color: '#dc2626',
  },
  debtDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  debtDetailText: {
    fontSize: 14,
    color: '#64748b',
  },
  debtDescription: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
    lineHeight: 20,
  },
  debtMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  overdueText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  dueSoonText: {
    color: '#f59e0b',
    fontWeight: '600',
  },
  debtFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  statusBadge: {
    flex: 1,
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  pendingBadgeText: {
    fontSize: 11,
    color: '#d97706',
    fontWeight: '600',
  },
  overdueBadge: {
    backgroundColor: '#fee2e2',
  },
  overdueBadgeText: {
    color: '#dc2626',
  },
  dueSoonBadge: {
    backgroundColor: '#fef3c7',
  },
  dueSoonBadgeText: {
    color: '#d97706',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  paidBadgeText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  paidButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addFirstButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 24,
    textAlign: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  inputGroup: {
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  dateInputGroup: {
    flex: 1,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateText: {
    fontSize: 16,
    color: '#1e293b',
    flex: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  saveButton: {
    backgroundColor: '#7c3aed',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});

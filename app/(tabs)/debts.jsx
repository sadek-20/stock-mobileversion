import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  CreditCard,
  Plus,
  User,
  Phone,
  Calendar,
  DollarSign,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getDebts, addDebt, updateDebt, deleteDebt } from '../../utils/storage';

export default function DebtsScreen() {
  const [debts, setDebts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const loadDebts = async () => {
    try {
      const data = await getDebts();
      setDebts(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load debts');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDebts();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDebts();
    setRefreshing(false);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddDebt = async () => {
    if (
      !formData.name.trim() ||
      !formData.amount ||
      parseFloat(formData.amount) <= 0
    ) {
      Alert.alert('Error', 'Please enter valid name and amount');
      return;
    }

    try {
      await addDebt({
        ...formData,
        amount: parseFloat(formData.amount),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      Alert.alert('Success', 'Debt added successfully');
      setFormData({
        name: '',
        phone: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      setShowAddForm(false);
      loadDebts();
    } catch (error) {
      Alert.alert('Error', 'Failed to add debt');
    }
  };

  const handleMarkPaid = async (debt) => {
    Alert.alert(
      'Mark as Paid',
      `Mark ${debt.name}'s debt of KSH ${debt.amount} as paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: async () => {
            try {
              await updateDebt(debt.id, {
                ...debt,
                status: 'paid',
                paidAt: new Date().toISOString(),
              });
              loadDebts();
              Alert.alert('Success', 'Debt marked as paid');
            } catch (error) {
              Alert.alert('Error', 'Failed to update debt');
            }
          },
        },
      ]
    );
  };

  const handleDeleteDebt = async (debt) => {
    Alert.alert(
      'Delete Debt',
      `Are you sure you want to delete ${debt.name}'s debt?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDebt(debt.id);
              loadDebts();
              Alert.alert('Success', 'Debt deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete debt');
            }
          },
        },
      ]
    );
  };

  const totalPending = debts
    .filter((d) => d.status === 'pending')
    .reduce((sum, debt) => sum + debt.amount, 0);

  const renderDebtItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.debtCard, item.status === 'paid' && styles.debtCardPaid]}
      onLongPress={() => handleDeleteDebt(item)}
    >
      <View style={styles.debtHeader}>
        <View style={styles.debtPerson}>
          <User size={20} color="#64748b" />
          <Text style={styles.debtName}>{item.name}</Text>
        </View>
        <Text
          style={[
            styles.debtAmount,
            item.status === 'paid' && styles.debtAmountPaid,
          ]}
        >
          KSH {item.amount.toLocaleString()}
        </Text>
      </View>

      {item.phone && (
        <View style={styles.debtDetail}>
          <Phone size={16} color="#94a3b8" />
          <Text style={styles.debtDetailText}>{item.phone}</Text>
        </View>
      )}

      {item.description && (
        <Text style={styles.debtDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.debtFooter}>
        <View style={styles.debtDate}>
          <Calendar size={14} color="#94a3b8" />
          <Text style={styles.debtDateText}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>

        {item.status === 'pending' ? (
          <TouchableOpacity
            style={styles.markPaidButton}
            onPress={() => handleMarkPaid(item)}
          >
            <Text style={styles.markPaidButtonText}>Mark Paid</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.paidBadge}>
            <Text style={styles.paidBadgeText}>Paid</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

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
          <Text style={styles.headerTitle}>Debts (Daymaha)</Text>
          <Text style={styles.headerSubtitle}>
            Track and manage outstanding debts
          </Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Debts</Text>
            <Text style={styles.statValue}>{debts.length}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Pending Amount</Text>
            <Text style={styles.statValue}>
              KSH {totalPending.toLocaleString()}
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <CreditCard size={64} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Debts Recorded</Text>
            <Text style={styles.emptySubtitle}>
              Add your first debt to start tracking
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Add Debt Form Modal */}
      {showAddForm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Debt</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Person Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter person's name"
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                value={formData.phone}
                onChangeText={(text) => handleInputChange('phone', text)}
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

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Optional description"
                value={formData.description}
                onChangeText={(text) => handleInputChange('description', text)}
                multiline
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddForm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddDebt}
              >
                <Text style={styles.saveButtonText}>Save Debt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddForm(true)}>
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>
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
    marginBottom: 20,
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
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  debtCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
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
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  debtPerson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  debtName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  debtAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ef4444',
  },
  debtAmountPaid: {
    color: '#10b981',
    textDecorationLine: 'line-through',
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
  debtFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  debtDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  debtDateText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  markPaidButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  markPaidButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  paidBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  paidBadgeText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
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
  },
  inputGroup: {
    marginBottom: 16,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
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

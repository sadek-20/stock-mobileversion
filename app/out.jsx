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
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  getProducts,
  updateProductQuantity,
  addTransaction,
} from '../utils/storage';
import {
  TrendingDown,
  Package,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Calendar,
  FileText,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function StockOutScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [remainingStock, setRemainingStock] = useState(0);

  useEffect(() => {
    loadProduct();
  }, []);

  useEffect(() => {
    if (product && quantity) {
      const qty = parseInt(quantity) || 0;
      if (qty > product.quantity) {
        setValidationError(
          `Cannot exceed available stock (${product.quantity})`
        );
      } else if (qty <= 0) {
        setValidationError('Quantity must be greater than 0');
      } else {
        setValidationError('');
      }
      setRemainingStock(product.quantity - qty);
    }
  }, [quantity, product]);

  const loadProduct = async () => {
    try {
      const products = await getProducts();
      const found = products.find((p) => p.id === params.productId);
      if (found) {
        setProduct(found);
        setRemainingStock(found.quantity);
      } else {
        Alert.alert('Error', 'Product not found', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load product');
    }
  };

  const handleSubmit = async () => {
    if (!quantity || parseInt(quantity) <= 0) {
      Alert.alert(
        'Invalid Quantity',
        'Please enter a valid quantity greater than 0'
      );
      return;
    }

    const qty = parseInt(quantity);
    if (qty > product.quantity) {
      Alert.alert(
        'Insufficient Stock',
        `Quantity cannot exceed available stock (${product.quantity} ${product.unit})`
      );
      return;
    }

    if (!description.trim()) {
      Alert.alert(
        'Description Required',
        'Please enter a description for this stock removal'
      );
      return;
    }

    if (qty > product.quantity * 0.5) {
      Alert.alert(
        'Large Quantity Warning',
        `You are removing ${qty} ${product.unit}, which is ${Math.round(
          (qty / product.quantity) * 100
        )}% of your total stock. Are you sure?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: processStockOut, style: 'destructive' },
        ]
      );
      return;
    }

    processStockOut();
  };

  const processStockOut = async () => {
    setLoading(true);

    try {
      await updateProductQuantity(product.id, -parseInt(quantity));
      await addTransaction({
        type: 'OUT',
        productId: product.id,
        productName: product.name,
        quantity: parseInt(quantity),
        description: description.trim(),
        date: new Date().toISOString(),
      });

      Alert.alert(
        'Stock Removed Successfully!',
        `Removed ${quantity} ${product.unit} from ${product.name}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Operation Failed',
        'There was an error removing stock. Please try again.'
      );
      setLoading(false);
    }
  };

  const formatQuantity = (value) => {
    // Remove non-numeric characters
    return value.replace(/[^0-9]/g, '');
  };

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  const getStockStatusColor = () => {
    const percentage = (remainingStock / product.quantity) * 100;
    if (percentage < 20) return '#ef4444';
    if (percentage < 50) return '#f59e0b';
    return '#10b981';
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
        {/* Header */}
        <LinearGradient
          colors={['#ef4444', '#dc2626']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <TrendingDown size={32} color="#ffffff" />
            <Text style={styles.headerTitle}>Stock Out</Text>
            <Text style={styles.headerSubtitle}>
              Remove stock from inventory
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Product Card */}
          <View style={styles.card}>
            <View style={styles.productHeader}>
              <View style={styles.productIconContainer}>
                <Package size={24} color="#ef4444" />
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productUnit}>{product.unit}</Text>
              </View>
            </View>

            <View style={styles.stockInfo}>
              <View style={styles.stockItem}>
                <Text style={styles.stockLabel}>Current Stock</Text>
                <Text style={styles.stockValue}>{product.quantity}</Text>
              </View>
              <View style={styles.stockDivider} />
              <View style={styles.stockItem}>
                <Text style={styles.stockLabel}>After Removal</Text>
                <Text
                  style={[styles.stockValue, { color: getStockStatusColor() }]}
                >
                  {remainingStock}
                </Text>
              </View>
            </View>

            {remainingStock < product.quantity * 0.3 && remainingStock > 0 && (
              <View style={styles.warningBox}>
                <AlertTriangle size={18} color="#f59e0b" />
                <Text style={styles.warningText}>
                  Stock will be low after this removal ({remainingStock}{' '}
                  remaining)
                </Text>
              </View>
            )}

            {remainingStock === 0 && (
              <View style={styles.dangerBox}>
                <XCircle size={18} color="#ef4444" />
                <Text style={styles.dangerText}>
                  Stock will be depleted after this removal
                </Text>
              </View>
            )}
          </View>

          {/* Quantity Input */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quantity Details</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Quantity to Remove ({product.unit})
                <Text style={styles.required}> *</Text>
              </Text>
              <View style={styles.quantityInputContainer}>
                <TextInput
                  style={styles.quantityInput}
                  placeholder="Enter quantity"
                  value={quantity}
                  onChangeText={(text) => setQuantity(formatQuantity(text))}
                  keyboardType="number-pad"
                  placeholderTextColor="#94a3b8"
                  maxLength={6}
                />
                <Text style={styles.unitLabel}>{product.unit}</Text>
              </View>

              {validationError && (
                <View style={styles.errorContainer}>
                  <AlertTriangle size={16} color="#ef4444" />
                  <Text style={styles.errorText}>{validationError}</Text>
                </View>
              )}

              {/* Quick Select Buttons */}
              <View style={styles.quickSelectContainer}>
                <Text style={styles.quickSelectLabel}>Quick Select:</Text>
                <View style={styles.quickSelectButtons}>
                  {[1, 5, 10, product.quantity].map((value) => (
                    <TouchableOpacity
                      key={value}
                      style={styles.quickSelectButton}
                      onPress={() => setQuantity(value.toString())}
                    >
                      <Text style={styles.quickSelectButtonText}>{value}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Description Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Description<Text style={styles.required}> *</Text>
              </Text>
              <View style={styles.descriptionContainer}>
                <FileText
                  size={20}
                  color="#64748b"
                  style={styles.descriptionIcon}
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Why are you removing this stock? (e.g., Sold, Damaged, Expired, etc.)"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  maxLength={200}
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={styles.charCounter}>
                <Text style={styles.charCount}>
                  {description.length}/200 characters
                </Text>
                <Text style={styles.charHint}>Required for audit trail</Text>
              </View>

              {/* Common Reasons */}
              <View style={styles.reasonsContainer}>
                <Text style={styles.reasonsLabel}>Common Reasons:</Text>
                <View style={styles.reasonsButtons}>
                  {['Sold', 'Damaged', 'Expired', 'Sample', 'Returned'].map(
                    (reason) => (
                      <TouchableOpacity
                        key={reason}
                        style={styles.reasonButton}
                        onPress={() => {
                          if (description.includes(reason)) return;
                          setDescription((prev) =>
                            prev ? `${prev}, ${reason}` : reason
                          );
                        }}
                      >
                        <Text style={styles.reasonButtonText}>{reason}</Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Removal Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Product</Text>
                <Text style={styles.summaryValue}>{product.name}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Removing</Text>
                <Text style={styles.summaryValue}>
                  {quantity || '0'} {product.unit}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Remaining</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    { color: getStockStatusColor() },
                  ]}
                >
                  {remainingStock} {product.unit}
                </Text>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (loading ||
                !quantity ||
                !description.trim() ||
                validationError) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={
              loading || !quantity || !description.trim() || !!validationError
            }
          >
            <LinearGradient
              colors={['#ef4444', '#dc2626']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <TrendingDown size={22} color="#ffffff" />
                <Text style={styles.submitButtonText}>Remove Stock</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Warning Note */}
          <View style={styles.noteCard}>
            <AlertTriangle size={20} color="#f59e0b" />
            <Text style={styles.noteText}>
              Stock removal cannot be undone. Make sure the quantity is correct
              before proceeding.
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  productIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  productUnit: {
    fontSize: 14,
    color: '#64748b',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  stockInfo: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  stockItem: {
    flex: 1,
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  stockValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  stockDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    marginLeft: 12,
    fontWeight: '500',
  },
  dangerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  dangerText: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
    marginLeft: 12,
    fontWeight: '500',
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
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  quantityInput: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  unitLabel: {
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    height: '100%',
    textAlignVertical: 'center',
    paddingVertical: 18,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    marginLeft: 8,
    fontWeight: '500',
  },
  quickSelectContainer: {
    marginTop: 16,
  },
  quickSelectLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  quickSelectButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickSelectButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickSelectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  descriptionIcon: {
    marginRight: 12,
    marginTop: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCounter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#94a3b8',
  },
  charHint: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
  reasonsContainer: {
    marginTop: 16,
  },
  reasonsLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  reasonsButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reasonButtonText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#fee2e2',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 16,
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
    shadowColor: '#ef4444',
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
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
});

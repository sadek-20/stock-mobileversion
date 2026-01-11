// app/(tabs)/in.jsx
import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useStock } from '../../contexts/StockContext';

const API_URL = 'http://192.168.100.105:5000/api';

export default function StockInScreen() {
  const [products, setProducts] = useState([]);
  const [mode, setMode] = useState('select'); // select | new
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [newProductName, setNewProductName] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('');
  const [newProductQuantity, setNewProductQuantity] = useState('');

  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { token } = useAuth();
  const { fetchProducts, stockIn, createProduct } = useStock();

  const loadProducts = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [])
  );

  const resetForm = () => {
    setSelectedProduct(null);
    setNewProductName('');
    setNewProductUnit('');
    setNewProductQuantity('');
    setQuantity('');
    setDescription('');
  };

  const handleSubmit = async () => {
    // if (!quantity || parseInt(quantity) <= 0) {
    //   Alert.alert(
    //     'Invalid Quantity',
    //     'Please enter a valid quantity greater than 0'
    //   );
    //   return;
    // }

    if (!description.trim()) {
      Alert.alert(
        'Description Required',
        'Please enter a description for this stock addition'
      );
      return;
    }

    setLoading(true);

    try {
      let product = selectedProduct;
      let productId = selectedProduct?._id;

      // 👉 ADD NEW PRODUCT MODE
      if (mode === 'new') {
        if (!newProductName.trim() || !newProductUnit.trim()) {
          Alert.alert(
            'Missing Information',
            'Product name and unit are required'
          );
          setLoading(false);
          return;
        }

        const productData = {
          name: newProductName.trim(),
          unit: newProductUnit.trim(),
          currentStock: parseInt(newProductQuantity) || 0,
        };

        const result = await createProduct(productData);

        if (!result.success) {
          Alert.alert('Error', result.message || 'Failed to create product');
          setLoading(false);
          return;
        }

        product = result.data;
        productId = result.data._id;

        // Reload products to include the new one
        await loadProducts();
      }

      // 👉 SELECT MODE VALIDATION
      if (mode === 'select' && !product) {
        Alert.alert(
          'No Product Selected',
          'Please select a product or switch to "Add New" mode'
        );
        setLoading(false);
        return;
      }

      const qty = parseInt(quantity);

      // Use stockIn from context
      const result = await stockIn(productId, qty, description.trim());

      console.log(result, 'result');

      if (!result.success) {
        Alert.alert('Error', result.message || 'Failed to add stock');
        setLoading(false);
        return;
      }

      Alert.alert(
        'Success!',
        `Added ${qty} ${product.unit || newProductUnit} to ${
          product.name || newProductName
        }`,
        [{ text: 'OK', onPress: () => resetForm() }]
      );

      resetForm();
      await loadProducts();

      // Navigate back to products screen after successful addition
      router.back();
    } catch (error) {
      console.error('Stock in error:', error);
      Alert.alert(
        'Operation Failed',
        'There was an error adding stock. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stock In</Text>
        <Text style={styles.headerSubtitle}>
          Add inventory to your products
        </Text>
      </View>

      <View style={styles.content}>
        {/* MODE SWITCH - Card Style */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Product Selection</Text>
          <View style={styles.modeSwitch}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === 'select' && styles.modeButtonActive,
                { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
              ]}
              onPress={() => {
                setMode('select');
                setNewProductName('');
                setNewProductUnit('');
                setNewProductQuantity('');
              }}
            >
              <Ionicons
                name="list"
                size={18}
                color={mode === 'select' ? '#fff' : '#666'}
                style={styles.modeIcon}
              />
              <Text
                style={[
                  styles.modeText,
                  mode === 'select' && styles.modeTextActive,
                ]}
              >
                Select Existing
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === 'new' && styles.modeButtonActive,
                { borderTopRightRadius: 8, borderBottomRightRadius: 8 },
              ]}
              onPress={() => {
                setMode('new');
                setSelectedProduct(null);
              }}
            >
              <Ionicons
                name="add-circle"
                size={18}
                color={mode === 'new' ? '#fff' : '#666'}
                style={styles.modeIcon}
              />
              <Text
                style={[
                  styles.modeText,
                  mode === 'new' && styles.modeTextActive,
                ]}
              >
                Add New
              </Text>
            </TouchableOpacity>
          </View>

          {/* SELECT EXISTING PRODUCT */}
          {mode === 'select' && (
            <>
              <Text style={styles.label}>
                Choose Product {selectedProduct && `• ${selectedProduct.name}`}
              </Text>
              {products.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="cube-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyStateText}>No products found</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Switch to "Add New" to create your first product
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.productScrollView}
                >
                  <View style={styles.productList}>
                    {products.map((product) => (
                      <TouchableOpacity
                        key={product._id || product.id}
                        style={[
                          styles.productCard,
                          selectedProduct?._id === product._id &&
                            styles.productCardSelected,
                        ]}
                        onPress={() => setSelectedProduct(product)}
                      >
                        <View
                          style={[
                            styles.productIndicator,
                            selectedProduct?._id === product._id &&
                              styles.productIndicatorSelected,
                          ]}
                        >
                          <Ionicons
                            name="cube"
                            size={20}
                            color={
                              selectedProduct?._id === product._id
                                ? '#fff'
                                : '#666'
                            }
                          />
                        </View>
                        <Text
                          style={[
                            styles.productName,
                            selectedProduct?._id === product._id &&
                              styles.productNameSelected,
                          ]}
                        >
                          {product.name}
                        </Text>
                        <Text
                          style={[
                            styles.productQuantity,
                            selectedProduct?._id === product._id &&
                              styles.productQuantitySelected,
                          ]}
                        >
                          Current: {product.currentStock || 0}{' '}
                          {product.unit || 'units'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}
            </>
          )}

          {/* ADD NEW PRODUCT */}
          {mode === 'new' && (
            <View style={styles.newProductForm}>
              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Product Name</Text>
                  <View style={styles.inputWithIcon}>
                    <Ionicons
                      name="pricetag-outline"
                      size={20}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., Organic Rice"
                      value={newProductName}
                      onChangeText={setNewProductName}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Unit</Text>
                  <View style={styles.inputWithIcon}>
                    <Ionicons
                      name="scale-outline"
                      size={20}
                      color="#666"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="kg, pcs, box"
                      value={newProductUnit}
                      onChangeText={setNewProductUnit}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Initial Stock Quantity</Text>
                <View style={styles.inputWithIcon}>
                  <Ionicons
                    name="cube-outline"
                    size={20}
                    color="#666"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter initial quantity"
                    value={newProductQuantity}
                    onChangeText={setNewProductQuantity}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* QUANTITY CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quantity Details</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Quantity to Add</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons
                name="add-circle-outline"
                size={22}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter quantity"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />
              {(selectedProduct || mode === 'new') && (
                <Text style={styles.unitLabel}>
                  {selectedProduct?.unit || newProductUnit || 'units'}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Description <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputWithIcon}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe this stock addition (e.g., New shipment, Restock, etc.)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>
            <Text style={styles.hint}>Required for transaction history</Text>
          </View>
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            loading && styles.submitButtonDisabled,
            mode === 'select' &&
              !selectedProduct &&
              styles.submitButtonDisabled,
            mode === 'new' &&
              (!newProductName || !newProductUnit) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={
            loading ||
            (mode === 'select' && !selectedProduct) ||
            (mode === 'new' &&
              (!newProductName.trim() || !newProductUnit.trim()))
          }
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.submitButtonText}>Add to Stock</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  modeSwitch: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    overflow: 'hidden',
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: 'transparent',
  },
  modeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  modeIcon: {
    marginRight: 8,
  },
  modeText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#666',
  },
  modeTextActive: {
    color: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#475569',
  },
  required: {
    color: '#ef4444',
  },
  productScrollView: {
    marginHorizontal: -20,
  },
  productList: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  productCard: {
    width: 160,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  productCardSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  productIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  productIndicatorSelected: {
    backgroundColor: '#3b82f6',
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    marginBottom: 4,
  },
  productNameSelected: {
    color: '#1e40af',
  },
  productQuantity: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  productQuantitySelected: {
    color: '#3b82f6',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  newProductForm: {
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 16,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  unitLabel: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
    marginLeft: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#10b981',
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#10b981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 8,
    marginBottom: 30,
  },
  submitButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});

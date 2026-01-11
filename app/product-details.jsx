// app/product-details.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Package,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  Clock,
  Edit,
  Trash2,
  Activity,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Hash,
  Tag,
  Layers,
  Archive,
  Download,
  Share2,
  MoreVertical,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStock } from '../contexts/StockContext';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { products, loading, fetchProducts } = useStock();
  const { token } = useAuth();

  const [product, setProduct] = useState(null);
  const [movements, setMovements] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [movementLoading, setMovementLoading] = useState(false);
  const [stats, setStats] = useState({
    totalIn: 0,
    totalOut: 0,
    netChange: 0,
    lastUpdated: null,
  });

  useEffect(() => {
    loadProduct();
  }, [products, params.productId]);

  useEffect(() => {
    if (product) {
      loadStockMovements();
    }
  }, [product]);

  const loadProduct = () => {
    if (!params.productId || !products || products.length === 0) {
      return;
    }

    const found = products.find((p) => p._id === params.productId);
    console.log(found);
    if (found) {
      setProduct(found);
    } else {
      Alert.alert('Error', 'Product not found', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  const loadStockMovements = async () => {
    if (!product?._id || !token) return;

    // console.log(product?._id, 'product');

    setMovementLoading(true);
    try {
      const response = await fetch(
        `http://192.168.100.105:5000/api/stock-movements`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      console.log(data, 'data');

      if (response.ok) {
        const filtered = data.data.filter(
          (m) => m.product?._id === product._id
        );

        setMovements(filtered);

        // Calculate statistics
        const totalIn =
          data.data
            ?.filter((m) => m.type === 'IN')
            .reduce((sum, m) => sum + m.quantity, 0) || 0;

        const totalOut =
          data.data
            ?.filter((m) => m.type === 'OUT')
            .reduce((sum, m) => sum + m.quantity, 0) || 0;

        const netChange = totalIn - totalOut;
        const lastUpdated = data.data?.[0]?.createdAt;

        setStats({
          totalIn,
          totalOut,
          netChange,
          lastUpdated,
        });
      }
    } catch (error) {
      console.error('Error loading movements:', error);
    } finally {
      setMovementLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), loadStockMovements()]);
    setRefreshing(false);
  };

  const handleEdit = () => {
    router.push({
      pathname: '/edit-product',
      params: { productId: product._id },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"? This will also remove all stock movement records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(
                `http://192.168.100.105:5000/api/products/${product._id}`,
                {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (response.ok) {
                Alert.alert('Success', 'Product deleted successfully', [
                  { text: 'OK', onPress: () => router.back() },
                ]);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const handleStockIn = () => {
    router.push({
      pathname: '/in',
      params: { productId: product._id },
    });
  };

  const handleStockOut = () => {
    router.push({
      pathname: '/out',
      params: {
        productId: product._id,
        productName: product.name,
        currentStock: product.currentStock,
        productUnit: product.unit,
      },
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStockStatus = () => {
    if (product.currentStock === 0) {
      return {
        label: 'Out of Stock',
        color: '#ef4444',
        bg: '#fef2f2',
        icon: AlertTriangle,
      };
    }
    if (product.currentStock < 10) {
      return {
        label: 'Low Stock',
        color: '#f59e0b',
        bg: '#fffbeb',
        icon: AlertTriangle,
      };
    }
    if (product.currentStock >= 50) {
      return {
        label: 'High Stock',
        color: '#10b981',
        bg: '#f0fdf4',
        icon: CheckCircle,
      };
    }
    return {
      label: 'In Stock',
      color: '#3b82f6',
      bg: '#eff6ff',
      icon: CheckCircle,
    };
  };

  const getMovementIcon = (type) => {
    return type === 'IN' ? TrendingUp : TrendingDown;
  };

  const getMovementColor = (type) => {
    return type === 'IN' ? '#10b981' : '#ef4444';
  };

  if (loading || !product) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </SafeAreaView>
    );
  }

  const stockStatus = getStockStatus();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3b82f6']}
            tintColor="#3b82f6"
          />
        }
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#3b82f6', '#2563eb']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={handleEdit}
              >
                <Edit size={20} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={handleDelete}
              >
                <Trash2 size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.productHeader}>
            <View
              style={[
                styles.productIconLarge,
                { backgroundColor: stockStatus.bg },
              ]}
            >
              <stockStatus.icon size={32} color={stockStatus.color} />
            </View>

            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {product.name}
              </Text>

              <View style={styles.productMeta}>
                <View
                  style={[
                    styles.stockBadge,
                    { backgroundColor: stockStatus.bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.stockBadgeText,
                      { color: stockStatus.color },
                    ]}
                  >
                    {stockStatus.label}
                  </Text>
                </View>

                <View style={styles.unitBadge}>
                  <Hash size={14} color="#64748b" />
                  <Text style={styles.unitText}>{product.unit || 'units'}</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={handleStockIn}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.quickActionGradient}
            >
              <TrendingUp size={24} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Stock In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={handleStockOut}>
            <LinearGradient
              colors={['#ef4444', '#dc2626']}
              style={styles.quickActionGradient}
            >
              <TrendingDown size={24} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.quickActionText}>Stock Out</Text>
          </TouchableOpacity>
        </View>

        {/* Stock Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stock Overview</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#eff6ff' }]}>
                <Layers size={20} color="#3b82f6" />
              </View>
              <Text style={styles.statValue}>{product.currentStock}</Text>
              <Text style={styles.statLabel}>Current Stock</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#f0fdf4' }]}>
                <TrendingUp size={20} color="#10b981" />
              </View>
              <Text style={[styles.statValue, { color: '#10b981' }]}>
                {stats.totalIn}
              </Text>
              <Text style={styles.statLabel}>Total In</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#fef2f2' }]}>
                <TrendingDown size={20} color="#ef4444" />
              </View>
              <Text style={[styles.statValue, { color: '#ef4444' }]}>
                {stats.totalOut}
              </Text>
              <Text style={styles.statLabel}>Total Out</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#f8fafc' }]}>
                <Activity size={20} color="#64748b" />
              </View>
              <Text
                style={[
                  styles.statValue,
                  {
                    color: stats.netChange >= 0 ? '#10b981' : '#ef4444',
                  },
                ]}
              >
                {stats.netChange >= 0 ? '+' : ''}
                {stats.netChange}
              </Text>
              <Text style={styles.statLabel}>Net Change</Text>
            </View>
          </View>
        </View>

        {/* Product Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Details</Text>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Tag size={18} color="#64748b" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Product Name</Text>
                <Text style={styles.detailValue}>{product.name}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Hash size={18} color="#64748b" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Unit</Text>
                <Text style={styles.detailValue}>
                  {product.unit || 'units'}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Archive size={18} color="#64748b" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Stock Level</Text>
                <Text style={styles.detailValue}>{product.currentStock}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <Calendar size={18} color="#64748b" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Last Updated</Text>
                <Text style={styles.detailValue}>
                  {stats.lastUpdated ? formatDate(stats.lastUpdated) : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stock Movement History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Movements</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={16} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          {movementLoading ? (
            <ActivityIndicator
              size="small"
              color="#3b82f6"
              style={styles.loader}
            />
          ) : movements.length === 0 ? (
            <View style={styles.emptyState}>
              <Activity size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No stock movements yet</Text>
              <Text style={styles.emptySubtext}>
                Add your first stock in or out to see activity
              </Text>
            </View>
          ) : (
            <View style={styles.movementsList}>
              {movements.slice(0, 5).map((movement) => {
                const MovementIcon = getMovementIcon(movement.type);
                const movementColor = getMovementColor(movement.type);

                return (
                  <TouchableOpacity
                    key={movement._id}
                    style={styles.movementCard}
                  >
                    <View style={styles.movementHeader}>
                      <View
                        style={[
                          styles.movementIcon,
                          { backgroundColor: `${movementColor}15` },
                        ]}
                      >
                        <MovementIcon size={20} color={movementColor} />
                      </View>

                      <View style={styles.movementInfo}>
                        <Text style={styles.movementTitle}>
                          {movement.type === 'IN' ? 'Stock In' : 'Stock Out'}
                        </Text>
                        <Text
                          style={styles.movementDescription}
                          numberOfLines={1}
                        >
                          {movement.description || 'No description'}
                        </Text>
                      </View>

                      <View style={styles.movementQuantity}>
                        <Text
                          style={[
                            styles.quantityText,
                            { color: movementColor },
                          ]}
                        >
                          {movement.type === 'IN' ? '+' : '-'}
                          {movement.quantity}
                        </Text>
                        <Text style={styles.unitTextSmall}>
                          {product.unit || 'units'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.movementFooter}>
                      <View style={styles.movementMeta}>
                        <Clock size={14} color="#94a3b8" />
                        <Text style={styles.movementDate}>
                          {formatDate(movement.createdAt)}
                        </Text>
                      </View>

                      {movement.user && (
                        <Text style={styles.movementUser}>
                          by {movement.user.name || movement.user.username}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Stock Chart Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stock Trend</Text>
          <View style={styles.chartPlaceholder}>
            <BarChart3 size={48} color="#cbd5e1" />
            <Text style={styles.chartPlaceholderText}>
              Stock trend chart would appear here
            </Text>
            <Text style={styles.chartPlaceholderSubtext}>
              Track stock levels over time
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  header: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    lineHeight: 34,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  stockBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  unitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  unitText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 16,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
  },
  quickActionGradient: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 40 - 12) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  detailsGrid: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  loader: {
    marginVertical: 40,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  movementsList: {
    gap: 12,
  },
  movementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  movementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  movementIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  movementInfo: {
    flex: 1,
  },
  movementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  movementDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  movementQuantity: {
    alignItems: 'flex-end',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '700',
  },
  unitTextSmall: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  movementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  movementMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  movementDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  movementUser: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  chartPlaceholder: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  chartPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  chartPlaceholderSubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
});

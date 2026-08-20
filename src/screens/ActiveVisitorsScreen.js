import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getActiveVisitors, markExit } from '../services/api';

const PRIMARY = '#1E3A5F';

export default function ActiveVisitorsScreen({ navigation }) {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exitingId, setExitingId] = useState(null);

  const fetchVisitors = useCallback(async () => {
    try {
      const res = await getActiveVisitors();
      const list = res.data?.visitors || res.data || [];
      setVisitors(Array.isArray(list) ? list : []);
    } catch (err) {
      console.log('Error fetching active visitors:', err.response?.data || err.message);
      Alert.alert(
        'Error / त्रुटि',
        'विज़िटर लोड करने में विफल (Failed to load active visitors).'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVisitors();
  };

  const handleMarkExit = (item) => {
    const visitorId = item.id || item._id;
    const name = item.visitor_name || item.visitorName || 'Visitor';

    Alert.alert(
      'Mark Exit / प्रस्थान दर्ज करें',
      `क्या ${name} बाहर जा चुके हैं?\n(Confirm exit for ${name}?)`,
      [
        { text: 'Cancel / रद्द', style: 'cancel' },
        {
          text: 'Confirm Exit / बाहर निकले',
          style: 'destructive',
          onPress: async () => {
            setExitingId(visitorId);
            try {
              await markExit(visitorId);
              Alert.alert('Success / सफल', `${name} का प्रस्थान दर्ज हो गया (Exit recorded).`);
              fetchVisitors();
            } catch (err) {
              console.log('Error marking exit:', err.response?.data || err.message);
              const errMsg =
                err.response?.data?.message ||
                'प्रस्थान दर्ज करने में त्रुटि (Failed to record exit).';
              Alert.alert('Error', errMsg);
            } finally {
              setExitingId(null);
            }
          },
        },
      ]
    );
  };

  const formatEntryTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }) + ', ' + d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const renderVisitorCard = ({ item }) => {
    const visitorId = item.id || item._id;
    const isExiting = exitingId === visitorId;
    const name = item.visitor_name || item.visitorName || 'Unknown';
    const flat = item.flat_number || item.flatNumber || 'N/A';
    const block = item.block ? `Block ${item.block}` : '';
    const purpose = item.purpose || 'Visit';
    const enteredAt = formatEntryTime(item.entered_at || item.created_at);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.visitorAvatar}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.visitorName} numberOfLines={1}>
              {name}
            </Text>
            <View style={styles.flatBadge}>
              <Text style={styles.flatText}>
                🏠 Flat {flat} {block ? `• ${block}` : ''}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Purpose / उद्देश्य:</Text>
            <Text style={styles.purposeBadge}>{purpose}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Entered At / प्रवेश:</Text>
            <Text style={styles.detailValue}>🕒 {enteredAt}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.exitButton, isExiting && styles.exitButtonDisabled]}
          onPress={() => handleMarkExit(item)}
          disabled={isExiting}
          activeOpacity={0.8}
        >
          {isExiting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.exitButtonText}>🚪 Mark Exit / बाहर निकले</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* ─── Header ───────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Inside Society</Text>
          <Text style={styles.headerSubtitle}>अंदर हैं ({visitors.length})</Text>
        </View>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* ─── Body ─────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>विज़िटर लोड हो रहे हैं...</Text>
        </View>
      ) : (
        <FlatList
          data={visitors}
          keyExtractor={(item) => String(item.id || item._id || Math.random())}
          renderItem={renderVisitorCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY]}
              tintColor={PRIMARY}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏢</Text>
              <Text style={styles.emptyTitle}>No visitors inside</Text>
              <Text style={styles.emptySubtitle}>
                वर्तमान में कोई भी विज़िटर अंदर मौजूद नहीं है
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PRIMARY,
  },
  header: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#93C5FD',
    fontWeight: '500',
  },
  headerRightPlaceholder: {
    width: 36,
  },

  // ─── List ──────────────────────────────────
  listContent: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#F7F8FA',
    flexGrow: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },

  // ─── Visitor Card ──────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visitorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 20,
  },
  headerInfo: {
    flex: 1,
  },
  visitorName: {
    fontSize: 17,
    fontWeight: '800',
    color: PRIMARY,
  },
  flatBadge: {
    marginTop: 3,
  },
  flatText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardDetails: {
    marginBottom: 14,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '600',
  },
  purposeBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },

  // ─── Exit Button ───────────────────────────
  exitButton: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  exitButtonDisabled: {
    opacity: 0.6,
  },
  exitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // ─── Empty State ───────────────────────────
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 50,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PRIMARY,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
  },
});

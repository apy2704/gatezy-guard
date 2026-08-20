import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  getGuard,
  getShift,
  removeToken,
  removeGuard,
  removeShift,
} from '../utils/storage';
import { endShift, getActiveVisitors } from '../services/api';

const PRIMARY = '#1E3A5F';

export default function HomeScreen({ navigation }) {
  const [guard, setGuard] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeCount, setActiveCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // 1. Clock timer updating every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 2. Load guard profile and fetch active visitors on focus
  useFocusEffect(
    useCallback(() => {
      const loadInitialData = async () => {
        try {
          const guardData = await getGuard();
          if (guardData) {
            setGuard(guardData);
          }
          await fetchVisitorStats();
        } catch (error) {
          console.log('Error loading home data:', error);
        }
      };

      loadInitialData();
    }, [])
  );

  const fetchVisitorStats = async () => {
    try {
      const res = await getActiveVisitors();
      const visitors = res.data?.visitors || res.data || [];
      setActiveCount(Array.isArray(visitors) ? visitors.length : 0);
      if (res.data?.todayCount !== undefined) {
        setTodayCount(res.data.todayCount);
      } else {
        setTodayCount(Array.isArray(visitors) ? visitors.length : 0);
      }
    } catch (error) {
      console.log('Error fetching visitors:', error.message);
    }
  };

  // 3. Handle End Shift / Logout
  const handleEndShiftAction = async () => {
    setLoading(true);
    try {
      const shift = await getShift();
      const shiftId = shift?._id || shift?.id;
      if (shiftId) {
        try {
          await endShift(shiftId);
        } catch (apiErr) {
          console.log('End shift API error (continuing logout):', apiErr.message);
        }
      }
    } catch (err) {
      console.log('Error ending shift:', err);
    } finally {
      await removeToken();
      await removeGuard();
      await removeShift();
      setLoading(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  const confirmEndShift = () => {
    Alert.alert(
      'End Shift / शिफ़्ट समाप्त',
      'क्या आप अपनी शिफ़्ट समाप्त करना चाहते हैं?\n(Are you sure you want to end your shift?)',
      [
        { text: 'Cancel / रद्द', style: 'cancel' },
        {
          text: 'End Shift / समाप्त करें',
          style: 'destructive',
          onPress: handleEndShiftAction,
        },
      ]
    );
  };

  const confirmLogout = () => {
    Alert.alert(
      'Logout / लॉग आउट',
      'क्या आप लॉग आउट करना चाहते हैं?\n(Are you sure you want to logout?)',
      [
        { text: 'Cancel / रद्द', style: 'cancel' },
        {
          text: 'Logout / लॉग आउट',
          style: 'destructive',
          onPress: handleEndShiftAction,
        },
      ]
    );
  };

  const formattedDate = currentTime.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const societyName =
    guard?.societyName ||
    guard?.society?.name ||
    'Gate Security';

  const guardName =
    guard?.name ||
    guard?.username ||
    'Guard';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* ─── Top Header Bar ────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLogo}>GATEZY</Text>
          <Text style={styles.headerSubLogo}>GUARD APP</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.guardInfoBox}>
            <Text style={styles.guardLabel}>ड्यूटी पर (On Duty)</Text>
            <Text style={styles.guardName} numberOfLines={1}>
              👮 {guardName}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={confirmLogout}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Society & Live Date/Time Card ──────────────────────── */}
        <View style={styles.infoCard}>
          <View style={styles.societyRow}>
            <Text style={styles.societyIcon}>🏢</Text>
            <View style={styles.societyTextWrapper}>
              <Text style={styles.societyTitle} numberOfLines={1}>
                {societyName}
              </Text>
              <Text style={styles.gateText}>
                {guard?.gate ? `Gate: ${guard.gate}` : 'Main Gate / मुख्य द्वार'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.timeRow}>
            <View style={styles.timeCol}>
              <Text style={styles.timeLabel}>📅 दिनांक (Date)</Text>
              <Text style={styles.timeValue}>{formattedDate}</Text>
            </View>
            <View style={[styles.timeCol, styles.timeColRight]}>
              <Text style={styles.timeLabel}>⏰ समय (Live Time)</Text>
              <Text style={styles.liveTimeValue}>{formattedTime}</Text>
            </View>
          </View>
        </View>

        {/* ─── 2x2 Action Buttons Grid ─────────────────────────────── */}
        <Text style={styles.sectionHeading}>Quick Actions / त्वरित कार्य</Text>

        <View style={styles.grid}>
          {/* Action 1: New Visitor */}
          <TouchableOpacity
            style={[styles.actionCard, styles.cardBlue]}
            onPress={() => navigation.navigate('Visitor')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconCircle, styles.iconCircleBlue]}>
              <Text style={styles.cardEmoji}>📷</Text>
            </View>
            <Text style={styles.cardTitle}>New Visitor</Text>
            <Text style={styles.cardSubTitle}>नया विज़िटर</Text>
          </TouchableOpacity>

          {/* Action 2: Active Visitors */}
          <TouchableOpacity
            style={[styles.actionCard, styles.cardGreen]}
            onPress={() => navigation.navigate('ActiveVisitors')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconCircle, styles.iconCircleGreen]}>
              <Text style={styles.cardEmoji}>👥</Text>
            </View>
            <Text style={styles.cardTitle}>Active Visitors</Text>
            <Text style={styles.cardSubTitle}>मौजूद विज़िटर</Text>
            {activeCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Action 3: Emergency */}
          <TouchableOpacity
            style={[styles.actionCard, styles.cardRed]}
            onPress={() => navigation.navigate('Emergency')}
            activeOpacity={0.85}
          >
            <View style={[styles.iconCircle, styles.iconCircleRed]}>
              <Text style={styles.cardEmoji}>🚨</Text>
            </View>
            <Text style={styles.cardTitle}>Emergency</Text>
            <Text style={styles.cardSubTitle}>आपातकाल</Text>
          </TouchableOpacity>

          {/* Action 4: End Shift */}
          <TouchableOpacity
            style={[styles.actionCard, styles.cardGray]}
            onPress={confirmEndShift}
            disabled={loading}
            activeOpacity={0.85}
          >
            <View style={[styles.iconCircle, styles.iconCircleGray]}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.cardEmoji}>⏹️</Text>
              )}
            </View>
            <Text style={styles.cardTitle}>End Shift</Text>
            <Text style={styles.cardSubTitle}>शिफ़्ट समाप्त</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Bottom Stats Bar ────────────────────────────────────── */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{activeCount}</Text>
            <Text style={styles.statLabel}>Currently Inside</Text>
            <Text style={styles.statSubLabel}>अंदर मौजूद</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{todayCount}</Text>
            <Text style={styles.statLabel}>Today's Entries</Text>
            <Text style={styles.statSubLabel}>आज की प्रविष्टियाँ</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PRIMARY,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#F7F8FA',
    padding: 16,
    paddingBottom: 24,
  },

  // ─── Header ────────────────────────────────
  header: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLogo: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  headerSubLogo: {
    fontSize: 10,
    fontWeight: '700',
    color: '#93C5FD',
    letterSpacing: 1.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guardInfoBox: {
    alignItems: 'flex-end',
    maxWidth: 130,
  },
  guardLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  guardName: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
  },

  // ─── Info Card ─────────────────────────────
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  societyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  societyIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  societyTextWrapper: {
    flex: 1,
  },
  societyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PRIMARY,
  },
  gateText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeCol: {
    flex: 1,
  },
  timeColRight: {
    alignItems: 'flex-end',
  },
  timeLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  liveTimeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0284C7',
    fontVariant: ['tabular-nums'],
  },

  // ─── Grid ──────────────────────────────────
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
    marginLeft: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 135,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cardBlue: {
    backgroundColor: '#1E3A5F',
  },
  cardGreen: {
    backgroundColor: '#047857',
  },
  cardRed: {
    backgroundColor: '#B91C1C',
  },
  cardGray: {
    backgroundColor: '#475569',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconCircleBlue: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  iconCircleGreen: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  iconCircleRed: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  iconCircleGray: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  cardEmoji: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cardSubTitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // ─── Stats Bar ─────────────────────────────
  statsBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: PRIMARY,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: 2,
  },
  statSubLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
  },
});

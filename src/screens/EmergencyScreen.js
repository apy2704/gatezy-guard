import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createEmergency } from '../services/api';
import { getShift } from '../utils/storage';

const PRIMARY = '#1E3A5F';

const EMERGENCY_TYPES = [
  {
    id: 'ambulance',
    name: 'Ambulance / एम्बुलेंस',
    icon: '🚑',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  {
    id: 'police',
    name: 'Police / पुलिस',
    icon: '🚓',
    color: '#1D4ED8',
    bgColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  {
    id: 'fire',
    name: 'Fire Brigade / दमकल',
    icon: '🚒',
    color: '#EA580C',
    bgColor: '#FFF7ED',
    borderColor: '#F97316',
  },
];

export default function EmergencyScreen({ navigation }) {
  const [selectedType, setSelectedType] = useState('ambulance');
  const [flatNumber, setFlatNumber] = useState('');
  const [block, setBlock] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGrantEntry = async () => {
    const trimmedFlat = flatNumber.trim();
    const trimmedBlock = block.trim();

    if (!trimmedFlat) {
      Alert.alert(
        'Validation Error / त्रुटि',
        'कृपया फ़्लैट नंबर दर्ज करें (Please enter destination flat number).'
      );
      return;
    }

    setLoading(true);

    try {
      const shiftData = await getShift();
      const shiftId = shiftData?._id || shiftData?.id || null;

      const payload = {
        emergencyType: selectedType,
        flatNumber: trimmedFlat,
        block: trimmedBlock ? trimmedBlock.toUpperCase() : undefined,
        shiftId: shiftId,
      };

      console.log('Sending Emergency Entry Request:', payload);

      const res = await createEmergency(payload);
      console.log('Emergency Entry Response:', res.data);

      Alert.alert(
        'Emergency Entry Granted / आपातकालीन प्रवेश स्वीकृत',
        'Emergency entry granted. Admin notified.',
        [
          {
            text: 'OK / ठीक है',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      console.log('Emergency Entry Error:', err.response?.data || err.message);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        'आपातकालीन प्रवेश दर्ज करने में त्रुटि (Failed to grant emergency entry).';
      Alert.alert('Error / त्रुटि', errMsg);
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.headerTitle}>Emergency</Text>
          <Text style={styles.headerSubtitle}>आपातकाल</Text>
        </View>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Warning Banner ──────────────────────────────────── */}
          <View style={styles.warningBanner}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <View style={styles.warningTextWrapper}>
              <Text style={styles.warningTitle}>
                Emergency entry bypasses approval
              </Text>
              <Text style={styles.warningSubtitle}>
                आपातकालीन वाहन बिना अनुमति सीधे प्रवेश करेगा व एडमिन को सूचित किया जाएगा
              </Text>
            </View>
          </View>

          {/* ─── Select Emergency Type ───────────────────────────── */}
          <Text style={styles.sectionHeading}>
            Select Emergency Type / प्रकार चुनें
          </Text>

          <View style={styles.typesContainer}>
            {EMERGENCY_TYPES.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeButton,
                    { borderColor: type.borderColor },
                    isSelected && { backgroundColor: type.color, borderColor: type.color },
                    !isSelected && { backgroundColor: type.bgColor },
                  ]}
                  onPress={() => setSelectedType(type.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.typeContent}>
                    <Text style={styles.typeIcon}>{type.icon}</Text>
                    <Text
                      style={[
                        styles.typeName,
                        isSelected ? styles.typeNameSelected : { color: type.color },
                      ]}
                    >
                      {type.name}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ─── Destination Flat Card ───────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>
              Destination Flat / गंतव्य फ़्लैट
            </Text>

            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1.2, marginRight: 10 }]}>
                <Text style={styles.label}>
                  Flat Number / फ़्लैट <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 101 or 304"
                  placeholderTextColor="#94A3B8"
                  value={flatNumber}
                  onChangeText={setFlatNumber}
                  autoCapitalize="characters"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Block / ब्लॉक</Text>
                <TextInput
                  style={styles.input}
                  placeholder="A / B / C"
                  placeholderTextColor="#94A3B8"
                  value={block}
                  onChangeText={setBlock}
                  autoCapitalize="characters"
                  maxLength={5}
                />
              </View>
            </View>
          </View>

          {/* ─── Grant Button ────────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.grantButton, loading && styles.grantButtonDisabled]}
            onPress={handleGrantEntry}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.grantButtonText}>
                🚨 Grant Emergency Entry / प्रवेश दें
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PRIMARY,
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },

  // ─── Header ────────────────────────────────
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
    color: '#FCA5A5',
    fontWeight: '500',
  },
  headerRightPlaceholder: {
    width: 36,
  },

  // ─── Warning Banner ────────────────────────
  warningBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  warningTextWrapper: {
    flex: 1,
  },
  warningTitle: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '800',
  },
  warningSubtitle: {
    color: '#991B1B',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },

  // ─── Emergency Types ───────────────────────
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
    marginLeft: 2,
  },
  typesContainer: {
    gap: 12,
    marginBottom: 20,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  typeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 26,
    marginRight: 12,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '800',
  },
  typeNameSelected: {
    color: '#FFFFFF',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioCircleSelected: {
    borderColor: '#FFFFFF',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PRIMARY,
  },

  // ─── Form Card ─────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
  },
  formGroup: {
    marginBottom: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
    fontWeight: '900',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },

  // ─── Grant Button ──────────────────────────
  grantButton: {
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  grantButtonDisabled: {
    opacity: 0.7,
  },
  grantButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

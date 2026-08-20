import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { createVisitorRequest } from '../services/api';
import { getShift } from '../utils/storage';

const PRIMARY = '#1E3A5F';

const PURPOSES = [
  { id: 'Delivery', label: 'Delivery / डिलीवरी', icon: '📦' },
  { id: 'Personal Visit', label: 'Personal Visit / मुलाक़ात', icon: '🤝' },
  { id: 'Service/Repair', label: 'Service / रिपेयर', icon: '🔧' },
  { id: 'Other', label: 'Other / अन्य', icon: '📝' },
];

export default function VisitorScreen({ navigation }) {
  const [photoUri, setPhotoUri] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);

  const [visitorName, setVisitorName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('Delivery');
  const [flatNumber, setFlatNumber] = useState('');
  const [block, setBlock] = useState('');

  const [loading, setLoading] = useState(false);

  // ─── Camera / Photo Picker ────────────────────────────────
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required / अनुमति आवश्यक',
          'फ़ोटो लेने के लिए कैमरा अनुमति आवश्यक है (Camera permission is required).'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPhotoUri(asset.uri);
        setPhotoBase64(
          asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : null
        );
      }
    } catch (err) {
      console.log('Camera error:', err);
      Alert.alert('Error', 'कैमरा खोलने में समस्या हुई (Failed to open camera).');
    }
  };

  // ─── Submit Form ──────────────────────────────────────────
  const handleSubmit = async () => {
    const trimmedName = visitorName.trim();
    const trimmedFlat = flatNumber.trim();
    const trimmedBlock = block.trim();
    const trimmedPhone = phone.trim();

    // Validations
    if (!trimmedName) {
      Alert.alert('Validation Error', 'कृपया विज़िटर का नाम डालें (Please enter visitor name).');
      return;
    }
    if (!purpose) {
      Alert.alert('Validation Error', 'कृपया आने का उद्देश्य चुनें (Please select purpose).');
      return;
    }
    if (!trimmedFlat) {
      Alert.alert('Validation Error', 'कृपया फ़्लैट नंबर डालें (Please enter flat number).');
      return;
    }

    setLoading(true);

    try {
      // Fetch active shift ID if exists
      const shiftData = await getShift();
      const shiftId = shiftData?._id || shiftData?.id || null;

      const payload = {
        visitorName: trimmedName,
        visitorPhone: trimmedPhone ? `+91${trimmedPhone}` : undefined,
        purpose: purpose,
        flatNumber: trimmedFlat,
        block: trimmedBlock ? trimmedBlock.toUpperCase() : undefined,
        shiftId: shiftId,
        photoBase64: photoBase64 || undefined,
      };

      console.log('Submitting Visitor Request:', payload);

      const response = await createVisitorRequest(payload);
      console.log('Visitor Request Success:', response.data);

      Alert.alert(
        'Success / सफल',
        'Request sent! Resident ko notify kar diya gaya.',
        [
          {
            text: 'OK / ठीक है',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.log('Create Visitor Error:', error.response?.data || error.message);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'अनुरोध भेजने में विफल (Failed to submit request).';

      Alert.alert('Error / त्रुटि', errorMessage);
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
          <Text style={styles.headerTitle}>New Visitor</Text>
          <Text style={styles.headerSubtitle}>नया विज़िटर</Text>
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
          {/* ─── Photo Section ───────────────────────────────────── */}
          <View style={styles.photoContainer}>
            <TouchableOpacity
              style={[styles.photoBox, photoUri && styles.photoBoxWithImage]}
              onPress={handleTakePhoto}
              activeOpacity={0.8}
            >
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.previewImage} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <View style={styles.cameraIconCircle}>
                    <Text style={styles.cameraIcon}>📷</Text>
                  </View>
                  <Text style={styles.photoPromptTitle}>Tap to take photo</Text>
                  <Text style={styles.photoPromptSubtitle}>फ़ोटो लें</Text>
                </View>
              )}
            </TouchableOpacity>

            {photoUri ? (
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={handleTakePhoto}
                activeOpacity={0.7}
              >
                <Text style={styles.retakeText}>🔄 Retake Photo / दोबारा फ़ोटो लें</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* ─── Form Fields ─────────────────────────────────────── */}
          <View style={styles.card}>
            {/* Field 1: Visitor Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Visitor Name / नाम <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor="#94A3B8"
                value={visitorName}
                onChangeText={setVisitorName}
                autoCapitalize="words"
              />
            </View>

            {/* Field 2: Phone Number */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Mobile Number / मोबाइल <Text style={styles.optional}>(Optional)</Text>
              </Text>
              <View style={styles.phoneRow}>
                <View style={styles.prefixBox}>
                  <Text style={styles.prefixText}>+91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="9876543210"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            {/* Field 3: Purpose Chips */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Purpose / आने का उद्देश्य <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.chipsContainer}>
                {PURPOSES.map((item) => {
                  const isSelected = purpose === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.chip,
                        isSelected && styles.chipSelected,
                      ]}
                      onPress={() => setPurpose(item.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.chipEmoji}>{item.icon}</Text>
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Field 4 & 5: Flat Number & Block */}
            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1.2, marginRight: 10 }]}>
                <Text style={styles.label}>
                  Flat Number / फ़्लैट <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 101 or 402"
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

          {/* ─── Submit Button ───────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Submit / भेजो</Text>
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
    paddingBottom: 40,
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
    color: '#93C5FD',
    fontWeight: '500',
  },
  headerRightPlaceholder: {
    width: 36,
  },

  // ─── Photo Section ─────────────────────────
  photoContainer: {
    alignItems: 'center',
    marginVertical: 14,
  },
  photoBox: {
    width: 150,
    height: 150,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  photoBoxWithImage: {
    borderStyle: 'solid',
    borderColor: PRIMARY,
    borderWidth: 2.5,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoPlaceholder: {
    alignItems: 'center',
    padding: 10,
  },
  cameraIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  cameraIcon: {
    fontSize: 22,
  },
  photoPromptTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: PRIMARY,
    textAlign: 'center',
  },
  photoPromptSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  retakeButton: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  retakeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },

  // ─── Card ──────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  formGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
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
  optional: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '400',
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

  // ─── Phone Row ─────────────────────────────
  phoneRow: {
    flexDirection: 'row',
  },
  prefixBox: {
    backgroundColor: PRIMARY,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  prefixText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1.5,
    borderLeftWidth: 0,
    borderColor: '#E2E8F0',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },

  // ─── Chips ─────────────────────────────────
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipSelected: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  chipEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // ─── Submit Button ─────────────────────────
  submitButton: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

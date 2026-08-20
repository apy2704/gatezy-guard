import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { loginGuard, startShift } from '../services/api';
import { saveToken, saveGuard, saveShift } from '../utils/storage';

const PRIMARY = '#1E3A5F';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    // Basic validation
    if (!phone || phone.length < 10) {
      setError('कृपया सही फ़ोन नंबर डालें (Please enter valid phone number)');
      return;
    }
    if (!pin || pin.length !== 4) {
      setError('कृपया 4-digit PIN डालें (Please enter 4-digit PIN)');
      return;
    }

    setError('');
    setLoading(true);

    try {
      console.log('Sending Guard Login Request:', { phone, pin });

      // Step 1 — Login
      const loginRes = await loginGuard(phone, pin);
      console.log('Login Response:', loginRes.data);

      const { token, guard } = loginRes.data;

      await saveToken(token);
      await saveGuard(guard);

      // Step 2 — Start shift
      const shiftRes = await startShift();
      console.log('Start Shift Response:', shiftRes.data);

      await saveShift(shiftRes.data.shift);

      // Step 3 — Navigate to Home
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (err) {
      console.log('Guard Login Error Full Object:', err);
      console.log('Error Message:', err.message);
      console.log('Error Response Status:', err.response?.status);
      console.log('Error Response Data:', err.response?.data);

      const message =
        err.response?.data?.message ||
        'लॉगिन विफल। कृपया दोबारा प्रयास करें (Login failed. Please try again)';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo & Tagline */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>GATEZY</Text>
          <Text style={styles.tagline}>Your Gate. Your Control.</Text>
          <Text style={styles.subTagline}>गार्ड ऐप</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Guard Login</Text>
          <Text style={styles.cardSubtitle}>अपना फ़ोन नंबर और PIN डालें</Text>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Phone Input */}
          <Text style={styles.label}>Phone Number / फ़ोन नंबर</Text>
          <View style={styles.phoneRow}>
            <View style={styles.prefixBox}>
              <Text style={styles.prefixText}>+91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="9876543210"
              placeholderTextColor="#A0AEC0"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          {/* PIN Input */}
          <Text style={styles.label}>PIN / पिन</Text>
          <TextInput
            style={styles.pinInput}
            placeholder="● ● ● ●"
            placeholderTextColor="#A0AEC0"
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            value={pin}
            onChangeText={setPin}
          />

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Login / लॉगिन</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Powered by GATEZY</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  // ─── Logo ──────────────────────────────────
  logoContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '900',
    color: PRIMARY,
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    letterSpacing: 1,
  },
  subTagline: {
    fontSize: 16,
    color: PRIMARY,
    fontWeight: '600',
    marginTop: 6,
  },

  // ─── Card ──────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: PRIMARY,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },

  // ─── Error ─────────────────────────────────
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    lineHeight: 18,
  },

  // ─── Inputs ────────────────────────────────
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  phoneRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  prefixBox: {
    backgroundColor: PRIMARY,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  prefixText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1.5,
    borderLeftWidth: 0,
    borderColor: '#CBD5E1',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  pinInput: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 20,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    textAlign: 'center',
    letterSpacing: 10,
    marginBottom: 24,
  },

  // ─── Button ────────────────────────────────
  loginButton: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ─── Footer ────────────────────────────────
  footer: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 32,
  },
});

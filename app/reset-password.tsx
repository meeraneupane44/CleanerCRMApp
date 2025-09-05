// app/reset-password.tsx
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Lock, RotateCw } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Supabase sends ?code=... (sometimes with token_type=recovery)
  const incomingCode = useMemo(() => {
    // expo-router gives params as strings or arrays. Normalize.
    const code =
      (Array.isArray(params.code) ? params.code[0] : params.code) ||
      (Array.isArray(params.code_verifier) ? params.code_verifier[0] : params.code_verifier) ||
      '';
    return code?.toString().trim();
  }, [params]);

  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updatedOK, setUpdatedOK] = useState(false);

  // 1) Exchange the recovery code for a session
  const exchange = useCallback(async () => {
    setVerifyError(null);
    setVerifying(true);
    try {
      if (!incomingCode) {
        setVerifyError('Missing reset code. Open the password reset link from your email on this device.');
        setVerifying(false);
        return;
      }
      // This sets a session when code is valid (token_type=recovery)
      const { error } = await supabase.auth.exchangeCodeForSession(incomingCode);
      if (error) {
        setVerifyError(error.message);
        setVerifying(false);
        return;
      }
      setVerified(true);
    } catch (e: any) {
      setVerifyError(e?.message ?? 'Could not verify reset code.');
    } finally {
      setVerifying(false);
    }
  }, [incomingCode]);

  useEffect(() => {
    exchange();
  }, [exchange]);

  // 2) Update the password once verified
  const onUpdatePassword = async () => {
    setUpdateError(null);
    if (!password || password.length < 8) {
      setUpdateError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setUpdateError('Passwords do not match.');
      return;
    }
    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setUpdateError(error.message);
        return;
      }
      setUpdatedOK(true);
      // You are still signed in after update; route to app home (or sign-in if you prefer).
      setTimeout(() => router.replace('/Home'), 800);
    } catch (e: any) {
      setUpdateError(e?.message ?? 'Could not update password.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.container}>
          <Text style={styles.brand}>DFW 20 Cleaners</Text>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {verifying
              ? 'Verifying reset link...'
              : verified
              ? 'Enter a new password for your account'
              : 'We could not verify your reset link.'}
          </Text>

          {/* Verifying */}
          {verifying && (
            <View style={[styles.centerCard, styles.card]}>
              <ActivityIndicator />
              <Text style={{ marginTop: 8 }}>Please wait…</Text>
            </View>
          )}

          {/* Verify error with retry */}
          {!verifying && !verified && (
            <View style={[styles.card, { gap: 10 }]}>
              {!!verifyError && <Text style={styles.error}>{verifyError}</Text>}
              <TouchableOpacity style={styles.secondaryBtn} onPress={exchange}>
                <RotateCw size={18} />
                <Text style={styles.secondaryBtnText}>Retry verification</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Update password form */}
          {verified && (
            <>
              <View style={styles.inputWrap}>
                <Lock size={18} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="New password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  returnKeyType="next"
                />
              </View>
              <View style={styles.inputWrap}>
                <Lock size={18} />
                <TextInput
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Confirm new password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                  returnKeyType="done"
                />
              </View>

              {!!updateError && <Text style={styles.error}>{updateError}</Text>}

              <TouchableOpacity
                style={[styles.btn, (updating || !password || !confirm) && styles.btnDisabled]}
                onPress={onUpdatePassword}
                disabled={updating || !password || !confirm}
                activeOpacity={0.8}
              >
                {updating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.btnInner}>
                    <Check size={18} color="#fff" />
                    <Text style={styles.btnText}>Update Password</Text>
                  </View>
                )}
              </TouchableOpacity>

              {updatedOK && <Text style={styles.success}>Password updated! Taking you to Home…</Text>}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  brand: { fontSize: 16, fontWeight: '600', color: '#111827', textAlign: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', textAlign: 'center', marginTop: 6 },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, textAlign: 'center' },

  card: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  centerCard: { alignItems: 'center' },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    height: 48,
    gap: 8,
  },
  input: { flex: 1, fontSize: 16, color: '#111827' },

  btn: {
    height: 48,
    backgroundColor: '#10B981',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  secondaryBtn: {
    height: 44,
    borderRadius: 10,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600', color: '#111827' },

  error: { color: '#DC2626', fontSize: 13, textAlign: 'center' },
  success: { color: '#065F46', fontSize: 13, textAlign: 'center' },
});

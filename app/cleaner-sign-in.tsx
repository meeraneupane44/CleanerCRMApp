import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Lock, LogIn, Mail } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
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

export default function CleanerSignInScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const goHome = useCallback(() => {
    // 🔁 Route into your tabs group
    router.replace('/(tabs)/Home');
  }, [router]);

  const verifyCleanerAndProceed = useCallback(
    async (userId: string) => {
      // Ensure this user is a cleaner
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        setAuthError(error.message);
        await supabase.auth.signOut();
        return;
      }
      if (data?.role !== 'cleaner') {
        setAuthError('This account is not authorized for the Cleaner app.');
        await supabase.auth.signOut();
        return;
      }
      goHome();
    },
    [goHome]
  );

  // If already signed in, route straight in (after role check)
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (mounted && userId) {
        await verifyCleanerAndProceed(userId);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const userId = session?.user?.id;
      if (userId) await verifyCleanerAndProceed(userId);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [verifyCleanerAndProceed]);

  const onSignIn = async () => {
    setAuthError(null);
    if (!email.trim() || !password) {
      setAuthError('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        setAuthError(error.message);
        return;
      }
      const userId = data.user?.id;
      if (userId) await verifyCleanerAndProceed(userId);
    } catch (e: any) {
      setAuthError(e?.message ?? 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onForgotPassword = async () => {
    setAuthError(null);
    if (!email.trim()) {
      setAuthError('Enter your email above first.');
      return;
    }
    try {
      const redirectTo =
        process.env.EXPO_PUBLIC_SUPABASE_RESET_REDIRECT_URL || 'yourapp://reset-password';
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo,
      });
      if (error) {
        setAuthError(error.message);
        return;
      }
      setAuthError('Password reset email sent (check your inbox).');
    } catch (e: any) {
      setAuthError(e?.message ?? 'Could not send reset email.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.container}>
          {/* Logo / Title */}
          <View style={styles.header}>
            <Text style={styles.brand}>DFW 20 Cleaners</Text>
            <Text style={styles.title}>Cleaner Sign In</Text>
            <Text style={styles.subtitle}>Use your cleaner account to continue</Text>
          </View>

          {/* Email */}
          <View style={styles.inputWrap}>
            <Mail size={18} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <View style={styles.inputWrap}>
            <Lock size={18} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry={!showPw}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              returnKeyType="done"
            />
            <TouchableOpacity onPress={() => setShowPw((s) => !s)} hitSlop={8}>
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </TouchableOpacity>
          </View>

          {/* Error */}
          {!!authError && <Text style={styles.error}>{authError}</Text>}

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.btn, (!email || !password || loading) && styles.btnDisabled]}
            onPress={onSignIn}
            disabled={!email || !password || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.btnInner}>
                <LogIn size={18} color="#fff" />
                <Text style={styles.btnText}>Sign In</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Links */}
          <View style={styles.linksRow}>
            <TouchableOpacity onPress={onForgotPassword}>
              <Text style={styles.linkText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Footer hint */}
          <Text style={styles.footerHint}>Only cleaners can access this app.</Text>
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
  header: { marginBottom: 8, alignItems: 'center' },
  brand: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 6 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
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
  error: { color: '#DC2626', fontSize: 13, textAlign: 'center' },
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
  linksRow: { alignItems: 'center' },
  linkText: { color: '#2563EB', fontSize: 14, fontWeight: '600' },
  footerHint: { textAlign: 'center', color: '#9CA3AF', marginTop: 8 },
});

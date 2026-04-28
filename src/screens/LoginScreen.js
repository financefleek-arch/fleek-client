// src/screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { login } from '../api/client';
import { colors, fonts, radius } from '../theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password');
      return;
    }
    setLoading(true);
    setError('');
    const res = await login(email.trim().toLowerCase(), password);
    setLoading(false);

    if (res?.status === 'success') {
      if (res.role === 'advisor') {
        setError('Advisor login is not available on mobile. Please use the web dashboard.');
        return;
      }
      await signIn(res);
    } else {
      setError(res?.error || 'Login failed. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logo}>
            fleek<Text style={styles.logoAccent}>.</Text>finance
          </Text>
          <Text style={styles.logoSub}>Your financial planning dashboard</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor={colors.gray400}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={colors.gray400}
            secureTextEntry
            onSubmitEditing={handleLogin}
            returnKeyType="done"
          />

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={colors.white} />
              : <Text style={styles.btnText}>Sign in</Text>
            }
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          For support, visit fleekfinance.in
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:       { flex: 1, backgroundColor: colors.navy },
  container:  { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrap:   { alignItems: 'center', marginBottom: 36 },
  logo:       { fontSize: 28, fontFamily: fonts.semibold, color: colors.white, letterSpacing: -0.5 },
  logoAccent: { color: colors.accent },
  logoSub:    { fontSize: 14, color: colors.gray400, marginTop: 6 },
  card:       { backgroundColor: colors.navyMid, borderRadius: radius.xl, padding: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  cardTitle:  { fontSize: 20, fontFamily: fonts.semibold, color: colors.white, marginBottom: 24 },
  label:      { fontSize: 11, fontFamily: fonts.semibold, color: colors.gray400, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  input:      { backgroundColor: colors.navyLight, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: radius.sm, padding: 13, fontSize: 15, color: colors.white, marginBottom: 16 },
  errorBox:   { backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: radius.sm, padding: 12, marginBottom: 16 },
  errorText:  { fontSize: 13, color: '#FCA5A5', lineHeight: 18 },
  btn:        { backgroundColor: colors.accent, borderRadius: radius.sm, padding: 14, alignItems: 'center', marginTop: 4 },
  btnDisabled:{ opacity: 0.6 },
  btnText:    { fontSize: 15, fontFamily: fonts.semibold, color: colors.white },
  footer:     { textAlign: 'center', fontSize: 12, color: colors.gray400, marginTop: 32 },
});

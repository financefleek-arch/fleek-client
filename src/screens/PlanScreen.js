// src/screens/PlanScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, ActivityIndicator, TouchableOpacity
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getFamilyPlan } from '../api/client';
import { colors, fonts, radius, shadow } from '../theme';

export default function PlanScreen() {
  const { auth }  = useAuth();
  const [plan,       setPlan]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded,   setExpanded]   = useState({});

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    const res = await getFamilyPlan(auth.familyId);
    if (isRefresh) setRefreshing(false); else setLoading(false);
    if (res && !res.error) setPlan(res);
  }, [auth.familyId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.accent} size="large" /></View>;

  if (!plan?.plan && !plan?.pdf_data) return (
    <View style={s.center}>
      <Text style={s.emptyIcon}>📋</Text>
      <Text style={s.emptyTitle}>No plan yet</Text>
      <Text style={s.emptyMsg}>Your advisor will generate a personalised financial plan once your data is complete.</Text>
    </View>
  );

  // PDF plan
  if (plan.pdf_data) {
    return (
      <View style={s.center}>
        <Text style={s.pdfIcon}>📄</Text>
        <Text style={s.pdfTitle}>Your Financial Plan</Text>
        <Text style={s.pdfMsg}>Your advisor has uploaded a PDF financial plan.</Text>
        <Text style={s.pdfNote}>PDF viewing is available on the web dashboard at fleekfinance.in</Text>
        {plan.updated_at && <Text style={s.pdfDate}>Updated {plan.updated_at}</Text>}
      </View>
    );
  }

  // Parse plan into sections by headers
  const sections = [];
  let current = null;
  for (const line of plan.plan.split('\n')) {
    const h2 = line.match(/^#{1,2}\s+(.+)/);
    const h3 = line.match(/^#{3}\s+(.+)/);
    if (h2) {
      if (current) sections.push(current);
      current = { title: h2[1].replace(/^\d+\.\s*/, ''), lines: [] };
    } else if (h3) {
      current?.lines.push({ type: 'h3', text: h3[1] });
    } else if (line.trim()) {
      current?.lines.push({ type: 'text', text: line.replace(/\*\*(.+?)\*\*/g, '$1') });
    }
  }
  if (current) sections.push(current);

  const toggleSection = (i) => setExpanded(prev => ({ ...prev, [i]: !prev[i] }));

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)} tintColor={colors.accent} />}>
      {plan.updated_at && <Text style={s.date}>Updated {plan.updated_at}</Text>}
      {sections.map((sec, i) => (
        <View key={i} style={s.section}>
          <TouchableOpacity style={s.sectionHeader} onPress={() => toggleSection(i)} activeOpacity={0.7}>
            <Text style={s.sectionTitle}>{sec.title}</Text>
            <Text style={s.chevron}>{expanded[i] ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {expanded[i] && (
            <View style={s.sectionBody}>
              {sec.lines.map((l, j) => l.type === 'h3'
                ? <Text key={j} style={s.h3}>{l.text}</Text>
                : <Text key={j} style={s.bodyText}>{l.text}</Text>
              )}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}


// ── Settings Screen ───────────────────────────────────────────────
import { TextInput, Alert } from 'react-native';
import { useAuth as _useAuth } from '../context/AuthContext';
import { changePassword, logout } from '../api/client';

export function SettingsScreen() {
  const { auth, signOut }  = _useAuth();
  const [current,  setCurrent]  = useState('');
  const [newPass,  setNewPass]  = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const handleChangePassword = async () => {
    setError(''); setSuccess('');
    if (!current || !newPass || !confirm) { setError('All fields are required'); return; }
    if (newPass.length < 6) { setError('New password must be at least 6 characters'); return; }
    if (newPass !== confirm) { setError('New passwords do not match'); return; }
    setLoading(true);
    const res = await changePassword(auth.memberId, current, newPass);
    setLoading(false);
    if (res?.status === 'success') {
      setSuccess('Password changed successfully!');
      setCurrent(''); setNewPass(''); setConfirm('');
    } else {
      setError(res?.error || 'Failed to change password');
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: async () => {
        await logout();
        signOut();
      }},
    ]);
  };

  return (
    <ScrollView style={ss.scroll} contentContainerStyle={ss.content}>
      <Text style={ss.name}>{auth.name}</Text>
      <Text style={ss.email}>{auth.username}</Text>

      {auth.allowPasswordChange ? (
        <View style={ss.card}>
          <Text style={ss.cardTitle}>Change Password</Text>
          {[
            ['Current Password', current, setCurrent, 'Enter current password'],
            ['New Password',     newPass, setNewPass, 'At least 6 characters'],
            ['Confirm Password', confirm, setConfirm, 'Repeat new password'],
          ].map(([label, val, setter, placeholder]) => (
            <View key={label}>
              <Text style={ss.label}>{label}</Text>
              <TextInput
                style={ss.input}
                value={val}
                onChangeText={setter}
                placeholder={placeholder}
                placeholderTextColor={colors.gray400}
                secureTextEntry
              />
            </View>
          ))}
          {error   ? <View style={ss.errorBox}><Text style={ss.errorText}>{error}</Text></View>   : null}
          {success ? <View style={ss.successBox}><Text style={ss.successText}>{success}</Text></View> : null}
          <TouchableOpacity style={[ss.btn, loading && ss.btnDisabled]} onPress={handleChangePassword} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={ss.btnText}>Update Password</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={ss.disabledCard}>
          <Text style={ss.disabledText}>Password changes have been disabled for your account. Contact your advisor to update your password.</Text>
        </View>
      )}

      <TouchableOpacity style={ss.logoutBtn} onPress={handleLogout}>
        <Text style={ss.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:        { flex: 1, backgroundColor: colors.background },
  content:       { padding: 16, paddingBottom: 32 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon:     { fontSize: 40, marginBottom: 12 },
  emptyTitle:    { fontSize: 16, fontFamily: fonts.semibold, color: colors.text, marginBottom: 8 },
  emptyMsg:      { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
  pdfIcon:       { fontSize: 48, marginBottom: 16 },
  pdfTitle:      { fontSize: 18, fontFamily: fonts.semibold, color: colors.text, marginBottom: 8 },
  pdfMsg:        { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 12 },
  pdfNote:       { fontSize: 13, color: colors.accent, textAlign: 'center', lineHeight: 19 },
  pdfDate:       { fontSize: 12, color: colors.gray400, marginTop: 12 },
  date:          { fontSize: 12, color: colors.textMuted, marginBottom: 16, textAlign: 'center' },
  section:       { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 10, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: colors.gray50 },
  sectionTitle:  { fontSize: 13, fontFamily: fonts.semibold, color: colors.text, flex: 1 },
  chevron:       { fontSize: 10, color: colors.textMuted, marginLeft: 8 },
  sectionBody:   { padding: 16 },
  h3:            { fontSize: 13, fontFamily: fonts.semibold, color: colors.accent, marginBottom: 6, marginTop: 10 },
  bodyText:      { fontSize: 13, color: colors.text, lineHeight: 20, marginBottom: 4 },
});

const ss = StyleSheet.create({
  scroll:       { flex: 1, backgroundColor: colors.background },
  content:      { padding: 20, paddingBottom: 40 },
  name:         { fontSize: 20, fontFamily: fonts.semibold, color: colors.text, marginBottom: 4 },
  email:        { fontSize: 14, color: colors.textMuted, marginBottom: 28 },
  card:         { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: 20, marginBottom: 16, ...shadow.sm },
  cardTitle:    { fontSize: 15, fontFamily: fonts.semibold, color: colors.text, marginBottom: 18 },
  label:        { fontSize: 11, fontFamily: fonts.semibold, color: colors.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 },
  input:        { backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.sm, padding: 12, fontSize: 14, color: colors.text, marginBottom: 14 },
  errorBox:     { backgroundColor: 'rgba(239,68,68,.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,.2)', borderRadius: radius.sm, padding: 12, marginBottom: 14 },
  errorText:    { fontSize: 13, color: colors.red },
  successBox:   { backgroundColor: 'rgba(16,185,129,.08)', borderWidth: 1, borderColor: 'rgba(16,185,129,.2)', borderRadius: radius.sm, padding: 12, marginBottom: 14 },
  successText:  { fontSize: 13, color: colors.green },
  btn:          { backgroundColor: colors.accent, borderRadius: radius.sm, padding: 13, alignItems: 'center' },
  btnDisabled:  { opacity: 0.6 },
  btnText:      { fontSize: 14, fontFamily: fonts.semibold, color: colors.white },
  disabledCard: { backgroundColor: 'rgba(245,158,11,.07)', borderWidth: 1, borderColor: 'rgba(245,158,11,.2)', borderRadius: radius.md, padding: 16, marginBottom: 16 },
  disabledText: { fontSize: 13, color: colors.amber, lineHeight: 19 },
  logoutBtn:    { backgroundColor: 'rgba(239,68,68,.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,.2)', borderRadius: radius.md, padding: 14, alignItems: 'center', marginTop: 8 },
  logoutText:   { fontSize: 14, fontFamily: fonts.semibold, color: colors.red },
});

// src/screens/GoalsScreen.js
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getFamilyData, saveGoals, saveClientNote } from '../api/client';
import { colors, fonts, radius, shadow, fmtL } from '../theme';

const GOAL_CATEGORIES = [
  'Retirement', 'Home Purchase', 'Education', 'Car',
  'Emergency Fund', 'Wedding', 'Travel', 'Business',
  'Wealth Creation', 'Other',
];

export default function GoalsScreen() {
  const { auth } = useAuth();
  const [goals,       setGoals]       = useState([]);
  const [note,        setNote]        = useState('');
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [goalSaving,  setGoalSaving]  = useState(false);
  const [noteSaving,  setNoteSaving]  = useState(false);
  const [goalMsg,     setGoalMsg]     = useState({ type: '', text: '' });
  const [noteMsg,     setNoteMsg]     = useState({ type: '', text: '' });

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    const res = await getFamilyData(auth.familyId);
    if (isRefresh) setRefreshing(false); else setLoading(false);
    if (res && !res.error) {
      setGoals(res.family_data?.goals || []);
      setNote(res.family_data?.client_notes?.note || '');
    }
  }, [auth.familyId]);

  useEffect(() => { load(); }, [load]);

  const addGoal = () => setGoals(prev => [...prev, { category: 'Wealth Creation', amount: '', target_year: '' }]);
  const removeGoal = (idx) => setGoals(prev => prev.filter((_, i) => i !== idx));
  const updateGoal = (idx, field, value) => setGoals(prev =>
    prev.map((g, i) => i === idx ? { ...g, [field]: value } : g)
  );
  const cycleCategory = (idx) => {
    const current = goals[idx].category;
    const next = GOAL_CATEGORIES[(GOAL_CATEGORIES.indexOf(current) + 1) % GOAL_CATEGORIES.length];
    updateGoal(idx, 'category', next);
  };

  const handleSaveGoals = async () => {
    for (const g of goals) {
      if (!g.target_year) {
        setGoalMsg({ type: 'error', text: 'Please enter a target year for all goals' });
        return;
      }
    }
    setGoalSaving(true);
    const res = await saveGoals(auth.familyId, goals);
    setGoalSaving(false);
    if (res?.status === 'success') {
      setGoalMsg({ type: 'success', text: 'Goals saved!' });
      setTimeout(() => setGoalMsg({ type: '', text: '' }), 3000);
    } else {
      setGoalMsg({ type: 'error', text: res?.error || 'Failed to save goals' });
    }
  };

  const handleSaveNote = async () => {
    setNoteSaving(true);
    const res = await saveClientNote(auth.familyId, note);
    setNoteSaving(false);
    if (res?.status === 'success') {
      setNoteMsg({ type: 'success', text: 'Note sent to your advisor!' });
      setTimeout(() => setNoteMsg({ type: '', text: '' }), 3000);
    } else {
      setNoteMsg({ type: 'error', text: res?.error || 'Failed to save note' });
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.accent} size="large" /></View>;

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.accent} />}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.subtitle}>Your advisor uses this to personalise your financial plan.</Text>

      {/* Goals card */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle}>Financial Goals</Text>
          <TouchableOpacity style={s.addBtn} onPress={addGoal}>
            <Text style={s.addBtnText}>+ Add Goal</Text>
          </TouchableOpacity>
        </View>

        {goals.length === 0 ? (
          <Text style={s.empty}>No goals yet. Tap "+ Add Goal" to get started.</Text>
        ) : (
          goals.map((goal, idx) => (
            <View key={idx} style={s.goalRow}>
              {/* Category pill — tap to cycle */}
              <TouchableOpacity style={s.categoryPill} onPress={() => cycleCategory(idx)}>
                <Text style={s.categoryText}>{goal.category}</Text>
                <Text style={s.categoryChevron}> ▾</Text>
              </TouchableOpacity>
              <View style={s.goalInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={s.inputLabel}>Target (₹)</Text>
                  <TextInput
                    style={s.goalInput}
                    value={goal.amount ? String(goal.amount) : ''}
                    onChangeText={v => updateGoal(idx, 'amount', v)}
                    placeholder="50,00,000"
                    placeholderTextColor={colors.gray400}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ width: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={s.inputLabel}>Year</Text>
                  <TextInput
                    style={s.goalInput}
                    value={goal.target_year ? String(goal.target_year) : ''}
                    onChangeText={v => updateGoal(idx, 'target_year', v)}
                    placeholder="2035"
                    placeholderTextColor={colors.gray400}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
                <TouchableOpacity style={s.removeBtn} onPress={() => removeGoal(idx)}>
                  <Text style={s.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {goalMsg.text ? (
          <View style={[s.msg, goalMsg.type === 'error' ? s.msgError : s.msgSuccess]}>
            <Text style={[s.msgText, goalMsg.type === 'error' ? { color: colors.red } : { color: colors.green }]}>
              {goalMsg.text}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity style={[s.btn, goalSaving && s.btnDisabled]} onPress={handleSaveGoals} disabled={goalSaving}>
          {goalSaving ? <ActivityIndicator color={colors.white} /> : <Text style={s.btnText}>Save Goals</Text>}
        </TouchableOpacity>
      </View>

      {/* Note to advisor */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Note to Advisor</Text>
        <Text style={s.noteHint}>Share upcoming life events, concerns, or context for your plan.</Text>
        <TextInput
          style={s.noteInput}
          value={note}
          onChangeText={setNote}
          placeholder="e.g. Planning to buy a house in 2 years. Expecting a salary hike next quarter..."
          placeholderTextColor={colors.gray400}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
        {noteMsg.text ? (
          <View style={[s.msg, noteMsg.type === 'error' ? s.msgError : s.msgSuccess]}>
            <Text style={[s.msgText, noteMsg.type === 'error' ? { color: colors.red } : { color: colors.green }]}>
              {noteMsg.text}
            </Text>
          </View>
        ) : null}
        <TouchableOpacity style={[s.btn, noteSaving && s.btnDisabled]} onPress={handleSaveNote} disabled={noteSaving}>
          {noteSaving ? <ActivityIndicator color={colors.white} /> : <Text style={s.btnText}>Send Note</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:         { flex: 1, backgroundColor: colors.background },
  content:        { padding: 16, paddingBottom: 40 },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  subtitle:       { fontSize: 13, color: colors.textMuted, marginBottom: 16, lineHeight: 18 },
  card:           { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: 18, marginBottom: 16, ...shadow.sm },
  cardHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle:      { fontSize: 15, fontFamily: fonts.semibold, color: colors.text },
  addBtn:         { backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  addBtnText:     { fontSize: 12, fontFamily: fonts.semibold, color: colors.white },
  empty:          { fontSize: 13, color: colors.textMuted, textAlign: 'center', padding: 20 },
  goalRow:        { marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  categoryPill:   { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(59,130,246,.08)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 10 },
  categoryText:   { fontSize: 13, fontFamily: fonts.medium, color: colors.accent },
  categoryChevron:{ fontSize: 11, color: colors.accent },
  goalInputs:     { flexDirection: 'row', alignItems: 'flex-end' },
  inputLabel:     { fontSize: 10, fontFamily: fonts.semibold, color: colors.textMuted, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 5 },
  goalInput:      { backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.sm, padding: 10, fontSize: 14, color: colors.text },
  removeBtn:      { width: 34, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239,68,68,.08)', borderRadius: 7, marginLeft: 8 },
  removeBtnText:  { fontSize: 13, color: colors.red },
  noteHint:       { fontSize: 12, color: colors.textMuted, marginBottom: 10, lineHeight: 17 },
  noteInput:      { backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.sm, padding: 12, fontSize: 14, color: colors.text, marginBottom: 14, minHeight: 110 },
  msg:            { borderRadius: radius.sm, padding: 10, marginBottom: 12 },
  msgError:       { backgroundColor: 'rgba(239,68,68,.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,.2)' },
  msgSuccess:     { backgroundColor: 'rgba(16,185,129,.08)', borderWidth: 1, borderColor: 'rgba(16,185,129,.2)' },
  msgText:        { fontSize: 13 },
  btn:            { backgroundColor: colors.accent, borderRadius: radius.sm, padding: 13, alignItems: 'center' },
  btnDisabled:    { opacity: 0.6 },
  btnText:        { fontSize: 14, fontFamily: fonts.semibold, color: colors.white },
});

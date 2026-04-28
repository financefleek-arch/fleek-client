// src/screens/CashFlowScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getFamilyData } from '../api/client';
import { colors, fonts, radius, shadow, fmtL, avatarColor, initials } from '../theme';

const EXP_KEYS = ['emi','rent','sip','savings','household','transport','lifestyle','insurance_premium','other_expenses'];
const EXP_LABELS = { emi:'EMI', rent:'Rent', sip:'SIP/Invest', savings:'Savings', household:'Household', transport:'Transport', lifestyle:'Lifestyle', insurance_premium:'Insurance', other_expenses:'Other' };
const EXP_COLORS = ['#3B82F6','#F59E0B','#10B981','#EF4444','#6366F1','#F97316','#8B5CF6','#14B8A6','#6B7280'];

export default function CashFlowScreen() {
  const { auth } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    const res = await getFamilyData(auth.familyId);
    if (isRefresh) setRefreshing(false); else setLoading(false);
    if (res && !res.error) setData(res);
  }, [auth.familyId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.accent} size="large" /></View>;

  const members    = data?.members || [];
  const memberData = data?.member_data || {};

  let tIncome = 0, tExp = 0;
  const expTotals = {};

  members.forEach(m => {
    const ie = memberData[m.id]?.income_expenses || {};
    tIncome += ['primary_income','secondary_income','rental_income','other_income'].reduce((s,k)=>s+(ie[k]||0),0);
    EXP_KEYS.forEach(k => { expTotals[k] = (expTotals[k]||0)+(ie[k]||0); });
    tExp += EXP_KEYS.reduce((s,k)=>s+(ie[k]||0),0);
  });

  const surplus = tIncome - tExp;

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)} tintColor={colors.accent} />}>

      {/* Summary row */}
      <View style={s.summaryRow}>
        <View style={[s.summaryBox, { backgroundColor: 'rgba(16,185,129,.07)' }]}>
          <Text style={s.summaryLabel}>Income</Text>
          <Text style={[s.summaryVal, { color: colors.green }]}>{fmtL(tIncome)}</Text>
        </View>
        <View style={[s.summaryBox, { backgroundColor: 'rgba(239,68,68,.07)' }]}>
          <Text style={s.summaryLabel}>Expenses</Text>
          <Text style={[s.summaryVal, { color: colors.red }]}>{fmtL(tExp)}</Text>
        </View>
        <View style={[s.summaryBox, { backgroundColor: surplus>=0?'rgba(59,130,246,.07)':'rgba(239,68,68,.07)' }]}>
          <Text style={s.summaryLabel}>Surplus</Text>
          <Text style={[s.summaryVal, { color: surplus>=0?colors.accent:colors.red }]}>{fmtL(surplus)}</Text>
        </View>
      </View>

      {/* Expense breakdown */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Expense Breakdown</Text>
        {EXP_KEYS.filter(k=>expTotals[k]>0).map((k,i) => (
          <View key={k} style={s.expRow}>
            <View style={[s.expDot, { backgroundColor: EXP_COLORS[i % EXP_COLORS.length] }]} />
            <Text style={s.expLabel}>{EXP_LABELS[k]}</Text>
            <View style={s.expBarWrap}>
              <View style={[s.expBarFill, {
                width: `${tExp?(expTotals[k]/tExp*100).toFixed(0):0}%`,
                backgroundColor: EXP_COLORS[i % EXP_COLORS.length]
              }]} />
            </View>
            <Text style={s.expVal}>{fmtL(expTotals[k])}</Text>
          </View>
        ))}
      </View>

      {/* Per member */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Per Member</Text>
        {members.map(m => {
          const ie  = memberData[m.id]?.income_expenses || {};
          const inc = ['primary_income','secondary_income','rental_income','other_income'].reduce((s,k)=>s+(ie[k]||0),0);
          const exp = EXP_KEYS.reduce((s,k)=>s+(ie[k]||0),0);
          return (
            <View key={m.id} style={s.memberBlock}>
              <View style={s.memberRow}>
                <View style={[s.avatar, { backgroundColor: avatarColor(m.name) }]}>
                  <Text style={s.avatarText}>{initials(m.name)}</Text>
                </View>
                <Text style={s.memberName}>{m.name}</Text>
              </View>
              <View style={s.memberMetrics}>
                {[['Income', fmtL(inc), colors.green], ['Expenses', fmtL(exp), colors.red], ['Surplus', fmtL(inc-exp), inc-exp>=0?colors.accent:colors.red]].map(([l,v,c])=>(
                  <View key={l} style={s.metricBox}>
                    <Text style={s.metricLabel}>{l}</Text>
                    <Text style={[s.metricVal, { color: c }]}>{v}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:        { flex: 1, backgroundColor: colors.background },
  content:       { padding: 16, paddingBottom: 32 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summaryRow:    { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryBox:    { flex: 1, borderRadius: radius.md, padding: 14, alignItems: 'center' },
  summaryLabel:  { fontSize: 11, color: colors.textMuted, fontFamily: fonts.medium, marginBottom: 4 },
  summaryVal:    { fontSize: 14, fontFamily: fonts.semibold },
  card:          { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: 18, marginBottom: 16, ...shadow.sm },
  cardTitle:     { fontSize: 14, fontFamily: fonts.semibold, color: colors.text, marginBottom: 14 },
  expRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  expDot:        { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  expLabel:      { width: 80, fontSize: 12, color: colors.textMuted },
  expBarWrap:    { flex: 1, height: 6, backgroundColor: colors.gray200, borderRadius: 3, overflow: 'hidden' },
  expBarFill:    { height: '100%', borderRadius: 3 },
  expVal:        { width: 64, fontSize: 11, textAlign: 'right', fontFamily: fonts.medium, color: colors.text },
  memberBlock:   { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  memberRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar:        { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarText:    { fontSize: 11, fontFamily: fonts.semibold, color: colors.white },
  memberName:    { fontSize: 13, fontFamily: fonts.semibold, color: colors.text },
  memberMetrics: { flexDirection: 'row', gap: 8 },
  metricBox:     { flex: 1, backgroundColor: colors.gray50, borderRadius: 7, padding: 10, alignItems: 'center' },
  metricLabel:   { fontSize: 10, color: colors.textMuted, marginBottom: 3 },
  metricVal:     { fontSize: 12, fontFamily: fonts.semibold },
});

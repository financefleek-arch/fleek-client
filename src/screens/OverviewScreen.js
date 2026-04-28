// src/screens/OverviewScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getFamilyData } from '../api/client';
import { StatCard } from '../components/StatCard';
import { AllocBar } from '../components/AllocBar';
import { HealthScore } from '../components/index';
import { colors, fonts, radius, shadow, fmtL } from '../theme';

const ALLOC_COLORS = {
  'Real estate': '#3B82F6',
  'Gold':        '#F59E0B',
  'Cash + Debt': '#10B981',
  'Equity / MF': '#8B5CF6',
  'EPF / PPF':   '#6366F1',
  'Vehicles':    '#9CA3AF',
};

export default function OverviewScreen() {
  const { auth } = useAuth();
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    const res = await getFamilyData(auth.familyId);
    if (isRefresh) setRefreshing(false);
    else setLoading(false);

    if (res?.error) { setError(res.error); return; }
    setData(res);
  }, [auth.familyId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );

  if (error) return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{error}</Text>
    </View>
  );

  // Compute combined numbers
  const members    = data?.members || [];
  const memberData = data?.member_data || {};

  let tIncome=0, tExp=0, tAssets=0, tLiab=0, tSip=0, tEmi=0;
  const assetTotals = {};

  members.forEach(m => {
    const ie = memberData[m.id]?.income_expenses || {};
    const al = memberData[m.id]?.assets_liabilities || {};
    tIncome += ['primary_income','secondary_income','rental_income','other_income'].reduce((s,k)=>s+(ie[k]||0),0);
    tExp    += ['emi','rent','sip','savings','household','transport','lifestyle','insurance_premium','other_expenses'].reduce((s,k)=>s+(ie[k]||0),0);
    tAssets += ['real_estate','gold','equity','debt_instruments','epf_ppf','cash','vehicles','other_assets'].reduce((s,k)=>s+(al[k]||0),0);
    tLiab   += ['home_loan','car_loan','personal_loan','credit_card','other_loans'].reduce((s,k)=>s+(al[k]||0),0);
    tSip    += (ie.sip||0)+(ie.savings||0);
    tEmi    += (ie.emi||0);

    // Build allocation totals
    assetTotals['Real estate'] = (assetTotals['Real estate']||0)+(al.real_estate||0);
    assetTotals['Gold']        = (assetTotals['Gold']||0)+(al.gold||0);
    assetTotals['Cash + Debt'] = (assetTotals['Cash + Debt']||0)+(al.debt_instruments||0)+(al.cash||0);
    assetTotals['Equity / MF'] = (assetTotals['Equity / MF']||0)+(al.equity||0);
    assetTotals['EPF / PPF']   = (assetTotals['EPF / PPF']||0)+(al.epf_ppf||0);
    assetTotals['Vehicles']    = (assetTotals['Vehicles']||0)+(al.vehicles||0);
  });

  const surplus  = tIncome - tExp;
  const savRate  = tIncome ? ((tSip / tIncome) * 100).toFixed(1) : 0;
  const dti      = tIncome ? tEmi / tIncome : 0;

  // Health score
  let score = 5;
  if (savRate >= 30) score += 2; else if (savRate >= 20) score += 1;
  if (dti < 0.3) score += 1; else if (dti > 0.5) score -= 1.5;
  if (surplus > 0) score += 0.5;
  score = Math.min(10, Math.max(1, Math.round(score * 10) / 10));
  const scoreLabel = score >= 7 ? 'Good shape' : score >= 5 ? 'Needs attention' : 'Needs improvement';

  // Insights
  const insights = [];
  if (savRate >= 20) insights.push({ type: 'green', icon: '✅', title: 'Strong savings rate', body: `${savRate}% of income saved — above 20% benchmark.` });
  else               insights.push({ type: 'amber', icon: '⚠️', title: 'Low savings rate',   body: `${savRate}% saved. Aim for at least 20%.` });
  if (dti > 0.4)     insights.push({ type: 'red',   icon: '🔴', title: 'High EMI burden',    body: `EMI is ${(dti*100).toFixed(0)}% of income. Keep below 40%.` });
  else if (tEmi > 0) insights.push({ type: 'green', icon: '✅', title: 'EMI well managed',   body: `EMI is ${(dti*100).toFixed(0)}% of income — healthy.` });

  const allocItems = Object.entries(assetTotals)
    .filter(([,v]) => v > 0)
    .sort((a,b) => b[1]-a[1]);

  const insightBg = { green: 'rgba(16,185,129,.08)', amber: 'rgba(245,158,11,.08)', red: 'rgba(239,68,68,.08)' };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.accent} />}
    >
      {/* Greeting */}
      <Text style={styles.greeting}>Good day, {auth.name.split(' ')[0]} 👋</Text>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatCard label="Family Net Worth" value={fmtL(tAssets-tLiab)} valueColor={colors.accent} />
          <View style={{ width: 12 }} />
          <StatCard label="Monthly Surplus" value={fmtL(surplus)} valueColor={surplus >= 0 ? colors.green : colors.red} />
        </View>
        <View style={[styles.statsRow, { marginTop: 12 }]}>
          <StatCard label="Total EMI" value={fmtL(tEmi)} />
          <View style={{ width: 12 }} />
          <StatCard label="Savings Rate" value={`${savRate}%`} sub="SIP + savings / income" />
        </View>
      </View>

      {/* Asset Allocation */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Asset Allocation</Text>
        {allocItems.length ? allocItems.map(([label, value]) => (
          <AllocBar
            key={label}
            label={label}
            pct={tAssets ? parseFloat((value / tAssets * 100).toFixed(1)) : 0}
            amount={fmtL(value)}
            color={ALLOC_COLORS[label] || colors.accent}
          />
        )) : <Text style={styles.empty}>No asset data yet</Text>}
      </View>

      {/* Health Score */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Family Health Score</Text>
        <HealthScore score={score} />
        <Text style={[styles.scoreLabel, { color: score >= 7 ? colors.green : score >= 5 ? colors.amber : colors.red }]}>
          {scoreLabel}
        </Text>
        <View style={styles.divider} />
        {[
          ['Savings rate',  `${savRate}%`],
          ['EMI / income',  `${(dti*100).toFixed(1)}%`],
          ['Debt / assets', tAssets ? `${(tLiab/tAssets*100).toFixed(1)}%` : '—'],
        ].map(([k,v]) => (
          <View key={k} style={styles.metaRow}>
            <Text style={styles.metaKey}>{k}</Text>
            <Text style={styles.metaVal}>{v}</Text>
          </View>
        ))}
      </View>

      {/* Insights */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Key Insights</Text>
        {insights.map((ins, i) => (
          <View key={i} style={[styles.insight, { backgroundColor: insightBg[ins.type] }]}>
            <Text style={styles.insightIcon}>{ins.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.insightTitle}>{ins.title}</Text>
              <Text style={styles.insightBody}>{ins.body}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:      { flex: 1, backgroundColor: colors.background },
  content:     { padding: 16, paddingBottom: 32 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText:   { color: colors.red, fontSize: 14 },
  greeting:    { fontSize: 20, fontFamily: fonts.semibold, color: colors.text, marginBottom: 16 },
  statsGrid:   { marginBottom: 16 },
  statsRow:    { flexDirection: 'row' },
  card:        { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: 18, marginBottom: 16, ...shadow.sm },
  cardTitle:   { fontSize: 14, fontFamily: fonts.semibold, color: colors.text, marginBottom: 14 },
  empty:       { fontSize: 13, color: colors.textMuted },
  scoreLabel:  { textAlign: 'center', fontSize: 13, marginTop: 8, fontFamily: fonts.medium },
  divider:     { height: 1, backgroundColor: colors.gray200, marginVertical: 14 },
  metaRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  metaKey:     { fontSize: 12, color: colors.textMuted },
  metaVal:     { fontSize: 12, fontFamily: fonts.semibold, color: colors.text },
  insight:     { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 9, marginBottom: 8 },
  insightIcon: { fontSize: 16 },
  insightTitle:{ fontSize: 13, fontFamily: fonts.semibold, color: colors.text, marginBottom: 2 },
  insightBody: { fontSize: 12, color: colors.textMuted, lineHeight: 17 },
});

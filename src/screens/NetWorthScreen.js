// src/screens/NetWorthScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getFamilyData } from '../api/client';
import { colors, fonts, radius, shadow, fmtL, avatarColor, initials } from '../theme';

const ASSET_KEYS = ['real_estate','gold','equity','debt_instruments','epf_ppf','cash','vehicles','other_assets'];
const LIAB_KEYS  = ['home_loan','car_loan','personal_loan','credit_card','other_loans'];
const ASSET_LABELS = { real_estate:'Real estate', gold:'Gold', equity:'Equity/MF', debt_instruments:'Debt/Bonds', epf_ppf:'EPF/PPF', cash:'Cash/Bank', vehicles:'Vehicles', other_assets:'Other' };
const LIAB_LABELS  = { home_loan:'Home loan', car_loan:'Car loan', personal_loan:'Personal loan', credit_card:'Credit card', other_loans:'Other loans' };

export default function NetWorthScreen() {
  const { auth }  = useAuth();
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
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

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.accent} />}>
      {members.map(m => {
        const al    = memberData[m.id]?.assets_liabilities || {};
        const tA    = ASSET_KEYS.reduce((sum,k)=>sum+(al[k]||0),0);
        const tL    = LIAB_KEYS.reduce((sum,k)=>sum+(al[k]||0),0);
        const color = avatarColor(m.name);
        return (
          <View key={m.id} style={s.card}>
            <View style={s.memberRow}>
              <View style={[s.avatar, { backgroundColor: color }]}>
                <Text style={s.avatarText}>{initials(m.name)}</Text>
              </View>
              <View>
                <Text style={s.memberName}>{m.name}</Text>
                <Text style={s.memberRole}>{m.role === 'primary' ? 'Primary member' : 'Member'}</Text>
              </View>
            </View>
            {ASSET_KEYS.filter(k=>al[k]>0).map(k=>(
              <View key={k} style={s.row}>
                <Text style={s.rowKey}>{ASSET_LABELS[k]}</Text>
                <Text style={s.rowVal}>{fmtL(al[k])}</Text>
              </View>
            ))}
            <View style={[s.row, s.totalRow]}>
              <Text style={s.totalKey}>Total Assets</Text>
              <Text style={[s.totalVal, { color: colors.green }]}>{fmtL(tA)}</Text>
            </View>
            {LIAB_KEYS.filter(k=>al[k]>0).map(k=>(
              <View key={k} style={s.row}>
                <Text style={s.rowKey}>{LIAB_LABELS[k]}</Text>
                <Text style={s.rowVal}>{fmtL(al[k])}</Text>
              </View>
            ))}
            <View style={[s.row, s.totalRow]}>
              <Text style={s.totalKey}>Total Liabilities</Text>
              <Text style={[s.totalVal, { color: colors.red }]}>{fmtL(tL)}</Text>
            </View>
            <View style={s.divider} />
            <View style={[s.row]}>
              <Text style={[s.totalKey, { fontSize: 15 }]}>Net Worth</Text>
              <Text style={[s.totalVal, { fontSize: 16, color: colors.accent }]}>{fmtL(tA-tL)}</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:      { flex: 1, backgroundColor: colors.background },
  content:     { padding: 16, paddingBottom: 32 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card:        { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: 18, marginBottom: 16, ...shadow.sm },
  memberRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar:      { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText:  { fontSize: 13, fontFamily: fonts.semibold, color: colors.white },
  memberName:  { fontSize: 14, fontFamily: fonts.semibold, color: colors.text },
  memberRole:  { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  row:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  rowKey:      { fontSize: 13, color: colors.textMuted },
  rowVal:      { fontSize: 13, fontFamily: fonts.medium, color: colors.text },
  totalRow:    { borderTopWidth: 2, borderTopColor: colors.gray200, marginTop: 4, borderBottomWidth: 0 },
  totalKey:    { fontSize: 13, fontFamily: fonts.semibold, color: colors.text },
  totalVal:    { fontSize: 14, fontFamily: fonts.semibold },
  divider:     { height: 1, backgroundColor: colors.gray200, marginVertical: 10 },
});

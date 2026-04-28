// src/screens/MutualFundsScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, ActivityIndicator, TouchableOpacity
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getFamilyData, getMemberCAS } from '../api/client';
import { SchemeCard } from '../components/index';
import { colors, fonts, radius, shadow, fmtL, avatarColor, initials } from '../theme';

export default function MutualFundsScreen() {
  const { auth } = useAuth();
  const [members,    setMembers]    = useState([]);
  const [casData,    setCasData]    = useState({});
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeMid,  setActiveMid]  = useState('all');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    const familyRes = await getFamilyData(auth.familyId);
    if (!familyRes || familyRes.error) { if (isRefresh) setRefreshing(false); else setLoading(false); return; }

    const mems = familyRes.members || [];
    setMembers(mems);

    // Load CAS for all members in parallel
    const casResults = await Promise.all(
      mems.map(m => getMemberCAS(auth.familyId, m.id).then(r => [m.id, r?.data]))
    );
    const map = {};
    casResults.forEach(([mid, data]) => { if (data) map[mid] = data; });
    setCasData(map);

    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, [auth.familyId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.accent} size="large" /></View>;

  // Compute summary
  let totalValue = 0, totalCost = 0, totalSip = 0;
  members.forEach(m => {
    const d = casData[m.id];
    if (!d) return;
    totalValue += d.summary?.total_value || 0;
    totalCost  += d.summary?.total_cost  || 0;
    totalSip   += d.summary?.total_sip   || 0;
  });

  // Build schemes for active member filter
  const allSchemes = members.flatMap(m =>
    (casData[m.id]?.schemes || [])
      .filter(s => parseFloat(s.current_value) > 0 || parseFloat(s.units) > 0)
      .map(s => ({ ...s, member_name: m.name }))
  );
  const filteredSchemes = activeMid === 'all'
    ? allSchemes
    : (casData[activeMid]?.schemes || []).filter(s => parseFloat(s.current_value) > 0 || parseFloat(s.units) > 0);

  // Group by AMC
  const byAmc = {};
  filteredSchemes.forEach(s => {
    if (!byAmc[s.amc]) byAmc[s.amc] = [];
    byAmc[s.amc].push(s);
  });

  const hasCAS = Object.keys(casData).length > 0;

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>load(true)} tintColor={colors.accent} />}>

      {!hasCAS ? (
        <View style={s.emptyCard}>
          <Text style={s.emptyIcon}>📈</Text>
          <Text style={s.emptyTitle}>No portfolio data yet</Text>
          <Text style={s.emptyMsg}>Your advisor will upload your CAS statement to show your mutual fund portfolio.</Text>
        </View>
      ) : (
        <>
          {/* Summary stats */}
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Portfolio Value</Text>
              <Text style={[s.statVal, { color: colors.accent }]}>{fmtL(totalValue)}</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Total Gain</Text>
              <Text style={[s.statVal, { color: totalValue-totalCost >= 0 ? colors.green : colors.red }]}>{fmtL(totalValue-totalCost)}</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Monthly SIP</Text>
              <Text style={[s.statVal, { color: colors.green }]}>{fmtL(totalSip)}</Text>
            </View>
          </View>

          {/* Member filter tabs — only if multiple members have CAS */}
          {members.filter(m => casData[m.id]).length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsScroll} contentContainerStyle={s.tabs}>
              <TouchableOpacity style={[s.tab, activeMid==='all' && s.tabActive]} onPress={()=>setActiveMid('all')}>
                <Text style={[s.tabText, activeMid==='all' && s.tabTextActive]}>All</Text>
              </TouchableOpacity>
              {members.filter(m => casData[m.id]).map(m => (
                <TouchableOpacity key={m.id} style={[s.tab, activeMid===m.id && s.tabActive]} onPress={()=>setActiveMid(m.id)}>
                  <View style={[s.tabAvatar, { backgroundColor: avatarColor(m.name) }]}>
                    <Text style={s.tabAvatarText}>{initials(m.name)}</Text>
                  </View>
                  <Text style={[s.tabText, activeMid===m.id && s.tabTextActive]}>{m.name.split(' ')[0]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Holdings grouped by AMC */}
          {Object.entries(byAmc).map(([amc, schemes]) => {
            const amcVal = schemes.reduce((s,sc)=>s+(parseFloat(sc.current_value)||0),0);
            return (
              <View key={amc} style={s.amcCard}>
                <View style={s.amcHeader}>
                  <Text style={s.amcName}>{amc}</Text>
                  <Text style={s.amcVal}>{fmtL(amcVal)}</Text>
                </View>
                {schemes.map((sc, i) => <SchemeCard key={i} scheme={sc} />)}
              </View>
            );
          })}

          {filteredSchemes.length === 0 && (
            <Text style={s.noSchemes}>No active holdings for this member.</Text>
          )}
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:        { flex: 1, backgroundColor: colors.background },
  content:       { padding: 16, paddingBottom: 32 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyCard:     { backgroundColor: colors.card, borderRadius: radius.md, padding: 40, alignItems: 'center', ...shadow.sm },
  emptyIcon:     { fontSize: 40, marginBottom: 12 },
  emptyTitle:    { fontSize: 16, fontFamily: fonts.semibold, color: colors.text, marginBottom: 8 },
  emptyMsg:      { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
  statsRow:      { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statBox:       { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: 14, alignItems: 'center', ...shadow.sm },
  statLabel:     { fontSize: 10, color: colors.textMuted, fontFamily: fonts.medium, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 },
  statVal:       { fontSize: 13, fontFamily: fonts.semibold },
  tabsScroll:    { marginBottom: 16 },
  tabs:          { flexDirection: 'row', gap: 8, paddingRight: 16 },
  tab:           { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  tabActive:     { backgroundColor: colors.navy, borderColor: colors.navy },
  tabText:       { fontSize: 13, fontFamily: fonts.medium, color: colors.textMuted },
  tabTextActive: { color: colors.white },
  tabAvatar:     { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabAvatarText: { fontSize: 8, fontFamily: fonts.semibold, color: colors.white },
  amcCard:       { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: 16, marginBottom: 14, ...shadow.sm },
  amcHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  amcName:       { fontSize: 14, fontFamily: fonts.semibold, color: colors.text, flex: 1 },
  amcVal:        { fontSize: 13, fontFamily: fonts.semibold, color: colors.accent },
  noSchemes:     { textAlign: 'center', color: colors.textMuted, fontSize: 13, marginTop: 20 },
});

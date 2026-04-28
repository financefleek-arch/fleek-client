import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fmtL } from '../theme';

export function SchemeCard({ scheme }) {
  const gainColor = (scheme.gain || 0) >= 0 ? colors.green : colors.red;
  const xirrColor = scheme.xirr == null ? colors.textMuted
    : scheme.xirr >= 12 ? colors.green
    : scheme.xirr >= 0  ? colors.amber
    : colors.red;

  return (
    <View style={sc.card}>
      <View style={sc.header}>
        <View style={{ flex: 1 }}>
          <Text style={sc.name} numberOfLines={2}>{scheme.scheme}</Text>
          <Text style={sc.sub}>{scheme.amc} · {scheme.type || '—'}</Text>
          {scheme.sip_amount ? (
            <View style={sc.sipBadge}>
              <Text style={sc.sipText}>SIP ₹{scheme.sip_amount.toLocaleString('en-IN')}/mo</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={sc.metrics}>
        <View style={sc.metric}>
          <Text style={sc.metricLabel}>Invested</Text>
          <Text style={sc.metricValue}>{fmtL(scheme.cost)}</Text>
        </View>
        <View style={sc.metric}>
          <Text style={sc.metricLabel}>Current</Text>
          <Text style={[sc.metricValue, { fontFamily: fonts.semibold }]}>{fmtL(scheme.current_value)}</Text>
        </View>
        <View style={sc.metric}>
          <Text style={sc.metricLabel}>XIRR</Text>
          <Text style={[sc.metricValue, { color: xirrColor, fontFamily: fonts.semibold }]}>
            {scheme.xirr == null ? '—' : `${scheme.xirr > 0 ? '+' : ''}${scheme.xirr}%`}
          </Text>
        </View>
      </View>

      {/* Gain bar */}
      <View style={sc.gainRow}>
        <View style={sc.gainBarWrap}>
          <View style={[sc.gainBarFill, {
            width: `${Math.min(100, Math.abs(scheme.gain_pct || 0))}%`,
            backgroundColor: gainColor
          }]} />
        </View>
        <Text style={[sc.gainPct, { color: gainColor }]}>
          {scheme.gain_pct != null ? `${scheme.gain_pct >= 0 ? '+' : ''}${scheme.gain_pct}%` : '—'}
        </Text>
      </View>
    </View>
  );
}

const sc = StyleSheet.create({
  card:        { backgroundColor: colors.gray50, borderRadius: 10, borderWidth: 1, borderColor: colors.gray100, padding: 14, marginBottom: 10 },
  header:      { flexDirection: 'row', marginBottom: 12 },
  name:        { fontSize: 13, fontFamily: fonts.medium, color: colors.text, lineHeight: 18, marginBottom: 3 },
  sub:         { fontSize: 11, color: colors.textMuted },
  sipBadge:    { marginTop: 6, backgroundColor: 'rgba(59,130,246,.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  sipText:     { fontSize: 11, color: colors.accent, fontFamily: fonts.medium },
  metrics:     { flexDirection: 'row', gap: 8, marginBottom: 10 },
  metric:      { flex: 1, backgroundColor: colors.white, borderRadius: 7, padding: 8, alignItems: 'center' },
  metricLabel: { fontSize: 10, color: colors.textMuted, marginBottom: 2 },
  metricValue: { fontSize: 12, fontFamily: fonts.regular, color: colors.text },
  gainRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gainBarWrap: { flex: 1, height: 5, backgroundColor: colors.gray200, borderRadius: 3, overflow: 'hidden' },
  gainBarFill: { height: '100%', borderRadius: 3 },
  gainPct:     { fontSize: 12, fontFamily: fonts.semibold, width: 44, textAlign: 'right' },
});

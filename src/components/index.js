// src/components/AllocBar.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';

export function AllocBar({ label, pct, amount, color }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.barWrap}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.pct}>{pct.toFixed(1)}%</Text>
      <Text style={styles.amt}>{amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  label:   { width: 110, fontSize: 12, color: colors.textMuted, fontFamily: fonts.regular },
  barWrap: { flex: 1, height: 8, backgroundColor: colors.gray200, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  pct:     { width: 36, textAlign: 'right', fontSize: 11, fontFamily: fonts.semibold, color: colors.text },
  amt:     { width: 72, textAlign: 'right', fontSize: 11, color: colors.textMuted, fontFamily: fonts.regular },
});


// src/components/HealthScore.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts } from '../theme';

export function HealthScore({ score }) {
  const sc    = Math.min(10, Math.max(0, score));
  const color = sc >= 7 ? colors.green : sc >= 5 ? colors.amber : colors.red;
  const r     = 46;
  const circ  = 2 * Math.PI * r;
  const dash  = (sc / 10) * circ;

  return (
    <View style={styles.wrap}>
      <Svg width={110} height={110} viewBox="0 0 110 110">
        <Circle cx={55} cy={55} r={r} fill="none" stroke={colors.gray200} strokeWidth={9} />
        <Circle
          cx={55} cy={55} r={r}
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          rotation={-90}
          origin="55,55"
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.num, { color }]}>{sc.toFixed(1)}</Text>
        <Text style={styles.lbl}>/ 10</Text>
      </View>
    </View>
  );
}

const scoreStyles = StyleSheet.create({
  wrap:   { position: 'relative', width: 110, height: 110, alignSelf: 'center' },
  center: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
  num:    { fontSize: 26, fontFamily: fonts.semibold },
  lbl:    { fontSize: 10, color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
});

Object.assign(styles, scoreStyles);


// src/components/SchemeCard.js
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

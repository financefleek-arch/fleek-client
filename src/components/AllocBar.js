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

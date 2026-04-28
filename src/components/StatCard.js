// src/components/StatCard.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, shadow, fonts } from '../theme';

export function StatCard({ label, value, valueColor, sub }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, valueColor && { color: valueColor }]}>{value}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    ...shadow.sm,
  },
  label: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: 6,
  },
  value: {
    fontSize: 20,
    fontFamily: fonts.semibold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 3,
  },
});

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

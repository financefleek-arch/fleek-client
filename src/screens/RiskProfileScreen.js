// src/screens/RiskProfileScreen.js — 12 questions, 3 sections, 6-level profile
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { getFamilyData, saveRiskProfile } from '../api/client';
import { colors, fonts, radius, shadow } from '../theme';

// ── Questions ──────────────────────────────────────────────────────
const SECTIONS = [
  {
    id: 1, title: 'Risk Tolerance',
    subtitle: 'Your willingness to take risk and endure losses',
    questions: [
      { id: 1, label: 'Investment Experience',
        text: 'How long have you been investing in Equity / Stocks / Mutual Funds?',
        options: ['Less than 1 year','Around 1–3 years','Around 4–6 years','More than 7 years'] },
      { id: 2, label: 'Market Fluctuations',
        text: 'How do you react to a significant decline (20–40% drop) in your investments?',
        options: ['I would sell all my investments','I would sell some of my investments','I would do nothing and wait','I would buy more at the lower price'] },
      { id: 3, label: 'Loss Taking Appetite',
        text: 'How comfortable are you with taking risks / losses to achieve better returns?',
        options: ['Not comfortable at all','Slightly comfortable','Moderately comfortable','Very comfortable'] },
      { id: 4, label: 'Portfolio Drops',
        text: 'What level of temporary decrease in portfolio value can you tolerate?',
        options: ['Up to −10%','−10% to −25%','−25% to −40%','More than −40%'] },
    ],
  },
  {
    id: 2, title: 'Risk Capacity',
    subtitle: 'Your financial ability to endure potential losses',
    questions: [
      { id: 5, label: 'Income Stability',
        text: 'How stable is your current income / job or business?',
        options: ['Very unstable','Somewhat unstable','Stable','Very stable'] },
      { id: 6, label: 'Emergency Funds',
        text: 'How many months of living expenses do you have in an Emergency Fund?',
        options: ['Less than 3 months','Around 3–6 months','Around 6–12 months','More than 12 months'] },
      { id: 7, label: 'Financial Obligations',
        text: 'Do you have near-term financial obligations that may require you to access investments?',
        options: ['Yes, significant obligations','Yes, some obligations','Few obligations','No obligations'] },
      { id: 8, label: 'Current Investments',
        text: 'How would you characterise your current investments?',
        options: ['Mostly safe — FDs, PF, savings accounts','Somewhat safe with some risky investments','Equal mix of safe and risky','Mostly risky — stocks, equity, direct MFs'] },
    ],
  },
  {
    id: 3, title: 'Risk Required',
    subtitle: 'The risk needed to achieve your investment goals',
    questions: [
      { id: 9,  label: 'Return Expectations',
        text: 'What is your expected annual return on investments?',
        options: ['Less than 6%','Around 6–9%','Around 9–12%','More than 12%'] },
      { id: 10, label: 'Investment Goals',
        text: 'What is your primary investment objective?',
        options: ['Wealth Preservation (keep investments intact)','Wealth Distribution (generate regular income)','Nominal Wealth Creation','Aggressive Wealth Creation'] },
      { id: 11, label: 'Time Horizon',
        text: 'How long do you plan to invest before withdrawing?',
        options: ['Less than 3 years','Around 3–5 years','Around 5–10 years','More than 10 years'] },
      { id: 12, label: 'Time Flexibility',
        text: 'How flexible are you with your investment time horizon?',
        options: ['Not flexible at all','Slightly flexible','Somewhat flexible','Very flexible'] },
    ],
  },
];

// ── Profiles: 12 questions × 4 options = 12–48 ────────────────────
const RISK_PROFILES = [
  { min:12, max:19, key:'conservative',            label:'Conservative',
    color:'#047857', bg:'rgba(16,185,129,.1)',
    desc:'You prioritise capital safety. Recommended: FD, liquid funds, short-term debt funds, government bonds.',
    allocation:'Debt 80% · Equity 10% · Gold/Others 10%', needle: 195 },
  { min:20, max:26, key:'moderately-conservative', label:'Moderately Conservative',
    color:'#4D7C0F', bg:'rgba(132,204,22,.1)',
    desc:'You prefer stability with modest growth. Recommended: debt-heavy hybrid funds, arbitrage funds.',
    allocation:'Debt 65% · Equity 25% · Gold/Others 10%', needle: 222 },
  { min:27, max:33, key:'moderate',                label:'Moderate',
    color:'#B45309', bg:'rgba(245,158,11,.1)',
    desc:'You balance growth and safety. Recommended: balanced advantage funds, multi-cap equity.',
    allocation:'Debt 45% · Equity 45% · Gold/Others 10%', needle: 249 },
  { min:34, max:39, key:'moderately-aggressive',   label:'Moderately Aggressive',
    color:'#C2410C', bg:'rgba(249,115,22,.1)',
    desc:'You seek above-average growth. Recommended: large-cap, flexi-cap equity funds.',
    allocation:'Debt 25% · Equity 65% · Gold/Others 10%', needle: 276 },
  { min:40, max:44, key:'aggressive',              label:'Aggressive',
    color:'#B91C1C', bg:'rgba(239,68,68,.1)',
    desc:'You can handle significant volatility. Recommended: mid-cap, small-cap, sector equity funds.',
    allocation:'Debt 10% · Equity 80% · Gold/Others 10%', needle: 303 },
  { min:45, max:48, key:'very-aggressive',         label:'Very Aggressive',
    color:'#7F1D1D', bg:'rgba(127,29,29,.1)',
    desc:'You seek maximum growth. Recommended: small-cap, thematic, direct equity, international funds.',
    allocation:'Debt 5% · Equity 90% · Gold/Others 5%', needle: 330 },
];

const SEG_COLORS = ['#047857','#4D7C0F','#B45309','#C2410C','#B91C1C','#7F1D1D'];
const SEG_ANGLES = [180, 207, 234, 261, 288, 315, 342];

function getProfile(score) {
  return RISK_PROFILES.find(p => score >= p.min && score <= p.max) || RISK_PROFILES[2];
}

// ── Speedometer gauge ─────────────────────────────────────────────
function Gauge({ profileKey }) {
  const profile   = RISK_PROFILES.find(p => p.key === profileKey);
  const angle     = profile?.needle ?? 249;
  const cx = 100, cy = 90, r = 68, ri = r - 16;
  const toRad     = (deg) => (deg * Math.PI) / 180;
  const ptOuter   = (a) => ({ x: cx + r  * Math.cos(toRad(a)), y: cy + r  * Math.sin(toRad(a)) });
  const ptInner   = (a) => ({ x: cx + ri * Math.cos(toRad(a)), y: cy + ri * Math.sin(toRad(a)) });
  const nx = cx + (r - 6) * Math.cos(toRad(angle));
  const ny = cy + (r - 6) * Math.sin(toRad(angle));

  const segments = SEG_COLORS.map((c, i) => {
    const a1 = SEG_ANGLES[i], a2 = SEG_ANGLES[i + 1];
    const o1 = ptOuter(a1), o2 = ptOuter(a2);
    const i1 = ptInner(a1), i2 = ptInner(a2);
    const active = RISK_PROFILES[i].key === profileKey;
    const d = `M ${i1.x} ${i1.y} A ${ri} ${ri} 0 0 1 ${i2.x} ${i2.y} L ${o2.x} ${o2.y} A ${r} ${r} 0 0 0 ${o1.x} ${o1.y} Z`;
    return <Path key={i} d={d} fill={c} opacity={active ? 1 : 0.3} stroke="#fff" strokeWidth={0.8} />;
  });

  return (
    <Svg width={200} height={105} viewBox="0 0 200 105" style={{ alignSelf: 'center', marginBottom: 12 }}>
      {segments}
      <Line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#1E293B" strokeWidth={3} strokeLinecap="round" />
      <Circle cx={cx} cy={cy} r={5} fill="#1E293B" />
      <Circle cx={cx} cy={cy} r={2.5} fill="#fff" />
    </Svg>
  );
}

// ── Main screen ───────────────────────────────────────────────────
export default function RiskProfileScreen() {
  const { auth } = useAuth();
  const [answers,    setAnswers]    = useState({});
  const [result,     setResult]     = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    const res = await getFamilyData(auth.familyId);
    if (isRefresh) setRefreshing(false); else setLoading(false);
    if (res && !res.error) {
      const rp = res.member_data?.[auth.memberId]?.risk_profile;
      if (rp?.profile) { setResult(rp); setShowForm(false); }
      else              { setShowForm(true); }
    }
  }, [auth.familyId, auth.memberId]);

  useEffect(() => { load(); }, [load]);

  const selectAnswer = (qId, val) => setAnswers(prev => ({ ...prev, [qId]: val }));
  const answered = Object.keys(answers).length;

  const handleSubmit = async () => {
    setError('');
    if (answered < 12) { setError(`Please answer all 12 questions (${answered}/12 answered)`); return; }
    const score   = Object.values(answers).reduce((s, v) => s + v, 0);
    const profile = getProfile(score);
    const today   = new Date();
    const validDate = new Date(today); validDate.setFullYear(validDate.getFullYear() + 1);
    const fmt = (d) => d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const payload = {
      score, profile: profile.key, label: profile.label, answers: { ...answers },
      assessed_at: fmt(today), valid_until: fmt(validDate),
      section_scores: {
        tolerance: [1,2,3,4].reduce((s,k)=>s+(answers[k]||0),0),
        capacity:  [5,6,7,8].reduce((s,k)=>s+(answers[k]||0),0),
        required:  [9,10,11,12].reduce((s,k)=>s+(answers[k]||0),0),
      },
    };
    setSaving(true);
    const res = await saveRiskProfile(auth.familyId, auth.memberId, payload);
    setSaving(false);
    if (res?.status === 'success') { setResult(payload); setShowForm(false); }
    else setError(res?.error || 'Failed to save. Please try again.');
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.accent} size="large" /></View>;

  const profile = result ? getProfile(result.score) : null;
  const ss      = result?.section_scores || {};

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.accent} />}>

      {/* ── Result ── */}
      {result && !showForm && profile ? (
        <View>
          <View style={s.resultCard}>
            <Text style={s.resultSubLabel}>Your Risk Profile</Text>
            <Gauge profileKey={profile.key} />
            <View style={[s.profileBadge, { backgroundColor: profile.bg }]}>
              <Text style={[s.profileBadgeText, { color: profile.color }]}>{profile.label}</Text>
            </View>
            <Text style={s.scoreText}>Score: {result.score}/48</Text>
            <Text style={s.profileDesc}>{profile.desc}</Text>
            <View style={s.allocBox}>
              <Text style={s.allocTitle}>Suggested Allocation</Text>
              <Text style={s.allocText}>{profile.allocation}</Text>
            </View>
            {/* Section scores */}
            <View style={s.sectionScores}>
              {[['Tolerance', ss.tolerance||0],['Capacity', ss.capacity||0],['Required', ss.required||0]].map(([l,v])=>(
                <View key={l} style={s.sectionBox}>
                  <Text style={s.sectionLabel}>{l}</Text>
                  <Text style={[s.sectionScore, { color: profile.color }]}>{v}/16</Text>
                  <View style={s.sectionBarBg}>
                    <View style={[s.sectionBarFill, { width: `${(v/16*100).toFixed(0)}%`, backgroundColor: profile.color }]} />
                  </View>
                </View>
              ))}
            </View>
            <View style={s.successBox}>
              <Text style={s.successText}>✅ Saved and shared with your advisor{result.valid_until ? ` · Valid until ${result.valid_until}` : ''}</Text>
            </View>
          </View>
          {result.assessed_at && <Text style={s.assessedDate}>Assessed on {result.assessed_at}</Text>}
          <TouchableOpacity style={s.retakeBtn} onPress={() => { setAnswers({}); setShowForm(true); setResult(null); }}>
            <Text style={s.retakeBtnText}>Retake Assessment</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ── Questionnaire ── */
        <View>
          <Text style={s.intro}>Answer all 12 questions honestly. Your advisor will use this to recommend suitable investments. Valid for 1 year.</Text>

          {/* Progress bar */}
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${(answered / 12) * 100}%` }]} />
          </View>

          {SECTIONS.map(sec => (
            <View key={sec.id}>
              {/* Section header */}
              <View style={s.sectionHeader}>
                <View style={s.sectionNum}><Text style={s.sectionNumText}>{sec.id}</Text></View>
                <View>
                  <Text style={s.sectionTitle}>{sec.title}</Text>
                  <Text style={s.sectionSubtitle}>{sec.subtitle}</Text>
                </View>
              </View>

              {sec.questions.map(q => (
                <View key={q.id} style={s.questionCard}>
                  <Text style={s.qLabel}>{q.label.toUpperCase()}</Text>
                  <View style={s.questionHeader2}>
                    <View style={[s.qNum, answers[q.id] ? s.qNumDone : {}]}>
                      <Text style={s.qNumText}>{answers[q.id] ? '✓' : q.id}</Text>
                    </View>
                    <Text style={s.questionText}>{q.text}</Text>
                  </View>
                  {q.options.map((opt, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[s.option, answers[q.id] === i + 1 && s.optionSelected]}
                      onPress={() => selectAnswer(q.id, i + 1)}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.optionText, answers[q.id] === i + 1 && s.optionTextSelected]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          ))}

          {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

          <TouchableOpacity style={[s.submitBtn, saving && s.submitBtnDisabled]} onPress={handleSubmit} disabled={saving}>
            {saving
              ? <ActivityIndicator color={colors.white} />
              : <Text style={s.submitBtnText}>Submit Assessment ({answered}/12)</Text>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:           { flex: 1, backgroundColor: colors.background },
  content:          { padding: 16, paddingBottom: 40 },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  intro:            { fontSize: 13, color: colors.textMuted, marginBottom: 14, lineHeight: 18 },
  progressBg:       { height: 6, backgroundColor: colors.gray200, borderRadius: 3, marginBottom: 20, overflow: 'hidden' },
  progressFill:     { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  sectionHeader:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, marginTop: 8 },
  sectionNum:       { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  sectionNumText:   { fontSize: 11, fontFamily: fonts.semibold, color: colors.white },
  sectionTitle:     { fontSize: 14, fontFamily: fonts.semibold, color: colors.text },
  sectionSubtitle:  { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  questionCard:     { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: 14, marginBottom: 10, ...shadow.sm },
  qLabel:           { fontSize: 9, fontFamily: fonts.semibold, color: colors.textMuted, letterSpacing: 0.6, marginBottom: 8 },
  questionHeader2:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  qNum:             { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  qNumDone:         { backgroundColor: colors.green },
  qNumText:         { fontSize: 10, fontFamily: fonts.semibold, color: colors.white },
  questionText:     { flex: 1, fontSize: 13.5, fontFamily: fonts.medium, color: colors.text, lineHeight: 19 },
  option:           { padding: 10, borderWidth: 1.5, borderColor: colors.gray200, borderRadius: 8, marginBottom: 7 },
  optionSelected:   { borderColor: colors.accent, backgroundColor: 'rgba(59,130,246,.07)' },
  optionText:       { fontSize: 13, color: colors.text, lineHeight: 17 },
  optionTextSelected:{ color: colors.accent, fontFamily: fonts.medium },
  errorBox:         { backgroundColor: 'rgba(239,68,68,.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,.2)', borderRadius: radius.sm, padding: 12, marginBottom: 14 },
  errorText:        { fontSize: 13, color: colors.red },
  submitBtn:        { backgroundColor: colors.accent, borderRadius: radius.sm, padding: 14, alignItems: 'center', marginTop: 4 },
  submitBtnDisabled:{ opacity: 0.6 },
  submitBtnText:    { fontSize: 15, fontFamily: fonts.semibold, color: colors.white },
  resultCard:       { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: 24, marginBottom: 14, alignItems: 'center', ...shadow.sm },
  resultSubLabel:   { fontSize: 11, color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 },
  profileBadge:     { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 24, marginBottom: 8 },
  profileBadgeText: { fontSize: 16, fontFamily: fonts.semibold },
  scoreText:        { fontSize: 12, color: colors.textMuted, marginBottom: 12 },
  profileDesc:      { fontSize: 13, color: colors.text, textAlign: 'center', lineHeight: 19, marginBottom: 14 },
  allocBox:         { backgroundColor: colors.gray50, borderRadius: 8, padding: 12, width: '100%', marginBottom: 14 },
  allocTitle:       { fontSize: 11, fontFamily: fonts.semibold, color: colors.text, marginBottom: 3 },
  allocText:        { fontSize: 12, color: colors.textMuted },
  sectionScores:    { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 14 },
  sectionBox:       { flex: 1, backgroundColor: colors.gray50, borderRadius: 8, padding: 10, alignItems: 'center' },
  sectionLabel:     { fontSize: 9, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 3 },
  sectionScore:     { fontSize: 15, fontFamily: fonts.semibold, marginBottom: 4 },
  sectionBarBg:     { width: '100%', height: 4, backgroundColor: colors.gray200, borderRadius: 2, overflow: 'hidden' },
  sectionBarFill:   { height: '100%', borderRadius: 2 },
  successBox:       { backgroundColor: 'rgba(16,185,129,.08)', borderWidth: 1, borderColor: 'rgba(16,185,129,.2)', borderRadius: 8, padding: 10, width: '100%' },
  successText:      { fontSize: 11, color: colors.green, textAlign: 'center' },
  assessedDate:     { fontSize: 11, color: colors.gray400, textAlign: 'center', marginBottom: 14 },
  retakeBtn:        { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.sm, padding: 13, alignItems: 'center' },
  retakeBtnText:    { fontSize: 14, fontFamily: fonts.medium, color: colors.textMuted },
});

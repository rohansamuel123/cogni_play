import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/Header';
import CognitiveRadar from '../components/CognitiveRadar';
import ScoreRing from '../components/ScoreRing';
import { CognitiveDomain, DOMAIN_LABELS, DOMAIN_COLORS, DOMAIN_EMOJI } from '../data/gameRegistry';
import { getCognitiveProfile, getGameSessions, CognitiveProfile, GameSession } from '../utils/scoring';

export default function CognitiveProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<CognitiveProfile | null>(null);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [childName, setChildName] = useState('');

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const selectedStr = await AsyncStorage.getItem('selectedChild');
        if (!selectedStr) return;

        const child = JSON.parse(selectedStr);
        setChildName(child.name || '');
        const childId = child.child_id;

        const p = await getCognitiveProfile(childId);
        setProfile(p);
        const s = await getGameSessions(childId);
        setSessions(s.reverse()); // Most recent first
      };
      load();
    }, [])
  );

  const domains: CognitiveDomain[] = ['memory', 'attention', 'logic', 'processing_speed', 'comprehension'];

  const radarScores: Record<CognitiveDomain, number> = {
    memory: 0, attention: 0, logic: 0, processing_speed: 0, comprehension: 0,
  };
  profile?.domainScores.forEach(d => {
    radarScores[d.domain] = d.score;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Cognitive Profile" subtitle={childName ? `${childName}'s thinking patterns` : "Your child's thinking patterns"} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Radar Chart */}
        <View style={styles.radarCard}>
          <CognitiveRadar scores={radarScores} size={280} />
        </View>

        {/* Overall Score */}
        <View style={styles.overallCard}>
          <ScoreRing
            score={profile?.overallScore || 0}
            size={100}
            color="#FF7A00"
            label="Overall"
          />
          <View style={styles.overallStats}>
            <Text style={styles.overallTitle}>Cognitive Score</Text>
            <Text style={styles.overallDesc}>
              Based on {profile?.totalGamesPlayed || 0} game sessions
            </Text>
            <Text style={styles.totalStars}>Stars Earned: {profile?.totalStars || 0}</Text>
          </View>
        </View>

        {/* Domain Breakdown */}
        <View style={styles.breakdownCard}>
          <Text style={styles.sectionTitle}>Domain Breakdown</Text>
          {domains.map(domain => {
            const ds = profile?.domainScores.find(d => d.domain === domain);
            const score = ds?.score || 0;
            const games = ds?.gamesPlayed || 0;
            return (
              <View key={domain} style={styles.domainItem}>
                <View style={styles.domainHeader}>
                  <Text style={styles.domainEmoji}>{DOMAIN_EMOJI[domain]}</Text>
                  <View style={styles.domainInfo}>
                    <Text style={[styles.domainName, { color: DOMAIN_COLORS[domain] }]}>
                      {DOMAIN_LABELS[domain]}
                    </Text>
                    <Text style={styles.domainGames}>{games} sessions</Text>
                  </View>
                  <ScoreRing
                    score={score}
                    size={52}
                    strokeWidth={5}
                    color={DOMAIN_COLORS[domain]}
                    label=""
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Recent Sessions */}
        <View style={styles.historyCard}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          {sessions.length === 0 && (
            <Text style={styles.emptyText}>No games played yet. Start your journey!</Text>
          )}
          {sessions.slice(0, 10).map((session, i) => (
            <View key={i} style={styles.sessionRow}>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionGame}>{session.gameId.replace(/-/g, ' ')}</Text>
                <Text style={styles.sessionDate}>
                  {new Date(session.playedAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.sessionStars}>
                {[1, 2, 3].map(s => (
                  <Text key={s} style={s <= session.stars ? styles.starOn : styles.starOff}>★</Text>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* AI Analysis Placeholder */}
        <Pressable style={styles.aiButton}>
          <Text style={styles.aiButtonEmoji}>🤖</Text>
          <View>
            <Text style={styles.aiButtonTitle}>AI Analysis</Text>
            <Text style={styles.aiButtonSub}>Get detailed insights (coming soon)</Text>
          </View>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF9F0' },
  scrollContent: { padding: 20 },

  radarCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#8B5A2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F5E6D3',
  },

  overallCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#8B5A2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F5E6D3',
  },
  overallStats: { marginLeft: 20, flex: 1 },
  overallTitle: { fontSize: 20, fontWeight: '800', color: '#2D1B0E', marginBottom: 4 },
  overallDesc: { fontSize: 13, color: '#8B7355', marginBottom: 4 },
  totalStars: { fontSize: 16, fontWeight: '700', color: '#FFB300' },

  breakdownCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#8B5A2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F5E6D3',
  },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#2D1B0E', marginBottom: 16 },
  domainItem: { marginBottom: 16 },
  domainHeader: { flexDirection: 'row', alignItems: 'center' },
  domainEmoji: { fontSize: 28, marginRight: 12 },
  domainInfo: { flex: 1 },
  domainName: { fontSize: 16, fontWeight: '800' },
  domainGames: { fontSize: 12, color: '#B0A090', fontWeight: '500' },

  historyCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#8B5A2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F5E6D3',
  },
  emptyText: { fontSize: 15, color: '#B0A090', textAlign: 'center', paddingVertical: 20 },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F0EB',
  },
  sessionInfo: {},
  sessionGame: { fontSize: 15, fontWeight: '700', color: '#2D1B0E', textTransform: 'capitalize' },
  sessionDate: { fontSize: 12, color: '#B0A090', marginTop: 2 },
  sessionStars: { flexDirection: 'row', gap: 2 },
  starOn: { fontSize: 16, color: '#FFB300' },
  starOff: { fontSize: 16, color: '#E0D5C8' },

  aiButton: {
    backgroundColor: '#2979FF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#2979FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  aiButtonEmoji: { fontSize: 36 },
  aiButtonTitle: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  aiButtonSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
});

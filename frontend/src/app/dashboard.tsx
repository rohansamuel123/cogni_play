import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GAMES, DOMAIN_LABELS, DOMAIN_COLORS, CognitiveDomain } from '../data/gameRegistry';
import { getCognitiveProfile, getBestSession, CognitiveProfile } from '../utils/scoring';
import GameCard from '../components/GameCard';
import ScoreRing from '../components/ScoreRing';
import Button from '../components/Button';

export default function Dashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [profile, setProfile] = useState<CognitiveProfile | null>(null);

  const [gameStars, setGameStars] = useState<Record<string, number>>({});

  const loadData = async () => {
    // Load user
    const userStr = await AsyncStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserName(user.name);
    }

    // Load cognitive profile
    const p = await getCognitiveProfile();
    setProfile(p);



    // Load best stars per game
    const stars: Record<string, number> = {};
    for (const game of GAMES) {
      const best = await getBestSession(game.id);
      stars[game.id] = best?.stars || 0;
    }
    setGameStars(stars);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem('currentUser');
    router.replace('/');
  };

  const handleGamePress = (route: string) => {
    router.push(route as any);
  };

  const domains: CognitiveDomain[] = ['memory', 'attention', 'logic', 'processing_speed', 'comprehension'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{userName || 'Parent'}</Text>
          </View>
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>

        {/* Score Overview */}
        <View style={styles.scoreCard}>
          <ScoreRing
            score={profile?.overallScore || 0}
            size={130}
            color="#FF7A00"
            label="Overall"
          />
          <View style={styles.scoreStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.totalGamesPlayed || 0}</Text>
              <Text style={styles.statLabel}>Games</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.totalStars || 0}</Text>
              <Text style={styles.statLabel}>Stars ★</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{GAMES.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Domain Bars */}
        <View style={styles.domainCard}>
          <Text style={styles.sectionTitle}>Cognitive Domains</Text>
          {domains.map(domain => {
            const ds = profile?.domainScores.find(d => d.domain === domain);
            const score = ds?.score || 0;
            return (
              <View key={domain} style={styles.domainRow}>
                <Text style={[styles.domainLabel, { color: DOMAIN_COLORS[domain] }]}>
                  {DOMAIN_LABELS[domain]}
                </Text>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${score}%`, backgroundColor: DOMAIN_COLORS[domain] },
                    ]}
                  />
                </View>
                <Text style={styles.domainScore}>{score}</Text>
              </View>
            );
          })}
          <Pressable onPress={() => router.push('/cognitive-profile')} style={styles.viewProfileBtn}>
            <Text style={styles.viewProfileText}>View Full Profile →</Text>
          </Pressable>
        </View>

        {/* Journey Map */}
        <View style={styles.journeySection}>
          <Text style={styles.sectionTitle}>🗺️ Your Journey</Text>
          <Text style={styles.sectionSubtitle}>
            Pick any game and start playing!
          </Text>

          {GAMES.map((game, index) => {
            const stars = gameStars[game.id] || 0;
            return (
              <View key={game.id}>
                {index > 0 && (
                  <View style={styles.connector}>
                    <View style={styles.connectorLine} />
                  </View>
                )}
                <GameCard
                  emoji={game.emoji}
                  name={game.name}
                  description={game.description}
                  domainLabel={DOMAIN_LABELS[game.domain]}
                  domainColor={game.color}
                  stars={stars}
                  locked={false}
                  onPress={() => handleGamePress(game.route)}
                />
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF9F0' },
  scrollContent: { padding: 20, paddingTop: 16 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: { fontSize: 16, color: '#8B7355', fontWeight: '500' },
  name: { fontSize: 28, fontWeight: '900', color: '#FF7A00' },
  logoutButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F0E6D9',
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: '#8B7355' },

  // Score Card
  scoreCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#8B5A2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F5E6D3',
  },
  scoreStats: {
    flex: 1,
    marginLeft: 24,
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '900', color: '#2D1B0E' },
  statLabel: { fontSize: 13, fontWeight: '600', color: '#B0A090' },

  // Domain Card
  domainCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#8B5A2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F5E6D3',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D1B0E',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#B0A090',
    marginBottom: 16,
    fontWeight: '500',
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  domainLabel: {
    width: 90,
    fontSize: 13,
    fontWeight: '700',
  },
  barBg: {
    flex: 1,
    height: 10,
    backgroundColor: '#F0E6D9',
    borderRadius: 5,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  barFill: {
    height: 10,
    borderRadius: 5,
  },
  domainScore: {
    width: 30,
    fontSize: 14,
    fontWeight: '800',
    color: '#2D1B0E',
    textAlign: 'right',
  },
  viewProfileBtn: {
    marginTop: 12,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#FF7A0012',
    borderRadius: 12,
  },
  viewProfileText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF7A00',
  },

  // Journey
  journeySection: {
    marginBottom: 8,
  },
  connector: {
    alignItems: 'center',
    height: 28,
  },
  connectorLine: {
    width: 3,
    height: '100%',
    backgroundColor: '#FF7A00',
    borderRadius: 2,
  },

});

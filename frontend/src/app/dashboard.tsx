import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GAMES, DOMAIN_LABELS, DOMAIN_COLORS, CognitiveDomain } from '../data/gameRegistry';
import {
  getCognitiveProfile, getUnlockedGameCount, getBestSession,
  CognitiveProfile, loadSessionsFromBackend, clearChildGameData,
} from '../utils/scoring';
import GameCard from '../components/GameCard';
import ScoreRing from '../components/ScoreRing';
import Button from '../components/Button';
import API from '../services/api';

interface ChildProfile {
  child_id: number;
  parent_id: number;
  name: string;
  age: number;
  gender: string;
  avatar: string | null;
  created_at: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [profile, setProfile] = useState<CognitiveProfile | null>(null);
  const [unlockedCount, setUnlockedCount] = useState(1);
  const [gameStars, setGameStars] = useState<Record<string, number>>({});

  // Child management
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null);
  const [showChildPicker, setShowChildPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load parent info and children list
  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load parent user
      const userStr = await AsyncStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.name);
      }

      // Load children from backend
      const childrenRes = await API.get('/children/');
      const childList: ChildProfile[] = childrenRes.data;
      setChildren(childList);

      // Check if we have a selected child
      const selectedStr = await AsyncStorage.getItem('selectedChild');
      if (selectedStr) {
        const saved = JSON.parse(selectedStr);
        // Verify this child still exists
        const stillExists = childList.find((c) => c.child_id === saved.child_id);
        if (stillExists) {
          setSelectedChild(stillExists);
          setShowChildPicker(false);
        } else {
          await AsyncStorage.removeItem('selectedChild');
          setSelectedChild(null);
          setShowChildPicker(childList.length > 0);
        }
      } else if (childList.length === 1) {
        // Auto-select if only one child
        setSelectedChild(childList[0]);
        await AsyncStorage.setItem('selectedChild', JSON.stringify(childList[0]));
        setShowChildPicker(false);
      } else if (childList.length > 1) {
        setShowChildPicker(true);
      }
    } catch (e) {
      console.error('Failed to load initial data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Load game data for selected child
  const loadChildData = async (childId: number) => {
    try {
      // Hydrate local storage from backend
      await loadSessionsFromBackend(childId);

      // Load cognitive profile
      const p = await getCognitiveProfile(childId);
      setProfile(p);

      // Load unlocked count
      const count = await getUnlockedGameCount(childId);
      setUnlockedCount(count);

      // Load best stars per game
      const stars: Record<string, number> = {};
      for (const game of GAMES) {
        const best = await getBestSession(childId, game.id);
        stars[game.id] = best?.stars || 0;
      }
      setGameStars(stars);
    } catch (e) {
      console.error('Failed to load child data:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [])
  );

  // When selected child changes, load their data
  useEffect(() => {
    if (selectedChild) {
      loadChildData(selectedChild.child_id);
    } else {
      // Reset data when no child selected
      setProfile(null);
      setUnlockedCount(1);
      setGameStars({});
    }
  }, [selectedChild?.child_id]);

  const handleSelectChild = async (child: ChildProfile) => {
    setSelectedChild(child);
    await AsyncStorage.setItem('selectedChild', JSON.stringify(child));
    setShowChildPicker(false);
  };

  const handleSwitchChild = () => {
    setShowChildPicker(true);
  };

  const handleDeleteChild = (child: ChildProfile) => {
    Alert.alert(
      'Delete Profile',
      `Are you sure you want to delete ${child.name}'s profile? All game data will be permanently lost.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await API.delete(`/children/${child.child_id}`);
              await clearChildGameData(child.child_id);

              if (selectedChild?.child_id === child.child_id) {
                await AsyncStorage.removeItem('selectedChild');
                setSelectedChild(null);
              }

              // Reload
              loadInitialData();
            } catch (e: any) {
              console.error(e);
              Alert.alert('Error', 'Failed to delete profile.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account, all child profiles, and all game data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await API.delete('/users/me');
              await AsyncStorage.clear();
              router.replace('/');
            } catch (e: any) {
              console.error(e);
              Alert.alert('Error', 'Failed to delete account.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('currentUser');
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('selectedChild');
    router.replace('/');
  };

  const handleGamePress = (route: string) => {
    if (!selectedChild) {
      Alert.alert('Select a Child', 'Please select a child profile first.');
      return;
    }
    router.push(route as any);
  };

  const domains: CognitiveDomain[] = ['memory', 'attention', 'logic', 'processing_speed', 'comprehension'];

  // ─── No children yet ───
  if (!loading && children.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>👶</Text>
          <Text style={styles.emptyTitle}>No Child Profiles Yet</Text>
          <Text style={styles.emptyDesc}>
            Add your child's profile to start their cognitive assessment journey.
          </Text>
          <View style={{ width: '100%', marginTop: 24 }}>
            <Button title="Add Child Profile" onPress={() => router.push('/add-child' as any)} />
          </View>
          <View style={{ width: '100%', marginTop: 12 }}>
            <Button title="Logout" variant="outline" onPress={handleLogout} />
          </View>
          <Pressable onPress={handleDeleteAccount} style={styles.deleteAccountBtn}>
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Child Picker ───
  if (showChildPicker) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.pickerContent}>
          <Text style={styles.pickerTitle}>Who's Playing?</Text>
          <Text style={styles.pickerSubtitle}>Select a child profile</Text>

          <View style={styles.childGrid}>
            {children.map((child) => (
              <View key={child.child_id} style={styles.childCardWrapper}>
                <Pressable
                  style={styles.childCard}
                  onPress={() => handleSelectChild(child)}
                  onLongPress={() => handleDeleteChild(child)}
                >
                  <View style={styles.childAvatar}>
                    <Text style={styles.childAvatarEmoji}>
                      {child.avatar || child.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.childCardName} numberOfLines={1}>{child.name}</Text>
                  <Text style={styles.childCardAge}>Age {child.age}</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDeleteChild(child)}
                  style={styles.childDeleteBtn}
                >
                  <Text style={styles.childDeleteText}>x</Text>
                </Pressable>
              </View>
            ))}
          </View>

          <View style={{ marginTop: 24 }}>
            <Button
              title="+ Add Another Child"
              variant="secondary"
              onPress={() => router.push('/add-child' as any)}
            />
          </View>
          {selectedChild ? (
            <View style={{ marginTop: 12 }}>
              <Button title="Cancel" variant="outline" onPress={() => setShowChildPicker(false)} />
            </View>
          ) : (
            <View style={{ marginTop: 12 }}>
              <Button title="Logout" variant="outline" onPress={handleLogout} />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Main Dashboard ───
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{userName || 'Parent'}</Text>
          </View>
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>

        {/* Child Selector Bar */}
        {selectedChild && (
          <View style={styles.childBar}>
            <View style={styles.childBarAvatar}>
              <Text style={styles.childBarEmoji}>
                {selectedChild.avatar || selectedChild.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.childBarName}>{selectedChild.name}</Text>
              <Text style={styles.childBarAge}>Age {selectedChild.age}</Text>
            </View>
            <Pressable onPress={handleSwitchChild} style={styles.switchBtn}>
              <Text style={styles.switchBtnText}>Switch</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/add-child' as any)}
              style={[styles.switchBtn, { marginLeft: 8 }]}
            >
              <Text style={styles.switchBtnText}>+ Add</Text>
            </Pressable>
          </View>
        )}

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
              <Text style={styles.statValue}>{unlockedCount}/{GAMES.length}</Text>
              <Text style={styles.statLabel}>Unlocked</Text>
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
            Complete games to unlock the next challenge!
          </Text>

          {GAMES.map((game, index) => {
            const locked = game.order > unlockedCount;
            const stars = gameStars[game.id] || 0;
            return (
              <View key={game.id}>
                {index > 0 && (
                  <View style={styles.connector}>
                    <View style={[styles.connectorLine, locked && styles.connectorLocked]} />
                  </View>
                )}
                <GameCard
                  emoji={game.emoji}
                  name={game.name}
                  description={game.description}
                  domainLabel={DOMAIN_LABELS[game.domain]}
                  domainColor={game.color}
                  stars={stars}
                  locked={locked}
                  onPress={() => handleGamePress(game.route)}
                />
              </View>
            );
          })}
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Account</Text>
          <Pressable onPress={handleDeleteAccount} style={styles.deleteAccountBtnInline}>
            <Text style={styles.deleteAccountTextInline}>Delete My Account</Text>
          </Pressable>
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
    marginBottom: 16,
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

  // Child Selector Bar
  childBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#8B5A2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F5E6D3',
  },
  childBarAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFD180',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF7A00',
    marginRight: 12,
  },
  childBarEmoji: { fontSize: 22 },
  childBarName: { fontSize: 16, fontWeight: '800', color: '#2D1B0E' },
  childBarAge: { fontSize: 12, color: '#8B7355', fontWeight: '500' },
  switchBtn: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FF7A00',
  },
  switchBtnText: { fontSize: 13, fontWeight: '700', color: '#FF7A00' },

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
  connectorLocked: {
    backgroundColor: '#E0D5C8',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: '#2D1B0E', marginBottom: 8 },
  emptyDesc: { fontSize: 16, color: '#8B7355', textAlign: 'center', marginBottom: 8, lineHeight: 22 },

  // Child picker
  pickerContent: { padding: 24, paddingTop: 60 },
  pickerTitle: { fontSize: 32, fontWeight: '900', color: '#FF7A00', textAlign: 'center', marginBottom: 8 },
  pickerSubtitle: { fontSize: 16, color: '#8B7355', textAlign: 'center', marginBottom: 32, fontWeight: '500' },
  childGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  childCardWrapper: {
    position: 'relative',
  },
  childCard: {
    width: 140,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#8B5A2B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#F5E6D3',
  },
  childAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFD180',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FF7A00',
    marginBottom: 12,
  },
  childAvatarEmoji: { fontSize: 34 },
  childCardName: { fontSize: 16, fontWeight: '800', color: '#2D1B0E', marginBottom: 2 },
  childCardAge: { fontSize: 13, color: '#8B7355', fontWeight: '500' },
  childDeleteBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  childDeleteText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  // Danger zone
  dangerZone: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0E6D9',
  },
  dangerTitle: { fontSize: 14, fontWeight: '700', color: '#B0A090', marginBottom: 8 },
  deleteAccountBtnInline: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteAccountTextInline: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF4444',
  },
  deleteAccountBtn: {
    marginTop: 24,
    paddingVertical: 12,
  },
  deleteAccountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF4444',
  },
});

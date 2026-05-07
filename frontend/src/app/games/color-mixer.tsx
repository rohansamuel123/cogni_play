import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Pressable,
  Animated, Easing, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { saveGameSession, normalizeScore, calculateStars } from '../../utils/scoring';

const { width } = Dimensions.get('window');

// ─── Game Data ──────────────────────────────────────────────
type PrimaryColor = 'red' | 'blue' | 'yellow';
type SecondaryColor = 'orange' | 'purple' | 'green';

interface ColorDef {
  id: PrimaryColor | SecondaryColor;
  hex: string;
  label: string;
  emoji: string;
}

const COLORS: Record<string, ColorDef> = {
  red: { id: 'red', hex: '#FF3B30', label: 'Red', emoji: '🍓' },
  blue: { id: 'blue', hex: '#007AFF', label: 'Blue', emoji: '💧' },
  yellow: { id: 'yellow', hex: '#FFCC00', label: 'Yellow', emoji: '☀️' },
  orange: { id: 'orange', hex: '#FF9500', label: 'Orange', emoji: '🍊' },
  purple: { id: 'purple', hex: '#AF52DE', label: 'Purple', emoji: '🍇' },
  green: { id: 'green', hex: '#34C759', label: 'Green', emoji: '🍃' },
};

const RECIPES: Record<string, SecondaryColor> = {
  'red-yellow': 'orange',
  'yellow-red': 'orange',
  'red-blue': 'purple',
  'blue-red': 'purple',
  'blue-yellow': 'green',
  'yellow-blue': 'green',
};

const ROUNDS: SecondaryColor[] = ['orange', 'purple', 'green'];

export default function ColorMixer() {
  const router = useRouter();

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'done'>('intro');
  const [round, setRound] = useState(0);
  const [selectedColors, setSelectedColors] = useState<PrimaryColor[]>([]);
  const [mixedColor, setMixedColor] = useState<SecondaryColor | null>(null);
  
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [childId, setChildId] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Animations
  const fillAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem('selectedChild').then((str) => {
      if (str) setChildId(JSON.parse(str).child_id);
    });
  }, []);

  const startGame = () => {
    setGameState('playing');
    setRound(0);
    setCorrect(0);
    setTotal(0);
    setStartTime(Date.now());
    setupRound();
  };

  const setupRound = () => {
    setSelectedColors([]);
    setMixedColor(null);
    setFeedback(null);
    setIsProcessing(false);
    fillAnim.setValue(0);
    shakeAnim.setValue(0);
  };

  const handleColorTap = (color: PrimaryColor) => {
    if (isProcessing || selectedColors.length >= 2) return;

    const newSelection = [...selectedColors, color];
    setSelectedColors(newSelection);

    // Animate fill level
    Animated.timing(fillAnim, {
      toValue: newSelection.length,
      duration: 500,
      useNativeDriver: false, // height animation doesn't support native driver well without transforms
    }).start();

    if (newSelection.length === 2) {
      setIsProcessing(true);
      processMixing(newSelection[0], newSelection[1]);
    }
  };

  const processMixing = (c1: PrimaryColor, c2: PrimaryColor) => {
    const key = `${c1}-${c2}`;
    const result = RECIPES[key];

    // Mix animation (shake)
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start(() => {
      setTotal(t => t + 1);
      
      if (result) {
        setMixedColor(result);
        const target = ROUNDS[round];
        if (result === target) {
          setCorrect(c => c + 1);
          setFeedback(`✅ Wow! You made ${COLORS[result].label}!`);
        } else {
          setFeedback(`❌ That makes ${COLORS[result].label}. We needed ${COLORS[target].label}!`);
        }
      } else {
        // Same colors mixed
        setFeedback(`❌ That's just more ${COLORS[c1].label}!`);
      }

      setTimeout(() => {
        advanceRound();
      }, 2500);
    });
  };

  const advanceRound = () => {
    if (round < ROUNDS.length - 1) {
      setRound(r => r + 1);
      setupRound();
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    setGameState('done');
    const elapsed = (Date.now() - startTime) / 1000;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const normalized = normalizeScore(accuracy, elapsed, 3, 3);
    const stars = calculateStars(normalized);

    saveGameSession(childId, {
      gameId: 'color-mixer',
      domain: 'logic',
      score: correct,
      maxScore: total,
      accuracy,
      timeTaken: elapsed,
      level: 1,
      stars,
      playedAt: new Date().toISOString(),
    });

    router.replace({
      pathname: '/game-results',
      params: { gameId: 'color-mixer', score: normalized, stars },
    });
  };

  const currentTarget = ROUNDS[round];

  const getFlaskColor = () => {
    if (mixedColor) return COLORS[mixedColor].hex;
    if (selectedColors.length === 1) return COLORS[selectedColors[0]].hex;
    if (selectedColors.length === 2) {
      // While mixing before state updates
      return COLORS[selectedColors[0]].hex; // fallback
    }
    return 'transparent';
  };

  const flaskHeight = fillAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0%', '50%', '100%'],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Color Mixer Lab"
        subtitle={gameState === 'playing' ? `Round ${round + 1}/3` : undefined}
      />
      
      <View style={styles.container}>
        {gameState === 'intro' && (
          <View style={styles.introContainer}>
            <Text style={styles.introEmoji}>🧪</Text>
            <Text style={styles.introTitle}>Color Mixer Lab</Text>
            <Text style={styles.introDesc}>
              Mix the primary colors to discover new ones! Can you make the target color?
            </Text>
            <View style={{ marginTop: 32, width: '100%' }}>
              <Button title="Start Mixing" onPress={startGame} />
            </View>
          </View>
        )}

        {gameState === 'playing' && (
          <>
            <View style={styles.targetCard}>
              <Text style={styles.targetSub}>Can you make</Text>
              <Text style={[styles.targetTitle, { color: COLORS[currentTarget].hex }]}>
                {COLORS[currentTarget].label} {COLORS[currentTarget].emoji}
              </Text>
            </View>

            <View style={styles.labArea}>
              {/* Flask */}
              <Animated.View style={[styles.flaskContainer, { transform: [{ translateX: shakeAnim }] }]}>
                <View style={styles.flaskNeck} />
                <View style={styles.flaskBody}>
                  <Animated.View 
                    style={[
                      styles.flaskLiquid, 
                      { height: flaskHeight, backgroundColor: getFlaskColor() }
                    ]} 
                  />
                  {/* Glass reflection */}
                  <View style={styles.glassReflection} />
                </View>
              </Animated.View>
            </View>

            {/* Bottles */}
            <View style={styles.bottlesRow}>
              {(['red', 'blue', 'yellow'] as PrimaryColor[]).map(color => (
                <Pressable 
                  key={color}
                  onPress={() => handleColorTap(color)}
                  disabled={isProcessing || selectedColors.length >= 2}
                  style={({ pressed }) => [
                    styles.bottle,
                    pressed && { transform: [{ scale: 0.95 }] },
                    { backgroundColor: COLORS[color].hex + '20', borderColor: COLORS[color].hex }
                  ]}
                >
                  <View style={[styles.bottleLiquid, { backgroundColor: COLORS[color].hex }]} />
                  <Text style={styles.bottleLabel}>{COLORS[color].emoji}</Text>
                </Pressable>
              ))}
            </View>

            {/* Feedback */}
            <View style={{ height: 60, justifyContent: 'center' }}>
              {feedback && (
                <Text style={styles.feedbackText}>{feedback}</Text>
              )}
            </View>
            
            <Text style={styles.scoreText}>
              Score: {correct}/{total}
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4FBFF' },
  container: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },

  // Intro
  introContainer: { alignItems: 'center', paddingHorizontal: 24, width: '100%' },
  introEmoji: { fontSize: 72, marginBottom: 16 },
  introTitle: { fontSize: 32, fontWeight: '900', color: '#1A365D', marginBottom: 12 },
  introDesc: { fontSize: 18, color: '#4A5568', textAlign: 'center', lineHeight: 26, marginBottom: 8 },

  // Playing
  targetCard: {
    backgroundColor: '#FFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  targetSub: { fontSize: 16, fontWeight: '700', color: '#718096', textTransform: 'uppercase', letterSpacing: 1 },
  targetTitle: { fontSize: 36, fontWeight: '900', marginTop: 4 },

  labArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
  },

  // Flask
  flaskContainer: {
    alignItems: 'center',
  },
  flaskNeck: {
    width: 40,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 4,
    borderColor: '#CBD5E0',
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  flaskBody: {
    width: 140,
    height: 140,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 4,
    borderColor: '#CBD5E0',
    borderRadius: 70,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  flaskLiquid: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
  glassReflection: {
    position: 'absolute',
    top: 15,
    left: 20,
    width: 25,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12.5,
    transform: [{ rotate: '30deg' }],
  },

  // Bottles
  bottlesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 30,
  },
  bottle: {
    width: 80,
    height: 110,
    borderWidth: 4,
    borderRadius: 16,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  bottleLiquid: {
    width: '100%',
    height: '60%',
    position: 'absolute',
    bottom: 0,
  },
  bottleLabel: {
    fontSize: 32,
    marginBottom: 20,
    textShadowColor: 'rgba(255,255,255,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  feedbackText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2D3748',
    textAlign: 'center',
  },

  scoreText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#718096',
    marginTop: 20,
  },
});

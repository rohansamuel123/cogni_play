import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { saveGameSession, normalizeScore, calculateStars } from '../../utils/scoring';

const { width } = Dimensions.get('window');
const TOTAL_TARGETS = 15;

const DIFFICULTY = [
  { name: 'Easy', targetSize: 70, minDelay: 400, maxDelay: 1200 },
  { name: 'Medium', targetSize: 55, minDelay: 300, maxDelay: 900 },
  { name: 'Hard', targetSize: 42, minDelay: 200, maxDelay: 700 },
];

export default function SpeedTap() {
  const router = useRouter();
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'done'>('intro');
  const [round, setRound] = useState(0);
  const [taps, setTaps] = useState(0);
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });
  const [showTarget, setShowTarget] = useState(false);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [targetAppearTime, setTargetAppearTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const areaHeight = 400;
  const [childId, setChildId] = useState<number>(0);

  useEffect(() => {
    AsyncStorage.getItem('selectedChild').then((str) => {
      if (str) setChildId(JSON.parse(str).child_id);
    });
  }, []);

  const diff = DIFFICULTY[round];

  const spawnTarget = () => {
    const padding = diff.targetSize;
    const x = padding + Math.random() * (width - 48 - padding * 2);
    const y = padding + Math.random() * (areaHeight - padding * 2);
    setTargetPos({ x, y });
    setShowTarget(true);
    setTargetAppearTime(Date.now());
    scaleAnim.setValue(0);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const startGame = () => {
    setGameState('playing');
    setRound(0);
    setTaps(0);
    setReactionTimes([]);
    setStartTime(Date.now());
    setTimeout(spawnTarget, 500);
  };

  const handleTap = () => {
    if (!showTarget || gameState !== 'playing') return;

    const rt = Date.now() - targetAppearTime;
    const newReactionTimes = [...reactionTimes, rt];
    setReactionTimes(newReactionTimes);
    setShowTarget(false);

    const newTaps = taps + 1;
    setTaps(newTaps);

    // Progress difficulty
    const perRoundTargets = TOTAL_TARGETS / 3;
    const newRound = Math.min(2, Math.floor(newTaps / perRoundTargets));
    setRound(newRound);

    if (newTaps >= TOTAL_TARGETS) {
      finishGame(newReactionTimes);
    } else {
      const delay = diff.minDelay + Math.random() * (diff.maxDelay - diff.minDelay);
      setTimeout(spawnTarget, delay);
    }
  };

  const finishGame = (rts: number[]) => {
    setGameState('done');
    const elapsed = (Date.now() - startTime) / 1000;
    const avgRT = rts.reduce((a, b) => a + b, 0) / rts.length;
    // Convert avg RT (ms) to accuracy-like score: <250ms = 100, >1000ms = 0
    const rtScore = Math.max(0, Math.min(100, 100 - ((avgRT - 250) / 750) * 100));
    const accuracy = Math.round(rtScore);
    const normalized = normalizeScore(accuracy, elapsed, 3, 3);
    const stars = calculateStars(normalized);

    saveGameSession(childId, {
      gameId: 'speed-tap',
      domain: 'processing_speed',
      score: Math.round(avgRT),
      maxScore: 250,
      accuracy,
      timeTaken: elapsed,
      level: 3,
      stars,
      playedAt: new Date().toISOString(),
    });

    router.replace({
      pathname: '/game-results',
      params: { gameId: 'speed-tap', score: normalized, stars },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Speed Tap" subtitle={gameState === 'playing' ? `${taps}/${TOTAL_TARGETS} · ${diff.name}` : undefined} />
      <View style={styles.container}>

        {gameState === 'intro' && (
          <View style={styles.introContainer}>
            <Text style={styles.introEmoji}>⚡</Text>
            <Text style={styles.introTitle}>Speed Tap</Text>
            <Text style={styles.introDesc}>
              A circle will appear on screen. Tap it as fast as you can! We'll measure your reaction time.
            </Text>
            <Text style={styles.introHint}>{TOTAL_TARGETS} targets · Gets faster</Text>
            <View style={{ marginTop: 32, width: '100%' }}>
              <Button title="Start" onPress={startGame} />
            </View>
          </View>
        )}

        {gameState === 'playing' && (
          <View style={[styles.playArea, { height: areaHeight }]}>
            {showTarget && (
              <Pressable
                onPress={handleTap}
                style={[
                  styles.targetTouchable,
                  {
                    left: targetPos.x - diff.targetSize / 2,
                    top: targetPos.y - diff.targetSize / 2,
                    width: diff.targetSize,
                    height: diff.targetSize,
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.target,
                    {
                      width: diff.targetSize,
                      height: diff.targetSize,
                      borderRadius: diff.targetSize / 2,
                      transform: [{ scale: scaleAnim }],
                    },
                  ]}
                />
              </Pressable>
            )}
            {!showTarget && (
              <Text style={styles.waitText}>Wait for it...</Text>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF9F0' },
  container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  introContainer: { alignItems: 'center', paddingHorizontal: 24 },
  introEmoji: { fontSize: 64, marginBottom: 16 },
  introTitle: { fontSize: 32, fontWeight: '900', color: '#2D1B0E', marginBottom: 12 },
  introDesc: { fontSize: 17, color: '#8B7355', textAlign: 'center', lineHeight: 24, marginBottom: 8 },
  introHint: { fontSize: 14, color: '#B0A090', fontWeight: '600' },
  playArea: {
    width: '100%',
    backgroundColor: '#F8F0E6',
    borderRadius: 24,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E8DDD0',
  },
  targetTouchable: {
    position: 'absolute',
  },
  target: {
    backgroundColor: '#FF1744',
    shadowColor: '#FF1744',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  waitText: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#B0A090',
  },
});

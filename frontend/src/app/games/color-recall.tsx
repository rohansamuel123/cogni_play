import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { saveGameSession, normalizeScore, calculateStars } from '../../utils/scoring';

const TILE_COLORS = ['#7C4DFF', '#FF6D00', '#00BFA5', '#FF1744', '#FFB300', '#2979FF'];
const GRID_COLS = 3;
const GRID_ROWS = 3;

const DIFFICULTY = [
  { name: 'Easy', seqLength: 3, flashDuration: 600 },
  { name: 'Medium', seqLength: 5, flashDuration: 450 },
  { name: 'Hard', seqLength: 7, flashDuration: 350 },
];

export default function ColorRecall() {
  const router = useRouter();

  const [round, setRound] = useState(0); // 0, 1, 2
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'roundEnd' | 'done'>('intro');
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [message, setMessage] = useState('');
  const [childId, setChildId] = useState<number>(0);

  useEffect(() => {
    AsyncStorage.getItem('selectedChild').then((str) => {
      if (str) setChildId(JSON.parse(str).child_id);
    });
  }, []);

  const tileAnims = useRef(
    Array.from({ length: GRID_COLS * GRID_ROWS }, () => new Animated.Value(1))
  ).current;

  const startRound = () => {
    const diff = DIFFICULTY[round];
    const seq: number[] = [];
    for (let i = 0; i < diff.seqLength; i++) {
      seq.push(Math.floor(Math.random() * (GRID_COLS * GRID_ROWS)));
    }
    setSequence(seq);
    setPlayerSequence([]);
    setGameState('playing');
    setStartTime(Date.now());
    setMessage('');
  };

  useEffect(() => {
    if (gameState === 'playing' && sequence.length > 0) {
      showSequence();
    }
  }, [sequence, gameState]);

  const showSequence = async () => {
    setIsShowingSequence(true);
    const diff = DIFFICULTY[round];
    for (let i = 0; i < sequence.length; i++) {
      await flashTile(sequence[i], diff.flashDuration);
    }
    setIsShowingSequence(false);
  };

  const flashTile = (index: number, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      // Just turn on the glow
      setActiveIndex(index);

      // Wait for duration, then turn off the glow
      setTimeout(() => {
        setActiveIndex(null);
        setTimeout(resolve, 250); // Pause before next tile
      }, duration);
    });
  };

  const handleTileTap = (index: number) => {
    if (isShowingSequence || gameState !== 'playing') return;

    Animated.sequence([
      Animated.timing(tileAnims[index], { toValue: 1.1, duration: 50, useNativeDriver: true }),
      Animated.timing(tileAnims[index], { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    const newPlayerSeq = [...playerSequence, index];
    setPlayerSequence(newPlayerSeq);

    const pos = newPlayerSeq.length - 1;
    if (newPlayerSeq[pos] !== sequence[pos]) {
      finishRound(newPlayerSeq.length - 1, sequence.length);
      return;
    }

    if (newPlayerSeq.length === sequence.length) {
      finishRound(sequence.length, sequence.length);
    }
  };

  const finishRound = (correct: number, total: number) => {
    const elapsed = (Date.now() - startTime) / 1000;
    const accuracy = (correct / total) * 100;
    const normalized = normalizeScore(accuracy, elapsed, round + 1, 3);
    setRoundScores(prev => [...prev, normalized]);

    if (round < 2) {
      setMessage(correct === total ? '✅ Perfect!' : `Got ${correct}/${total}`);
      setGameState('roundEnd');
    } else {
      const allScores = [...roundScores, normalized];
      const avgScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
      const stars = calculateStars(avgScore);

      saveGameSession(childId, {
        gameId: 'color-recall',
        domain: 'memory',
        score: correct,
        maxScore: total,
        accuracy,
        timeTaken: elapsed,
        level: round + 1,
        stars,
        playedAt: new Date().toISOString(),
      });

      router.replace({
        pathname: '/game-results',
        params: { gameId: 'color-recall', score: avgScore, stars },
      });
    }
  };

  const nextRound = () => {
    setRound(r => r + 1);
    startRound();
  };

  useEffect(() => {
    if (round > 0 && gameState === 'roundEnd') {
      // Wait for user to tap next
    }
  }, [round]);

  // When round changes and game was in roundEnd, start the new round
  useEffect(() => {
    if (gameState === 'playing' && sequence.length === 0) {
      startRound();
    }
  }, [round]);

  const diff = DIFFICULTY[round];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Color Recall" subtitle={`Round ${round + 1}/3 · ${diff.name}`} />
      <View style={styles.container}>

        {gameState === 'intro' && (
          <View style={styles.introContainer}>
            <Text style={styles.introEmoji}>🎨</Text>
            <Text style={styles.introTitle}>Color Recall</Text>
            <Text style={styles.introDesc}>
              Watch the tiles flash in order, then repeat the sequence by tapping them!
            </Text>
            <Text style={styles.introHint}>3 rounds · Gets harder each round</Text>
            <View style={{ marginTop: 32, width: '100%' }}>
              <Button title="Start" onPress={startRound} />
            </View>
          </View>
        )}

        {(gameState === 'playing' || gameState === 'roundEnd') && (
          <>
            <View style={styles.grid}>
              {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, i) => (
                <Pressable key={i} onPress={() => handleTileTap(i)} disabled={isShowingSequence}>
                  <Animated.View
                    style={[
                      styles.tile,
                      {
                        backgroundColor: TILE_COLORS[i % TILE_COLORS.length],
                        transform: [{ scale: tileAnims[i] }],
                      },
                      activeIndex === i && styles.tileActive,
                      isShowingSequence && styles.tileDisabled,
                    ]}
                  >
                    <Text style={styles.tileText}>{i + 1}</Text>
                  </Animated.View>
                </Pressable>
              ))}
            </View>

            {isShowingSequence && (
              <Text style={styles.hintText}>👀 Watch carefully...</Text>
            )}
            {!isShowingSequence && gameState === 'playing' && (
              <Text style={styles.hintText}>
                Your turn! ({playerSequence.length}/{sequence.length})
              </Text>
            )}
            {gameState === 'roundEnd' && (
              <View style={styles.roundEndContainer}>
                <Text style={styles.roundEndText}>{message}</Text>
                <Button title="Next Round →" onPress={() => { setRound(r => r + 1); setTimeout(startRound, 100); }} />
              </View>
            )}
          </>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 300,
    justifyContent: 'center',
    gap: 10,
  },
  tile: {
    width: 88,
    height: 88,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  tileActive: {
    borderWidth: 4,
    borderColor: '#FFF',
    shadowColor: '#FFF',
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  tileDisabled: { opacity: 0.85 },
  tileText: { fontSize: 20, fontWeight: '800', color: 'rgba(255,255,255,0.5)' },
  hintText: { marginTop: 32, fontSize: 20, fontWeight: '700', color: '#8B7355', textAlign: 'center' },
  roundEndContainer: { marginTop: 24, alignItems: 'center', width: '100%' },
  roundEndText: { fontSize: 24, fontWeight: '800', color: '#FF7A00', marginBottom: 16 },
});

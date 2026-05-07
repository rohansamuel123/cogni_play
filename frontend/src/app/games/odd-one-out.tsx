import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { saveGameSession, normalizeScore, calculateStars } from '../../utils/scoring';

const { width } = Dimensions.get('window');

const SHAPES = ['●', '■', '▲', '◆', '★', '⬟'];
const COLORS = ['#FF1744', '#2979FF', '#00BFA5', '#FF6D00', '#7C4DFF', '#FFB300'];

interface GridItem {
  shape: string;
  color: string;
  isOdd: boolean;
}

const DIFFICULTY = [
  { name: 'Easy', gridSize: 4, type: 'color' as const, rounds: 4 },
  { name: 'Medium', gridSize: 6, type: 'shape' as const, rounds: 4 },
  { name: 'Hard', gridSize: 9, type: 'subtle' as const, rounds: 4 },
];

export default function OddOneOut() {
  const router = useRouter();
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'done'>('intro');
  const [round, setRound] = useState(0);
  const [subRound, setSubRound] = useState(0);
  const [grid, setGrid] = useState<GridItem[]>([]);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [childId, setChildId] = useState<number>(0);

  useEffect(() => {
    AsyncStorage.getItem('selectedChild').then((str) => {
      if (str) setChildId(JSON.parse(str).child_id);
    });
  }, []);

  const diff = DIFFICULTY[round];

  const generateGrid = () => {
    const d = DIFFICULTY[round];
    const baseShapeIdx = Math.floor(Math.random() * SHAPES.length);
    const baseColorIdx = Math.floor(Math.random() * COLORS.length);
    const oddIndex = Math.floor(Math.random() * d.gridSize);

    const items: GridItem[] = [];
    for (let i = 0; i < d.gridSize; i++) {
      if (i === oddIndex) {
        let oddShape = SHAPES[baseShapeIdx];
        let oddColor = COLORS[baseColorIdx];

        if (d.type === 'color') {
          const otherColorIdx = (baseColorIdx + 1 + Math.floor(Math.random() * (COLORS.length - 1))) % COLORS.length;
          oddColor = COLORS[otherColorIdx];
        } else if (d.type === 'shape') {
          const otherShapeIdx = (baseShapeIdx + 1 + Math.floor(Math.random() * (SHAPES.length - 1))) % SHAPES.length;
          oddShape = SHAPES[otherShapeIdx];
        } else {
          // Subtle: both shape and color slightly different
          const otherShapeIdx = (baseShapeIdx + 1) % SHAPES.length;
          oddShape = SHAPES[otherShapeIdx];
        }
        items.push({ shape: oddShape, color: oddColor, isOdd: true });
      } else {
        items.push({ shape: SHAPES[baseShapeIdx], color: COLORS[baseColorIdx], isOdd: false });
      }
    }
    setGrid(items);
  };

  const startGame = () => {
    setGameState('playing');
    setRound(0);
    setSubRound(0);
    setCorrect(0);
    setTotal(0);
    setStartTime(Date.now());
    generateGrid();
  };

  useEffect(() => {
    if (gameState === 'playing' && grid.length === 0) {
      generateGrid();
    }
  }, [round, subRound]);

  const handleTap = (item: GridItem) => {
    if (gameState !== 'playing' || feedback) return;

    setTotal(t => t + 1);
    if (item.isOdd) {
      setCorrect(c => c + 1);
      setFeedback('✅');
    } else {
      setFeedback('❌');
    }

    setTimeout(() => {
      setFeedback(null);
      const nextSubRound = subRound + 1;

      if (nextSubRound >= DIFFICULTY[round].rounds) {
        if (round < 2) {
          setRound(r => r + 1);
          setSubRound(0);
          generateGrid();
        } else {
          finishGame();
        }
      } else {
        setSubRound(nextSubRound);
        generateGrid();
      }
    }, 600);
  };

  const finishGame = () => {
    setGameState('done');
    const elapsed = (Date.now() - startTime) / 1000;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const normalized = normalizeScore(accuracy, elapsed, 3, 3);
    const stars = calculateStars(normalized);

    saveGameSession(childId, {
      gameId: 'odd-one-out',
      domain: 'logic',
      score: correct,
      maxScore: total,
      accuracy,
      timeTaken: elapsed,
      level: 3,
      stars,
      playedAt: new Date().toISOString(),
    });

    router.replace({
      pathname: '/game-results',
      params: { gameId: 'odd-one-out', score: normalized, stars },
    });
  };

  const cols = diff.gridSize <= 4 ? 2 : 3;
  const itemSize = Math.min((width - 80) / cols - 12, 100);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Odd One Out" subtitle={`Round ${round + 1}/3 · ${diff.name}`} />
      <View style={styles.container}>

        {gameState === 'intro' && (
          <View style={styles.introContainer}>
            <Text style={styles.introEmoji}>🔍</Text>
            <Text style={styles.introTitle}>Odd One Out</Text>
            <Text style={styles.introDesc}>
              Look at the shapes — one is different! Tap the odd one out as quickly as you can.
            </Text>
            <Text style={styles.introHint}>3 difficulty levels · Gets trickier</Text>
            <View style={{ marginTop: 32, width: '100%' }}>
              <Button title="Start" onPress={startGame} />
            </View>
          </View>
        )}

        {gameState === 'playing' && (
          <>
            <Text style={styles.progressText}>
              Find the different one! ({subRound + 1}/{diff.rounds})
            </Text>

            {feedback && (
              <Text style={styles.feedbackText}>{feedback}</Text>
            )}

            <View style={[styles.grid, { width: cols * (itemSize + 12) }]}>
              {grid.map((item, i) => (
                <Pressable key={i} onPress={() => handleTap(item)}>
                  <View style={[styles.gridItem, { width: itemSize, height: itemSize }]}>
                    <Text style={{ fontSize: itemSize * 0.5, color: item.color }}>{item.shape}</Text>
                  </View>
                </Pressable>
              ))}
            </View>

            <Text style={styles.scoreText}>Score: {correct}/{total}</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF9F0' },
  container: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  introContainer: { alignItems: 'center', paddingHorizontal: 24 },
  introEmoji: { fontSize: 64, marginBottom: 16 },
  introTitle: { fontSize: 32, fontWeight: '900', color: '#2D1B0E', marginBottom: 12 },
  introDesc: { fontSize: 17, color: '#8B7355', textAlign: 'center', lineHeight: 24, marginBottom: 8 },
  introHint: { fontSize: 14, color: '#B0A090', fontWeight: '600' },
  progressText: { fontSize: 18, fontWeight: '700', color: '#8B7355', marginBottom: 20 },
  feedbackText: { fontSize: 40, marginBottom: 8 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  gridItem: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F0E6D9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreText: { fontSize: 18, fontWeight: '700', color: '#FF7A00', marginTop: 24 },
});

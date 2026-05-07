import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { saveGameSession, normalizeScore, calculateStars } from '../../utils/scoring';

const { width } = Dimensions.get('window');

const DIFFICULTY = [
  { name: 'Easy', speed: 4000, spawnRate: 1200, goRatio: 0.7, total: 8 },
  { name: 'Medium', speed: 3000, spawnRate: 1000, goRatio: 0.6, total: 10 },
  { name: 'Hard', speed: 2200, spawnRate: 800, goRatio: 0.5, total: 12 },
];

interface Balloon {
  id: number;
  x: number;
  isGo: boolean; // true = tap it (orange), false = don't tap (red)
  anim: Animated.Value;
  tapped: boolean;
}

export default function BalloonPop() {
  const router = useRouter();
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'done'>('intro');
  const [round, setRound] = useState(0);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [falseAlarms, setFalseAlarms] = useState(0);
  const [spawned, setSpawned] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const balloonIdRef = useRef(0);
  const spawnIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [childId, setChildId] = useState<number>(0);

  useEffect(() => {
    AsyncStorage.getItem('selectedChild').then((str) => {
      if (str) setChildId(JSON.parse(str).child_id);
    });
  }, []);

  const diff = DIFFICULTY[round];
  const totalForAllRounds = DIFFICULTY.reduce((a, d) => a + d.total, 0);

  const startGame = () => {
    setGameState('playing');
    setRound(0);
    setHits(0);
    setMisses(0);
    setFalseAlarms(0);
    setSpawned(0);
    setBalloons([]);
    setStartTime(Date.now());
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const currentDiff = DIFFICULTY[round];
    let localSpawned = 0;
    const maxForRound = currentDiff.total;

    spawnIntervalRef.current = setInterval(() => {
      if (localSpawned >= maxForRound) {
        if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
        // Check if final round
        setTimeout(() => {
          if (round < 2) {
            setRound(r => r + 1);
          } else {
            finishGame();
          }
        }, currentDiff.speed + 500);
        return;
      }

      localSpawned++;
      setSpawned(s => s + 1);
      spawnBalloon(currentDiff);
    }, currentDiff.spawnRate);

    return () => {
      if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
    };
  }, [gameState, round]);

  const spawnBalloon = (currentDiff: typeof DIFFICULTY[0]) => {
    const id = balloonIdRef.current++;
    const x = 30 + Math.random() * (width - 120);
    const isGo = Math.random() < currentDiff.goRatio;
    const anim = new Animated.Value(0);

    const balloon: Balloon = { id, x, isGo, anim, tapped: false };

    setBalloons(prev => [...prev, balloon]);

    Animated.timing(anim, {
      toValue: 1,
      duration: currentDiff.speed,
      useNativeDriver: true,
    }).start(() => {
      setBalloons(prev => {
        const b = prev.find(bl => bl.id === id);
        if (b && !b.tapped && b.isGo) {
          setMisses(m => m + 1);
        }
        return prev.filter(bl => bl.id !== id);
      });
    });
  };

  const handleTap = (balloon: Balloon) => {
    if (balloon.tapped) return;

    setBalloons(prev =>
      prev.map(b => b.id === balloon.id ? { ...b, tapped: true } : b)
    );

    if (balloon.isGo) {
      setHits(h => h + 1);
    } else {
      setFalseAlarms(f => f + 1);
    }
  };

  const finishGame = () => {
    setGameState('done');
    if (spawnIntervalRef.current) clearInterval(spawnIntervalRef.current);
  };

  useEffect(() => {
    if (gameState === 'done') {
      const elapsed = (Date.now() - startTime) / 1000;
      const totalGo = Math.round(totalForAllRounds * 0.6); // approximate
      const accuracy = totalGo > 0 ? Math.round(((hits) / Math.max(1, hits + misses + falseAlarms)) * 100) : 0;
      const normalized = normalizeScore(accuracy, elapsed, 3, 3);
      const stars = calculateStars(normalized);

      saveGameSession(childId, {
        gameId: 'balloon-pop',
        domain: 'attention',
        score: hits,
        maxScore: totalGo,
        accuracy,
        timeTaken: elapsed,
        level: 3,
        stars,
        playedAt: new Date().toISOString(),
      });

      router.replace({
        pathname: '/game-results',
        params: { gameId: 'balloon-pop', score: normalized, stars },
      });
    }
  }, [gameState]);

  const PLAY_AREA_HEIGHT = 450;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Balloon Pop"
        subtitle={gameState === 'playing' ? `Round ${round + 1}/3 · ${diff.name}` : undefined}
      />
      <View style={styles.container}>

        {gameState === 'intro' && (
          <View style={styles.introContainer}>
            <Text style={styles.introEmoji}>🎈</Text>
            <Text style={styles.introTitle}>Balloon Pop</Text>
            <Text style={styles.introDesc}>
              Tap the <Text style={{ color: '#FF6D00', fontWeight: '800' }}>orange</Text> balloons!{'\n'}
              Don't tap the <Text style={{ color: '#FF1744', fontWeight: '800' }}>red</Text> ones!
            </Text>
            <Text style={styles.introHint}>3 rounds · Gets faster</Text>
            <View style={{ marginTop: 32, width: '100%' }}>
              <Button title="Start" onPress={startGame} />
            </View>
          </View>
        )}

        {gameState === 'playing' && (
          <>
            <View style={styles.statsRow}>
              <Text style={styles.statGood}>✅ {hits}</Text>
              <Text style={styles.statBad}>❌ {falseAlarms}</Text>
            </View>
            <View style={[styles.playArea, { height: PLAY_AREA_HEIGHT }]}>
              {balloons.filter(b => !b.tapped).map(balloon => (
                <Animated.View
                  key={balloon.id}
                  style={[
                    styles.balloon,
                    {
                      left: balloon.x,
                      transform: [
                        {
                          translateY: balloon.anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [PLAY_AREA_HEIGHT, -80],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Pressable onPress={() => handleTap(balloon)}>
                    <View
                      style={[
                        styles.balloonBody,
                        { backgroundColor: balloon.isGo ? '#FF6D00' : '#FF1744' },
                      ]}
                    >
                      <Text style={styles.balloonEmoji}>{balloon.isGo ? '🎈' : '💣'}</Text>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF9F0' },
  container: { flex: 1, padding: 20, alignItems: 'center' },
  introContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  introEmoji: { fontSize: 64, marginBottom: 16 },
  introTitle: { fontSize: 32, fontWeight: '900', color: '#2D1B0E', marginBottom: 12 },
  introDesc: { fontSize: 17, color: '#8B7355', textAlign: 'center', lineHeight: 26, marginBottom: 8 },
  introHint: { fontSize: 14, color: '#B0A090', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 24, marginBottom: 12 },
  statGood: { fontSize: 20, fontWeight: '800', color: '#00BFA5' },
  statBad: { fontSize: 20, fontWeight: '800', color: '#FF1744' },
  playArea: {
    width: '100%',
    backgroundColor: '#E8F5FD',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#C8E0F0',
  },
  balloon: {
    position: 'absolute',
    width: 60,
  },
  balloonBody: {
    width: 56,
    height: 68,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  balloonEmoji: { fontSize: 28 },
});

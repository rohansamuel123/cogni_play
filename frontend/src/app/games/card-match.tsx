import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { saveGameSession, normalizeScore, calculateStars } from '../../utils/scoring';

const { width } = Dimensions.get('window');
const CARD_EMOJIS = ['🐶', '🐱', '🐸', '🦊', '🐼', '🐯', '🦁', '🐨'];

const DIFFICULTY = [
  { name: 'Easy', cols: 3, rows: 2, pairs: 3 },
  { name: 'Medium', cols: 4, rows: 3, pairs: 6 },
  { name: 'Hard', cols: 4, rows: 4, pairs: 8 },
];

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

export default function CardMatch() {
  const router = useRouter();
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'roundEnd' | 'done'>('intro');
  const [round, setRound] = useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [childId, setChildId] = useState<number>(0);

  useEffect(() => {
    AsyncStorage.getItem('selectedChild').then((str) => {
      if (str) setChildId(JSON.parse(str).child_id);
    });
  }, []);

  const diff = DIFFICULTY[round];

  const createBoard = (roundIndex: number) => {
    const d = DIFFICULTY[roundIndex];
    const emojis = CARD_EMOJIS.slice(0, d.pairs);
    const doubled = [...emojis, ...emojis];
    const shuffled = doubled.sort(() => Math.random() - 0.5);
    return shuffled.map((emoji, i) => ({
      id: i,
      emoji,
      flipped: false,
      matched: false,
    }));
  };

  const startRound = (roundIndex?: number) => {
    const r = typeof roundIndex === 'number' ? roundIndex : round;
    setCards(createBoard(r));
    setFlippedIndices([]);
    setMoves(0);
    setMatchedCount(0);
    setIsChecking(false);
    setGameState('playing');
    setStartTime(Date.now());
  };

  const handleCardPress = (index: number) => {
    if (isChecking || gameState !== 'playing') return;
    const card = cards[index];
    if (card.flipped || card.matched) return;

    const newCards = [...cards];
    newCards[index] = { ...newCards[index], flipped: true };
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setIsChecking(true);
      setMoves(m => m + 1);
      const [first, second] = newFlipped;

      if (newCards[first].emoji === newCards[second].emoji) {
        // Match!
        setTimeout(() => {
          setCards(prev => prev.map((c, i) =>
            i === first || i === second ? { ...c, matched: true } : c
          ));
          setFlippedIndices([]);
          setMatchedCount(prev => {
            const next = prev + 1;
            if (next >= DIFFICULTY[round].pairs) {
              finishRound();
            }
            return next;
          });
          setIsChecking(false);
        }, 400);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map((c, i) =>
            i === first || i === second ? { ...c, flipped: false } : c
          ));
          setFlippedIndices([]);
          setIsChecking(false);
        }, 800);
      }
    }
  };

  const finishRound = () => {
    const elapsed = (Date.now() - startTime) / 1000;
    const d = DIFFICULTY[round];
    const perfectMoves = d.pairs;
    const accuracy = Math.min(100, Math.round((perfectMoves / Math.max(1, moves + 1)) * 100));
    const normalized = normalizeScore(accuracy, elapsed, round + 1, 3);
    const newScores = [...roundScores, normalized];
    setRoundScores(newScores);

    if (round < 2) {
      setGameState('roundEnd');
    } else {
      const avgScore = Math.round(newScores.reduce((a, b) => a + b, 0) / newScores.length);
      const stars = calculateStars(avgScore);

      saveGameSession(childId, {
        gameId: 'card-match',
        domain: 'memory',
        score: moves + 1,
        maxScore: DIFFICULTY[2].pairs,
        accuracy,
        timeTaken: elapsed,
        level: 3,
        stars,
        playedAt: new Date().toISOString(),
      });

      router.replace({
        pathname: '/game-results',
        params: { gameId: 'card-match', score: avgScore, stars },
      });
    }
  };

  const nextRound = () => {
    const newRound = round + 1;
    setRound(newRound);
    setTimeout(() => startRound(newRound), 100);
  };

  const cardSize = Math.min((width - 60) / diff.cols - 10, 80);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Card Match" subtitle={`Round ${round + 1}/3 · ${diff.name}`} />
      <View style={styles.container}>

        {gameState === 'intro' && (
          <View style={styles.introContainer}>
            <Text style={styles.introEmoji}>🃏</Text>
            <Text style={styles.introTitle}>Card Match</Text>
            <Text style={styles.introDesc}>
              Flip cards to find matching pairs! Try to remember where each card is.
            </Text>
            <Text style={styles.introHint}>3 rounds · More pairs each round</Text>
            <View style={{ marginTop: 32, width: '100%' }}>
              <Button title="Start" onPress={startRound} />
            </View>
          </View>
        )}

        {(gameState === 'playing' || gameState === 'roundEnd') && (
          <>
            <Text style={styles.movesText}>Moves: {moves}</Text>
            <View style={[styles.grid, { width: diff.cols * (cardSize + 10) }]}>
              {cards.map((card, index) => (
                <Pressable
                  key={card.id}
                  onPress={() => handleCardPress(index)}
                  disabled={card.matched || card.flipped}
                >
                  <View
                    style={[
                      styles.card,
                      { width: cardSize, height: cardSize * 1.2 },
                      card.matched && styles.cardMatched,
                      card.flipped && styles.cardFlipped,
                    ]}
                  >
                    {(card.flipped || card.matched) ? (
                      <Text style={[styles.cardEmoji, { fontSize: cardSize * 0.45 }]}>{card.emoji}</Text>
                    ) : (
                      <Text style={[styles.cardBack, { fontSize: cardSize * 0.3 }]}>?</Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>

            {gameState === 'roundEnd' && (
              <View style={styles.roundEndContainer}>
                <Text style={styles.roundEndText}>
                  ✅ Round {round + 1} Complete! ({moves} moves)
                </Text>
                <Button title="Next Round →" onPress={nextRound} />
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
  container: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },
  introContainer: { alignItems: 'center', paddingHorizontal: 24 },
  introEmoji: { fontSize: 64, marginBottom: 16 },
  introTitle: { fontSize: 32, fontWeight: '900', color: '#2D1B0E', marginBottom: 12 },
  introDesc: { fontSize: 17, color: '#8B7355', textAlign: 'center', lineHeight: 24, marginBottom: 8 },
  introHint: { fontSize: 14, color: '#B0A090', fontWeight: '600' },
  movesText: { fontSize: 18, fontWeight: '700', color: '#8B7355', marginBottom: 16 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  card: {
    backgroundColor: '#7C4DFF',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
    margin: 1,
  },
  cardFlipped: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#7C4DFF',
  },
  cardMatched: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#4CAF50',
    opacity: 0.7,
  },
  cardEmoji: { textAlign: 'center' },
  cardBack: { color: 'rgba(255,255,255,0.6)', fontWeight: '900' },
  roundEndContainer: { marginTop: 24, alignItems: 'center', width: '100%' },
  roundEndText: { fontSize: 20, fontWeight: '800', color: '#FF7A00', marginBottom: 16 },
});

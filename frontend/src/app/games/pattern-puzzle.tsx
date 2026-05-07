import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { saveGameSession, normalizeScore, calculateStars } from '../../utils/scoring';

const { width } = Dimensions.get('window');

const SHAPES = ['●', '■', '▲', '◆'];
const PATTERN_COLORS = ['#FF1744', '#2979FF', '#00BFA5', '#FF6D00', '#7C4DFF', '#FFB300'];

interface PatternQuestion {
  grid: string[];    // 3 visible items + 1 blank represented by '?'
  gridColors: string[];
  options: string[];
  optionColors: string[];
  correctIndex: number;
}

function generateQuestion(difficulty: number): PatternQuestion {
  if (difficulty === 0) {
    // Easy: Color pattern (same shape, colors follow a pattern)
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const c1 = Math.floor(Math.random() * PATTERN_COLORS.length);
    const c2 = (c1 + 1) % PATTERN_COLORS.length;
    // Pattern: c1, c2, c1, c2
    const gridColors = [PATTERN_COLORS[c1], PATTERN_COLORS[c2], PATTERN_COLORS[c1], PATTERN_COLORS[c2]];
    const grid = [shape, shape, shape, '?'];
    const correctAnswer = shape;
    const correctColor = PATTERN_COLORS[c2];

    const options = [shape, shape, shape, shape];
    const wrongColors = PATTERN_COLORS.filter(c => c !== correctColor).slice(0, 3);
    const optionColors = [correctColor, wrongColors[0], wrongColors[1], wrongColors[2]].sort(() => Math.random() - 0.5);
    const correctIndex = optionColors.indexOf(correctColor);

    return { grid, gridColors, options, optionColors, correctIndex };
  } else if (difficulty === 1) {
    // Medium: Shape pattern
    const s1 = Math.floor(Math.random() * SHAPES.length);
    const s2 = (s1 + 1) % SHAPES.length;
    const color = PATTERN_COLORS[Math.floor(Math.random() * PATTERN_COLORS.length)];
    // Pattern: s1, s2, s1, s2
    const grid = [SHAPES[s1], SHAPES[s2], SHAPES[s1], '?'];
    const gridColors = [color, color, color, color];
    const correctAnswer = SHAPES[s2];

    const wrongShapes = SHAPES.filter(s => s !== correctAnswer).slice(0, 3);
    const allOptions = [correctAnswer, ...wrongShapes].sort(() => Math.random() - 0.5);
    const correctIndex = allOptions.indexOf(correctAnswer);

    return {
      grid, gridColors,
      options: allOptions,
      optionColors: allOptions.map(() => color),
      correctIndex,
    };
  } else {
    // Hard: Shape + Color pattern
    const s1 = Math.floor(Math.random() * SHAPES.length);
    const s2 = (s1 + 1) % SHAPES.length;
    const c1 = Math.floor(Math.random() * PATTERN_COLORS.length);
    const c2 = (c1 + 2) % PATTERN_COLORS.length;
    // Pattern: (s1,c1), (s2,c2), (s1,c1), (s2,c2)
    const grid = [SHAPES[s1], SHAPES[s2], SHAPES[s1], '?'];
    const gridColors = [PATTERN_COLORS[c1], PATTERN_COLORS[c2], PATTERN_COLORS[c1], PATTERN_COLORS[c2]];
    const correctShape = SHAPES[s2];
    const correctColor = PATTERN_COLORS[c2];

    // Generate wrong options with different shape/color combos
    const options = [correctShape];
    const optionColors = [correctColor];
    for (let i = 0; i < 3; i++) {
      const ws = SHAPES[(s2 + i + 1) % SHAPES.length];
      const wc = PATTERN_COLORS[(c2 + i + 1) % PATTERN_COLORS.length];
      options.push(ws);
      optionColors.push(wc);
    }

    // Shuffle
    const indices = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    const shuffledOptions = indices.map(i => options[i]);
    const shuffledColors = indices.map(i => optionColors[i]);
    const correctIndex = indices.indexOf(0);

    return { grid, gridColors, options: shuffledOptions, optionColors: shuffledColors, correctIndex };
  }
}

export default function PatternPuzzle() {
  const router = useRouter();
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'done'>('intro');
  const [round, setRound] = useState(0);
  const [questionNum, setQuestionNum] = useState(0);
  const [question, setQuestion] = useState<PatternQuestion | null>(null);
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

  const QUESTIONS_PER_ROUND = 4;

  const startGame = () => {
    setGameState('playing');
    setRound(0);
    setQuestionNum(0);
    setCorrect(0);
    setTotal(0);
    setStartTime(Date.now());
    setQuestion(generateQuestion(0));
  };

  const handleAnswer = (index: number) => {
    if (feedback || !question) return;

    setTotal(t => t + 1);
    if (index === question.correctIndex) {
      setCorrect(c => c + 1);
      setFeedback('✅ Correct!');
    } else {
      setFeedback('❌ Not quite');
    }

    setTimeout(() => {
      setFeedback(null);
      const nextQ = questionNum + 1;

      if (nextQ >= QUESTIONS_PER_ROUND) {
        if (round < 2) {
          const nextRound = round + 1;
          setRound(nextRound);
          setQuestionNum(0);
          setQuestion(generateQuestion(nextRound));
        } else {
          finishGame();
        }
      } else {
        setQuestionNum(nextQ);
        setQuestion(generateQuestion(round));
      }
    }, 800);
  };

  const finishGame = () => {
    setGameState('done');
    const elapsed = (Date.now() - startTime) / 1000;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const normalized = normalizeScore(accuracy, elapsed, 3, 3);
    const stars = calculateStars(normalized);

    saveGameSession(childId, {
      gameId: 'pattern-puzzle',
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
      params: { gameId: 'pattern-puzzle', score: normalized, stars },
    });
  };

  const DIFF_NAMES = ['Easy', 'Medium', 'Hard'];
  const cellSize = Math.min((width - 100) / 2 - 8, 90);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Pattern Puzzle" subtitle={`Round ${round + 1}/3 · ${DIFF_NAMES[round]}`} />
      <View style={styles.container}>

        {gameState === 'intro' && (
          <View style={styles.introContainer}>
            <Text style={styles.introEmoji}>🧩</Text>
            <Text style={styles.introTitle}>Pattern Puzzle</Text>
            <Text style={styles.introDesc}>
              Look at the pattern in the grid. Pick the piece that completes it!
            </Text>
            <Text style={styles.introHint}>3 rounds · Patterns get complex</Text>
            <View style={{ marginTop: 32, width: '100%' }}>
              <Button title="Start" onPress={startGame} />
            </View>
          </View>
        )}

        {gameState === 'playing' && question && (
          <>
            <Text style={styles.promptText}>What comes next?</Text>
            <Text style={styles.progressText}>
              Question {questionNum + 1}/{QUESTIONS_PER_ROUND}
            </Text>

            {/* Pattern Grid */}
            <View style={styles.patternGrid}>
              {question.grid.map((item, i) => (
                <View key={i} style={[styles.patternCell, { width: cellSize, height: cellSize }]}>
                  {item === '?' ? (
                    <Text style={[styles.questionMark, { fontSize: cellSize * 0.5 }]}>?</Text>
                  ) : (
                    <Text style={{ fontSize: cellSize * 0.5, color: question.gridColors[i] }}>{item}</Text>
                  )}
                </View>
              ))}
            </View>

            {feedback && <Text style={styles.feedbackText}>{feedback}</Text>}

            {/* Answer Options */}
            <Text style={styles.chooseText}>Choose:</Text>
            <View style={styles.optionsRow}>
              {question.options.map((opt, i) => (
                <Pressable
                  key={i}
                  onPress={() => handleAnswer(i)}
                  style={({ pressed }) => [
                    styles.optionCell,
                    { width: cellSize * 0.8, height: cellSize * 0.8 },
                    pressed && { transform: [{ scale: 0.9 }] },
                  ]}
                >
                  <Text style={{ fontSize: cellSize * 0.4, color: question.optionColors[i] }}>{opt}</Text>
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
  promptText: { fontSize: 24, fontWeight: '800', color: '#2D1B0E', marginBottom: 4 },
  progressText: { fontSize: 14, fontWeight: '600', color: '#B0A090', marginBottom: 24 },
  patternGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 220,
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  patternCell: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8DDD0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  questionMark: { color: '#D0C0B0', fontWeight: '900' },
  feedbackText: { fontSize: 20, fontWeight: '800', marginBottom: 12, color: '#FF7A00' },
  chooseText: { fontSize: 16, fontWeight: '700', color: '#8B7355', marginBottom: 12 },
  optionsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  optionCell: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFE0B2',
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreText: { fontSize: 18, fontWeight: '700', color: '#FF7A00', marginTop: 8 },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { saveGameSession, normalizeScore, calculateStars } from '../../utils/scoring';

const { width } = Dimensions.get('window');

interface ShapeItem {
  id: string;
  shape: string;
  color: string;
  size: 'big' | 'small';
  label: string; // e.g. "big blue circle"
}

const SHAPE_MAP: Record<string, string> = {
  circle: '●',
  square: '■',
  triangle: '▲',
  star: '★',
};

const COLOR_MAP: Record<string, string> = {
  red: '#FF1744',
  blue: '#2979FF',
  green: '#00BFA5',
  orange: '#FF6D00',
  purple: '#7C4DFF',
};

interface Instruction {
  text: string;
  correctSequence: string[]; // array of shape ids to tap in order
  shapes: ShapeItem[];
}

function generateInstruction(difficulty: number): Instruction {
  const shapeNames = Object.keys(SHAPE_MAP);
  const colorNames = Object.keys(COLOR_MAP);
  const sizes: ('big' | 'small')[] = ['big', 'small'];

  // Generate 4-6 shapes on screen
  const numShapes = difficulty === 0 ? 4 : difficulty === 1 ? 5 : 6;
  const shapes: ShapeItem[] = [];

  for (let i = 0; i < numShapes; i++) {
    const shape = shapeNames[i % shapeNames.length];
    const color = colorNames[i % colorNames.length];
    const size = sizes[i % 2];
    shapes.push({
      id: `${size}-${color}-${shape}`,
      shape: SHAPE_MAP[shape],
      color: COLOR_MAP[color],
      size,
      label: `${size} ${color} ${shape}`,
    });
  }

  // Shuffle positions
  const shuffled = [...shapes].sort(() => Math.random() - 0.5);

  if (difficulty === 0) {
    // Easy: "Tap the [big blue circle]"
    const target = shuffled[0];
    return {
      text: `Tap the ${target.label}`,
      correctSequence: [target.id],
      shapes: shuffled,
    };
  } else if (difficulty === 1) {
    // Medium: "Tap the [big blue circle], then the [small red square]"
    const t1 = shuffled[0];
    const t2 = shuffled[1];
    return {
      text: `Tap the ${t1.label}, then the ${t2.label}`,
      correctSequence: [t1.id, t2.id],
      shapes: shuffled,
    };
  } else {
    // Hard: "Tap the [big blue circle] and [small green triangle], but NOT the [red square]"
    const t1 = shuffled[0];
    const t2 = shuffled[1];
    return {
      text: `Tap the ${t1.label}, then the ${t2.label} (skip ${shuffled[2].label.split(' ').slice(1).join(' ')}!)`,
      correctSequence: [t1.id, t2.id],
      shapes: shuffled,
    };
  }
}

export default function FollowSteps() {
  const router = useRouter();
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'done'>('intro');
  const [round, setRound] = useState(0);
  const [questionNum, setQuestionNum] = useState(0);
  const [instruction, setInstruction] = useState<Instruction | null>(null);
  const [playerTaps, setPlayerTaps] = useState<string[]>([]);
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

  const QUESTIONS_PER_ROUND = 3;
  const DIFF_NAMES = ['Easy', 'Medium', 'Hard'];

  const startGame = () => {
    setGameState('playing');
    setRound(0);
    setQuestionNum(0);
    setCorrect(0);
    setTotal(0);
    setPlayerTaps([]);
    setStartTime(Date.now());
    setInstruction(generateInstruction(0));
  };

  const handleShapeTap = (shape: ShapeItem) => {
    if (feedback || !instruction) return;

    const newTaps = [...playerTaps, shape.id];
    setPlayerTaps(newTaps);

    const expectedIndex = newTaps.length - 1;
    const expected = instruction.correctSequence[expectedIndex];

    if (shape.id !== expected) {
      setTotal(t => t + 1);
      setFeedback('❌ Wrong shape!');
      advanceAfterDelay();
      return;
    }

    if (newTaps.length === instruction.correctSequence.length) {
      setTotal(t => t + 1);
      setCorrect(c => c + 1);
      setFeedback('✅ Perfect!');
      advanceAfterDelay();
    }
  };

  const advanceAfterDelay = () => {
    setTimeout(() => {
      setFeedback(null);
      setPlayerTaps([]);
      const nextQ = questionNum + 1;

      if (nextQ >= QUESTIONS_PER_ROUND) {
        if (round < 2) {
          const nextRound = round + 1;
          setRound(nextRound);
          setQuestionNum(0);
          setInstruction(generateInstruction(nextRound));
        } else {
          finishGame();
        }
      } else {
        setQuestionNum(nextQ);
        setInstruction(generateInstruction(round));
      }
    }, 1000);
  };

  const finishGame = () => {
    setGameState('done');
    const elapsed = (Date.now() - startTime) / 1000;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const normalized = normalizeScore(accuracy, elapsed, 3, 3);
    const stars = calculateStars(normalized);

    saveGameSession(childId, {
      gameId: 'follow-steps',
      domain: 'logic',
      score: accuracy,
      maxScore: 100,
      accuracy,
      timeTaken: elapsed,
      level: round + 1,
      stars,
      playedAt: new Date().toISOString(),
    });

    router.replace({
      pathname: '/game-results',
      params: { gameId: 'follow-steps', score: normalized, stars },
    });
  };

  const shapeSize = Math.min((width - 80) / 3 - 10, 85);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Follow Steps" subtitle={`Round ${round + 1}/3 · ${DIFF_NAMES[round]}`} />
      <View style={styles.container}>

        {gameState === 'intro' && (
          <View style={styles.introContainer}>
            <Text style={styles.introEmoji}>📋</Text>
            <Text style={styles.introTitle}>Follow Steps</Text>
            <Text style={styles.introDesc}>
              Read the instruction carefully and tap the correct shapes in the right order!
            </Text>
            <Text style={styles.introHint}>3 rounds · Instructions get longer</Text>
            <View style={{ marginTop: 32, width: '100%' }}>
              <Button title="Start" onPress={startGame} />
            </View>
          </View>
        )}

        {gameState === 'playing' && instruction && (
          <>
            {/* Instruction text */}
            <View style={styles.instructionBox}>
              <Text style={styles.instructionText}>{instruction.text}</Text>
            </View>

            {feedback && <Text style={styles.feedbackText}>{feedback}</Text>}

            <Text style={styles.tapHint}>
              Tap {playerTaps.length + 1} of {instruction.correctSequence.length}
            </Text>

            {/* Shapes grid */}
            <View style={styles.shapesGrid}>
              {instruction.shapes.map((shape, i) => {
                const isTapped = playerTaps.includes(shape.id);
                return (
                  <Pressable
                    key={i}
                    onPress={() => handleShapeTap(shape)}
                    disabled={isTapped || !!feedback}
                  >
                    <View style={[
                      styles.shapeCell,
                      { width: shapeSize, height: shapeSize },
                      isTapped && styles.shapeTapped,
                    ]}>
                      <Text style={{
                        fontSize: shape.size === 'big' ? shapeSize * 0.5 : shapeSize * 0.3,
                        color: shape.color,
                      }}>
                        {shape.shape}
                      </Text>
                      <Text style={styles.shapeSizeLabel}>{shape.size}</Text>
                    </View>
                  </Pressable>
                );
              })}
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
  instructionBox: {
    backgroundColor: '#2979FF',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 20,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#2979FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 26,
  },
  tapHint: { fontSize: 14, fontWeight: '600', color: '#B0A090', marginBottom: 16 },
  feedbackText: { fontSize: 22, fontWeight: '800', marginBottom: 12, color: '#FF7A00' },
  shapesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  shapeCell: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8DDD0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  shapeTapped: {
    opacity: 0.3,
    backgroundColor: '#F0F0F0',
  },
  shapeSizeLabel: { fontSize: 10, color: '#B0A090', fontWeight: '700', marginTop: 4 },
  scoreText: { fontSize: 18, fontWeight: '700', color: '#FF7A00', marginTop: 8 },
});

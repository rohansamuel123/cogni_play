import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { saveGameSession, normalizeScore, calculateStars } from '../../utils/scoring';

interface SequenceQuestion {
  sequence: (number | string)[];
  options: (number | string)[];
  correctIndex: number;
  rule: string;
}

function generateQuestion(difficulty: number): SequenceQuestion {
  if (difficulty === 0) {
    // Easy: Simple +N sequences
    const step = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
    const start = Math.floor(Math.random() * 5) + 1;
    const sequence = [];
    for (let i = 0; i < 4; i++) sequence.push(start + step * i);
    const answer = start + step * 4;
    const wrongs = [answer + step, answer - step, answer + 1].filter(w => w !== answer && w > 0);
    const options = [answer, ...wrongs.slice(0, 3)].sort(() => Math.random() - 0.5);
    return {
      sequence: [...sequence, '?'],
      options,
      correctIndex: options.indexOf(answer),
      rule: `+${step}`,
    };
  } else if (difficulty === 1) {
    // Medium: Alternating patterns (e.g., +2, +3, +2, +3)
    const s1 = Math.floor(Math.random() * 3) + 1;
    const s2 = Math.floor(Math.random() * 3) + 2;
    const start = Math.floor(Math.random() * 5) + 1;
    const sequence = [start];
    for (let i = 1; i < 5; i++) {
      const step = i % 2 === 1 ? s1 : s2;
      sequence.push(sequence[i - 1] + step);
    }
    const answer = sequence[4] + s1;
    const wrongs = [answer + 1, answer - 1, answer + s2].filter(w => w !== answer && w > 0);
    const options = [answer, ...wrongs.slice(0, 3)].sort(() => Math.random() - 0.5);
    return {
      sequence: [...sequence, '?'],
      options,
      correctIndex: options.indexOf(answer),
      rule: `alternating +${s1}/+${s2}`,
    };
  } else {
    // Hard: Multiply or mixed operations
    const multiplier = Math.floor(Math.random() * 2) + 2; // x2 or x3
    const start = Math.floor(Math.random() * 3) + 1;
    const sequence = [start];
    for (let i = 1; i < 4; i++) sequence.push(sequence[i - 1] * multiplier);
    const answer = sequence[3] * multiplier;
    const wrongs = [answer + multiplier, answer - multiplier, answer * 2].filter(w => w !== answer && w > 0);
    const options = [answer, ...wrongs.slice(0, 3)].sort(() => Math.random() - 0.5);
    return {
      sequence: [...sequence, '?'],
      options,
      correctIndex: options.indexOf(answer),
      rule: `×${multiplier}`,
    };
  }
}

export default function SequenceBuilder() {
  const router = useRouter();
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'done'>('intro');
  const [round, setRound] = useState(0);
  const [questionNum, setQuestionNum] = useState(0);
  const [question, setQuestion] = useState<SequenceQuestion | null>(null);
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
      setFeedback(`❌ It was ${question.options[question.correctIndex]}`);
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
    }, 1000);
  };

  const finishGame = () => {
    setGameState('done');
    const elapsed = (Date.now() - startTime) / 1000;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const normalized = normalizeScore(accuracy, elapsed, 3, 3);
    const stars = calculateStars(normalized);

    saveGameSession(childId, {
      gameId: 'sequence-builder',
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
      params: { gameId: 'sequence-builder', score: normalized, stars },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Sequence Builder" subtitle={`Round ${round + 1}/3 · ${DIFF_NAMES[round]}`} />
      <View style={styles.container}>

        {gameState === 'intro' && (
          <View style={styles.introContainer}>
            <Text style={styles.introEmoji}>🔢</Text>
            <Text style={styles.introTitle}>Sequence Builder</Text>
            <Text style={styles.introDesc}>
              Figure out the pattern in the numbers and pick what comes next!
            </Text>
            <Text style={styles.introHint}>3 rounds · Rules get complex</Text>
            <View style={{ marginTop: 32, width: '100%' }}>
              <Button title="Start" onPress={startGame} />
            </View>
          </View>
        )}

        {gameState === 'playing' && question && (
          <>
            <Text style={styles.promptText}>What comes next?</Text>
            <Text style={styles.progressText}>
              {DIFF_NAMES[round]} · Q{questionNum + 1}/{QUESTIONS_PER_ROUND}
            </Text>

            {/* Sequence display */}
            <View style={styles.sequenceWrapContainer}>
              {question.sequence.map((item, i) => (
                <View key={i} style={styles.seqItemContainer}>
                  <View style={[
                    styles.seqItem,
                    item === '?' && styles.seqItemMissing,
                  ]}>
                    <Text style={[
                      styles.seqText,
                      item === '?' && styles.seqTextMissing,
                    ]}>{item}</Text>
                  </View>
                  {i < question.sequence.length - 1 && (
                    <Text style={styles.arrow}>→</Text>
                  )}
                </View>
              ))}
            </View>

            {feedback && <Text style={styles.feedbackText}>{feedback}</Text>}

            {/* Options */}
            <View style={styles.optionsGrid}>
              {question.options.map((opt, i) => (
                <Pressable
                  key={i}
                  onPress={() => handleAnswer(i)}
                  style={({ pressed }) => [
                    styles.optionButton,
                    pressed && { transform: [{ scale: 0.92 }] },
                  ]}
                >
                  <Text style={styles.optionText}>{opt}</Text>
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
  sequenceWrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 4,
  },
  seqItemContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  seqItem: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#00BFA5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  seqItemMissing: {
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: '#FFB300',
    borderStyle: 'dashed',
  },
  seqText: { fontSize: 18, fontWeight: '900', color: '#FFF' },
  seqTextMissing: { color: '#FFB300', fontSize: 24 },
  arrow: { fontSize: 16, color: '#D0C0B0', marginHorizontal: 2 },
  feedbackText: { fontSize: 20, fontWeight: '800', marginBottom: 16, color: '#FF7A00' },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  optionButton: {
    width: 72,
    height: 56,
    backgroundColor: '#FFF',
    borderRadius: 14,
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
  optionText: { fontSize: 22, fontWeight: '800', color: '#2D1B0E' },
  scoreText: { fontSize: 18, fontWeight: '700', color: '#FF7A00', marginTop: 8 },
});

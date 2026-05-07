import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Pressable,
  Animated, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { saveGameSession, normalizeScore, calculateStars } from '../../utils/scoring';

const { width } = Dimensions.get('window');

// ─── Story data ───────────────────────────────────────────
// Each story is an ORDERED array; the game shuffles them.
interface StoryCard {
  emoji: string;
  label: string;
}

interface Story {
  title: string;
  cards: StoryCard[];
}

const EASY_STORIES: Story[] = [
  {
    title: 'Growing a Flower',
    cards: [
      { emoji: '🌱', label: 'Plant seed' },
      { emoji: '🌿', label: 'It grows' },
      { emoji: '🌻', label: 'Flower blooms' },
    ],
  },
  {
    title: 'A Rainy Day',
    cards: [
      { emoji: '☁️', label: 'Clouds gather' },
      { emoji: '🌧️', label: 'It rains' },
      { emoji: '🌈', label: 'Rainbow appears' },
    ],
  },
  {
    title: 'Baby Chick',
    cards: [
      { emoji: '🥚', label: 'An egg' },
      { emoji: '🐣', label: 'Hatching' },
      { emoji: '🐥', label: 'A chick!' },
    ],
  },
  {
    title: 'Morning Routine',
    cards: [
      { emoji: '🛏️', label: 'Sleeping' },
      { emoji: '⏰', label: 'Wake up' },
      { emoji: '🍳', label: 'Breakfast' },
    ],
  },
];

const MEDIUM_STORIES: Story[] = [
  {
    title: 'Sending a Letter',
    cards: [
      { emoji: '📝', label: 'Write letter' },
      { emoji: '✉️', label: 'Put in envelope' },
      { emoji: '📮', label: 'Mail it' },
    ],
  },
  {
    title: 'Baking a Cake',
    cards: [
      { emoji: '🥣', label: 'Mix batter' },
      { emoji: '🍰', label: 'Bake cake' },
      { emoji: '🎂', label: 'Decorate it!' },
    ],
  },
  {
    title: 'Going to School',
    cards: [
      { emoji: '🎒', label: 'Pack bag' },
      { emoji: '🚌', label: 'Ride the bus' },
      { emoji: '🏫', label: 'Arrive at school' },
    ],
  },
  {
    title: 'Building a Snowman',
    cards: [
      { emoji: '❄️', label: 'Snow falls' },
      { emoji: '⛄', label: 'Build snowman' },
      { emoji: '🧣', label: 'Add scarf' },
    ],
  },
];

const HARD_STORIES: Story[] = [
  {
    title: 'Butterfly Life',
    cards: [
      { emoji: '🐛', label: 'Caterpillar' },
      { emoji: '🍃', label: 'Eats leaves' },
      { emoji: '🫘', label: 'Cocoon' },
      { emoji: '🦋', label: 'Butterfly!' },
    ],
  },
  {
    title: 'Space Adventure',
    cards: [
      { emoji: '🚀', label: 'Rocket launch' },
      { emoji: '🌍', label: 'Leave Earth' },
      { emoji: '🌙', label: 'Reach the Moon' },
      { emoji: '👨‍🚀', label: 'Moon walk!' },
    ],
  },
  {
    title: 'Cooking Dinner',
    cards: [
      { emoji: '🛒', label: 'Buy groceries' },
      { emoji: '🔪', label: 'Chop veggies' },
      { emoji: '🍳', label: 'Cook food' },
      { emoji: '🍽️', label: 'Serve dinner' },
    ],
  },
];

const ROUND_STORIES = [EASY_STORIES, MEDIUM_STORIES, HARD_STORIES];
const DIFF_NAMES = ['Easy', 'Medium', 'Hard'];
const STORIES_PER_ROUND = 2;

// ─── Helpers ──────────────────────────────────────────────
function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickRandom<T>(arr: T[], count: number): T[] {
  return shuffleArray(arr).slice(0, count);
}

// ─── Component ────────────────────────────────────────────
export default function StoryBuilder() {
  const router = useRouter();

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'done'>('intro');
  const [round, setRound] = useState(0);
  const [storyIndex, setStoryIndex] = useState(0);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [shuffledCards, setShuffledCards] = useState<(StoryCard & { origIdx: number })[]>([]);
  const [placedCards, setPlacedCards] = useState<(StoryCard & { origIdx: number })[]>([]);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [childId, setChildId] = useState<number>(0);
  const [roundStories, setRoundStories] = useState<Story[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Animations
  const slotAnims = useRef<Animated.Value[]>([]).current;
  const cardAnims = useRef<Animated.Value[]>([]).current;

  useEffect(() => {
    AsyncStorage.getItem('selectedChild').then((str) => {
      if (str) setChildId(JSON.parse(str).child_id);
    });
  }, []);

  const setupRound = (roundNum: number) => {
    const stories = pickRandom(ROUND_STORIES[roundNum], STORIES_PER_ROUND);
    setRoundStories(stories);
    loadStory(stories[0], roundNum);
  };

  const loadStory = (story: Story, _round?: number) => {
    setCurrentStory(story);
    const tagged = story.cards.map((c, i) => ({ ...c, origIdx: i }));
    const shuffled = shuffleArray(tagged);
    setShuffledCards(shuffled);
    setPlacedCards([]);
    setFeedback(null);
    setIsProcessing(false);

    // Reset animations
    slotAnims.length = 0;
    cardAnims.length = 0;
    for (let i = 0; i < story.cards.length; i++) {
      slotAnims.push(new Animated.Value(0));
      cardAnims.push(new Animated.Value(1));
    }
  };

  const startGame = () => {
    setGameState('playing');
    setRound(0);
    setStoryIndex(0);
    setCorrect(0);
    setTotal(0);
    setStartTime(Date.now());
    setupRound(0);
  };

  const handleCardTap = (card: StoryCard & { origIdx: number }, cardIdx: number) => {
    if (feedback || isProcessing) return;

    // Place card in next slot
    const newPlaced = [...placedCards, card];
    setPlacedCards(newPlaced);

    // Animate the card entering the slot
    if (slotAnims[newPlaced.length - 1]) {
      Animated.spring(slotAnims[newPlaced.length - 1], {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }

    // Fade out the tapped card
    if (cardAnims[cardIdx]) {
      Animated.timing(cardAnims[cardIdx], {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    // Remove from available cards
    const newShuffled = shuffledCards.filter((_, i) => i !== cardIdx);
    setShuffledCards(newShuffled);

    // Check if all cards placed
    if (newPlaced.length === currentStory!.cards.length) {
      setIsProcessing(true);
      // Check correctness
      const isCorrect = newPlaced.every((c, i) => c.origIdx === i);
      setTotal(t => t + 1);

      if (isCorrect) {
        setCorrect(c => c + 1);
        setFeedback('✅ Great story! Perfect order!');
      } else {
        setFeedback('❌ Not quite right. Keep trying!');
      }

      // Advance after delay
      setTimeout(() => {
        advanceStory();
      }, 1800);
    }
  };

  const advanceStory = () => {
    const nextStoryIdx = storyIndex + 1;

    if (nextStoryIdx < roundStories.length) {
      setStoryIndex(nextStoryIdx);
      loadStory(roundStories[nextStoryIdx]);
    } else if (round < 2) {
      const nextRound = round + 1;
      setRound(nextRound);
      setStoryIndex(0);
      setupRound(nextRound);
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
      gameId: 'story-builder',
      domain: 'comprehension',
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
      params: { gameId: 'story-builder', score: normalized, stars },
    });
  };

  const cardWidth = Math.min((width - 60) / (currentStory?.cards.length || 3) - 8, 100);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Story Builder"
        subtitle={gameState === 'playing'
          ? `Round ${round + 1}/3 · ${DIFF_NAMES[round]}`
          : undefined}
      />
      <View style={styles.container}>

        {gameState === 'intro' && (
          <View style={styles.introContainer}>
            <Text style={styles.introEmoji}>📖</Text>
            <Text style={styles.introTitle}>Story Builder</Text>
            <Text style={styles.introDesc}>
              Look at the pictures and tap them in the right order to build the story!
            </Text>
            <Text style={styles.introHint}>
              3 rounds · Stories get longer
            </Text>
            <View style={{ marginTop: 32, width: '100%' }}>
              <Button title="Start" onPress={startGame} />
            </View>
          </View>
        )}

        {gameState === 'playing' && currentStory && (
          <>
            {/* Story title */}
            <View style={styles.storyTitleBox}>
              <Text style={styles.storyTitleText}>📖 {currentStory.title}</Text>
              <Text style={styles.storySubtext}>
                Story {storyIndex + 1}/{STORIES_PER_ROUND}
              </Text>
            </View>

            {/* Placed cards strip (story so far) */}
            <View style={styles.placedStrip}>
              {currentStory.cards.map((_, i) => {
                const placed = placedCards[i];
                return (
                  <Animated.View
                    key={i}
                    style={[
                      styles.slot,
                      { width: cardWidth, height: cardWidth + 20 },
                      placed && {
                        backgroundColor: placed.origIdx === i ? '#E8F5E9' : '#FFF3E0',
                        borderColor: placed.origIdx === i ? '#66BB6A' : '#FFB74D',
                        transform: [{ scale: slotAnims[i] || new Animated.Value(1) }],
                      },
                    ]}
                  >
                    {placed ? (
                      <>
                        <Text style={[styles.slotEmoji, { fontSize: cardWidth * 0.35 }]}>
                          {placed.emoji}
                        </Text>
                        <Text style={styles.slotLabel} numberOfLines={2}>
                          {placed.label}
                        </Text>
                        <View style={styles.orderBadge}>
                          <Text style={styles.orderText}>{i + 1}</Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <Text style={[styles.slotPlaceholder, { fontSize: cardWidth * 0.25 }]}>
                          {i + 1}
                        </Text>
                        <Text style={styles.slotHint}>Tap a card</Text>
                      </>
                    )}
                  </Animated.View>
                );
              })}
            </View>

            {/* Arrow indicating flow */}
            <Text style={styles.arrowHint}>
              👆 Tap cards below in story order
            </Text>

            {/* Available cards to tap */}
            <View style={styles.availableCards}>
              {shuffledCards.map((card, i) => (
                <Pressable
                  key={`${card.origIdx}-${i}`}
                  onPress={() => handleCardTap(card, i)}
                  disabled={!!feedback || isProcessing}
                >
                  <Animated.View
                    style={[
                      styles.card,
                      {
                        width: cardWidth + 10,
                        height: cardWidth + 30,
                        opacity: cardAnims[i] || 1,
                      },
                    ]}
                  >
                    <Text style={[styles.cardEmoji, { fontSize: cardWidth * 0.4 }]}>
                      {card.emoji}
                    </Text>
                    <Text style={styles.cardLabel} numberOfLines={2}>
                      {card.label}
                    </Text>
                  </Animated.View>
                </Pressable>
              ))}
            </View>

            {/* Feedback */}
            {feedback && (
              <View style={styles.feedbackBox}>
                <Text style={styles.feedbackText}>{feedback}</Text>
              </View>
            )}

            {/* Score */}
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
  safeArea: { flex: 1, backgroundColor: '#FFF9F0' },
  container: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' },

  // Intro
  introContainer: { alignItems: 'center', paddingHorizontal: 24 },
  introEmoji: { fontSize: 64, marginBottom: 16 },
  introTitle: { fontSize: 32, fontWeight: '900', color: '#2D1B0E', marginBottom: 12 },
  introDesc: {
    fontSize: 17, color: '#8B7355', textAlign: 'center',
    lineHeight: 24, marginBottom: 8,
  },
  introHint: { fontSize: 14, color: '#B0A090', fontWeight: '600' },

  // Story title
  storyTitleBox: {
    backgroundColor: '#7C4DFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 18,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  storyTitleText: {
    fontSize: 20, fontWeight: '800', color: '#FFF',
  },
  storySubtext: {
    fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginTop: 4,
  },

  // Placed strip (story timeline)
  placedStrip: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    width: '100%',
  },
  slot: {
    backgroundColor: '#F5EDE3',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0D5C8',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  slotEmoji: { marginBottom: 4 },
  slotLabel: {
    fontSize: 10, fontWeight: '700', color: '#5D4E37',
    textAlign: 'center',
  },
  slotPlaceholder: {
    fontWeight: '900', color: '#D0C0B0',
  },
  slotHint: {
    fontSize: 9, color: '#C0B0A0', fontWeight: '600', marginTop: 4,
  },
  orderBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF7A00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderText: { fontSize: 12, fontWeight: '900', color: '#FFF' },

  // Arrow hint
  arrowHint: {
    fontSize: 15, fontWeight: '700', color: '#B0A090',
    marginBottom: 16, textAlign: 'center',
  },

  // Available cards
  availableCards: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    borderWidth: 2.5,
    borderColor: '#FF7A00',
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  cardEmoji: { marginBottom: 4 },
  cardLabel: {
    fontSize: 11, fontWeight: '700', color: '#5D4E37',
    textAlign: 'center',
  },

  // Feedback
  feedbackBox: {
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackText: {
    fontSize: 20, fontWeight: '800', color: '#FF7A00', textAlign: 'center',
  },

  // Score
  scoreText: {
    fontSize: 16, fontWeight: '700', color: '#8B7355',
  },
});

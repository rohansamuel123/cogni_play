import AsyncStorage from '@react-native-async-storage/async-storage';
import { CognitiveDomain, GAMES } from '../data/gameRegistry';
import API from '../services/api';

export interface GameSession {
  gameId: string;
  domain: CognitiveDomain;
  score: number;        // raw score (game-specific)
  maxScore: number;     // maximum possible raw score
  accuracy: number;     // 0-100
  timeTaken: number;    // seconds
  level: number;        // highest level reached
  stars: number;        // 1-3 stars earned
  playedAt: string;     // ISO date string
}

export interface DomainScore {
  domain: CognitiveDomain;
  score: number;        // 0-100 normalized
  gamesPlayed: number;
}

export interface CognitiveProfile {
  overallScore: number;
  domainScores: DomainScore[];
  totalGamesPlayed: number;
  totalStars: number;
  lastPlayedAt: string | null;
}

/**
 * Get the AsyncStorage key scoped to a specific child
 */
function getSessionsKey(childId: number): string {
  return `game_sessions_child_${childId}`;
}

function getUnlockedKey(childId: number): string {
  return `unlocked_games_child_${childId}`;
}

/**
 * Calculate star rating based on normalized score
 */
export function calculateStars(normalizedScore: number): number {
  if (normalizedScore >= 80) return 3;
  if (normalizedScore >= 50) return 2;
  return 1;
}

/**
 * Normalize a game's raw metrics into a 0-100 score
 */
export function normalizeScore(
  accuracy: number,
  timeTaken: number,
  level: number,
  maxLevel: number
): number {
  const accuracyWeight = 0.5;
  const levelWeight = 0.3;
  const speedWeight = 0.2;

  const accuracyScore = Math.min(100, accuracy);
  const levelScore = (level / maxLevel) * 100;
  // Speed bonus: faster = better. Cap at 60 seconds baseline.
  const speedScore = Math.max(0, 100 - (timeTaken / 60) * 100);

  return Math.round(
    accuracyScore * accuracyWeight +
    levelScore * levelWeight +
    speedScore * speedWeight
  );
}

/**
 * Save a game session to AsyncStorage (scoped to childId) and sync to backend
 */
export async function saveGameSession(childId: number, session: GameSession): Promise<void> {
  try {
    const key = getSessionsKey(childId);
    const existingStr = await AsyncStorage.getItem(key);
    const sessions: GameSession[] = existingStr ? JSON.parse(existingStr) : [];
    sessions.push(session);
    await AsyncStorage.setItem(key, JSON.stringify(sessions));

    // Sync to backend (fire and forget — don't block the game)
    syncSessionToBackend(childId, session).catch((e) =>
      console.warn('[Scoring] Backend sync failed (will retry later):', e.message)
    );
  } catch (e) {
    console.error('Failed to save game session:', e);
  }
}

/**
 * Sync a single session to the backend
 */
async function syncSessionToBackend(childId: number, session: GameSession): Promise<void> {
  await API.post(`/sessions/child/${childId}`, {
    game_key: session.gameId,
    domain: session.domain,
    score: session.score,
    max_score: session.maxScore,
    accuracy: session.accuracy,
    time_taken: session.timeTaken,
    level: session.level,
    stars: session.stars,
  });
}

/**
 * Load all sessions from backend and hydrate local storage
 */
export async function loadSessionsFromBackend(childId: number): Promise<void> {
  try {
    const res = await API.get(`/sessions/child/${childId}`);
    const backendSessions: any[] = res.data;

    const sessions: GameSession[] = backendSessions.map((s) => ({
      gameId: s.game_key,
      domain: s.domain as CognitiveDomain,
      score: s.score,
      maxScore: s.max_score,
      accuracy: s.accuracy,
      timeTaken: s.time_taken,
      level: s.level,
      stars: s.stars,
      playedAt: s.played_at,
    }));

    const key = getSessionsKey(childId);
    await AsyncStorage.setItem(key, JSON.stringify(sessions));
  } catch (e: any) {
    // 404 = no sessions yet, that's fine
    if (e.response?.status !== 404) {
      console.warn('[Scoring] Could not load sessions from backend:', e.message);
    }
  }
}

/**
 * Get all game sessions for a specific child
 */
export async function getGameSessions(childId: number): Promise<GameSession[]> {
  try {
    const key = getSessionsKey(childId);
    const str = await AsyncStorage.getItem(key);
    return str ? JSON.parse(str) : [];
  } catch (e) {
    console.error('Failed to load sessions:', e);
    return [];
  }
}

/**
 * Get the best session for a specific game
 */
export async function getBestSession(childId: number, gameId: string): Promise<GameSession | null> {
  const sessions = await getGameSessions(childId);
  const gameSessions = sessions.filter(s => s.gameId === gameId);
  if (gameSessions.length === 0) return null;
  return gameSessions.reduce((best, curr) =>
    normalizeScore(curr.accuracy, curr.timeTaken, curr.level, 3) >
    normalizeScore(best.accuracy, best.timeTaken, best.level, 3)
      ? curr : best
  );
}

/**
 * Build the full cognitive profile from all sessions for a child
 */
export async function getCognitiveProfile(childId: number): Promise<CognitiveProfile> {
  const sessions = await getGameSessions(childId);

  const domains: CognitiveDomain[] = ['memory', 'attention', 'logic', 'processing_speed', 'comprehension'];

  const domainScores: DomainScore[] = domains.map(domain => {
    const domainSessions = sessions.filter(s => s.domain === domain);
    if (domainSessions.length === 0) {
      return { domain, score: 0, gamesPlayed: 0 };
    }

    // Use best score per game, then average across games
    const gameIds = [...new Set(domainSessions.map(s => s.gameId))];
    const bestScores = gameIds.map(gameId => {
      const gameSessions = domainSessions.filter(s => s.gameId === gameId);
      const best = gameSessions.reduce((b, c) => {
        const bScore = normalizeScore(b.accuracy, b.timeTaken, b.level, 3);
        const cScore = normalizeScore(c.accuracy, c.timeTaken, c.level, 3);
        return cScore > bScore ? c : b;
      });
      return normalizeScore(best.accuracy, best.timeTaken, best.level, 3);
    });

    const avgScore = Math.round(bestScores.reduce((a, b) => a + b, 0) / bestScores.length);
    return { domain, score: avgScore, gamesPlayed: domainSessions.length };
  });

  const scoredDomains = domainScores.filter(d => d.gamesPlayed > 0);
  const overallScore = scoredDomains.length > 0
    ? Math.round(scoredDomains.reduce((a, b) => a + b.score, 0) / scoredDomains.length)
    : 0;

  const totalStars = sessions.reduce((sum, s) => sum + s.stars, 0);
  const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;

  return {
    overallScore,
    domainScores,
    totalGamesPlayed: sessions.length,
    totalStars,
    lastPlayedAt: lastSession?.playedAt || null,
  };
}

/**
 * Get number of unlocked games for a child (based on games completed)
 */
export async function getUnlockedGameCount(childId: number): Promise<number> {
  const sessions = await getGameSessions(childId);
  const completedGameIds = new Set(sessions.map(s => s.gameId));
  // Always unlock game 1, plus one more for each completed game
  return Math.min(GAMES.length, completedGameIds.size + 1);
}

/**
 * Check if a specific game is unlocked for a child
 */
export async function isGameUnlocked(childId: number, gameOrder: number): Promise<boolean> {
  const unlockedCount = await getUnlockedGameCount(childId);
  return gameOrder <= unlockedCount;
}

/**
 * Clear all game data for a specific child (used when deleting a child profile)
 */
export async function clearChildGameData(childId: number): Promise<void> {
  await AsyncStorage.removeItem(getSessionsKey(childId));
  await AsyncStorage.removeItem(getUnlockedKey(childId));
}

/**
 * Clear all game data (legacy — for testing)
 */
export async function clearAllGameData(): Promise<void> {
  // Get all keys and remove child-scoped ones
  const allKeys = await AsyncStorage.getAllKeys();
  const gameKeys = allKeys.filter(
    (k) => k.startsWith('game_sessions_child_') || k.startsWith('unlocked_games_child_')
  );
  if (gameKeys.length > 0) {
    await AsyncStorage.multiRemove(gameKeys);
  }
}

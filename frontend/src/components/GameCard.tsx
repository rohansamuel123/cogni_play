import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface GameCardProps {
  emoji: string;
  name: string;
  description: string;
  domainLabel: string;
  domainColor: string;
  stars: number;      // 0 = not played, 1-3 = earned stars
  locked: boolean;
  onPress: () => void;
}

export default function GameCard({
  emoji, name, description, domainLabel, domainColor, stars, locked, onPress,
}: GameCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: domainColor + '10', borderColor: domainColor + '30' },
        pressed && styles.cardPressed,
      ]}
    >
      {/* Left: Emoji */}
      <View style={[styles.emojiContainer, { backgroundColor: '#FFFFFF', shadowColor: domainColor }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>

      {/* Center: Info */}
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.description} numberOfLines={1}>
          {description}
        </Text>
        <View style={[styles.badge, { backgroundColor: domainColor + '20' }]}>
          <Text style={[styles.badgeText, { color: domainColor }]}>{domainLabel}</Text>
        </View>
      </View>

      {/* Right: Stars */}
      <View style={styles.starsContainer}>
        {[1, 2, 3].map(i => (
          <Text key={i} style={[styles.star, i <= stars ? styles.starEarned : styles.starEmpty]}>
            ★
          </Text>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 2,
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  emojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  emoji: {
    fontSize: 32,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D1B0E',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#8B7355',
    marginBottom: 8,
    fontWeight: '500',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  starsContainer: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  star: {
    fontSize: 20,
    marginLeft: 2,
  },
  starEarned: {
    color: '#FFB300',
    textShadowColor: '#FFB30050',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  starEmpty: {
    color: '#FFFFFF',
    textShadowColor: '#E0D5C8',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

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
  // Darker shade for the 3D bottom edge
  const darkerColor = domainColor + 'CC';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: domainColor + '10' },
        pressed && styles.containerPressed,
      ]}
    >
      {({ pressed }) => (
        <View style={[
          styles.cardBase,
          { backgroundColor: darkerColor },
          pressed && styles.cardPressed
        ]}>
          <View style={[
            styles.cardFace,
            { backgroundColor: '#FFFFFF', borderColor: domainColor },
            pressed && styles.facePressed
          ]}>
            {/* Left: Emoji */}
            <View style={[styles.emojiContainer, { backgroundColor: domainColor }]}>
              <Text style={styles.emoji}>{emoji}</Text>
            </View>

            {/* Center: Info */}
            <View style={styles.info}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.description} numberOfLines={1}>
                {description}
              </Text>
              <View style={[styles.badge, { backgroundColor: domainColor }]}>
                <Text style={styles.badgeText}>{domainLabel}</Text>
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
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 24,
  },
  containerPressed: {
  },
  cardBase: {
    borderRadius: 24,
    paddingBottom: 6, // 3D depth
  },
  cardFace: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 16,
    borderWidth: 2,
    marginTop: -6, // Offset to sit on top of the base
  },
  cardPressed: {
    paddingBottom: 0,
    marginTop: 6,
  },
  facePressed: {
    marginTop: 0,
  },
  emojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0,0,0,0.1)',
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
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: '#8B7355',
    marginBottom: 8,
    fontWeight: '600',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  starsContainer: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  star: {
    fontSize: 22,
    marginLeft: 2,
  },
  starEarned: {
    color: '#FFB300',
  },
  starEmpty: {
    color: '#E5E7EB',
  },
});

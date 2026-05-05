import React, { useState } from 'react';
import { StyleSheet, Text, Pressable, PressableProps, ViewStyle, TextStyle, View } from 'react-native';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({ title, variant = 'primary', style, textStyle, ...props }: ButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        styles.container,
        style,
      ]}
      {...props}
    >
      <View style={[
        styles.buttonBase,
        styles[`${variant}Base`],
        isPressed ? styles.buttonPressed : styles.buttonUnpressed,
      ]}>
        <View style={[
          styles.buttonInner,
          styles[`${variant}Inner`],
        ]}>
          <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>{title}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
  },
  buttonBase: {
    borderRadius: 30, // Pill shape
    width: '100%',
  },
  buttonUnpressed: {
    paddingBottom: 8, // This acts as the "3D" depth
  },
  buttonPressed: {
    paddingBottom: 0, // Button pushes down
    transform: [{ translateY: 8 }], // Visual push effect
  },
  buttonInner: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)', // Light top highlight
  },
  // Primary - Vibrant Orange
  primaryBase: {
    backgroundColor: '#D96500', // Darker bottom edge
  },
  primaryInner: {
    backgroundColor: '#FF8A00', // Brighter face
  },
  primaryText: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  // Secondary - Sunny Yellow
  secondaryBase: {
    backgroundColor: '#D9A500', // Darker bottom edge
  },
  secondaryInner: {
    backgroundColor: '#FFD166', // Brighter face
  },
  secondaryText: {
    color: '#8B5A2B',
  },
  // Outline
  outlineBase: {
    backgroundColor: '#FF8A00',
  },
  outlineInner: {
    backgroundColor: '#FFF9F0',
    borderColor: '#FF8A00',
    borderWidth: 3,
  },
  outlineText: {
    color: '#FF8A00',
  },
  text: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});

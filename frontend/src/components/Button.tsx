import React, { useState } from 'react';
import { StyleSheet, Text, Pressable, PressableProps, ViewStyle, TextStyle, View } from 'react-native';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({ title, variant = 'primary', style, textStyle, ...props }: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        style,
      ]}
      {...props}
    >
      {({ pressed }) => (
        <View style={[
          styles.buttonBase,
          styles[`${variant}Base`],
          pressed && styles.buttonPressed
        ]}>
          <View style={[
            styles.buttonFace,
            styles[`${variant}Face`],
            pressed && styles.facePressed
          ]}>
            <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>{title}</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
  },
  buttonBase: {
    borderRadius: 20,
    width: '100%',
    paddingBottom: 6, // The "depth" of the 3D button
  },
  buttonFace: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -6, // Offset to sit on top of the base
  },
  buttonPressed: {
    paddingBottom: 0,
    marginTop: 6,
  },
  facePressed: {
    marginTop: 0,
  },
  // Primary - Vibrant Orange
  primaryBase: {
    backgroundColor: '#E66E00', // Darker bottom edge
  },
  primaryFace: {
    backgroundColor: '#FF8A00', // Brighter face
  },
  primaryText: {
    color: '#FFFFFF',
  },
  // Secondary - Sunny Yellow
  secondaryBase: {
    backgroundColor: '#D9A500',
  },
  secondaryFace: {
    backgroundColor: '#FFD166',
  },
  secondaryText: {
    color: '#2D1B0E',
  },
  // Outline - Sleek Blue/White
  outlineBase: {
    backgroundColor: '#E5E7EB',
  },
  outlineFace: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  outlineText: {
    color: '#374151',
  },
  text: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

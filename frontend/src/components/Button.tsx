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
        styles[variant],
        pressed && styles.pressed,
        style,
      ]}
      {...props}
    >
      <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  primary: {
    backgroundColor: '#FF7A00',
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondary: {
    backgroundColor: '#FFD166',
    shadowColor: '#FFD166',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  secondaryText: {
    color: '#2D1B0E',
  },
  outline: {
    backgroundColor: '#FFF9F0',
    borderWidth: 2,
    borderColor: '#FF7A00',
    borderStyle: 'dashed', // Fun dashed border for outline
  },
  outlineText: {
    color: '#FF7A00',
  },
  text: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

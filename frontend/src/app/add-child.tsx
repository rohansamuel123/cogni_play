import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, SafeAreaView, Alert,
  ScrollView, Pressable, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/Header';
import Button from '../components/Button';
import API from '../services/api';

const AVATARS = ['🧒', '👧', '👦', '🐻', '🦁', '🐰', '🦊', '🐼', '🐸', '🦄', '🐱', '🐶'];
const GENDERS = ['Male', 'Female', 'Other'];

export default function AddChild() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [avatar, setAvatar] = useState('🧒');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', "Please enter your child's name.");
      return;
    }
    if (!age || isNaN(Number(age)) || Number(age) < 1 || Number(age) > 18) {
      Alert.alert('Error', 'Please enter a valid age (1-18).');
      return;
    }
    if (!gender) {
      Alert.alert('Error', 'Please select a gender.');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/children/', {
        name: name.trim(),
        age: Number(age),
        gender,
        avatar,
      });

      const child = response.data;

      // Set this child as the selected child
      await AsyncStorage.setItem('selectedChild', JSON.stringify(child));

      Alert.alert('Success', `${child.name}'s profile created!`, [
        { text: 'OK', onPress: () => router.replace('/cognitive-profile' as any) },
      ]);
    } catch (e: any) {
      console.error(e);
      const errMsg = e.response?.data?.detail || 'Could not create child profile.';
      Alert.alert('Error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Add Child" subtitle="Create a child profile" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>

            {/* Avatar Picker */}
            <View style={styles.card}>
              <Text style={styles.label}>Choose an Avatar</Text>
              <View style={styles.avatarGrid}>
                {AVATARS.map((emoji) => (
                  <Pressable
                    key={emoji}
                    style={[
                      styles.avatarOption,
                      avatar === emoji && styles.avatarSelected,
                    ]}
                    onPress={() => setAvatar(emoji)}
                  >
                    <Text style={styles.avatarEmoji}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Selected Preview */}
              <View style={styles.previewRow}>
                <View style={styles.previewAvatar}>
                  <Text style={styles.previewEmoji}>{avatar}</Text>
                </View>
                <Text style={styles.previewName}>{name || "Child's Name"}</Text>
              </View>
            </View>

            {/* Name */}
            <View style={styles.card}>
              <Text style={styles.label}>Child's Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter name"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Age */}
            <View style={styles.card}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter age"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                value={age}
                onChangeText={setAge}
                maxLength={2}
              />
            </View>

            {/* Gender */}
            <View style={styles.card}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                {GENDERS.map((g) => (
                  <Pressable
                    key={g}
                    style={[
                      styles.genderOption,
                      gender === g && styles.genderSelected,
                    ]}
                    onPress={() => setGender(g)}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        gender === g && styles.genderTextSelected,
                      ]}
                    >
                      {g}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Submit */}
            <View style={styles.actionContainer}>
              <Button
                title={loading ? 'Creating...' : 'Create Profile'}
                onPress={handleCreate}
                disabled={loading}
              />
              <View style={{ height: 12 }} />
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => router.back()}
              />
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF9F0' },
  flex: { flex: 1 },
  scrollContent: { padding: 20 },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#8B5A2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F5E6D3',
  },

  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF7A00',
    marginBottom: 12,
  },

  input: {
    backgroundColor: '#FFF9F0',
    borderWidth: 2,
    borderColor: '#FFE0B2',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },

  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  avatarOption: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFF9F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F0E6D9',
  },
  avatarSelected: {
    borderColor: '#FF7A00',
    backgroundColor: '#FFF3E0',
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarEmoji: { fontSize: 26 },

  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5E6D3',
  },
  previewAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFD180',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FF7A00',
    marginRight: 14,
  },
  previewEmoji: { fontSize: 28 },
  previewName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D1B0E',
  },

  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FFF9F0',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F0E6D9',
  },
  genderSelected: {
    borderColor: '#FF7A00',
    backgroundColor: '#FFF3E0',
  },
  genderText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8B7355',
  },
  genderTextSelected: {
    color: '#FF7A00',
  },

  actionContainer: {
    marginTop: 8,
  },
});

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
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  scrollContent: { padding: 20 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },

  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
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
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatarSelected: {
    borderColor: '#FF7A00',
    backgroundColor: '#FFF3E0',
  },
  avatarEmoji: { fontSize: 26 },

  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  previewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 14,
  },
  previewEmoji: { fontSize: 24 },
  previewName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  genderSelected: {
    borderColor: '#FF7A00',
    backgroundColor: '#FFF3E0',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  genderTextSelected: {
    color: '#FF7A00',
  },

  actionContainer: {
    marginTop: 8,
  },
});

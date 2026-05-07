import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../components/Button';
import API from '../services/api';

export default function Profile() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleCreateProfile = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    
    try {
      // 1. Send data to backend API
      const response = await API.post('/users/register', {
        name,
        email,
        password,
        age: 30, // Default for parent
        gender: "Other" // Default for parent
      });

      const { access_token, user } = response.data;
      
      // 2. Save token and current user session
      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));

      // 3. Keep local fallback for Quick Login UI
      const existingAccountsStr = await AsyncStorage.getItem('accounts');
      const accounts = existingAccountsStr ? JSON.parse(existingAccountsStr) : [];
      const newAccount = { id: user.user_id.toString(), name, email, password };
      
      // Prevent duplicates in Quick Login
      if (!accounts.some((a: any) => a.email === email)) {
        accounts.push(newAccount);
        await AsyncStorage.setItem('accounts', JSON.stringify(accounts));
      }
      
      Alert.alert("Success", "Profile created successfully!", [
        { text: "OK", onPress: () => router.replace('/dashboard' as any) }
      ]);
    } catch (e: any) {
      console.error(e);
      const errMsg = e.response?.data?.detail || "Could not save profile.";
      Alert.alert("Error", errMsg);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <Text style={styles.title}>Create Profile</Text>
            <Text style={styles.subtitle}>Set up a parent account to get started.</Text>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Parent Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Jane Doe"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="parent@example.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <View style={styles.actionContainer}>
              <Button title="Create Profile" onPress={handleCreateProfile} />
              <View style={{ height: 16 }} />
              <Button 
                title="Go Back" 
                variant="outline" 
                onPress={() => router.back()} 
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1 },
  inner: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 8, textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', fontWeight: '500', marginBottom: 32 },
  formContainer: { marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginLeft: 4 },
  input: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#111827',
  },
  actionContainer: { marginTop: 8 },
});

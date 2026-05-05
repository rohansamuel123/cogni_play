import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../components/Button';

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
      const existingAccountsStr = await AsyncStorage.getItem('accounts');
      const accounts = existingAccountsStr ? JSON.parse(existingAccountsStr) : [];
      
      const newAccount = { id: Date.now().toString(), name, email, password };
      accounts.push(newAccount);
      
      await AsyncStorage.setItem('accounts', JSON.stringify(accounts));
      // Log the user in immediately
      await AsyncStorage.setItem('currentUser', JSON.stringify(newAccount));
      
      Alert.alert("Success", "Profile created successfully!", [
        { text: "OK", onPress: () => router.replace('/dashboard') }
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not save profile.");
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
  safeArea: { flex: 1, backgroundColor: '#FFF9F0' },
  container: { flex: 1 },
  inner: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: '900', color: '#FF7A00', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#8B5A2B', textAlign: 'center', fontWeight: '500', marginBottom: 32 },
  formContainer: { marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '700', color: '#FF7A00', marginBottom: 8, marginLeft: 8 },
  input: {
    backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#FFE0B2', borderRadius: 24,
    paddingHorizontal: 20, paddingVertical: 16, fontSize: 16, color: '#333333',
    shadowColor: '#FF7A00', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  actionContainer: { marginTop: 8 },
});

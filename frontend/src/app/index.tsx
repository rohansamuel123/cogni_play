import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../components/Button';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [savedAccounts, setSavedAccounts] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userStr = await AsyncStorage.getItem('currentUser');
        if (userStr) {
          router.replace('/dashboard');
        }
        
        const accountsStr = await AsyncStorage.getItem('accounts');
        if (accountsStr) {
          setSavedAccounts(JSON.parse(accountsStr));
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async () => {
    if (email && password) {
      const account = savedAccounts.find(a => a.email.toLowerCase() === email.toLowerCase() && a.password === password);
      if (account) {
        await AsyncStorage.setItem('currentUser', JSON.stringify(account));
        router.replace('/dashboard');
      } else {
        Alert.alert("Error", "Invalid email or password. Please try again or create an account.");
      }
    } else {
      Alert.alert("Error", "Please enter both email and password.");
    }
  };

  const handleQuickLogin = async (account: any) => {
    await AsyncStorage.setItem('currentUser', JSON.stringify(account));
    router.replace('/dashboard');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
            <View style={styles.inner}>
              
              {/* Header Section */}
              <View style={styles.headerContainer}>
                {/* Mascot image removed */}
                <Text style={styles.title}>IntelliSight</Text>
                <Text style={styles.subtitle}>Let's play and learn together!</Text>
              </View>

              {/* Saved Profiles Section */}
              {savedAccounts.length > 0 && (
                <View style={styles.profilesSection}>
                  <Text style={styles.profilesTitle}>Quick Login</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.profilesScroll}>
                    {savedAccounts.map((acc, index) => (
                      <TouchableOpacity 
                        key={index} 
                        style={styles.profileCard}
                        onPress={() => handleQuickLogin(acc)}
                      >
                        <View style={styles.profileAvatar}>
                          <Text style={styles.profileInitial}>{acc.name.charAt(0).toUpperCase()}</Text>
                        </View>
                        <Text style={styles.profileName} numberOfLines={1}>{acc.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  
                  <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>OR LOGIN MANUALLY</Text>
                    <View style={styles.divider} />
                  </View>
                </View>
              )}

              {/* Form Section */}
              <View style={styles.formContainer}>
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

                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionContainer}>
                <Button title="Login" onPress={handleLogin} />
                
                {savedAccounts.length === 0 && (
                  <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.divider} />
                  </View>
                )}
                
                <View style={{ marginTop: savedAccounts.length > 0 ? 16 : 0 }}>
                  <Button 
                    title="Create Profile" 
                    variant="secondary" 
                    onPress={() => router.push('/profile')} 
                  />
                </View>
              </View>

            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF9F0', // Soft, warm cream background
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 40, // Slightly bigger since mascot is gone
    fontWeight: '900',
    color: '#FF7A00', // Vibrant orange
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8B5A2B', // Warm brown/gray
    textAlign: 'center',
    fontWeight: '500',
  },
  profilesSection: {
    marginBottom: 16,
  },
  profilesTitle: {
    fontSize: 18, // Bigger title
    fontWeight: '800',
    color: '#FF7A00',
    marginBottom: 16, // More spacing
    marginLeft: 8,
  },
  profilesScroll: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 8, // Room for shadow
  },
  profileCard: {
    alignItems: 'center',
    marginRight: 20, // More spacing
    width: 90, // Wider card
  },
  profileAvatar: {
    width: 80, // Bigger avatar
    height: 80, // Bigger avatar
    borderRadius: 40, // Circular
    backgroundColor: '#FFD180',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4, // Thicker border
    borderColor: '#FF7A00',
    marginBottom: 12, // More space
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  profileInitial: {
    fontSize: 36, // Bigger initial
    fontWeight: '900',
    color: '#FFF',
  },
  profileName: {
    fontSize: 15, // Bigger name
    fontWeight: '800', // Bolder name
    color: '#8B5A2B',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF7A00',
    marginBottom: 8,
    marginLeft: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FFE0B2',
    borderRadius: 24, // High border radius for soft look
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333333',
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  forgotPassword: {
    color: '#FF7A00',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: -8,
    marginRight: 4,
  },
  actionContainer: {
    marginTop: 8,
    marginBottom: 32,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    height: 2,
    backgroundColor: '#FFE0B2',
    borderRadius: 2,
  },
  dividerText: {
    color: '#FFB74D',
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: '800',
  },
});

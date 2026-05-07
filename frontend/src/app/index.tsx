import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../components/Button';
import API from '../services/api';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [savedAccounts, setSavedAccounts] = useState<any[]>([]);

  // Google Auth Setup
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || 'your-android-client-id',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'your-ios-client-id',
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'your-web-client-id',
  });

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type === 'success') {
        const { id_token } = response.params;
        if (id_token) {
          try {
            const res = await API.post('/users/google', { id_token });
            const { access_token, user } = res.data;

            await AsyncStorage.setItem('token', access_token);
            await AsyncStorage.setItem('currentUser', JSON.stringify(user));
            
            router.replace('/dashboard' as any);
          } catch (e: any) {
            console.error(e);
            Alert.alert("Google Login Failed", "Could not authenticate with backend.");
          }
        }
      }
    };
    handleGoogleResponse();
  }, [response]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userStr = await AsyncStorage.getItem('currentUser');
        if (userStr) {
          router.replace('/dashboard' as any);
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
      try {
        const response = await API.post('/users/login', { email, password });
        const { access_token, user } = response.data;

        await AsyncStorage.setItem('token', access_token);
        await AsyncStorage.setItem('currentUser', JSON.stringify(user));

        // Save to Quick Login if not exists
        const existingAccountsStr = await AsyncStorage.getItem('accounts');
        const accounts = existingAccountsStr ? JSON.parse(existingAccountsStr) : [];
        if (!accounts.some((a: any) => a.email.toLowerCase() === email.toLowerCase())) {
          accounts.push({ id: user.user_id.toString(), name: user.name, email, password });
          await AsyncStorage.setItem('accounts', JSON.stringify(accounts));
        }

        router.replace('/dashboard' as any);
      } catch (e: any) {
        console.error(e);
        const errMsg = e.response?.data?.detail || "Invalid email or password.";
        Alert.alert("Error", errMsg);
      }
    } else {
      Alert.alert("Error", "Please enter both email and password.");
    }
  };

  const handleQuickLogin = async (account: any) => {
    try {
      const response = await API.post('/users/login', { email: account.email, password: account.password });
      const { access_token, user } = response.data;

      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));
      
      router.replace('/dashboard' as any);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Session Expired", "Please login manually.");
    }
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
                    title="Continue with Google" 
                    variant="secondary" 
                    onPress={() => promptAsync()} 
                    disabled={!request}
                  />
                </View>
                
                <View style={{ marginTop: 16 }}>
                  <Button 
                    title="Create Profile" 
                    variant="secondary" 
                    onPress={() => router.push('/profile' as any)} 
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
    backgroundColor: '#FFFFFF', // Clean white background
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
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827', // Sleek dark gray instead of orange
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280', // Sleek gray
    textAlign: 'center',
    fontWeight: '500',
  },
  profilesSection: {
    marginBottom: 24,
  },
  profilesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profilesScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  profileCard: {
    alignItems: 'center',
    marginRight: 20,
    width: 80,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#374151',
  },
  profileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
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
  forgotPassword: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'right',
    marginTop: -8,
  },
  actionContainer: {
    marginTop: 8,
    marginBottom: 32,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    color: '#9CA3AF',
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
});

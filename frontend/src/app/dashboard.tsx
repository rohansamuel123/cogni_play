import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../components/Button';

export default function Dashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      const userStr = await AsyncStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.name);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('currentUser');
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome back,</Text>
        <Text style={styles.name}>{userName || 'Parent'}</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>IntelliSight Dashboard</Text>
          <Text style={styles.cardText}>This is your parent dashboard where you can manage settings.</Text>
        </View>

        <Button title="Logout" onPress={handleLogout} variant="outline" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    color: '#8B5A2B',
    fontWeight: '600',
  },
  name: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FF7A00',
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFE0B2',
    marginBottom: 32,
    shadowColor: '#FF7A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
  },
});

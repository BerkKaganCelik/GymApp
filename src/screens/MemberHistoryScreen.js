import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const MemberHistoryScreen = ({ navigation }) => {
  // 1. Hook'lar EN ÜSTTE ve KOŞULSUZ olarak tanımlanmalı
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('workout'); // 'workout' veya 'entry'

  // Auth hook değil, normal bir fonksiyondur, burası güvenli.
  const user = auth().currentUser;

  // 2. useEffect de EN ÜST SEVİYEDE olmalı
  useEffect(() => {
    let unsubscribe;
    setLoading(true);

    if (tab === 'workout') {
      // 1. ANTRENMAN GEÇMİŞİNİ CANLI DİNLE
      unsubscribe = firestore()
        .collection('workout_history')
        .where('userId', '==', user.uid)
        .orderBy('date', 'desc')
        .onSnapshot(
          querySnapshot => {
            const workoutList = [];
            if (querySnapshot) {
              querySnapshot.forEach(doc => {
                workoutList.push({
                  ...doc.data(),
                  key: doc.id,
                  type: 'workout',
                  dateObj: doc.data().date?.toDate(),
                });
              });
            }
            setLogs(workoutList);
            setLoading(false);
          },
          error => {
            console.error('Antrenman geçmişi hatası:', error);
            setLoading(false);
          },
        );
    } else {
      // 2. GİRİŞ LOGLARINI CANLI DİNLE
      unsubscribe = firestore()
        .collection('entry_logs')
        .where('uid', '==', user.uid)
        .orderBy('timestamp', 'desc')
        .onSnapshot(
          querySnapshot => {
            const entryList = [];
            if (querySnapshot) {
              querySnapshot.forEach(doc => {
                entryList.push({
                  ...doc.data(),
                  key: doc.id,
                  type: 'entry',
                  dateObj: doc.data().timestamp?.toDate(),
                });
              });
            }
            setLogs(entryList);
            setLoading(false);
          },
          error => {
            console.error('Giriş logları hatası:', error);
            setLoading(false);
          },
        );
    }

    // Temizlik
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, tab]); // user ve tab değişince çalışır

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FF8C00" size="large" />
      </View>
    );

  const formatDate = dateObj => {
    if (!dateObj) return '-';
    try {
      return (
        dateObj.toLocaleDateString('tr-TR') +
        ' ' +
        dateObj.toLocaleTimeString('tr-TR').slice(0, 5)
      );
    } catch (e) {
      return 'Tarih Hatası';
    }
  };

  const renderItem = ({ item }) => {
    if (item.type === 'workout') {
      return (
        <TouchableOpacity
          style={[styles.card, styles.workoutCard]}
          onPress={() =>
            navigation.navigate('WorkoutDetail', {
              workoutLog: item.detailedLog || [],
              date: formatDate(item.dateObj),
            })
          }
        >
          <View style={styles.iconBox}>
            <Text style={{ fontSize: 20 }}>🔥</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.dateText}>{formatDate(item.dateObj)}</Text>
            <Text style={styles.workoutText}>{item.programName}</Text>
            <Text style={styles.detailText}>
              {item.totalSetsDone} Set Tamamlandı
              {item.totalWeightLifted ? ` | ${item.totalWeightLifted} kg` : ''}
            </Text>
          </View>
          <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>Detay ➡️</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={[styles.card, styles.entryCard]}>
        <View style={styles.iconBox}>
          <Text style={{ fontSize: 20 }}>🚪</Text>
        </View>
        <View>
          <Text style={styles.dateText}>{formatDate(item.dateObj)}</Text>
          <Text style={styles.workoutText}>Salona Giriş</Text>
        </View>
        <Text style={{ color: '#4CD964', marginLeft: 'auto' }}>✅</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <Text style={styles.header}>GEÇMİŞİM 📜</Text>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'workout' && styles.activeTab]}
          onPress={() => setTab('workout')}
        >
          <Text style={styles.tabText}>Antrenmanlar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'entry' && styles.activeTab]}
          onPress={() => setTab('entry')}
        >
          <Text style={styles.tabText}>Giriş Kayıtları</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={logs}
        keyExtractor={item => item.key}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={{ color: '#666', textAlign: 'center', marginTop: 50 }}>
            Henüz {tab === 'workout' ? 'antrenman' : 'giriş'} kaydınız yok.
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  center: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 5,
  },
  tabButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: { backgroundColor: '#333' },
  tabText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  workoutCard: { borderLeftColor: '#FF8C00' },
  entryCard: { borderLeftColor: '#4CD964' },
  iconBox: {
    width: 40,
    height: 40,
    backgroundColor: '#333',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  dateText: { color: '#888', fontSize: 12 },
  workoutText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  detailText: { color: '#FF8C00', fontSize: 11, marginTop: 3 },
});

export default MemberHistoryScreen;

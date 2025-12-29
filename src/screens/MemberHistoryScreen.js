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

// 🔥 ADIM 1: Tema Hook'unu İmport Et
import { useTheme } from '../context/ThemeContext';

const MemberHistoryScreen = ({ navigation }) => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, t, isDark } = useTheme();

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
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.primary} size="large" />
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
          style={[
            styles.card,
            styles.workoutCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          onPress={() =>
            navigation.navigate('WorkoutDetail', {
              workoutLog: item.detailedLog || [],
              date: formatDate(item.dateObj),
            })
          }
        >
          <View style={[styles.iconBox, { backgroundColor: theme.inputBg }]}>
            <Text style={{ fontSize: 20 }}>🔥</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.dateText, { color: theme.subText }]}>
              {formatDate(item.dateObj)}
            </Text>
            <Text style={[styles.workoutText, { color: theme.text }]}>
              {item.programName}
            </Text>
            <Text style={[styles.detailText, { color: theme.primary }]}>
              {item.totalSetsDone} {t.setsDone || 'Set Tamamlandı'}
              {item.totalWeightLifted ? ` | ${item.totalWeightLifted} kg` : ''}
            </Text>
          </View>
          <Text style={{ color: theme.primary, fontWeight: 'bold' }}>
            {t.details || 'Detay'} ➡️
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View
        style={[
          styles.card,
          styles.entryCard,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <View style={[styles.iconBox, { backgroundColor: theme.inputBg }]}>
          <Text style={{ fontSize: 20 }}>🚪</Text>
        </View>
        <View>
          <Text style={[styles.dateText, { color: theme.subText }]}>
            {formatDate(item.dateObj)}
          </Text>
          <Text style={[styles.workoutText, { color: theme.text }]}>
            {t.gymEntry || 'Salona Giriş'}
          </Text>
        </View>
        <Text style={{ color: theme.success, marginLeft: 'auto' }}>✅</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      {/* Başlık Dinamik */}
      <Text style={[styles.header, { color: theme.text }]}>
        {t.history || 'GEÇMİŞİM'} 📜
      </Text>

      <View style={[styles.tabs, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            tab === 'workout' && { backgroundColor: theme.inputBg },
          ]}
          onPress={() => setTab('workout')}
        >
          <Text style={[styles.tabText, { color: theme.text }]}>
            {t.workouts || 'Antrenmanlar'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            tab === 'entry' && { backgroundColor: theme.inputBg },
          ]}
          onPress={() => setTab('entry')}
        >
          <Text style={[styles.tabText, { color: theme.text }]}>
            {t.entryLogs || 'Giriş Kayıtları'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={logs}
        keyExtractor={item => item.key}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text
            style={{ color: theme.subText, textAlign: 'center', marginTop: 50 }}
          >
            {tab === 'workout'
              ? t.noWorkouts || 'Henüz antrenman kaydınız yok.'
              : t.noEntries || 'Henüz giriş kaydınız yok.'}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 10,
    padding: 5,
  },
  tabButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabText: { fontWeight: 'bold', fontSize: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
  },
  workoutCard: { borderLeftColor: '#FF8C00' }, // Sabit renk kalabilir veya theme.primary
  entryCard: { borderLeftColor: '#4CD964' }, // Sabit renk kalabilir veya theme.success
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  dateText: { fontSize: 12 },
  workoutText: { fontWeight: 'bold', fontSize: 16 },
  detailText: { fontSize: 11, marginTop: 3 },
});

export default MemberHistoryScreen;

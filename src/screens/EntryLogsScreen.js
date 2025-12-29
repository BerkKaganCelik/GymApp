import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

// 🔥 ADIM 1: Tema Hook'unu İmport Et
import { useTheme } from '../context/ThemeContext';

const EntryLogsScreen = () => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, t, isDark } = useTheme();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscriber = firestore()
      .collection('entry_logs')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .onSnapshot(querySnapshot => {
        const logData = [];
        querySnapshot.forEach(doc => {
          logData.push({
            ...doc.data(),
            key: doc.id,
          });
        });
        setLogs(logData);
        setLoading(false);
      });

    return () => subscriber();
  }, []);

  const formatDate = timestamp => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleString('tr-TR');
  };

  if (loading)
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      <View style={styles.header}>
        {/* Başlık Dinamik */}
        <Text style={[styles.title, { color: theme.text }]}>
          {t.entryLogs || 'GİRİŞ GEÇMİŞİ'} 🕒
        </Text>
        <Text style={[styles.subtitle, { color: theme.subText }]}>
          {t.entryLogsSub || 'Son Hareketler'}
        </Text>
      </View>

      <FlatList
        data={logs}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.logCard,
              { backgroundColor: theme.card, borderLeftColor: theme.success },
            ]}
          >
            <View style={styles.iconBox}>
              <Text style={{ fontSize: 20 }}>✅</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: theme.text }]}>
                {item.fullName}
              </Text>
              <Text style={[styles.email, { color: theme.subText }]}>
                {item.email}
              </Text>
            </View>
            <Text style={[styles.date, { color: theme.primary }]}>
              {formatDate(item.timestamp)}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.subText }]}>
            Henüz giriş kaydı yok.
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { marginBottom: 20, marginTop: 10 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { marginTop: 5 },
  logCard: {
    flexDirection: 'row',
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderLeftWidth: 3,
  },
  iconBox: { marginRight: 15, opacity: 0.8 },
  name: { fontWeight: 'bold', fontSize: 16 },
  email: { fontSize: 12 },
  date: {
    fontSize: 12,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  emptyText: { textAlign: 'center', marginTop: 50 },
});

export default EntryLogsScreen;

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

const EntryLogsScreen = () => {
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
      <View style={styles.container}>
        <ActivityIndicator color="#FF8C00" size="large" />
      </View>
    );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <View style={styles.header}>
        <Text style={styles.title}>GİRİŞ GEÇMİŞİ 🕒</Text>
        <Text style={styles.subtitle}>Son Hareketler</Text>
      </View>

      <FlatList
        data={logs}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.logCard}>
            <View style={styles.iconBox}>
              <Text style={{ fontSize: 20 }}>✅</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.fullName}</Text>
              <Text style={styles.email}>{item.email}</Text>
            </View>
            <Text style={styles.date}>{formatDate(item.timestamp)}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Henüz giriş kaydı yok.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  header: { marginBottom: 20, marginTop: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  subtitle: { color: '#666', marginTop: 5 },
  logCard: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#4CD964',
  },
  iconBox: { marginRight: 15, opacity: 0.8 },
  name: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  email: { color: '#888', fontSize: 12 },
  date: {
    color: '#FF8C00',
    fontSize: 12,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 50 },
});

export default EntryLogsScreen;

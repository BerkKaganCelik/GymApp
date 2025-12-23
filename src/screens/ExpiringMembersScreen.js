import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

const ExpiringMembersScreen = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('expiring');
  const [broadcastMsg, setBroadcastMsg] = useState('');

  useEffect(() => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const sub = firestore()
      .collection('users')
      .where('role', '==', 'member')
      .where('membershipEnd', '>=', today)
      .where('membershipEnd', '<=', nextWeek)
      .onSnapshot(snap => {
        const list = [];
        if (snap)
          snap.forEach(d =>
            list.push({
              ...d.data(),
              key: d.id,
              endDate: d.data().membershipEnd.toDate(),
            }),
          );
        list.sort((a, b) => a.endDate - b.endDate);
        setMembers(list);
        setLoading(false);
      });
    return () => sub();
  }, []);

  // --- DÜZELTİLEN FONKSİYON ---
  const sendNotification = async item => {
    try {
      await firestore()
        .collection('notifications')
        .add({
          targetUser: item.key, // Üyenin ID'si
          title: 'Süre Uyarısı ⚠️',
          message: `Sayın ${
            item.fullName
          }, üyeliğinizin süresi ${item.endDate.toLocaleDateString()} tarihinde dolacaktır.`,
          createdAt: firestore.FieldValue.serverTimestamp(),
          read: false,
        });
      Alert.alert('Gönderildi', 'Üyeye bildirim düştü.');
    } catch (e) {
      Alert.alert('Hata', e.message);
    }
  };

  const sendBroadcast = async () => {
    if (!broadcastMsg) return;
    const usersSnap = await firestore()
      .collection('users')
      .where('role', '==', 'member')
      .get();
    const batch = firestore().batch();

    usersSnap.forEach(doc => {
      const ref = firestore().collection('notifications').doc();
      batch.set(ref, {
        targetUser: doc.id,
        title: 'GENEL DUYURU 📢',
        message: broadcastMsg,
        createdAt: firestore.FieldValue.serverTimestamp(),
        read: false,
      });
    });
    await batch.commit();
    Alert.alert('Başarılı', `${usersSnap.size} üyeye gönderildi.`);
    setBroadcastMsg('');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'expiring' && styles.activeTab]}
          onPress={() => setTab('expiring')}
        >
          <Text style={styles.tabText}>⚠️ Süresi Bitenler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'broadcast' && styles.activeTab]}
          onPress={() => setTab('broadcast')}
        >
          <Text style={styles.tabText}>📢 Genel Duyuru</Text>
        </TouchableOpacity>
      </View>

      {tab === 'expiring' ? (
        loading ? (
          <ActivityIndicator color="#FF8C00" />
        ) : (
          <FlatList
            data={members}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View>
                  <Text style={styles.name}>{item.fullName}</Text>
                  <Text style={styles.date}>
                    {item.endDate.toLocaleDateString('tr-TR')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => sendNotification(item)}
                  style={styles.bell}
                >
                  <Text>🔔</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>Riskli üye yok.</Text>
            }
          />
        )
      ) : (
        <View style={styles.broadcastBox}>
          <Text style={styles.label}>Tüm Üyelere Mesaj Gönder</Text>
          <TextInput
            style={styles.input}
            placeholder="Duyurunuz..."
            placeholderTextColor="#666"
            multiline
            value={broadcastMsg}
            onChangeText={setBroadcastMsg}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendBroadcast}>
            <Text style={styles.sendText}>HERKESE GÖNDER 🚀</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 5,
  },
  tab: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#333' },
  tabText: { color: 'white', fontWeight: 'bold' },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
    alignItems: 'center',
  },
  name: { color: 'white', fontWeight: 'bold' },
  date: { color: '#888', fontSize: 12 },
  bell: { backgroundColor: '#333', padding: 10, borderRadius: 20 },
  empty: { color: '#666', textAlign: 'center', marginTop: 50 },
  broadcastBox: { flex: 1 },
  label: { color: 'white', marginBottom: 10, fontWeight: 'bold' },
  input: {
    backgroundColor: '#1E1E1E',
    color: 'white',
    padding: 15,
    borderRadius: 10,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  sendBtn: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  sendText: { color: 'white', fontWeight: 'bold' },
});
export default ExpiringMembersScreen;

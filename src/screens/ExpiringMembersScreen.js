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

// 🔥 ADIM 1: Tema Hook'unu İmport Et
import { useTheme } from '../context/ThemeContext';

const ExpiringMembersScreen = () => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, t, isDark } = useTheme();

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
          targetUser: item.key,
          title: t.expiryWarning || 'Süre Uyarısı ⚠️', // Çeviri
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
        title: t.generalAnnouncement || 'GENEL DUYURU 📢', // Çeviri
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
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      <View style={[styles.tabs, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            tab === 'expiring' && { backgroundColor: theme.inputBg },
          ]}
          onPress={() => setTab('expiring')}
        >
          <Text style={[styles.tabText, { color: theme.text }]}>
            ⚠️ {t.expiringMembers || 'Süresi Bitenler'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            tab === 'broadcast' && { backgroundColor: theme.inputBg },
          ]}
          onPress={() => setTab('broadcast')}
        >
          <Text style={[styles.tabText, { color: theme.text }]}>
            📢 {t.broadcast || 'Genel Duyuru'}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'expiring' ? (
        loading ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          <FlatList
            data={members}
            renderItem={({ item }) => (
              <View style={[styles.card, { backgroundColor: theme.card }]}>
                <View>
                  <Text style={[styles.name, { color: theme.text }]}>
                    {item.fullName}
                  </Text>
                  <Text style={[styles.date, { color: theme.subText }]}>
                    {item.endDate.toLocaleDateString('tr-TR')}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => sendNotification(item)}
                  style={[styles.bell, { backgroundColor: theme.inputBg }]}
                >
                  <Text>🔔</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: theme.subText }]}>
                {t.noExpiringMembers || 'Riskli üye yok.'}
              </Text>
            }
          />
        )
      ) : (
        <View style={styles.broadcastBox}>
          <Text style={[styles.label, { color: theme.text }]}>
            {t.sendToAll || 'Tüm Üyelere Mesaj Gönder'}
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.card, color: theme.text },
            ]}
            placeholder={t.announcementPlaceholder || 'Duyurunuz...'}
            placeholderTextColor={theme.subText}
            multiline
            value={broadcastMsg}
            onChangeText={setBroadcastMsg}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: theme.primary }]}
            onPress={sendBroadcast}
          >
            <Text style={styles.sendText}>
              {t.sendBroadcast || 'HERKESE GÖNDER 🚀'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 10,
    padding: 5,
  },
  tab: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8 },
  tabText: { fontWeight: 'bold' },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30', // Kırmızı sabit kalabilir, uyarı rengi
    alignItems: 'center',
  },
  name: { fontWeight: 'bold' },
  date: { fontSize: 12 },
  bell: { padding: 10, borderRadius: 20 },
  empty: { textAlign: 'center', marginTop: 50 },
  broadcastBox: { flex: 1 },
  label: { marginBottom: 10, fontWeight: 'bold' },
  input: {
    padding: 15,
    borderRadius: 10,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  sendBtn: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  sendText: { color: 'white', fontWeight: 'bold' },
});

export default ExpiringMembersScreen;

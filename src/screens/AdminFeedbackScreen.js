import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

const AdminFeedbackScreen = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // MemberScreen 'feedback' koleksiyonuna yazıyor, biz de orayı dinliyoruz.
    const subscriber = firestore()
      .collection('feedback')
      .orderBy('createdAt', 'desc') // En yeniler en üstte
      .onSnapshot(
        querySnapshot => {
          const msgs = [];
          if (querySnapshot) {
            querySnapshot.forEach(documentSnapshot => {
              msgs.push({
                ...documentSnapshot.data(),
                key: documentSnapshot.id,
              });
            });
          }
          setMessages(msgs);
          setLoading(false);
        },
        error => {
          console.error(error);
          setLoading(false);
        },
      );

    // Unmount olduğunda dinlemeyi durdur
    return () => subscriber();
  }, []);

  // --- İŞLEMLER ---

  const handleMarkAsRead = (id, currentStatus) => {
    // Okundu/Okunmadı durumunu değiştir
    firestore().collection('feedback').doc(id).update({
      isRead: !currentStatus,
    });
  };

  const handleDelete = id => {
    Alert.alert(
      'Mesajı Sil',
      'Bu mesajı kalıcı olarak silmek istiyor musunuz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => firestore().collection('feedback').doc(id).delete(),
        },
      ],
    );
  };

  // --- LİSTE ELEMANI ---
  const renderItem = ({ item }) => {
    return (
      <View style={[styles.card, item.isRead && styles.cardRead]}>
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.avatar}>👤</Text>
            <View>
              <Text style={styles.userName}>{item.userName}</Text>
              <Text style={styles.userPhone}>
                {item.userPhone || 'Telefon Yok'}
              </Text>
            </View>
          </View>

          {/* Tarih */}
          <Text style={styles.dateText}>
            {item.createdAt
              ? item.createdAt.toDate().toLocaleDateString('tr-TR')
              : 'Tarih Yok'}
          </Text>
        </View>

        <View style={styles.messageBox}>
          <Text style={[styles.messageText, item.isRead && styles.textRead]}>
            {item.message}
          </Text>
        </View>

        {/* Alt Butonlar */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              item.isRead ? styles.btnUnread : styles.btnRead,
            ]}
            onPress={() => handleMarkAsRead(item.key, item.isRead)}
          >
            <Text style={styles.btnText}>
              {item.isRead ? '✉️ Okunmadı Yap' : '✅ Okundu İşaretle'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(item.key)}
          >
            <Text style={styles.deleteText}>🗑️ Sil</Text>
          </TouchableOpacity>
        </View>

        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E67E22" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gelen Kutusu 📥</Text>
        <Text style={styles.headerSub}>
          {messages.filter(m => !m.isRead).length} Okunmamış Mesaj
        </Text>
      </View>

      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={item => item.key}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 40 }}>📭</Text>
            <Text style={styles.emptyText}>Gelen kutusu boş.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    padding: 20,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  headerSub: {
    color: '#E67E22',
    fontSize: 14,
    marginTop: 5,
    fontWeight: '600',
  },

  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#666', marginTop: 10, fontSize: 16 },

  // KART STİLLERİ
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#E67E22', // Okunmamış rengi (Turuncu)
    elevation: 2,
  },
  cardRead: {
    backgroundColor: '#181818', // Okunmuş kart daha koyu
    borderLeftColor: '#444', // Okunmuş rengi (Gri)
    opacity: 0.8,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { fontSize: 24, marginRight: 10 },
  userName: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  userPhone: { color: '#888', fontSize: 12 },
  dateText: { color: '#666', fontSize: 12 },

  messageBox: {
    backgroundColor: '#252525',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  messageText: { color: '#FFF', fontSize: 15, lineHeight: 22 },
  textRead: { color: '#AAA' },

  actionRow: { flexDirection: 'row', justifyContent: 'flex-end' },

  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 10,
  },
  btnRead: { backgroundColor: 'rgba(46, 204, 113, 0.2)' }, // Yeşil transparan
  btnUnread: { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  btnText: { color: '#2ECC71', fontWeight: 'bold', fontSize: 12 },

  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
  },
  deleteText: { color: '#E74C3C', fontWeight: 'bold', fontSize: 12 },

  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E67E22',
  },
});

export default AdminFeedbackScreen;

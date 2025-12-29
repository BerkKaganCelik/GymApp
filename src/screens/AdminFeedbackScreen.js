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

// 🔥 ADIM 1: Tema Hook'unu İmport Et
import { useTheme } from '../context/ThemeContext';

const AdminFeedbackScreen = () => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, t, isDark } = useTheme();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscriber = firestore()
      .collection('feedback')
      .orderBy('createdAt', 'desc')
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

    return () => subscriber();
  }, []);

  const handleMarkAsRead = (id, currentStatus) => {
    firestore().collection('feedback').doc(id).update({
      isRead: !currentStatus,
    });
  };

  const handleDelete = id => {
    Alert.alert(
      'Mesajı Sil', // İstersen t.deleteConfirmTitle yapabilirsin
      'Bu mesajı kalıcı olarak silmek istiyor musunuz?',
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => firestore().collection('feedback').doc(id).delete(),
        },
      ],
    );
  };

  const renderItem = ({ item }) => {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.border }, // 🔥 Dinamik Arkaplan
          item.isRead && { opacity: 0.6, backgroundColor: theme.bg }, // Okunmuşsa daha soluk
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.avatar}>👤</Text>
            <View>
              <Text style={[styles.userName, { color: theme.text }]}>
                {item.userName}
              </Text>
              <Text style={[styles.userPhone, { color: theme.subText }]}>
                {item.userPhone || 'Telefon Yok'}
              </Text>
            </View>
          </View>

          <Text style={[styles.dateText, { color: theme.subText }]}>
            {item.createdAt
              ? item.createdAt.toDate().toLocaleDateString('tr-TR')
              : '-'}
          </Text>
        </View>

        <View style={[styles.messageBox, { backgroundColor: theme.inputBg }]}>
          <Text style={[styles.messageText, { color: theme.text }]}>
            {item.message}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              item.isRead
                ? { backgroundColor: theme.inputBg }
                : { backgroundColor: 'rgba(46, 204, 113, 0.2)' },
            ]}
            onPress={() => handleMarkAsRead(item.key, item.isRead)}
          >
            <Text
              style={[
                styles.btnText,
                { color: item.isRead ? theme.subText : theme.success },
              ]}
            >
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

        {!item.isRead && (
          <View
            style={[styles.unreadDot, { backgroundColor: theme.primary }]}
          />
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      <View
        style={[
          styles.header,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t.inbox || 'Gelen Kutusu'} 📥
        </Text>
        <Text style={[styles.headerSub, { color: theme.primary }]}>
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
            <Text style={[styles.emptyText, { color: theme.subText }]}>
              Gelen kutusu boş.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  headerSub: {
    fontSize: 14,
    marginTop: 5,
    fontWeight: '600',
  },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 10, fontSize: 16 },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF8C00', // Sabit kalabilir veya theme.primary
    elevation: 2,
    borderWidth: 1, // Hafif çerçeve
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { fontSize: 24, marginRight: 10 },
  userName: { fontWeight: 'bold', fontSize: 16 },
  userPhone: { fontSize: 12 },
  dateText: { fontSize: 12 },
  messageBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  messageText: { fontSize: 15, lineHeight: 22 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 10,
  },
  btnText: { fontWeight: 'bold', fontSize: 12 },
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
  },
});

export default AdminFeedbackScreen;

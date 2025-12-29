// src/screens/AdminClassDetailScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Alert,
  TouchableOpacity,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

// 🔥 ADIM 1: Tema Hook'unu İmport Et
import { useTheme } from '../context/ThemeContext';

const AdminClassDetailScreen = ({ route, navigation }) => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, t, isDark } = useTheme();

  const { classId, className } = route.params;
  const [loading, setLoading] = useState(true);
  const [attendees, setAttendees] = useState([]);
  const [classInfo, setClassInfo] = useState(null);

  useEffect(() => {
    const unsubscribeClass = firestore()
      .collection('classes')
      .doc(classId)
      .onSnapshot(
        async doc => {
          if (!doc.exists) {
            Alert.alert('Hata', 'Ders bulunamadı.'); // İstersen t.error kullanabilirsin
            navigation.goBack();
            return;
          }
          const data = doc.data();
          setClassInfo(data);

          if (data.attendees && data.attendees.length > 0) {
            const userSnap = await firestore()
              .collection('users')
              .where(firestore.FieldPath.documentId(), 'in', data.attendees)
              .get();

            const attendeeList = userSnap.docs.map(userDoc => {
              return {
                id: userDoc.id,
                name: userDoc.data().fullName || 'İsimsiz Üye',
                email: userDoc.data().email || 'E-mail Yok',
              };
            });

            setAttendees(attendeeList);
          } else {
            setAttendees([]);
          }
          setLoading(false);
        },
        error => {
          console.error('Ders detayı çekme hatası:', error);
          Alert.alert('Hata', 'Ders verisi alınamadı.');
          setLoading(false);
        },
      );

    return () => unsubscribeClass();
  }, [classId, navigation]);

  const removeAttendee = (memberId, memberName) => {
    Alert.alert(
      'Kayıt Silme Onayı', // İstersen t.deleteConfirm gibi yapabilirsin
      `${memberName} adlı üyeyi bu dersten silmek istediğinizden emin misiniz?`,
      [
        { text: t.cancel, style: 'cancel' }, // 🔥 Çeviri: İptal
        {
          text: 'SİL', // 🔥 Çeviri: Delete
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore()
                .collection('classes')
                .doc(classId)
                .update({
                  attendees: firestore.FieldValue.arrayRemove(memberId),
                });
              Alert.alert('Başarılı', `${memberName} dersten çıkarıldı.`);
            } catch (error) {
              Alert.alert('Hata', 'Kayıt silinemedi: ' + error.message);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.attendeeCard,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <View>
        <Text style={[styles.attendeeName, { color: theme.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.attendeeEmail, { color: theme.subText }]}>
          {item.email}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeAttendee(item.id, item.name)}
      >
        <Text style={styles.removeButtonText}>KAYDI SİL</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      {/* Başlık Dinamik */}
      <Text style={[styles.header, { color: theme.text }]}>
        {className} Detayı 🧑‍💻
      </Text>

      {classInfo && (
        <View
          style={[
            styles.infoBox,
            { backgroundColor: theme.card, borderLeftColor: theme.primary },
          ]}
        >
          <Text style={[styles.infoText, { color: theme.text }]}>
            Eğitmen: {classInfo.instructor}
          </Text>
          <Text style={[styles.infoText, { color: theme.text }]}>
            Seviye: {classInfo.level}
          </Text>
          <Text style={[styles.infoText, { color: theme.text }]}>
            Zaman: {classInfo.time}
          </Text>
          <Text style={[styles.infoText, { color: theme.text }]}>
            Kapasite: {attendees.length} / {classInfo.quota}
          </Text>
        </View>
      )}

      <Text style={[styles.listHeader, { color: theme.primary }]}>
        Kayıtlı Üyeler ({attendees.length})
      </Text>

      <FlatList
        data={attendees}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.subText }]}>
            Bu derse kayıtlı kimse yok.
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
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
    marginTop: 10,
  },
  infoBox: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
  },
  infoText: { fontSize: 14, marginBottom: 5 },
  listHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  attendeeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#4CD964', // Sabit yeşil kalabilir veya theme.success yapılabilir
    borderWidth: 1, // Border eklendi
  },
  attendeeName: { fontSize: 16, fontWeight: 'bold' },
  attendeeEmail: { fontSize: 12, marginTop: 2 },
  removeButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  removeButtonText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50 },
});

export default AdminClassDetailScreen;

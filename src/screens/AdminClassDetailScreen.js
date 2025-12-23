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

const AdminClassDetailScreen = ({ route, navigation }) => {
  // Navigation'dan gelen ders ID'sini ve ismini alıyoruz
  const { classId, className } = route.params;
  const [loading, setLoading] = useState(true);
  const [attendees, setAttendees] = useState([]);
  const [classInfo, setClassInfo] = useState(null);

  useEffect(() => {
    // 1. Ders Bilgilerini Çek ve Katılımcıları Dinle
    const unsubscribeClass = firestore()
      .collection('classes')
      .doc(classId)
      .onSnapshot(
        async doc => {
          if (!doc.exists) {
            Alert.alert('Hata', 'Ders bulunamadı.');
            navigation.goBack();
            return;
          }
          const data = doc.data();
          setClassInfo(data);

          // 2. Katılımcı UID'lerini kullanarak kullanıcı adlarını çek
          if (data.attendees && data.attendees.length > 0) {
            // Birden fazla üyeyi tek seferde çekmek için where(in) kullanabiliriz (daha optimize)
            const userSnap = await firestore()
              .collection('users')
              .where(firestore.FieldPath.documentId(), 'in', data.attendees)
              .get();

            const attendeeList = userSnap.docs.map(userDoc => {
              return {
                id: userDoc.id,
                name: userDoc.data().fullName || 'İsimsiz Üye', // Adı fullName olarak kullanıyoruz
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

  // ÜYELİK SİLME İŞLEVİ
  const removeAttendee = (memberId, memberName) => {
    Alert.alert(
      'Kayıt Silme Onayı',
      `${memberName} adlı üyeyi bu dersten silmek istediğinizden emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'SİL',
          style: 'destructive',
          onPress: async () => {
            try {
              // Atomik güncelleme ile üyeyi listeden çıkar
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
    <View style={styles.attendeeCard}>
      <View>
        <Text style={styles.attendeeName}>{item.name}</Text>
        <Text style={styles.attendeeEmail}>{item.email}</Text>
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
      <View style={styles.center}>
        <ActivityIndicator color="#FF8C00" size="large" />
      </View>
    );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <Text style={styles.header}>{className} Detayı 🧑‍💻</Text>

      {classInfo && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Eğitmen: {classInfo.instructor}</Text>
          <Text style={styles.infoText}>Seviye: {classInfo.level}</Text>
          <Text style={styles.infoText}>Zaman: {classInfo.time}</Text>
          <Text style={styles.infoText}>
            Kapasite: {attendees.length} / {classInfo.quota}
          </Text>
        </View>
      )}

      <Text style={styles.listHeader}>Kayıtlı Üyeler ({attendees.length})</Text>

      <FlatList
        data={attendees}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Bu derse kayıtlı kimse yok.</Text>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
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
    marginTop: 10,
  },
  infoBox: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoText: { color: 'white', fontSize: 14, marginBottom: 5 },
  listHeader: {
    color: '#FF8C00',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  attendeeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#4CD964',
  },
  attendeeName: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  attendeeEmail: { color: '#888', fontSize: 12, marginTop: 2 },
  removeButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  removeButtonText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 50 },
});

export default AdminClassDetailScreen;

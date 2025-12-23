import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const ClassBookingScreen = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth().currentUser;

  useEffect(() => {
    const subscriber = firestore()
      .collection('classes')
      .orderBy('createdAt', 'desc')
      .onSnapshot(querySnapshot => {
        const list = [];
        querySnapshot.forEach(doc => {
          list.push({ ...doc.data(), key: doc.id });
        });
        setClasses(list);
        setLoading(false);
      });
    return () => subscriber();
  }, []);

  const handleJoin = async item => {
    const isJoined = item.attendees?.includes(user.uid);
    const isFull = item.attendees?.length >= item.quota;

    // A. AYRILMA MANTIĞI
    if (isJoined) {
      Alert.alert('Ayrıl', 'Dersten kaydını silmek istiyor musun?', [
        { text: 'Hayır', style: 'cancel' },
        {
          text: 'Evet, Ayrıl',
          onPress: async () => {
            try {
              await firestore()
                .collection('classes')
                .doc(item.key)
                .update({
                  attendees: firestore.FieldValue.arrayRemove(user.uid),
                });
              Alert.alert('İptal', 'Kaydınız silindi.');
            } catch (e) {
              Alert.alert('Hata', e.message);
            }
          },
        },
      ]);
      return;
    }

    // B. KATILMA MANTIĞI & ÇAKIŞMA KONTROLÜ
    if (isFull) {
      Alert.alert('Dolu', 'Maalesef bu dersin kontenjanı dolmuş.');
      return;
    }

    // ✨ YENİ: ÇAKIŞMA KONTROLÜ (Conflict Check)
    // Kullanıcının kayıtlı olduğu dersleri bul
    const myClasses = classes.filter(c => c.attendees?.includes(user.uid));

    // Aynı saatte (veya günde) ders var mı?
    // Not: Bu basit mantık, 'time' stringleri aynıysa çakışma sayar (Örn: "19:00" vs "19:00")
    // Gerçek bir uygulamada Tarih+Saat nesnesi karşılaştırması yapılmalıdır.
    const hasConflict = myClasses.some(c => c.time === item.time);

    if (hasConflict) {
      const conflictingClass = myClasses.find(c => c.time === item.time);
      Alert.alert(
        'Saat Çakışması ⚠️',
        `Saat ${item.time}'da zaten "${conflictingClass.title}" dersine kaydınız var. Önce ondan ayrılmalısınız.`,
      );
      return;
    }

    // Sorun yoksa kaydet
    try {
      await firestore()
        .collection('classes')
        .doc(item.key)
        .update({
          attendees: firestore.FieldValue.arrayUnion(user.uid),
        });
      Alert.alert('Başarılı', 'Derse kaydınız alındı! 🎉');
    } catch (error) {
      Alert.alert('Hata', error.message);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FF8C00" />
      </View>
    );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <Text style={styles.header}>DERS REZERVASYON 📅</Text>

      <FlatList
        data={classes}
        keyExtractor={item => item.key}
        renderItem={({ item }) => {
          const isJoined = item.attendees?.includes(user.uid);
          const isFull = item.attendees?.length >= item.quota;
          const currentCount = item.attendees ? item.attendees.length : 0;

          return (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  {item.title}{' '}
                  <Text style={{ fontSize: 12, color: '#888' }}>
                    ({item.level})
                  </Text>
                </Text>
                <Text style={styles.time}>🕒 {item.time}</Text>
                <Text style={styles.ins}>Eğitmen: {item.instructor}</Text>
                <Text style={styles.quota}>
                  Doluluk: {currentCount}/{item.quota}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.btn,
                  isJoined
                    ? styles.btnJoined
                    : isFull
                    ? styles.btnFull
                    : styles.btnJoin,
                ]}
                onPress={() => handleJoin(item)}
                disabled={isFull && !isJoined}
              >
                <Text style={styles.btnText}>
                  {isJoined ? 'KATILDIN' : isFull ? 'DOLU' : 'KATIL'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>Henüz açılmış bir ders yok.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  center: { flex: 1, backgroundColor: '#121212', justifyContent: 'center' },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#333',
    borderLeftWidth: 4,
    borderLeftColor: '#FF8C00',
  },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  time: { color: '#FF8C00', marginTop: 5, fontWeight: 'bold' },
  ins: { color: '#AAA', marginTop: 2, fontSize: 12 },
  quota: { color: '#4CD964', fontSize: 12, marginTop: 5, fontWeight: 'bold' },
  btn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  btnJoin: { backgroundColor: '#007AFF' },
  btnJoined: { backgroundColor: '#4CD964' },
  btnFull: { backgroundColor: '#333' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  empty: { color: '#666', textAlign: 'center', marginTop: 50 },
});

export default ClassBookingScreen;

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

// 🔥 ADIM 1: Tema Hook'unu İmport Et
import { useTheme } from '../context/ThemeContext';

const ClassBookingScreen = () => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, t, isDark } = useTheme();

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
      Alert.alert(
        'Ayrıl', // İstersen t.leaveClass yapabilirsin
        'Dersten kaydını silmek istiyor musun?',
        [
          { text: t.cancel, style: 'cancel' }, // 🔥 Çeviri
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
        ],
      );
      return;
    }

    // B. KATILMA MANTIĞI & ÇAKIŞMA KONTROLÜ
    if (isFull) {
      Alert.alert('Dolu', 'Maalesef bu dersin kontenjanı dolmuş.');
      return;
    }

    // ✨ YENİ: ÇAKIŞMA KONTROLÜ (Conflict Check)
    const myClasses = classes.filter(c => c.attendees?.includes(user.uid));
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
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.primary} />
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
        {t.classBooking || 'DERS REZERVASYON'} 📅
      </Text>

      <FlatList
        data={classes}
        keyExtractor={item => item.key}
        renderItem={({ item }) => {
          const isJoined = item.attendees?.includes(user.uid);
          const isFull = item.attendees?.length >= item.quota;
          const currentCount = item.attendees ? item.attendees.length : 0;

          return (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  borderLeftColor: theme.primary,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: theme.text }]}>
                  {item.title}{' '}
                  <Text style={{ fontSize: 12, color: theme.subText }}>
                    ({item.level})
                  </Text>
                </Text>
                <Text style={[styles.time, { color: theme.primary }]}>
                  🕒 {item.time}
                </Text>
                <Text style={[styles.ins, { color: theme.subText }]}>
                  Eğitmen: {item.instructor}
                </Text>
                <Text style={[styles.quota, { color: theme.success }]}>
                  Doluluk: {currentCount}/{item.quota}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.btn,
                  isJoined
                    ? { backgroundColor: theme.success }
                    : isFull
                    ? { backgroundColor: theme.inputBg }
                    : { backgroundColor: '#007AFF' },
                ]}
                onPress={() => handleJoin(item)}
                disabled={isFull && !isJoined}
              >
                <Text
                  style={[
                    styles.btnText,
                    isFull && !isJoined
                      ? { color: theme.subText }
                      : { color: 'white' },
                  ]}
                >
                  {isJoined ? 'KATILDIN' : isFull ? 'DOLU' : 'KATIL'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.subText }]}>
            Henüz açılmış bir ders yok.
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: 'center' },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  time: { marginTop: 5, fontWeight: 'bold' },
  ins: { marginTop: 2, fontSize: 12 },
  quota: { fontSize: 12, marginTop: 5, fontWeight: 'bold' },
  btn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  btnText: { fontWeight: 'bold', fontSize: 12 },
  empty: { textAlign: 'center', marginTop: 50 },
});

export default ClassBookingScreen;

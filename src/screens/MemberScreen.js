import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Image,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔥 ADIM 1: Tema Hook'unu İmport Et
import { useTheme } from '../context/ThemeContext';

const MemberScreen = ({ navigation }) => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, t, isDark } = useTheme();

  const user = auth().currentUser;
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // QR Modal
  const [showQR, setShowQR] = useState(false);

  // Liderlik Tablosu
  const [leaders, setLeaders] = useState([]);

  // Su Takibi
  const [waterCount, setWaterCount] = useState(0);

  // Manuel Program Modalı
  const [showProgram, setShowProgram] = useState(false);

  // Beslenme Modalı
  const [showDietModal, setShowDietModal] = useState(false);

  // Geri Bildirim Modalı
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  // Duyuru / Bildirim (Notification)
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    // 1. Kullanıcı Verisini Çek
    const userSub = firestore()
      .collection('users')
      .doc(user.uid)
      .onSnapshot(doc => {
        setUserData(doc.data());
        setLoading(false);
      });

    // 2. Liderlik Tablosunu Çek (En çok antrenman yapan ilk 3)
    const leaderSub = firestore()
      .collection('users')
      .orderBy('totalWorkouts', 'desc')
      .limit(3)
      .onSnapshot(snapshot => {
        const list = [];
        snapshot.forEach(d => list.push({ ...d.data(), key: d.id }));
        setLeaders(list);
      });

    // 3. Su verisini yerelden çek (Her gün sıfırlanmalı aslında, basit tutuyoruz)
    AsyncStorage.getItem('water_count').then(val => {
      if (val) setWaterCount(parseInt(val));
    });

    // 4. Bildirimleri Çek (Okunmamış olanlar)
    const notifSub = firestore()
      .collection('notifications')
      .where('targetUser', 'in', [user.uid, 'all']) // Hem bana özel hem genel
      .where('read', '==', false)
      .onSnapshot(snap => {
        const list = [];
        if (snap) snap.forEach(d => list.push({ ...d.data(), id: d.id }));
        setNotifications(list);
      });

    return () => {
      userSub();
      leaderSub();
      if (notifSub) notifSub();
    };
  }, []);

  const handleAddWater = () => {
    const newVal = waterCount + 1;
    setWaterCount(newVal);
    AsyncStorage.setItem('water_count', newVal.toString());
  };

  const handleResetWater = () => {
    setWaterCount(0);
    AsyncStorage.setItem('water_count', '0');
  };

  const sendFeedback = async () => {
    if (!feedbackText) return;
    try {
      await firestore().collection('feedback').add({
        userId: user.uid,
        userName: userData?.fullName,
        userPhone: userData?.phone,
        message: feedbackText,
        createdAt: firestore.FieldValue.serverTimestamp(),
        isRead: false,
      });
      Alert.alert(
        t.success || 'Başarılı',
        t.feedbackSent || 'Mesajınız yönetime iletildi.',
      );
      setFeedbackText('');
      setShowFeedback(false);
    } catch (error) {
      Alert.alert(t.error || 'Hata', error.message);
    }
  };

  // QR ile Giriş Yapma (Simülasyon)
  const handleQRScan = async () => {
    // Gerçek bir QR kütüphanesi yerine butona basınca giriş yapmış sayıyoruz.
    try {
      await firestore().collection('entry_logs').add({
        uid: user.uid,
        fullName: userData?.fullName,
        email: userData?.email,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });
      Alert.alert(
        t.success || 'Başarılı',
        t.entryLogged || 'Salona girişiniz kaydedildi! İyi antrenmanlar. 💪',
      );
      setShowQR(false);
    } catch (e) {
      Alert.alert(t.error || 'Hata', e.message);
    }
  };

  const markAsRead = async id => {
    await firestore()
      .collection('notifications')
      .doc(id)
      .update({ read: true });
  };

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

      {/* HEADER */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.welcome, { color: theme.subText }]}>
            {t.welcome || 'Hoş geldin,'}
          </Text>
          <Text style={[styles.userName, { color: theme.text }]}>
            {userData?.fullName}
          </Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={() => setShowNotif(true)}
            style={[
              styles.iconBtn,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Text style={{ fontSize: 20 }}>🔔</Text>
            {notifications.length > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.danger }]} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowQR(true)}
            style={[
              styles.iconBtn,
              {
                marginLeft: 10,
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={{ fontSize: 20 }}>📷</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* SU KARTI */}
        <View
          style={[
            styles.waterCard,
            { backgroundColor: theme.card, borderColor: theme.primary },
          ]}
        >
          <View>
            <Text style={[styles.waterTitle, { color: theme.text }]}>
              {t.waterTitle || 'SU TAKİBİ'} 💧
            </Text>
            <Text style={[styles.waterSub, { color: theme.subText }]}>
              {t.target || 'Hedef'}: 3000ml
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.waterCount, { color: theme.primary }]}>
              {waterCount * 250}ml
            </Text>
            <TouchableOpacity
              onPress={handleAddWater}
              style={[styles.addBtn, { backgroundColor: theme.primary }]}
            >
              <Text style={{ fontSize: 20, color: 'white' }}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleResetWater}
              style={{ marginLeft: 10 }}
            >
              <Text style={{ fontSize: 20 }}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* LİDERLİK TABLOSU */}
        <View
          style={[
            styles.leaderCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.sectTitle, { color: theme.text }]}>
            {t.leaderboard || 'LİDERLİK TABLOSU'} 🏆
          </Text>
          {leaders.map((l, i) => (
            <View
              key={i}
              style={[
                styles.leaderRow,
                { borderBottomColor: theme.border },
                i === 2 && { borderBottomWidth: 0 },
              ]}
            >
              <Text
                style={{
                  fontWeight: 'bold',
                  color: i === 0 ? '#FFD700' : theme.text,
                }}
              >
                #{i + 1}
              </Text>
              <Text style={{ color: theme.text, flex: 1, marginLeft: 10 }}>
                {l.fullName}
              </Text>
              <Text style={{ color: theme.primary, fontWeight: 'bold' }}>
                {l.totalWorkouts} Ant.
              </Text>
            </View>
          ))}
        </View>

        {/* AI PROGRAM KARTI */}
        {userData?.trainingProgram ? (
          <View
            style={[
              styles.aiCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.aiHeader}>
              <Text style={[styles.aiTitle, { color: theme.success }]}>
                {t.aiProgTitle || 'YAPAY ZEKA PROGRAMIN'} 🤖
              </Text>
              <Text style={{ color: theme.subText, fontSize: 10 }}>
                {userData.trainingProgram.target}
              </Text>
            </View>
            <View style={{ marginTop: 10 }}>
              <Text style={{ color: theme.text }}>
                📅 1. Gün: {userData.trainingProgram.day1?.substring(0, 30)}...
              </Text>
              <Text style={{ color: theme.text, marginTop: 5 }}>
                📅 2. Gün: {userData.trainingProgram.day2?.substring(0, 30)}...
              </Text>
            </View>
          </View>
        ) : null}

        {/* MENÜ BUTONLARI */}
        <View style={styles.grid}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#007AFF', width: '100%' }]}
            onPress={() => navigation.navigate('ActiveWorkout')}
          >
            <Text style={styles.emoji}>🏋️‍♂️</Text>
            <Text style={styles.btnTx}>
              {t.startWorkout || 'ANTRENMANA BAŞLA'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btn,
              {
                backgroundColor: theme.card,
                width: '100%',
                marginTop: 10,
                flexDirection: 'row',
                borderWidth: 1,
                borderColor: theme.primary,
              },
            ]}
            onPress={() => setShowProgram(true)}
          >
            <Text style={styles.emoji}>📋</Text>
            <Text style={[styles.btnTx, { marginLeft: 10, color: theme.text }]}>
              {t.manualProg || 'MANUEL PROGRAMIM'}
            </Text>
          </TouchableOpacity>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 10,
            }}
          >
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: '#9b59b6', width: '48%' }]}
              onPress={() => navigation.navigate('ExerciseGuide')}
            >
              <Text style={styles.emoji}>📚</Text>
              <Text style={styles.btnTx}>
                {t.encyclopedia || 'ANSİKLOPEDİ'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: '#FF9500', width: '48%' }]}
              onPress={() => navigation.navigate('BodyStats')}
            >
              <Text style={styles.emoji}>📈</Text>
              <Text style={styles.btnTx}>{t.progress || 'GELİŞİM'}</Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 10,
            }}
          >
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: '#27AE60', width: '48%' }]}
              onPress={() => setShowDietModal(true)}
            >
              <Text style={styles.emoji}>🥗</Text>
              <Text style={styles.btnTx}>{t.nutrition || 'BESLENME'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: '#576574', width: '48%' }]}
              onPress={() => navigation.navigate('MemberHistory')}
            >
              <Text style={styles.emoji}>📜</Text>
              <Text style={styles.btnTx}>{t.history || 'GEÇMİŞ'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bize Yazın */}
        <TouchableOpacity
          style={[
            styles.fbBanner,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          onPress={() => setShowFeedback(true)}
        >
          <Text style={{ fontSize: 20 }}>📣</Text>
          <View style={{ marginLeft: 10 }}>
            <Text style={{ color: theme.text, fontWeight: 'bold' }}>
              {t.contactUs || 'BİZE YAZIN'}
            </Text>
            <Text style={{ color: theme.subText, fontSize: 10 }}>
              {t.contactSub || 'Şikayet, öneri veya istekleriniz...'}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* --- MODALLAR --- */}

      {/* QR Modal */}
      <Modal visible={showQR} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.card, alignItems: 'center' },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              SALONA GİRİŞ QR 📷
            </Text>
            <View
              style={{
                height: 200,
                width: 200,
                backgroundColor: 'white',
                justifyContent: 'center',
                alignItems: 'center',
                marginVertical: 20,
              }}
            >
              <Text style={{ color: 'black', fontWeight: 'bold' }}>
                [KAMERA AÇIK]
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.fullBtn, { backgroundColor: theme.success }]}
              onPress={handleQRScan}
            >
              <Text style={styles.btnText}>{t.scanQr || 'GİRİŞ YAP'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowQR(false)}
              style={{ marginTop: 15 }}
            >
              <Text style={{ color: theme.subText }}>{t.close || 'Kapat'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Manuel Program Modal */}
      <Modal visible={showProgram} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.card, height: '80%' },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {t.myProgram || 'PROGRAMIM'} 📋
            </Text>
            <ScrollView>
              {userData?.workoutProgram?.map((item, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: theme.inputBg,
                    padding: 10,
                    marginBottom: 10,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: theme.primary, fontWeight: 'bold' }}>
                    {item.day} - {item.name}
                  </Text>
                  <Text style={{ color: theme.text }}>
                    {item.sets} Set x {item.reps} Tekrar
                  </Text>
                </View>
              ))}
              {(!userData?.workoutProgram ||
                userData?.workoutProgram.length === 0) && (
                <Text style={{ color: theme.subText, textAlign: 'center' }}>
                  {t.noProgram || 'Henüz program atanmamış.'}
                </Text>
              )}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowProgram(false)}
              style={{ alignSelf: 'center', marginTop: 10 }}
            >
              <Text style={{ color: theme.subText }}>{t.close || 'Kapat'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Beslenme Modal */}
      <Modal visible={showDietModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {t.nutritionPlan || 'BESLENME PLANI'} 🍎
            </Text>
            <ScrollView>
              {userData?.dietProgram ? (
                <>
                  <Text style={{ color: theme.primary, marginBottom: 10 }}>
                    Hedef: {userData.dietProgram.calories} kcal
                  </Text>
                  <Text style={{ color: theme.text, fontWeight: 'bold' }}>
                    Kahvaltı:
                  </Text>
                  <Text style={{ color: theme.subText, marginBottom: 10 }}>
                    {userData.dietProgram.breakfast}
                  </Text>

                  <Text style={{ color: theme.text, fontWeight: 'bold' }}>
                    Öğle:
                  </Text>
                  <Text style={{ color: theme.subText, marginBottom: 10 }}>
                    {userData.dietProgram.lunch}
                  </Text>

                  <Text style={{ color: theme.text, fontWeight: 'bold' }}>
                    Akşam:
                  </Text>
                  <Text style={{ color: theme.subText, marginBottom: 10 }}>
                    {userData.dietProgram.dinner}
                  </Text>
                </>
              ) : (
                <Text style={{ color: theme.subText }}>
                  {t.noDietPlan || 'Diyet programı yok.'}
                </Text>
              )}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowDietModal(false)}
              style={{ alignSelf: 'center', marginTop: 10 }}
            >
              <Text style={{ color: theme.subText }}>{t.close || 'Kapat'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bildirimler Modal */}
      <Modal visible={showNotif} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {t.notifications || 'DUYURULAR'} 📢
            </Text>
            <ScrollView>
              {notifications.map(n => (
                <TouchableOpacity
                  key={n.id}
                  onPress={() => markAsRead(n.id)}
                  style={{
                    backgroundColor: theme.inputBg,
                    padding: 10,
                    marginBottom: 10,
                    borderRadius: 8,
                    borderLeftWidth: 3,
                    borderLeftColor: theme.danger,
                  }}
                >
                  <Text style={{ color: theme.text, fontWeight: 'bold' }}>
                    {n.title}
                  </Text>
                  <Text style={{ color: theme.subText }}>{n.message}</Text>
                </TouchableOpacity>
              ))}
              {notifications.length === 0 && (
                <Text style={{ color: theme.subText, textAlign: 'center' }}>
                  {t.noNotifications || 'Yeni bildirim yok.'}
                </Text>
              )}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowNotif(false)}
              style={{ alignSelf: 'center', marginTop: 10 }}
            >
              <Text style={{ color: theme.subText }}>{t.close || 'Kapat'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Geri Bildirim Modal */}
      <Modal visible={showFeedback} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {t.feedbackTitle || 'BİZE YAZIN'} 📝
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder={t.feedbackPlaceholder || 'Mesajınız...'}
              placeholderTextColor={theme.subText}
              multiline
              value={feedbackText}
              onChangeText={setFeedbackText}
            />
            <TouchableOpacity
              style={[styles.fullBtn, { backgroundColor: theme.primary }]}
              onPress={sendFeedback}
            >
              <Text style={styles.btnText}>{t.send || 'GÖNDER'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowFeedback(false)}
              style={{ marginTop: 15, alignSelf: 'center' }}
            >
              <Text style={{ color: theme.subText }}>
                {t.cancel || 'Vazgeç'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  welcome: { fontSize: 12 },
  userName: { fontSize: 20, fontWeight: 'bold' },
  iconBtn: {
    padding: 10,
    borderRadius: 50,
    borderWidth: 1,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  waterCard: {
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 5,
  },
  waterTitle: { fontSize: 16, fontWeight: 'bold' },
  waterSub: { fontSize: 12 },
  waterCount: { fontSize: 18, fontWeight: 'bold', marginRight: 10 },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderCard: {
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
  },
  sectTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  leaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  aiCard: {
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
  },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  aiTitle: { fontWeight: 'bold', fontSize: 14 },
  grid: { marginBottom: 20 },
  btn: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTx: { color: 'white', fontWeight: 'bold', marginTop: 5 },
  emoji: { fontSize: 24 },
  fbBanner: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 20,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    padding: 20,
    borderRadius: 15,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  fullBtn: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  btnText: { color: 'white', fontWeight: 'bold' },
});

export default MemberScreen;

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Modal,
  ScrollView,
  Image,
  TextInput,
  Alert,
  FlatList,
  Vibration,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const SCREEN_WIDTH = Dimensions.get('window').width;

// --- EGZERSİZ BİLGİ BANKASI ---
const EXERCISE_INFO = {
  'Bench Press': {
    desc: 'Sırt üstü sehpaya uzanın. Barı göğüs ucuna indirin ve patlayıcı güçle itin.',
    tips: 'Dirsekleri 45 derece açıda tut, nefes vererek it.',
    muscle: 'Göğüs',
    level: 'Orta',
  },
  Squat: {
    desc: 'Ayakları omuz genişliğinde aç. Sırt dik, kalçayı geriye vererek çömel.',
    tips: 'Dizler içe dönmesin, topuklar yerden kalkmasın.',
    muscle: 'Bacak',
    level: 'Zor',
  },
  Deadlift: {
    desc: 'Barı kaval kemiğine yasla. Sırt düz, kalçadan güç alarak kaldır.',
    tips: 'Belini bükme, barı vücuduna yakın tut.',
    muscle: 'Sırt',
    level: 'Zor',
  },
  'Shoulder Press': {
    desc: 'Dambılları kulak hizasından baş üzerine it.',
    tips: 'Beli aşırı çukurlaştırma.',
    muscle: 'Omuz',
    level: 'Orta',
  },
  'Lat Pulldown': {
    desc: 'Barı göğsünün üst kısmına çek.',
    tips: 'Geriye çok yatma, dirsekleri aşağı çek.',
    muscle: 'Sırt',
    level: 'Kolay',
  },
  default: {
    desc: 'Hareketi kontrollü yapmaya özen gösterin.',
    tips: 'Nefes alışverişini unutmayın.',
    muscle: 'Genel',
    level: 'Standart',
  },
};

const MemberScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [waterCount, setWaterCount] = useState(0);

  // --- Feedback (Bize Yazın) State ---
  const [feedbackText, setFeedbackText] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [sendingFeedback, setSendingFeedback] = useState(false);

  // --- UI State ---
  const [showProgram, setShowProgram] = useState(false);
  const [showDietModal, setShowDietModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  // --- Bildirimler ---
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const user = auth().currentUser;

  // --- 🔥 OTOMATİK GİRİŞ KAYDI (AUTO LOG) ---
  useEffect(() => {
    const logEntry = async () => {
      if (!user) return;

      try {
        const userDoc = await firestore()
          .collection('users')
          .doc(user.uid)
          .get();
        const userName = userDoc.exists
          ? userDoc.data().fullName
          : 'Misafir Üye';

        const lastLogSnap = await firestore()
          .collection('entry_logs')
          .where('uid', '==', user.uid)
          .orderBy('timestamp', 'desc')
          .limit(1)
          .get();

        let shouldLog = true;
        if (!lastLogSnap.empty) {
          const lastData = lastLogSnap.docs[0].data();
          if (lastData.timestamp) {
            const lastTime = lastData.timestamp.toDate().getTime();
            const now = new Date().getTime();
            if (now - lastTime < 5 * 60 * 1000) {
              shouldLog = false;
            }
          }
        }

        if (shouldLog) {
          await firestore().collection('entry_logs').add({
            uid: user.uid,
            fullName: userName,
            timestamp: firestore.FieldValue.serverTimestamp(),
            type: 'entry',
            userEmail: user.email,
          });
          console.log('✅ Giriş Logu Başarıyla Kaydedildi.');
        }
      } catch (error) {
        console.error('Giriş loglama hatası:', error);
      }
    };

    logEntry();
  }, [user]);

  const programDays = useMemo(() => {
    if (!userData?.workoutProgram) return [];
    return [...new Set(userData.workoutProgram.map(item => item.day))];
  }, [userData?.workoutProgram]);

  const currentDayExercises = useMemo(() => {
    if (!userData?.workoutProgram || !selectedDay) return [];
    return userData.workoutProgram.filter(item => item.day === selectedDay);
  }, [userData?.workoutProgram, selectedDay]);

  useEffect(() => {
    if (showProgram && programDays.length > 0 && !selectedDay) {
      setSelectedDay(programDays[0]);
    }
  }, [showProgram, programDays]);

  const markAllAsRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.read);
    if (unreadNotifs.length === 0) return;
    const batch = firestore().batch();
    unreadNotifs.forEach(notif => {
      const ref = firestore().collection('notifications').doc(notif.key);
      batch.update(ref, { read: true });
    });
    try {
      await batch.commit();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const userSub = firestore()
      .collection('users')
      .doc(user.uid)
      .onSnapshot(doc => {
        if (doc.exists) {
          const data = doc.data();
          setUserData(data);
          setWaterCount(data.dailyWater || 0);
        }
      });

    const logsSub = firestore()
      .collection('entry_logs')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .onSnapshot(snap => {
        const counts = {};
        if (snap) {
          snap.forEach(doc => {
            const d = doc.data();
            if (d.fullName) {
              counts[d.fullName] = (counts[d.fullName] || 0) + 1;
            }
          });
        }
        const sorted = Object.keys(counts)
          .map(k => ({ name: k, score: counts[k] }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        setLeaderboard(sorted);
        setLoading(false);
      });

    const notifSub = firestore()
      .collection('notifications')
      .where('targetUser', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        snap => {
          const list = [];
          let unread = 0;
          if (snap) {
            snap.forEach(doc => {
              const data = doc.data();
              list.push({ ...data, key: doc.id });
              if (!data.read) unread++;
            });
            snap.docChanges().forEach(change => {
              if (change.type === 'added') {
                const newData = change.doc.data();
                const now = new Date().getTime();
                const notifTime = newData.createdAt
                  ? newData.createdAt.toMillis()
                  : 0;
                if (now - notifTime < 10000) {
                  Vibration.vibrate();
                  Alert.alert('🔔 Yeni Bildirim', newData.message);
                }
              }
            });
          }
          setNotifications(list);
          setUnreadCount(unread);
        },
        error => {
          console.error('Bildirim hatası:', error);
        },
      );

    return () => {
      userSub();
      logsSub();
      notifSub();
    };
  }, [user]);

  useEffect(() => {
    if (showNotifications) markAllAsRead();
  }, [showNotifications]);

  const handleLogout = () => {
    auth().signOut();
    navigation.replace('Welcome');
  };

  const updateWater = async amount => {
    const newVal = waterCount + amount;
    if (newVal < 0) return;
    setWaterCount(newVal);
    await firestore()
      .collection('users')
      .doc(user.uid)
      .update({ dailyWater: newVal });
  };

  const sendFeedback = async () => {
    if (!feedbackText.trim()) {
      Alert.alert('Uyarı', 'Lütfen bir mesaj yazın.');
      return;
    }
    setSendingFeedback(true);
    try {
      await firestore()
        .collection('feedback')
        .add({
          userId: user.uid,
          userName: userData?.fullName || 'İsimsiz Üye',
          userPhone: userData?.phone || '-',
          message: feedbackText,
          createdAt: firestore.FieldValue.serverTimestamp(),
          isRead: false,
        });
      Alert.alert('Teşekkürler', 'Mesajınız yöneticiye iletildi.');
      setFeedbackText('');
      setShowFeedback(false);
    } catch (error) {
      Alert.alert('Hata', error.message);
    } finally {
      setSendingFeedback(false);
    }
  };

  const deleteNotification = id => {
    firestore().collection('notifications').doc(id).delete();
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );

  const exInfo = selectedExercise
    ? EXERCISE_INFO[selectedExercise.name] || EXERCISE_INFO['default']
    : null;

  const AiProgramRow = ({ day, content }) => (
    <View style={styles.aiRow}>
      <View style={styles.aiDayBox}>
        <Text style={styles.aiDayText}>{day}</Text>
      </View>
      <Text style={styles.aiContentText}>{content || 'Dinlenme'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* HEADER */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.welcome}>Hoşgeldin,</Text>
          <Text style={styles.userName}>{userData?.fullName}</Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setShowNotifications(true)}
          >
            <Text style={{ fontSize: 24 }}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.iconBtn,
              { marginLeft: 10, backgroundColor: 'white' },
            ]}
            onPress={() => setShowQRModal(true)}
          >
            <QRCode value={user.uid} size={30} backgroundColor="transparent" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* SU KARTI */}
        <View style={styles.waterCard}>
          <View>
            <Text style={styles.waterTitle}>💧 SU TAKİBİ</Text>
            <Text style={styles.waterSub}>Hedef: 3000ml</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => updateWater(-200)}
              style={styles.wBtn}
            >
              <Text style={styles.wTxt}>-</Text>
            </TouchableOpacity>
            <Text
              style={{
                color: 'white',
                width: 70,
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: 18,
              }}
            >
              {waterCount} ml
            </Text>
            <TouchableOpacity
              onPress={() => updateWater(200)}
              style={[styles.wBtn, { backgroundColor: '#007AFF' }]}
            >
              <Text style={styles.wTxt}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* LİDERLİK TABLOSU */}
        <View style={styles.leaderCard}>
          <Text style={styles.sectTitle}>🏆 AYIN ŞAMPİYONLARI</Text>
          {leaderboard.length > 0 ? (
            leaderboard.map((item, i) => (
              <View key={i} style={styles.lRow}>
                <Text
                  style={[
                    styles.lRank,
                    i === 0 && { color: '#FFD700', fontSize: 16 },
                  ]}
                >
                  #{i + 1}
                </Text>
                <Text style={{ color: 'white', flex: 1, marginLeft: 10 }}>
                  {item.name}
                </Text>
                <Text style={{ color: '#4CD964', fontWeight: 'bold' }}>
                  {item.score} Giriş
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ color: '#666', fontStyle: 'italic' }}>
              Henüz veri yok...
            </Text>
          )}
        </View>

        {/* AI ANTRENMAN PROGRAMI KARTI */}
        {userData?.trainingProgram ? (
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <Text style={styles.aiTitle}>⚡ AI KOÇ PROGRAMIN</Text>
              <View style={styles.aiTargetBadge}>
                <Text style={styles.aiTargetText}>
                  {userData.trainingProgram.target}
                </Text>
              </View>
            </View>

            <AiProgramRow
              day="1. GÜN"
              content={userData.trainingProgram.day1}
            />
            <AiProgramRow
              day="2. GÜN"
              content={userData.trainingProgram.day2}
            />
            <AiProgramRow
              day="3. GÜN"
              content={userData.trainingProgram.day3}
            />
            <AiProgramRow
              day="4. GÜN"
              content={userData.trainingProgram.day4}
            />

            <Text style={styles.aiFooterInfo}>
              * {userData.trainingProgram.level} Seviye Program
            </Text>
          </View>
        ) : null}

        {/* MENÜ BUTONLARI */}
        <View style={styles.grid}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#007AFF', width: '100%' }]}
            onPress={() => navigation.navigate('ActiveWorkout')}
          >
            <Text style={styles.emoji}>🏋️‍♂️</Text>
            <Text style={styles.btnTx}>ANTRENMANA BAŞLA</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btn,
              {
                backgroundColor: '#2C2C2C',
                width: '100%',
                marginTop: 10,
                flexDirection: 'row',
                borderWidth: 1,
                borderColor: '#FF8C00',
              },
            ]}
            onPress={() => setShowProgram(true)}
          >
            <Text style={styles.emoji}>📋</Text>
            <Text style={[styles.btnTx, { marginLeft: 10, fontSize: 14 }]}>
              MANUEL PROGRAMIM
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
              style={[styles.btn, { backgroundColor: '#E91E63', width: '48%' }]}
              onPress={() => navigation.navigate('ClassBooking')}
            >
              <Text style={styles.emoji}>📅</Text>
              <Text style={styles.btnTx}>Dersler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: '#34C759', width: '48%' }]}
              onPress={() => navigation.navigate('Shop')}
            >
              <Text style={styles.emoji}>🛒</Text>
              <Text style={styles.btnTx}>Mağaza</Text>
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
              style={[styles.btn, { backgroundColor: '#9b59b6', width: '48%' }]}
              onPress={() => navigation.navigate('ExerciseGuide')}
            >
              <Text style={styles.emoji}>📚</Text>
              <Text style={styles.btnTx}>Ansiklopedi</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: '#FF9500', width: '48%' }]}
              onPress={() => navigation.navigate('BodyStats')}
            >
              <Text style={styles.emoji}>📈</Text>
              <Text style={styles.btnTx}>Gelişim</Text>
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
              <Text style={styles.btnTx}>Beslenme</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: '#576574', width: '48%' }]}
              onPress={() => navigation.navigate('MemberHistory')}
            >
              <Text style={styles.emoji}>📜</Text>
              <Text style={styles.btnTx}>Geçmiş</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.btn,
              {
                backgroundColor: '#34495e',
                width: '100%',
                marginTop: 10,
                flexDirection: 'row',
              },
            ]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.emoji}>⚙️</Text>
            <Text style={[styles.btnTx, { marginLeft: 10, fontSize: 14 }]}>
              PROFİL AYARLARI
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.fbBanner}
          onPress={() => setShowFeedback(true)}
        >
          <Text style={{ fontSize: 20 }}>📣</Text>
          <View style={{ marginLeft: 10 }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>
              Bize Yazın
            </Text>
            <Text style={{ color: '#888', fontSize: 10 }}>Öneri / Şikayet</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* 🔥 YENİ AI KOÇ BUTONU (FAB) 🔥 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AiCoach')}
      >
        <Text style={{ fontSize: 30 }}>🤖</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Text style={{ color: '#666', fontWeight: 'bold' }}>ÇIKIŞ YAP</Text>
      </TouchableOpacity>

      {/* --- MODALLAR --- */}
      {/* 1. MANUEL PROGRAM MODALI */}
      <Modal visible={showProgram} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                marginBottom: 20,
                paddingHorizontal: 10,
              }}
            >
              <Text style={styles.mTitle}>📋 MANUEL PROGRAMIN</Text>
              <TouchableOpacity
                onPress={() => setShowProgram(false)}
                style={styles.closeBtnIcon}
              >
                <Text
                  style={{ fontSize: 16, color: 'white', fontWeight: 'bold' }}
                >
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 50, marginBottom: 20 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 5 }}
              >
                {programDays.map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayTab,
                      selectedDay === day && styles.dayTabActive,
                    ]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text
                      style={[
                        styles.dayTabText,
                        selectedDay === day && { color: 'white' },
                      ]}
                    >
                      {day.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <ScrollView
              style={{ width: '100%' }}
              contentContainerStyle={{
                paddingBottom: 30,
                paddingHorizontal: 5,
              }}
            >
              {currentDayExercises.length > 0 ? (
                currentDayExercises.map((item, i) => {
                  const info =
                    EXERCISE_INFO[item.name] || EXERCISE_INFO['default'];
                  return (
                    <TouchableOpacity
                      key={i}
                      style={styles.proCard}
                      onPress={() => setSelectedExercise(item)}
                    >
                      <View style={styles.proImageContainer}>
                        {item.gifUrl ? (
                          <Image
                            source={{ uri: item.gifUrl }}
                            style={styles.proImage}
                          />
                        ) : (
                          <Text style={{ fontSize: 24 }}>🏋️</Text>
                        )}
                      </View>
                      <View
                        style={{
                          flex: 1,
                          paddingHorizontal: 12,
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={styles.proName}>{item.name}</Text>
                        <View style={{ flexDirection: 'row', marginTop: 6 }}>
                          <View style={styles.tagBox}>
                            <Text style={styles.tagText}>
                              {info.muscle.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.proStats}>
                        <View style={{ alignItems: 'center' }}>
                          <Text style={styles.proStatValue}>{item.sets}</Text>
                          <Text style={styles.proStatLabel}>SET</Text>
                        </View>
                        <View
                          style={{
                            width: 1,
                            height: 20,
                            backgroundColor: '#333',
                            marginHorizontal: 8,
                          }}
                        />
                        <View style={{ alignItems: 'center' }}>
                          <Text
                            style={[styles.proStatValue, { color: '#4CD964' }]}
                          >
                            {item.reps}
                          </Text>
                          <Text style={styles.proStatLabel}>TEKRAR</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={{ alignItems: 'center', marginTop: 60 }}>
                  <Text style={{ fontSize: 50 }}>🏖️</Text>
                  <Text style={{ color: '#888', fontWeight: 'bold' }}>
                    Bugün dinlenme günü!
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 2. DİYET MODALI */}
      <Modal visible={showDietModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
                marginBottom: 15,
              }}
            >
              <Text style={styles.mTitle}>🥗 BESLENME PLANIN</Text>
              <TouchableOpacity onPress={() => setShowDietModal(false)}>
                <Text style={{ color: 'white', fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>
            {userData?.dietProgram ? (
              <ScrollView
                style={{ width: '100%' }}
                showsVerticalScrollIndicator={false}
              >
                <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                  <View
                    style={[
                      styles.tagBox,
                      {
                        flex: 1,
                        marginRight: 10,
                        backgroundColor: 'rgba(230, 126, 34, 0.15)',
                        borderColor: '#E67E22',
                        paddingVertical: 10,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: '#E67E22',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: 14,
                      }}
                    >
                      🔥 {userData.dietProgram.calories || 0} kcal
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.tagBox,
                      {
                        flex: 1,
                        backgroundColor: 'rgba(52, 152, 219, 0.15)',
                        borderColor: '#3498DB',
                        paddingVertical: 10,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: '#3498DB',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: 14,
                      }}
                    >
                      🥩 {userData.dietProgram.protein || 0}g Protein
                    </Text>
                  </View>
                </View>
                {[
                  {
                    title: '🍳 Kahvaltı',
                    data: userData.dietProgram.breakfast,
                  },
                  { title: '🥩 Öğle Yemeği', data: userData.dietProgram.lunch },
                  {
                    title: '🐟 Akşam Yemeği',
                    data: userData.dietProgram.dinner,
                  },
                  {
                    title: '🥜 Ara Öğünler',
                    data: userData.dietProgram.snacks,
                  },
                ].map((meal, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: '#252525',
                      padding: 15,
                      borderRadius: 12,
                      marginBottom: 10,
                      borderLeftWidth: 3,
                      borderLeftColor: '#27AE60',
                    }}
                  >
                    <Text
                      style={{
                        color: '#27AE60',
                        fontWeight: 'bold',
                        marginBottom: 5,
                      }}
                    >
                      {meal.title}
                    </Text>
                    <Text style={{ color: '#DDD', lineHeight: 20 }}>
                      {meal.data || 'Plan girilmemiş.'}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={{ alignItems: 'center', marginTop: 50 }}>
                <Text style={{ fontSize: 50 }}>🍽️</Text>
                <Text
                  style={{ color: '#888', marginTop: 10, textAlign: 'center' }}
                >
                  Henüz sana özel bir beslenme programı atanmamış.
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => setShowDietModal(false)}
              style={[styles.close, { marginTop: 20 }]}
            >
              <Text style={{ color: 'white' }}>KAPAT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3. QR MODALI */}
      <Modal visible={showQRModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.mTitle}>GİRİŞ KARTINIZ 🆔</Text>
            <View
              style={{
                backgroundColor: 'white',
                padding: 20,
                borderRadius: 15,
                marginBottom: 20,
              }}
            >
              <QRCode value={user.uid} size={200} />
            </View>
            <Text
              style={{ color: '#FF8C00', fontWeight: 'bold', marginBottom: 25 }}
            >
              {user.uid}
            </Text>
            <TouchableOpacity
              onPress={() => setShowQRModal(false)}
              style={[styles.close, { backgroundColor: '#FF8C00' }]}
            >
              <Text style={{ color: 'black', fontWeight: 'bold' }}>KAPAT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 4. BİLDİRİM MODALI */}
      <Modal visible={showNotifications} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.mTitle}>BİLDİRİMLERİN 🔔</Text>
            <FlatList
              data={notifications}
              keyExtractor={item => item.key}
              style={{ width: '100%' }}
              renderItem={({ item }) => (
                <View
                  style={[styles.notifCard, !item.read && styles.notifUnread]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifMsg}>{item.message}</Text>
                    <Text style={styles.notifDate}>
                      {item.createdAt?.toDate().toLocaleString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteNotification(item.key)}
                    style={{ padding: 5 }}
                  >
                    <Text>🗑️</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <Text style={{ color: '#666', textAlign: 'center' }}>
                  Yeni bildirim yok.
                </Text>
              }
            />
            <TouchableOpacity
              onPress={() => setShowNotifications(false)}
              style={styles.close}
            >
              <Text style={{ color: 'white' }}>KAPAT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 5. EGZERSİZ DETAY MODALI */}
      <Modal
        visible={selectedExercise !== null}
        transparent
        animationType="fade"
      >
        <View style={styles.modalBg}>
          <View style={styles.detContent}>
            {selectedExercise && (
              <>
                <Text style={styles.mTitle}>{selectedExercise.name}</Text>
                <View
                  style={{
                    height: 200,
                    width: '100%',
                    backgroundColor: '#1a1a1a',
                    borderRadius: 15,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 15,
                  }}
                >
                  {selectedExercise.gifUrl ? (
                    <Image
                      source={{ uri: selectedExercise.gifUrl }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={{ fontSize: 50 }}>🏋️</Text>
                  )}
                </View>
                <ScrollView>
                  <Text style={styles.infLabel}>NASIL YAPILIR?</Text>
                  <Text style={{ color: '#DDD', marginBottom: 15 }}>
                    {exInfo?.desc}
                  </Text>
                  <Text style={styles.infLabel}>PÜF NOKTASI 💡</Text>
                  <Text style={{ color: '#CCC', fontStyle: 'italic' }}>
                    {exInfo?.tips}
                  </Text>
                </ScrollView>
                <TouchableOpacity
                  onPress={() => setSelectedExercise(null)}
                  style={[styles.close, { backgroundColor: '#FF8C00' }]}
                >
                  <Text style={{ color: 'black', fontWeight: 'bold' }}>
                    ANLAŞILDI
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* 6. FEEDBACK MODALI */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showFeedback}
        onRequestClose={() => setShowFeedback(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBg}
        >
          <View style={styles.modalContent}>
            <Text style={styles.mTitle}>BİZE ULAŞIN 📣</Text>
            <Text
              style={{ color: '#AAA', marginBottom: 15, textAlign: 'center' }}
            >
              Spor salonuyla ilgili istek, şikayet veya önerilerini doğrudan
              yönetime ilet.
            </Text>
            <TextInput
              style={styles.fbInput}
              placeholder="Mesajınızı buraya yazın..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              value={feedbackText}
              onChangeText={setFeedbackText}
            />
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={sendFeedback}
              disabled={sendingFeedback}
            >
              {sendingFeedback ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={{ color: 'white', fontWeight: 'bold' }}>
                  GÖNDER
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowFeedback(false)}
              style={[
                styles.close,
                {
                  marginTop: 10,
                  backgroundColor: 'transparent',
                  borderWidth: 1,
                  borderColor: '#444',
                },
              ]}
            >
              <Text style={{ color: '#888' }}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  center: {
    flex: 1,
    backgroundColor: '#121212',
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
  welcome: { color: '#888', fontSize: 12 },
  userName: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  iconBtn: {
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 45,
    height: 45,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  waterCard: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  waterTitle: { color: '#007AFF', fontWeight: 'bold' },
  waterSub: { color: '#666', fontSize: 10 },
  wBtn: {
    width: 30,
    height: 30,
    backgroundColor: '#333',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wTxt: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  leaderCard: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  sectTitle: { color: '#FF8C00', fontWeight: 'bold', marginBottom: 10 },
  lRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  lRank: { color: 'white', fontWeight: 'bold', width: 30 },

  // --- YENİ AI CARD STYLES ---
  aiCard: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3498DB',
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  aiTitle: { color: '#3498DB', fontWeight: 'bold', fontSize: 16 },
  aiTargetBadge: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  aiTargetText: { color: '#3498DB', fontSize: 10, fontWeight: 'bold' },
  aiRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'center' },
  aiDayBox: {
    backgroundColor: '#333',
    width: 60,
    paddingVertical: 5,
    borderRadius: 5,
    alignItems: 'center',
    marginRight: 10,
  },
  aiDayText: { color: '#FFF', fontWeight: 'bold', fontSize: 11 },
  aiContentText: { color: '#CCC', fontSize: 12, flex: 1 },
  aiFooterInfo: {
    color: '#666',
    fontSize: 10,
    textAlign: 'right',
    marginTop: 5,
    fontStyle: 'italic',
  },

  // 🔥 FAB STİLİ 🔥
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3498DB', // Mavi renk
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#3498DB',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 2,
    borderColor: 'white',
  },

  grid: { marginBottom: 20 },
  btn: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 24, marginBottom: 5 },
  btnTx: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  fbBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 15,
    marginBottom: 50,
    borderWidth: 1,
    borderColor: '#333',
  },
  logout: { position: 'absolute', bottom: 20, alignSelf: 'center' },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    padding: 15,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 25,
    padding: 20,
    alignItems: 'center',
    maxHeight: '90%',
    width: '100%',
    borderWidth: 1,
    borderColor: '#333',
    elevation: 10,
  },
  mTitle: {
    color: '#FF8C00',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  close: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#333',
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
  },
  closeBtnIcon: {
    backgroundColor: '#333',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayTab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 25,
    marginRight: 10,
    height: 40,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  dayTabActive: { backgroundColor: '#FF8C00', borderColor: '#FF8C00' },
  dayTabText: { color: '#888', fontWeight: 'bold', fontSize: 12 },
  proCard: {
    flexDirection: 'row',
    backgroundColor: '#252525',
    padding: 10,
    borderRadius: 18,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  proImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#444',
  },
  proImage: { width: '100%', height: '100%' },
  proName: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  proStats: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  proStatValue: { color: '#FF8C00', fontSize: 18, fontWeight: '900' },
  proStatLabel: {
    color: '#666',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 2,
  },
  tagBox: {
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  tagText: { color: '#007AFF', fontSize: 9, fontWeight: 'bold' },
  detContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 25,
    padding: 25,
    height: 'auto',
    width: '100%',
    borderWidth: 1,
    borderColor: '#444',
    elevation: 10,
  },
  infLabel: {
    color: '#FF8C00',
    fontWeight: '900',
    marginTop: 15,
    marginBottom: 8,
    letterSpacing: 1,
    fontSize: 14,
  },
  fbInput: {
    backgroundColor: '#2C2C2C',
    width: '100%',
    height: 120,
    borderRadius: 10,
    padding: 15,
    color: 'white',
    textAlignVertical: 'top',
    marginBottom: 15,
    fontSize: 16,
  },
  sendBtn: {
    backgroundColor: '#4CD964',
    width: '100%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  notifCard: {
    backgroundColor: '#2C2C2C',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderLeftWidth: 3,
    borderLeftColor: '#333',
  },
  notifUnread: { borderLeftColor: '#FF3B30', backgroundColor: '#2C2C2C' },
  notifTitle: { color: 'white', fontWeight: 'bold', marginBottom: 5 },
  notifMsg: { color: '#CCC', fontSize: 12, marginBottom: 5 },
  notifDate: { color: '#666', fontSize: 10 },
});

export default MemberScreen;

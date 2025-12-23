import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ✨ YENİ: Yerel Depolama

const ActiveWorkoutScreen = ({ navigation }) => {
  const [program, setProgram] = useState([]);
  const [loading, setLoading] = useState(true);
  // State: { 'hareketIndex_setIndex': { done: boolean, weight: string } }
  const [setLogs, setSetLogs] = useState({});
  const user = auth().currentUser;

  // ✨ YENİ: İlerleme Kaydetme Fonksiyonu
  const saveProgress = async (currentLogs, currentProgram) => {
    try {
      const dataToSave = {
        logs: currentLogs,
        program: currentProgram, // Program değişirse diye programı da kaydediyoruz
        date: new Date().getTime(),
      };
      await AsyncStorage.setItem('saved_workout', JSON.stringify(dataToSave));
    } catch (e) {
      console.log('Kaydetme hatası:', e);
    }
  };

  // ✨ YENİ: Kayıtlı Antrenmanı Temizleme
  const clearProgress = async () => {
    try {
      await AsyncStorage.removeItem('saved_workout');
    } catch (e) {
      console.log('Silme hatası:', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      // 1. Önce yerel hafızada yarım kalan var mı bak
      try {
        const savedData = await AsyncStorage.getItem('saved_workout');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          // 24 saatten eski kayıtları yok sayabiliriz (isteğe bağlı)

          Alert.alert(
            'Yarım Kalan Antrenman',
            'Önceki antrenmanınız yarım kalmış. Devam etmek ister misiniz?',
            [
              {
                text: 'Hayır, Yeni Başla',
                style: 'cancel',
                onPress: () => {
                  clearProgress(); // Eski kaydı sil
                  fetchProgramFromDb(); // Veritabanından sıfırdan çek
                },
              },
              {
                text: 'Evet, Devam Et',
                onPress: () => {
                  setProgram(parsed.program);
                  setSetLogs(parsed.logs);
                  setLoading(false);
                },
              },
            ],
          );
        } else {
          fetchProgramFromDb();
        }
      } catch (e) {
        fetchProgramFromDb();
      }
    };

    init();
  }, []);

  const fetchProgramFromDb = () => {
    firestore()
      .collection('users')
      .doc(user.uid)
      .get()
      .then(doc => {
        if (doc.exists) setProgram(doc.data().workoutProgram || []);
        setLoading(false);
      })
      .catch(e => {
        Alert.alert('Hata', 'Program çekilemedi.');
        setLoading(false);
      });
  };

  // Set işaretleme (Tamamlandı/Tamamlanmadı)
  const toggleSet = (exIndex, setIndex) => {
    const key = `${exIndex}_${setIndex}`;
    setSetLogs(prev => {
      const newState = {
        ...prev,
        [key]: {
          ...prev[key],
          done: !prev[key]?.done,
          weight: prev[key]?.weight || '', // Mevcut kiloyu koru
        },
      };
      saveProgress(newState, program); // ✨ YENİ: Her tıkta kaydet
      return newState;
    });
  };

  // Kilo güncelleme
  const updateWeight = (exIndex, setIndex, text) => {
    const key = `${exIndex}_${setIndex}`;
    setSetLogs(prev => {
      const newState = {
        ...prev,
        [key]: {
          ...prev[key],
          weight: text,
          done: prev[key]?.done || false, // Durumu koru
        },
      };
      saveProgress(newState, program); // ✨ YENİ: Her harfte kaydet
      return newState;
    });
  };

  const finishWorkout = async () => {
    // 1. En az bir set yapılmış mı kontrol et
    const hasActivity = Object.values(setLogs).some(log => log.done);
    if (!hasActivity) {
      Alert.alert('Uyarı', 'Henüz hiçbir seti tamamlamadınız.');
      return;
    }

    // 2. Veriyi Hazırla
    const detailedLog = program.map((exercise, exIndex) => {
      const sets = Array.from({ length: parseInt(exercise.sets) || 3 }).map(
        (_, setIndex) => {
          const key = `${exIndex}_${setIndex}`;
          const log = setLogs[key];
          return {
            setNo: setIndex + 1,
            plannedReps: exercise.reps,
            isDone: log?.done || false,
            weight: log?.weight || '0', // Girilen kilo (yoksa 0)
          };
        },
      );

      return {
        name: exercise.name,
        plannedSets: exercise.sets,
        plannedReps: exercise.reps,
        setsDone: sets.filter(s => s.isDone).length,
        sets: sets,
      };
    });

    // 3. Toplam Tonajı Hesapla
    const totalWeightLifted = detailedLog.reduce((acc, ex) => {
      return (
        acc +
        ex.sets.reduce((sAcc, set) => {
          return sAcc + (set.isDone ? parseFloat(set.weight) || 0 : 0);
        }, 0)
      );
    }, 0);

    try {
      const batch = firestore().batch();

      // A. Geçmişe ekle
      const historyRef = firestore().collection('workout_history').doc();
      batch.set(historyRef, {
        userId: user.uid,
        date: firestore.FieldValue.serverTimestamp(),
        programName: 'Günlük Antrenman',
        totalSetsDone: Object.values(setLogs).filter(l => l.done).length,
        detailedLog: detailedLog,
        totalWeightLifted: totalWeightLifted,
        fullName: user.displayName || 'Üye',
      });

      // B. Kullanıcı istatistiğini güncelle (Toplam Antrenman Sayısı)
      const userRef = firestore().collection('users').doc(user.uid);
      batch.update(userRef, {
        totalWorkouts: firestore.FieldValue.increment(1),
        lastWorkoutDate: firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();

      // ✨ YENİ: Başarılı olunca yerel kaydı sil
      await clearProgress();

      Alert.alert(
        'TEBRİKLER! 🎉',
        `Antrenman bitti! Toplam ${totalWeightLifted} kg kaldırdın.`,
        [{ text: 'Süper', onPress: () => navigation.goBack() }],
      );
    } catch (e) {
      Alert.alert('Hata', e.message);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FF8C00" size="large" />
      </View>
    );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <Text style={styles.header}>ANTRENMAN MODU 🔥</Text>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {program.map((item, exIndex) => (
          <View key={exIndex} style={styles.card}>
            <Text style={styles.exName}>{item.name}</Text>
            <View style={styles.setsContainer}>
              {Array.from({ length: parseInt(item.sets) || 3 }).map(
                (_, setIndex) => {
                  const key = `${exIndex}_${setIndex}`;
                  const log = setLogs[key];
                  const isDone = log?.done;

                  return (
                    <View key={setIndex} style={styles.setRow}>
                      {/* SOL TARA: SET BUTONU */}
                      <TouchableOpacity
                        style={[styles.setBox, isDone && styles.setDone]}
                        onPress={() => toggleSet(exIndex, setIndex)}
                      >
                        <Text
                          style={[styles.setText, isDone && { color: 'black' }]}
                        >
                          {setIndex + 1}. Set
                        </Text>
                        <Text
                          style={[
                            styles.repsText,
                            isDone && { color: 'black' },
                          ]}
                        >
                          {isDone ? '✅' : `${item.reps} Tk`}
                        </Text>
                      </TouchableOpacity>

                      {/* SAĞ TARAF: KİLO GİRİŞİ */}
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.weightInput}
                          placeholder="KG"
                          placeholderTextColor="#666"
                          keyboardType="numeric"
                          value={log?.weight || ''}
                          onChangeText={text =>
                            updateWeight(exIndex, setIndex, text)
                          }
                        />
                        <Text style={styles.kgLabel}>kg</Text>
                      </View>
                    </View>
                  );
                },
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.finishBtn} onPress={finishWorkout}>
        <Text style={styles.finishText}>ANTRENMANI BİTİR 🏁</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
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
    color: '#FF8C00',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  exName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  setsContainer: { flexDirection: 'column' },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'space-between',
    backgroundColor: '#252525',
    padding: 5,
    borderRadius: 8,
  },
  setBox: {
    width: 80,
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  setDone: { backgroundColor: '#4CD964', borderColor: '#4CD964' },
  setText: { color: '#AAA', fontSize: 10, fontWeight: 'bold' },
  repsText: { color: 'white', fontWeight: 'bold', marginTop: 2 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#444',
    height: 45,
    width: 100,
  },
  weightInput: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  kgLabel: {
    color: '#666',
    fontSize: 12,
    marginLeft: 5,
  },
  finishBtn: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FF8C00',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 5,
    zIndex: 10,
  },
  finishText: { color: 'black', fontWeight: 'bold', fontSize: 18 },
});

export default ActiveWorkoutScreen;

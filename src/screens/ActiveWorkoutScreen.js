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
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔥 ADIM 1: Tema Hook'unu İmport Et
import { useTheme } from '../context/ThemeContext';

const ActiveWorkoutScreen = ({ navigation }) => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, t, isDark } = useTheme();

  const [program, setProgram] = useState([]);
  const [loading, setLoading] = useState(true);
  const [setLogs, setSetLogs] = useState({});
  const user = auth().currentUser;

  const saveProgress = async (currentLogs, currentProgram) => {
    try {
      const dataToSave = {
        logs: currentLogs,
        program: currentProgram,
        date: new Date().getTime(),
      };
      await AsyncStorage.setItem('saved_workout', JSON.stringify(dataToSave));
    } catch (e) {
      console.log('Kaydetme hatası:', e);
    }
  };

  const clearProgress = async () => {
    try {
      await AsyncStorage.removeItem('saved_workout');
    } catch (e) {
      console.log('Silme hatası:', e);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const savedData = await AsyncStorage.getItem('saved_workout');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          Alert.alert(
            'Yarım Kalan Antrenman', // İstersen burayı da t.resumeWorkout gibi yapabilirsin
            'Önceki antrenmanınız yarım kalmış. Devam etmek ister misiniz?',
            [
              {
                text: t.cancel, // 🔥 Çeviri: İptal/Hayır
                style: 'cancel',
                onPress: () => {
                  clearProgress();
                  fetchProgramFromDb();
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

  const toggleSet = (exIndex, setIndex) => {
    const key = `${exIndex}_${setIndex}`;
    setSetLogs(prev => {
      const newState = {
        ...prev,
        [key]: {
          ...prev[key],
          done: !prev[key]?.done,
          weight: prev[key]?.weight || '',
        },
      };
      saveProgress(newState, program);
      return newState;
    });
  };

  const updateWeight = (exIndex, setIndex, text) => {
    const key = `${exIndex}_${setIndex}`;
    setSetLogs(prev => {
      const newState = {
        ...prev,
        [key]: {
          ...prev[key],
          weight: text,
          done: prev[key]?.done || false,
        },
      };
      saveProgress(newState, program);
      return newState;
    });
  };

  const finishWorkout = async () => {
    const hasActivity = Object.values(setLogs).some(log => log.done);
    if (!hasActivity) {
      Alert.alert('Uyarı', 'Henüz hiçbir seti tamamlamadınız.');
      return;
    }

    const detailedLog = program.map((exercise, exIndex) => {
      const sets = Array.from({ length: parseInt(exercise.sets) || 3 }).map(
        (_, setIndex) => {
          const key = `${exIndex}_${setIndex}`;
          const log = setLogs[key];
          return {
            setNo: setIndex + 1,
            plannedReps: exercise.reps,
            isDone: log?.done || false,
            weight: log?.weight || '0',
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

      const userRef = firestore().collection('users').doc(user.uid);
      batch.update(userRef, {
        totalWorkouts: firestore.FieldValue.increment(1),
        lastWorkoutDate: firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();
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
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]} // 🔥 Dinamik Arkaplan
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      {/* Başlık Rengi Dinamik */}
      <Text style={[styles.header, { color: theme.primary }]}>
        ANTRENMAN MODU 🔥
      </Text>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {program.map((item, exIndex) => (
          <View
            key={exIndex}
            style={[styles.card, { backgroundColor: theme.card }]}
          >
            <Text style={[styles.exName, { color: theme.text }]}>
              {item.name}
            </Text>

            <View style={styles.setsContainer}>
              {Array.from({ length: parseInt(item.sets) || 3 }).map(
                (_, setIndex) => {
                  const key = `${exIndex}_${setIndex}`;
                  const log = setLogs[key];
                  const isDone = log?.done;

                  return (
                    <View
                      key={setIndex}
                      style={[
                        styles.setRow,
                        { backgroundColor: isDark ? '#252525' : '#F0F0F0' },
                      ]}
                    >
                      {/* SOL TARA: SET BUTONU */}
                      <TouchableOpacity
                        style={[
                          styles.setBox,
                          {
                            backgroundColor: isDone
                              ? theme.success
                              : theme.inputBg,
                            borderColor: theme.border,
                          },
                        ]}
                        onPress={() => toggleSet(exIndex, setIndex)}
                      >
                        <Text
                          style={[
                            styles.setText,
                            { color: isDone ? 'white' : theme.subText },
                          ]}
                        >
                          {setIndex + 1}. Set
                        </Text>
                        <Text
                          style={[
                            styles.repsText,
                            { color: isDone ? 'white' : theme.text },
                          ]}
                        >
                          {isDone ? '✅' : `${item.reps} Tk`}
                        </Text>
                      </TouchableOpacity>

                      {/* SAĞ TARAF: KİLO GİRİŞİ */}
                      <View
                        style={[
                          styles.inputContainer,
                          {
                            backgroundColor: theme.card,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <TextInput
                          style={[styles.weightInput, { color: theme.text }]}
                          placeholder="KG"
                          placeholderTextColor={theme.subText}
                          keyboardType="numeric"
                          value={log?.weight || ''}
                          onChangeText={text =>
                            updateWeight(exIndex, setIndex, text)
                          }
                        />
                        <Text
                          style={[styles.kgLabel, { color: theme.subText }]}
                        >
                          kg
                        </Text>
                      </View>
                    </View>
                  );
                },
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.finishBtn, { backgroundColor: theme.primary }]}
        onPress={finishWorkout}
      >
        <Text style={styles.finishText}>ANTRENMANI BİTİR 🏁</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
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
  card: {
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF', // Bunu sabit bırakabiliriz veya theme.primary yapabiliriz
  },
  exName: {
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
    padding: 5,
    borderRadius: 8,
  },
  setBox: {
    width: 80,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  setText: { fontSize: 10, fontWeight: 'bold' },
  repsText: { fontWeight: 'bold', marginTop: 2 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    height: 45,
    width: 100,
  },
  weightInput: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  kgLabel: {
    fontSize: 12,
    marginLeft: 5,
  },
  finishBtn: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 5,
    zIndex: 10,
  },
  finishText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
});

export default ActiveWorkoutScreen;

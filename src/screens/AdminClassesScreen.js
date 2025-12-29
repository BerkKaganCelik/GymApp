import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

// 🔥 ADIM 1: Tema Hook'unu İmport Et
import { useTheme } from '../context/ThemeContext';

const AdminClassesScreen = ({ navigation }) => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, t, isDark } = useTheme();

  const [title, setTitle] = useState('');
  const [instructor, setInstructor] = useState('');
  const [time, setTime] = useState('');
  const [quota, setQuota] = useState('');
  const [level, setLevel] = useState('Başlangıç');
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    const sub = firestore()
      .collection('classes')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snap => {
        const list = [];
        if (snap) snap.forEach(d => list.push({ ...d.data(), key: d.id }));
        setClasses(list);
      });
    return () => sub();
  }, []);

  const createClass = async () => {
    if (!title || !time || !quota || !instructor) {
      Alert.alert('Eksik Bilgi', 'Tüm alanları doldurun.'); // İstersen t.missingInfo yapabilirsin
      return;
    }
    await firestore()
      .collection('classes')
      .add({
        title,
        instructor,
        time,
        quota: parseInt(quota),
        level,
        attendees: [],
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    setTitle('');
    setInstructor('');
    setTime('');
    setQuota('');
    Alert.alert('Başarılı', 'Ders açıldı.'); // İstersen t.success yapabilirsin
  };

  const getLevelColor = l =>
    l === 'Başlangıç' ? '#4CD964' : l === 'Orta' ? '#FF9500' : '#FF3B30';

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      {/* Başlık Dinamik */}
      <Text style={[styles.header, { color: theme.text }]}>
        {t.classMgmt || 'SINIF & DERS YÖNETİMİ'} 📅
      </Text>

      <View style={[styles.form, { backgroundColor: theme.card }]}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBg,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder="Ders Adı (Örn: Pilates)"
          placeholderTextColor={theme.subText}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBg,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder="Eğitmen Adı"
          placeholderTextColor={theme.subText}
          value={instructor}
          onChangeText={setInstructor}
        />
        <View style={{ flexDirection: 'row' }}>
          <TextInput
            style={[
              styles.input,
              {
                flex: 1,
                marginRight: 5,
                backgroundColor: theme.inputBg,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="Saat (19:00)"
            placeholderTextColor={theme.subText}
            value={time}
            onChangeText={setTime}
          />
          <TextInput
            style={[
              styles.input,
              {
                flex: 1,
                backgroundColor: theme.inputBg,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="Kontenjan"
            placeholderTextColor={theme.subText}
            keyboardType="numeric"
            value={quota}
            onChangeText={setQuota}
          />
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginBottom: 15,
          }}
        >
          {['Başlangıç', 'Orta', 'İleri'].map(l => (
            <TouchableOpacity
              key={l}
              onPress={() => setLevel(l)}
              style={{
                padding: 8,
                backgroundColor: level === l ? getLevelColor(l) : theme.inputBg, // Seçili değilse inputBg rengi
                borderRadius: 5,
              }}
            >
              <Text
                style={{
                  color: level === l ? 'black' : theme.subText,
                  fontSize: 12,
                  fontWeight: 'bold',
                }}
              >
                {l}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: theme.primary }]}
          onPress={createClass}
        >
          <Text style={styles.btnText}>SINIF OLUŞTUR</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={classes}
        keyExtractor={i => i.key}
        renderItem={({ item }) => {
          const count = item.attendees ? item.attendees.length : 0;
          const percentage = (count / item.quota) * 100;
          return (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('AdminClassDetail', {
                  classId: item.key,
                  className: item.title,
                })
              }
              style={[
                styles.card,
                {
                  backgroundColor: theme.card,
                  borderLeftColor: getLevelColor(item.level),
                }, // 🔥 Arkaplan dinamik
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: theme.text }]}>
                  {item.title}{' '}
                  <Text style={{ fontSize: 12, color: theme.subText }}>
                    ({item.level})
                  </Text>
                </Text>
                <Text style={[styles.ins, { color: theme.subText }]}>
                  Eğitmen: {item.instructor}
                </Text>
                <Text style={[styles.time, { color: theme.primary }]}>
                  🕒 {item.time}
                </Text>

                <View
                  style={[
                    styles.progressBg,
                    { backgroundColor: theme.inputBg },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${percentage}%`,
                        backgroundColor:
                          percentage >= 100 ? theme.danger : theme.success,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.quota, { color: theme.text }]}>
                  {count} / {item.quota} Kişi Kayıtlı
                </Text>
              </View>

              <View
                style={[styles.arrowBox, { backgroundColor: theme.inputBg }]}
              >
                <Text style={{ fontSize: 20 }}>➡️</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  form: {
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
  },
  input: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
  },
  createBtn: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: { color: 'white', fontWeight: 'bold' },
  card: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    alignItems: 'center',
  },
  title: { fontWeight: 'bold', fontSize: 16 },
  ins: { fontSize: 12, marginTop: 2 },
  time: { fontSize: 12, marginTop: 4 },
  quota: { fontSize: 10, marginTop: 4, textAlign: 'right' },
  arrowBox: {
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: { height: '100%' },
});

export default AdminClassesScreen;

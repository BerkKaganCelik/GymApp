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

const AdminClassesScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [instructor, setInstructor] = useState(''); // Yeni
  const [time, setTime] = useState('');
  const [quota, setQuota] = useState('');
  const [level, setLevel] = useState('Başlangıç'); // Yeni
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
      Alert.alert('Eksik Bilgi', 'Tüm alanları doldurun.');
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
    Alert.alert('Başarılı', 'Ders açıldı.');
  };

  const getLevelColor = l =>
    l === 'Başlangıç' ? '#4CD964' : l === 'Orta' ? '#FF9500' : '#FF3B30';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <Text style={styles.header}>SINIF & DERS YÖNETİMİ 📅</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Ders Adı (Örn: Pilates)"
          placeholderTextColor="#666"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Eğitmen Adı"
          placeholderTextColor="#666"
          value={instructor}
          onChangeText={setInstructor}
        />
        <View style={{ flexDirection: 'row' }}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 5 }]}
            placeholder="Saat (19:00)"
            placeholderTextColor="#666"
            value={time}
            onChangeText={setTime}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Kontenjan"
            placeholderTextColor="#666"
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
                backgroundColor: level === l ? getLevelColor(l) : '#333',
                borderRadius: 5,
              }}
            >
              <Text
                style={{
                  color: level === l ? 'black' : 'white',
                  fontSize: 12,
                  fontWeight: 'bold',
                }}
              >
                {l}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={createClass}>
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
              // ✨ GÜNCEL KOD: Detay ekranına yönlendiriyoruz
              onPress={() =>
                navigation.navigate('AdminClassDetail', {
                  classId: item.key,
                  className: item.title,
                })
              }
              style={[
                styles.card,
                { borderLeftColor: getLevelColor(item.level) },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  {item.title}{' '}
                  <Text style={{ fontSize: 12, color: '#888' }}>
                    ({item.level})
                  </Text>
                </Text>
                <Text style={styles.ins}>Eğitmen: {item.instructor}</Text>
                <Text style={styles.time}>🕒 {item.time}</Text>
                {/* Progress Bar */}
                <View style={styles.progressBg}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${percentage}%`,
                        backgroundColor:
                          percentage >= 100 ? '#FF3B30' : '#4CD964',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.quota}>
                  {count} / {item.quota} Kişi Kayıtlı
                </Text>
              </View>
              {/* Çöp kutusu yerine, kayıt silme işlemini detay ekranına taşıdık. */}
              <View style={styles.arrowBox}>
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
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#2C2C2C',
    color: 'white',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  createBtn: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: { color: 'white', fontWeight: 'bold' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    alignItems: 'center',
  },
  title: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  ins: { color: '#AAA', fontSize: 12, marginTop: 2 },
  time: { color: '#FF8C00', fontSize: 12, marginTop: 4 },
  quota: { color: 'white', fontSize: 10, marginTop: 4, textAlign: 'right' },
  arrowBox: {
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 8,
    marginLeft: 10,
  },
  progressBg: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: { height: '100%' },
});
export default AdminClassesScreen;

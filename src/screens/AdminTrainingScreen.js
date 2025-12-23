import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  TouchableOpacity, // <--- ÖNEMLİ
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { GROQ_API_KEY } from '@env';

const AdminTrainingScreen = () => {
  const [members, setMembers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Program Verileri
  const [target, setTarget] = useState('');
  const [level, setLevel] = useState('');
  const [day1, setDay1] = useState('');
  const [day2, setDay2] = useState('');
  const [day3, setDay3] = useState('');
  const [day4, setDay4] = useState('');

  useEffect(() => {
    const subscriber = firestore()
      .collection('users')
      .where('role', '==', 'member')
      .onSnapshot(querySnapshot => {
        const users = [];
        if (querySnapshot) {
          querySnapshot.forEach(doc => {
            users.push({ ...doc.data(), key: doc.id });
          });
        }
        setMembers(users);
      });
    return () => subscriber();
  }, []);

  const openProgramEditor = user => {
    console.log('Program editörü açılıyor:', user.fullName);
    setSelectedUser(user);
    const prog = user.trainingProgram || {};
    setTarget(prog.target || '');
    setLevel(prog.level || '');
    setDay1(prog.day1 || '');
    setDay2(prog.day2 || '');
    setDay3(prog.day3 || '');
    setDay4(prog.day4 || '');
    setModalVisible(true);
  };

  const generateTrainingWithAI = async () => {
    if (!GROQ_API_KEY) {
      Alert.alert(
        'HATA',
        'Groq API Anahtarı bulunamadı! .env dosyasını kontrol et.',
      );
      return;
    }
    if (!target) {
      Alert.alert('Eksik', 'Lütfen bir hedef girin (Örn: Hacim).');
      return;
    }

    setAiLoading(true);

    try {
      const prompt = `
        Sen profesyonel bir fitness antrenörüsün. Hedef: ${target}. Seviye: ${
        level || 'Orta'
      }.
        4 Günlük Türkçe antrenman programı yaz.
        KURAL: SADECE şu JSON formatında cevap ver:
        { "day1": "...", "day2": "...", "day3": "...", "day4": "..." }
      `;

      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content:
                  'Sen sadece JSON formatında cevap veren bir asistansın.',
              },
              { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
          }),
        },
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content;
        const result = JSON.parse(content);
        setDay1(result.day1);
        setDay2(result.day2);
        setDay3(result.day3);
        setDay4(result.day4);
        Alert.alert('BAŞARILI ⚡', 'Antrenman programı hazırlandı!');
      }
    } catch (error) {
      Alert.alert('HATA', error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveProgram = async () => {
    if (!selectedUser) return;
    try {
      await firestore()
        .collection('users')
        .doc(selectedUser.key)
        .update({
          trainingProgram: {
            target,
            level,
            day1,
            day2,
            day3,
            day4,
            lastUpdated: new Date().toISOString(),
          },
        });
      setModalVisible(false);
      Alert.alert('Kaydedildi ✅');
    } catch (error) {
      Alert.alert('Hata', error.message);
    }
  };

  // 🔥 GÜNCELLENEN KISIM: TouchableOpacity
  const renderMember = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => openProgramEditor(item)}
    >
      <View style={styles.avatar}>
        <Text style={{ fontSize: 18 }}>🏋️</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.fullName}</Text>
        <Text
          style={{
            color: item.trainingProgram ? '#4CD964' : '#E74C3C',
            fontSize: 12,
          }}
        >
          {item.trainingProgram ? '✅ Program Hazır' : '❌ Program Yok'}
        </Text>
      </View>
      <View style={styles.iconBox}>
        <Text style={{ fontSize: 16, color: 'white' }}>✏️</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Spor Koçu ⚡</Text>
      </View>

      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={item => item.key}
        contentContainerStyle={{ padding: 15 }}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedUser?.fullName}</Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  hitSlop={15}
                >
                  <Text style={{ color: '#888', fontSize: 16, padding: 5 }}>
                    Kapat ✖
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.label}>Hedef</Text>
                    <TextInput
                      style={styles.input}
                      value={target}
                      onChangeText={setTarget}
                      placeholder="Kas Kazanma"
                      placeholderTextColor="#555"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Seviye</Text>
                    <TextInput
                      style={styles.input}
                      value={level}
                      onChangeText={setLevel}
                      placeholder="Başlangıç"
                      placeholderTextColor="#555"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.aiButton}
                  onPress={generateTrainingWithAI}
                  disabled={aiLoading}
                >
                  {aiLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.aiButtonText}>
                      ⚡ ANTRENMAN OLUŞTUR
                    </Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.label}>1. Gün</Text>
                <TextInput
                  style={[styles.input, styles.area]}
                  value={day1}
                  onChangeText={setDay1}
                  multiline
                  placeholder="Bekleniyor..."
                  placeholderTextColor="#555"
                />

                <Text style={styles.label}>2. Gün</Text>
                <TextInput
                  style={[styles.input, styles.area]}
                  value={day2}
                  onChangeText={setDay2}
                  multiline
                  placeholder="Bekleniyor..."
                  placeholderTextColor="#555"
                />

                <Text style={styles.label}>3. Gün</Text>
                <TextInput
                  style={[styles.input, styles.area]}
                  value={day3}
                  onChangeText={setDay3}
                  multiline
                  placeholder="Bekleniyor..."
                  placeholderTextColor="#555"
                />

                <Text style={styles.label}>4. Gün</Text>
                <TextInput
                  style={[styles.input, styles.area]}
                  value={day4}
                  onChangeText={setDay4}
                  multiline
                  placeholder="Bekleniyor..."
                  placeholderTextColor="#555"
                />

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveProgram}
                >
                  <Text style={styles.saveText}>PROGRAMI KAYDET 💾</Text>
                </TouchableOpacity>
                <View style={{ height: 50 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    padding: 20,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  headerTitle: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    padding: 15,
    marginBottom: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  avatar: {
    width: 45,
    height: 45,
    backgroundColor: '#2C2C2C',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  name: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  iconBox: { backgroundColor: '#333', padding: 8, borderRadius: 8 },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    height: '92%',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: { color: '#3498DB', fontSize: 20, fontWeight: 'bold' },
  label: {
    color: '#AAA',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 12,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#252525',
    color: 'white',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  area: { height: 80, textAlignVertical: 'top' },
  aiButton: {
    backgroundColor: '#3498DB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 10,
  },
  aiButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  saveBtn: {
    backgroundColor: '#2ECC71',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 25,
  },
  saveText: { color: 'black', fontWeight: 'bold', fontSize: 16 },
});

export default AdminTrainingScreen;

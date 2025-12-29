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
  TouchableOpacity,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { GROQ_API_KEY } from '@env';

// 🔥 ADIM 1: Tema Hook'unu İmport Et
import { useTheme } from '../context/ThemeContext';

const AdminTrainingScreen = () => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, t, isDark } = useTheme();

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
      Alert.alert('Eksik', 'Lütfen bir hedef girin (Örn: Hacim).'); // İstersen t.missingInfo yapabilirsin
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

  const renderMember = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
      activeOpacity={0.7}
      onPress={() => openProgramEditor(item)}
    >
      <View style={[styles.avatar, { backgroundColor: theme.inputBg }]}>
        <Text style={{ fontSize: 18 }}>🏋️</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: theme.text }]}>
          {item.fullName}
        </Text>
        <Text
          style={{
            color: item.trainingProgram ? theme.success : theme.danger,
            fontSize: 12,
          }}
        >
          {item.trainingProgram ? '✅ Program Hazır' : '❌ Program Yok'}
        </Text>
      </View>
      <View style={[styles.iconBox, { backgroundColor: theme.inputBg }]}>
        <Text style={{ fontSize: 16, color: theme.text }}>✏️</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      <View
        style={[
          styles.header,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          AI Spor Koçu ⚡
        </Text>
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
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
            <View
              style={[styles.modalContent, { backgroundColor: theme.card }]}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.primary }]}>
                  {selectedUser?.fullName}
                </Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  hitSlop={15}
                >
                  <Text
                    style={{ color: theme.subText, fontSize: 16, padding: 5 }}
                  >
                    Kapat ✖
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={[styles.label, { color: theme.subText }]}>
                      {t.target || 'Hedef'}
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
                      value={target}
                      onChangeText={setTarget}
                      placeholder="Kas Kazanma"
                      placeholderTextColor={theme.subText}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.subText }]}>
                      Seviye
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
                      value={level}
                      onChangeText={setLevel}
                      placeholder="Başlangıç"
                      placeholderTextColor={theme.subText}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.aiButton, { backgroundColor: '#3498DB' }]}
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

                <Text style={[styles.label, { color: theme.subText }]}>
                  1. Gün
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.area,
                    {
                      backgroundColor: theme.inputBg,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  value={day1}
                  onChangeText={setDay1}
                  multiline
                  placeholder="Bekleniyor..."
                  placeholderTextColor={theme.subText}
                />

                <Text style={[styles.label, { color: theme.subText }]}>
                  2. Gün
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.area,
                    {
                      backgroundColor: theme.inputBg,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  value={day2}
                  onChangeText={setDay2}
                  multiline
                  placeholder="Bekleniyor..."
                  placeholderTextColor={theme.subText}
                />

                <Text style={[styles.label, { color: theme.subText }]}>
                  3. Gün
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.area,
                    {
                      backgroundColor: theme.inputBg,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  value={day3}
                  onChangeText={setDay3}
                  multiline
                  placeholder="Bekleniyor..."
                  placeholderTextColor={theme.subText}
                />

                <Text style={[styles.label, { color: theme.subText }]}>
                  4. Gün
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.area,
                    {
                      backgroundColor: theme.inputBg,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  value={day4}
                  onChangeText={setDay4}
                  multiline
                  placeholder="Bekleniyor..."
                  placeholderTextColor={theme.subText}
                />

                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: theme.success }]}
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
  container: { flex: 1 },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  card: {
    flexDirection: 'row',
    padding: 15,
    marginBottom: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  name: { fontWeight: 'bold', fontSize: 16 },
  iconBox: { padding: 8, borderRadius: 8 },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
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
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  label: {
    fontSize: 13,
    marginBottom: 6,
    marginTop: 12,
    fontWeight: 'bold',
  },
  input: {
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
  },
  area: { height: 80, textAlignVertical: 'top' },
  aiButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 10,
  },
  aiButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  saveBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 25,
  },
  saveText: { color: 'white', fontWeight: 'bold', fontSize: 16 }, // Siyah yazı bazen okunmayabilir, white yaptım
});

export default AdminTrainingScreen;

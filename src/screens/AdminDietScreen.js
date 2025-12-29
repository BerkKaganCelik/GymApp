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

const AdminDietScreen = () => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, t, isDark } = useTheme();

  const [members, setMembers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Form Verileri
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [breakfast, setBreakfast] = useState('');
  const [lunch, setLunch] = useState('');
  const [dinner, setDinner] = useState('');
  const [snacks, setSnacks] = useState('');

  useEffect(() => {
    const subscriber = firestore()
      .collection('users')
      .where('role', '==', 'member')
      .onSnapshot(querySnapshot => {
        const users = [];
        if (querySnapshot) {
          querySnapshot.forEach(doc =>
            users.push({ ...doc.data(), key: doc.id }),
          );
        }
        setMembers(users);
      });
    return () => subscriber();
  }, []);

  const openDietEditor = user => {
    console.log('Editör açılıyor:', user.fullName);
    setSelectedUser(user);
    const diet = user.dietProgram || {};
    setCalories(diet.calories ? diet.calories.toString() : '');
    setProtein(diet.protein ? diet.protein.toString() : '');
    setBreakfast(diet.breakfast || '');
    setLunch(diet.lunch || '');
    setDinner(diet.dinner || '');
    setSnacks(diet.snacks || '');
    setModalVisible(true);
  };

  const generateWithAI = async () => {
    if (!GROQ_API_KEY) {
      Alert.alert(
        'HATA',
        'Groq API Anahtarı bulunamadı! .env dosyasını kontrol et.',
      );
      return;
    }

    setAiLoading(true);

    try {
      const prompt = `
        Sen bir sporcu diyetisyenisin. Hedef: ${calories} kalori, ${protein} protein.
        Türkçe günlük yemek planı hazırla.
        KURAL: SADECE şu JSON formatında cevap ver:
        { "breakfast": "...", "lunch": "...", "dinner": "...", "snacks": "..." }
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
                  'Sen sadece JSON formatında cevap veren bir diyetisyensin.',
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
        setBreakfast(result.breakfast);
        setLunch(result.lunch);
        setDinner(result.dinner);
        setSnacks(result.snacks);
        Alert.alert('BAŞARILI 🎉', 'Diyet programı hazırlandı!');
      }
    } catch (error) {
      Alert.alert('HATA', error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveDiet = async () => {
    if (!selectedUser) return;
    try {
      await firestore()
        .collection('users')
        .doc(selectedUser.key)
        .update({
          dietProgram: {
            calories,
            protein,
            breakfast,
            lunch,
            dinner,
            snacks,
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
      onPress={() => openDietEditor(item)}
    >
      <View style={[styles.avatar, { backgroundColor: theme.inputBg }]}>
        <Text style={{ fontSize: 18 }}>👤</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: theme.text }]}>
          {item.fullName}
        </Text>
        <Text
          style={{
            color: item.dietProgram ? theme.success : theme.danger,
            fontSize: 12,
          }}
        >
          {item.dietProgram ? '✅ Program Hazır' : '❌ Program Yok'}
        </Text>
      </View>
      <View
        style={{ backgroundColor: theme.inputBg, padding: 8, borderRadius: 8 }}
      >
        <Text>✏️</Text>
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
          AI Diyetisyen 🍎
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
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={{ color: theme.subText, padding: 10 }}>
                    Kapat ✖
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View
                  style={{ flexDirection: 'row', gap: 10, marginVertical: 10 }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.subText }]}>
                      Kalori
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
                      value={calories}
                      onChangeText={setCalories}
                      keyboardType="numeric"
                      placeholder="2000"
                      placeholderTextColor={theme.subText}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.label, { color: theme.subText }]}>
                      Protein
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
                      value={protein}
                      onChangeText={setProtein}
                      keyboardType="numeric"
                      placeholder="150"
                      placeholderTextColor={theme.subText}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.aiButton,
                    { backgroundColor: '#8E44AD', borderColor: '#9B59B6' },
                  ]}
                  onPress={generateWithAI}
                  disabled={aiLoading}
                >
                  {aiLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.aiButtonText}>✨ GROQ İLE OLUŞTUR</Text>
                  )}
                </TouchableOpacity>

                <Text style={[styles.label, { color: theme.subText }]}>
                  Kahvaltı
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
                  value={breakfast}
                  onChangeText={setBreakfast}
                  multiline
                />

                <Text style={[styles.label, { color: theme.subText }]}>
                  Öğle
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
                  value={lunch}
                  onChangeText={setLunch}
                  multiline
                />

                <Text style={[styles.label, { color: theme.subText }]}>
                  Akşam
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
                  value={dinner}
                  onChangeText={setDinner}
                  multiline
                />

                <Text style={[styles.label, { color: theme.subText }]}>
                  Ara Öğün
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
                  value={snacks}
                  onChangeText={setSnacks}
                  multiline
                />

                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                  onPress={handleSaveDiet}
                >
                  <Text style={styles.saveText}>KAYDET</Text>
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
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  card: {
    flexDirection: 'row',
    padding: 15,
    marginBottom: 10,
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
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '90%',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  input: {
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    marginBottom: 10,
  },
  area: { height: 70, textAlignVertical: 'top' },
  aiButton: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
  },
  aiButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  saveBtn: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveText: { fontWeight: 'bold', color: 'black' },
  label: { marginBottom: 5, fontSize: 13, fontWeight: 'bold' },
});

export default AdminDietScreen;

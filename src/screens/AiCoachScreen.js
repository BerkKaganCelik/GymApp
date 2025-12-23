import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { GROQ_API_KEY } from '@env';

const AiCoachScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'Merhaba Sporcu! 👋 Ben senin AI Koçunum. Antrenman, beslenme veya motivasyon... Aklına takılan her şeyi sorabilirsin!',
      sender: 'ai',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef();

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    if (!GROQ_API_KEY) {
      Alert.alert(
        'Hata',
        'API Anahtarı bulunamadı! .env dosyasını kontrol et.',
      );
      return;
    }

    const userMsg = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
    };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputText;
    setInputText('');
    setLoading(true);

    try {
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
                  'Sen "GymPro" uygulamasının enerjik, motive edici ve profesyonel yapay zeka spor koçusun. Kısa ve öz Türkçe cevap ver.',
              },
              { role: 'user', content: currentInput },
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        },
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      if (data.choices && data.choices.length > 0) {
        const aiResponse = data.choices[0].message.content;
        const aiMsg = {
          id: (Date.now() + 1).toString(),
          text: aiResponse,
          sender: 'ai',
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (error) {
      Alert.alert('Hata', 'Koç şu an cevap veremiyor. İnternetini kontrol et.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isUser = item.sender === 'user';
    return (
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.aiBubble,
          { alignSelf: isUser ? 'flex-end' : 'flex-start' },
        ]}
      >
        <Text
          style={[styles.msgText, isUser ? styles.userText : styles.aiText]}
        >
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={{ fontSize: 20, color: 'white' }}>✕</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>AI KOÇ 🤖</Text>
          <Text style={styles.headerSub}>Anlık Cevap ⚡</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
        style={{ flex: 1 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={10}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Koça bir soru sor..."
            placeholderTextColor="#888"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: inputText ? '#3498DB' : '#444' },
            ]}
            onPress={sendMessage}
            disabled={!inputText || loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ fontSize: 20, color: 'white' }}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderColor: '#333',
  },
  backBtn: { padding: 10 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  headerSub: { color: '#4CD964', fontSize: 12 },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 15, marginBottom: 10 },
  userBubble: { backgroundColor: '#3498DB', borderBottomRightRadius: 2 },
  aiBubble: { backgroundColor: '#2C2C2C', borderBottomLeftRadius: 2 },
  msgText: { fontSize: 15, lineHeight: 22 },
  userText: { color: 'white' },
  aiText: { color: '#DDD' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1E1E1E',
    borderTopWidth: 1,
    borderColor: '#333',
  },
  input: {
    flex: 1,
    backgroundColor: '#2C2C2C',
    color: 'white',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendBtn: {
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});

export default AiCoachScreen;

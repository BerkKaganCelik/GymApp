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

// 🔥 ADIM 1: Tema Hook'unu İmport Et
import { useTheme } from '../context/ThemeContext';

const AiCoachScreen = ({ navigation }) => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, t, isDark } = useTheme();

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
          isUser
            ? {
                backgroundColor: theme.primary, // Kullanıcı mesajı (Tema Rengi)
                borderBottomRightRadius: 2,
                alignSelf: 'flex-end',
              }
            : {
                backgroundColor: theme.card, // AI mesajı (Kart Rengi)
                borderBottomLeftRadius: 2,
                alignSelf: 'flex-start',
              },
        ]}
      >
        <Text
          style={[
            styles.msgText,
            isUser
              ? { color: 'white' } // Kullanıcı yazısı her zaman beyaz (Primary üstünde)
              : { color: theme.text }, // AI yazısı temaya uygun
          ]}
        >
          {item.text}
        </Text>
      </View>
    );
  };

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
        {/* X Butonu Kaldırıldı çünkü artık Alt Menüdeyiz */}
        <View style={{ width: 10 }} />

        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            AI KOÇ 🤖
          </Text>
          <Text style={[styles.headerSub, { color: theme.primary }]}>
            Anlık Cevap ⚡
          </Text>
        </View>
        <View style={{ width: 10 }} />
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
        <View
          style={[
            styles.inputContainer,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.inputBg, color: theme.text },
            ]}
            placeholder="Koça bir soru sor..."
            placeholderTextColor={theme.subText}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              { backgroundColor: inputText ? theme.primary : theme.inputBg }, // Buton rengi
            ]}
            onPress={sendMessage}
            disabled={!inputText || loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                style={{
                  fontSize: 20,
                  color: inputText ? 'white' : theme.subText,
                }}
              >
                ➤
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerSub: { fontSize: 12 },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 15, marginBottom: 10 },
  msgText: { fontSize: 15, lineHeight: 22 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
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

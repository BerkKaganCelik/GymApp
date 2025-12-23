// src/screens/LoginScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Şifre Sıfırlama Modalı
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Alanları doldurun.');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await auth().signInWithEmailAndPassword(
        email,
        password,
      );
      const uid = userCredential.user.uid;
      const userDoc = await firestore().collection('users').doc(uid).get();

      if (userDoc.exists) {
        const data = userDoc.data();
        const role = data.role;
        const isActive = data.isActive === false ? false : true;
        const expiryTimestamp = data.membershipExpiry;
        const now = new Date();

        // 1. ROL KONTROLÜ
        if (role === 'admin') {
          navigation.replace('AdminHome');
        } else if (role === 'member') {
          // 2. ÜYELİK DURUMU KONTROLÜ
          if (!isActive) {
            auth().signOut();
            Alert.alert(
              'Giriş Reddedildi ⛔',
              'Üyeliğiniz dondurulmuş durumdadır. Lütfen yöneticinizle iletişime geçin.',
            );
            return;
          }

          if (expiryTimestamp) {
            const expiryDate = expiryTimestamp.toDate();
            if (expiryDate < now) {
              auth().signOut();
              Alert.alert(
                'Giriş Reddedildi ⚠️',
                `Üyelik süreniz ${expiryDate.toLocaleDateString(
                  'tr-TR',
                )} tarihinde dolmuştur.`,
              );
              return;
            }
          }

          // Başarılı: Üye paneline yönlendir.
          navigation.replace('MemberHome');
        } else {
          // Tanımsız kullanıcı rolü
          auth().signOut();
          Alert.alert('Yetkisiz Kullanıcı', 'Hesabınızın rolü tanımsızdır.');
        }
      } else {
        // Auth'ta var ama Firestore'da yoksa
        auth().signOut();
        Alert.alert('Hata', 'Kullanıcı verisi bulunamadı.');
      }
    } catch (error) {
      Alert.alert('Giriş Başarısız', 'E-mail veya şifre hatalı.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      Alert.alert('Eksik', 'Lütfen e-mail adresinizi yazın.');
      return;
    }
    try {
      await auth().sendPasswordResetEmail(resetEmail);
      Alert.alert(
        'E-Posta Gönderildi 📧',
        'Şifre sıfırlama linki e-mail adresine gönderildi. Spam kutunu kontrol etmeyi unutma!',
      );
      setShowForgot(false);
      setResetEmail('');
    } catch (error) {
      Alert.alert('Hata', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>IRON GYM</Text>
          <Text style={styles.subtitle}>HESABINA GİRİŞ YAP</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>E-MAIL ADRESİ</Text>
          <TextInput
            style={styles.input}
            placeholder="ornek@mail.com"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>ŞİFRE</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* ŞİFREMİ UNUTTUM LİNKİ */}
          <TouchableOpacity
            onPress={() => setShowForgot(true)}
            style={{ alignSelf: 'flex-end', marginBottom: 20 }}
          >
            <Text style={{ color: '#FF8C00', fontSize: 12 }}>
              Şifremi Unuttum?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.loginButtonText}>GİRİŞ YAP</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ŞİFRE SIFIRLAMA MODALI */}
      <Modal visible={showForgot} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ŞİFRE SIFIRLAMA 🔒</Text>
            <Text
              style={{ color: '#CCC', marginBottom: 15, textAlign: 'center' }}
            >
              Kayıtlı e-mail adresini gir, sana bir sıfırlama linki gönderelim.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="E-mail adresi"
              placeholderTextColor="#666"
              value={resetEmail}
              onChangeText={setResetEmail}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.loginButton, { marginTop: 10 }]}
              onPress={handleResetPassword}
            >
              <Text style={styles.loginButtonText}>LİNKİ GÖNDER</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowForgot(false)}
            >
              <Text style={{ color: '#666' }}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  header: { alignItems: 'center', marginBottom: 50 },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  subtitle: {
    color: '#FF8C00',
    fontSize: 14,
    letterSpacing: 4,
    marginTop: 5,
    fontWeight: 'bold',
  },
  form: { width: '100%' },
  label: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 5,
  },
  input: {
    backgroundColor: '#1E1E1E',
    color: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
    fontSize: 16,
    width: '100%',
  },
  loginButton: {
    backgroundColor: '#FF8C00',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF8C00',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    width: '100%',
  },
  loginButtonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  backButton: { marginTop: 20, alignItems: 'center' },
  backButtonText: { color: '#666' },

  // Modal
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 30,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF8C00',
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  closeBtn: { marginTop: 15, padding: 10 },
});

export default LoginScreen;

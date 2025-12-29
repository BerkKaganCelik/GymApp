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

// 🔥 ADIM 1: Tema Hook'unu İmport Et
import { useTheme } from '../context/ThemeContext';

const LoginScreen = ({ navigation }) => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, t, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Şifre Sıfırlama Modalı
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t.error || 'Hata', t.fillFields || 'Alanları doldurun.');
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
              t.accessDenied || 'Giriş Reddedildi ⛔',
              t.membershipFrozen ||
                'Üyeliğiniz dondurulmuş durumdadır. Lütfen yöneticinizle iletişime geçin.',
            );
            return;
          }

          if (expiryTimestamp) {
            const expiryDate = expiryTimestamp.toDate();
            if (expiryDate < now) {
              auth().signOut();
              Alert.alert(
                t.accessDenied || 'Giriş Reddedildi ⚠️',
                `${
                  t.membershipExpired || 'Üyelik süreniz dolmuştur:'
                } ${expiryDate.toLocaleDateString('tr-TR')}`,
              );
              return;
            }
          }

          // Başarılı: Üye paneline yönlendir.
          navigation.replace('MemberHome');
        } else {
          // Tanımsız kullanıcı rolü
          auth().signOut();
          Alert.alert(
            t.unauthorized || 'Yetkisiz Kullanıcı',
            'Hesabınızın rolü tanımsızdır.',
          );
        }
      } else {
        // Auth'ta var ama Firestore'da yoksa
        auth().signOut();
        Alert.alert(t.error || 'Hata', 'Kullanıcı verisi bulunamadı.');
      }
    } catch (error) {
      Alert.alert(
        t.loginFailed || 'Giriş Başarısız',
        'E-mail veya şifre hatalı.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      Alert.alert(t.missingInfo || 'Eksik', 'Lütfen e-mail adresinizi yazın.');
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
      Alert.alert(t.error || 'Hata', error.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          {/* Logo Yazısı */}
          <Text style={[styles.title, { color: theme.text }]}>IRON GYM</Text>
          <Text style={[styles.subtitle, { color: theme.primary }]}>
            {t.loginTitle || 'HESABINA GİRİŞ YAP'}
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: theme.subText }]}>
            {t.email || 'E-MAIL ADRESİ'}
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
            placeholder="ornek@mail.com"
            placeholderTextColor={theme.subText}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={[styles.label, { color: theme.subText }]}>
            {t.password || 'ŞİFRE'}
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
            placeholder="••••••"
            placeholderTextColor={theme.subText}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* ŞİFREMİ UNUTTUM LİNKİ */}
          <TouchableOpacity
            onPress={() => setShowForgot(true)}
            style={{ alignSelf: 'flex-end', marginBottom: 20 }}
          >
            <Text style={{ color: theme.primary, fontSize: 12 }}>
              {t.forgotPassword || 'Şifremi Unuttum?'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: theme.primary }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.bg} />
            ) : (
              <Text style={[styles.loginButtonText, { color: theme.bg }]}>
                {t.login || 'GİRİŞ YAP'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backButtonText, { color: theme.subText }]}>
              {t.goBack || 'Geri Dön'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ŞİFRE SIFIRLAMA MODALI */}
      <Modal visible={showForgot} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.card, borderColor: theme.primary },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {t.resetPasswordTitle || 'ŞİFRE SIFIRLAMA'} 🔒
            </Text>
            <Text
              style={{
                color: theme.subText,
                marginBottom: 15,
                textAlign: 'center',
              }}
            >
              {t.resetPasswordDesc ||
                'Kayıtlı e-mail adresini gir, sana bir sıfırlama linki gönderelim.'}
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
              placeholder="E-mail adresi"
              placeholderTextColor={theme.subText}
              value={resetEmail}
              onChangeText={setResetEmail}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[
                styles.loginButton,
                { marginTop: 10, backgroundColor: theme.primary },
              ]}
              onPress={handleResetPassword}
            >
              <Text style={[styles.loginButtonText, { color: theme.bg }]}>
                {t.sendLink || 'LİNKİ GÖNDER'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowForgot(false)}
            >
              <Text style={{ color: theme.subText }}>
                {t.cancel || 'Vazgeç'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  header: { alignItems: 'center', marginBottom: 50 },
  title: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 14,
    letterSpacing: 4,
    marginTop: 5,
    fontWeight: 'bold',
  },
  form: { width: '100%' },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 5,
  },
  input: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    fontSize: 16,
    width: '100%',
  },
  loginButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    width: '100%',
  },
  loginButtonText: { fontWeight: 'bold', fontSize: 16 },
  backButton: { marginTop: 20, alignItems: 'center' },
  backButtonText: {},

  // Modal
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 30,
  },
  modalContent: {
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  closeBtn: { marginTop: 15, padding: 10 },
});

export default LoginScreen;

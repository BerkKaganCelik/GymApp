import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  Image,
  ActivityIndicator,
  ScrollView,
  Platform,
  Switch,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { launchImageLibrary } from 'react-native-image-picker';

// 🔥 ADIM 1: Tema Hook'unu İmport Et
import { useTheme } from '../context/ThemeContext';

const SettingsScreen = ({ navigation }) => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, isDark, toggleTheme, lang, setLanguage, t } = useTheme();

  const user = auth().currentUser;
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    firestore()
      .collection('users')
      .doc(user.uid)
      .get()
      .then(doc => {
        if (doc.exists) {
          const data = doc.data();
          setFullName(data.fullName);
          setPhone(data.phone);
          setPhotoUrl(data.profileImage);
        }
      });
  }, []);

  const changePhoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, async response => {
      if (response.assets) {
        setLoading(true);
        const uri = response.assets[0].uri;
        const filename = `profiles/${user.uid}.jpg`;
        const uploadUri =
          Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
        try {
          await storage().ref(filename).putFile(uploadUri);
          const url = await storage().ref(filename).getDownloadURL();
          setPhotoUrl(url);
          await firestore()
            .collection('users')
            .doc(user.uid)
            .update({ profileImage: url });
          Alert.alert(
            t.success || 'Başarılı',
            t.photoUpdated || 'Profil fotoğrafı güncellendi.',
          );
        } catch (e) {
          Alert.alert(t.error || 'Hata', e.message);
        }
        setLoading(false);
      }
    });
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      await firestore()
        .collection('users')
        .doc(user.uid)
        .update({ fullName, phone });
      if (newPassword.length > 0) {
        if (newPassword.length < 6)
          throw new Error(
            t.passLengthError || 'Şifre en az 6 karakter olmalı.',
          );
        await user.updatePassword(newPassword);
        Alert.alert(
          t.success || 'Başarılı',
          t.passwordUpdated || 'Şifre güncellendi! Lütfen tekrar giriş yapın.',
        );
        auth().signOut();
        navigation.replace('Welcome');
        return;
      }
      Alert.alert(
        t.success || 'Başarılı',
        t.profileUpdated || 'Profil bilgileri güncellendi.',
      );
    } catch (e) {
      Alert.alert(t.error || 'Hata', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t.logoutTitle || 'Çıkış Yap',
      t.logoutConfirm || 'Çıkış yapmak istediğine emin misin?',
      [
        { text: t.cancel || 'İptal', style: 'cancel' },
        {
          text: t.logout || 'Çıkış',
          style: 'destructive',
          onPress: () => {
            auth().signOut();
            navigation.replace('Welcome');
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />
      <Text style={[styles.header, { color: theme.text }]}>
        {t.settingsTitle || 'AYARLAR'}
      </Text>

      <ScrollView
        contentContainerStyle={{ alignItems: 'center', paddingBottom: 50 }}
      >
        {/* --- TEMA VE DİL AYARLARI KARTI --- */}
        <View
          style={[
            styles.prefCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          {/* Karanlık Mod Switch */}
          <View style={styles.prefRow}>
            <Text style={[styles.prefText, { color: theme.text }]}>
              🌙 {t.theme || 'Tema'}
            </Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: theme.primary }}
              thumbColor={isDark ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Dil Seçimi */}
          <View style={styles.prefRow}>
            <Text style={[styles.prefText, { color: theme.text }]}>
              🌍 {t.language || 'Dil'}
            </Text>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                style={[
                  styles.langBtn,
                  lang === 'tr' && {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.primary,
                  }, // Aktif dil stili
                ]}
                onPress={() => setLanguage('tr')}
              >
                <Text style={{ fontSize: 20 }}>🇹🇷</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.langBtn,
                  lang === 'en' && {
                    backgroundColor: theme.inputBg,
                    borderColor: theme.primary,
                  }, // Aktif dil stili
                  { marginLeft: 10 },
                ]}
                onPress={() => setLanguage('en')}
              >
                <Text style={{ fontSize: 20 }}>🇬🇧</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={changePhoto}
          style={[
            styles.avatarBox,
            { borderColor: theme.primary, backgroundColor: theme.inputBg },
          ]}
        >
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatar} />
          ) : (
            <Text style={{ fontSize: 40 }}>📷</Text>
          )}
          <View style={[styles.editIcon, { backgroundColor: theme.card }]}>
            <Text>✏️</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.form}>
          <Text style={[styles.label, { color: theme.subText }]}>
            {t.fullName || 'AD SOYAD'}
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
            value={fullName}
            onChangeText={setFullName}
            placeholderTextColor={theme.subText}
          />

          <Text style={[styles.label, { color: theme.subText }]}>
            {t.phone || 'TELEFON'}
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
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor={theme.subText}
          />

          <Text style={[styles.label, { marginTop: 20, color: theme.danger }]}>
            {t.newPass || 'YENİ ŞİFRE (Opsiyonel)'}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: theme.danger,
                backgroundColor: theme.inputBg,
                color: theme.text,
              },
            ]}
            placeholder={t.passPlace || 'Değiştirmek istemiyorsan boş bırak'}
            placeholderTextColor={theme.subText}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: theme.primary }]}
          onPress={saveProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="black" />
          ) : (
            <Text style={styles.saveText}>{t.save || 'KAYDET'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.logoutBtn,
            { backgroundColor: theme.inputBg, borderColor: theme.danger },
          ]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutText, { color: theme.danger }]}>
            {t.logout || 'ÇIKIŞ YAP'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: theme.subText }}>{t.back || 'Geri Dön'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  prefCard: {
    width: '100%',
    borderRadius: 15,
    padding: 15,
    marginBottom: 30,
    borderWidth: 1,
  },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  prefText: { fontWeight: 'bold', fontSize: 16 },
  divider: { height: 1, width: '100%', marginVertical: 10 },
  langBtn: {
    padding: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  avatarBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
  },
  avatar: { width: '100%', height: '100%', borderRadius: 50 },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 10,
    padding: 2,
  },
  form: { width: '100%' },
  label: {
    fontSize: 12,
    marginBottom: 5,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  input: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
  },
  saveBtn: {
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  saveText: { color: 'black', fontWeight: 'bold' },
  logoutBtn: {
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
  },
  logoutText: { fontWeight: 'bold' },
  backBtn: { marginTop: 20 },
});

export default SettingsScreen;

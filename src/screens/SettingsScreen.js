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
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { launchImageLibrary } from 'react-native-image-picker';

const SettingsScreen = ({ navigation }) => {
  const user = auth().currentUser;
  const [loading, setLoading] = useState(false);

  // Form Verileri
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState(null);

  // Şifre Değiştirme
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
          Alert.alert('Başarılı', 'Profil fotoğrafı güncellendi.');
        } catch (e) {
          Alert.alert('Hata', e.message);
        }
        setLoading(false);
      }
    });
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      // 1. Bilgileri Güncelle
      await firestore()
        .collection('users')
        .doc(user.uid)
        .update({ fullName, phone });

      // 2. Şifre varsa güncelle
      if (newPassword.length > 0) {
        if (newPassword.length < 6)
          throw new Error('Şifre en az 6 karakter olmalı.');
        await user.updatePassword(newPassword);
        Alert.alert(
          'Başarılı',
          'Profil ve Şifre güncellendi! Lütfen tekrar giriş yapın.',
        );
        auth().signOut();
        navigation.replace('Welcome');
        return;
      }
      Alert.alert('Başarılı', 'Profil bilgileri güncellendi.');
    } catch (e) {
      Alert.alert('Hata', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <Text style={styles.header}>AYARLAR ⚙️</Text>

      <ScrollView contentContainerStyle={{ alignItems: 'center' }}>
        <TouchableOpacity onPress={changePhoto} style={styles.avatarBox}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatar} />
          ) : (
            <Text style={{ fontSize: 40 }}>📷</Text>
          )}
          <View style={styles.editIcon}>
            <Text>✏️</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.form}>
          <Text style={styles.label}>AD SOYAD</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>TELEFON</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={[styles.label, { marginTop: 20, color: '#FF3B30' }]}>
            YENİ ŞİFRE (Opsiyonel)
          </Text>
          <TextInput
            style={[styles.input, { borderColor: '#FF3B30' }]}
            placeholder="Değiştirmek istemiyorsan boş bırak"
            placeholderTextColor="#555"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={saveProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="black" />
          ) : (
            <Text style={styles.saveText}>KAYDET</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: '#666' }}>İptal</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  avatarBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#FF8C00',
  },
  avatar: { width: '100%', height: '100%', borderRadius: 50 },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 2,
  },
  form: { width: '100%' },
  label: {
    color: '#888',
    fontSize: 12,
    marginBottom: 5,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  input: {
    backgroundColor: '#1E1E1E',
    color: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  saveBtn: {
    backgroundColor: '#FF8C00',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  saveText: { color: 'black', fontWeight: 'bold' },
  backBtn: { marginTop: 20 },
});

export default SettingsScreen;

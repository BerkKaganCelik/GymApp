import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { launchImageLibrary } from 'react-native-image-picker';

// 🔥 ADIM 1: Tema Hook'unu İmport Et
import { useTheme } from '../context/ThemeContext';

const MEMBERSHIP_PACKAGES = [
  { id: 'p1', name: 'Başlangıç (1 Ay)', months: 1, price: 1500 },
  { id: 'p2', name: 'Standart (3 Ay)', months: 3, price: 4000 },
  { id: 'p3', name: 'Gold (6 Ay)', months: 6, price: 7500 },
  { id: 'p4', name: 'VIP (12 Ay)', months: 12, price: 12000 },
];

const AddMemberScreen = ({ navigation }) => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, t, isDark } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Erkek');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [healthNotes, setHealthNotes] = useState('');

  const [selectedPackage, setSelectedPackage] = useState(null);
  const [customPrice, setCustomPrice] = useState('');

  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState(null);

  const selectImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, response => {
      if (response.assets && response.assets.length > 0) {
        setImageUri(response.assets[0].uri);
      }
    });
  };

  const handleSelectPackage = pkg => {
    setSelectedPackage(pkg);
    setCustomPrice(pkg.price.toString());
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !phone) {
      Alert.alert('Eksik Bilgi', 'Ad, Email, Şifre ve Telefon zorunludur.');
      return;
    }
    if (!selectedPackage) {
      Alert.alert('Paket Seçilmedi', 'Lütfen bir üyelik paketi seçiniz.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );
      const newUserId = userCredential.user.uid;

      console.log('Oluşturulan Üye ID:', newUserId);

      let profileImageUrl = null;

      if (imageUri) {
        const filename = `profiles/${newUserId}.jpg`;
        const uploadUri =
          Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri;

        await storage().ref(filename).putFile(uploadUri);
        profileImageUrl = await storage().ref(filename).getDownloadURL();
      }

      const membershipEndDate = new Date();
      membershipEndDate.setMonth(
        membershipEndDate.getMonth() + selectedPackage.months,
      );

      await firestore().collection('users').doc(newUserId).set({
        fullName: name,
        email: email,
        phone: phone,
        gender: gender,
        role: 'member',
        emergencyContact: emergencyContact,
        healthNotes: healthNotes,
        membershipMonths: selectedPackage.months,
        pricePaid: customPrice,
        packageId: selectedPackage.name,
        joinDate: firestore.FieldValue.serverTimestamp(),
        membershipEndDate: membershipEndDate.toISOString(),
        profileImage: profileImageUrl,
        dietProgram: null,
      });

      Alert.alert('Başarılı 🎉', `${name} adlı üye başarıyla kaydedildi!`, [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error(error);
      let errorMessage = 'Bir hata oluştu.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Bu email adresi zaten kullanımda.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Geçersiz email adresi.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Şifre çok zayıf (en az 6 karakter).';
      }
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        {/* Başlık Rengi Dinamik */}
        <Text style={[styles.header, { color: theme.text }]}>
          {t.addMember}
        </Text>

        {/* FOTOĞRAF ALANI */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity
            onPress={selectImage}
            style={[
              styles.avatarContainer,
              { backgroundColor: theme.inputBg, borderColor: theme.primary },
            ]}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarText}>📷</Text>
            )}
          </TouchableOpacity>
          <Text style={{ color: theme.subText, fontSize: 12, marginTop: 5 }}>
            {t.changePhoto || 'Fotoğraf Seçmek İçin Dokun'}
          </Text>
        </View>

        {/* KİŞİSEL BİLGİLER */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          KİŞİSEL BİLGİLER
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.card,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder={t.fullName}
          placeholderTextColor={theme.subText}
          value={name}
          onChangeText={setName}
        />

        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.genderBtn,
              { backgroundColor: theme.card, borderColor: theme.border },
              gender === 'Erkek' && {
                backgroundColor: theme.primary,
                borderColor: theme.primary,
              },
            ]}
            onPress={() => setGender('Erkek')}
          >
            <Text
              style={[
                styles.genderText,
                { color: theme.text },
                gender === 'Erkek' && { color: 'black' }, // Seçili olunca siyah kalsın
              ]}
            >
              ERKEK 🚹
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.genderBtn,
              { backgroundColor: theme.card, borderColor: theme.border },
              gender === 'Kadın' && {
                backgroundColor: theme.primary,
                borderColor: theme.primary,
              },
            ]}
            onPress={() => setGender('Kadın')}
          >
            <Text
              style={[
                styles.genderText,
                { color: theme.text },
                gender === 'Kadın' && { color: 'black' },
              ]}
            >
              KADIN 🚺
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.card,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder={`${t.phone} (5XX...)`}
          placeholderTextColor={theme.subText}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        {/* GİRİŞ BİLGİLERİ */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          GİRİŞ BİLGİLERİ
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.card,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder="E-mail Adresi"
          placeholderTextColor={theme.subText}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.card,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder="Şifre (Min 6 Karakter)"
          placeholderTextColor={theme.subText}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {/* SAĞLIK VE ACİL DURUM */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          SAĞLIK & GÜVENLİK
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.card,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder="Acil Durumda Aranacak Kişi"
          placeholderTextColor={theme.subText}
          value={emergencyContact}
          onChangeText={setEmergencyContact}
        />
        <TextInput
          style={[
            styles.input,
            {
              height: 60,
              backgroundColor: theme.card,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder="Sağlık Notları"
          placeholderTextColor={theme.subText}
          multiline
          value={healthNotes}
          onChangeText={setHealthNotes}
        />

        {/* PAKET SEÇİMİ */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          ÜYELİK PAKETİ SEÇİN 💳
        </Text>
        <View style={styles.packageGrid}>
          {MEMBERSHIP_PACKAGES.map(pkg => (
            <TouchableOpacity
              key={pkg.id}
              style={[
                styles.pkgCard,
                { backgroundColor: theme.card, borderColor: theme.border },
                selectedPackage?.id === pkg.id && {
                  backgroundColor: theme.success,
                  borderColor: theme.success,
                },
              ]}
              onPress={() => handleSelectPackage(pkg)}
            >
              <Text
                style={[
                  styles.pkgName,
                  { color: theme.text },
                  selectedPackage?.id === pkg.id && { color: 'black' },
                ]}
              >
                {pkg.name}
              </Text>
              <Text
                style={[
                  styles.pkgPrice,
                  { color: theme.primary },
                  selectedPackage?.id === pkg.id && { color: 'black' },
                ]}
              >
                {pkg.price} ₺
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FİYAT MÜDAHALESİ */}
        {selectedPackage && (
          <View
            style={[
              styles.priceContainer,
              { backgroundColor: theme.inputBg, borderColor: theme.border },
            ]}
          >
            <Text style={{ color: theme.subText, marginBottom: 5 }}>
              Tahsil Edilecek Tutar:
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={[
                  styles.priceInput,
                  {
                    backgroundColor: theme.bg,
                    color: theme.success,
                    borderColor: theme.border,
                  },
                ]}
                value={customPrice}
                onChangeText={setCustomPrice}
                keyboardType="numeric"
              />
              <Text
                style={{
                  color: theme.text,
                  fontSize: 20,
                  marginLeft: 10,
                  fontWeight: 'bold',
                }}
              >
                TL
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="black" />
          ) : (
            <Text style={styles.saveButtonText}>{t.save}</Text>
          )}
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
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: 1,
  },
  input: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  avatarText: { fontSize: 40 },
  genderBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
  },
  genderText: { fontWeight: 'bold', fontSize: 12 },
  packageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  pkgCard: {
    width: '48%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    alignItems: 'center',
  },
  pkgName: { fontWeight: 'bold', marginBottom: 5 },
  pkgPrice: { fontWeight: 'bold', fontSize: 16 },
  priceContainer: {
    marginTop: 10,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
  },
  priceInput: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    textAlign: 'right',
    borderWidth: 1,
  },
  saveButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  saveButtonText: { color: 'black', fontWeight: 'bold', fontSize: 16 },
});

export default AddMemberScreen;

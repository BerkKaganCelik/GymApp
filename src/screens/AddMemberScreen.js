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

// ✨ DÜZELTME: 'functions' paketini kaldırdık. Standart Auth ve Firestore kullanıyoruz.
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { launchImageLibrary } from 'react-native-image-picker';

const MEMBERSHIP_PACKAGES = [
  { id: 'p1', name: 'Başlangıç (1 Ay)', months: 1, price: 1500 },
  { id: 'p2', name: 'Standart (3 Ay)', months: 3, price: 4000 },
  { id: 'p3', name: 'Gold (6 Ay)', months: 6, price: 7500 },
  { id: 'p4', name: 'VIP (12 Ay)', months: 12, price: 12000 },
];

const AddMemberScreen = ({ navigation }) => {
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

  // --- KAYIT İŞLEMİ (STANDART FIREBASE) ---
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
      // 1. Kullanıcıyı Firebase Authentication'a Kaydet
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );
      const newUserId = userCredential.user.uid;

      console.log('Oluşturulan Üye ID:', newUserId);

      let profileImageUrl = null;

      // 2. Fotoğraf Yükleme (Varsa)
      if (imageUri) {
        const filename = `profiles/${newUserId}.jpg`;
        const uploadUri =
          Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri;

        await storage().ref(filename).putFile(uploadUri);
        profileImageUrl = await storage().ref(filename).getDownloadURL();
      }

      // 3. Kullanıcı Bilgilerini Firestore'a Kaydet
      // (functions kullanmak yerine doğrudan veritabanına yazıyoruz)
      const membershipEndDate = new Date();
      membershipEndDate.setMonth(
        membershipEndDate.getMonth() + selectedPackage.months,
      );

      await firestore().collection('users').doc(newUserId).set({
        fullName: name,
        email: email,
        phone: phone,
        gender: gender,
        role: 'member', // Rolünü üye olarak belirle
        emergencyContact: emergencyContact,
        healthNotes: healthNotes,
        membershipMonths: selectedPackage.months,
        pricePaid: customPrice,
        packageId: selectedPackage.name,
        joinDate: firestore.FieldValue.serverTimestamp(),
        membershipEndDate: membershipEndDate.toISOString(),
        profileImage: profileImageUrl,
        dietProgram: null, // Başlangıçta diyet programı yok
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        <Text style={styles.header}>YENİ ÜYE KAYDI 📝</Text>

        {/* FOTOĞRAF ALANI */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity
            onPress={selectImage}
            style={styles.avatarContainer}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarText}>📷</Text>
            )}
          </TouchableOpacity>
          <Text style={{ color: '#666', fontSize: 12, marginTop: 5 }}>
            Fotoğraf Seçmek İçin Dokun
          </Text>
        </View>

        {/* KİŞİSEL BİLGİLER */}
        <Text style={styles.sectionTitle}>KİŞİSEL BİLGİLER</Text>
        <TextInput
          style={styles.input}
          placeholder="Ad Soyad"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
        />

        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.genderBtn,
              gender === 'Erkek' && styles.genderBtnSelected,
            ]}
            onPress={() => setGender('Erkek')}
          >
            <Text
              style={[
                styles.genderText,
                gender === 'Erkek' && { color: 'black' },
              ]}
            >
              ERKEK 🚹
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.genderBtn,
              gender === 'Kadın' && styles.genderBtnSelected,
            ]}
            onPress={() => setGender('Kadın')}
          >
            <Text
              style={[
                styles.genderText,
                gender === 'Kadın' && { color: 'black' },
              ]}
            >
              KADIN 🚺
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Telefon (5XX...)"
          placeholderTextColor="#666"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        {/* GİRİŞ BİLGİLERİ */}
        <Text style={styles.sectionTitle}>GİRİŞ BİLGİLERİ</Text>
        <TextInput
          style={styles.input}
          placeholder="E-mail Adresi"
          placeholderTextColor="#666"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Şifre (Min 6 Karakter)"
          placeholderTextColor="#666"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {/* SAĞLIK VE ACİL DURUM */}
        <Text style={styles.sectionTitle}>SAĞLIK & GÜVENLİK</Text>
        <TextInput
          style={styles.input}
          placeholder="Acil Durumda Aranacak Kişi"
          placeholderTextColor="#666"
          value={emergencyContact}
          onChangeText={setEmergencyContact}
        />
        <TextInput
          style={[styles.input, { height: 60 }]}
          placeholder="Sağlık Notları"
          placeholderTextColor="#666"
          multiline
          value={healthNotes}
          onChangeText={setHealthNotes}
        />

        {/* PAKET SEÇİMİ */}
        <Text style={styles.sectionTitle}>ÜYELİK PAKETİ SEÇİN 💳</Text>
        <View style={styles.packageGrid}>
          {MEMBERSHIP_PACKAGES.map(pkg => (
            <TouchableOpacity
              key={pkg.id}
              style={[
                styles.pkgCard,
                selectedPackage?.id === pkg.id && styles.pkgCardSelected,
              ]}
              onPress={() => handleSelectPackage(pkg)}
            >
              <Text
                style={[
                  styles.pkgName,
                  selectedPackage?.id === pkg.id && { color: 'black' },
                ]}
              >
                {pkg.name}
              </Text>
              <Text
                style={[
                  styles.pkgPrice,
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
          <View style={styles.priceContainer}>
            <Text style={{ color: '#888', marginBottom: 5 }}>
              Tahsil Edilecek Tutar:
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={styles.priceInput}
                value={customPrice}
                onChangeText={setCustomPrice}
                keyboardType="numeric"
              />
              <Text
                style={{
                  color: 'white',
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
          style={styles.saveButton}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="black" />
          ) : (
            <Text style={styles.saveButtonText}>KAYDI TAMAMLA ✅</Text>
          )}
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
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#FF8C00',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#1E1E1E',
    color: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
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
    backgroundColor: '#2C2C2C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF8C00',
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  avatarText: { fontSize: 40 },
  genderBtn: {
    flex: 1,
    padding: 12,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  genderBtnSelected: { backgroundColor: '#FF8C00', borderColor: '#FF8C00' },
  genderText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  packageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  pkgCard: {
    width: '48%',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
  },
  pkgCardSelected: { backgroundColor: '#4CD964', borderColor: '#4CD964' },
  pkgName: { color: 'white', fontWeight: 'bold', marginBottom: 5 },
  pkgPrice: { color: '#FF8C00', fontWeight: 'bold', fontSize: 16 },
  priceContainer: {
    marginTop: 10,
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  priceInput: {
    backgroundColor: '#111',
    color: '#4CD964',
    fontSize: 24,
    fontWeight: 'bold',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: '#333',
  },
  saveButton: {
    backgroundColor: '#FF8C00',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  saveButtonText: { color: 'black', fontWeight: 'bold', fontSize: 16 },
});

export default AddMemberScreen;

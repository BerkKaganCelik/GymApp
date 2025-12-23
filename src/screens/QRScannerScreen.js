import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Keyboard,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import {
  Camera,
  useCameraDevices,
  useCodeScanner,
  useCameraPermission,
} from 'react-native-vision-camera';
import firestore from '@react-native-firebase/firestore';

const QRScannerScreen = () => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [manualUid, setManualUid] = useState('');
  const devices = useCameraDevices();
  const device = devices.back || devices.front;

  const handleScan = async scannedUID => {
    const cleanUID = scannedUID?.trim();
    if (!cleanUID) return;

    setScanning(false);
    setLoading(true);
    Keyboard.dismiss();

    try {
      const userDoc = await firestore().collection('users').doc(cleanUID).get();

      if (!userDoc.exists) {
        Vibration.vibrate(500);
        Alert.alert('HATA ❌', 'Kullanıcı bulunamadı!', [
          {
            text: 'TAMAM',
            onPress: () => {
              setScanning(true);
              setLoading(false);
            },
          },
        ]);
        return;
      }

      const userData = userDoc.data();

      // ✨ GÜVENLİK GÜNCELLEMESİ: Sunucu Zamanı Kontrolü
      // Telefonun saati (new Date()) yerine Firestore sunucu zamanını alıyoruz.
      const serverTimestamp = firestore.Timestamp.now();
      const nowMs = serverTimestamp.toMillis();
      const expiryMs = userData.membershipExpiry?.toMillis() || 0;

      // 1. PASİF KONTROLÜ
      if (!userData.isActive) {
        Vibration.vibrate([100, 100, 100]);
        Alert.alert('GİRİŞ REDDEDİLDİ ⛔', 'Üyelik pasif durumda/dondurulmuş.');
        setScanning(true);
        setLoading(false);
        return;
      }

      // 2. SÜRE KONTROLÜ (SUNUCU BAZLI)
      if (expiryMs < nowMs) {
        Vibration.vibrate([100, 100, 100]);
        const expiryDateStr = userData.membershipExpiry
          ?.toDate()
          .toLocaleDateString('tr-TR');
        Alert.alert(
          'SÜRE DOLMUŞ ⚠️',
          `${userData.fullName} üyelik süresi bitmiş.\nBitiş: ${expiryDateStr}`,
        );
        setScanning(true);
        setLoading(false);
        return;
      }

      // 3. SON ZİYARET MESAJI
      const lastLog = await firestore()
        .collection('entry_logs')
        .where('uid', '==', cleanUID)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

      let welcomeMsg = `Hoşgeldin, ${userData.fullName}`;

      if (!lastLog.empty) {
        const lastDate = lastLog.docs[0].data().timestamp.toDate();
        const diffDays = Math.floor(
          (serverTimestamp.toDate() - lastDate) / (1000 * 60 * 60 * 24),
        );
        if (diffDays > 0)
          welcomeMsg += `\nSeni ${diffDays} gündür görmüyorduk! 💪`;
        else welcomeMsg += `\nBugün tekrar hoşgeldin!`;
      }

      // 4. GİRİŞİ KAYDET
      await firestore().collection('entry_logs').add({
        uid: cleanUID,
        fullName: userData.fullName,
        email: userData.email,
        timestamp: firestore.FieldValue.serverTimestamp(),
        status: 'success',
      });

      Vibration.vibrate(100);
      Alert.alert('GİRİŞ BAŞARILI ✅', welcomeMsg, [
        {
          text: 'TAMAM',
          onPress: () => {
            setScanning(true);
            setLoading(false);
            setManualUid('');
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Sistem Hatası', error.message);
      setScanning(true);
      setLoading(false);
    }
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: codes => {
      if (scanning && codes.length > 0) handleScan(codes[0].value);
    },
  });

  if (!hasPermission)
    return (
      <TouchableOpacity style={styles.center} onPress={requestPermission}>
        <Text style={{ color: 'white' }}>Kamera İzni İste</Text>
      </TouchableOpacity>
    );
  if (device == null)
    return (
      <View style={styles.center}>
        <Text style={{ color: 'white', fontSize: 30 }}>⚠️</Text>
        <Text style={{ color: 'white', marginVertical: 20 }}>
          Kamera Yok (Emülatör)
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Manuel ID Gir"
          placeholderTextColor="#666"
          value={manualUid}
          onChangeText={setManualUid}
        />
        <TouchableOpacity
          style={styles.btn}
          onPress={() => handleScan(manualUid)}
        >
          <Text style={styles.btnTxt}>GİRİŞ YAP</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={scanning}
        codeScanner={codeScanner}
      />
      <View style={styles.overlay}>
        <View style={styles.scanBox} />
        <Text style={styles.text}>
          {loading ? 'Kontrol Ediliyor...' : 'QR Kodu Okutun'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  center: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanBox: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#4CD964',
    borderRadius: 20,
  },
  text: {
    color: 'white',
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: 'black',
    padding: 10,
  },
  input: {
    width: '100%',
    backgroundColor: '#333',
    color: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  btn: {
    backgroundColor: '#4CD964',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  btnTxt: { fontWeight: 'bold', color: 'black' },
});
export default QRScannerScreen;

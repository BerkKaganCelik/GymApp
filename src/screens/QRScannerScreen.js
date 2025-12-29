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

// 🔥 ADIM 1: Tema Hook'unu İmport Et
import { useTheme } from '../context/ThemeContext';

const QRScannerScreen = () => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, t, isDark } = useTheme();

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
        Alert.alert(
          t.error || 'HATA ❌',
          t.userNotFound || 'Kullanıcı bulunamadı!',
          [
            {
              text: t.ok || 'TAMAM',
              onPress: () => {
                setScanning(true);
                setLoading(false);
              },
            },
          ],
        );
        return;
      }

      const userData = userDoc.data();

      // ✨ GÜVENLİK GÜNCELLEMESİ: Sunucu Zamanı Kontrolü
      const serverTimestamp = firestore.Timestamp.now();
      const nowMs = serverTimestamp.toMillis();
      const expiryMs = userData.membershipExpiry?.toMillis() || 0;

      // 1. PASİF KONTROLÜ
      if (!userData.isActive) {
        Vibration.vibrate([100, 100, 100]);
        Alert.alert(
          t.accessDenied || 'GİRİŞ REDDEDİLDİ ⛔',
          t.membershipFrozen || 'Üyelik pasif durumda/dondurulmuş.',
        );
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
          t.accessDenied || 'SÜRE DOLMUŞ ⚠️',
          `${userData.fullName} ${
            t.membershipExpired || 'üyelik süresi bitmiş.'
          }\n${t.end || 'Bitiş'}: ${expiryDateStr}`,
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

      let welcomeMsg = `${t.welcome || 'Hoşgeldin'}, ${userData.fullName}`;

      if (!lastLog.empty) {
        const lastDate = lastLog.docs[0].data().timestamp.toDate();
        const diffDays = Math.floor(
          (serverTimestamp.toDate() - lastDate) / (1000 * 60 * 60 * 24),
        );
        if (diffDays > 0)
          welcomeMsg += `\n${t.longTimeNoSee || 'Seni görmeyeli'} ${diffDays} ${
            t.days || 'gün oldu'
          }! 💪`;
        else welcomeMsg += `\n${t.welcomeBack || 'Bugün tekrar hoşgeldin!'}`;
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
      Alert.alert(t.success || 'GİRİŞ BAŞARILI ✅', welcomeMsg, [
        {
          text: t.ok || 'TAMAM',
          onPress: () => {
            setScanning(true);
            setLoading(false);
            setManualUid('');
          },
        },
      ]);
    } catch (error) {
      Alert.alert(t.error || 'Sistem Hatası', error.message);
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
      <TouchableOpacity
        style={[styles.center, { backgroundColor: theme.bg }]}
        onPress={requestPermission}
      >
        <Text style={{ color: theme.text }}>
          {t.cameraPermission || 'Kamera İzni İste'}
        </Text>
      </TouchableOpacity>
    );
  if (device == null)
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Text style={{ color: theme.text, fontSize: 30 }}>⚠️</Text>
        <Text style={{ color: theme.text, marginVertical: 20 }}>
          {t.noCamera || 'Kamera Yok (Emülatör)'}
        </Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.inputBg, color: theme.text },
          ]}
          placeholder={t.manualIdPlaceholder || 'Manuel ID Gir'}
          placeholderTextColor={theme.subText}
          value={manualUid}
          onChangeText={setManualUid}
        />
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: theme.success }]}
          onPress={() => handleScan(manualUid)}
        >
          <Text style={styles.btnTxt}>{t.login || 'GİRİŞ YAP'}</Text>
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
        <View style={[styles.scanBox, { borderColor: theme.success }]} />
        <Text
          style={[
            styles.text,
            { backgroundColor: 'rgba(0,0,0,0.7)', color: 'white' },
          ]}
        >
          {loading
            ? t.checking || 'Kontrol Ediliyor...'
            : t.scanQr || 'QR Kodu Okutun'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  center: {
    flex: 1,
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
    borderRadius: 20,
  },
  text: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    padding: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  input: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  btn: {
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  btnTxt: { fontWeight: 'bold', color: 'white' },
});

export default QRScannerScreen;

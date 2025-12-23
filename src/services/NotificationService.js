import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { Alert, PermissionsAndroid, Platform } from 'react-native';

/**
 * 1. İZİN İSTEME VE TOKEN ALMA SÜRECİNİ BAŞLATMA
 * Bu fonksiyonu App.js içinde useEffect ile çağır.
 */
export const requestUserPermission = async () => {
  // Android 13 (API 33) ve üzeri için açık izin isteme
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Android bildirim izni reddedildi.');
      return false;
    }
  }

  // Firebase (iOS/Android) izin isteği
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Bildirim izni durumu:', authStatus);
    await getFCMToken(); // İzin varsa Token işlemlerine geç
  } else {
    console.log('Kullanıcı bildirim izni vermedi.');
  }

  return enabled;
};

/**
 * 2. CİHAZ KİMLİĞİNİ (TOKEN) ALMA VE FIRESTORE'A KAYDETME
 */
const getFCMToken = async () => {
  try {
    // Cihazın mevcut token'ını al
    const token = await messaging().getToken();

    // O anki giriş yapmış kullanıcıyı bul
    const user = auth().currentUser;

    if (user && token) {
      console.log('FCM Token alındı:', token);

      // Kullanıcının dökümanını güncelle
      await firestore().collection('users').doc(user.uid).update({
        fcmToken: token, // Mevcut token'ı güncelle
        lastLoginDevice: Platform.OS, // Hangi cihazdan girdiğini de tutabiliriz
        tokenUpdatedAt: firestore.FieldValue.serverTimestamp(),
      });

      console.log("✅ Token Firestore'a başarıyla kaydedildi.");
    } else {
      console.log('Kullanıcı oturumu yok veya token alınamadı.');
    }
  } catch (error) {
    console.error('Token alma/kaydetme hatası:', error);
  }
};

/**
 * 3. TOKEN YENİLENİRSE GÜNCELLEME (Token Refresh Listener)
 * Uygulama silinip yüklenirse veya token değişirse veritabanını günceller.
 */
export const listenTokenRefresh = () => {
  return messaging().onTokenRefresh(async token => {
    const user = auth().currentUser;
    if (user) {
      console.log('Token yenilendi, veritabanı güncelleniyor...');
      await firestore().collection('users').doc(user.uid).update({
        fcmToken: token,
        tokenUpdatedAt: firestore.FieldValue.serverTimestamp(),
      });
    }
  });
};

/**
 * 4. BİLDİRİM DİNLEYİCİLERİ (Foreground / Background / Quit)
 */
export const notificationListener = () => {
  // A. Uygulama AÇIKKEN (Foreground) gelen bildirim
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    console.log('Ön planda bildirim geldi:', remoteMessage);

    Alert.alert(
      remoteMessage.notification?.title || 'Yeni Bildirim',
      remoteMessage.notification?.body || '',
      [{ text: 'Tamam', onPress: () => console.log('Bildirim kapatıldı') }],
    );
  });

  // B. Uygulama ARKA PLANDAYKEN (Background) bildirime tıklandı
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('Arka plandan bildirime tıklandı:', remoteMessage.notification);
    // Buraya navigasyon kodu eklenebilir (Örn: İlgili ekrana git)
  });

  // C. Uygulama KAPALIYKEN (Quit) bildirime tıklandı
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('Uygulama kapalıyken açıldı:', remoteMessage.notification);
        // Buraya navigasyon kodu eklenebilir
      }
    });

  return unsubscribe;
};

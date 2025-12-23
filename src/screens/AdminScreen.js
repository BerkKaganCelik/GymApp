import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const AdminScreen = ({ navigation }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const user = auth().currentUser;

  useEffect(() => {
    let unsubscribeFeedbacks;

    // 1. GÜVENLİK KONTROLÜ
    const checkRole = async () => {
      if (!user) {
        navigation.replace('Welcome');
        return;
      }

      try {
        const userDoc = await firestore()
          .collection('users')
          .doc(user.uid)
          .get();
        const role = userDoc.data()?.role;

        if (role !== 'admin') {
          Alert.alert(
            'Yetkisiz Erişim',
            'Yönetici yetkiniz bulunmamaktadır. Üye paneline yönlendiriliyorsunuz.',
          );
          navigation.replace('MemberHome');
        }
      } catch (error) {
        console.error('Rol kontrol hatası:', error);
        auth().signOut();
        navigation.replace('Welcome');
      }
    };

    checkRole();

    // 2. Gelen Kutusu Sayacı
    unsubscribeFeedbacks = firestore()
      .collection('feedback')
      .where('isRead', '==', false)
      .onSnapshot(
        snap => {
          if (snap) {
            setUnreadCount(snap.size);
          } else {
            setUnreadCount(0);
          }
        },
        error => {
          console.error('Feedback okuma hatası:', error);
          setUnreadCount(0);
        },
      );

    return () => {
      if (unsubscribeFeedbacks) {
        unsubscribeFeedbacks();
      }
    };
  }, [user, navigation]);

  const DashboardCard = ({ title, subTitle, icon, color, onPress, badge }) => (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
          <Text style={{ fontSize: 24 }}>{icon}</Text>
        </View>
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSub}>{subTitle}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Hoşgeldin,</Text>
        <Text style={styles.adminTitle}>YÖNETİCİ 🛠️</Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {/* 1. GELİŞİM TAKİBİ */}
        <DashboardCard
          title="Gelişim Takibi"
          subTitle="Üye Antrenman Logları"
          icon="📈"
          color="#9b59b6"
          onPress={() => navigation.navigate('AdminWorkoutDetail')}
        />

        {/* 2. İŞ ZEKASI */}
        <DashboardCard
          title="İş Zekası"
          subTitle="Ciro & Yoğunluk"
          icon="📊"
          color="#FF9500"
          onPress={() => navigation.navigate('AdminAnalytics')}
        />

        {/* 3. GELEN KUTUSU */}
        <DashboardCard
          title="Gelen Kutusu"
          subTitle="Arıza / İstekler"
          icon="📬"
          color="#FF3B30"
          onPress={() => navigation.navigate('AdminFeedbackScreen')}
          badge={unreadCount}
        />

        {/* 4. GİRİŞ KONTROLÜ */}
        <DashboardCard
          title="Giriş Kontrolü"
          subTitle="QR Tarama"
          icon="📸"
          color="#FF8C00"
          onPress={() => navigation.navigate('QRScanner')}
        />

        {/* 5. YENİ ÜYE EKLE */}
        <DashboardCard
          title="Yeni Üye Ekle"
          subTitle="Kayıt Oluştur"
          icon="➕"
          color="#007AFF"
          onPress={() => navigation.navigate('AddMember')}
        />

        {/* 6. ÜYE LİSTESİ */}
        <DashboardCard
          title="Üye Listesi"
          subTitle="Düzenle / Sil"
          icon="📋"
          color="#4CD964"
          onPress={() => navigation.navigate('MemberListScreen')}
        />

        {/* 7. DERS YÖNETİMİ */}
        <DashboardCard
          title="Ders Yönetimi"
          subTitle="Sınıf Aç/Kapa"
          icon="📅"
          color="#E91E63"
          onPress={() => navigation.navigate('AdminClassesScreen')}
        />

        {/* 8. MAĞAZA */}
        <DashboardCard
          title="Mağaza"
          subTitle="Stok Takibi"
          icon="🛒"
          color="#34C759"
          onPress={() => navigation.navigate('AdminShopScreen')}
        />

        {/* 9. BESLENME PROGRAMI */}
        <DashboardCard
          title="Beslenme Programı"
          subTitle="AI Diyet Ata"
          icon="🥗"
          color="#27AE60"
          onPress={() => navigation.navigate('AdminDietScreen')}
        />

        {/* 🔥 10. YENİ EKLENEN: ANTRENMAN PROGRAMI 🔥 */}
        <DashboardCard
          title="Spor Koçu (AI)"
          subTitle="Antrenman Yaz"
          icon="🏋️"
          color="#3498DB"
          onPress={() => navigation.navigate('AdminTrainingScreen')}
        />
      </ScrollView>

      <TouchableOpacity
        style={styles.logButton}
        onPress={() => navigation.navigate('EntryLogs')}
      >
        <Text style={styles.logText}>🕒 Giriş Geçmişini Görüntüle</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => {
          auth().signOut();
          navigation.replace('Welcome');
        }}
      >
        <Text style={styles.logoutText}>Oturumu Kapat</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  header: { marginTop: 40, marginBottom: 20 },
  welcomeText: { color: '#888', fontSize: 16 },
  adminTitle: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  card: {
    width: '48%',
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    justifyContent: 'space-between',
    height: 130,
    shadowColor: '#000',
    elevation: 5,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  cardTitle: { color: 'white', fontSize: 13, fontWeight: 'bold' },
  cardSub: { color: '#666', fontSize: 10, marginTop: 3 },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1E1E1E',
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  logButton: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  logText: { color: '#9b59b6', fontWeight: 'bold' },
  logoutButton: {
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  logoutText: { color: '#FF3B30', fontWeight: 'bold' },
});

export default AdminScreen;

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
import { useTheme } from '../context/ThemeContext'; // 🔥 HOOK EKLENDİ

const AdminScreen = ({ navigation }) => {
  const { theme, t, isDark } = useTheme(); // 🔥 TEMA VE DİL ÇEKİLDİ
  const [unreadCount, setUnreadCount] = useState(0);
  const user = auth().currentUser;

  // ... (useEffect kısımları AYNI KALSIN - Rol kontrolü ve sayaç) ...
  useEffect(() => {
    let unsubscribeFeedbacks;
    const checkRole = async () => {
      // ... (Mevcut kodlar aynı)
      if (!user) return; // Örnek kısaltma, senin kodun kalsın
    };
    // ... (Mevcut kodlar aynı)
    // Sadece DashboardCard içinde renkleri dinamik yapacağız.
    // ...
    // Gelen kutusu sayacı kodu aynen kalsın
  }, [user]);

  const DashboardCard = ({ title, subTitle, icon, color, onPress, badge }) => (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.card, borderLeftColor: color },
      ]} // 🔥 ARKA PLAN DİNAMİK
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
          <Text style={{ fontSize: 24 }}>{icon}</Text>
        </View>
        {badge > 0 && (
          <View style={[styles.badge, { borderColor: theme.card }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <View>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.cardSub, { color: theme.subText }]}>
          {subTitle}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      <View style={styles.header}>
        <Text style={[styles.welcomeText, { color: theme.subText }]}>
          {t.welcome}
        </Text>
        <Text style={[styles.adminTitle, { color: theme.text }]}>
          {t.adminTitle}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        <DashboardCard
          title={t.progressTrack}
          subTitle={t.progressSub}
          icon="📈"
          color="#9b59b6"
          onPress={() => navigation.navigate('AdminWorkoutDetail')}
        />
        <DashboardCard
          title={t.businessIntel}
          subTitle={t.businessSub}
          icon="📊"
          color="#FF9500"
          onPress={() => navigation.navigate('AdminAnalytics')}
        />
        <DashboardCard
          title={t.inbox}
          subTitle={t.inboxSub}
          icon="📬"
          color="#FF3B30"
          onPress={() => navigation.navigate('AdminFeedbackScreen')}
          badge={unreadCount}
        />
        <DashboardCard
          title={t.accessCtrl}
          subTitle={t.accessSub}
          icon="📸"
          color="#FF8C00"
          onPress={() => navigation.navigate('QRScanner')}
        />
        <DashboardCard
          title={t.addMember}
          subTitle={t.addMemberSub}
          icon="➕"
          color="#007AFF"
          onPress={() => navigation.navigate('AddMember')}
        />
        <DashboardCard
          title={t.memberList}
          subTitle={t.memberListSub}
          icon="📋"
          color="#4CD964"
          onPress={() => navigation.navigate('MemberListScreen')}
        />
        <DashboardCard
          title={t.classMgmt}
          subTitle={t.classSub}
          icon="📅"
          color="#E91E63"
          onPress={() => navigation.navigate('AdminClassesScreen')}
        />
        <DashboardCard
          title={t.store}
          subTitle={t.storeSub}
          icon="🛒"
          color="#34C759"
          onPress={() => navigation.navigate('AdminShopScreen')}
        />
        <DashboardCard
          title={t.dietProg}
          subTitle={t.dietSub}
          icon="🥗"
          color="#27AE60"
          onPress={() => navigation.navigate('AdminDietScreen')}
        />
        <DashboardCard
          title={t.aiCoach}
          subTitle={t.aiCoachSub}
          icon="🏋️"
          color="#3498DB"
          onPress={() => navigation.navigate('AdminTrainingScreen')}
        />
        <DashboardCard
          title={t.entryLogs}
          subTitle={t.entryLogsSub}
          icon="🕒"
          color="#95a5a6"
          onPress={() => navigation.navigate('EntryLogs')}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 }, // Renk silindi, inline style'a taşındı
  header: { marginTop: 40, marginBottom: 20 },
  welcomeText: { fontSize: 16 }, // Renk silindi
  adminTitle: { fontSize: 32, fontWeight: 'bold' }, // Renk silindi
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 80,
  },
  card: {
    width: '48%',
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
  cardTitle: { fontSize: 13, fontWeight: 'bold' }, // Renk silindi
  cardSub: { fontSize: 10, marginTop: 3 }, // Renk silindi
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
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
});

export default AdminScreen;

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, View, Text } from 'react-native';

// 🔥 ThemeProvider
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

import {
  requestUserPermission,
  notificationListener,
  listenTokenRefresh,
} from './src/services/NotificationService'; // Dosya yolunu kontrol et (utils veya services)

// ... EKRAN IMPORTLARI ...
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import MemberScreen from './src/screens/MemberScreen';
import ActiveWorkoutScreen from './src/screens/ActiveWorkoutScreen';
import BodyStatsScreen from './src/screens/BodyStatsScreen';
import ClassBookingScreen from './src/screens/ClassBookingScreen';
import ExerciseGuideScreen from './src/screens/ExerciseGuideScreen';
import MemberHistoryScreen from './src/screens/MemberHistoryScreen';
import MemberWorkoutDetailScreen from './src/screens/MemberWorkoutDetailScreen';
import ShopScreen from './src/screens/ShopScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AiCoachScreen from './src/screens/AiCoachScreen';

import AdminScreen from './src/screens/AdminScreen';
import AddMemberScreen from './src/screens/AddMemberScreen';
import AdminAnalyticsScreen from './src/screens/AdminAnalyticsScreen';
import AdminClassesScreen from './src/screens/AdminClassesScreen';
import AdminClassDetailScreen from './src/screens/AdminClassDetailScreen';
import AdminFeedbackScreen from './src/screens/AdminFeedbackScreen';
import AdminShopScreen from './src/screens/AdminShopScreen';
import AdminWorkoutDetailScreen from './src/screens/AdminWorkoutDetailScreen';
import AdminDietScreen from './src/screens/AdminDietScreen';
import AdminTrainingScreen from './src/screens/AdminTrainingScreen';
import EntryLogsScreen from './src/screens/EntryLogsScreen';
import ExpiringMembersScreen from './src/screens/ExpiringMembersScreen';
import MemberListScreen from './src/screens/MemberListScreen';
import EditMemberScreen from './src/screens/EditMemberScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- ADMIN ALT MENÜ ---
const AdminTabNavigator = () => {
  const { theme, isDark, t } = useTheme(); // 🔥 't' eklendi

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#FF8C00',
        tabBarInactiveTintColor: isDark ? '#888' : '#999',
        tabBarLabelStyle: { fontSize: 10, fontWeight: 'bold' },
        tabBarIcon: ({ focused }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = '🏠';
          else if (route.name === 'Members') iconName = '👥';
          else if (route.name === 'QRScan') iconName = '📸';
          else if (route.name === 'Analytics') iconName = '📊';
          else if (route.name === 'Settings') iconName = '⚙️';

          return (
            <View
              style={{
                opacity: focused ? 1 : 0.5,
                transform: [{ scale: focused ? 1.2 : 1 }],
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  color: isDark || focused ? '#FFF' : '#000',
                }}
              >
                {iconName}
              </Text>
            </View>
          );
        },
      })}
    >
      {/* 🔥 Başlıklar 't' ile çevrildi */}
      <Tab.Screen
        name="Dashboard"
        component={AdminScreen}
        options={{ title: t.home || 'Ana Sayfa' }}
      />
      <Tab.Screen
        name="Members"
        component={MemberListScreen}
        options={{ title: t.members || 'Üyeler' }}
      />
      <Tab.Screen
        name="QRScan"
        component={QRScannerScreen}
        options={{ title: t.qrScan || 'QR Tara' }}
      />
      <Tab.Screen
        name="Analytics"
        component={AdminAnalyticsScreen}
        options={{ title: t.analytics || 'Analiz' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t.settingsTitle || 'Ayarlar' }}
      />
    </Tab.Navigator>
  );
};

// --- MEMBER ALT MENÜ ---
const MemberTabNavigator = () => {
  const { theme, isDark, t } = useTheme(); // 🔥 't' eklendi

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.bg,
          borderTopColor: theme.border,
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#3498DB',
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: { fontSize: 10, fontWeight: 'bold', marginTop: 2 },
        tabBarIcon: ({ focused }) => {
          let iconName;
          let isMiddle = false;

          if (route.name === 'Home') iconName = '🏠';
          else if (route.name === 'Classes') iconName = '📅';
          else if (route.name === 'AiCoach') {
            iconName = '🤖';
            isMiddle = true;
          } else if (route.name === 'Shop') iconName = '🛒';
          else if (route.name === 'Profile') iconName = '👤';

          if (isMiddle) {
            return (
              <View
                style={{
                  top: -20,
                  backgroundColor: '#3498DB',
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 4,
                  borderColor: theme.bg,
                  elevation: 5,
                }}
              >
                <Text style={{ fontSize: 30 }}>{iconName}</Text>
              </View>
            );
          }

          return (
            <View style={{ opacity: focused ? 1 : 0.5 }}>
              <Text
                style={{
                  fontSize: 24,
                  color: isDark || focused ? '#FFF' : '#333',
                }}
              >
                {iconName}
              </Text>
            </View>
          );
        },
      })}
    >
      {/* 🔥 Başlıklar 't' ile çevrildi */}
      <Tab.Screen
        name="Home"
        component={MemberScreen}
        options={{ title: t.home || 'Ana Sayfa' }}
      />
      <Tab.Screen
        name="Classes"
        component={ClassBookingScreen}
        options={{ title: t.classes || 'Dersler' }}
      />
      <Tab.Screen
        name="AiCoach"
        component={AiCoachScreen}
        options={{ title: '', tabBarLabelStyle: { display: 'none' } }}
      />
      <Tab.Screen
        name="Shop"
        component={ShopScreen}
        options={{ title: t.shop || 'Mağaza' }}
      />
      <Tab.Screen
        name="Profile"
        component={SettingsScreen}
        options={{ title: t.profile || 'Profil' }}
      />
    </Tab.Navigator>
  );
};

// --- ANA NAVİGASYON (PROVIDER İÇİNDE ÇALIŞIR) ---
const MainNavigation = () => {
  const { theme, isDark, t } = useTheme();

  // 🔥 Bildirimleri Burada Başlatıyoruz (Çünkü 't' ye ihtiyacımız var)
  useEffect(() => {
    const initNotifications = async () => {
      await requestUserPermission();
      // 't' nesnesini gönderiyoruz ki Alert kutusu Türkçe/İngilizce olsun
      notificationListener(t);
      listenTokenRefresh();
    };
    initNotifications();
  }, [t]); // Dil değişirse listener güncellensin

  return (
    <NavigationContainer>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />

        {/* Tab Menüler */}
        <Stack.Screen name="AdminHome" component={AdminTabNavigator} />
        <Stack.Screen name="MemberHome" component={MemberTabNavigator} />

        {/* Diğer Ekranlar */}
        <Stack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
        <Stack.Screen name="QRScanner" component={QRScannerScreen} />
        <Stack.Screen name="AddMember" component={AddMemberScreen} />
        <Stack.Screen name="EditMember" component={EditMemberScreen} />
        <Stack.Screen name="EntryLogs" component={EntryLogsScreen} />
        <Stack.Screen name="MemberListScreen" component={MemberListScreen} />
        <Stack.Screen name="AdminShopScreen" component={AdminShopScreen} />
        <Stack.Screen name="AdminDietScreen" component={AdminDietScreen} />
        <Stack.Screen
          name="AdminTrainingScreen"
          component={AdminTrainingScreen}
        />
        <Stack.Screen
          name="AdminFeedbackScreen"
          component={AdminFeedbackScreen}
        />
        <Stack.Screen
          name="AdminClassesScreen"
          component={AdminClassesScreen}
        />
        <Stack.Screen
          name="AdminWorkoutDetail"
          component={AdminWorkoutDetailScreen}
        />
        <Stack.Screen
          name="AdminClassDetail"
          component={AdminClassDetailScreen}
        />
        <Stack.Screen
          name="ExpiringMembers"
          component={ExpiringMembersScreen}
        />
        <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
        <Stack.Screen name="ClassBooking" component={ClassBookingScreen} />
        <Stack.Screen name="Shop" component={ShopScreen} />
        <Stack.Screen name="ExerciseGuide" component={ExerciseGuideScreen} />
        <Stack.Screen name="BodyStats" component={BodyStatsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="MemberHistory" component={MemberHistoryScreen} />
        <Stack.Screen
          name="WorkoutDetail"
          component={MemberWorkoutDetailScreen}
        />
        <Stack.Screen name="AiCoach" component={AiCoachScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// --- APP (SADECE PROVIDER SARMALAR) ---
const App = () => {
  return (
    <ThemeProvider>
      <MainNavigation />
    </ThemeProvider>
  );
};

export default App;

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';

import {
  requestUserPermission,
  notificationListener,
  listenTokenRefresh,
} from './src/services/NotificationService';

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
import AiCoachScreen from './src/screens/AiCoachScreen'; // 🔥 YENİ EKLENDİ

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

const App = () => {
  useEffect(() => {
    const initNotifications = async () => {
      await requestUserPermission();
      const unsubscribeNotif = notificationListener();
      const unsubscribeToken = listenTokenRefresh();

      return () => {
        if (unsubscribeNotif) unsubscribeNotif();
        if (unsubscribeToken) unsubscribeToken();
      };
    };

    initNotifications();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#121212' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="AdminHome" component={AdminScreen} />
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
        <Stack.Screen name="MemberHome" component={MemberScreen} />
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

        {/* 🔥 YENİ AI KOÇ EKRANI */}
        <Stack.Screen name="AiCoach" component={AiCoachScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

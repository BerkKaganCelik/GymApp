import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- RENKLER ---
const COLORS = {
  dark: {
    bg: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    subText: '#AAAAAA',
    border: '#333333',
    primary: '#FF8C00',
    inputBg: '#2C2C2C',
    success: '#4CD964',
    danger: '#FF3B30',
  },
  light: {
    bg: '#F5F5F5',
    card: '#FFFFFF',
    text: '#121212',
    subText: '#666666',
    border: '#DDDDDD',
    primary: '#FF8C00',
    inputBg: '#E0E0E0',
    success: '#27AE60',
    danger: '#D32F2F',
  },
};

// --- ÇEVİRİLER ---
const TRANSLATIONS = {
  tr: {
    // Ortak
    welcome: 'Hoşgeldin,',
    settingsTitle: 'AYARLAR ⚙️',
    save: 'KAYDET',
    logout: '🚪 OTURUMU KAPAT',
    back: 'Geri Dön',
    cancel: 'İptal',
    language: 'Dil / Language',
    theme: 'Karanlık Mod',

    // Admin Paneli
    adminTitle: 'YÖNETİCİ 🛠️',
    progressTrack: 'Gelişim Takibi',
    progressSub: 'Üye Antrenman Logları',
    businessIntel: 'İş Zekası',
    businessSub: 'Ciro & Yoğunluk',
    inbox: 'Gelen Kutusu',
    inboxSub: 'Arıza / İstekler',
    accessCtrl: 'Giriş Kontrolü',
    accessSub: 'QR Tarama',
    addMember: 'Yeni Üye Ekle',
    addMemberSub: 'Kayıt Oluştur',
    memberList: 'Üye Listesi',
    memberListSub: 'Düzenle / Sil',
    classMgmt: 'Ders Yönetimi',
    classSub: 'Sınıf Aç/Kapa',
    store: 'Mağaza',
    storeSub: 'Stok Takibi',
    dietProg: 'Beslenme Programı',
    dietSub: 'AI Diyet Ata',
    aiCoach: 'Spor Koçu (AI)',
    aiCoachSub: 'Antrenman Yaz',
    entryLogs: 'Giriş Logları',
    entryLogsSub: 'Turnike Kayıtları',

    // Üye Paneli
    waterTitle: '💧 SU TAKİBİ',
    target: 'Hedef',
    leaderboard: '🏆 AYIN ŞAMPİYONLARI',
    aiProgTitle: '⚡ AI KOÇ PROGRAMIN',
    startWorkout: 'ANTRENMANA BAŞLA',
    manualProg: 'MANUEL PROGRAMIM',
    classes: 'Dersler',
    encyclopedia: 'Ansiklopedi',
    progress: 'Gelişim',
    nutrition: 'Beslenme',
    history: 'Geçmiş',
    contactUs: 'Bize Yazın',
    contactSub: 'Öneri / Şikayet',

    // Formlar
    fullName: 'AD SOYAD',
    phone: 'TELEFON',
    newPass: 'YENİ ŞİFRE (Opsiyonel)',
  },
  en: {
    // Common
    welcome: 'Welcome,',
    settingsTitle: 'SETTINGS ⚙️',
    save: 'SAVE',
    logout: '🚪 LOG OUT',
    back: 'Go Back',
    cancel: 'Cancel',
    language: 'Language',
    theme: 'Dark Mode',

    // Admin Panel
    adminTitle: 'ADMIN 🛠️',
    progressTrack: 'Progress Tracking',
    progressSub: 'Member Workout Logs',
    businessIntel: 'Business Intel',
    businessSub: 'Revenue & Density',
    inbox: 'Inbox',
    inboxSub: 'Issues / Requests',
    accessCtrl: 'Access Control',
    accessSub: 'QR Scan',
    addMember: 'Add New Member',
    addMemberSub: 'Create Record',
    memberList: 'Member List',
    memberListSub: 'Edit / Delete',
    classMgmt: 'Class Mgmt',
    classSub: 'Open/Close Class',
    store: 'Store',
    storeSub: 'Stock Tracking',
    dietProg: 'Nutrition Program',
    dietSub: 'Assign AI Diet',
    aiCoach: 'Sports Coach (AI)',
    aiCoachSub: 'Write Workout',
    entryLogs: 'Entry Logs',
    entryLogsSub: 'Turnstile Records',

    // Member Panel
    waterTitle: '💧 WATER TRACKING',
    target: 'Target',
    leaderboard: '🏆 CHAMPIONS OF MONTH',
    aiProgTitle: '⚡ AI COACH PROGRAM',
    startWorkout: 'START WORKOUT',
    manualProg: 'MY MANUAL PROGRAM',
    classes: 'Classes',
    encyclopedia: 'Encyclopedia',
    progress: 'Progress',
    nutrition: 'Nutrition',
    history: 'History',
    contactUs: 'Contact Us',
    contactSub: 'Suggestion / Complaint',

    // Forms
    fullName: 'FULL NAME',
    phone: 'PHONE',
    newPass: 'NEW PASSWORD (Optional)',
  },
};

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState('tr');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('appTheme');
        const storedLang = await AsyncStorage.getItem('appLang');
        if (storedTheme) setIsDark(storedTheme === 'dark');
        else setIsDark(systemScheme === 'dark');
        if (storedLang) setLang(storedLang);
      } catch (e) {
        console.error(e);
      }
    };
    loadSettings();
  }, []);

  const toggleTheme = async () => {
    const newVal = !isDark;
    setIsDark(newVal);
    await AsyncStorage.setItem('appTheme', newVal ? 'dark' : 'light');
  };

  const setLanguage = async languageCode => {
    setLang(languageCode);
    await AsyncStorage.setItem('appLang', languageCode);
  };

  const theme = isDark ? COLORS.dark : COLORS.light;
  const t = TRANSLATIONS[lang];

  return (
    <ThemeContext.Provider
      value={{ isDark, toggleTheme, theme, lang, setLanguage, t }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

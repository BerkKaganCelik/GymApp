import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

// 🔥 ADIM 1: Tema Hook'unu İmport Et
import { useTheme } from '../context/ThemeContext';

const WelcomeScreen = ({ navigation }) => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, t, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      <View style={styles.headerContainer}>
        {/* Logo İsmi Genelde Çevrilmez ama Rengi Temaya Uydurduk */}
        <Text style={[styles.gymName, { color: theme.text }]}>IRON GYM</Text>
        <Text style={[styles.subTag, { color: theme.primary }]}>
          {t.slogan || 'NO PAIN NO GAIN'}
        </Text>
      </View>

      {/* Dekoratif Daire Rengi */}
      <View
        style={[styles.decorativeCircle, { backgroundColor: theme.inputBg }]}
      />

      <View style={styles.buttonContainer}>
        <Text style={[styles.promptText, { color: theme.subText }]}>
          {t.chooseLogin || 'Giriş yapmak için seçiniz'}
        </Text>

        {/* YÖNETİCİ KARTI */}
        <TouchableOpacity
          style={[
            styles.card,
            styles.adminCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Login')}
        >
          <View style={[styles.iconCircle, { backgroundColor: theme.inputBg }]}>
            <Text style={styles.emoji}>🔑</Text>
          </View>
          <View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              {t.adminLogin || 'Yönetici Girişi'}
            </Text>
            <Text style={[styles.cardSub, { color: theme.subText }]}>
              {t.adminSub || 'Personel ve Kontrol'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* ÜYE KARTI */}
        <TouchableOpacity
          style={[
            styles.card,
            styles.memberCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Login')}
        >
          <View style={[styles.iconCircle, { backgroundColor: theme.inputBg }]}>
            <Text style={styles.emoji}>💪</Text>
          </View>
          <View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              {t.memberLogin || 'Üye Girişi'}
            </Text>
            <Text style={[styles.cardSub, { color: theme.subText }]}>
              {t.memberSub || 'Antrenman ve Profil'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  headerContainer: { alignItems: 'center', marginTop: 40, zIndex: 2 },
  gymName: {
    fontSize: 50,
    fontWeight: '900',
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  subTag: {
    fontSize: 16,
    letterSpacing: 5,
    marginTop: 5,
    fontWeight: 'bold',
  },
  decorativeCircle: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    zIndex: 1,
  },
  buttonContainer: { paddingHorizontal: 30, zIndex: 2 },
  promptText: {
    marginBottom: 20,
    fontSize: 14,
    textTransform: 'uppercase',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  adminCard: { borderLeftWidth: 5, borderLeftColor: '#FFD700' },
  memberCard: { borderLeftWidth: 5, borderLeftColor: '#FF4500' },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  emoji: { fontSize: 24 },
  cardTitle: { fontSize: 20, fontWeight: 'bold' },
  cardSub: { fontSize: 14, marginTop: 2 },
});

export default WelcomeScreen;

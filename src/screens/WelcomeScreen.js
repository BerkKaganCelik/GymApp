import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <View style={styles.headerContainer}>
        <Text style={styles.gymName}>IRON GYM</Text>
        <Text style={styles.subTag}>NO PAIN NO GAIN</Text>
      </View>

      <View style={styles.decorativeCircle} />

      <View style={styles.buttonContainer}>
        <Text style={styles.promptText}>Giriş yapmak için seçiniz</Text>

        <TouchableOpacity
          style={[styles.card, styles.adminCard]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Login')}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.emoji}>🔑</Text>
          </View>
          <View>
            <Text style={styles.cardTitle}>Yönetici Girişi</Text>
            <Text style={styles.cardSub}>Personel ve Kontrol</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.memberCard]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Login')}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.emoji}>💪</Text>
          </View>
          <View>
            <Text style={styles.cardTitle}>Üye Girişi</Text>
            <Text style={styles.cardSub}>Antrenman ve Profil</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  headerContainer: { alignItems: 'center', marginTop: 40, zIndex: 2 },
  gymName: {
    fontSize: 50,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  subTag: {
    fontSize: 16,
    color: '#FF8C00',
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
    backgroundColor: '#222',
    zIndex: 1,
  },
  buttonContainer: { paddingHorizontal: 30, zIndex: 2 },
  promptText: {
    color: '#666',
    marginBottom: 20,
    fontSize: 14,
    textTransform: 'uppercase',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
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
    backgroundColor: '#333',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  emoji: { fontSize: 24 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  cardSub: { fontSize: 14, color: '#888', marginTop: 2 },
});

export default WelcomeScreen;

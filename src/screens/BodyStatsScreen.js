import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { LineChart } from 'react-native-chart-kit';

// 🔥 ADIM 1: Tema Hook'unu İmport Et
import { useTheme } from '../context/ThemeContext';

const BodyStatsScreen = ({ navigation }) => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, t, isDark } = useTheme();

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth().currentUser;
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    const sub = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('body_stats')
      .orderBy('date', 'asc')
      .onSnapshot(snap => {
        const data = [];
        if (snap)
          snap.forEach(d =>
            data.push({
              ...d.data(),
              key: d.id,
              dateObj: d.data().date?.toDate(),
            }),
          );
        setStats(data);

        if (data.length > 0) setHeight(data[data.length - 1].height);

        setLoading(false);
      });
    return () => sub();
  }, []);

  const calculateBMI = (w, h) => {
    const m = h / 100;
    return (w / (m * m)).toFixed(1);
  };

  const getBMIStatus = bmi => {
    if (bmi < 18.5) return { text: 'Zayıf', color: '#3498db' };
    if (bmi < 25) return { text: 'Normal', color: theme.success }; // Dinamik renk
    if (bmi < 30) return { text: 'Fazla Kilolu', color: '#FF9500' };
    return { text: 'Obez', color: theme.danger }; // Dinamik renk
  };

  const handleSave = async () => {
    if (!weight || !height) {
      Alert.alert('Eksik', 'Kilo ve Boy giriniz.');
      return;
    }
    const bmi = calculateBMI(weight, height);

    await firestore()
      .collection('users')
      .doc(user.uid)
      .collection('body_stats')
      .add({
        weight,
        height,
        bmi,
        date: firestore.FieldValue.serverTimestamp(),
      });
    setWeight('');
    Alert.alert('Kaydedildi', `VKI: ${bmi}`);
  };

  const deleteStat = id => {
    Alert.alert('Sil', 'Bu ölçümü silmek istiyor musun?', [
      { text: t.cancel, style: 'cancel' }, // 🔥 Çeviri
      {
        text: 'Sil',
        onPress: () =>
          firestore()
            .collection('users')
            .doc(user.uid)
            .collection('body_stats')
            .doc(id)
            .delete(),
      },
    ]);
  };

  const getChartData = () => {
    if (stats.length === 0) return null;
    const recentStats = stats.slice(-6);
    return {
      labels: recentStats.map(s =>
        s.dateObj ? `${s.dateObj.getDate()}/${s.dateObj.getMonth() + 1}` : '-',
      ),
      datasets: [{ data: recentStats.map(s => parseFloat(s.weight)) }],
    };
  };

  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );

  const lastStat = stats.length > 0 ? stats[stats.length - 1] : null;
  const bmiInfo = lastStat ? getBMIStatus(lastStat.bmi) : null;
  const chartData = getChartData();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        {/* Başlık Dinamik */}
        <Text style={[styles.header, { color: theme.text }]}>
          {t.progress || 'GELİŞİM ANALİZİ'} 📈
        </Text>

        {/* 1. GRAFİK ALANI */}
        {chartData ? (
          <View style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color: theme.subText }]}>
              Kilo Değişim Grafiği
            </Text>
            <LineChart
              data={chartData}
              width={screenWidth - 40}
              height={220}
              yAxisSuffix=" kg"
              chartConfig={{
                backgroundColor: theme.card, // 🔥 Dinamik
                backgroundGradientFrom: theme.card, // 🔥 Dinamik
                backgroundGradientTo: theme.card, // 🔥 Dinamik
                decimalPlaces: 1,
                color: (opacity = 1) => theme.primary, // 🔥 Dinamik (Turuncu)
                labelColor: (opacity = 1) => theme.text, // 🔥 Dinamik yazı
                style: { borderRadius: 16 },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: theme.primary,
                },
              }}
              bezier
              style={{ marginVertical: 8, borderRadius: 16 }}
            />
          </View>
        ) : (
          <View style={[styles.emptyBox, { borderColor: theme.border }]}>
            <Text style={{ color: theme.subText }}>
              Grafik için en az 1 veri girin.
            </Text>
          </View>
        )}

        {/* 2. ÖZET KARTLARI */}
        {lastStat && (
          <View style={styles.summaryRow}>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: theme.card, borderLeftColor: theme.primary },
              ]}
            >
              <Text style={[styles.sumLabel, { color: theme.subText }]}>
                Son Kilo
              </Text>
              <Text style={[styles.sumValue, { color: theme.text }]}>
                {lastStat.weight} <Text style={{ fontSize: 14 }}>kg</Text>
              </Text>
            </View>
            <View
              style={[
                styles.summaryCard,
                { backgroundColor: theme.card, borderLeftColor: bmiInfo.color },
              ]}
            >
              <Text style={[styles.sumLabel, { color: theme.subText }]}>
                VKI Durumu
              </Text>
              <Text style={[styles.sumValue, { color: bmiInfo.color }]}>
                {bmiInfo.text}
              </Text>
              <Text style={{ color: theme.subText, fontSize: 10 }}>
                Değer: {lastStat.bmi}
              </Text>
            </View>
          </View>
        )}

        {/* 3. VERİ GİRİŞİ */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          {t.addMeasurement || 'YENİ ÖLÇÜM EKLE'}
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.input,
              {
                flex: 1,
                marginRight: 10,
                backgroundColor: theme.inputBg,
                color: theme.text,
              },
            ]}
            placeholder="Kilo (kg)"
            placeholderTextColor={theme.subText}
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
          />
          <TextInput
            style={[
              styles.input,
              { flex: 1, backgroundColor: theme.inputBg, color: theme.text },
            ]}
            placeholder="Boy (cm)"
            placeholderTextColor={theme.subText}
            keyboardType="numeric"
            value={height}
            onChangeText={setHeight}
          />
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
            onPress={handleSave}
          >
            <Text style={{ fontSize: 20, color: 'white' }}>➕</Text>
          </TouchableOpacity>
        </View>

        {/* 4. GEÇMİŞ LİSTESİ */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          {t.history || 'GEÇMİŞ KAYITLAR'}
        </Text>
        {stats
          .slice()
          .reverse()
          .map(item => (
            <View
              key={item.key}
              style={[styles.historyRow, { backgroundColor: theme.card }]}
            >
              <Text style={{ color: theme.subText, width: 80 }}>
                {item.dateObj ? item.dateObj.toLocaleDateString() : '-'}
              </Text>
              <Text style={{ color: theme.text, fontWeight: 'bold', flex: 1 }}>
                {item.weight} kg
              </Text>
              <Text
                style={{
                  color: getBMIStatus(item.bmi).color,
                  fontWeight: 'bold',
                  marginRight: 15,
                }}
              >
                VKI: {item.bmi}
              </Text>
              <TouchableOpacity onPress={() => deleteStat(item.key)}>
                <Text>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  chartContainer: { alignItems: 'center', marginBottom: 20 },
  chartTitle: { marginBottom: 10, fontSize: 12 },
  emptyBox: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  summaryCard: {
    width: '48%',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  sumLabel: { fontSize: 12, marginBottom: 5 },
  sumValue: { fontSize: 22, fontWeight: 'bold' },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
  inputRow: { flexDirection: 'row', marginBottom: 20 },
  input: {
    padding: 15,
    borderRadius: 10,
  },
  addBtn: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginLeft: 10,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 5,
    borderRadius: 8,
  },
});

export default BodyStatsScreen;

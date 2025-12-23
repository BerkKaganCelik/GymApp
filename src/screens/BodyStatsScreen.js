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

const BodyStatsScreen = () => {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState(''); // Boy genelde sabit kalır ama güncellenebilir
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth().currentUser;
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    // Verileri tarihe göre (Eskiden yeniye) çekiyoruz ki grafik düzgün çizilsin
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

        // Son kayıttaki boy bilgisini otomatik getir (tekrar yazdırmamak için)
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
    if (bmi < 25) return { text: 'Normal', color: '#4CD964' };
    if (bmi < 30) return { text: 'Fazla Kilolu', color: '#FF9500' };
    return { text: 'Obez', color: '#FF3B30' };
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
      { text: 'Vazgeç' },
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

  // Grafik Verilerini Hazırla
  const getChartData = () => {
    if (stats.length === 0) return null;
    // Son 6 ölçümü göster (Grafik sıkışmasın)
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
      <View style={styles.center}>
        <ActivityIndicator color="#FF8C00" />
      </View>
    );

  const lastStat = stats.length > 0 ? stats[stats.length - 1] : null;
  const bmiInfo = lastStat ? getBMIStatus(lastStat.bmi) : null;
  const chartData = getChartData();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        <Text style={styles.header}>GELİŞİM ANALİZİ 📈</Text>

        {/* 1. GRAFİK ALANI */}
        {chartData ? (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Kilo Değişim Grafiği</Text>
            <LineChart
              data={chartData}
              width={screenWidth - 40}
              height={220}
              yAxisSuffix=" kg"
              chartConfig={{
                backgroundColor: '#1E1E1E',
                backgroundGradientFrom: '#1E1E1E',
                backgroundGradientTo: '#1E1E1E',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(255, 140, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: '6', strokeWidth: '2', stroke: '#FF9500' },
              }}
              bezier
              style={{ marginVertical: 8, borderRadius: 16 }}
            />
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={{ color: '#666' }}>
              Grafik için en az 1 veri girin.
            </Text>
          </View>
        )}

        {/* 2. ÖZET KARTLARI */}
        {lastStat && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.sumLabel}>Son Kilo</Text>
              <Text style={styles.sumValue}>
                {lastStat.weight} <Text style={{ fontSize: 14 }}>kg</Text>
              </Text>
            </View>
            <View
              style={[styles.summaryCard, { borderLeftColor: bmiInfo.color }]}
            >
              <Text style={styles.sumLabel}>VKI Durumu</Text>
              <Text style={[styles.sumValue, { color: bmiInfo.color }]}>
                {bmiInfo.text}
              </Text>
              <Text style={{ color: '#666', fontSize: 10 }}>
                Değer: {lastStat.bmi}
              </Text>
            </View>
          </View>
        )}

        {/* 3. VERİ GİRİŞİ */}
        <Text style={styles.sectionTitle}>YENİ ÖLÇÜM EKLE</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 10 }]}
            placeholder="Kilo (kg)"
            placeholderTextColor="#666"
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Boy (cm)"
            placeholderTextColor="#666"
            keyboardType="numeric"
            value={height}
            onChangeText={setHeight}
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleSave}>
            <Text style={{ fontSize: 20 }}>➕</Text>
          </TouchableOpacity>
        </View>

        {/* 4. GEÇMİŞ LİSTESİ */}
        <Text style={styles.sectionTitle}>GEÇMİŞ KAYITLAR</Text>
        {stats
          .slice()
          .reverse()
          .map(item => (
            <View key={item.key} style={styles.historyRow}>
              <Text style={{ color: '#888', width: 80 }}>
                {item.dateObj ? item.dateObj.toLocaleDateString() : '-'}
              </Text>
              <Text style={{ color: 'white', fontWeight: 'bold', flex: 1 }}>
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
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  center: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },

  chartContainer: { alignItems: 'center', marginBottom: 20 },
  chartTitle: { color: '#888', marginBottom: 10, fontSize: 12 },
  emptyBox: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#333',
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
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  sumLabel: { color: '#888', fontSize: 12, marginBottom: 5 },
  sumValue: { color: 'white', fontSize: 22, fontWeight: 'bold' },

  sectionTitle: {
    color: '#FF8C00',
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
  inputRow: { flexDirection: 'row', marginBottom: 20 },
  input: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    color: 'white',
  },
  addBtn: {
    backgroundColor: '#FF8C00',
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginLeft: 10,
  },

  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 15,
    marginBottom: 5,
    borderRadius: 8,
  },
});

export default BodyStatsScreen;

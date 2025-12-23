import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { BarChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const AdminAnalyticsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    shopRevenue: 0,
    membershipRevenue: 0,
    activeMemberCount: 0,
    totalMembers: 0,
  });
  const [busyHours, setBusyHours] = useState([0, 0, 0, 0, 0, 0]);
  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // --- 1. OPTİMİZE EDİLMİŞ SAYAÇLAR (AGGREGATION) ---
        // Toplam Üye (count() sadece sayıyı getirir, belgeyi indirmez)
        const totalMembersSnap = await firestore()
          .collection('users')
          .count()
          .get();
        const totalMembers = totalMembersSnap.data().count;

        // Aktif Üye
        const activeMembersSnap = await firestore()
          .collection('users')
          .where('isActive', '==', true)
          .where('role', '==', 'member')
          .count()
          .get();
        const activeCount = activeMembersSnap.data().count;

        // --- 2. CİRO HESABI (SON 30 GÜN FİLTRESİ) ---
        // Performans için sadece son 1 ayın verisini çekiyoruz.
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const ordersSnap = await firestore()
          .collection('orders')
          .where('orderDate', '>=', lastMonth)
          .orderBy('orderDate', 'desc')
          .get();

        let sRevenue = 0; // Mağaza
        let mRevenue = 0; // Üyelik
        const recentList = [];

        ordersSnap.forEach(doc => {
          const data = doc.data();
          const price = parseFloat(data.price) || 0;

          if (data.type === 'membership') {
            mRevenue += price;
          } else {
            sRevenue += price;
          }

          // Listeye sadece ilk 5'i ekle
          if (recentList.length < 5) {
            recentList.push({
              id: doc.id,
              name: data.productName,
              price: price,
              buyer: data.buyerName,
              date: data.orderDate
                ? data.orderDate.toDate().toLocaleDateString('tr-TR')
                : '-',
              isMembership: data.type === 'membership',
            });
          }
        });

        // --- 3. YOĞUNLUK HARİTASI (SADECE BUGÜN) ---
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const logsSnap = await firestore()
          .collection('entry_logs')
          .where('timestamp', '>=', todayStart)
          .get();

        const hoursMap = [0, 0, 0, 0, 0, 0];
        logsSnap.forEach(doc => {
          const date = doc.data().timestamp?.toDate();
          if (date) {
            const h = date.getHours();
            if (h >= 8 && h < 10) hoursMap[0]++;
            else if (h >= 10 && h < 12) hoursMap[1]++;
            else if (h >= 12 && h < 14) hoursMap[2]++;
            else if (h >= 14 && h < 16) hoursMap[3]++;
            else if (h >= 16 && h < 18) hoursMap[4]++;
            else if (h >= 18) hoursMap[5]++;
          }
        });

        setStats({
          totalRevenue: mRevenue + sRevenue, // Not: Bu sadece son 30 günün cirosudur
          shopRevenue: sRevenue,
          membershipRevenue: mRevenue,
          activeMemberCount: activeCount,
          totalMembers: totalMembers,
        });
        setBusyHours(hoursMap);
        setRecentSales(recentList);
        setLoading(false);
      } catch (e) {
        console.error('Analytics error:', e);
        Alert.alert('Hata', 'Veriler hesaplanamadı.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FF8C00" size="large" />
      </View>
    );

  const pieData = [
    {
      name: 'Mağaza',
      population: stats.shopRevenue,
      color: '#FF9500',
      legendFontColor: '#FFF',
      legendFontSize: 12,
    },
    {
      name: 'Üyelik',
      population: stats.membershipRevenue,
      color: '#007AFF',
      legendFontColor: '#FFF',
      legendFontSize: 12,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <Text style={styles.header}>RAPOR (Son 30 Gün) 📊</Text>

      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        {/* KPI KARTLARI */}
        <View style={styles.kpiRow}>
          <View
            style={[
              styles.kpiCard,
              { backgroundColor: '#1E1E1E', borderLeftColor: '#4CD964' },
            ]}
          >
            <Text style={styles.kpiLabel}>AYLIK CİRO</Text>
            <Text style={styles.kpiValue}>{stats.totalRevenue} ₺</Text>
          </View>
          <View
            style={[
              styles.kpiCard,
              { backgroundColor: '#1E1E1E', borderLeftColor: '#007AFF' },
            ]}
          >
            <Text style={styles.kpiLabel}>AKTİF / TOPLAM ÜYE</Text>
            <Text style={styles.kpiValue}>
              {stats.activeMemberCount} / {stats.totalMembers}
            </Text>
          </View>
        </View>

        {/* GELİR DAĞILIMI */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>GELİR DAĞILIMI 💰</Text>
          {stats.totalRevenue > 0 ? (
            <PieChart
              data={pieData}
              width={screenWidth - 40}
              height={200}
              chartConfig={{ color: (opacity = 1) => `white` }}
              accessor={'population'}
              backgroundColor={'transparent'}
              paddingLeft={'15'}
              absolute
            />
          ) : (
            <Text style={{ color: '#666', textAlign: 'center', marginTop: 20 }}>
              Bu ay veri yok.
            </Text>
          )}
        </View>

        {/* BUGÜNKÜ YOĞUNLUK */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>BUGÜNKÜ YOĞUNLUK 🕒</Text>
          <BarChart
            data={{
              labels: ['08-10', '10-12', '12-14', '14-16', '16-18', '18+'],
              datasets: [{ data: busyHours }],
            }}
            width={screenWidth - 60}
            height={220}
            yAxisLabel=""
            chartConfig={{
              backgroundColor: '#1E1E1E',
              backgroundGradientFrom: '#1E1E1E',
              backgroundGradientTo: '#1E1E1E',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 140, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            }}
            style={{ borderRadius: 16 }}
          />
        </View>

        {/* SON SATIŞLAR */}
        <View style={styles.listCard}>
          <Text style={styles.cardTitle}>SON İŞLEMLER 🛒</Text>
          {recentSales.map((item, index) => (
            <View key={index} style={styles.saleRow}>
              <View>
                <Text
                  style={[
                    styles.saleProduct,
                    item.isMembership && { color: '#007AFF' },
                  ]}
                >
                  {item.name}
                </Text>
                <Text style={styles.saleUser}>
                  {item.buyer} • {item.date}
                </Text>
              </View>
              <Text style={styles.salePrice}>+{item.price} ₺</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 15 },
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
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  kpiCard: {
    width: '48%',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 5,
  },
  kpiLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  kpiValue: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  chartCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardTitle: {
    color: '#FF8C00',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  listCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  saleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingVertical: 10,
  },
  saleProduct: { color: 'white', fontWeight: 'bold' },
  saleUser: { color: '#888', fontSize: 12 },
  salePrice: { color: '#4CD964', fontWeight: 'bold', fontSize: 16 },
});

export default AdminAnalyticsScreen;

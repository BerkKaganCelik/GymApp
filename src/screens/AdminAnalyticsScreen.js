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

// 🔥 ADIM 1: Tema Hook'unu İmport Et
import { useTheme } from '../context/ThemeContext';

const screenWidth = Dimensions.get('window').width;

const AdminAnalyticsScreen = () => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, t, isDark } = useTheme();

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
        const totalMembersSnap = await firestore()
          .collection('users')
          .count()
          .get();
        const totalMembers = totalMembersSnap.data().count;

        const activeMembersSnap = await firestore()
          .collection('users')
          .where('isActive', '==', true)
          .where('role', '==', 'member')
          .count()
          .get();
        const activeCount = activeMembersSnap.data().count;

        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const ordersSnap = await firestore()
          .collection('orders')
          .where('orderDate', '>=', lastMonth)
          .orderBy('orderDate', 'desc')
          .get();

        let sRevenue = 0;
        let mRevenue = 0;
        const recentList = [];

        ordersSnap.forEach(doc => {
          const data = doc.data();
          const price = parseFloat(data.price) || 0;

          if (data.type === 'membership') {
            mRevenue += price;
          } else {
            sRevenue += price;
          }

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
          totalRevenue: mRevenue + sRevenue,
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
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );

  const pieData = [
    {
      name: t.store || 'Mağaza', // Eğer çeviri yoksa varsayılan
      population: stats.shopRevenue,
      color: '#FF9500',
      legendFontColor: theme.text, // 🔥 Dinamik renk
      legendFontSize: 12,
    },
    {
      name: 'Üyelik',
      population: stats.membershipRevenue,
      color: '#007AFF',
      legendFontColor: theme.text, // 🔥 Dinamik renk
      legendFontSize: 12,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      {/* Başlık Dinamik */}
      <Text style={[styles.header, { color: theme.text }]}>
        {t.businessIntel || 'RAPOR'} (30 Gün) 📊
      </Text>

      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        {/* KPI KARTLARI */}
        <View style={styles.kpiRow}>
          <View
            style={[
              styles.kpiCard,
              { backgroundColor: theme.card, borderLeftColor: '#4CD964' }, // 🔥 Dinamik Arkaplan
            ]}
          >
            <Text style={[styles.kpiLabel, { color: theme.subText }]}>
              AYLIK CİRO
            </Text>
            <Text style={[styles.kpiValue, { color: theme.text }]}>
              {stats.totalRevenue} ₺
            </Text>
          </View>
          <View
            style={[
              styles.kpiCard,
              { backgroundColor: theme.card, borderLeftColor: '#007AFF' }, // 🔥 Dinamik Arkaplan
            ]}
          >
            <Text style={[styles.kpiLabel, { color: theme.subText }]}>
              AKTİF / TOPLAM
            </Text>
            <Text style={[styles.kpiValue, { color: theme.text }]}>
              {stats.activeMemberCount} / {stats.totalMembers}
            </Text>
          </View>
        </View>

        {/* GELİR DAĞILIMI */}
        <View
          style={[
            styles.chartCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.primary }]}>
            GELİR DAĞILIMI 💰
          </Text>
          {stats.totalRevenue > 0 ? (
            <PieChart
              data={pieData}
              width={screenWidth - 40}
              height={200}
              chartConfig={{ color: (opacity = 1) => theme.text }} // 🔥 Dinamik renk
              accessor={'population'}
              backgroundColor={'transparent'}
              paddingLeft={'15'}
              absolute
            />
          ) : (
            <Text
              style={{
                color: theme.subText,
                textAlign: 'center',
                marginTop: 20,
              }}
            >
              Bu ay veri yok.
            </Text>
          )}
        </View>

        {/* BUGÜNKÜ YOĞUNLUK */}
        <View
          style={[
            styles.chartCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.primary }]}>
            BUGÜNKÜ YOĞUNLUK 🕒
          </Text>
          <BarChart
            data={{
              labels: ['08-10', '10-12', '12-14', '14-16', '16-18', '18+'],
              datasets: [{ data: busyHours }],
            }}
            width={screenWidth - 60}
            height={220}
            yAxisLabel=""
            chartConfig={{
              backgroundColor: theme.card, // 🔥 Dinamik
              backgroundGradientFrom: theme.card, // 🔥 Dinamik
              backgroundGradientTo: theme.card, // 🔥 Dinamik
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 140, 0, ${opacity})`,
              labelColor: (opacity = 1) =>
                isDark
                  ? `rgba(255, 255, 255, ${opacity})`
                  : `rgba(0, 0, 0, ${opacity})`, // 🔥 Dinamik Label
            }}
            style={{ borderRadius: 16 }}
          />
        </View>

        {/* SON SATIŞLAR */}
        <View
          style={[
            styles.listCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.primary }]}>
            SON İŞLEMLER 🛒
          </Text>
          {recentSales.map((item, index) => (
            <View
              key={index}
              style={[styles.saleRow, { borderBottomColor: theme.border }]}
            >
              <View>
                <Text
                  style={[
                    styles.saleProduct,
                    { color: theme.text },
                    item.isMembership && { color: '#007AFF' },
                  ]}
                >
                  {item.name}
                </Text>
                <Text style={[styles.saleUser, { color: theme.subText }]}>
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
  container: { flex: 1, padding: 15 },
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
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  kpiValue: { fontSize: 20, fontWeight: 'bold' },
  chartCard: {
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  listCard: {
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
  },
  saleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  saleProduct: { fontWeight: 'bold' },
  saleUser: { fontSize: 12 },
  salePrice: { color: '#4CD964', fontWeight: 'bold', fontSize: 16 },
});

export default AdminAnalyticsScreen;

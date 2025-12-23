import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  FlatList,
} from 'react-native';
import { useRoute } from '@react-navigation/native';

const MemberWorkoutDetailScreen = ({ navigation }) => {
  const route = useRoute();
  // Navigasyondan gelen veriyi alıyoruz
  const { workoutLog, date } = route.params;

  // Toplam kaldırılan ağırlığı (Volume) hesapla
  const totalVolume =
    workoutLog?.reduce((totalEx, exercise) => {
      return (
        totalEx +
        exercise.sets.reduce((totalSet, set) => {
          // Sadece tamamlanmış setlerin ağırlığını topla
          return totalSet + (set.isDone ? parseFloat(set.weight) || 0 : 0);
        }, 0)
      );
    }, 0) || 0;

  const ExerciseCard = ({ item }) => (
    <View style={styles.exerciseCard}>
      {/* Hareket Başlığı */}
      <View style={styles.cardHeader}>
        <Text style={styles.exName}>{item.name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {item.setsDone}/{item.plannedSets} Set
          </Text>
        </View>
      </View>

      {/* Tablo Başlıkları */}
      <View style={styles.tableHeader}>
        <Text style={[styles.colText, { flex: 0.5 }]}>SET</Text>
        <Text style={[styles.colText, { flex: 1 }]}>HEDEF</Text>
        <Text style={[styles.colText, { flex: 1 }]}>AĞIRLIK</Text>
        <Text style={[styles.colText, { flex: 0.5, textAlign: 'right' }]}>
          DURUM
        </Text>
      </View>

      {/* Set Listesi */}
      <View>
        {item.sets.map((set, index) => (
          <View
            key={index}
            style={[styles.setRow, index % 2 === 0 && styles.rowAlt]}
          >
            {/* 1. Set Numarası */}
            <Text style={[styles.cellText, { flex: 0.5, color: '#888' }]}>
              #{set.setNo}
            </Text>

            {/* 2. Tekrar Sayısı */}
            <Text style={[styles.cellText, { flex: 1 }]}>
              {set.plannedReps} Tk
            </Text>

            {/* 3. Ağırlık (En Önemli Kısım) */}
            <View
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
            >
              <Text
                style={[styles.weightText, !set.isDone && { color: '#555' }]}
              >
                {set.isDone
                  ? set.weight > 0
                    ? `${set.weight} kg`
                    : 'Vücut Ağ.'
                  : '-'}
              </Text>
            </View>

            {/* 4. Durum İkonu */}
            <Text style={{ flex: 0.5, textAlign: 'right' }}>
              {set.isDone ? '✅' : '❌'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <View style={styles.headerContainer}>
        <Text style={styles.header}>ANTRENMAN RAPORU 📋</Text>
        <Text style={styles.dateText}>{date}</Text>
      </View>

      {/* ÖZET KARTI */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>TOPLAM HACİM</Text>
          <Text style={styles.summaryValue}>{totalVolume} KG</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>HAREKET SAYISI</Text>
          <Text style={styles.summaryValue}>{workoutLog?.length || 0}</Text>
        </View>
      </View>

      <FlatList
        data={workoutLog}
        keyExtractor={(item, index) => index.toString()}
        renderItem={ExerciseCard}
        contentContainerStyle={{ paddingBottom: 50 }}
        ListEmptyComponent={
          <Text style={{ color: '#666', textAlign: 'center', marginTop: 50 }}>
            Detay bulunamadı.
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 15 },

  headerContainer: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1,
  },
  dateText: { color: '#FF8C00', fontSize: 14, marginTop: 5 },

  // Özet Kartı
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: '80%', backgroundColor: '#444' },
  summaryLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  summaryValue: { color: '#4CD964', fontSize: 24, fontWeight: 'bold' },

  // Egzersiz Kartı
  exerciseCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    marginBottom: 15,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingBottom: 10,
  },
  exName: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  badge: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  badgeText: { color: '#AAA', fontSize: 12, fontWeight: 'bold' },

  // Tablo Yapısı
  tableHeader: { flexDirection: 'row', marginBottom: 8, paddingHorizontal: 5 },
  colText: { color: '#666', fontSize: 10, fontWeight: 'bold' },

  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 5,
  },
  rowAlt: { backgroundColor: '#252525' }, // Satırları ayırt etmek için renk
  cellText: { color: 'white', fontSize: 14 },
  weightText: { color: '#FF8C00', fontWeight: 'bold', fontSize: 15 },
});

export default MemberWorkoutDetailScreen;

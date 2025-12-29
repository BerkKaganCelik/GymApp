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

// 🔥 ADIM 1: Tema Hook'unu İmport Et
import { useTheme } from '../context/ThemeContext';

const MemberWorkoutDetailScreen = ({ navigation }) => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, t, isDark } = useTheme();

  const route = useRoute();
  const { workoutLog, date } = route.params;

  // Toplam kaldırılan ağırlığı (Volume) hesapla
  const totalVolume =
    workoutLog?.reduce((totalEx, exercise) => {
      return (
        totalEx +
        exercise.sets.reduce((totalSet, set) => {
          return totalSet + (set.isDone ? parseFloat(set.weight) || 0 : 0);
        }, 0)
      );
    }, 0) || 0;

  const ExerciseCard = ({ item }) => (
    <View
      style={[
        styles.exerciseCard,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          borderLeftColor: theme.primary,
        },
      ]}
    >
      {/* Hareket Başlığı */}
      <View style={[styles.cardHeader, { borderBottomColor: theme.border }]}>
        <Text style={[styles.exName, { color: theme.text }]}>{item.name}</Text>
        <View style={[styles.badge, { backgroundColor: theme.inputBg }]}>
          <Text style={[styles.badgeText, { color: theme.subText }]}>
            {item.setsDone}/{item.plannedSets} Set
          </Text>
        </View>
      </View>

      {/* Tablo Başlıkları */}
      <View style={styles.tableHeader}>
        <Text style={[styles.colText, { flex: 0.5, color: theme.subText }]}>
          {t.set || 'SET'}
        </Text>
        <Text style={[styles.colText, { flex: 1, color: theme.subText }]}>
          {t.target || 'HEDEF'}
        </Text>
        <Text style={[styles.colText, { flex: 1, color: theme.subText }]}>
          {t.weight || 'AĞIRLIK'}
        </Text>
        <Text
          style={[
            styles.colText,
            { flex: 0.5, textAlign: 'right', color: theme.subText },
          ]}
        >
          {t.status || 'DURUM'}
        </Text>
      </View>

      {/* Set Listesi */}
      <View>
        {item.sets.map((set, index) => (
          <View
            key={index}
            style={[
              styles.setRow,
              index % 2 === 0 && { backgroundColor: theme.inputBg }, // Alternatif satır rengi
            ]}
          >
            {/* 1. Set Numarası */}
            <Text
              style={[styles.cellText, { flex: 0.5, color: theme.subText }]}
            >
              #{set.setNo}
            </Text>

            {/* 2. Tekrar Sayısı */}
            <Text style={[styles.cellText, { flex: 1, color: theme.text }]}>
              {set.plannedReps} Tk
            </Text>

            {/* 3. Ağırlık (En Önemli Kısım) */}
            <View
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
            >
              <Text
                style={[
                  styles.weightText,
                  { color: set.isDone ? theme.primary : theme.subText },
                ]}
              >
                {set.isDone
                  ? set.weight > 0
                    ? `${set.weight} kg`
                    : t.bodyWeight || 'Vücut Ağ.'
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
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      <View style={styles.headerContainer}>
        <Text style={[styles.header, { color: theme.text }]}>
          {t.workoutReport || 'ANTRENMAN RAPORU'} 📋
        </Text>
        <Text style={[styles.dateText, { color: theme.primary }]}>{date}</Text>
      </View>

      {/* ÖZET KARTI */}
      <View
        style={[
          styles.summaryCard,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.subText }]}>
            {t.totalVolume || 'TOPLAM HACİM'}
          </Text>
          <Text style={[styles.summaryValue, { color: theme.success }]}>
            {totalVolume} KG
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.subText }]}>
            {t.exerciseCount || 'HAREKET SAYISI'}
          </Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {workoutLog?.length || 0}
          </Text>
        </View>
      </View>

      <FlatList
        data={workoutLog}
        keyExtractor={(item, index) => index.toString()}
        renderItem={ExerciseCard}
        contentContainerStyle={{ paddingBottom: 50 }}
        ListEmptyComponent={
          <Text
            style={{ color: theme.subText, textAlign: 'center', marginTop: 50 }}
          >
            {t.noDetails || 'Detay bulunamadı.'}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },

  headerContainer: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  dateText: { fontSize: 14, marginTop: 5 },

  // Özet Kartı
  summaryCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: '80%' },
  summaryLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  summaryValue: { fontSize: 24, fontWeight: 'bold' },

  // Egzersiz Kartı
  exerciseCard: {
    borderRadius: 15,
    marginBottom: 15,
    padding: 15,
    borderLeftWidth: 4,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  exName: { fontSize: 18, fontWeight: 'bold' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  badgeText: { fontSize: 12, fontWeight: 'bold' },

  // Tablo Yapısı
  tableHeader: { flexDirection: 'row', marginBottom: 8, paddingHorizontal: 5 },
  colText: { fontSize: 10, fontWeight: 'bold' },

  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 5,
  },
  cellText: { fontSize: 14 },
  weightText: { fontWeight: 'bold', fontSize: 15 },
});

export default MemberWorkoutDetailScreen;

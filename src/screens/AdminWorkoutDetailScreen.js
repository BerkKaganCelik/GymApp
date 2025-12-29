import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

// 🔥 ADIM 1: Tema Hook'unu İmport Et
import { useTheme } from '../context/ThemeContext';

const AdminWorkoutDetailScreen = () => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, t, isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [allLogs, setAllLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const userCache = useRef({});

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('workout_history')
      .orderBy('date', 'desc')
      .limit(50)
      .onSnapshot(
        async querySnapshot => {
          if (!querySnapshot) return;

          const promises = querySnapshot.docs.map(async doc => {
            const data = doc.data();
            let finalName = data.fullName;
            const uid = data.userId;

            if (
              (!finalName ||
                finalName === 'Üye' ||
                finalName === 'Bilinmeyen Üye') &&
              uid
            ) {
              if (userCache.current[uid]) {
                finalName = userCache.current[uid];
              } else {
                try {
                  const userDoc = await firestore()
                    .collection('users')
                    .doc(uid)
                    .get();
                  if (userDoc.exists) {
                    finalName = userDoc.data().fullName;
                    userCache.current[uid] = finalName;
                  }
                } catch (e) {
                  console.log('Kullanıcı ismi çekilemedi:', e);
                }
              }
            }

            return {
              ...data,
              key: doc.id,
              dateObj: data.date ? data.date.toDate() : new Date(),
              fullName: finalName || 'İsimsiz Üye',
            };
          });

          const list = await Promise.all(promises);

          setAllLogs(list);
          setFilteredLogs(list);
          setLoading(false);
        },
        error => {
          console.error('Veri çekme hatası:', error);
          setLoading(false);
        },
      );

    return () => unsubscribe();
  }, []);

  const handleSearch = text => {
    setSearch(text);
    if (text) {
      const filtered = allLogs.filter(item =>
        item.fullName.toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredLogs(filtered);
    } else {
      setFilteredLogs(allLogs);
    }
  };

  const formatDate = dateObj => {
    return (
      dateObj.toLocaleDateString('tr-TR') +
      ' ' +
      dateObj.toLocaleTimeString('tr-TR').slice(0, 5)
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.logCard,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
      onPress={() => setSelectedLog(item)}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.userAvatar,
            { backgroundColor: theme.inputBg, borderColor: theme.border },
          ]}
        >
          <Text style={{ fontSize: 18, color: theme.text, fontWeight: 'bold' }}>
            {item.fullName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.logUser, { color: theme.text }]}>
            {item.fullName}
          </Text>
          <Text style={[styles.logDate, { color: theme.subText }]}>
            {formatDate(item.dateObj)}
          </Text>
        </View>
        <View
          style={[
            styles.totalBadge,
            { borderColor: theme.primary, backgroundColor: theme.inputBg },
          ]}
        >
          <Text style={[styles.totalText, { color: theme.primary }]}>
            ⚡{' '}
            {item.totalWeightLifted
              ? Math.round(item.totalWeightLifted) + ' KG'
              : '-'}
          </Text>
        </View>
      </View>

      <Text style={[styles.programName, { color: theme.subText }]}>
        Program: <Text style={{ color: theme.text }}>{item.programName}</Text>
      </Text>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginTop: 5,
        }}
      >
        <Text
          style={{ color: theme.primary, fontSize: 12, fontWeight: 'bold' }}
        >
          {t.viewDetails || 'Detayları Gör'} ➡️
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderDetailModal = () => {
    if (!selectedLog) return null;

    return (
      <Modal
        visible={!!selectedLog}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedLog(null)}
      >
        <View style={styles.modalBg}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.bg, borderColor: theme.border },
            ]}
          >
            <View
              style={[
                styles.modalHeaderBox,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <View>
                <Text style={[styles.modalUser, { color: theme.text }]}>
                  {selectedLog.fullName}
                </Text>
                <Text style={[styles.modalDate, { color: theme.subText }]}>
                  {formatDate(selectedLog.dateObj)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeIcon}
                onPress={() => setSelectedLog(null)}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>X</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, padding: 15 }}>
              {selectedLog.detailedLog?.map((exercise, exIndex) => (
                <View
                  key={exIndex}
                  style={[
                    styles.exerciseCard,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.border,
                      paddingBottom: 5,
                    }}
                  >
                    <Text style={[styles.exName, { color: theme.text }]}>
                      {exercise.name}
                    </Text>
                    <Text
                      style={{
                        color: theme.success,
                        fontSize: 12,
                        fontWeight: 'bold',
                      }}
                    >
                      {exercise.setsDone} Set ✅
                    </Text>
                  </View>

                  <View style={styles.setTable}>
                    <View
                      style={[
                        styles.tableHeader,
                        { borderBottomColor: theme.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.col,
                          { flex: 0.5, color: theme.subText },
                        ]}
                      >
                        SET
                      </Text>
                      <Text
                        style={[
                          styles.col,
                          {
                            flex: 1,
                            textAlign: 'center',
                            color: theme.subText,
                          },
                        ]}
                      >
                        KİLO
                      </Text>
                      <Text
                        style={[
                          styles.col,
                          {
                            flex: 1,
                            textAlign: 'center',
                            color: theme.subText,
                          },
                        ]}
                      >
                        TEKRAR
                      </Text>
                    </View>

                    {exercise.sets.map((set, setIndex) => (
                      <View
                        key={setIndex}
                        style={[
                          styles.tableRow,
                          { borderBottomColor: theme.border }, // 🔥 Sınır rengi
                          !set.isDone && { opacity: 0.4 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.cell,
                            { flex: 0.5, color: theme.subText },
                          ]}
                        >
                          #{set.setNo}
                        </Text>

                        <View style={{ flex: 1, alignItems: 'center' }}>
                          <Text
                            style={[
                              styles.cell,
                              {
                                color: theme.primary,
                                fontWeight: 'bold',
                                fontSize: 16,
                              },
                            ]}
                          >
                            {set.isDone ? set.weight || 0 : '-'}{' '}
                            <Text
                              style={{ fontSize: 10, color: theme.subText }}
                            >
                              kg
                            </Text>
                          </Text>
                        </View>

                        <View style={{ flex: 1, alignItems: 'center' }}>
                          <Text style={[styles.cell, { color: theme.text }]}>
                            {set.plannedReps}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}

              {(!selectedLog.detailedLog ||
                selectedLog.detailedLog.length === 0) && (
                <Text
                  style={{
                    color: theme.subText,
                    textAlign: 'center',
                    marginTop: 20,
                  }}
                >
                  Detay verisi bulunamadı.
                </Text>
              )}

              <View style={{ height: 50 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      <View style={styles.headerContainer}>
        {/* Başlık Dinamik */}
        <Text style={[styles.header, { color: theme.text }]}>
          {t.workoutReports || 'ANTRENMAN RAPORLARI'} 📋
        </Text>
      </View>

      <View
        style={[
          styles.searchBox,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Text style={{ fontSize: 18, marginRight: 10 }}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Üye adı ile ara..."
          placeholderTextColor={theme.subText}
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      <FlatList
        data={filteredLogs}
        keyExtractor={item => item.key}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: theme.subText }]}>
            Henüz antrenman kaydı yok.
          </Text>
        }
      />

      {renderDetailModal()}
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
  headerContainer: { marginBottom: 15, marginTop: 10, alignItems: 'center' },
  header: { fontSize: 22, fontWeight: 'bold' },
  searchBox: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
  },
  searchInput: { flex: 1, padding: 0, fontSize: 16 },
  logCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    borderWidth: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  userAvatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  logUser: { fontWeight: 'bold', fontSize: 16 },
  logDate: { fontSize: 12, marginTop: 2 },
  totalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  totalText: { fontWeight: 'bold', fontSize: 14 },
  programName: { fontSize: 13, marginTop: 5 },
  emptyText: { textAlign: 'center', marginTop: 50 },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    padding: 10,
  },
  modalContent: {
    borderRadius: 15,
    borderWidth: 1,
    height: '90%',
    overflow: 'hidden',
  },
  modalHeaderBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalUser: { fontSize: 22, fontWeight: 'bold' },
  modalDate: { fontSize: 13, marginTop: 2 },
  closeIcon: {
    backgroundColor: '#FF3B30',
    width: 35,
    height: 35,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
  },
  exName: { fontSize: 18, fontWeight: 'bold' },
  setTable: { marginTop: 5 },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  col: { fontSize: 11, fontWeight: 'bold' },
  cell: { fontSize: 15 },
});

export default AdminWorkoutDetailScreen;

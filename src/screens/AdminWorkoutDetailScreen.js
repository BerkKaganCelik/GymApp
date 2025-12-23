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

const AdminWorkoutDetailScreen = () => {
  const [loading, setLoading] = useState(true);
  const [allLogs, setAllLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  // ✨ YENİ: İsimleri hafızada tutmak için önbellek (Sürekli okuma yapmasın)
  const userCache = useRef({});

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('workout_history')
      .orderBy('date', 'desc')
      .limit(50)
      .onSnapshot(
        async querySnapshot => {
          if (!querySnapshot) return;

          // Tüm işlemleri Promise.all ile paralel yapıyoruz
          const promises = querySnapshot.docs.map(async doc => {
            const data = doc.data();
            let finalName = data.fullName;
            const uid = data.userId;

            // 🔍 EĞER İSİM YOKSA VEYA 'Üye' YAZIYORSA GERÇEK İSMİ BUL
            if (
              (!finalName ||
                finalName === 'Üye' ||
                finalName === 'Bilinmeyen Üye') &&
              uid
            ) {
              // 1. Önce Cache'e bak
              if (userCache.current[uid]) {
                finalName = userCache.current[uid];
              } else {
                // 2. Cache'de yoksa Firestore 'users' tablosundan çek
                try {
                  const userDoc = await firestore()
                    .collection('users')
                    .doc(uid)
                    .get();
                  if (userDoc.exists) {
                    finalName = userDoc.data().fullName;
                    // Bulduğumuz ismi Cache'e atalım
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
              fullName: finalName || 'İsimsiz Üye', // Hâlâ yoksa bunu yaz
            };
          });

          // Tüm veriler hazır olunca listeyi güncelle
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

  // KART GÖRÜNÜMÜ
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.logCard}
      onPress={() => setSelectedLog(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.userAvatar}>
          {/* İsmin baş harfi */}
          <Text style={{ fontSize: 18, color: '#FFF', fontWeight: 'bold' }}>
            {item.fullName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.logUser}>{item.fullName}</Text>
          <Text style={styles.logDate}>{formatDate(item.dateObj)}</Text>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalText}>
            ⚡{' '}
            {item.totalWeightLifted
              ? Math.round(item.totalWeightLifted) + ' KG'
              : '-'}
          </Text>
        </View>
      </View>

      <Text style={styles.programName}>
        Program: <Text style={{ color: '#CCC' }}>{item.programName}</Text>
      </Text>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginTop: 5,
        }}
      >
        <Text style={{ color: '#FF8C00', fontSize: 12, fontWeight: 'bold' }}>
          Detayları Gör ➡️
        </Text>
      </View>
    </TouchableOpacity>
  );

  // DETAY MODALI
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
          <View style={styles.modalContent}>
            {/* Modal Başlığı */}
            <View style={styles.modalHeaderBox}>
              <View>
                <Text style={styles.modalUser}>{selectedLog.fullName}</Text>
                <Text style={styles.modalDate}>
                  {formatDate(selectedLog.dateObj)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeIcon}
                onPress={() => setSelectedLog(null)}
              >
                <Text style={{ color: 'black', fontWeight: 'bold' }}>X</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, padding: 15 }}>
              {selectedLog.detailedLog?.map((exercise, exIndex) => (
                <View key={exIndex} style={styles.exerciseCard}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: '#333',
                      paddingBottom: 5,
                    }}
                  >
                    <Text style={styles.exName}>{exercise.name}</Text>
                    <Text
                      style={{
                        color: '#4CD964',
                        fontSize: 12,
                        fontWeight: 'bold',
                      }}
                    >
                      {exercise.setsDone} Set ✅
                    </Text>
                  </View>

                  {/* SET TABLOSU */}
                  <View style={styles.setTable}>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.col, { flex: 0.5 }]}>SET</Text>
                      <Text
                        style={[styles.col, { flex: 1, textAlign: 'center' }]}
                      >
                        KİLO
                      </Text>
                      <Text
                        style={[styles.col, { flex: 1, textAlign: 'center' }]}
                      >
                        TEKRAR
                      </Text>
                    </View>

                    {exercise.sets.map((set, setIndex) => (
                      <View
                        key={setIndex}
                        style={[
                          styles.tableRow,
                          !set.isDone && { opacity: 0.4 },
                        ]}
                      >
                        <Text
                          style={[styles.cell, { flex: 0.5, color: '#888' }]}
                        >
                          #{set.setNo}
                        </Text>

                        <View style={{ flex: 1, alignItems: 'center' }}>
                          <Text
                            style={[
                              styles.cell,
                              {
                                color: '#FF8C00',
                                fontWeight: 'bold',
                                fontSize: 16,
                              },
                            ]}
                          >
                            {set.isDone ? set.weight || 0 : '-'}{' '}
                            <Text style={{ fontSize: 10, color: '#666' }}>
                              kg
                            </Text>
                          </Text>
                        </View>

                        <View style={{ flex: 1, alignItems: 'center' }}>
                          <Text style={styles.cell}>{set.plannedReps}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}

              {(!selectedLog.detailedLog ||
                selectedLog.detailedLog.length === 0) && (
                <Text
                  style={{ color: '#666', textAlign: 'center', marginTop: 20 }}
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
      <View style={styles.center}>
        <ActivityIndicator color="#FF8C00" size="large" />
      </View>
    );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <View style={styles.headerContainer}>
        <Text style={styles.header}>ANTRENMAN RAPORLARI 📋</Text>
      </View>

      {/* ARAMA */}
      <View style={styles.searchBox}>
        <Text style={{ fontSize: 18, marginRight: 10 }}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Üye adı ile ara..."
          placeholderTextColor="#666"
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
          <Text style={styles.emptyText}>Henüz antrenman kaydı yok.</Text>
        }
      />

      {renderDetailModal()}
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

  headerContainer: { marginBottom: 15, marginTop: 10, alignItems: 'center' },
  header: { fontSize: 22, fontWeight: 'bold', color: 'white' },

  searchBox: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchInput: { flex: 1, color: 'white', padding: 0, fontSize: 16 },

  logCard: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF', // Mavi şerit
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  userAvatar: {
    width: 45,
    height: 45,
    backgroundColor: '#333',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  logUser: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  logDate: { color: '#888', fontSize: 12, marginTop: 2 },
  totalBadge: {
    backgroundColor: 'rgba(255, 140, 0, 0.15)', // Saydam turuncu
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF8C00',
  },
  totalText: { color: '#FF8C00', fontWeight: 'bold', fontSize: 14 },
  programName: { color: '#888', fontSize: 13, marginTop: 5 },

  emptyText: { color: '#666', textAlign: 'center', marginTop: 50 },

  // MODAL
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)', // Daha koyu arka plan
    justifyContent: 'center',
    padding: 10,
  },
  modalContent: {
    backgroundColor: '#121212',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#333',
    height: '90%',
    overflow: 'hidden',
  },
  modalHeaderBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalUser: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  modalDate: { color: '#888', fontSize: 13, marginTop: 2 },
  closeIcon: {
    backgroundColor: '#FF3B30',
    width: 35,
    height: 35,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  exerciseCard: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  exName: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  setTable: { marginTop: 5 },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  col: { color: '#888', fontSize: 11, fontWeight: 'bold' },
  cell: { color: 'white', fontSize: 15 },
});

export default AdminWorkoutDetailScreen;

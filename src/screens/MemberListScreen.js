import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
  TextInput,
  Linking,
  Image,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

const MemberListScreen = ({ navigation }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tümü'); // Tümü, Aktif, Pasif/Biten, Riskli

  // İstatistikler
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
  });

  useEffect(() => {
    // 🔥 ÖNEMLİ DÜZELTME:
    // Firestore'da 'orderBy' veya 'where' kullanınca, o alanı eksik olan üyeler LİSTEDEN SİLİNİR.
    // Bu yüzden burada "saf" veri çekiyoruz ve filtrelemeyi aşağıda yapıyoruz.
    // Böylece verisi eksik olan üyeleri de görebilirsin.

    const subscriber = firestore()
      .collection('users')
      // .where('role', '==', 'member') // İstersen bunu açabilirsin ama şimdilik herkesi gör.
      .onSnapshot(
        querySnapshot => {
          if (!querySnapshot) {
            setLoading(false);
            return;
          }

          const users = [];
          let act = 0;
          let exp = 0;

          querySnapshot.forEach(doc => {
            const data = doc.data();

            // Sadece 'role'ü member veya student olanları veya rolü boş olanları alalım (Gereksiz adminleri gizlemek için)
            // Eğer adminleri de görmek istersen bu if bloğunu kaldır.
            if (
              data.role &&
              data.role !== 'member' &&
              data.role !== 'student' &&
              data.role !== 'admin'
            ) {
              // Başka garip rolleri almayalım (opsiyonel)
            }

            // 1. Tarih Verisi Kontrolü (Çökme önleyici)
            let endDate = new Date(); // Varsayılan bugün
            let hasDate = false;

            if (data.membershipExpiry && data.membershipExpiry.toDate) {
              endDate = data.membershipExpiry.toDate();
              hasDate = true;
            }

            // 2. Aktiflik Mantığı
            const isActive = data.isActive && endDate > new Date();

            if (isActive) act++;
            else exp++;

            users.push({
              ...data,
              key: doc.id,
              isExpired: !isActive,
              // Tarih yoksa sıralamada hata vermesin diye null kontrolü
              createdAtObj:
                data.createdAt && data.createdAt.toDate
                  ? data.createdAt.toDate()
                  : new Date(0),
              daysLeft: hasDate
                ? Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24))
                : 0,
              displayDate: hasDate
                ? endDate.toLocaleDateString('tr-TR')
                : 'Tarih Yok',
              // Eğer ismi yoksa belli olsun
              fullName: data.fullName || 'İsimsiz Üye',
              packageName: data.packageName || 'Paket Seçilmemiş',
            });
          });

          // 3. Javascript ile Sıralama (En yeniden en eskiye)
          // Bu yöntem sayesinde 'createdAt' alanı olmayanlar gizlenmez, sadece en alta gider.
          users.sort((a, b) => b.createdAtObj - a.createdAtObj);

          setMembers(users);
          setStats({ total: users.length, active: act, expired: exp });
          setLoading(false);
        },
        error => {
          console.error('Veri Çekme Hatası:', error);
          Alert.alert('Hata', 'Veriler alınırken bir sorun oluştu.');
          setLoading(false);
        },
      );

    return () => subscriber();
  }, []);

  // --- AKILLI FİLTRELEME ---
  const filteredData = useMemo(() => {
    return members.filter(item => {
      // 1. Arama (İsim veya Telefon)
      const nameMatch = item.fullName
        .toLowerCase()
        .includes(searchText.toLowerCase());
      const phoneMatch = item.phone ? item.phone.includes(searchText) : false;
      const matchesSearch = nameMatch || phoneMatch;

      // 2. Sekme Filtresi
      let matchesFilter = true;
      if (activeFilter === 'Aktif') matchesFilter = !item.isExpired;
      if (activeFilter === 'Pasif/Biten') matchesFilter = item.isExpired;
      if (activeFilter === 'Riskli')
        matchesFilter = item.daysLeft <= 5 && item.daysLeft > 0;

      return matchesSearch && matchesFilter;
    });
  }, [members, searchText, activeFilter]);

  // --- AKSİYONLAR ---
  const openWhatsApp = phone => {
    if (!phone) return Alert.alert('Hata', 'Numara kayıtlı değil.');
    let number = phone.replace(/[^\d]/g, '');
    if (!number.startsWith('90')) number = '90' + number;
    Linking.openURL(`whatsapp://send?phone=${number}`);
  };

  const callPhone = phone => {
    if (!phone) return Alert.alert('Hata', 'Numara kayıtlı değil.');
    Linking.openURL(`tel:${phone}`);
  };

  const handleDelete = (userId, userName) => {
    Alert.alert(
      'Üyeyi Sil 🗑️',
      `${userName} isimli üyeyi silmek istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'SİL',
          style: 'destructive',
          onPress: () => {
            firestore()
              .collection('users')
              .doc(userId)
              .delete()
              .then(() => console.log('Silindi'))
              .catch(err => Alert.alert('Hata', err.message));
          },
        },
      ],
    );
  };

  // --- LİSTE ELEMANI ---
  const renderItem = ({ item }) => {
    const statusColor = item.isExpired ? '#FF3B30' : '#4CD964'; // Kırmızı veya Yeşil

    return (
      <View style={styles.card}>
        {/* Sol Renkli Şerit */}
        <View style={[styles.statusStrip, { backgroundColor: statusColor }]} />

        <View style={styles.cardContent}>
          {/* Tıklanınca Detaya/Düzenlemeye Git */}
          <TouchableOpacity
            style={styles.cardHeader}
            onPress={() =>
              navigation.navigate('EditMember', { userId: item.key })
            }
          >
            {/* Avatar */}
            <View style={styles.avatarContainer}>
              {item.profileImage ? (
                <Image
                  source={{ uri: item.profileImage }}
                  style={styles.avatar}
                />
              ) : (
                <Text style={{ fontSize: 18 }}>👤</Text>
              )}
            </View>

            {/* Bilgiler */}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.name}>{item.fullName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.subText}>{item.packageName}</Text>
                {/* Risk Rozeti */}
                {item.daysLeft <= 5 && item.daysLeft > 0 && (
                  <View style={styles.warningBadge}>
                    <Text style={styles.warningText}>{item.daysLeft} Gün!</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Durum Rozeti */}
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor + '20' },
              ]}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.isExpired ? 'PASİF' : 'AKTİF'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Alt Butonlar */}
          <View style={styles.actionRow}>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                onPress={() => openWhatsApp(item.phone)}
                style={[styles.miniBtn, { backgroundColor: '#25D366' }]}
              >
                <Text style={styles.btnText}>💬 WP</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => callPhone(item.phone)}
                style={[
                  styles.miniBtn,
                  { backgroundColor: '#007AFF', marginLeft: 8 },
                ]}
              >
                <Text style={styles.btnText}>📞 Ara</Text>
              </TouchableOpacity>

              {/* SİLME BUTONU */}
              <TouchableOpacity
                onPress={() => handleDelete(item.key, item.fullName)}
                style={[
                  styles.miniBtn,
                  { backgroundColor: '#FF3B30', marginLeft: 8 },
                ]}
              >
                <Text style={styles.btnText}>🗑️</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.expiryDate}>Bitiş: {item.displayDate}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF8C00" />
      </View>
    );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* 1. KOKPİT (İstatistikler) */}
      <View style={styles.dashboard}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>TOPLAM</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#4CD964' }]}>
            {stats.active}
          </Text>
          <Text style={styles.statLabel}>AKTİF</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#FF3B30' }]}>
            {stats.expired}
          </Text>
          <Text style={styles.statLabel}>BİTEN</Text>
        </View>
      </View>

      {/* 2. ARAMA ve SEKMELER */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="İsim veya Telefon ara..."
          placeholderTextColor="#666"
          value={searchText}
          onChangeText={setSearchText}
        />

        <View style={styles.filterRow}>
          {['Tümü', 'Aktif', 'Pasif/Biten', 'Riskli'].map(filter => (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              style={[
                styles.filterChip,
                activeFilter === filter && styles.activeChip,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  activeFilter === filter && { color: '#000' },
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 3. LİSTE */}
      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={item => item.key}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Text style={{ fontSize: 30 }}>🔍</Text>
            <Text style={{ color: '#666', marginTop: 10 }}>
              Üye bulunamadı.
            </Text>
          </View>
        }
      />
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

  // Dashboard
  dashboard: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  statBox: { alignItems: 'center' },
  statNumber: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: '#888', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  divider: { width: 1, height: 30, backgroundColor: '#333' },

  // Arama & Filtre
  searchSection: { marginBottom: 15 },
  searchInput: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 10,
  },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between' },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#333',
  },
  activeChip: { backgroundColor: '#FF8C00', borderColor: '#FF8C00' },
  chipText: { color: '#888', fontSize: 11, fontWeight: 'bold' },

  // Kart Tasarımı
  card: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222',
  },
  statusStrip: { width: 6, height: '100%' },
  cardContent: { flex: 1, padding: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },

  avatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },

  name: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  subText: { color: '#888', fontSize: 12 },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  warningBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  warningText: { color: 'white', fontSize: 9, fontWeight: 'bold' },

  // Butonlar
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  miniBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  expiryDate: { color: '#666', fontSize: 11, fontStyle: 'italic' },
});

export default MemberListScreen;

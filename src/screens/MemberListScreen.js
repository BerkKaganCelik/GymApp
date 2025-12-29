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

// 🔥 ADIM 1: Tema Hook'unu İmport Et
import { useTheme } from '../context/ThemeContext';

const MemberListScreen = ({ navigation }) => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, t, isDark } = useTheme();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tümü'); // Filtre isimlerini aşağıda çevireceğiz

  // İstatistikler
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
  });

  useEffect(() => {
    // Firestore'da 'orderBy' veya 'where' kullanınca, o alanı eksik olan üyeler LİSTEDEN SİLİNİR.
    // Bu yüzden burada "saf" veri çekiyoruz ve filtrelemeyi aşağıda yapıyoruz.

    const subscriber = firestore()
      .collection('users')
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

            if (
              data.role &&
              data.role !== 'member' &&
              data.role !== 'student' &&
              data.role !== 'admin'
            ) {
              // Başka garip rolleri almayalım
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
              createdAtObj:
                data.createdAt && data.createdAt.toDate
                  ? data.createdAt.toDate()
                  : new Date(0),
              daysLeft: hasDate
                ? Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24))
                : 0,
              displayDate: hasDate
                ? endDate.toLocaleDateString('tr-TR')
                : t.noDate || 'Tarih Yok',
              fullName: data.fullName || t.unnamedMember || 'İsimsiz Üye',
              packageName:
                data.packageName || t.noPackage || 'Paket Seçilmemiş',
            });
          });

          // 3. Javascript ile Sıralama (En yeniden en eskiye)
          users.sort((a, b) => b.createdAtObj - a.createdAtObj);

          setMembers(users);
          setStats({ total: users.length, active: act, expired: exp });
          setLoading(false);
        },
        error => {
          console.error('Veri Çekme Hatası:', error);
          Alert.alert(
            t.error || 'Hata',
            t.fetchError || 'Veriler alınırken bir sorun oluştu.',
          );
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
    if (!phone)
      return Alert.alert(
        t.error || 'Hata',
        t.noPhone || 'Numara kayıtlı değil.',
      );
    let number = phone.replace(/[^\d]/g, '');
    if (!number.startsWith('90')) number = '90' + number;
    Linking.openURL(`whatsapp://send?phone=${number}`);
  };

  const callPhone = phone => {
    if (!phone)
      return Alert.alert(
        t.error || 'Hata',
        t.noPhone || 'Numara kayıtlı değil.',
      );
    Linking.openURL(`tel:${phone}`);
  };

  const handleDelete = (userId, userName) => {
    Alert.alert(
      t.deleteMemberTitle || 'Üyeyi Sil 🗑️',
      `${userName} ${
        t.deleteMemberConfirm ||
        'isimli üyeyi silmek istediğinize emin misiniz?'
      }`,
      [
        { text: t.cancel || 'Vazgeç', style: 'cancel' },
        {
          text: t.delete || 'SİL',
          style: 'destructive',
          onPress: () => {
            firestore()
              .collection('users')
              .doc(userId)
              .delete()
              .then(() => console.log('Silindi'))
              .catch(err => Alert.alert(t.error || 'Hata', err.message));
          },
        },
      ],
    );
  };

  // --- LİSTE ELEMANI ---
  const renderItem = ({ item }) => {
    const statusColor = item.isExpired ? theme.danger : theme.success;

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
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
            <View
              style={[
                styles.avatarContainer,
                { backgroundColor: theme.inputBg },
              ]}
            >
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
              <Text style={[styles.name, { color: theme.text }]}>
                {item.fullName}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.subText, { color: theme.subText }]}>
                  {item.packageName}
                </Text>
                {/* Risk Rozeti */}
                {item.daysLeft <= 5 && item.daysLeft > 0 && (
                  <View style={styles.warningBadge}>
                    <Text style={styles.warningText}>
                      {item.daysLeft} {t.days || 'Gün'}!
                    </Text>
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
                {item.isExpired ? t.passive || 'PASİF' : t.active || 'AKTİF'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Alt Butonlar */}
          <View style={[styles.actionRow, { borderTopColor: theme.border }]}>
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
                <Text style={styles.btnText}>📞 {t.call || 'Ara'}</Text>
              </TouchableOpacity>

              {/* SİLME BUTONU */}
              <TouchableOpacity
                onPress={() => handleDelete(item.key, item.fullName)}
                style={[
                  styles.miniBtn,
                  { backgroundColor: theme.danger, marginLeft: 8 },
                ]}
              >
                <Text style={styles.btnText}>🗑️</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.expiryDate, { color: theme.subText }]}>
              {t.end || 'Bitiş'}: {item.displayDate}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );

  // Filtre etiketlerini dile göre ayarlayalım
  const filterLabels = {
    Tümü: t.all || 'Tümü',
    Aktif: t.active || 'Aktif',
    'Pasif/Biten': t.passive || 'Pasif/Biten',
    Riskli: t.risky || 'Riskli',
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      {/* 1. KOKPİT (İstatistikler) */}
      <View
        style={[
          styles.dashboard,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: theme.text }]}>
            {stats.total}
          </Text>
          <Text style={[styles.statLabel, { color: theme.subText }]}>
            {t.total || 'TOPLAM'}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: theme.success }]}>
            {stats.active}
          </Text>
          <Text style={[styles.statLabel, { color: theme.subText }]}>
            {t.active || 'AKTİF'}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: theme.danger }]}>
            {stats.expired}
          </Text>
          <Text style={[styles.statLabel, { color: theme.subText }]}>
            {t.expired || 'BİTEN'}
          </Text>
        </View>
      </View>

      {/* 2. ARAMA ve SEKMELER */}
      <View style={styles.searchSection}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.card,
              color: theme.text,
              borderColor: theme.border,
            },
          ]}
          placeholder={t.searchPlaceholder || 'İsim veya Telefon ara...'}
          placeholderTextColor={theme.subText}
          value={searchText}
          onChangeText={setSearchText}
        />

        <View style={styles.filterRow}>
          {['Tümü', 'Aktif', 'Pasif/Biten', 'Riskli'].map(filterKey => (
            <TouchableOpacity
              key={filterKey}
              onPress={() => setActiveFilter(filterKey)}
              style={[
                styles.filterChip,
                { backgroundColor: theme.inputBg, borderColor: theme.border },
                activeFilter === filterKey && {
                  backgroundColor: theme.primary,
                  borderColor: theme.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: theme.subText },
                  activeFilter === filterKey && { color: 'white' }, // Seçili olunca beyaz
                ]}
              >
                {filterLabels[filterKey]}
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
            <Text style={{ color: theme.subText, marginTop: 10 }}>
              {t.noMemberFound || 'Üye bulunamadı.'}
            </Text>
          </View>
        }
      />
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
  dashboard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
  },
  statBox: { alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  divider: { width: 1, height: 30 },
  searchSection: { marginBottom: 15 },
  searchInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between' },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 11, fontWeight: 'bold' },
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  statusStrip: { width: 6, height: '100%' },
  cardContent: { flex: 1, padding: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  avatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  name: { fontSize: 16, fontWeight: 'bold' },
  subText: { fontSize: 12 },
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  miniBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  expiryDate: { fontSize: 11, fontStyle: 'italic' },
});

export default MemberListScreen;

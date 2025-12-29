import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Modal,
  FlatList,
  Linking,
  Dimensions,
  Image,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

// 🔥 ADIM 1: Tema Hook'unu İmport Et
import { useTheme } from '../context/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

const EXERCISE_DB = [
  // GÖĞÜS
  { id: '101', name: 'Barbell Bench Press', category: 'Göğüs' },
  { id: '102', name: 'Incline Dumbbell Press', category: 'Göğüs' },
  { id: '103', name: 'Cable Crossover', category: 'Göğüs' },
  { id: '104', name: 'Push Up (Şınav)', category: 'Göğüs' },
  // SIRT
  { id: '201', name: 'Lat Pulldown', category: 'Sırt' },
  { id: '202', name: 'Seated Cable Row', category: 'Sırt' },
  { id: '203', name: 'Deadlift', category: 'Sırt' },
  { id: '204', name: 'Pull Up (Barfiks)', category: 'Sırt' },
  // BACAK
  { id: '301', name: 'Squat', category: 'Bacak' },
  { id: '302', name: 'Leg Press', category: 'Bacak' },
  { id: '303', name: 'Leg Extension', category: 'Bacak' },
  { id: '304', name: 'Lunges', category: 'Bacak' },
  // OMUZ
  { id: '401', name: 'Overhead Press', category: 'Omuz' },
  { id: '402', name: 'Lateral Raise', category: 'Omuz' },
  { id: '403', name: 'Face Pull', category: 'Omuz' },
  // KOL
  { id: '501', name: 'Barbell Curl', category: 'Kol' },
  { id: '502', name: 'Tricep Pushdown', category: 'Kol' },
  { id: '503', name: 'Hammer Curl', category: 'Kol' },
  // KARDİYO & KARIN
  { id: '601', name: 'Koşu Bandı', category: 'Kardiyo' },
  { id: '602', name: 'Plank', category: 'Karın' },
  { id: '603', name: 'Mekik', category: 'Karın' },
];

const EditMemberScreen = ({ route, navigation }) => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, t, isDark } = useTheme();

  const { userId } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('program');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [healthNotes, setHealthNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [expiryDate, setExpiryDate] = useState(new Date());

  const [programList, setProgramList] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [day, setDay] = useState('Pazartesi');
  const [selectedDbExercise, setSelectedDbExercise] = useState(null);

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  useEffect(() => {
    const fetchMember = firestore()
      .collection('users')
      .doc(userId)
      .onSnapshot(doc => {
        if (doc.exists) {
          const data = doc.data();
          setName(data.fullName || '');
          setEmail(data.email || '');
          setPhone(data.phone || '');
          setHealthNotes(data.healthNotes || '');
          setIsActive(data.isActive === false ? false : true);
          if (data.membershipExpiry)
            setExpiryDate(data.membershipExpiry.toDate());
          if (data.workoutProgram) setProgramList(data.workoutProgram);
        } else {
          Alert.alert('Hata', 'Üye bulunamadı.');
          navigation.goBack();
        }
        setLoading(false);
      });
    return () => fetchMember();
  }, [userId]);

  const daysRemaining = Math.ceil(
    (expiryDate - new Date()) / (1000 * 60 * 60 * 24),
  );
  const isExpired = daysRemaining < 0;

  const categories = [
    'Tümü',
    'Göğüs',
    'Sırt',
    'Bacak',
    'Omuz',
    'Kol',
    'Karın',
    'Kardiyo',
  ];

  const filteredExercises = useMemo(() => {
    return EXERCISE_DB.filter(ex => {
      const matchesSearch = ex.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'Tümü' || ex.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleCall = () => phone && Linking.openURL(`tel:${phone}`);
  const handleWhatsApp = () =>
    phone && Linking.openURL(`whatsapp://send?phone=${phone}`);

  const extendMembership = months => {
    let newDate = expiryDate || new Date();
    if (new Date(newDate).getTime() < new Date().getTime())
      newDate = new Date();
    const extendedDate = new Date(
      newDate.setMonth(newDate.getMonth() + months),
    );
    setExpiryDate(extendedDate);
    Alert.alert(
      'Süre Eklendi',
      `Üyelik ${months} ay uzatıldı. Kaydetmeyi unutmayın.`,
    );
  };

  const toggleStatus = async () => {
    try {
      await firestore()
        .collection('users')
        .doc(userId)
        .update({ isActive: !isActive });
      setIsActive(!isActive);
    } catch (e) {
      Alert.alert('Hata', e.message);
    }
  };

  const addExerciseToProgram = () => {
    if (!selectedDbExercise)
      return Alert.alert('Eksik', 'Lütfen listeden hareket seçin.');
    const newMove = {
      id: Date.now().toString(),
      name: selectedDbExercise.name,
      sets: sets,
      reps: reps,
      day: day,
      category: selectedDbExercise.category,
    };
    setProgramList([...programList, newMove]);
    setModalVisible(false);
    setSelectedDbExercise(null);
    setSearchQuery('');
  };

  const removeExercise = id => {
    setProgramList(programList.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await firestore()
        .collection('users')
        .doc(userId)
        .update({
          fullName: name,
          phone: phone,
          healthNotes: healthNotes,
          membershipExpiry: firestore.Timestamp.fromDate(expiryDate),
          workoutProgram: programList,
        });

      await firestore().collection('notifications').add({
        targetUser: userId,
        title: 'Profil Güncellendi 🛠️',
        message:
          'Eğitmeniniz program veya üyelik bilgilerinizde güncelleme yaptı.',
        createdAt: firestore.FieldValue.serverTimestamp(),
        read: false,
      });

      Alert.alert('Başarılı', 'Tüm değişiklikler kaydedildi.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Hata', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      {/* 1. HEADER (KOKPİT) */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View
          style={[
            styles.avatarContainer,
            { backgroundColor: theme.inputBg, borderColor: theme.border },
          ]}
        >
          <Text style={{ fontSize: 28 }}>👤</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 15 }}>
          <Text style={[styles.headerName, { color: theme.text }]}>{name}</Text>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}
          >
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: isActive ? theme.success : theme.danger },
              ]}
            />
            <Text
              style={{
                color: theme.subText,
                fontSize: 12,
                marginLeft: 6,
                fontWeight: 'bold',
              }}
            >
              {isActive ? 'AKTİF ÜYE' : 'PASİF / DONUK'}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={handleCall} style={styles.iconBtn}>
            <Text>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleWhatsApp}
            style={[
              styles.iconBtn,
              { marginLeft: 10, backgroundColor: '#25D366' },
            ]}
          >
            <Text>💬</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. TABS */}
      <View style={[styles.tabContainer, { backgroundColor: theme.card }]}>
        {['program', 'membership', 'profile'].map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setActiveTab(t)}
            style={[
              styles.tabBtn,
              activeTab === t && { backgroundColor: theme.primary },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === t ? 'white' : theme.subText },
              ]}
            >
              {t === 'profile'
                ? 'PROFİL'
                : t === 'membership'
                ? 'ÜYELİK'
                : 'PROGRAM'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* --- PROGRAM SEKME --- */}
        {activeTab === 'program' && (
          <View>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={[
                styles.addExerciseBtn,
                { backgroundColor: theme.primary },
              ]}
            >
              <Text
                style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}
              >
                + YENİ HAREKET EKLE
              </Text>
            </TouchableOpacity>

            {programList.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: theme.border }]}>
                <Text style={{ fontSize: 40, opacity: 0.5 }}>🏋️</Text>
                <Text style={{ color: theme.subText, marginTop: 10 }}>
                  Antrenman programı boş.
                </Text>
              </View>
            ) : (
              programList.map((item, index) => (
                <View
                  key={index}
                  style={[styles.programCard, { backgroundColor: theme.card }]}
                >
                  <View style={styles.programCardLeft}>
                    <Text
                      style={[styles.programDayBadge, { color: theme.primary }]}
                    >
                      {item.day.toUpperCase()}
                    </Text>
                    <Text style={[styles.programExName, { color: theme.text }]}>
                      {item.name}
                    </Text>
                    <Text style={{ color: theme.subText, fontSize: 11 }}>
                      {item.category}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'center', marginRight: 15 }}>
                    <Text
                      style={{
                        color: theme.text,
                        fontWeight: 'bold',
                        fontSize: 16,
                      }}
                    >
                      {item.sets} x {item.reps}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeExercise(item.id)}
                    style={[
                      styles.deleteBtn,
                      { backgroundColor: theme.inputBg },
                    ]}
                  >
                    <Text
                      style={{
                        color: theme.danger,
                        fontWeight: 'bold',
                        fontSize: 10,
                      }}
                    >
                      SIL
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* --- ÜYELİK SEKME --- */}
        {activeTab === 'membership' && (
          <View>
            <View
              style={[
                styles.membershipCard,
                { backgroundColor: theme.card },
                isExpired && { borderColor: theme.danger, borderWidth: 1 },
              ]}
            >
              <Text style={[styles.cardTitle, { color: theme.subText }]}>
                KALAN GÜN SAYISI
              </Text>
              <Text
                style={[
                  styles.bigNumber,
                  { color: theme.text },
                  isExpired && { color: theme.danger },
                ]}
              >
                {daysRemaining > 0 ? daysRemaining : 0}
              </Text>
              <Text
                style={{ color: theme.subText, fontSize: 12, marginBottom: 15 }}
              >
                Bitiş: {expiryDate.toLocaleDateString('tr-TR')}
              </Text>
              <TouchableOpacity
                onPress={() => setDatePickerVisibility(true)}
                style={[styles.outlineBtn, { borderColor: theme.text }]}
              >
                <Text style={{ color: theme.text, fontSize: 12 }}>
                  TARİHİ EL İLE DÜZENLE
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionHeader, { color: theme.primary }]}>
              HIZLI UZATMA
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              {[1, 3, 6, 12].map(m => (
                <TouchableOpacity
                  key={m}
                  onPress={() => extendMembership(m)}
                  style={[
                    styles.monthBtn,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.monthBtnText, { color: theme.text }]}>
                    +{m} AY
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={toggleStatus}
              style={[
                styles.actionBtn,
                { backgroundColor: isActive ? theme.inputBg : theme.success },
              ]}
            >
              <Text
                style={{
                  color: isActive ? theme.danger : 'white',
                  fontWeight: 'bold',
                }}
              >
                {isActive ? 'ÜYELİĞİ DONDUR (PASİF)' : 'ÜYELİĞİ AKTİF ET'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- PROFİL SEKME --- */}
        {activeTab === 'profile' && (
          <View>
            <Text style={[styles.sectionHeader, { color: theme.primary }]}>
              İLETİŞİM BİLGİLERİ
            </Text>
            <View style={[styles.formSection, { backgroundColor: theme.card }]}>
              <Text style={[styles.label, { color: theme.primary }]}>
                Ad Soyad
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBg, color: theme.text },
                ]}
                value={name}
                onChangeText={setName}
              />

              <Text style={[styles.label, { color: theme.primary }]}>
                Telefon
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBg, color: theme.text },
                ]}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <Text style={[styles.label, { color: theme.primary }]}>
                E-Posta (Salt Okunur)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.bg, color: theme.subText },
                ]}
                value={email}
                editable={false}
              />
            </View>

            <Text style={[styles.sectionHeader, { color: theme.primary }]}>
              SAĞLIK & NOTLAR
            </Text>
            <View
              style={[
                styles.formSection,
                {
                  backgroundColor: theme.card,
                  borderLeftWidth: 3,
                  borderLeftColor: theme.danger,
                },
              ]}
            >
              <TextInput
                style={[
                  styles.input,
                  {
                    height: 80,
                    backgroundColor: 'transparent',
                    borderWidth: 0,
                    textAlignVertical: 'top',
                    color: theme.text,
                  },
                ]}
                value={healthNotes}
                onChangeText={setHealthNotes}
                placeholder="Özel sağlık durumu, sakatlık veya notlar..."
                placeholderTextColor={theme.subText}
                multiline
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* FLOAT SAVE BUTTON */}
      <TouchableOpacity
        style={[styles.floatingSave, { backgroundColor: theme.primary }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.saveText}>DEĞİŞİKLİKLERİ KAYDET ✅</Text>
        )}
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        date={expiryDate}
        onConfirm={date => {
          setExpiryDate(date);
          setDatePickerVisibility(false);
        }}
        onCancel={() => setDatePickerVisibility(false)}
      />

      {/* GELİŞMİŞ HAREKET EKLEME MODALI */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              HAREKET EKLE
            </Text>

            {/* Gün Seçimi */}
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
                marginBottom: 15,
              }}
            >
              {[
                'Pazartesi',
                'Salı',
                'Çarşamba',
                'Perşembe',
                'Cuma',
                'Cumartesi',
                'Pazar',
              ].map(d => (
                <TouchableOpacity
                  key={d}
                  onPress={() => setDay(d)}
                  style={[
                    styles.dayChip,
                    { backgroundColor: theme.inputBg },
                    day === d && { backgroundColor: theme.primary },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      color: day === d ? 'white' : theme.text,
                      fontWeight: 'bold',
                    }}
                  >
                    {d.substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Arama ve Filtre */}
            <TextInput
              style={[
                styles.searchBar,
                { backgroundColor: theme.inputBg, color: theme.text },
              ]}
              placeholder="Hareket ara..."
              placeholderTextColor={theme.subText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <View style={{ height: 35, marginBottom: 10 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor: theme.inputBg,
                        borderColor: theme.border,
                      },
                      selectedCategory === cat && {
                        backgroundColor: '#007AFF',
                        borderColor: '#007AFF',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: 'white',
                        fontSize: 10,
                        fontWeight: 'bold',
                      }}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Liste */}
            <FlatList
              data={filteredExercises}
              keyExtractor={i => i.id}
              style={[styles.dbList, { backgroundColor: theme.bg }]}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dbItem,
                    { borderColor: theme.border },
                    selectedDbExercise?.id === item.id && {
                      backgroundColor: theme.inputBg,
                    },
                  ]}
                  onPress={() => setSelectedDbExercise(item)}
                >
                  <Text
                    style={{
                      color:
                        selectedDbExercise?.id === item.id
                          ? theme.primary
                          : theme.text,
                      fontWeight: 'bold',
                    }}
                  >
                    {item.name}
                  </Text>
                  <Text style={{ color: theme.subText, fontSize: 10 }}>
                    {item.category}
                  </Text>
                </TouchableOpacity>
              )}
            />

            {/* Set/Tekrar */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
                marginTop: 10,
              }}
            >
              <View style={{ width: '48%' }}>
                <Text
                  style={{
                    color: theme.subText,
                    fontSize: 10,
                    marginBottom: 4,
                  }}
                >
                  SET
                </Text>
                <TextInput
                  style={[
                    styles.smallInput,
                    { backgroundColor: theme.inputBg, color: theme.text },
                  ]}
                  value={sets}
                  onChangeText={setSets}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ width: '48%' }}>
                <Text
                  style={{
                    color: theme.subText,
                    fontSize: 10,
                    marginBottom: 4,
                  }}
                >
                  TEKRAR
                </Text>
                <TextInput
                  style={[
                    styles.smallInput,
                    { backgroundColor: theme.inputBg, color: theme.text },
                  ]}
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={addExerciseToProgram}
              style={[styles.modalAddBtn, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.btnText}>LİSTEYE EKLE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{ marginTop: 15 }}
            >
              <Text style={{ color: theme.subText }}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerName: { fontSize: 20, fontWeight: 'bold' },
  statusIndicator: { width: 8, height: 8, borderRadius: 4 },
  iconBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabText: { fontWeight: 'bold', fontSize: 12 },
  addExerciseBtn: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  programCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  programCardLeft: { flex: 1 },
  programDayBadge: {
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 2,
  },
  programExName: { fontSize: 15, fontWeight: 'bold' },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 40,
    padding: 20,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderRadius: 15,
  },
  membershipCard: {
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  bigNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  outlineBtn: {
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
  monthBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  monthBtnText: { fontWeight: 'bold', fontSize: 12 },
  actionBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  formSection: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  label: {
    fontSize: 10,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  input: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 14,
  },
  floatingSave: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 10,
    zIndex: 100,
  },
  saveText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 5,
    marginBottom: 5,
  },
  searchBar: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 5,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
  },
  dbList: {
    height: 180,
    width: '100%',
    borderRadius: 10,
    marginBottom: 10,
  },
  dbItem: {
    padding: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  smallInput: {
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalAddBtn: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  btnText: { color: 'white', fontWeight: 'bold' },
});

export default EditMemberScreen;

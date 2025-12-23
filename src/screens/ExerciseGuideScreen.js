import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';

// --- GENİŞLETİLMİŞ PROFESYONEL VERİ TABANI (FULL LIBRARY) ---
const EXERCISE_DB = [
  // --- LEGS (BACAK) ---
  {
    id: 'l-1',
    title: 'Barbell Back Squat',
    muscleGroup: 'Quadriceps',
    secondaryMuscles: 'Glutes, Adductors, Core',
    type: 'Compound',
    mechanics: 'Push',
    equipment: 'Barbell',
    difficulty: 'Advanced',
    instructions: [
      'Barı trapezlerin üzerine yerleştir, ayakları omuz genişliğinde aç.',
      'Derin nefes al, karın kaslarını sık (Bracing).',
      'Kalçayı geriye iterek sandalyeye oturur gibi çök.',
      'Dizler ayak parmakları yönünde açılmalı, içe dönmemeli.',
      'Paralel seviyeye in ve topuklardan güç alarak kalk.',
    ],
    technicalTips: [
      'Topukların yerden asla kalkmamalı.',
      'Omurga nötr pozisyonunu koru.',
    ],
  },
  {
    id: 'l-2',
    title: 'Romanian Deadlift (RDL)',
    muscleGroup: 'Hamstrings',
    secondaryMuscles: 'Glutes, Lower Back, Forearms',
    type: 'Compound',
    mechanics: 'Pull',
    equipment: 'Barbell/Dumbbell',
    difficulty: 'Intermediate',
    instructions: [
      'Barı omuz genişliğinde tut, dik dur.',
      'Dizleri çok hafif bük (kilitli değil) ve sabitle.',
      'Kalçayı geriye doğru iterek gövdeni öne eğ.',
      'Bar bacaklarına sürtünerek diz altına kadar inmeli.',
      'Arka bacakta (hamstring) gerilimi hisset ve kalçayı öne iterek kalk.',
    ],
    technicalTips: [
      'Sırtını asla yuvarlama.',
      'Ağırlığı yere bırakma, gerilim sürekli kaslarda olsun.',
    ],
  },
  {
    id: 'l-3',
    title: 'Bulgarian Split Squat',
    muscleGroup: 'Quadriceps & Glutes',
    secondaryMuscles: 'Calves, Core',
    type: 'Unilateral',
    mechanics: 'Push',
    equipment: 'Dumbbell, Bench',
    difficulty: 'Hard',
    instructions: [
      'Bir ayağını arkandaki sehpaya koy, diğer ayağınla öne adım al.',
      'Gövdeni dik tutarak arka dizini yere yaklaştır.',
      'Öndeki dizin parmak ucunu aşırı geçmemeli.',
      'Öndeki bacağın topuğundan iterek yüksel.',
    ],
    technicalTips: [
      'Denge için karşıdaki sabit bir noktaya odaklan.',
      'Gövdeyi öne eğersen kalça, dik tutarsan ön bacak çalışır.',
    ],
  },
  {
    id: 'l-4',
    title: 'Leg Press',
    muscleGroup: 'Quadriceps',
    secondaryMuscles: 'Glutes',
    type: 'Machine',
    mechanics: 'Push',
    equipment: 'Machine',
    difficulty: 'Beginner',
    instructions: [
      'Sırtını ped’e tamamen yasla, bel boşluğu bırakma.',
      'Ayakları omuz genişliğinde platforma yerleştir.',
      'Platformun kilitlerini aç ve dizlerini göğsüne doğru indir.',
      'Ağırlığı yukarı it ama dizlerini tamamen kilitleme (Soft knees).',
    ],
    technicalTips: [
      'Dizlerini kilitlersen yük eklemlere biner, sakatlık riski artar.',
    ],
  },
  {
    id: 'l-5',
    title: 'Standing Calf Raise',
    muscleGroup: 'Calves (Gastrocnemius)',
    secondaryMuscles: '-',
    type: 'Isolation',
    mechanics: 'Push',
    equipment: 'Machine/Smith',
    difficulty: 'Beginner',
    instructions: [
      'Ayak parmak uçlarını basamağa yerleştir, topuklar boşlukta kalsın.',
      'Topuklarını mümkün olduğunca aşağı indirerek kası esnet.',
      'Parmak uçlarında yükselerek baldırları sık.',
      'Tepe noktada 1 saniye bekle.',
    ],
    technicalTips: ['Hareketi zıplayarak yapma, tam kontrol sağla.'],
  },

  // --- CHEST (GÖĞÜS) ---
  {
    id: 'c-1',
    title: 'Bench Press',
    muscleGroup: 'Pectoralis Major',
    secondaryMuscles: 'Triceps, Front Delts',
    type: 'Compound',
    mechanics: 'Push',
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    instructions: [
      'Sehpaya uzan, gözler barın altında.',
      'Kürek kemiklerini birbirine yaklaştır (Retraction).',
      'Barı göğüs ucuna kontrollü indir.',
      'Patlayıcı güçle yukarı it.',
    ],
    technicalTips: [
      'Dirsekleri 90 derece açma, vücuda 45-75 derece açı yapmalı.',
      'Bilekleri bükme.',
    ],
  },
  {
    id: 'c-2',
    title: 'Incline Dumbbell Press',
    muscleGroup: 'Upper Chest',
    secondaryMuscles: 'Front Delts, Triceps',
    type: 'Compound',
    mechanics: 'Push',
    equipment: 'Dumbbell, Incline Bench',
    difficulty: 'Intermediate',
    instructions: [
      'Sehpayı 30-45 derece eğime ayarla.',
      'Dumbbellları omuz hizasında tut.',
      'Yukarı doğru itip göğsü sıkıştır, ağırlıkları birbirine değdirme.',
      'Kontrollü şekilde omuz hizasına indir.',
    ],
    technicalTips: ['Açı arttıkça yük omuzlara kayar, 30 derece idealdir.'],
  },
  {
    id: 'c-3',
    title: 'Cable Crossover',
    muscleGroup: 'Pectoralis (Inner)',
    secondaryMuscles: '-',
    type: 'Isolation',
    mechanics: 'Push',
    equipment: 'Cable Machine',
    difficulty: 'Intermediate',
    instructions: [
      'Kabloları en üst makaraya ayarla.',
      'Bir adım öne çık, gövdeyi hafifçe öne eğ.',
      'Dirsekleri hafif bükük tutarak elleri göbek hizasında birleştir.',
      'Geriye açarken göğüste gerilimi hisset.',
    ],
    technicalTips: [
      'Pres yapar gibi itme, sarılıyormuş gibi (fly) hareket et.',
    ],
  },
  {
    id: 'c-4',
    title: 'Dips',
    muscleGroup: 'Lower Chest',
    secondaryMuscles: 'Triceps, Shoulders',
    type: 'Bodyweight',
    mechanics: 'Push',
    equipment: 'Parallel Bars',
    difficulty: 'Advanced',
    instructions: [
      'Barlara tutun ve kendini yukarı it.',
      'Gövdeni öne doğru eğ (göğüs odaklı olması için).',
      'Dirsekler 90 derece olana kadar in.',
      'Kendini yukarı it.',
    ],
    technicalTips: [
      'Gövde dik durursa arka kol (triceps) çalışır, öne eğilirsen göğüs çalışır.',
    ],
  },

  // --- BACK (SIRT) ---
  {
    id: 'b-1',
    title: 'Conventional Deadlift',
    muscleGroup: 'Posterior Chain',
    secondaryMuscles: 'Entire Back, Legs, Core',
    type: 'Compound',
    mechanics: 'Pull',
    equipment: 'Barbell',
    difficulty: 'Expert',
    instructions: [
      'Ayaklar kalça genişliğinde, bar bağcıkların üzerinde.',
      'Kalçayı it, dizleri bük, barı tut.',
      'Göğsü kabart, sırtı düzle (Lats engage).',
      'Yeri iterek ayağa kalk, kalçayı sık.',
    ],
    technicalTips: ['Belini bükme.', 'Bar vücuduna temas ederek yükselmeli.'],
  },
  {
    id: 'b-2',
    title: 'Pull-Up',
    muscleGroup: 'Lats (Latissimus Dorsi)',
    secondaryMuscles: 'Biceps, Rear Delts',
    type: 'Bodyweight',
    mechanics: 'Pull',
    equipment: 'Bar',
    difficulty: 'Hard',
    instructions: [
      'Barı omuz genişliğinden fazla tut.',
      'Göğsünü bara değdirmeye çalışarak kendini çek.',
      'Tepe noktada sırtı sıkıştır.',
      'Yavaşça in.',
    ],
    technicalTips: [
      'Sallanma (Momentum) kullanma.',
      'Çeneni değil, göğsünü hedefle.',
    ],
  },
  {
    id: 'b-3',
    title: 'Barbell Bent Over Row',
    muscleGroup: 'Middle Back (Thickness)',
    secondaryMuscles: 'Lats, Biceps',
    type: 'Compound',
    mechanics: 'Pull',
    equipment: 'Barbell',
    difficulty: 'Advanced',
    instructions: [
      'Dizleri hafif bük, gövdeyi yere neredeyse paralel yap.',
      'Sırt dümdüz olmalı.',
      'Barı karın boşluğuna doğru çek.',
      'Dirsekleri vücuda yakın tut.',
    ],
    technicalTips: ['Bel ağrısı varsa göğüs destekli row tercih et.'],
  },
  {
    id: 'b-4',
    title: 'Lat Pulldown',
    muscleGroup: 'Lats (Width)',
    secondaryMuscles: 'Biceps',
    type: 'Machine',
    mechanics: 'Pull',
    equipment: 'Cable Machine',
    difficulty: 'Beginner',
    instructions: [
      'Barları geniş tut.',
      'Barı göğsünün üst kısmına doğru çek.',
      'Geriye aşırı yaslanma.',
      'Dirsekleri aşağıya ve geriye doğru çek.',
    ],
    technicalTips: ['Barı enseye çekme, omuz sağlığı için risklidir.'],
  },

  // --- SHOULDERS (OMUZ) ---
  {
    id: 's-1',
    title: 'Overhead Press (OHP)',
    muscleGroup: 'Front Deltoids',
    secondaryMuscles: 'Triceps, Core',
    type: 'Compound',
    mechanics: 'Push',
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    instructions: [
      'Barı omuz hizasında al.',
      'Karnı ve kalçayı sık.',
      'Başını hafif geri çekip barı yukarı it.',
      'Tepe noktada kilitlen.',
    ],
    technicalTips: ['Beli geriye bükme (Hyperextension yapma).'],
  },
  {
    id: 's-2',
    title: 'Lateral Raise',
    muscleGroup: 'Side Deltoids',
    secondaryMuscles: 'Traps',
    type: 'Isolation',
    mechanics: 'Push',
    equipment: 'Dumbbell',
    difficulty: 'Beginner',
    instructions: [
      'Dumbbellları yanda tut.',
      'Dirsekleri hafif bükük tutarak kolları yana aç.',
      'Omuz hizasına kadar kaldır.',
      'Yavaşça indir.',
    ],
    technicalTips: [
      'Serçe parmağını hafifçe yukarı çevir (Sürahi boşaltır gibi).',
    ],
  },
  {
    id: 's-3',
    title: 'Face Pull',
    muscleGroup: 'Rear Delts',
    secondaryMuscles: 'Rotator Cuff, Rhomboids',
    type: 'Isolation',
    mechanics: 'Pull',
    equipment: 'Cable Rope',
    difficulty: 'Intermediate',
    instructions: [
      'Halatı göz hizasına ayarla.',
      'Halatı alnına/yüzüne doğru çek.',
      'Ellerini kulaklarının yanına getirmeye çalış.',
      'Kürek kemiklerini sıkıştır.',
    ],
    technicalTips: [
      'Dirseklerin ellerinden aşağıda kalmasın.',
      'Duruş bozukluğu için en iyi harekettir.',
    ],
  },
  {
    id: 's-4',
    title: 'Arnold Press',
    muscleGroup: 'All Deltoid Heads',
    secondaryMuscles: 'Triceps',
    type: 'Compound',
    mechanics: 'Push',
    equipment: 'Dumbbell',
    difficulty: 'Intermediate',
    instructions: [
      'Avuç içleri sana bakacak şekilde başla.',
      'Yukarı iterken bilekleri çevir.',
      'Tepe noktada avuç içleri karşıya baksın.',
      'İnerken tersini yap.',
    ],
    technicalTips: ['Hareket akıcı olmalı, duraksama yapma.'],
  },

  // --- ARMS (KOLLAR) ---
  {
    id: 'a-1',
    title: 'Barbell Curl',
    muscleGroup: 'Biceps Brachii',
    secondaryMuscles: 'Forearms',
    type: 'Isolation',
    mechanics: 'Pull',
    equipment: 'Barbell',
    difficulty: 'Beginner',
    instructions: [
      'Barı omuz genişliğinde tut.',
      'Dirsekleri vücuda sabitle.',
      'Barı göğse doğru kaldır.',
      'Yavaşça indir.',
    ],
    technicalTips: ['Vücudunu sallayarak (Cheat curl) kaldırma.'],
  },
  {
    id: 'a-2',
    title: 'Hammer Curl',
    muscleGroup: 'Brachialis & Forearms',
    secondaryMuscles: 'Biceps',
    type: 'Isolation',
    mechanics: 'Pull',
    equipment: 'Dumbbell',
    difficulty: 'Beginner',
    instructions: [
      'Dumbbellları nötr tutuşla (avuçlar birbirine bakacak) tut.',
      'Dirsekleri oynatmadan kaldır.',
      'İndirirken kontrolü bırakma.',
    ],
    technicalTips: [
      'Kolların daha kalın görünmesini sağlayan (Brachialis) ana harekettir.',
    ],
  },
  {
    id: 'a-3',
    title: 'Tricep Pushdown',
    muscleGroup: 'Triceps (Lateral Head)',
    secondaryMuscles: '-',
    type: 'Isolation',
    mechanics: 'Push',
    equipment: 'Cable Machine',
    difficulty: 'Beginner',
    instructions: [
      'Dirsekleri vücuduna yapıştır.',
      'Sadece ön kolunu hareket ettirerek barı aşağı it.',
      'Aşağıda tricepsleri sık.',
      'Göğüs hizasına kadar yavaşça sal.',
    ],
    technicalTips: ['Dirsekler ileri geri oynamamalı.'],
  },
  {
    id: 'a-4',
    title: 'Skullcrushers',
    muscleGroup: 'Triceps (Long Head)',
    secondaryMuscles: '-',
    type: 'Isolation',
    mechanics: 'Push',
    equipment: 'EZ Bar/Dumbbell',
    difficulty: 'Intermediate',
    instructions: [
      'Sehpaya uzan, barı alnının hizasına getir.',
      'Dirsekleri sabitle, barı alnına (veya başının arkasına) indir.',
      'Sadece dirsekleri kullanarak yukarı it.',
    ],
    technicalTips: ['Dirsekler dışa açılmamalı, tavanı göstermeli.'],
  },

  // --- CORE (KARIN) ---
  {
    id: 'co-1',
    title: 'Plank',
    muscleGroup: 'Core Stability',
    secondaryMuscles: 'Shoulders, Glutes',
    type: 'Isometric',
    mechanics: 'Hold',
    equipment: 'Bodyweight',
    difficulty: 'Beginner',
    instructions: [
      'Dirsekler omuz altında, vücut dümdüz.',
      'Kalçayı sık, karnı içeri çek.',
      'Belin çukurlaşmasına izin verme.',
      'Süre boyunca titremeye diren.',
    ],
    technicalTips: ['Süre değil, form önemli.'],
  },
  {
    id: 'co-2',
    title: 'Hanging Leg Raise',
    muscleGroup: 'Lower Abs',
    secondaryMuscles: 'Hip Flexors',
    type: 'Isolation',
    mechanics: 'Pull',
    equipment: 'Pull-up Bar',
    difficulty: 'Advanced',
    instructions: [
      'Bara asıl, vücut durgunlaşsın.',
      'Bacakları dümdüz (veya dizleri bükerek) yukarı kaldır.',
      'Kalçanı hafifçe öne doğru yuvarla (Posterior Tilt).',
      'Kontrollü indir.',
    ],
    technicalTips: ['Sallanarak yapma, karın kaslarıyla kaldır.'],
  },
];

// --- RENK PALETİ ---
const COLORS = {
  background: '#121212',
  cardBg: '#1E1E1E',
  primary: '#FFFFFF',
  secondary: '#B3B3B3',
  accent: '#E74C3C', // Agresif, Enerjik Kırmızı (Spor teması için)
  divider: '#2C2C2C',
  tagBg: '#2C3E50',
  tagText: '#AAB7B8',
};

// --- EKRAN KOMPONENTİ ---
const ExerciseGuideScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const openDetails = exercise => {
    setSelectedExercise(exercise);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => openDetails(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View
          style={[
            styles.difficultyBadge,
            {
              backgroundColor:
                item.difficulty === 'Expert' ? '#C0392B' : COLORS.tagBg,
            },
          ]}
        >
          <Text
            style={[
              styles.difficultyText,
              { color: item.difficulty === 'Expert' ? '#FFF' : COLORS.accent },
            ]}
          >
            {item.difficulty}
          </Text>
        </View>
      </View>

      <Text style={styles.muscleText}>{item.muscleGroup}</Text>

      <View style={styles.infoRow}>
        <Text style={styles.infoText}>{item.type}</Text>
        <Text style={styles.separator}>•</Text>
        <Text style={styles.infoText}>{item.mechanics}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>EXERCISE GUIDE</Text>
        <Text style={styles.headerSubtitle}>
          {EXERCISE_DB.length} Movements • Full Library
        </Text>
      </View>

      <FlatList
        data={EXERCISE_DB}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {selectedExercise && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
                <Text style={styles.modalCategoryTitle}>
                  {selectedExercise.muscleGroup.toUpperCase()}
                </Text>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.detailTitle}>{selectedExercise.title}</Text>

                <View style={styles.tagContainer}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>
                      {selectedExercise.difficulty}
                    </Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>
                      {selectedExercise.equipment}
                    </Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{selectedExercise.type}</Text>
                  </View>
                </View>

                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionHeader}>TARGET MUSCLES</Text>
                  <Text style={styles.sectionContent}>
                    <Text style={{ fontWeight: 'bold', color: COLORS.accent }}>
                      Primary:{' '}
                    </Text>
                    {selectedExercise.muscleGroup}
                    {'\n'}
                    <Text
                      style={{ fontWeight: 'bold', color: COLORS.secondary }}
                    >
                      Secondary:{' '}
                    </Text>
                    {selectedExercise.secondaryMuscles}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionHeader}>EXECUTION</Text>
                  {selectedExercise.instructions.map((step, index) => (
                    <View key={index} style={styles.stepRow}>
                      <Text style={styles.stepNumber}>{index + 1}</Text>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.divider} />

                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionHeader}>PRO TIPS & CUES</Text>
                  {selectedExercise.technicalTips.map((tip, index) => (
                    <View key={index} style={styles.tipRow}>
                      <View style={styles.bulletPoint} />
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// --- STİL DOSYASI ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 4,
    fontWeight: '600',
    opacity: 0.8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.primary,
    flex: 1,
    marginRight: 10,
  },
  difficultyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: COLORS.tagBg,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.accent,
    textTransform: 'uppercase',
  },
  muscleText: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: '500',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.7,
  },
  infoText: {
    fontSize: 11,
    color: COLORS.secondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  separator: {
    marginHorizontal: 6,
    color: COLORS.secondary,
    fontSize: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  modalCategoryTitle: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  modalBody: {
    padding: 24,
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 20,
    lineHeight: 34,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 30,
  },
  tag: {
    backgroundColor: COLORS.tagBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#D0D3D4',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 24,
    opacity: 0.5,
  },
  sectionContainer: {
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7F8C8D',
    marginBottom: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionContent: {
    fontSize: 16,
    color: COLORS.primary,
    lineHeight: 24,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  stepNumber: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '900',
    width: 28,
    marginRight: 8,
    marginTop: -2,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#ECF0F1',
    lineHeight: 22,
    fontWeight: '400',
  },
  tipRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.accent,
    marginTop: 8,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#BDC3C7',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default ExerciseGuideScreen;

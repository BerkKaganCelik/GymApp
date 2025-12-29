import React, { useState, useMemo } from 'react';
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
  Dimensions,
} from 'react-native';

// 🔥 ADIM 1: Tema Hook'unu İmport Et
import { useTheme } from '../context/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;

// --- GENİŞLETİLMİŞ PROFESYONEL VERİ TABANI ---
// Not: İçerik metinleri (Talimatlar vb.) veritabanı olduğu için sabit kalabilir
// veya ileride çoklu dil desteği için veri yapısı değiştirilebilir.
const EXERCISE_DB = [
  // GÖĞÜS
  {
    id: 'c-1',
    title: 'Bench Press',
    muscleGroup: 'Chest',
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
    equipment: 'Dumbbell',
    difficulty: 'Intermediate',
    instructions: [
      'Sehpayı 30-45 derece eğime ayarla.',
      'Dumbbellları omuz hizasında tut.',
      'Yukarı doğru itip göğsü sıkıştır.',
      'Kontrollü şekilde omuz hizasına indir.',
    ],
    technicalTips: ['Açı arttıkça yük omuzlara kayar, 30 derece idealdir.'],
  },
  // SIRT
  {
    id: 'b-1',
    title: 'Deadlift',
    muscleGroup: 'Back',
    secondaryMuscles: 'Legs, Core',
    type: 'Compound',
    mechanics: 'Pull',
    equipment: 'Barbell',
    difficulty: 'Expert',
    instructions: [
      'Ayaklar kalça genişliğinde, bar bağcıkların üzerinde.',
      'Kalçayı it, dizleri bük, barı tut.',
      'Göğsü kabart, sırtı düzle.',
      'Yeri iterek ayağa kalk.',
    ],
    technicalTips: ['Belini bükme.', 'Bar vücuduna temas ederek yükselmeli.'],
  },
  {
    id: 'b-2',
    title: 'Pull-Up',
    muscleGroup: 'Lats',
    secondaryMuscles: 'Biceps',
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
  // BACAK
  {
    id: 'l-1',
    title: 'Squat',
    muscleGroup: 'Legs',
    secondaryMuscles: 'Glutes, Core',
    type: 'Compound',
    mechanics: 'Push',
    equipment: 'Barbell',
    difficulty: 'Advanced',
    instructions: [
      'Barı trapezlerin üzerine yerleştir.',
      'Derin nefes al, karın kaslarını sık.',
      'Kalçayı geriye iterek çök.',
      'Paralel seviyeye in ve kalk.',
    ],
    technicalTips: ['Topukların yerden kalkmamalı.', 'Dizler içe dönmemeli.'],
  },
  // OMUZ
  {
    id: 's-1',
    title: 'Overhead Press',
    muscleGroup: 'Shoulders',
    secondaryMuscles: 'Triceps',
    type: 'Compound',
    mechanics: 'Push',
    equipment: 'Barbell',
    difficulty: 'Intermediate',
    instructions: [
      'Barı omuz hizasında al.',
      'Karnı sık, barı yukarı it.',
      'Tepe noktada kilitlen.',
    ],
    technicalTips: ['Beli geriye bükme.'],
  },
  // KOL
  {
    id: 'a-1',
    title: 'Barbell Curl',
    muscleGroup: 'Biceps',
    secondaryMuscles: 'Forearms',
    type: 'Isolation',
    mechanics: 'Pull',
    equipment: 'Barbell',
    difficulty: 'Beginner',
    instructions: [
      'Barı omuz genişliğinde tut.',
      'Dirsekleri sabitle, barı kaldır.',
      'Yavaşça indir.',
    ],
    technicalTips: ['Vücudunu sallayarak kaldırma.'],
  },
  {
    id: 'a-2',
    title: 'Tricep Pushdown',
    muscleGroup: 'Triceps',
    secondaryMuscles: '-',
    type: 'Isolation',
    mechanics: 'Push',
    equipment: 'Cable',
    difficulty: 'Beginner',
    instructions: [
      'Dirsekleri vücuduna yapıştır.',
      'Sadece ön kolu hareket ettirerek it.',
      'Aşağıda tricepsleri sık.',
    ],
    technicalTips: ['Dirsekler ileri geri oynamamalı.'],
  },
];

// --- EKRAN KOMPONENTİ ---
const ExerciseGuideScreen = () => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, t, isDark } = useTheme();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const openDetails = exercise => {
    setSelectedExercise(exercise);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.card, borderLeftColor: theme.primary }, // 🔥 Dinamik Arkaplan
      ]}
      activeOpacity={0.7}
      onPress={() => openDetails(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          {item.title}
        </Text>
        <View
          style={[
            styles.difficultyBadge,
            {
              backgroundColor:
                item.difficulty === 'Expert' ? theme.danger : theme.inputBg,
            },
          ]}
        >
          <Text
            style={[
              styles.difficultyText,
              { color: item.difficulty === 'Expert' ? 'white' : theme.primary },
            ]}
          >
            {item.difficulty}
          </Text>
        </View>
      </View>

      <Text style={[styles.muscleText, { color: theme.subText }]}>
        {item.muscleGroup}
      </Text>

      <View style={styles.infoRow}>
        <Text style={[styles.infoText, { color: theme.subText }]}>
          {item.type}
        </Text>
        <Text style={[styles.separator, { color: theme.subText }]}>•</Text>
        <Text style={[styles.infoText, { color: theme.subText }]}>
          {item.mechanics}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      <View
        style={[
          styles.headerContainer,
          { backgroundColor: theme.bg, borderBottomColor: theme.border },
        ]}
      >
        {/* Başlık Dinamik */}
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t.exerciseGuide || 'EXERCISE GUIDE'}
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.subText }]}>
          {EXERCISE_DB.length} {t.movements || 'Movements'} • Full Library
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
        <View style={[styles.modalContainer, { backgroundColor: theme.bg }]}>
          {selectedExercise && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: theme.border },
                ]}
              >
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Text
                    style={[styles.closeButtonText, { color: theme.primary }]}
                  >
                    {t.close || 'Close'}
                  </Text>
                </TouchableOpacity>
                <Text
                  style={[styles.modalCategoryTitle, { color: theme.subText }]}
                >
                  {selectedExercise.muscleGroup.toUpperCase()}
                </Text>
              </View>

              <View style={styles.modalBody}>
                <Text style={[styles.detailTitle, { color: theme.text }]}>
                  {selectedExercise.title}
                </Text>

                <View style={styles.tagContainer}>
                  <View
                    style={[styles.tag, { backgroundColor: theme.inputBg }]}
                  >
                    <Text style={[styles.tagText, { color: theme.subText }]}>
                      {selectedExercise.difficulty}
                    </Text>
                  </View>
                  <View
                    style={[styles.tag, { backgroundColor: theme.inputBg }]}
                  >
                    <Text style={[styles.tagText, { color: theme.subText }]}>
                      {selectedExercise.equipment}
                    </Text>
                  </View>
                  <View
                    style={[styles.tag, { backgroundColor: theme.inputBg }]}
                  >
                    <Text style={[styles.tagText, { color: theme.subText }]}>
                      {selectedExercise.type}
                    </Text>
                  </View>
                </View>

                <View style={styles.sectionContainer}>
                  <Text
                    style={[styles.sectionHeader, { color: theme.subText }]}
                  >
                    {t.targetMuscles || 'TARGET MUSCLES'}
                  </Text>
                  <Text style={[styles.sectionContent, { color: theme.text }]}>
                    <Text style={{ fontWeight: 'bold', color: theme.primary }}>
                      {t.primary || 'Primary'}:{' '}
                    </Text>
                    {selectedExercise.muscleGroup}
                    {'\n'}
                    <Text style={{ fontWeight: 'bold', color: theme.subText }}>
                      {t.secondary || 'Secondary'}:{' '}
                    </Text>
                    {selectedExercise.secondaryMuscles}
                  </Text>
                </View>

                <View
                  style={[styles.divider, { backgroundColor: theme.border }]}
                />

                <View style={styles.sectionContainer}>
                  <Text
                    style={[styles.sectionHeader, { color: theme.subText }]}
                  >
                    {t.execution || 'EXECUTION'}
                  </Text>
                  {selectedExercise.instructions.map((step, index) => (
                    <View key={index} style={styles.stepRow}>
                      <Text
                        style={[styles.stepNumber, { color: theme.primary }]}
                      >
                        {index + 1}
                      </Text>
                      <Text style={[styles.stepText, { color: theme.text }]}>
                        {step}
                      </Text>
                    </View>
                  ))}
                </View>

                <View
                  style={[styles.divider, { backgroundColor: theme.border }]}
                />

                <View style={styles.sectionContainer}>
                  <Text
                    style={[styles.sectionHeader, { color: theme.subText }]}
                  >
                    {t.proTips || 'PRO TIPS & CUES'}
                  </Text>
                  {selectedExercise.technicalTips.map((tip, index) => (
                    <View key={index} style={styles.tipRow}>
                      <View
                        style={[
                          styles.bulletPoint,
                          { backgroundColor: theme.primary },
                        ]}
                      />
                      <Text style={[styles.tipText, { color: theme.subText }]}>
                        {tip}
                      </Text>
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
  },
  headerContainer: {
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '600',
    opacity: 0.8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 3,
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
    flex: 1,
    marginRight: 10,
  },
  difficultyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  muscleText: {
    fontSize: 13,
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
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  separator: {
    marginHorizontal: 6,
    fontSize: 10,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalCategoryTitle: {
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
    marginBottom: 20,
    lineHeight: 34,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 30,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    marginVertical: 24,
    opacity: 0.5,
  },
  sectionContainer: {
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '900',
    width: 28,
    marginRight: 8,
    marginTop: -2,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
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
    marginTop: 8,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default ExerciseGuideScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

// 🔥 ADIM 1: Tema Hook'unu İmport Et
import { useTheme } from '../context/ThemeContext';

const AdminShopScreen = () => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, t, isDark } = useTheme();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal ve Form State'leri
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // Form Verileri
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    const subscriber = firestore()
      .collection('products')
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        querySnapshot => {
          const list = [];
          if (querySnapshot) {
            querySnapshot.forEach(doc => {
              list.push({
                ...doc.data(),
                id: doc.id,
              });
            });
          }
          setProducts(list);
          setLoading(false);
        },
        error => {
          console.error('Veri çekme hatası:', error);
          setLoading(false);
        },
      );

    return () => subscriber();
  }, []);

  const openAddMode = () => {
    setName('');
    setPrice('');
    setStock('');
    setImage('');
    setCategory('');
    setEditId(null);
    setIsEditing(false);
    setModalVisible(true);
  };

  const openEditMode = item => {
    setName(item.name);
    setPrice(item.price ? String(item.price) : '');
    setStock(item.stock ? String(item.stock) : '0');
    setImage(item.imageUrl || '');
    setCategory(item.category || '');
    setEditId(item.id);
    setIsEditing(true);
    setModalVisible(true);
  };

  const handleSaveProduct = async () => {
    if (!name || !price || !stock) {
      Alert.alert(
        'Eksik Bilgi', // İstersen t.missingInfo yapabilirsin
        'Lütfen Ürün Adı, Fiyat ve Stok alanlarını doldurun.',
      );
      return;
    }

    const priceValue = parseFloat(price);
    const stockValue = parseInt(stock);

    if (isNaN(priceValue) || isNaN(stockValue)) {
      Alert.alert('Hata', 'Fiyat ve Stok alanlarına sadece sayı giriniz.');
      return;
    }

    const productData = {
      name: name.trim(),
      price: priceValue,
      stock: stockValue,
      imageUrl: image || 'https://via.placeholder.com/150',
      category: category || 'Genel',
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    try {
      if (isEditing) {
        await firestore()
          .collection('products')
          .doc(editId)
          .update(productData);
        Alert.alert('Başarılı', 'Ürün güncellendi.');
      } else {
        await firestore()
          .collection('products')
          .add({
            ...productData,
            createdAt: firestore.FieldValue.serverTimestamp(),
          });
        Alert.alert('Başarılı', 'Yeni ürün eklendi.');
      }
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Hata', 'Kaydedilirken sorun oluştu: ' + error.message);
    }
  };

  const handleDelete = id => {
    Alert.alert('Ürünü Sil', 'Bu ürünü silmek istediğinize emin misiniz?', [
      { text: t.cancel, style: 'cancel' }, // 🔥 Çeviri: İptal
      {
        text: 'Sil', // 🔥 Çeviri: Sil
        style: 'destructive',
        onPress: () => firestore().collection('products').doc(id).delete(),
      },
    ]);
  };

  const renderItem = ({ item }) => {
    let stockColor = '#2ECC71';
    let stockText = `${item.stock} Adet`;

    if (item.stock === undefined || item.stock === 0) {
      stockColor = '#E74C3C';
      stockText = 'TÜKENDİ';
    } else if (item.stock < 5) {
      stockColor = '#F39C12';
      stockText = `KRİTİK: ${item.stock}`;
    }

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Image
          source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
          style={[styles.productImage, { backgroundColor: theme.inputBg }]}
        />

        <View style={styles.infoContainer}>
          <Text style={[styles.productName, { color: theme.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.productCategory, { color: theme.subText }]}>
            {item.category}
          </Text>
          <Text style={[styles.productPrice, { color: theme.primary }]}>
            {item.price} ₺
          </Text>
        </View>

        <View style={styles.stockContainer}>
          <View
            style={[styles.stockBadge, { backgroundColor: stockColor + '20' }]}
          >
            <Text style={[styles.stockText, { color: stockColor }]}>
              {stockText}
            </Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => openEditMode(item)}
              style={styles.editBtn}
            >
              <Text style={styles.btnIcon}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item.id)}
              style={styles.deleteBtn}
            >
              <Text style={styles.btnIcon}>🗑️</Text>
            </TouchableOpacity>
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

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      <View
        style={[
          styles.header,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {t.store || 'Mağaza Yönetimi'}
        </Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          onPress={openAddMode}
          activeOpacity={0.7}
        >
          <Text style={styles.addBtnText}>+ Ürün Ekle</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text
            style={{ color: theme.subText, textAlign: 'center', marginTop: 20 }}
          >
            Henüz ürün eklenmemiş.
          </Text>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBg}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {isEditing ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
              </Text>

              <Text style={[styles.label, { color: theme.subText }]}>
                Ürün Adı
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Örn: Protein Tozu"
                placeholderTextColor={theme.subText}
                value={name}
                onChangeText={setName}
              />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={[styles.label, { color: theme.subText }]}>
                    Fiyat (₺)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.inputBg,
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    placeholder="0.00"
                    placeholderTextColor={theme.subText}
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: theme.subText }]}>
                    Stok
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.inputBg,
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    placeholder="0"
                    placeholderTextColor={theme.subText}
                    keyboardType="numeric"
                    value={stock}
                    onChangeText={setStock}
                  />
                </View>
              </View>

              <Text style={[styles.label, { color: theme.subText }]}>
                Kategori
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Örn: Gıda, Ekipman"
                placeholderTextColor={theme.subText}
                value={category}
                onChangeText={setCategory}
              />

              <Text style={[styles.label, { color: theme.subText }]}>
                Resim URL
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="https://..."
                placeholderTextColor={theme.subText}
                value={image}
                onChangeText={setImage}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { backgroundColor: theme.inputBg }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[styles.cancelText, { color: theme.text }]}>
                    {t.cancel || 'İptal'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: theme.success }]}
                  onPress={handleSaveProduct}
                >
                  <Text style={styles.saveText}>{t.save || 'Kaydet'}</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  addBtn: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addBtnText: { color: '#FFF', fontWeight: 'bold' },
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
  },
  infoContainer: { flex: 1, justifyContent: 'center' },
  productName: { fontSize: 16, fontWeight: 'bold' },
  productCategory: { fontSize: 12, marginBottom: 4 },
  productPrice: { fontSize: 16, fontWeight: '900' },
  stockContainer: { alignItems: 'flex-end', justifyContent: 'space-between' },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  stockText: { fontSize: 11, fontWeight: 'bold' },
  actionRow: { flexDirection: 'row' },
  editBtn: {
    backgroundColor: '#3498DB',
    padding: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  deleteBtn: { backgroundColor: '#E74C3C', padding: 8, borderRadius: 6 },
  btnIcon: { fontSize: 14, color: '#FFF' },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    maxHeight: '80%',
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: { fontSize: 12, marginBottom: 5, marginLeft: 2 },
  input: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
  },
  row: { flexDirection: 'row' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  saveBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: { fontWeight: 'bold' },
  saveText: { color: '#FFF', fontWeight: 'bold' },
});

export default AdminShopScreen;

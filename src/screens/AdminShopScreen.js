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
  ScrollView, // ScrollView eklendi
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

const AdminShopScreen = () => {
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

  // 1. Ürünleri Çekme (Real-time)
  useEffect(() => {
    const subscriber = firestore()
      .collection('products')
      .orderBy('createdAt', 'desc') // En yeniler en üstte
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

  // --- ÜRÜN EKLEME MODUNU AÇ ---
  const openAddMode = () => {
    // Formu temizle
    setName('');
    setPrice('');
    setStock('');
    setImage('');
    setCategory('');
    setEditId(null);
    setIsEditing(false); // Yeni ekleme modu
    setModalVisible(true); // Pencereyi aç
  };

  // --- DÜZENLEME MODUNU AÇ ---
  const openEditMode = item => {
    setName(item.name);
    setPrice(item.price ? String(item.price) : '');
    setStock(item.stock ? String(item.stock) : '0');
    setImage(item.imageUrl || '');
    setCategory(item.category || '');
    setEditId(item.id);
    setIsEditing(true); // Düzenleme modu
    setModalVisible(true); // Pencereyi aç
  };

  // 2. Kaydetme İşlemi (Hem Ekleme Hem Güncelleme)
  const handleSaveProduct = async () => {
    if (!name || !price || !stock) {
      Alert.alert(
        'Eksik Bilgi',
        'Lütfen Ürün Adı, Fiyat ve Stok alanlarını doldurun.',
      );
      return;
    }

    // Sayısal çevirme işlemleri (Hata önleyici)
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
        // Güncelleme
        await firestore()
          .collection('products')
          .doc(editId)
          .update(productData);
        Alert.alert('Başarılı', 'Ürün güncellendi.');
      } else {
        // Yeni Ekleme
        await firestore()
          .collection('products')
          .add({
            ...productData,
            createdAt: firestore.FieldValue.serverTimestamp(),
          });
        Alert.alert('Başarılı', 'Yeni ürün eklendi.');
      }
      setModalVisible(false); // Modalı kapat
    } catch (error) {
      Alert.alert('Hata', 'Kaydedilirken sorun oluştu: ' + error.message);
    }
  };

  // 3. Silme İşlemi
  const handleDelete = id => {
    Alert.alert('Ürünü Sil', 'Bu ürünü silmek istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => firestore().collection('products').doc(id).delete(),
      },
    ]);
  };

  const renderItem = ({ item }) => {
    // Stok Rengi Belirleme
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
      <View style={styles.card}>
        <Image
          source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
          style={styles.productImage}
        />

        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productCategory}>{item.category}</Text>
          <Text style={styles.productPrice}>{item.price} ₺</Text>
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
      <ActivityIndicator size="large" color="#E67E22" style={styles.center} />
    );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mağaza Yönetimi</Text>
        {/* BUTON BURADA: onPress olayının openAddMode olduğundan emin olun */}
        <TouchableOpacity
          style={styles.addBtn}
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
          <Text style={{ color: '#666', textAlign: 'center', marginTop: 20 }}>
            Henüz ürün eklenmemiş.
          </Text>
        }
      />

      {/* --- MODAL --- */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)} // Android geri tuşu için
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBg}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
              </Text>

              <Text style={styles.label}>Ürün Adı</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Protein Tozu"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
              />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.label}>Fiyat (₺)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Stok</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={stock}
                    onChangeText={setStock}
                  />
                </View>
              </View>

              <Text style={styles.label}>Kategori</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Gıda, Ekipman"
                placeholderTextColor="#666"
                value={category}
                onChangeText={setCategory}
              />

              <Text style={styles.label}>Resim URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                placeholderTextColor="#666"
                value={image}
                onChangeText={setImage}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveProduct}
                >
                  <Text style={styles.saveText}>Kaydet</Text>
                </TouchableOpacity>
              </View>

              {/* Alt boşluk (Scroll için) */}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, backgroundColor: '#121212', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#1E1E1E',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },

  addBtn: {
    backgroundColor: '#E67E22',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addBtnText: { color: '#FFF', fontWeight: 'bold' },

  card: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#333',
    marginRight: 12,
  },
  infoContainer: { flex: 1, justifyContent: 'center' },
  productName: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  productCategory: { color: '#888', fontSize: 12, marginBottom: 4 },
  productPrice: { color: '#E67E22', fontSize: 16, fontWeight: '900' },

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
    backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
    maxHeight: '80%',
    width: '100%',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: { color: '#BBB', fontSize: 12, marginBottom: 5, marginLeft: 2 },
  input: {
    backgroundColor: '#2C2C2C',
    color: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  row: { flexDirection: 'row' },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#2ECC71',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: { color: '#FFF', fontWeight: 'bold' },
  saveText: { color: '#FFF', fontWeight: 'bold' },
});

export default AdminShopScreen;

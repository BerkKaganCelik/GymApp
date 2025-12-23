import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const ShopScreen = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const user = auth().currentUser;

  useEffect(() => {
    // 1. Ürünleri Dinle
    const productSub = firestore()
      .collection('products')
      .onSnapshot(querySnapshot => {
        const list = [];
        querySnapshot.forEach(doc => {
          list.push({ ...doc.data(), key: doc.id });
        });
        setProducts(list);
        setLoading(false);
      });

    // 2. Kullanıcı Adını Getir
    if (user) {
      firestore()
        .collection('users')
        .doc(user.uid)
        .get()
        .then(doc => {
          if (doc.exists) setUserName(doc.data().fullName || 'İsimsiz Üye');
        });
    }

    return () => productSub();
  }, []);

  // ✨ YENİ: TRANSACTION İLE GÜVENLİ SATIN ALMA
  const buyProduct = item => {
    Alert.alert(
      'Sipariş Onayı',
      `${item.name} (${item.price} TL) sipariş etmek istiyor musunuz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sipariş Ver',
          onPress: async () => {
            setLoading(true); // İşlem süresince spinner göster
            try {
              await firestore().runTransaction(async transaction => {
                // 1. Ürün referansını al ve güncel veriyi oku (Read)
                const productRef = firestore()
                  .collection('products')
                  .doc(item.key);
                const productSnap = await transaction.get(productRef);

                if (!productSnap.exists) {
                  throw 'Ürün bulunamadı!';
                }

                const currentStock = productSnap.data().stock;

                // 2. Stok Kontrolü
                if (currentStock <= 0) {
                  throw 'Üzgünüz, stok tükenmiş! 😔';
                }

                // 3. Stok Güncelle (Write 1)
                transaction.update(productRef, {
                  stock: currentStock - 1,
                });

                // 4. Sipariş Oluştur (Write 2)
                const orderRef = firestore().collection('orders').doc();
                transaction.set(orderRef, {
                  productName: item.name,
                  price: item.price,
                  buyerId: user.uid,
                  buyerName: userName,
                  status: 'bekliyor',
                  orderDate: firestore.FieldValue.serverTimestamp(),
                  type: 'shop_purchase',
                });
              });

              Alert.alert(
                'Harika! 🎉',
                'Siparişiniz alındı ve stoktan düşüldü. Resepsiyona iletildi.',
              );
            } catch (error) {
              // Hata mesajını (bizim fırlattığımız veya sistem hatası) göster
              Alert.alert(
                'İşlem Başarısız',
                error.toString().replace('Error: ', ''),
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
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
      <Text style={styles.header}>GYM STORE ⚡</Text>

      <FlatList
        data={products}
        keyExtractor={item => item.key}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, item.stock <= 0 && { opacity: 0.5 }]} // Stok yoksa soluk göster
            onPress={() =>
              item.stock > 0
                ? buyProduct(item)
                : Alert.alert('Stok Yok', 'Bu ürün tükenmiş.')
            }
          >
            <Image source={{ uri: item.image }} style={styles.image} />
            <Text style={styles.name}>{item.name}</Text>

            {/* Stok Durumu */}
            <Text
              style={[
                styles.stockText,
                { color: item.stock < 5 ? '#FF3B30' : '#4CD964' },
              ]}
            >
              {item.stock > 0 ? `Stok: ${item.stock}` : 'TÜKENDİ'}
            </Text>

            <Text style={styles.price}>{item.price} TL</Text>

            <View
              style={[
                styles.buyBtn,
                item.stock <= 0 && { backgroundColor: '#555' },
              ]}
            >
              <Text style={styles.buyText}>
                {item.stock > 0 ? 'SATIN AL' : 'YOK'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Mağazada ürün yok.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 10 },
  center: { flex: 1, backgroundColor: '#121212', justifyContent: 'center' },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    marginTop: 10,
    textAlign: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    margin: 8,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'space-between',
  },
  image: { width: 80, height: 80, marginBottom: 10, borderRadius: 10 },
  name: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  stockText: { fontSize: 10, marginVertical: 2, fontWeight: 'bold' },
  price: { color: '#FF8C00', fontSize: 14, marginVertical: 5 },
  buyBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 5,
  },
  buyText: { color: 'white', fontWeight: 'bold', fontSize: 10 },
  empty: { color: '#666', textAlign: 'center', marginTop: 50 },
});

export default ShopScreen;

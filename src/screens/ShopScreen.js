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

// 🔥 ADIM 1: Tema Hook'unu İmport Et
import { useTheme } from '../context/ThemeContext';

const ShopScreen = () => {
  // 🔥 ADIM 2: Tema ve Dil Değişkenlerini Çek
  const { theme, t, isDark } = useTheme();

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
      t.orderConfirm || 'Sipariş Onayı',
      `${item.name} (${item.price} TL) ${
        t.orderConfirmMsg || 'sipariş etmek istiyor musunuz?'
      }`,
      [
        { text: t.cancel || 'Vazgeç', style: 'cancel' },
        {
          text: t.order || 'Sipariş Ver',
          onPress: async () => {
            setLoading(true);
            try {
              await firestore().runTransaction(async transaction => {
                const productRef = firestore()
                  .collection('products')
                  .doc(item.key);
                const productSnap = await transaction.get(productRef);

                if (!productSnap.exists) {
                  throw t.productNotFound || 'Ürün bulunamadı!';
                }

                const currentStock = productSnap.data().stock;

                if (currentStock <= 0) {
                  throw t.outOfStock || 'Üzgünüz, stok tükenmiş! 😔';
                }

                transaction.update(productRef, {
                  stock: currentStock - 1,
                });

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
                t.success || 'Harika! 🎉',
                t.orderSuccess ||
                  'Siparişiniz alındı ve stoktan düşüldü. Resepsiyona iletildi.',
              );
            } catch (error) {
              Alert.alert(
                t.error || 'İşlem Başarısız',
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
      {/* Başlık Dinamik */}
      <Text style={[styles.header, { color: theme.text }]}>
        {t.shop || 'GYM STORE'} ⚡
      </Text>

      <FlatList
        data={products}
        keyExtractor={item => item.key}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              { backgroundColor: theme.card, borderColor: theme.border },
              item.stock <= 0 && { opacity: 0.5 },
            ]}
            onPress={() =>
              item.stock > 0
                ? buyProduct(item)
                : Alert.alert(
                    t.outOfStock || 'Stok Yok',
                    t.productDepleted || 'Bu ürün tükenmiş.',
                  )
            }
          >
            <Image source={{ uri: item.image }} style={styles.image} />
            <Text style={[styles.name, { color: theme.text }]}>
              {item.name}
            </Text>

            {/* Stok Durumu */}
            <Text
              style={[
                styles.stockText,
                { color: item.stock < 5 ? theme.danger : theme.success },
              ]}
            >
              {item.stock > 0
                ? `${t.stock || 'Stok'}: ${item.stock}`
                : t.soldOut || 'TÜKENDİ'}
            </Text>

            <Text style={[styles.price, { color: theme.primary }]}>
              {item.price} TL
            </Text>

            <View
              style={[
                styles.buyBtn,
                {
                  backgroundColor: item.stock <= 0 ? theme.subText : '#007AFF',
                },
              ]}
            >
              <Text style={styles.buyText}>
                {item.stock > 0 ? t.buy || 'SATIN AL' : t.none || 'YOK'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.subText }]}>
            {t.noProducts || 'Mağazada ürün yok.'}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  center: { flex: 1, justifyContent: 'center' },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
    textAlign: 'center',
  },
  card: {
    flex: 1,
    margin: 8,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  image: { width: 80, height: 80, marginBottom: 10, borderRadius: 10 },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  stockText: { fontSize: 10, marginVertical: 2, fontWeight: 'bold' },
  price: { fontSize: 14, marginVertical: 5 },
  buyBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 5,
  },
  buyText: { color: 'white', fontWeight: 'bold', fontSize: 10 },
  empty: { textAlign: 'center', marginTop: 50 },
});

export default ShopScreen;

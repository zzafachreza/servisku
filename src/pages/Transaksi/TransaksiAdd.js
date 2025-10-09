import {StyleSheet, Text, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {SafeAreaView} from 'react-native';
import {Color, colors, fonts, windowHeight, windowWidth} from '../../utils';
import {
  MyButton,
  MyCalendar,
  MyHeader,
  MyInput,
  MyPicker,
} from '../../components';
import {useIsFocused} from '@react-navigation/native';
import {ScrollView} from 'react-native';
import {ToastProvider, useToast} from 'react-native-toast-notifications';
import axios from 'axios';
import {apiURL, getData, storeData} from '../../utils/localStorage';
import {ActivityIndicator} from 'react-native';
import moment from 'moment';
import SQLite from 'react-native-sqlite-storage';
import {TouchableOpacity} from 'react-native';
import {Icon} from 'react-native-elements';
import RBSheet from 'react-native-raw-bottom-sheet';
import {useRef} from 'react';
import {FlatList} from 'react-native';
import {Alert} from 'react-native';

export default function TransaksiAdd({navigation, route}) {
  const refRBSheet = useRef();
  const [kirimCart, setkirimCart] = useState({
    id: null, // untuk tracking item yang sedang diedit
    device: '',
    kerusakan: '',
    harga: 0,
    diskon: 0,
    total: 0,
    catatan: '',
  });
  const [cart, setCart] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  // Fungsi untuk menghitung total
  const calculateTotal = (harga, diskon) => {
    const price = parseFloat(harga) || 0;
    const discount = parseFloat(diskon) || 0;
    return Math.max(0, price - discount);
  };
  const createTable = () => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS transaksi (id INTEGER PRIMARY KEY AUTOINCREMENT, tanggal TEXT NOT NULL, kode TEXT NOT NULL, fid_customer INTEGER NOT NULL, status TEXT, total_bruto DECIMAL(10,2), total_diskon DECIMAL(10,2), total DECIMAL(10,2), keterangan TEXT, FOREIGN KEY (fid_customer) REFERENCES customer(id))`,
      );
    });

    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS transaksi_detail (id INTEGER PRIMARY KEY AUTOINCREMENT, fid_transaksi INTEGER NOT NULL, device TEXT, serial TEXT, kerusakan TEXT, harga DECIMAL(10,2), diskon DECIMAL(10,2), total DECIMAL(10,2), catatan TEXT, FOREIGN KEY (fid_transaksi) REFERENCES transaksi(id));`,
      );
    });
  };
  // Update total otomatis ketika harga atau diskon berubah
  useEffect(() => {
    createTable();
    const total = calculateTotal(kirimCart.harga, kirimCart.diskon);
    if (total !== kirimCart.total) {
      setkirimCart(prev => ({
        ...prev,
        total: total,
      }));
    }
  }, [kirimCart.harga, kirimCart.diskon]);

  // Fungsi untuk menambah atau update item cart
  const addOrUpdateCart = async () => {
    try {
      if (!kirimCart.device?.trim()) {
        toast.show('Nama perangkat harus diisi', {type: 'warning'});
        return;
      }
      if (!kirimCart.kerusakan?.trim()) {
        toast.show('Kerusakan harus diisi', {type: 'warning'});
        return;
      }
      if (parseFloat(kirimCart.harga) <= 0) {
        toast.show('Harga harus lebih dari 0', {type: 'warning'});
        return;
      }

      // pastikan cart selalu array
      const rawCart = await getData('cart');
      const currentCart = Array.isArray(rawCart) ? rawCart : [];

      let updatedCart;

      if (isEditing && kirimCart.id) {
        // Update existing item
        updatedCart = currentCart.map(item =>
          item.id === kirimCart.id
            ? {
                ...kirimCart,
                total: calculateTotal(kirimCart.harga, kirimCart.diskon),
              }
            : item,
        );
        toast.show('Item berhasil diupdate', {type: 'success'});
      } else {
        // Add new item
        const newItem = {
          ...kirimCart,
          id: Date.now(),
          total: calculateTotal(kirimCart.harga, kirimCart.diskon),
        };
        updatedCart = [...currentCart, newItem];
        toast.show('Item berhasil ditambahkan', {type: 'success'});
      }

      await storeData('cart', updatedCart);
      setCart(updatedCart);

      resetForm();
      refRBSheet.current.close();
    } catch (error) {
      console.error('Error adding/updating cart:', error);
      toast.show('Gagal menyimpan item', {type: 'danger'});
    }
  };

  // Fungsi untuk reset form
  const resetForm = () => {
    setkirimCart({
      id: null,
      device: '',
      serial: '',
      kerusakan: '',
      harga: 0,
      diskon: 0,
      total: 0,
      catatan: '',
    });
    setIsEditing(false);
  };

  // Fungsi untuk edit item
  const editCartItem = item => {
    setkirimCart({...item});
    setIsEditing(true);
    refRBSheet.current.open();
  };

  // Fungsi untuk hapus item
  const deleteCartItem = itemId => {
    Alert.alert(
      'Konfirmasi Hapus',
      'Apakah Anda yakin ingin menghapus item ini?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const currentCart = (await getData('cart')) || [];
              const updatedCart = currentCart.filter(
                item => item.id !== itemId,
              );
              await storeData('cart', updatedCart);
              setCart(updatedCart);
              toast.show('Item berhasil dihapus', {type: 'success'});
            } catch (error) {
              console.error('Error deleting cart item:', error);
              toast.show('Gagal menghapus item', {type: 'danger'});
            }
          },
        },
      ],
    );
  };

  // Fungsi untuk clear semua cart
  const clearCart = () => {
    Alert.alert(
      'Konfirmasi Clear Cart',
      'Apakah Anda yakin ingin menghapus semua item?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Hapus Semua',
          style: 'destructive',
          onPress: async () => {
            try {
              await storeData('cart', []);
              setCart([]);
              toast.show('Cart berhasil dikosongkan', {type: 'success'});
            } catch (error) {
              console.error('Error clearing cart:', error);
              toast.show('Gagal menghapus cart', {type: 'danger'});
            }
          },
        },
      ],
    );
  };
  const [tipe, setTipe] = useState('#EST');
  const [kirim, setKirim] = useState({
    fid_customer: '',
    tanggal: moment().format('YYYY-MM-DD'),
    total: '',
    keterangan: '',
  });
  const [loading, setLoading] = useState(false);
  const updateKirim = (x, v) => {
    setKirim({
      ...kirim,
      [x]: v,
    });
  };
  const toast = useToast();

  const db = SQLite.openDatabase(
    {name: 'azeraf.db', location: 'default'},
    () => console.log('DB Opened'),
    err => console.log('SQL Error:', err),
  );

  const [pelanggan, setPelanggan] = useState([
    {
      label: 'test',
      value: 0,
    },
  ]);

  const insertTransaksi = transactionData => {
    return new Promise((resolve, reject) => {
      // Generate kode transaksi
      const kodeTransaksi = tipe + moment().format('YYYYMMDDHHmmss');

      // Hitung total bruto dan total diskon
      const totalBruto = transactionData.items.reduce(
        (sum, item) => sum + parseFloat(item.harga || 0),
        0,
      );

      const totalDiskon = transactionData.items.reduce(
        (sum, item) => sum + parseFloat(item.diskon || 0),
        0,
      );

      // Mulai transaction database
      db.transaction(tx => {
        // Insert ke tabel transaksi
        tx.executeSql(
          `INSERT INTO transaksi 
         (tanggal, kode, fid_customer, status, total_bruto, total_diskon, total, keterangan) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            transactionData.tanggal,
            kodeTransaksi,
            transactionData.fid_customer,
            'Belum Lunas', // atau status default lainnya
            totalBruto,
            totalDiskon,
            transactionData.total,
            transactionData.keterangan || '',
          ],
          (tx, result) => {
            const transactionId = result.insertId;

            // Insert detail transaksi
            let detailInsertCount = 0;
            const totalDetails = transactionData.items.length;

            transactionData.items.forEach(item => {
              tx.executeSql(
                `INSERT INTO transaksi_detail 
               (fid_transaksi, device,serial, kerusakan, harga, diskon, total, catatan) 
               VALUES (?, ?, ?,?, ?, ?, ?, ?)`,
                [
                  transactionId,
                  item.device,
                  item.serial,
                  item.kerusakan,
                  parseFloat(item.harga || 0),
                  parseFloat(item.diskon || 0),
                  parseFloat(item.total || 0),
                  item.catatan || '',
                ],
                (tx, detailResult) => {
                  detailInsertCount++;

                  // Jika semua detail sudah diinsert
                  if (detailInsertCount === totalDetails) {
                    resolve({
                      success: true,
                      transactionId: transactionId,
                      kode: kodeTransaksi,
                      message: 'Transaksi berhasil disimpan',
                    });
                  }
                },
                (tx, error) => {
                  console.log('Error insert detail:', error);
                  reject({
                    success: false,
                    error: error,
                    message: 'Gagal menyimpan detail transaksi',
                  });
                },
              );
            });
          },
          (tx, error) => {
            console.log('Error insert transaksi:', error);
            reject({
              success: false,
              error: error,
              message: 'Gagal menyimpan transaksi',
            });
          },
        );
      });
    });
  };

  const sendData = async () => {
    if (cart.length === 0) {
      toast.show('Cart masih kosong, tambahkan item terlebih dahulu', {
        type: 'warning',
      });
      return;
    }

    const totalTransaction = Array.isArray(cart)
      ? cart.reduce((sum, item) => sum + parseFloat(item.total || 0), 0)
      : 0;

    const transactionData = {
      ...kirim,
      items: cart,
      total: totalTransaction,
    };

    console.log('Data Transaksi:', transactionData);

    try {
      // Loading state bisa ditambahkan disini
      const result = await insertTransaksi(transactionData);

      if (result.success) {
        toast.show(`Transaksi berhasil disimpan dengan kode: ${result.kode}`, {
          type: 'success',
        });

        // Reset cart atau navigate ke halaman lain

        storeData('cart', []);
        setCart([]);
        navigation.goBack();

        console.log('Insert berhasil:', result);
      }
    } catch (error) {
      console.log('Error insert transaksi:', error);
      toast.show(
        error.message || 'Terjadi kesalahan saat menyimpan transaksi',
        {
          type: 'danger',
        },
      );
    }
  };

  const getCart = async () => {
    try {
      const cartData = await getData('cart');
      setCart(cartData || []);
    } catch (error) {
      console.error('Error getting cart:', error);
      setCart([]);
    }
  };

  const getPelanggan = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT *,id as value,nama || "\n" || telepon as label FROM customer ORDER BY id DESC',
        [],
        (tx, res) => {
          let rows = res.rows;
          let temp = [];
          for (let i = 0; i < rows.length; i++) {
            temp.push(rows.item(i));
          }
          setPelanggan(temp);
          if (temp.length > 0) {
            setKirim({
              ...kirim,
              fid_customer: temp[0].value,
            });
          }
          console.log(temp);
        },
      );
    });
  };

  const [deveice, setDevice] = useState([]);
  const getDevice = () => {
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM device ORDER BY id DESC', [], (tx, res) => {
        let rows = res.rows;
        let temp = [];
        for (let i = 0; i < rows.length; i++) {
          temp.push(rows.item(i));
        }
        console.log(temp);
        setDevice(temp);
      });
    });
  };

  const isFocused = useIsFocused();
  useEffect(() => {
    if (isFocused) {
      getPelanggan();
      getCart();
    }
    getDevice();
  }, [isFocused]);

  const [deviceHistory, setDeviceHistory] = useState(false);

  // Fungsi untuk menangani buka modal tambah item
  const openAddItemModal = () => {
    resetForm();
    refRBSheet.current.open();
  };

  // Render item cart
  const renderCartItem = ({item, index}) => {
    return (
      <View
        style={{
          backgroundColor: colors.white,
          padding: 15,
          marginVertical: 5,
          borderRadius: 10,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.1,
          shadowRadius: 2,
        }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}>
          <View style={{flex: 1}}>
            <Text
              style={{
                fontFamily: fonts.secondary[700],
                fontSize: 14,
                color: colors.black,
              }}>
              {item.device}
            </Text>
            <Text
              style={{
                fontFamily: fonts.secondary[400],
                fontSize: 12,
                color: colors.black,
                marginBottom: 5,
              }}>
              SN : {item.serial}
            </Text>
            <Text
              style={{
                fontFamily: fonts.secondary[400],
                fontSize: 12,
                color: colors.secondary,
                marginBottom: 3,
              }}>
              Kerusakan: {item.kerusakan}
            </Text>
            <Text
              style={{
                fontFamily: fonts.secondary[400],
                fontSize: 12,
                color: colors.black,
                marginBottom: 3,
              }}>
              Harga: Rp {parseFloat(item.harga || 0).toLocaleString('id-ID')}
            </Text>
            {parseFloat(item.diskon || 0) > 0 && (
              <Text
                style={{
                  fontFamily: fonts.secondary[400],
                  fontSize: 12,
                  color: colors.danger,
                  marginBottom: 3,
                }}>
                Diskon: Rp{' '}
                {parseFloat(item.diskon || 0).toLocaleString('id-ID')}
              </Text>
            )}
            <Text
              style={{
                fontFamily: fonts.secondary[600],
                fontSize: 13,
                color: colors.primary,
              }}>
              Total: Rp {parseFloat(item.total || 0).toLocaleString('id-ID')}
            </Text>
            {item.catatan.length > 0 && (
              <Text
                style={{
                  fontFamily: fonts.secondary[400],
                  fontSize: 11,
                  color: colors.secondary,
                  marginTop: 5,
                  fontStyle: 'italic',
                }}>
                Catatan: {item.catatan}
              </Text>
            )}
          </View>
          <View style={{flexDirection: 'row'}}>
            <TouchableOpacity
              onPress={() => editCartItem(item)}
              style={{
                backgroundColor: colors.secondary,
                padding: 8,
                borderRadius: 5,
                marginRight: 5,
              }}>
              <Icon
                type="ionicon"
                name="create-outline"
                size={16}
                color={colors.white}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => deleteCartItem(item.id)}
              style={{
                backgroundColor: colors.danger,
                padding: 8,
                borderRadius: 5,
              }}>
              <Icon
                type="ionicon"
                name="trash-outline"
                size={16}
                color={colors.white}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Hitung total keseluruhan
  const totalKeseluruhan = Array.isArray(cart)
    ? cart.reduce((sum, item) => sum + parseFloat(item.total || 0), 0)
    : 0;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.white,
      }}>
      <MyHeader title="Tambah Transaksi" />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
        }}>
        <TouchableOpacity
          onPress={() => setTipe('#EST')}
          style={{
            padding: 10,
            backgroundColor: tipe == '#EST' ? colors.primary : colors.white,
            borderWidth: 1,
            borderColor: tipe == '#EST' ? colors.primary : Color.blueGray[100],
            flex: 1,
          }}>
          <Text
            style={{
              textAlign: 'center',
              color: tipe == '#EST' ? colors.white : colors.primary,
              fontSize: 12,
              fontFamily: fonts.secondary[600],
            }}>
            #EST ( Perkiraan )
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTipe('#INV')}
          style={{
            padding: 10,
            backgroundColor: tipe == '#INV' ? colors.primary : colors.white,
            borderWidth: 1,
            borderColor: tipe == '#INV' ? colors.primary : Color.blueGray[100],
            flex: 1,
          }}>
          <Text
            style={{
              textAlign: 'center',
              color: tipe == '#INV' ? colors.white : colors.primary,
              fontSize: 12,
              fontFamily: fonts.secondary[600],
            }}>
            #INV ( Faktur )
          </Text>
        </TouchableOpacity>
      </View>
      <View
        style={{
          flex: 1,
          padding: 10,
        }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <MyCalendar
            label="Tanggal"
            value={kirim.tanggal}
            onDateChange={x => updateKirim('tanggal', x)}
          />
          <View
            style={{
              flexDirection: 'row',
            }}>
            <View
              style={{
                flex: 1,
              }}>
              <MyPicker
                label="Pelanggan"
                value={kirim.fid_customer}
                data={pelanggan}
                onChangeText={x =>
                  setKirim({
                    ...kirim,
                    fid_customer: x,
                  })
                }
              />
            </View>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('DataKostumer', {
                  add: true,
                })
              }
              style={{
                height: 50,
                backgroundColor: colors.primary,
                padding: 10,
                width: 50,
                top: 30,
                borderRadius: 10,
                marginLeft: 5,
              }}>
              <Icon type="ionicon" name="person-add" color={colors.white} />
            </TouchableOpacity>
          </View>

          {/* Tombol Tambah Item dan Clear Cart */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginVertical: 10,
            }}>
            <TouchableOpacity
              onPress={openAddItemModal}
              style={{
                backgroundColor: colors.secondary,
                padding: 10,
                flex: 1,
                marginRight: 5,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 5,
                flexDirection: 'row',
              }}>
              <Text
                style={{
                  right: 4,
                  fontFamily: fonts.secondary[600],
                  color: colors.white,
                  fontSize: 12,
                }}>
                Tambah Item
              </Text>
              <Icon
                type="ionicon"
                name="add-circle-outline"
                color={colors.white}
                size={15}
              />
            </TouchableOpacity>

            {Array.isArray(cart) && cart.length > 0 && (
              <TouchableOpacity
                onPress={clearCart}
                style={{
                  backgroundColor: colors.danger,
                  padding: 10,
                  marginLeft: 5,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 5,
                  minWidth: 50,
                }}>
                <Icon
                  type="ionicon"
                  name="trash-outline"
                  color={colors.white}
                  size={15}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Daftar Item Cart */}
          {cart.length > 0 && (
            <View style={{marginTop: 10}}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}>
                <Text
                  style={{
                    fontFamily: fonts.secondary[600],
                    fontSize: 14,
                    color: colors.black,
                  }}>
                  Daftar Item ({cart.length})
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.secondary[700],
                    fontSize: 14,
                    color: colors.primary,
                  }}>
                  Total: Rp {totalKeseluruhan.toLocaleString('id-ID')}
                </Text>
              </View>

              <FlatList
                data={cart}
                renderItem={renderCartItem}
                keyExtractor={(item, index) =>
                  item.id?.toString() || index.toString()
                }
                scrollEnabled={false}
              />
            </View>
          )}

          {cart.length === 0 && (
            <View
              style={{
                padding: 20,
                alignItems: 'center',
                marginTop: 20,
              }}>
              <Icon
                type="ionicon"
                name="cart-outline"
                size={50}
                color={colors.secondary}
              />
              <Text
                style={{
                  fontFamily: fonts.secondary[400],
                  fontSize: 14,
                  color: colors.secondary,
                  textAlign: 'center',
                  marginTop: 10,
                }}>
                Belum ada item yang ditambahkan.{'\n'}Tap "Tambah Item" untuk
                memulai.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      <View
        style={{
          padding: 10,
        }}>
        {loading && <ActivityIndicator color={colors.primary} size="large" />}
        {!loading && (
          <MyButton
            onPress={sendData}
            Icons="save-outline"
            title="Simpan Transaksi"
          />
        )}
      </View>

      <RBSheet
        ref={refRBSheet}
        closeOnDragDown={true}
        closeOnPressMask={true}
        closeOnPressBack={true}
        height={windowHeight}
        customStyles={{
          container: {borderTopLeftRadius: 0, borderTopRightRadius: 0},
        }}>
        <ScrollView
          style={{
            flex: 1,
          }}>
          <View style={{padding: 20}}>
            <Text
              style={{
                fontFamily: fonts.secondary[700],
                fontSize: 16,
                color: colors.black,
                marginBottom: 20,
                textAlign: 'center',
              }}>
              {isEditing ? 'Edit Item' : 'Tambah Item Baru'}
            </Text>

            <View
              style={{
                flexDirection: 'row',
              }}>
              <View
                style={{
                  flex: 1,
                }}>
                <MyInput
                  label="Nama Perangkat"
                  placeholder="Masukan perangkat"
                  value={kirimCart.device}
                  onChangeText={x =>
                    setkirimCart({
                      ...kirimCart,
                      device: x,
                    })
                  }
                />
              </View>
              <TouchableOpacity
                onPress={() => setDeviceHistory(!deviceHistory)}
                style={{
                  height: 50,
                  backgroundColor: colors.primary,
                  padding: 10,
                  width: 50,
                  top: 30,
                  borderRadius: 10,
                  marginLeft: 5,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Icon
                  type="ionicon"
                  size={24}
                  name={
                    deviceHistory ? 'close-circle-outline' : 'receipt-outline'
                  }
                  color={colors.white}
                />
              </TouchableOpacity>
            </View>

            {deviceHistory && (
              <View
                style={{
                  height: windowHeight / 2,
                  padding: 5,
                }}>
                <Text
                  style={{
                    fontFamily: fonts.secondary[600],
                    fontSize: 12,
                    color: colors.black,
                  }}>
                  Daftar Perangkat tersimpan
                </Text>
                <FlatList
                  data={deveice.filter(
                    i =>
                      i.nama_device
                        .toLowerCase()
                        .indexOf(kirimCart.device.toLowerCase()) > -1,
                  )}
                  renderItem={({item, index}) => {
                    return (
                      <TouchableOpacity
                        onPress={() => {
                          setkirimCart({
                            ...kirimCart,
                            device: item.nama_device,
                          });
                          setDeviceHistory(false);
                        }}
                        style={{
                          padding: 10,
                          borderRadius: 5,
                          marginVertical: 4,
                          backgroundColor: colors.secondary,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}>
                        <Text
                          style={{
                            flex: 1,
                            fontFamily: fonts.secondary[600],
                            fontSize: 12,
                            color: colors.white,
                          }}>
                          {item.nama_device}
                        </Text>
                        <Icon
                          type="ionicon"
                          name="chevron-forward-circle-outline"
                          color={colors.white}
                        />
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            )}

            <MyInput
              label="Serial Number"
              placeholder="Masukan serial number"
              value={kirimCart.serial}
              onChangeText={x =>
                setkirimCart({
                  ...kirimCart,
                  serial: x,
                })
              }
            />
            <MyInput
              label="Kerusakan"
              placeholder="Masukan kerusakan"
              value={kirimCart.kerusakan}
              onChangeText={x =>
                setkirimCart({
                  ...kirimCart,
                  kerusakan: x,
                })
              }
            />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <View
                style={{
                  flex: 1,
                  paddingRight: 2,
                }}>
                <MyInput
                  label="Harga"
                  value={kirimCart.harga.toString()}
                  placeholder="Masukan harga"
                  keyboardType="number-pad"
                  onChangeText={x =>
                    setkirimCart({
                      ...kirimCart,
                      harga: x,
                    })
                  }
                />
              </View>
              {/* <View
                style={{
                  flex: 1,
                  paddingLeft: 2,
                }}>
                <MyInput
                  label="Diskon"
                  placeholder="Masukan diskon rupiah"
                  value={kirimCart.diskon.toString()}
                  keyboardType="number-pad"
                  onChangeText={x =>
                    setkirimCart({
                      ...kirimCart,
                      diskon: x,
                    })
                  }
                />
              </View> */}
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.primary + '10',
                padding: 10,
                borderRadius: 5,
              }}>
              <Text
                style={{
                  flex: 1,
                  fontFamily: fonts.secondary[600],
                  fontSize: 14,
                  color: colors.black,
                }}>
                Total ( Harga - Diskon )
              </Text>
              <Text
                style={{
                  fontFamily: fonts.secondary[800],
                  fontSize: 16,
                  color: colors.primary,
                }}>
                Rp {kirimCart.total.toLocaleString('id-ID')}
              </Text>
            </View>

            <MyInput
              label="Catatan"
              placeholder="Masukan catatan"
              value={kirimCart.catatan}
              onChangeText={x =>
                setkirimCart({
                  ...kirimCart,
                  catatan: x,
                })
              }
            />

            <View
              style={{
                flexDirection: 'row',
                marginTop: 20,
              }}>
              {isEditing && (
                <TouchableOpacity
                  onPress={() => {
                    resetForm();
                    refRBSheet.current.close();
                  }}
                  style={{
                    backgroundColor: colors.secondary,
                    padding: 15,
                    borderRadius: 10,
                    flex: 1,
                    marginRight: 10,
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{
                      fontFamily: fonts.secondary[600],
                      color: colors.white,
                      fontSize: 14,
                    }}>
                    Batal
                  </Text>
                </TouchableOpacity>
              )}

              <View style={{flex: 1}}>
                <MyButton
                  title={isEditing ? 'Update Item' : 'Simpan Item'}
                  Icons={
                    isEditing ? 'checkmark-circle-outline' : 'cart-outline'
                  }
                  onPress={addOrUpdateCart}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </RBSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import React, {useState} from 'react';
import {Color, colors, fonts, windowHeight} from '../../utils';
import {
  MyHeader,
  MyButton,
  MyGap,
  MyPicker,
  MyCalendar,
  MyInput,
} from '../../components';
import {Icon} from 'react-native-elements';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {useToast} from 'react-native-toast-notifications';
import SQLite from 'react-native-sqlite-storage';
import moment from 'moment';
import {useEffect} from 'react';
import {FlatList} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import {useRef} from 'react';

export default function DetailTransaksi({navigation, route}) {
  const toast = useToast();
  const [editId, setEditId] = useState(null);

  // Options untuk status dropdown
  const [transaction, setTransaction] = useState(route.params);
  const [kirim, setKirim] = useState({
    fid_transaksi: transaction.id,
    tanggal_bayar: moment().format('YYYY-MM-DD').toString(),
    total: '',
    catatan: '',
  });
  const refRBSheet = useRef();

  const db = SQLite.openDatabase(
    {name: 'azeraf.db', location: 'default'},
    () => {},
    err => console.log('SQL Error:', err),
  );

  // Ambil data transaksi dari parameter

  console.log(transaction);
  const createTable = () => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS transaksi_bayar (id INTEGER PRIMARY KEY AUTOINCREMENT, fid_transaksi INTEGER NOT NULL, tanggal_bayar TEXT NOT NULL, total DECIMAL(10,2), catatan TEXT, FOREIGN KEY (fid_transaksi) REFERENCES transaksi(id));`,
      );
    });
  };

  const [bayar, setBayar] = useState([]);
  const getData = () => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM transaksi_detail  WHERE fid_transaksi='${transaction.id}' ORDER BY id DESC`,
        [],
        (tx, res) => {
          let rows = res.rows;
          let temp = [];
          for (let i = 0; i < rows.length; i++) {
            temp.push(rows.item(i));
          }

          setData(temp);
        },
      );

      tx.executeSql(
        `SELECT * FROM transaksi_bayar  WHERE fid_transaksi='${transaction.id}' ORDER BY id DESC`,
        [],
        (tx, res) => {
          let rows = res.rows;
          let temp = [];
          for (let i = 0; i < rows.length; i++) {
            temp.push(rows.item(i));
          }

          setBayar(temp);
        },
      );
    });
  };

  // State untuk status transaksi
  const [selectedStatus, setSelectedStatus] = useState(
    transaction?.status || 'pending',
  );

  // State untuk foto bukti kerja
  const [buktiKerja, setBuktiKerja] = useState(null);

  const saveData = () => {
    if (!kirim.total) {
      toast.show('Total Belum disi', {
        type: 'danger',
      });
      return;
    }

    if (!kirim.tanggal_bayar) {
      toast.show('Tanggal Belum disi', {
        type: 'danger',
      });
      return;
    }

    if (!kirim.tanggal_bayar) {
      toast.show('Tanggal Belum disi', {
        type: 'danger',
      });
      return;
    }

    let totalALL = parseFloat(totalBayar) + parseFloat(kirim.total);
    if (totalALL > transaction.total) {
      toast.show('Total bayar melebihi total transaksi !', {
        type: 'danger',
      });
      return;
    }

    db.transaction(tx => {
      let sql = `INSERT INTO transaksi_bayar(fid_transaksi,tanggal_bayar,total,catatan) VALUES ('${transaction.id}','${kirim.tanggal_bayar}','${kirim.total}','${kirim.catatan}')`;
      console.log(sql);
      tx.executeSql(sql, [], (tx, res) => {
        console.log(res);
        refRBSheet.current.close();

        setKirim({
          fid_transaksi: transaction.id,
          tanggal_bayar: moment().format('YYYY-MM-DD').toString(),
          total: '',
          catatan: '',
        });
        getData();

        if (
          parseFloat(totalBayar) +
            parseFloat(kirim.total) -
            parseFloat(transaction.total) ==
          0
        ) {
          db.transaction(tx => {
            tx.executeSql(
              `UPDATE transaksi SET status='Lunas' WHERE id='${transaction.id}'`,
              [],
              () => {
                setTransaction({
                  ...transaction,
                  status: 'Lunas',
                });
                getData();
              },
            );
          });
        } else {
          db.transaction(tx => {
            tx.executeSql(
              `UPDATE transaksi SET status='Belum Lunas' WHERE id='${transaction.id}'`,
              [],
              () => {
                setTransaction({
                  ...transaction,
                  status: 'Belum Lunas',
                });
                getData();
              },
            );
          });
        }
        toast.show('Data berhasil disimpan !', {
          type: 'success',
        });
      });
    });
  };
  // Fungsi untuk format harga
  const formatPrice = price => {
    return `Rp ${price.toLocaleString('id-ID')}`;
  };

  const totalBayar = Array.isArray(bayar)
    ? bayar.reduce((sum, item) => sum + parseFloat(item.total || 0), 0)
    : 0;

  const [data, setData] = useState([]);
  const openForm = () => {
    refRBSheet.current.open();
  };

  const deleteData = id => {
    Alert.alert('Konfirmasi', 'Yakin ingin menghapus perangkat ini?', [
      {text: 'Batal'},
      {
        text: 'Hapus',
        onPress: () => {
          db.transaction(tx => {
            tx.executeSql(
              `DELETE FROM transaksi_bayar WHERE id='${id}'`,
              [],
              (tx, res) => {
                getData();

                if (
                  parseFloat(totalBayar) +
                    parseFloat(kirim.total) -
                    parseFloat(transaction.total) ==
                  0
                ) {
                  db.transaction(tx => {
                    tx.executeSql(
                      `UPDATE transaksi SET status='Lunas' WHERE id='${transaction.id}'`,
                      [],
                      () => {
                        setTransaction({
                          ...transaction,
                          status: 'Lunas',
                        });
                        getData();
                      },
                    );
                  });
                } else {
                  db.transaction(tx => {
                    tx.executeSql(
                      `UPDATE transaksi SET status='Belum Lunas' WHERE id='${transaction.id}'`,
                      [],
                      () => {
                        setTransaction({
                          ...transaction,
                          status: 'Belum Lunas',
                        });
                        getData();
                      },
                    );
                  });
                }
                toast.show('Data berhasil dihapus !', {
                  type: 'success',
                });
              },
            );
          });
        },
      },
    ]);
  };

  useEffect(() => {
    createTable();
    getData();
  }, []);

  if (!transaction) {
    return (
      <View style={{flex: 1, backgroundColor: colors.white}}>
        <MyHeader title="Detail Transaksi" />
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}>
          <Text
            style={{
              fontFamily: fonts.secondary[600],
              fontSize: 16,
              color: colors.secondary,
              textAlign: 'center',
            }}>
            Data transaksi tidak ditemukan
          </Text>
        </View>
      </View>
    );
  }

  const [openCatatan, setOpenCatatan] = useState(false);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.white,
      }}>
      <MyHeader title="Detail Transaksi" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={{
            padding: 20,
          }}>
          {/* Card Detail Transaksi */}
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 15,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: Color.blueGray[200],
            }}>
            <Text
              style={{
                fontFamily: fonts.secondary[800],
                fontSize: 18,
                color: colors.secondary,
                textAlign: 'center',
              }}>
              {transaction.kode}
            </Text>
            <View style={{marginBottom: 5}}>
              <Text
                style={{
                  fontFamily: fonts.secondary[600],
                  fontSize: 12,
                  color: colors.secondary,
                  marginBottom: 5,
                }}>
                Tanggal
              </Text>
              <Text
                style={{
                  fontFamily: fonts.secondary[600],
                  fontSize: 12,
                  color: colors.black,
                }}>
                {moment(transaction.tanggal).format('DD MMMM YYYY')}
              </Text>
            </View>
            {/* Nama Customer */}
            <View style={{marginBottom: 5, marginTop: 10}}>
              <Text
                style={{
                  fontFamily: fonts.secondary[600],
                  fontSize: 12,
                  color: colors.secondary,
                  marginBottom: 5,
                }}>
                Pelanggan
              </Text>
              <Text
                style={{
                  fontFamily: fonts.secondary[600],
                  fontSize: 12,
                  color: colors.black,
                }}>
                {transaction.nama} / {transaction.telepon}
              </Text>
            </View>

            {/* Tanggal */}
          </View>

          {/* Update Status Section */}
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 15,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: Color.blueGray[200],
            }}>
            <FlatList
              data={data}
              renderItem={({item, index}) => {
                return (
                  <View
                    style={{
                      padding: 10,
                      marginVertical: 2,
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
                          marginBottom: 5,
                        }}>
                        {item.device}
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
                        Harga: Rp{' '}
                        {parseFloat(item.harga || 0).toLocaleString('id-ID')}
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
                        Total: Rp{' '}
                        {parseFloat(item.total || 0).toLocaleString('id-ID')}
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
                  </View>
                );
              }}
            />
          </View>

          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 15,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: Color.blueGray[200],
            }}>
            {/* Nama Customer */}

            {/* Biaya */}
            <View
              style={{
                marginBottom: 10,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  flex: 1,
                  fontFamily: fonts.secondary[600],
                  fontSize: 12,
                  color: colors.secondary,
                }}>
                Total
              </Text>

              <Text
                style={{
                  fontFamily: fonts.secondary[800],
                  fontSize: 16,
                  color: colors.primary,
                }}>
                {formatPrice(transaction.total)}
              </Text>
            </View>

            <View
              style={{
                marginBottom: 10,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  flex: 1,
                  fontFamily: fonts.secondary[600],
                  fontSize: 12,
                  color: colors.secondary,
                }}>
                Total Sudah Bayar
              </Text>

              <Text
                style={{
                  fontFamily: fonts.secondary[600],
                  fontSize: 16,
                  color: colors.primary,
                }}>
                {formatPrice(totalBayar)}
              </Text>
            </View>

            <View
              style={{
                marginBottom: 10,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  flex: 1,
                  fontFamily: fonts.secondary[600],
                  fontSize: 12,
                  color: colors.secondary,
                }}>
                Belum dibayar
              </Text>

              <Text
                style={{
                  fontFamily: fonts.secondary[600],
                  fontSize: 16,
                  color: colors.primary,
                }}>
                {formatPrice(transaction.total - totalBayar)}
              </Text>
            </View>

            <View style={{marginBottom: 5, marginTop: 10}}>
              <Text
                style={{
                  fontFamily: fonts.secondary[600],
                  fontSize: 12,
                  color: colors.secondary,
                  marginBottom: 5,
                }}>
                Status
              </Text>
              <Text
                style={{
                  fontFamily: fonts.secondary[800],
                  fontSize: 12,
                  color: colors.black,
                  backgroundColor:
                    transaction.status == 'Lunas'
                      ? colors.success
                      : colors.danger,
                  padding: 5,
                  width: 100,
                  textAlign: 'center',
                  borderRadius: 5,
                  color: colors.white,
                }}>
                {transaction.status}
              </Text>
            </View>

            <View
              style={{
                marginVertical: 5,
                backgroundColor: Color.blueGray[100],
                padding: 10,
                borderRadius: 5,
                flexDirection: 'row',
              }}>
              <View
                style={{
                  flex: 1,
                }}>
                <Text
                  style={{
                    fontFamily: fonts.secondary[600],
                    fontSize: 12,
                    color: colors.black,
                    flex: 1,
                  }}>
                  Catatan :{'\n'} {transaction.keterangan}
                </Text>
                {openCatatan && (
                  <MyInput placeholder="Masukan catatan" nolabel />
                )}
              </View>
              <TouchableOpacity
                onPress={() => setOpenCatatan(!openCatatan)}
                style={{
                  padding: 10,
                }}>
                <Icon type="ionicon" name="create-outline" />
              </TouchableOpacity>
            </View>
          </View>

          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 15,
              padding: 20,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: Color.blueGray[200],
            }}>
            <Text
              style={{
                fontFamily: fonts.secondary[800],
                fontSize: 14,
                color: colors.secondary,
              }}>
              Riwayat Pembayaran
            </Text>
            <FlatList
              data={bayar}
              renderItem={({item, index}) => {
                return (
                  <View
                    style={{
                      marginVertical: 5,
                      padding: 10,
                      borderWidth: 1,
                      borderRadius: 10,
                      borderColor: Color.blueGray[300],
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                    <View
                      style={{
                        flex: 1,
                      }}>
                      <Text
                        style={{
                          fontFamily: fonts.secondary[600],
                          fontSize: 12,
                        }}>
                        {moment(item.tanggal_bayar).format('DD MMMM YYYY')}
                      </Text>
                      <Text
                        style={{
                          fontFamily: fonts.secondary[400],
                          fontSize: 10,
                        }}>
                        {item.catatan}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontFamily: fonts.secondary[800],
                        fontSize: 14,
                      }}>
                      {formatPrice(item.total)}
                    </Text>
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: 10,
                      }}
                      onPress={() => {
                        deleteData(item.id);

                        console.log(item.id);
                      }}>
                      <Icon
                        type="ionicon"
                        name="trash-outline"
                        color={colors.danger}
                        size={20}
                      />
                    </TouchableOpacity>
                  </View>
                );
              }}
            />

            <MyButton title="Tambah Pembayaran" onPress={openForm} />
          </View>
          <RBSheet
            ref={refRBSheet}
            closeOnDragDown={true}
            closeOnPressMask={true}
            closeOnPressBack={true}
            height={windowHeight / 1.5}
            customStyles={{
              wrapper: {
                backgroundColor: 'rgba(0,0,0,0)',
              },
              container: {borderTopLeftRadius: 20, borderTopRightRadius: 20},
            }}>
            <View
              style={{
                padding: 20,
                backgroundColor: Color.blueGray[100],
                flex: 1,
              }}>
              <Text
                style={{
                  ...fonts.headline3,
                }}>
                {editId ? 'Edit Pembayaran' : 'Tambah Pembayaran'}
              </Text>
              <MyCalendar
                label="Tanggal Bayar"
                value={kirim.tanggal_bayar}
                onDateChange={x =>
                  setKirim({
                    ...kirim,
                    tanggal_bayar: x,
                  })
                }
              />
              <MyInput
                label="Total"
                keyboardType="number-pad"
                value={kirim.total}
                onChangeText={x =>
                  setKirim({
                    ...kirim,
                    total: x,
                  })
                }
              />

              <MyInput
                label="Catatan"
                value={kirim.catatan}
                onChangeText={x =>
                  setKirim({
                    ...kirim,
                    catatan: x,
                  })
                }
              />
              <MyButton title="Simpan" onPress={saveData} />
            </View>
          </RBSheet>
          <MyGap jarak={20} />
        </View>
      </ScrollView>
    </View>
  );
}

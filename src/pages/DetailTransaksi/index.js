import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import React, {useState} from 'react';
import {Color, colors, fonts, windowHeight, windowWidth} from '../../utils';
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
import {
  getData as getDataAsyc,
  MYAPP,
  storeData,
} from '../../utils/localStorage';
import {PermissionsAndroid} from 'react-native';

export default function DetailTransaksi({navigation, route}) {
  const toast = useToast();
  const [editId, setEditId] = useState(null);
  const [dataCatatan, setDataCatatan] = useState([]);

  // Options untuk status dropdown
  const [transaction, setTransaction] = useState(route.params);
  const [kirim, setKirim] = useState({
    fid_transaksi: transaction.id,
    tanggal_bayar: moment().format('YYYY-MM-DD').toString(),
    total: '',
    catatan: '',
  });

  const [kirimCart, setkirimCart] = useState({
    id: null, // untuk tracking item yang sedang diedit
    device: '',
    serial: '',
    kerusakan: '',
    harga: 0,
    diskon: 0,
    total: 0,
    catatan: '',
  });

  const saveUpdate = () => {
    console.log(kirimUpdate);
    db.transaction(tx => {
      let sql = '';
      if (kirimUpdate.id !== null) {
        sql = `UPDATE transaksi_detail SET device='${kirimUpdate.device}',harga='${kirimUpdate.harga}',serial='${kirimUpdate.serial}',kerusakan='${kirimUpdate.kerusakan}',diskon='${kirimUpdate.diskon}',total='${kirimUpdate.total}',catatan='${kirimUpdate.catatan}' WHERE id='${kirimUpdate.id}'`;
      } else {
        sql = `INSERT INTO transaksi_detail(fid_transaksi,device,serial,kerusakan,harga,diskon,total,catatan) VALUES('${transaction.id}','${kirimUpdate.device}','${kirimUpdate.serial}','${kirimUpdate.kerusakan}','${kirimUpdate.harga}','${kirimUpdate.diskon}','${kirimUpdate.total}','${kirimUpdate.catatan}')`;
      }

      console.log(sql);
      let sql2 = `UPDATE transaksi SET total_bruto=(SELECT SUM(harga) FROM transaksi_detail WHERE fid_transaksi='${transaction.id}'),total_diskon=(SELECT SUM(diskon) FROM transaksi_detail WHERE fid_transaksi='${transaction.id}'),total=(SELECT SUM(total) FROM transaksi_detail WHERE fid_transaksi='${transaction.id}') WHERE id='${transaction.id}'`;
      tx.executeSql(sql, [], (tx, res) => {
        tx.executeSql(sql2, [], (tx, res) => {
          console.log(res);
          refRBSheet.current.close();
          setOpenUpdateItem(false);

          getData();
          toast.show('Data berhasil disimpan !', {
            type: 'success',
          });
        });
      });
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

  const deleteCartItem = zz => {
    Alert.alert(MYAPP, 'Apakah kamu yakin akan hapus ini ?', [
      {text: 'TIDAK'},
      {
        text: 'YA, HAPUS',
        onPress: () => {
          db.transaction(tx => {
            let sql = `DELETE FROM transaksi_detail WHERE id='${zz}'`;

            let sql2 = `UPDATE transaksi SET total_bruto=(SELECT SUM(harga) FROM transaksi_detail WHERE fid_transaksi='${transaction.id}'),total_diskon=(SELECT SUM(diskon) FROM transaksi_detail WHERE fid_transaksi='${transaction.id}'),total=(SELECT SUM(total) FROM transaksi_detail WHERE fid_transaksi='${transaction.id}') WHERE id='${transaction.id}'`;
            tx.executeSql(sql, [], (tx, res) => {
              console.log(sql2);
              tx.executeSql(sql2, [], (tx, res) => {
                console.log(res);
                refRBSheet.current.close();
                setOpenUpdateItem(false);

                getData();
                toast.show('Data berhasil disimpan !', {
                  type: 'success',
                });
              });
            });
          });
        },
      },
    ]);
  };

  const [kirimUpdate, setKirimUpdate] = useState({});
  const [openUpdateItem, setOpenUpdateItem] = useState(false);
  const editCartItem = item => {
    console.log(item);
  };

  const refRBSheet = useRef();

  const db = SQLite.openDatabase(
    {name: 'azeraf.db', location: 'default'},
    () => {},
    err => console.log('SQL Error:', err),
  );

  // Ambil data transaksi dari parameter

  const createTable = () => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS transaksi_bayar (id INTEGER PRIMARY KEY AUTOINCREMENT, fid_transaksi INTEGER NOT NULL, tanggal_bayar TEXT NOT NULL, total DECIMAL(10,2), catatan TEXT, FOREIGN KEY (fid_transaksi) REFERENCES transaksi(id));`,
      );
    });

    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS transaksi_foto (id INTEGER PRIMARY KEY AUTOINCREMENT, fid_transaksi INTEGER NOT NULL, foto TEXT NOT NULL, FOREIGN KEY (fid_transaksi) REFERENCES transaksi(id));`,
      );
    });
  };
  const [foto, setFoto] = useState([]);
  const [bayar, setBayar] = useState([]);
  const getData = () => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT a.id,nama,telepon,a.tanggal,alamat,kode,total,status,total_bruto,total_diskon,keterangan FROM transaksi a JOIN customer b ON a.fid_customer = b.id  WHERE a.id='${transaction.id}' limit 1`,
        [],
        (tx, res) => {
          let rows = res.rows;
          let temp = [];
          for (let i = 0; i < rows.length; i++) {
            temp.push(rows.item(i));
          }

          setTransaction(temp[0]);
        },
      );

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

      tx.executeSql(
        `SELECT * FROM transaksi_foto  WHERE fid_transaksi='${transaction.id}' ORDER BY id DESC`,
        [],
        (tx, res) => {
          let rows = res.rows;
          let temp = [];
          for (let i = 0; i < rows.length; i++) {
            temp.push(rows.item(i));
          }
          console.log('TEH FOTO', temp);
          setFoto(temp);
        },
      );
    });
  };

  const requestCameraPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Cool Photo App Camera Permission',
          message:
            'Cool Photo App needs access to your camera ' +
            'so you can take awesome pictures.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('You can use the camera');
      } else {
        console.log('Camera permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const updateFoto = () => {
    Alert.alert(MYAPP, 'Pilih gambar', [
      {text: 'Batal'},
      {
        text: 'Galeri',
        onPress: () => {
          launchImageLibrary(
            {
              includeBase64: false,
              quality: 1,
              mediaType: 'photo',
              maxWidth: 200,
              maxHeight: 200,
            },
            response => {
              if (!response.didCancel) {
                db.transaction(tx => {
                  tx.executeSql(
                    `INSERT INTO transaksi_foto(fid_transaksi,foto) VALUES('${transaction.id}','${response.assets[0].uri}')`,
                    [],
                    () => {
                      getData();
                    },
                  );
                });
              }
            },
          );
        },
      },
      {
        text: 'Kamera',
        onPress: () => {
          requestCameraPermission().then(() => {
            launchCamera(
              {
                includeBase64: true,
                quality: 1,
                mediaType: 'photo',
                maxWidth: 500,
                maxHeight: 500,
              },
              response => {
                if (!response.didCancel) {
                  console.log(response.assets[0]);
                  db.transaction(tx => {
                    tx.executeSql(
                      `INSERT INTO transaksi_foto(fid_transaksi,foto) VALUES('${transaction.id}','${response.assets[0].uri}')`,
                      [],
                      () => {
                        getData();
                      },
                    );
                  });
                }
              },
            );
          });
        },
      },
    ]);
  };

  // State untuk status transaksi
  const [selectedStatus, setSelectedStatus] = useState(
    transaction?.status || 'pending',
  );

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

  const updateCatatan = () => {
    db.transaction(tx => {
      let sql = `UPDATE transaksi SET keterangan='${transaction.keterangan}' WHERE id='${transaction.id}'`;
      console.log(sql);
      tx.executeSql(sql, [], (tx, res) => {
        console.log(res);
        setOpenCatatan(false);
        getData();
        toast.show('Data berhasil disimpan !', {
          type: 'success',
        });
        Alert.alert(MYAPP, 'Simpan catatan diriwayat ?', [
          {
            text: 'TIDAK',
          },
          {
            text: 'YA',
            onPress: () => {
              console.log(transaction.keterangan);
              let tmp = [...dataCatatan];
              tmp.push(transaction.keterangan);
              storeData('catatan', tmp);
              setDataCatatan(tmp);
            },
          },
        ]);
      });
    });
  };

  const updateTanggal = x => {
    db.transaction(tx => {
      let sql = `UPDATE transaksi SET tanggal='${x}' WHERE id='${transaction.id}'`;
      console.log(sql);
      tx.executeSql(sql, [], (tx, res) => {
        console.log(res);
        setOpenTanggal(false);
        getData();
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

  const bayarLunas = () => {
    let bayarin = transaction.total - totalBayar;
    console.log(bayarin);
    Alert.alert(MYAPP, 'Bayar lunas langsung ?', [
      {
        text: 'tidak',
      },
      {
        text: 'YA, LUNAS',
        onPress: () => {
          db.transaction(tx => {
            let sql = `INSERT INTO transaksi_bayar(fid_transaksi,tanggal_bayar,total,catatan) VALUES ('${transaction.id}','${kirim.tanggal_bayar}','${bayarin}','')`;
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

              getData();

              toast.show('Data berhasil disimpan !', {
                type: 'success',
              });
            });
          });
        },
      },
    ]);
  };

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

  const getRiwayatCatatan = () => {
    // getData('catatan').then(res => {
    //   // setDataCatatan(!res ? [] : res);
    //   console.log('catatan', res);
    // });
    getDataAsyc('catatan').then(res => {
      console.log('catatan', !res ? [] : res);
      setDataCatatan(!res ? [] : res);
    });
  };

  useEffect(() => {
    getRiwayatCatatan();
    createTable();
    getData();
    getDevice();
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
  const [openTanggal, setOpenTanggal] = useState(false);
  const [deviceHistory, setDeviceHistory] = useState(false);
  const [tipe, setTipe] = useState(transaction.kode.toString().substring(0, 4));

  const updateKode = x => {
    console.log(x);

    let before = transaction.kode.toString().substring(0, 4);
    let newkode = transaction.kode.toString().replace(before, x);
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE transaksi SET kode='${newkode}' WHERE id='${transaction.id}'`,
        [],
        () => {
          setTransaction({
            ...transaction,
            kode: newkode,
          });
          getData();
        },
      );
    });
  };
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
          <MyButton
            title="Lihat Invoice"
            onPress={() =>
              navigation.navigate('Cetak', {
                transaksi: transaction,
                transaksi_detail: data,
                transaksi_bayar: totalBayar,
                foto: foto,
              })
            }
            Icons="print-outline"
          />
          <MyGap jarak={10} />
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
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
              }}>
              <TouchableOpacity
                onPress={() => {
                  setTipe('#EST');
                  updateKode('#EST');
                }}
                style={{
                  padding: 10,
                  backgroundColor:
                    tipe == '#EST' ? colors.primary : colors.white,
                  borderWidth: 1,
                  borderColor:
                    tipe == '#EST' ? colors.primary : Color.blueGray[100],
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
                onPress={() => {
                  setTipe('#INV');
                  updateKode('#INV');
                }}
                style={{
                  padding: 10,
                  backgroundColor:
                    tipe == '#INV' ? colors.primary : colors.white,
                  borderWidth: 1,
                  borderColor:
                    tipe == '#INV' ? colors.primary : Color.blueGray[100],
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
                marginTop: 10,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              {!openTanggal && (
                <>
                  <View style={{marginBottom: 5, flex: 1}}>
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
                  <TouchableOpacity
                    onPress={() => {
                      setOpenTanggal(!openTanggal);
                    }}>
                    <Icon type="ionicon" name="create-outline" />
                  </TouchableOpacity>
                </>
              )}

              {openTanggal && (
                <View style={{flex: 1}}>
                  <MyCalendar
                    label="Tanggal"
                    value={transaction.tanggal}
                    onDateChange={x => {
                      setTransaction({
                        ...transaction,
                        tanggal: x,
                      });
                      updateTanggal(x);
                    }}
                  />
                </View>
              )}
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
          <TouchableOpacity
            onPress={() => {
              setOpenUpdateItem(true);
              setKirimUpdate(kirimCart);
              refRBSheet.current.open();
            }}
            style={{
              marginVertical: 10,
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

                    <View style={{flexDirection: 'row'}}>
                      <TouchableOpacity
                        onPress={() => {
                          setOpenUpdateItem(true);
                          refRBSheet.current.open();
                          editCartItem(item);
                          setKirimUpdate(item);
                        }}
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
              {transaction.status !== 'Lunas' && (
                <MyButton
                  title="Bayar Lunas"
                  onPress={bayarLunas}
                  warna={colors.success}
                />
              )}
            </View>

            {!openCatatan && (
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
                </View>
                <TouchableOpacity
                  onPress={() => setOpenCatatan(!openCatatan)}
                  style={{
                    padding: 10,
                  }}>
                  <Icon type="ionicon" name="create-outline" />
                </TouchableOpacity>
              </View>
            )}
            {openCatatan && (
              <View>
                <MyInput
                  placeholder="Masukan catatan"
                  value={transaction.keterangan}
                  nolabel
                  onChangeText={x =>
                    setTransaction({
                      ...transaction,
                      keterangan: x,
                    })
                  }
                />

                {dataCatatan.length > 0 &&
                  dataCatatan.map((i, index) => {
                    return (
                      <View
                        style={{
                          flexDirection: 'row',
                          padding: 5,
                          alignItems: 'center',
                        }}>
                        <Text
                          style={{
                            flex: 1,
                            fontFamily: fonts.secondary[400],
                            fontSize: 10,
                          }}>
                          {i}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            setTransaction({...transaction, keterangan: i});
                            db.transaction(tx => {
                              let sql = `UPDATE transaksi SET keterangan='${i}' WHERE id='${transaction.id}'`;
                              console.log(sql);
                              tx.executeSql(sql, [], (tx, res) => {
                                console.log(res);
                                setOpenCatatan(false);
                                getData();
                                toast.show('Data berhasil disimpan !', {
                                  type: 'success',
                                });
                              });
                            });
                          }}>
                          <Icon
                            type="ionicon"
                            name="open-outline"
                            size={20}
                            color={colors.secondary}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            const tmp = dataCatatan.filter(
                              (_, i) => i !== index,
                            );
                            setDataCatatan(tmp);
                            storeData('catatan', tmp);
                          }}
                          style={{
                            marginHorizontal: 5,
                          }}>
                          <Icon
                            type="ionicon"
                            size={20}
                            name="trash-outline"
                            color={colors.primary}
                          />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                <MyButton onPress={updateCatatan} title="Simpan Catatan" />
              </View>
            )}
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
            onClose={() => setOpenUpdateItem(false)}
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
                {openUpdateItem && kirimUpdate.id !== null
                  ? 'Update Perangkat'
                  : kirimUpdate.id === null
                  ? 'Tambah Perangkat'
                  : 'Tambah Pembayaran'}
              </Text>
              {!openUpdateItem && (
                <>
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
                </>
              )}

              {openUpdateItem && (
                <ScrollView>
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
                        value={kirimUpdate.device}
                        onChangeText={x =>
                          setKirimUpdate({
                            ...kirimUpdate,
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
                          deviceHistory
                            ? 'close-circle-outline'
                            : 'receipt-outline'
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
                        data={deveice}
                        renderItem={({item, index}) => {
                          return (
                            <TouchableOpacity
                              onPress={() => {
                                setKirimUpdate({
                                  ...kirimUpdate,
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
                    value={kirimUpdate.serial}
                    keyboardType="number-pad"
                    onChangeText={x =>
                      setKirimUpdate({
                        ...kirimUpdate,
                        serial: x,
                      })
                    }
                  />
                  <MyInput
                    label="Kerusakan"
                    placeholder="Masukan kerusakan"
                    value={kirimUpdate.kerusakan}
                    onChangeText={x =>
                      setKirimUpdate({
                        ...kirimUpdate,
                        kerusakan: x,
                      })
                    }
                  />
                  <View
                    style={{
                      flexDirection: 'row',
                    }}>
                    <View
                      style={{
                        flex: 1,
                        paddingRight: 5,
                      }}>
                      <MyInput
                        label="Harga"
                        keyboardType="number-pad"
                        onChangeText={x =>
                          setKirimUpdate({
                            ...kirimUpdate,
                            total: x - parseFloat(kirimUpdate.diskon),
                            harga: x,
                          })
                        }
                        value={kirimUpdate.harga.toString()}
                      />
                    </View>
                    <View
                      style={{
                        flex: 1,
                        paddingLeft: 5,
                      }}>
                      <MyInput
                        label="Diskon"
                        keyboardType="number-pad"
                        onChangeText={x =>
                          setKirimUpdate({
                            ...kirimUpdate,
                            diskon: x,
                            total: parseFloat(kirimUpdate.harga) - x,
                          })
                        }
                        value={kirimUpdate.diskon.toString()}
                      />
                    </View>
                  </View>
                  <View
                    style={{
                      borderRadius: 5,
                      flexDirection: 'row',
                      marginVertical: 5,
                      padding: 10,
                      backgroundColor: colors.primary + '20',
                    }}>
                    <Text
                      style={{
                        flex: 1,
                        fontFamily: fonts.secondary[600],
                        fontSize: 12,
                      }}>
                      Total
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.secondary[800],
                        fontSize: 18,
                      }}>
                      {formatPrice(kirimUpdate.total)}
                    </Text>
                  </View>
                  <MyInput
                    label="Catatan"
                    value={kirimUpdate.catatan}
                    onChangeText={x =>
                      setKirimUpdate({
                        ...kirimUpdate,
                        catatan: x,
                      })
                    }
                  />
                </ScrollView>
              )}
              <MyButton
                title="Simpan"
                onPress={openUpdateItem ? saveUpdate : saveData}
              />
            </View>
          </RBSheet>

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
              Lampiran Foto
            </Text>
            {foto.length > 0 && (
              <FlatList
                data={foto}
                renderItem={({item, index}) => {
                  return (
                    <View
                      style={{
                        marginVertical: 4,
                        padding: 4,
                        borderWidth: 1,
                        borderRadius: 10,
                        borderColor: Color.blueGray[200],
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                      <Image
                        source={{
                          uri: item.foto,
                        }}
                        style={{
                          width: windowWidth / 1.5,
                          height: windowWidth / 1.5,
                          resizeMode: 'contain',
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert(MYAPP, 'Hapus foto ini ?', [
                            {text: 'Tidak'},
                            {
                              text: 'HAPUS',
                              onPress: () => {
                                db.transaction(tx => {
                                  tx.executeSql(
                                    `DELETE FROM transaksi_foto WHERE id='${item.id}'`,
                                    [],
                                    () => {
                                      getData();
                                    },
                                  );
                                });
                              },
                            },
                          ]);
                        }}
                        style={{
                          marginHorizontal: 5,
                        }}>
                        <Icon
                          type="ionicon"
                          size={20}
                          name="trash-outline"
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />
            )}
            <MyButton onPress={updateFoto} title="Tambah Foto" />
          </View>
          <MyGap jarak={20} />
        </View>
      </ScrollView>
    </View>
  );
}

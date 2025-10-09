import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import React, {useState, useEffect, useRef} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import SQLite from 'react-native-sqlite-storage';
import {useIsFocused} from '@react-navigation/native';
import RBSheet from 'react-native-raw-bottom-sheet';
import {MyButton, MyHeader, MyInput} from '../../components';
import {Color, colors, fonts, windowHeight, windowWidth} from '../../utils';
import {TextInput} from 'react-native';
import {Icon} from 'react-native-elements';
import {useToast} from 'react-native-toast-notifications';
import moment from 'moment';
import Contacts from 'react-native-contacts';
import {Platform} from 'react-native';
import {PermissionsAndroid} from 'react-native';

export default function DataKustomer({navigation, route}) {
  const isFocused = useIsFocused();
  const [customer, setCustomer] = useState([]);
  const [filtered, setFiltered] = useState([]); // hasil filter
  const [kontak, setKontak] = useState([]);
  const [kontakFilter, setKontakFilter] = useState([]);
  const [kirim, setKirim] = useState({
    nama: '',
    telepon: '',
    alamat: '',
  });
  const [search, setSearch] = useState('');
  const [searchKontak, setSearchKontak] = useState('');
  const [editId, setEditId] = useState(null);

  const refRBSheet = useRef();

  const db = SQLite.openDatabase(
    {name: 'azeraf.db', location: 'default'},
    () => console.log('DB Opened'),
    err => console.log('SQL Error:', err),
  );

  const requestContactsPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Akses Kontak',
            message:
              'Aplikasi memerlukan akses ke kontak untuk memilih nomor telepon',
            buttonNeutral: 'Nanti',
            buttonNegative: 'Batal',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true; // iOS handles permissions automatically
  };

  const handleContact = async () => {
    const hasPermission = await requestContactsPermission();
    if (!hasPermission) {
      toast.show(
        'Akses kontak ditolak. Mohon berikan izin untuk mengakses kontak.',
      );
      return;
    }

    const contacts = await Contacts.getAll();
    if (contacts.length === 0) {
      toast.show('Tidak ada kontak yang ditemukan di perangkat.');
      return;
    }

    const contactsWithPhones = contacts
      .filter(
        contact => contact.phoneNumbers && contact.phoneNumbers.length > 0,
      )
      .map(contact => ({
        id: contact.recordID,
        name:
          contact.displayName ||
          `${contact.givenName || ''} ${contact.familyName || ''}`.trim() ||
          'Tanpa Nama',
        phone: contact.phoneNumbers[0].number,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    setKontak(contactsWithPhones);
    setKontakFilter(contactsWithPhones);
    console.log(contactsWithPhones);
  };

  const getData = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM customer ORDER BY id DESC',
        [],
        (tx, res) => {
          let rows = res.rows;
          let temp = [];
          for (let i = 0; i < rows.length; i++) {
            temp.push(rows.item(i));
          }
          setCustomer(temp);
          setFiltered(temp); // awalnya sama dengan semua data
        },
      );
    });
  };

  const createTable = () => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS customer (id INTEGER PRIMARY KEY AUTOINCREMENT, nama TEXT NOT NULL, telepon TEXT NOT NULL, alamat TEXT NOT NULL);`,
      );
    });
  };

  useEffect(() => {
    if (isFocused) {
      createTable();
      getData();
      if (route.params?.add) {
        openForm();
      }
    }
  }, [isFocused]);
  const toast = useToast();

  const saveData = () => {
    if (!kirim.nama) {
      toast.show('Nama tidak boleh kosong!', {
        type: 'danger',
      });
      return;
    } else if (!kirim.telepon) {
      toast.show('telpon tidak boleh kosong!', {
        type: 'danger',
      });
      return;
    }

    if (editId) {
      db.transaction(tx => {
        tx.executeSql(
          `UPDATE customer SET nama='${kirim.nama}',telepon='${kirim.telepon}',alamat='${kirim.alamat}' WHERE id='${editId}'`,
          [],
          () => {
            getData();
            refRBSheet.current.close();
            setKirim({});
            setEditId(null);
          },
        );
      });
    } else {
      console.log(kirim);
      db.transaction(tx => {
        tx.executeSql(
          `INSERT INTO customer (nama,telepon,alamat) VALUES ('${kirim.nama}','${kirim.telepon}','${kirim.alamat}')`,
          [],
          () => {
            refRBSheet.current.close();
            getData();

            setNamaDevice('');
            toast.show('Data berhasil disimpan !', {
              type: 'success',
            });
          },
          err => console.log('SQL Error:', err),
        );
      });
    }
  };

  const deleteData = id => {
    Alert.alert('Konfirmasi', 'Yakin ingin menghapus perangkat ini?', [
      {text: 'Batal'},
      {
        text: 'Hapus',
        onPress: () => {
          db.transaction(tx => {
            tx.executeSql('DELETE FROM customer WHERE id=?', [id], () => {
              getData();
              toast.show('Data berhasil dihapus !', {
                type: 'success',
              });
            });
          });
        },
      },
    ]);
  };

  const openForm = item => {
    if (item) {
      setKirim(item);
      setEditId(item.id);
    } else {
      setKirim('');
      setEditId(null);
    }
    refRBSheet.current.open();
  };
  // filter data
  const filterData = text => {
    setSearch(text);
    if (text) {
      const lowerText = text.toLowerCase();
      const newData = customer.filter(
        item =>
          item.nama.toLowerCase().includes(lowerText) ||
          item.telepon.toLowerCase().includes(lowerText) ||
          item.alamat.toLowerCase().includes(lowerText),
      );
      setFiltered(newData);
    } else {
      setFiltered(customer);
    }
  };

  // filter data

  const filterKontak = text => {
    setSearchKontak(text);
    if (text) {
      const lowerText = text.toLowerCase();
      const newData = kontak.filter(
        item =>
          item.name.toLowerCase().includes(lowerText) ||
          item.phone.toLowerCase().includes(lowerText),
      );
      setKontakFilter(newData);
    } else {
      setKontakFilter(kontak);
    }
  };

  return (
    <View style={{flex: 1, backgroundColor: colors.white}}>
      {/* Input filter */}
      {!route.params?.add && (
        <>
          <MyHeader title="Pelanggan" />
          <View style={{padding: 10}}>
            <View
              style={{
                borderWidth: 1,
                borderRadius: 10,
                height: 45,
                borderColor: Color.blueGray[300],
                paddingLeft: 10,
                position: 'relative',
              }}>
              <TextInput
                style={{
                  fontFamily: fonts.secondary[600],
                  fontSize: 12,
                }}
                autoCapitalize="none"
                value={search}
                onChangeText={filterData}
                placeholder="Masukkan kata kunci"
              />

              <View
                style={{
                  position: 'absolute',
                  right: 10,
                  top: 10,
                }}>
                <Icon
                  type="ioncion"
                  name="search"
                  color={Color.blueGray[300]}
                />
              </View>
            </View>
          </View>
          <View style={{marginHorizontal: 14, marginBottom: 10}}>
            <Text
              style={{
                fontFamily: fonts.secondary[600],
                fontSize: 12,
              }}>
              Jumlah :{' '}
              <Text
                style={{
                  color: colors.secondary,
                  fontFamily: fonts.secondary[800],
                  fontSize: 14,
                }}>
                {filtered.length}
              </Text>
            </Text>
          </View>
          <FlatList
            data={filtered}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => (
              <View style={styles.item}>
                <View>
                  <Text style={styles.nama}>{item.nama}</Text>
                  <Text style={styles.nama}>{item.telepon}</Text>
                  <Text style={styles.nama}>{item.alamat}</Text>
                </View>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 10,
                    }}
                    onPress={() => openForm(item)}>
                    <Icon
                      type="ionicon"
                      name="create-outline"
                      color={colors.secondary}
                      size={20}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 10,
                    }}
                    onPress={() => deleteData(item.id)}>
                    <Icon
                      type="ionicon"
                      name="trash-outline"
                      color={colors.danger}
                      size={20}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text style={{textAlign: 'center', marginTop: 20}}>
                Tidak ada pelanggan
              </Text>
            }
          />

          <View style={{padding: 20}}>
            <MyButton title="Tambah Pelanggan" onPress={() => openForm()} />
          </View>
        </>
      )}

      <RBSheet
        ref={refRBSheet}
        onClose={() => {
          if (route.params?.add) {
            navigation.goBack();
          }
          setKontak([]);
        }}
        closeOnDragDown={true}
        closeOnPressMask={true}
        closeOnPressBack={true}
        height={windowHeight}
        customStyles={{
          container: {borderTopLeftRadius: 0, borderTopRightRadius: 0},
        }}>
        <View style={{padding: 20}}>
          <Text style={styles.label}>
            {editId ? 'Edit Pelangan' : 'Tambah Pelangan'}
          </Text>
          <MyInput
            label={`Nama`}
            value={kirim.nama}
            onChangeText={x => setKirim({...kirim, nama: x})}
          />

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <View
              style={{
                flex: 1,
              }}>
              <MyInput
                label="Telepon"
                keyboardType="phone-pad"
                value={kirim.telepon}
                onChangeText={x => setKirim({...kirim, telepon: x})}
              />
            </View>
            <TouchableOpacity
              onPress={handleContact}
              style={{
                top: 10,
                height: 50,
                width: 50,
                marginLeft: 5,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 5,
                borderRadius: 10,
                backgroundColor: colors.primary,
              }}>
              <Icon
                type="ionicon"
                name="person-add"
                color={colors.white}
                size={20}
              />
            </TouchableOpacity>
          </View>

          {kontakFilter.length > 0 && (
            <View
              style={{
                height: 300,
                backgroundColor: colors.secondary + '20',
                padding: 10,
              }}>
              <View
                style={{
                  padding: 5,
                }}>
                <Text
                  style={{
                    fontFamily: fonts.secondary[800],
                    fontSize: 12,
                    color: colors.secondary,
                  }}>
                  {kontakFilter.length} Kontak
                </Text>
                <TextInput
                  autoCapitalize="none"
                  value={searchKontak}
                  onChangeText={filterKontak}
                  placeholder="Masukan kata kunci"
                  style={{
                    fontFamily: fonts.secondary[600],
                    paddingLeft: 10,
                    // borderWidth: 1,
                    borderRadius: 10,
                    height: 40,
                    fontSize: 12,
                    backgroundColor: colors.white,
                    marginTop: 4,
                  }}
                />
              </View>
              <FlatList
                data={kontakFilter}
                renderItem={({item, index}) => {
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        setKirim({
                          ...kirim,
                          nama: item.name,
                          telepon: item.phone,
                        });
                        setKontak([]);
                        setKontakFilter([]);
                      }}
                      style={{
                        backgroundColor: colors.primary + '20',
                        marginHorizontal: 4,
                        marginVertical: 2,
                        padding: 10,
                        borderRadius: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}>
                      <View
                        style={{
                          flex: 1,
                        }}>
                        <Text
                          style={{
                            fontFamily: fonts.secondary[800],
                            fontSize: 12,
                          }}>
                          {item.name}
                        </Text>
                        <Text
                          style={{
                            fontFamily: fonts.secondary[400],
                            fontSize: 12,
                          }}>
                          {item.phone}
                        </Text>
                      </View>
                      <View
                        style={{
                          padding: 10,
                          borderRadius: 30,
                        }}>
                        <Icon
                          type="ionicon"
                          name="chevron-forward-circle-outline"
                          color={colors.primary}
                          size={30}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )}
          <MyInput
            label="Alamat"
            value={kirim.alamat}
            onChangeText={x => setKirim({...kirim, alamat: x})}
          />
          <MyButton title="Simpan" onPress={saveData} />
        </View>
      </RBSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginHorizontal: 10,
    marginVertical: 2,
    backgroundColor: colors.primary + '10',
    // borderWidth: 1,
    borderColor: Color.blueGray[100],
  },
  nama: {
    flex: 1,
    fontFamily: fonts.secondary[600],
    fontSize: 12,
    color: colors.black,
  },
  btnEdit: {
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 5,
    borderRadius: 5,
  },
  btnDelete: {
    backgroundColor: colors.danger,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
    borderRadius: 5,
  },
  btnText: {
    color: colors.white,
    fontFamily: fonts.secondary[600],
  },
  label: {
    fontFamily: fonts.secondary[600],
    fontSize: 12,
    marginBottom: 10,
  },
});

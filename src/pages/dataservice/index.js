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
import {Color, colors, fonts} from '../../utils';
import {TextInput} from 'react-native';
import {Icon} from 'react-native-elements';
import {useToast} from 'react-native-toast-notifications';
import moment from 'moment';

export default function DataDevice({navigation, route}) {
  const isFocused = useIsFocused();
  const [devices, setDevices] = useState([]);
  const [filtered, setFiltered] = useState([]); // hasil filter
  const [namaDevice, setNamaDevice] = useState('');
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);

  const refRBSheet = useRef();

  const db = SQLite.openDatabase(
    {name: 'azeraf.db', location: 'default'},
    () => console.log('DB Opened'),
    err => console.log('SQL Error:', err),
  );

  const createTable = () => {
    db.transaction(tx => {
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS device (id INTEGER PRIMARY KEY AUTOINCREMENT, nama_device TEXT NOT NULL);`,
      );
    });
  };

  const getData = () => {
    db.transaction(tx => {
      tx.executeSql('SELECT * FROM device ORDER BY id DESC', [], (tx, res) => {
        let rows = res.rows;
        let temp = [];
        for (let i = 0; i < rows.length; i++) {
          temp.push(rows.item(i));
        }
        setDevices(temp);
        setFiltered(temp); // awalnya sama dengan semua data
      });
    });
  };

  useEffect(() => {
    if (isFocused) {
      createTable();
      getData();
    }
  }, [isFocused]);
  const toast = useToast();

  const saveData = () => {
    if (!namaDevice) {
      toast.show('Nama perangkat tidak boleh kosong!', {
        type: 'danger',
      });
      return;
    }

    if (editId) {
      db.transaction(tx => {
        tx.executeSql(
          'UPDATE device SET nama_device=? WHERE id=?',
          [namaDevice, editId],
          () => {
            getData();
            refRBSheet.current.close();
            setNamaDevice('');
            setEditId(null);
          },
        );
      });
    } else {
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO device (nama_device) VALUES (?)',
          [namaDevice],
          () => {
            refRBSheet.current.close();
            getData();

            setNamaDevice('');
            toast.show('Data berhasil disimpan !', {
              type: 'success',
            });
          },
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
            tx.executeSql('DELETE FROM device WHERE id=?', [id], () => {
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
      setNamaDevice(item.nama_device);
      setEditId(item.id);
    } else {
      setNamaDevice('');
      setEditId(null);
    }
    refRBSheet.current.open();
  };

  // filter data
  const filterData = text => {
    setSearch(text);
    if (text) {
      const newData = devices.filter(item =>
        item.nama_device.toLowerCase().includes(text.toLowerCase()),
      );
      setFiltered(newData);
    } else {
      setFiltered(devices);
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.white}}>
      <MyHeader title="Perangkat" />

      {/* Input filter */}
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
            autoCapitalize="none"
            style={{
              fontFamily: fonts.secondary[600],
              fontSize: 12,
            }}
            value={search}
            onChangeText={filterData}
            placeholder="Masukkan nama perangkat"
          />

          <View
            style={{
              position: 'absolute',
              right: 10,
              top: 10,
            }}>
            <Icon type="ioncion" name="search" color={Color.blueGray[300]} />
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
            <Text style={styles.nama}>{item.nama_device}</Text>
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
            Tidak ada perangkat
          </Text>
        }
      />

      <View style={{padding: 20}}>
        <MyButton title="Tambah Perangkat" onPress={() => openForm()} />
      </View>

      <RBSheet
        ref={refRBSheet}
        closeOnDragDown={true}
        closeOnPressMask={true}
        closeOnPressBack={true}
        height={300}
        customStyles={{
          container: {borderTopLeftRadius: 20, borderTopRightRadius: 20},
        }}>
        <View style={{padding: 20}}>
          <Text style={styles.label}>
            {editId ? 'Edit Perangkat' : 'Tambah Perangkat'}
          </Text>
          <MyInput
            label="Nama Perangkat"
            value={namaDevice}
            onChangeText={setNamaDevice}
          />
          <MyButton title="Simpan" onPress={saveData} />
        </View>
      </RBSheet>
    </SafeAreaView>
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

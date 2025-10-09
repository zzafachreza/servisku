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
import {MyButton, MyGap, MyHeader, MyInput} from '../../components';
import {Color, colors, fonts} from '../../utils';
import {TextInput} from 'react-native';
import {Icon} from 'react-native-elements';
import {useToast} from 'react-native-toast-notifications';
import moment from 'moment';

export default function Transaksi({navigation, route}) {
  const isFocused = useIsFocused();
  const [data, setData] = useState([]);
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

  const getData = () => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT a.id,nama,telepon,a.tanggal,alamat,kode,total,status,total_bruto,total_diskon,keterangan FROM transaksi a JOIN customer b ON a.fid_customer = b.id ORDER BY a.id DESC',
        [],
        (tx, res) => {
          let rows = res.rows;
          let temp = [];
          for (let i = 0; i < rows.length; i++) {
            temp.push(rows.item(i));
          }

          console.log(temp);
          setData(temp);
          setFiltered(temp); // awalnya sama dengan semua data
        },
      );
    });
  };

  useEffect(() => {
    if (isFocused) {
      getData();
    }
  }, [isFocused]);
  const toast = useToast();

  const deleteData = id => {
    Alert.alert('Konfirmasi', 'Yakin ingin menghapus perangkat ini?', [
      {text: 'Batal'},
      {
        text: 'Hapus',
        onPress: () => {
          db.transaction(tx => {
            tx.executeSql(
              `DELETE FROM transaksi_detail WHERE fid_transaksi='${id}'`,
              [],
              (tx, res) => {},
            );
            tx.executeSql(
              `DELETE FROM transaksi WHERE id='${id}'`,
              [],
              (tx, res) => {
                getData();
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

  // filter data
  const filterData = text => {
    setSearch(text);
    if (text) {
      const lowerText = text.toLowerCase();

      const newData = data.filter(item => {
        const kode = item.kode?.toLowerCase() || '';
        const nama = item.nama?.toLowerCase() || '';
        const telepon = item.telepon?.toLowerCase() || '';

        return (
          kode.includes(lowerText) ||
          nama.includes(lowerText) ||
          telepon.includes(lowerText)
        );
      });

      setFiltered(newData);
    } else {
      setFiltered(data);
    }
  };

  return (
    <View style={{flex: 1, backgroundColor: colors.white}}>
      <MyHeader title="Transaksi" />
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
            placeholder="Masukkan nama customer atau kode"
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
      <View
        style={{
          flex: 1,
        }}>
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          renderItem={({item}) => (
            <View style={styles.item}>
              <View
                style={{
                  flex: 1,
                }}>
                <Text
                  style={{
                    ...styles.nama,
                    fontFamily: fonts.secondary[800],
                  }}>
                  {item.kode}
                </Text>
                <Text style={styles.nama}>
                  {moment(item.tanggal).format('DD MMMM YYYY')}
                </Text>
                <MyGap jarak={5} />
                <Text style={styles.nama}>{item.nama}</Text>
                <Text style={styles.nama}>{item.telepon}</Text>
              </View>
              <View>
                <View style={{flex: 1}}>
                  <Text
                    style={{
                      fontFamily: fonts.secondary[800],
                      color: colors.primary,
                      fontSize: 15,
                      textAlign: 'right',
                    }}>
                    Rp {parseFloat(item.total || 0).toLocaleString('id-ID')}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.secondary[400],
                      color:
                        item.status == 'Lunas' ? colors.success : colors.black,
                      fontSize: 10,
                      textAlign: 'right',
                    }}>
                    {item.status}
                  </Text>
                </View>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 10,
                    }}
                    onPress={() =>
                      navigation.navigate('DetailTransaksi', item)
                    }>
                    <Icon
                      type="ionicon"
                      name="search-outline"
                      color={colors.black}
                      size={20}
                    />
                  </TouchableOpacity>

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
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{textAlign: 'center', marginTop: 20}}>
              Tidak ada transaksi
            </Text>
          }
        />
      </View>
      <View style={{padding: 20}}>
        <MyButton
          title="Buat Transaksi Baru"
          onPress={() => navigation.navigate('TransaksiAdd')}
        />
      </View>
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

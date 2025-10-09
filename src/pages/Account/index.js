import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {fonts} from '../../utils/fonts';
import {getData, storeData} from '../../utils/localStorage';
import {Color, colors} from '../../utils/colors';
import {MyButton, MyGap, MyHeader, MyInput} from '../../components';
import {launchImageLibrary} from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import MyLoading from '../../components/MyLoading';
import {useToast} from 'react-native-toast-notifications';
import SQLite from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';

export default function Account({navigation}) {
  const [kirim, setKirim] = useState({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    getData('user').then(res => {
      if (!res) {
        setKirim({
          nama: '',
          telepon: '',
          alamat: '',
          catatan: '',
          foto: '',
        });
      } else {
        setKirim(res);
      }
    });

    setKirim(prev => ({
      ...prev,
      newfoto_user: null,
    }));
  }, []);

  const sendServer = () => {
    storeData('user', kirim);
    toast.show('Data berhasil disimpan !', {type: 'success'});
  };

  // Fungsi untuk meminta permission di Android
  const requestStoragePermission = async () => {
    if (Platform.OS === 'android' && Platform.Version < 30) {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);

        const allGranted = Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED,
        );

        if (!allGranted) {
          console.log('Izin penyimpanan ditolak');
          return false;
        }

        return true;
      } catch (err) {
        console.warn('Gagal meminta izin:', err);
        return false;
      }
    }

    return true; // Android 11 ke atas tidak butuh izin untuk app directory
  };

  // Fungsi Backup Database
  const backupDB = async () => {
    setLoading(true);
    try {
      // Meminta permission terlebih dahulu
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        setLoading(false);
        return;
      }

      // Path database asli
      const dbPath = `/data/data/com.serviceku/databases/azeraf.db`;
      console.log(dbPath);

      // Cek apakah database ada
      const dbExists = await RNFS.exists(dbPath);
      if (!dbExists) {
        Alert.alert('Error', 'Database tidak ditemukan!');
        setLoading(false);
        return;
      }

      // Path untuk menyimpan backup dengan nama servisku.backup
      const backupPath = `${RNFS.DownloadDirectoryPath}/servisku.backup`;

      // Copy database ke folder Download dengan nama baru
      await RNFS.copyFile(dbPath, backupPath);

      Alert.alert(
        'Backup Berhasil!',
        `Database telah dibackup ke:\n${backupPath}`,
        [
          {
            text: 'OK',
            onPress: () => {
              toast.show('Backup database berhasil!', {type: 'success'});
            },
          },
          {
            text: 'Upload ke Google Drive',
            onPress: async () => {
              await Share.open({
                url: 'file://' + backupPath, // path file backup sqlite
                type: 'application/octet-stream', // cocok untuk .db / .sqlite
                title: 'Upload ke Google Drive',
                subject: 'Database Backup',
              });
            },
          },
        ],
      );
    } catch (error) {
      console.error('Backup error:', error);
      Alert.alert('Error', 'Gagal melakukan backup database');
      toast.show('Backup gagal!', {type: 'danger'});
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Restore Database
  const restoreDB = async () => {
    try {
      // Meminta permission terlebih dahulu
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        return;
      }

      // Buka document picker untuk memilih file backup
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });

      // Validasi file yang dipilih
      if (res && res[0]) {
        const selectedFile = res[0];

        // Cek ekstensi file (optional, untuk memastikan file backup)
        if (
          !selectedFile.name.includes('.backup') &&
          !selectedFile.name.includes('.db')
        ) {
          Alert.alert(
            'Warning',
            'File yang dipilih mungkin bukan file backup database',
          );
        }

        // Konfirmasi restore
        Alert.alert(
          'Konfirmasi Restore',
          `Apakah Anda yakin ingin mengembalikan database dari file:\n${selectedFile.name}?\n\nData saat ini akan ditimpa!`,
          [
            {
              text: 'Batal',
              style: 'cancel',
            },
            {
              text: 'Ya, Restore',
              style: 'destructive',
              onPress: () => performRestore(selectedFile.uri),
            },
          ],
        );
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User membatalkan pemilihan file
        console.log('User cancelled file selection');
      } else {
        console.error('Document picker error:', err);
        Alert.alert('Error', 'Gagal membuka file picker');
      }
    }
  };

  // Fungsi untuk melakukan restore
  const performRestore = async backupFileUri => {
    setLoading(true);
    try {
      // Path database asli
      const dbPath = `/data/data/com.serviceku/databases/azeraf.db`;

      // Tutup koneksi database jika ada yang terbuka
      // (Anda mungkin perlu menambahkan logika untuk menutup koneksi SQLite)

      // Backup database lama sebagai safety (optional)
      const oldBackupPath = `/data/data/com.serviceku/databases/azeraf_old.db`;
      const dbExists = await RNFS.exists(dbPath);
      if (dbExists) {
        await RNFS.copyFile(dbPath, oldBackupPath);
      }

      // Copy file backup ke lokasi database asli
      await RNFS.copyFile(backupFileUri, dbPath);

      Alert.alert(
        'Restore Berhasil!',
        'Database telah berhasil dikembalikan. Aplikasi akan restart untuk menerapkan perubahan.',
        [
          {
            text: 'OK',
            onPress: () => {
              toast.show('Restore database berhasil!', {type: 'success'});
              // Restart aplikasi atau navigasi ulang
              // RNRestart.Restart(); // jika menggunakan react-native-restart
              // atau
              navigation.reset({
                index: 0,
                routes: [{name: 'MainApp'}], // sesuaikan dengan nama route utama
              });
            },
          },
        ],
      );
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Error', 'Gagal melakukan restore database');
      toast.show('Restore gagal!', {type: 'danger'});
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <MyHeader title="Edit Profile" onPress={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.avatarWrapper}>
          <TouchableOpacity
            onPress={() => {
              launchImageLibrary(
                {
                  includeBase64: true,
                  quality: 1,
                  mediaType: 'photo',
                  maxWidth: 200,
                  maxHeight: 200,
                },
                response => {
                  if (!response.didCancel) {
                    setKirim({
                      ...kirim,
                      foto: `data:${response.assets[0].type};base64, ${response.assets[0].base64}`,
                    });
                  }
                },
              );
            }}
            style={styles.avatarContainer}>
            <Image style={styles.avatar} source={{uri: kirim.foto}} />
          </TouchableOpacity>
        </View>

        <MyInput
          label="Nama Toko"
          iconname="home-outline"
          value={kirim.toko}
          placeholder="Masukan nama toko"
          onChangeText={x => setKirim({...kirim, toko: x})}
        />

        <MyInput
          label="Telepon"
          iconname="call-outline"
          keyboardType="phone-pad"
          value={kirim.telepon}
          placeholder="Masukan nomor telepon"
          onChangeText={x => setKirim({...kirim, telepon: x})}
        />

        <MyInput
          label="Alamat"
          iconname="location-outline"
          value={kirim.alamat}
          placeholder="Masukan alamat"
          onChangeText={x => setKirim({...kirim, alamat: x})}
        />

        <MyInput
          label="Catatan Print"
          iconname="print-outline"
          value={kirim.catatan}
          placeholder="Masukan catatan print"
          onChangeText={x => setKirim({...kirim, catatan: x})}
        />
        <MyGap jarak={10} />
        {loading && <MyLoading />}

        {!loading && (
          <MyButton
            warna={colors.primary}
            colorText={colors.white}
            iconColor={colors.white}
            onPress={sendServer}
            title="Simpan Perubahan"
            Icons="download-outline"
          />
        )}
        <MyGap jarak={20} />

        <View style={styles.actionWrapper}>
          <TouchableOpacity onPress={backupDB} style={styles.actionButton}>
            <Image
              source={require('../../assets/a1.png')}
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>Backup</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={restoreDB} style={styles.actionButton}>
            <Image
              source={require('../../assets/a2.png')}
              style={styles.actionIcon}
            />
            <Text style={styles.actionText}>Restore</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.white},
  scroll: {paddingHorizontal: 20},
  avatarWrapper: {padding: 10, justifyContent: 'center', alignItems: 'center'},
  avatarContainer: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: Color.blueGray[100],
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {width: 100, height: 100},
  actionWrapper: {flexDirection: 'row', justifyContent: 'space-around'},
  actionButton: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    borderColor: Color.blueGray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {width: 100, height: 100},
  actionText: {
    textAlign: 'center',
    fontFamily: fonts.secondary[600],
    fontSize: 12,
  },
});

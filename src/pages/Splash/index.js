import React, {useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Image,
  Animated,
  ImageBackground,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {MyButton, MyGap} from '../../components';
import {MyDimensi, colors, fonts, windowHeight, windowWidth} from '../../utils';
import {MYAPP, getData} from '../../utils/localStorage';
import SQLite from 'react-native-sqlite-storage';

export default function Splash({navigation}) {
  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(50)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  const initialDATABASE = () => {
    const MYDB = SQLite.openDatabase(
      'azeraf.db',
      '1.0',
      'azeraf',
      200000,
      () => {
        console.log('Database OPENED');

        MYDB.transaction(tx => {
          tx.executeSql(
            'CREATE TABLE IF NOT EXISTS device (id INTEGER PRIMARY KEY AUTOINCREMENT, nama_device TEXT NOT NULL);CREATE TABLE IF NOT EXISTS customer (id INTEGER PRIMARY KEY AUTOINCREMENT, nama TEXT NOT NULL, telepon TEXT NOT NULL, alamat TEXT NOT NULL);CREATE TABLE IF NOT EXISTS transaksi (id INTEGER PRIMARY KEY AUTOINCREMENT, tanggal TEXT NOT NULL, kode TEXT NOT NULL, fid_customer INTEGER NOT NULL, status TEXT, total_bruto DECIMAL(10,2), total_diskon DECIMAL(10,2), total DECIMAL(10,2), keterangan TEXT, FOREIGN KEY (fid_customer) REFERENCES customer(id));CREATE TABLE IF NOT EXISTS transaksi_detail (id INTEGER PRIMARY KEY AUTOINCREMENT, fid_transaksi INTEGER NOT NULL, device TEXT, kerusakan TEXT, harga DECIMAL(10,2), diskon DECIMAL(10,2), total DECIMAL(10,2), catatan TEXT, FOREIGN KEY (fid_transaksi) REFERENCES transaksi(id));CREATE TABLE IF NOT EXISTS transaksi_bayar (id INTEGER PRIMARY KEY AUTOINCREMENT, fid_transaksi INTEGER NOT NULL, tanggal_bayar TEXT NOT NULL, total DECIMAL(10,2), catatan TEXT, FOREIGN KEY (fid_transaksi) REFERENCES transaksi(id));',
            [],
            (tx, results) => {
              console.log('Query Create Table is completed');
              navigation.replace('Home');
            },
          );
        });
      },
      () => {
        console.log('SQL Error: ' + err);
      },
    );
  };

  useEffect(() => {
    initialDATABASE();
    // Hide status bar for better experience
    StatusBar.setHidden(true);

    // Start animations sequence
    startAnimations();

    // Navigate after animations
    const timer = setTimeout(() => {
      // navigation.replace('Home');
    }, 3000);

    return () => {
      clearTimeout(timer);
      StatusBar.setHidden(false);
    };
  }, []);

  const startAnimations = () => {
    // Background fade in
    Animated.timing(backgroundOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Logo entrance animation (scale + rotation + opacity)
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Start pulse animation after logo appears
        startPulseAnimation();
      });
    }, 300);

    // Text slide up animation
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(textTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, 800);

    // Loading indicator fade in
    setTimeout(() => {
      Animated.timing(loadingOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 1200);
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const logoRotateInterpolate = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Gradient Background */}
      <Animated.View
        style={[styles.backgroundGradient, {opacity: backgroundOpacity}]}
      />

      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo Container with glow effect */}
        <View style={styles.logoContainer}>
          <Animated.View
            style={[
              styles.logoGlow,
              {
                opacity: logoOpacity,
                transform: [{scale: pulseAnimation}],
              },
            ]}
          />
          <Animated.Image
            source={require('../../assets/logo.png')}
            resizeMode="contain"
            style={[
              styles.logo,
              {
                opacity: logoOpacity,
                transform: [
                  {scale: logoScale},
                  {rotate: logoRotateInterpolate},
                ],
              },
            ]}
          />
        </View>

        {/* App Name */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{translateY: textTranslateY}],
            },
          ]}>
          <Text style={styles.appName}>Servisku</Text>
        </Animated.View>

        {/* Loading Indicator */}
        <Animated.View
          style={[styles.loadingContainer, {opacity: loadingOpacity}]}>
          <ActivityIndicator
            color={colors.primary}
            size="large"
            style={styles.loader}
          />
          <Text style={styles.loadingText}>Memuat...</Text>
        </Animated.View>
      </View>

      {/* Bottom decoration */}
      <Animated.View
        style={[styles.bottomDecoration, {opacity: backgroundOpacity}]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary + '10', // Transparent primary color
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 40,
  },
  logoGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    backgroundColor: colors.primary + '20', // Transparent primary color
    borderRadius: windowWidth / 2,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: windowWidth * 0.4,
    height: windowWidth * 0.4,
    zIndex: 1,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appName: {
    fontSize: 28,
    fontFamily: fonts.primary[700],
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.secondary,
    textAlign: 'center',
    opacity: 0.8,
  },
  loadingContainer: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 100,
  },
  loader: {
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.primary,
    opacity: 0.7,
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 200,
    height: 200,
    backgroundColor: colors.primary + '10', // Transparent primary color
    borderRadius: 100,
  },
});

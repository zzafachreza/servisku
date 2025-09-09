import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TouchableNativeFeedback,
  Image,
  Animated,
} from 'react-native';
import React, {useState, useRef} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors, fonts} from '../../utils';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';

const {width, height} = Dimensions.get('window');

export default function Home({navigation}) {
  const [user] = useState({});

  const navigateToDetail = product => {
    navigation.navigate('ProdukDetail', {product});
  };

  const handleMenuPress = (menuId, menuTitle) => {
    switch (menuId) {
      case 1:
        // Navigate ke halaman Data Device
        navigation.navigate('DataService');
        break;
      case 2:
        // Navigate ke halaman Data Kostumer
        navigation.navigate('DataKostumer');
        break;
      case 3:
        // Navigate ke halaman Transaksi
        navigation.navigate('Transaksi');
        break;
      default:
        console.log('Menu tidak ditemukan');
    }

    // Optional: tambahkan analytics atau logging
    console.log(`Menu ${menuTitle} diklik`);
  };

  const menuItems = [
    {
      id: 1,
      title: 'Data Perangkat',
      icon: require('../../assets/data-icon_.png'),
      color: colors.secondary,
      gradient: [colors.secondary, colors.primary],
      description: 'Kelola data perangkat',
      onPress: () => handleMenuPress(1, 'DataService'),
    },
    {
      id: 2,
      title: 'Data Pelanggan',
      icon: require('../../assets/costumer.png'),
      color: colors.secondary,
      gradient: [colors.secondary, colors.primary],
      description: 'Manajemen data costumer',
      onPress: () => handleMenuPress(2, 'Data Costumer'),
    },
    {
      id: 3,
      title: 'Transaksi',
      icon: require('../../assets/transaction_icon.png'),
      color: colors.secondary,
      gradient: [colors.secondary, colors.primary],
      description: 'Riwayat transaksi',
      onPress: () => handleMenuPress(3, 'Transaksi'),
    },
  ];

  const renderMenuItem = (item, index) => {
    const animatedScale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(animatedScale, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(animatedScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        key={item.id}
        style={[
          styles.menuItemContainer,
          {
            transform: [{scale: animatedScale}],
          },
        ]}>
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={item.onPress}
          activeOpacity={0.8}
          style={styles.menuItem}>
          {/* Background Gradient */}
          <LinearGradient
            colors={item.gradient}
            style={styles.menuItemGradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}>
            {/* Content Container */}
            <View style={styles.menuContent}>
              {/* Icon Container */}
              <View style={styles.iconContainer}>
                <View style={styles.iconBackground}>
                  <Image style={styles.menuIcon} source={item.icon} />
                </View>
              </View>

              {/* Text Container */}
              <View style={styles.textContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
              </View>

              {/* Arrow Icon */}
              <View style={styles.arrowContainer}>
                <Text style={styles.arrowIcon}>›</Text>
              </View>
            </View>

            {/* Decorative Elements */}
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
          </LinearGradient>

          {/* Subtle Shadow Overlay */}
          <View style={styles.shadowOverlay} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.headerGradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}>
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>Selamat datang,</Text>
            <Text style={styles.appName}>Servisku</Text>
          </View>
          <View style={styles.logoContainer}>
            <FastImage
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Header Bottom Wave */}
        <View style={styles.waveContainer}>
          <View style={styles.wave} />
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}>
        {/* Menu Section */}
        <View style={styles.menuSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Menu Utama</Text>
            <Text style={styles.sectionSubtitle}>
              Pilih layanan yang Anda butuhkan
            </Text>
          </View>

          {/* Menu Items */}
          <View style={styles.menuGrid}>
            {menuItems.map((item, index) => renderMenuItem(item, index))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingBottom: 0,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontFamily: fonts.secondary[400],
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  appName: {
    fontFamily: fonts.secondary[700],
    fontSize: 20,
    color: 'white',
  },
  logoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 15,
    padding: 8,
  },
  logo: {
    width: 40,
    height: 40,
  },
  waveContainer: {
    height: 20,
    overflow: 'hidden',
  },
  wave: {
    backgroundColor: '#F8FAFC',
    height: 40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  menuSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sectionHeader: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontFamily: fonts.secondary[700],
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: fonts.secondary[400],
    fontSize: 12,
    color: '#6B7280',
  },
  menuGrid: {
    // No gap property
  },
  menuItemContainer: {
    marginBottom: 16,
  },
  menuItem: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  menuItemGradient: {
    padding: 20,
    minHeight: 100,
    position: 'relative',
    overflow: 'hidden',
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  iconContainer: {
    marginRight: 16,
  },
  iconBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    width: 32,
    height: 32,
  },
  textContainer: {
    flex: 1,
  },
  menuTitle: {
    fontFamily: fonts.primary[600],
    fontSize: 14,
    color: 'white',
    marginBottom: 4,
  },
  menuDescription: {
    fontFamily: fonts.primary[400],
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  arrowContainer: {
    marginLeft: 12,
  },
  arrowIcon: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '300',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 40,
    zIndex: 1,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -10,
    right: 30,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    zIndex: 1,
  },
  shadowOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  statsContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 30,
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statsTitle: {
    fontFamily: fonts.secondary[600],
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: fonts.secondary[700],
    fontSize: 24,
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: fonts.secondary[400],
    fontSize: 12,
    color: '#6B7280',
  },
});

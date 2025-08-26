import { View, Text, ScrollView, TouchableNativeFeedback, Animated, Modal, TouchableOpacity, Alert, PermissionsAndroid, Platform } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import { colors, fonts } from '../../utils'
import { MyHeader, MyInput } from '../../components'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Contacts from 'react-native-contacts'

export default function DataKostumer() {
  const [formData, setFormData] = useState({
    nama: '',
    noTelepon: '',
    alamat: ''
  })
  const [customerData, setCustomerData] = useState([])
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [contactsLoading, setContactsLoading] = useState(false)
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    type: '', // 'validation', 'success', 'error', 'duplicate', 'contacts', 'delete'
    title: '',
    message: '',
    errors: [],
    onConfirm: null
  })
  const [contactsList, setContactsList] = useState([])
  
  // Animation references
  const buttonScale = useRef(new Animated.Value(1)).current
  const buttonOpacity = useRef(new Animated.Value(1)).current
  const successScale = useRef(new Animated.Value(0)).current
  const loadingRotation = useRef(new Animated.Value(0)).current
  const modalScale = useRef(new Animated.Value(0)).current
  const modalOpacity = useRef(new Animated.Value(0)).current
  const contactButtonScale = useRef(new Animated.Value(1)).current
  const contactLoadingRotation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    loadCustomerData()
  }, [])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    const errors = []
    
    if (!formData.nama.trim()) {
      errors.push('Nama Kostumer')
    }
    
    if (!formData.noTelepon.trim()) {
      errors.push('No Telepon')
    }

    if (!formData.alamat.trim()) {
      errors.push('Alamat')
    }

    if (errors.length > 0) {
      showModal('validation', 'Peringatan', 'Mohon lengkapi field yang diperlukan', errors)
      return false
    }
    
    return true
  }

  const showModal = (type, title, message, errors = [], contacts = [], onConfirm = null) => {
    setModalConfig({
      visible: true,
      type,
      title,
      message,
      errors,
      onConfirm
    })
    
    if (type === 'contacts') {
      setContactsList(contacts)
    }
    
    // Modal entrance animation
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start()
  }

  const hideModal = () => {
    // Modal exit animation
    Animated.parallel([
      Animated.timing(modalScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setModalConfig({
        visible: false,
        type: '',
        title: '',
        message: '',
        errors: [],
        onConfirm: null
      })
      setContactsList([]) // Reset contacts list when modal closes
    })
    
    // Shake animation for validation error
    if (modalConfig.type === 'validation') {
      Animated.sequence([
        Animated.timing(buttonScale, { toValue: 1.05, duration: 100, useNativeDriver: true }),
        Animated.timing(buttonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
        Animated.timing(buttonScale, { toValue: 1.05, duration: 100, useNativeDriver: true }),
        Animated.timing(buttonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start()
    }
  }

  const getModalIcon = () => {
    switch (modalConfig.type) {
      case 'validation':
        return '!'
      case 'success':
        return '✓'
      case 'error':
        return '×'
      case 'duplicate':
        return '!'
      case 'contacts':
        return '☏'
      case 'delete':
        return '🗑'
      default:
        return 'i'
    }
  }

  const getModalIconColor = () => {
    switch (modalConfig.type) {
      case 'validation':
        return '#F59E0B' // Orange untuk warning
      case 'success':
        return '#10B981'
      case 'error':
        return '#EF4444'
      case 'duplicate':
        return '#F59E0B'
      case 'contacts':
        return colors.secondary
      case 'delete':
        return '#EF4444'
      default:
        return colors.primary
    }
  }

  const loadCustomerData = async () => {
    try {
      const data = await AsyncStorage.getItem('datakostumer')
      if (data) {
        const parsed = JSON.parse(data)
        const customerArray = Array.isArray(parsed) ? parsed : Object.values(parsed)
        
        const sortedCustomers = customerArray.sort((a, b) => {
          return a.nama.localeCompare(b.nama) // Sort by name alphabetically
        })
        
        setCustomerData(sortedCustomers)
      } else {
        setCustomerData([])
      }
    } catch (error) {
      console.error('Error loading customer data:', error)
      setCustomerData([])
    }
  }

  const requestContactsPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Akses Kontak',
            message: 'Aplikasi memerlukan akses ke kontak untuk memilih nomor telepon',
            buttonNeutral: 'Nanti',
            buttonNegative: 'Batal',
            buttonPositive: 'OK',
          }
        )
        return granted === PermissionsAndroid.RESULTS.GRANTED
      } catch (err) {
        console.warn(err)
        return false
      }
    }
    return true // iOS handles permissions automatically
  }

  const openDeviceContacts = async () => {
    try {
      setContactsLoading(true)
      startContactsLoadingAnimation()

      const hasPermission = await requestContactsPermission()
      
      if (!hasPermission) {
        setContactsLoading(false)
        stopContactsLoadingAnimation()
        showModal('error', 'Permission Denied', 'Akses kontak ditolak. Mohon berikan izin untuk mengakses kontak.')
        return
      }

      // Get all contacts
      const contacts = await Contacts.getAll()
      
      if (contacts.length === 0) {
        setContactsLoading(false)
        stopContactsLoadingAnimation()
        showModal('error', 'Tidak Ada Kontak', 'Tidak ada kontak yang ditemukan di perangkat.')
        return
      }

      // Filter contacts that have phone numbers and format them
      const contactsWithPhones = contacts
        .filter(contact => contact.phoneNumbers && contact.phoneNumbers.length > 0)
        .map(contact => ({
          id: contact.recordID,
          name: contact.displayName || `${contact.givenName || ''} ${contact.familyName || ''}`.trim() || 'Tanpa Nama',
          phoneNumbers: contact.phoneNumbers.map(phone => ({
            label: phone.label || 'mobile',
            number: phone.number
          }))
        }))
        .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically

      if (contactsWithPhones.length === 0) {
        setContactsLoading(false)
        stopContactsLoadingAnimation()
        showModal('error', 'Tidak Ada Nomor', 'Tidak ada kontak dengan nomor telepon yang ditemukan.')
        return
      }

      // Stop loading and show contacts modal
      setContactsLoading(false)
      stopContactsLoadingAnimation()
      
      // Show contacts picker modal
      showModal('contacts', 'Pilih Kontak', 'Pilih kontak yang ingin digunakan:', [], contactsWithPhones)

    } catch (error) {
      console.error('Error getting contacts:', error)
      setContactsLoading(false)
      stopContactsLoadingAnimation()
      showModal('error', 'Error', 'Gagal mengambil daftar kontak.')
    }
  }

  const selectContact = (contact, phoneNumber) => {
    // Clean phone number
    const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '')
    
    setFormData(prev => ({
      ...prev,
      noTelepon: cleanedNumber
    }))

    // Close modal
    hideModal()

    // Show success message
    setTimeout(() => {
      showModal('success', 'Kontak Dipilih', `Nomor telepon dari ${contact.name} berhasil diambil.`)
    }, 300)
  }

  const handleContactButtonPress = () => {
    // Animation for contact button
    Animated.sequence([
      Animated.timing(contactButtonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(contactButtonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start()

    openDeviceContacts()
  }

  const startContactsLoadingAnimation = () => {
    Animated.loop(
      Animated.timing(contactLoadingRotation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start()
  }

  const stopContactsLoadingAnimation = () => {
    contactLoadingRotation.stopAnimation()
    contactLoadingRotation.setValue(0)
  }

  const startLoadingAnimation = () => {
    Animated.loop(
      Animated.timing(loadingRotation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start()
  }

  const stopLoadingAnimation = () => {
    loadingRotation.stopAnimation()
    loadingRotation.setValue(0)
  }

  const saveToLocalStorage = async () => {
    try {
      const existingData = await AsyncStorage.getItem('datakostumer')
      let customerList = existingData ? JSON.parse(existingData) : []
      
      if (editingCustomer) {
        // Update existing customer
        const customerIndex = customerList.findIndex(customer => customer.id === editingCustomer.id)
        if (customerIndex !== -1) {
          // Check if phone number is taken by another customer (not the one being edited)
          const duplicateCustomer = customerList.find(customer => 
            customer.noTelepon === formData.noTelepon && customer.id !== editingCustomer.id
          )
          if (duplicateCustomer) {
            showModal('duplicate', 'No Telepon Sudah Ada', `Kostumer lain dengan no telepon "${formData.noTelepon}" sudah terdaftar. Gunakan nomor yang berbeda.`)
            return false
          }

          customerList[customerIndex] = {
            ...customerList[customerIndex],
            ...formData,
            updatedAt: new Date().toISOString()
          }
        }
      } else {
        // Check if phone number already exists for new customer
        const existingCustomer = customerList.find(customer => customer.noTelepon === formData.noTelepon)
        if (existingCustomer) {
          showModal('duplicate', 'No Telepon Sudah Ada', `Kostumer dengan no telepon "${formData.noTelepon}" sudah terdaftar. Gunakan nomor yang berbeda.`)
          return false
        }

        // Add new customer with timestamp and ID
        const newCustomer = {
          ...formData,
          id: Date.now().toString(), // Generate simple ID
          createdAt: new Date().toISOString(),
          timestamp: Date.now()
        }
        
        customerList.push(newCustomer)
      }
      
      // Save to localStorage
      await AsyncStorage.setItem('datakostumer', JSON.stringify(customerList))
      return true
    } catch (error) {
      console.error('Error saving to localStorage:', error)
      showModal('error', 'Error', 'Gagal menyimpan data. Silahkan coba lagi.')
      return false
    }
  }

  const handleSave = async () => {
    if (!validateForm()) return
    
    setLoading(true)
    startLoadingAnimation()
    
    // Button press animation
    Animated.parallel([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 0.7,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start()

    // Simulate loading delay
    setTimeout(async () => {
      const success = await saveToLocalStorage()
      
      if (success) {
        // Success animation sequence
        Animated.sequence([
          // Button back to normal
          Animated.parallel([
            Animated.timing(buttonScale, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(buttonOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            })
          ]),
          // Success scale animation
          Animated.spring(successScale, {
            toValue: 1,
            tension: 50,
            friction: 3,
            useNativeDriver: true,
          })
        ]).start(() => {
          // Reset form
          setFormData({ nama: '', noTelepon: '', alamat: '' })
          setEditingCustomer(null)
          loadCustomerData()
          
          // Show success modal
          const message = editingCustomer ? 'Data kostumer berhasil diperbarui' : 'Data kostumer berhasil disimpan ke sistem'
          showModal('success', 'Berhasil!', message)
          
          // Reset success animation after delay
          setTimeout(() => {
            Animated.timing(successScale, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start()
          }, 1500)
        })
      } else {
        // Reset button if failed
        Animated.parallel([
          Animated.timing(buttonScale, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(buttonOpacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          })
        ]).start()
      }
      
      stopLoadingAnimation()
      setLoading(false)
    }, 1500) // Simulate network delay
  }

  const handleEdit = (customer) => {
    setFormData({
      nama: customer.nama,
      noTelepon: customer.noTelepon,
      alamat: customer.alamat || '' // Handle old data without alamat
    })
    setEditingCustomer(customer)
  }

  const handleCancelEdit = () => {
    setFormData({ nama: '', noTelepon: '', alamat: '' })
    setEditingCustomer(null)
  }

  const handleDelete = (customer) => {
    showModal(
      'delete',
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus kostumer "${customer.nama}" dengan nomor "${customer.noTelepon}"?`,
      [],
      [],
      () => confirmDelete(customer)
    )
  }

  const confirmDelete = async (customer) => {
    try {
      const existingData = await AsyncStorage.getItem('datakostumer')
      let customerList = existingData ? JSON.parse(existingData) : []
      
      customerList = customerList.filter(item => item.id !== customer.id)
      
      await AsyncStorage.setItem('datakostumer', JSON.stringify(customerList))
      loadCustomerData()
      
      showModal('success', 'Berhasil!', 'Data kostumer berhasil dihapus')
    } catch (error) {
      console.error('Error deleting customer:', error)
      showModal('error', 'Error', 'Gagal menghapus data. Silahkan coba lagi.')
    }
  }

  const rotateInterpolate = loadingRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const contactLoadingRotateInterpolate = contactLoadingRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <View style={{
        flex: 1,
        backgroundColor: colors.white
    }}>
      <MyHeader title="Data Costumer"/>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{
            padding: 20
        }}>
          {/* Edit Mode Indicator */}
          {editingCustomer && (
            <View style={{
              backgroundColor: '#FEF3C7',
              padding: 15,
              borderRadius: 12,
              marginBottom: 15,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color: '#D97706',
                  fontFamily: fonts.primary[600],
                  fontSize: 14
                }}>
                  Mode Edit
                </Text>
                <Text style={{
                  color: '#92400E',
                  fontFamily: fonts.primary[400],
                  fontSize: 12,
                  marginTop: 2
                }}>
                  Mengedit kostumer: {editingCustomer.nama}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCancelEdit}
                style={{
                  backgroundColor: '#D97706',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8
                }}
              >
                <Text style={{
                  color: 'white',
                  fontFamily: fonts.primary[500],
                  fontSize: 12
                }}>
                  Batal
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <MyInput 
            label="Nama Kostumer" 
            placeholder="Masukan nama kostumer"
            value={formData.nama}
            onChangeText={(value) => handleInputChange('nama', value)}
            editable={!loading}
          />
          
          <View style={{ marginBottom: 15 }}>
            <MyInput 
              keyboardType="phone-pad"
              label="No Telepon" 
              placeholder="Masukan no telepon"
              value={formData.noTelepon}
              onChangeText={(value) => handleInputChange('noTelepon', value)}
              editable={!loading}
            />
            
            {/* Contact Picker Button */}
            <TouchableOpacity
              onPress={handleContactButtonPress}
              disabled={loading || contactsLoading}
              activeOpacity={0.7}
            >
              <Animated.View style={{
                backgroundColor: colors.secondary + '20',
                borderRadius: 10,
                padding: 12,
                marginTop: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.secondary + '40',
                transform: [{ scale: contactButtonScale }],
                opacity: contactsLoading ? 0.7 : 1
              }}>
                {contactsLoading && (
                  <Animated.Text style={{
                    color: colors.secondary,
                    fontSize: 16,
                    marginRight: 8,
                    transform: [{ rotate: contactLoadingRotateInterpolate }]
                  }}>
                    ↻
                  </Animated.Text>
                )}
                {!contactsLoading && (
                  <Text style={{
                    color: colors.secondary,
                    fontSize: 16,
                    marginRight: 8
                  }}>
                    ☏
                  </Text>
                )}
                <Text style={{
                  color: colors.secondary,
                  fontFamily: fonts.primary[500],
                  fontSize: 14
                }}>
                  {contactsLoading ? 'Memuat Kontak...' : 'Pilih dari Kontak'}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Input Alamat */}
          <MyInput 
            label="Alamat" 
            placeholder="Masukan alamat lengkap kostumer"
            value={formData.alamat}
            onChangeText={(value) => handleInputChange('alamat', value)}
            editable={!loading}
            multiline={true}
            numberOfLines={3}
            textAlignVertical="top"
            style={{
              height: 80,
              paddingTop: 12
            }}
          />
          
          {/* Save Button with Animation */}
          <TouchableNativeFeedback 
            onPress={handleSave}
            disabled={loading}
          >
            <Animated.View style={{
                padding: 15,
                borderRadius: 12,
                backgroundColor: loading ? colors.primary + '80' : colors.primary,
                marginTop: 10,
                transform: [{ scale: buttonScale }],
                opacity: buttonOpacity,
                elevation: loading ? 2 : 6,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                position: 'relative',
                overflow: 'hidden'
            }}>
              {/* Button Content */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {loading && (
                  <Animated.Text style={{
                    color: colors.white,
                    fontSize: 18,
                    marginRight: 10,
                    transform: [{ rotate: rotateInterpolate }]
                  }}>
                    ↻
                  </Animated.Text>
                )}
                <Text style={{
                    color: colors.white,
                    fontFamily: fonts.primary[600],
                    fontSize: 16,
                    textAlign: "center"
                }}>
                  {loading ? (editingCustomer ? 'Memperbarui...' : 'Menyimpan...') : (editingCustomer ? 'Update Data' : 'Simpan Data')}
                </Text>
              </View>
              
              {/* Success Checkmark Overlay */}
              <Animated.View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: '#10B981',
                justifyContent: 'center',
                alignItems: 'center',
                transform: [{ scale: successScale }],
                borderRadius: 12
              }}>
                <Text style={{
                  color: 'white',
                  fontSize: 24,
                  fontFamily: fonts.primary[600]
                }}>
                  ✓ {editingCustomer ? 'Diperbarui!' : 'Tersimpan!'}
                </Text>
              </Animated.View>
              
              {/* Ripple Effect */}
              {!loading && (
                <View style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 12
                }} />
              )}
            </Animated.View>
          </TouchableNativeFeedback>
          
          {/* Info Text */}
          <Text style={{
            textAlign: 'center',
            color: colors.secondary,
            fontFamily: fonts.primary[400],
            fontSize: 12,
            marginTop: 10,
            opacity: 0.7
          }}>
            Data kostumer akan disimpan ke penyimpanan lokal
          </Text>

          {/* History Section */}
          {customerData.length > 0 && (
            <View style={{
              marginTop: 30
            }}>
              <Text style={{
                fontSize: 18,
                fontFamily: fonts.primary[600],
                color: colors.primary,
                marginBottom: 15
              }}>
                Riwayat Data Kostumer ({customerData.length})
              </Text>

              {customerData.map((customer, index) => (
                <View key={customer.id || index} style={{
                  backgroundColor: editingCustomer?.id === customer.id ? '#F0F9FF' : 'white',
                  borderRadius: 12,
                  padding: 15,
                  marginBottom: 10,
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  borderWidth: editingCustomer?.id === customer.id ? 2 : 1,
                  borderColor: editingCustomer?.id === customer.id ? colors.primary : '#F3F4F6'
                }}>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <View style={{ flex: 1 }}>
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 8
                      }}>
                        <View style={{
                          backgroundColor: colors.secondary,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                          marginRight: 10
                        }}>
                          <Text style={{
                            color: 'white',
                            fontFamily: fonts.primary[600],
                            fontSize: 10
                          }}>
                            KOSTUMER
                          </Text>
                        </View>
                        {editingCustomer?.id === customer.id && (
                          <View style={{
                            backgroundColor: '#10B981',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4
                          }}>
                            <Text style={{
                              color: 'white',
                              fontFamily: fonts.primary[500],
                              fontSize: 10
                            }}>
                              EDITING
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      <Text style={{
                        fontSize: 16,
                        fontFamily: fonts.primary[600],
                        color: '#1F2937',
                        marginBottom: 4
                      }}>
                        {customer.nama}
                      </Text>
                      
                      <Text style={{
                        fontSize: 14,
                        fontFamily: fonts.primary[500],
                        color: colors.secondary,
                        marginBottom: 4
                      }}>
                        📞 {customer.noTelepon}
                      </Text>
                      
                      {/* Display Alamat */}
                      <Text style={{
                        fontSize: 14,
                        fontFamily: fonts.primary[400],
                        color: '#6B7280',
                        marginBottom: 8,
                        lineHeight: 20
                      }}>
                        📍 {customer.alamat || 'Alamat tidak tersedia'}
                      </Text>
                      
                      <Text style={{
                        fontSize: 12,
                        fontFamily: fonts.primary[400],
                        color: '#6B7280',
                        marginBottom: 2
                      }}>
                        Dibuat: {formatDate(customer.createdAt)}
                      </Text>
                      
                      {customer.updatedAt && (
                        <Text style={{
                          fontSize: 12,
                          fontFamily: fonts.primary[400],
                          color: '#10B981'
                        }}>
                          Diperbarui: {formatDate(customer.updatedAt)}
                        </Text>
                      )}
                    </View>

                    {/* Action Buttons */}
                    <View style={{
                      flexDirection: 'row',
                      gap: 8
                    }}>
                      <TouchableOpacity
                        onPress={() => handleEdit(customer)}
                        disabled={loading}
                        style={{
                          backgroundColor: editingCustomer?.id === customer.id ? '#10B981' : '#3B82F6',
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 8,
                          opacity: loading ? 0.5 : 1,
                          right: 10
                        }}
                      >
                        <Text style={{
                          color: 'white',
                          fontFamily: fonts.primary[500],
                          fontSize: 12
                        }}>
                          {editingCustomer?.id === customer.id ? 'Editing' : 'Edit'}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={() => handleDelete(customer)}
                        disabled={loading}
                        style={{
                          backgroundColor: '#EF4444',
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 8,
                          opacity: loading ? 0.5 : 1
                        }}
                      >
                        <Text style={{
                          color: 'white',
                          fontFamily: fonts.primary[500],
                          fontSize: 12
                        }}>
                          Hapus
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Custom Modal */}
      <Modal
        transparent={true}
        visible={modalConfig.visible}
        animationType="none"
        onRequestClose={hideModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: modalOpacity,
                transform: [{ scale: modalScale }],
              },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={[styles.modalIcon, { backgroundColor: getModalIconColor() + '20' }]}>
                <Text style={[styles.modalIconText, { color: getModalIconColor() }]}>
                  {getModalIcon()}
                </Text>
              </View>
              <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            </View>

            {/* Modal Content */}
            <View style={styles.modalContent}>
              {modalConfig.type === 'contacts' ? (
                // Contacts List
                <ScrollView style={styles.contactsContainer} showsVerticalScrollIndicator={false}>
                  {contactsList.map((contact, index) => (
                    <View key={contact.id} style={styles.contactGroup}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      {contact.phoneNumbers.map((phone, phoneIndex) => (
                        <TouchableOpacity
                          key={`${contact.id}-${phoneIndex}`}
                          style={styles.phoneItem}
                          onPress={() => selectContact(contact, phone.number)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.phoneContent}>
                            <Text style={styles.phoneLabel}>{phone.label}</Text>
                            <Text style={styles.phoneNumber}>{phone.number}</Text>
                          </View>
                          <View style={styles.selectButton}>
                            <Text style={styles.selectButtonText}>Pilih</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                      {index < contactsList.length - 1 && <View style={styles.contactDivider} />}
                    </View>
                  ))}
                </ScrollView>
              ) : (
                // Normal Modal Content
                <View>
                  <Text style={styles.modalMessage}>{modalConfig.message}</Text>
                  
                  {/* Validation Errors List */}
                  {modalConfig.errors.length > 0 && (
                    <View style={styles.errorList}>
                      {modalConfig.errors.map((error, index) => (
                        <View key={index} style={styles.errorItem}>
                          <Text style={styles.errorBullet}>•</Text>
                          <Text style={styles.errorText}>{error}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              {modalConfig.type === 'delete' ? (
                <View style={{
                  flexDirection: 'row',
                  gap: 10
                }}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#6B7280', flex: 1 }]}
                    onPress={hideModal}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalButtonText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#EF4444', flex: 1 }]}
                    onPress={() => {
                      modalConfig.onConfirm?.()
                      hideModal()
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalButtonText}>Hapus</Text>
                  </TouchableOpacity>
                </View>
              ) : modalConfig.type === 'contacts' ? (
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#6B7280' }]}
                  onPress={hideModal}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonText}>Batal</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: getModalIconColor() }]}
                  onPress={hideModal}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonText}>OK</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  )
}

const styles = {
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  modalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalIconText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.primary[600],
    color: '#1F2937',
    textAlign: 'center',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: fonts.primary[400],
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorList: {
    marginTop: 15,
    backgroundColor: '#FEF3F2',
    borderRadius: 10,
    padding: 15,
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  errorBullet: {
    color: '#EF4444',
    fontSize: 16,
    fontFamily: fonts.primary[600],
    marginRight: 8,
    marginTop: 2,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.primary[400],
    color: '#DC2626',
  },
  modalActions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalButton: {
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: fonts.primary[600],
  },
  // Contacts Modal Styles
  contactsContainer: {
    maxHeight: 400,
  },
  contactGroup: {
    marginBottom: 15,
  },
  contactName: {
    fontSize: 16,
    fontFamily: fonts.primary[600],
    color: '#1F2937',
    marginBottom: 8,
  },
  phoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  phoneContent: {
    flex: 1,
  },
  phoneLabel: {
    fontSize: 12,
    fontFamily: fonts.primary[400],
    color: '#6B7280',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  phoneNumber: {
    fontSize: 14,
    fontFamily: fonts.primary[500],
    color: '#374151',
  },
  selectButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  selectButtonText: {
    fontSize: 12,
    color: 'white',
    fontFamily: fonts.primary[600],
  },
  contactDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 10,
  },
}
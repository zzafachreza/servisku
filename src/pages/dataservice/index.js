import { View, Text, ScrollView, TouchableNativeFeedback, Animated, Alert, Modal, TouchableOpacity } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import { colors, fonts } from '../../utils'
import { MyHeader, MyInput } from '../../components'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function DataService() {
  const [formData, setFormData] = useState({
    id: '',
    namaDevice: ''
  })
  const [deviceData, setDeviceData] = useState([])
  const [editingDevice, setEditingDevice] = useState(null)
  const [loading, setLoading] = useState(false)
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    type: '', // 'validation', 'success', 'error', 'duplicate', 'delete'
    title: '',
    message: '',
    errors: [],
    onConfirm: null
  })
  
  // Animation references
  const buttonScale = useRef(new Animated.Value(1)).current
  const buttonOpacity = useRef(new Animated.Value(1)).current
  const successScale = useRef(new Animated.Value(0)).current
  const loadingRotation = useRef(new Animated.Value(0)).current
  const modalScale = useRef(new Animated.Value(0)).current
  const modalOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    loadDeviceData()
  }, [])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    const errors = []
    
    if (!formData.id.trim()) {
      errors.push('ID Device')
    }
    
    if (!formData.namaDevice.trim()) {
      errors.push('Nama Device')
    }

    if (errors.length > 0) {
      showModal('validation', 'Peringatan', 'Mohon lengkapi field yang diperlukan', errors)
      return false
    }
    
    return true
  }

  const showModal = (type, title, message, errors = [], onConfirm = null) => {
    setModalConfig({
      visible: true,
      type,
      title,
      message,
      errors,
      onConfirm
    })
    
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
      case 'delete':
        return '🗑'
      default:
        return 'i'
    }
  }

  const getModalIconColor = () => {
    switch (modalConfig.type) {
      case 'validation':
        return '#F59E0B'
      case 'success':
        return '#10B981'
      case 'error':
        return '#EF4444'
      case 'duplicate':
        return '#F59E0B'
      case 'delete':
        return '#EF4444'
      default:
        return colors.primary
    }
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

  const loadDeviceData = async () => {
    try {
      const data = await AsyncStorage.getItem('datadevice')
      if (data) {
        const parsed = JSON.parse(data)
        const deviceArray = Array.isArray(parsed) ? parsed : Object.values(parsed)
        
        const sortedDevices = deviceArray.sort((a, b) => {
          const idA = parseInt(a.id) || 0
          const idB = parseInt(b.id) || 0
          return idA - idB
        })
        
        setDeviceData(sortedDevices)
      } else {
        setDeviceData([])
      }
    } catch (error) {
      console.error('Error loading device data:', error)
      setDeviceData([])
    }
  }

  const saveToLocalStorage = async () => {
    try {
      const existingData = await AsyncStorage.getItem('datadevice')
      let deviceList = existingData ? JSON.parse(existingData) : []
      
      if (editingDevice) {
        // Update existing device
        const deviceIndex = deviceList.findIndex(device => device.id === editingDevice.id)
        if (deviceIndex !== -1) {
          deviceList[deviceIndex] = {
            ...deviceList[deviceIndex],
            ...formData,
            updatedAt: new Date().toISOString()
          }
        }
      } else {
        // Check if ID already exists for new device
        const existingDevice = deviceList.find(device => device.id === formData.id)
        if (existingDevice) {
          showModal('duplicate', 'ID Sudah Ada', `Device dengan ID "${formData.id}" sudah terdaftar. Gunakan ID yang berbeda.`)
          return false
        }

        // Add new device with timestamp
        const newDevice = {
          ...formData,
          createdAt: new Date().toISOString(),
          timestamp: Date.now()
        }
        
        deviceList.push(newDevice)
      }
      
      // Save to localStorage
      await AsyncStorage.setItem('datadevice', JSON.stringify(deviceList))
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

    setTimeout(async () => {
      const success = await saveToLocalStorage()
      
      if (success) {
        // Success animation sequence
        Animated.sequence([
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
          Animated.spring(successScale, {
            toValue: 1,
            tension: 50,
            friction: 3,
            useNativeDriver: true,
          })
        ]).start(() => {
          // Reset form
          setFormData({ id: '', namaDevice: '' })
          setEditingDevice(null)
          loadDeviceData()
          
          // Show success modal
          const message = editingDevice ? 'Data device berhasil diperbarui' : 'Data device berhasil disimpan ke sistem'
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
    }, 1500)
  }

  const handleEdit = (device) => {
    setFormData({
      id: device.id,
      namaDevice: device.namaDevice
    })
    setEditingDevice(device)
  }

  const handleCancelEdit = () => {
    setFormData({ id: '', namaDevice: '' })
    setEditingDevice(null)
  }

  const handleDelete = (device) => {
    showModal(
      'delete',
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus device "${device.namaDevice}" dengan ID "${device.id}"?`,
      [],
      () => confirmDelete(device)
    )
  }

  const confirmDelete = async (device) => {
    try {
      const existingData = await AsyncStorage.getItem('datadevice')
      let deviceList = existingData ? JSON.parse(existingData) : []
      
      deviceList = deviceList.filter(item => item.id !== device.id)
      
      await AsyncStorage.setItem('datadevice', JSON.stringify(deviceList))
      loadDeviceData()
      
      showModal('success', 'Berhasil!', 'Data device berhasil dihapus')
    } catch (error) {
      console.error('Error deleting device:', error)
      showModal('error', 'Error', 'Gagal menghapus data. Silahkan coba lagi.')
    }
  }

  const rotateInterpolate = loadingRotation.interpolate({
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
      <MyHeader title="Data Device"/>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{
            padding: 20
        }}>
          {/* Edit Mode Indicator */}
          {editingDevice && (
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
                  Mengedit device: {editingDevice.namaDevice}
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
            keyboardType="numeric" 
            label="ID Device" 
            placeholder="Masukan ID device"
            value={formData.id}
            onChangeText={(value) => handleInputChange('id', value)}
            editable={!loading && !editingDevice}
          />
          
          <MyInput 
            label="Nama Device" 
            placeholder="Masukan nama device"
            value={formData.namaDevice}
            onChangeText={(value) => handleInputChange('namaDevice', value)}
            editable={!loading}
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
                    ⟳
                  </Animated.Text>
                )}
                <Text style={{
                    color: colors.white,
                    fontFamily: fonts.primary[600],
                    fontSize: 16,
                    textAlign: "center"
                }}>
                  {loading ? (editingDevice ? 'Memperbarui...' : 'Menyimpan...') : (editingDevice ? 'Update Data' : 'Simpan Data')}
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
                  ✓ {editingDevice ? 'Diperbarui!' : 'Tersimpan!'}
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
            Data akan disimpan ke penyimpanan lokal
          </Text>

          {/* History Section */}
          {deviceData.length > 0 && (
            <View style={{
              marginTop: 30
            }}>
              <Text style={{
                fontSize: 18,
                fontFamily: fonts.primary[600],
                color: colors.primary,
                marginBottom: 15
              }}>
                History Data Device ({deviceData.length})
              </Text>

              {deviceData.map((device, index) => (
                <View key={device.id || index} style={{
                  backgroundColor: editingDevice?.id === device.id ? '#F0F9FF' : 'white',
                  borderRadius: 12,
                  padding: 15,
                  marginBottom: 10,
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  borderWidth: editingDevice?.id === device.id ? 2 : 1,
                  borderColor: editingDevice?.id === device.id ? colors.primary : '#F3F4F6'
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
                          backgroundColor: colors.primary,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                          marginRight: 10
                        }}>
                          <Text style={{
                            color: 'white',
                            fontFamily: fonts.primary[600],
                            fontSize: 12
                          }}>
                            ID: {device.id}
                          </Text>
                        </View>
                        {editingDevice?.id === device.id && (
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
                        {device.namaDevice}
                      </Text>
                      
                      <Text style={{
                        fontSize: 12,
                        fontFamily: fonts.primary[400],
                        color: '#6B7280',
                        marginBottom: 2
                      }}>
                        Dibuat: {formatDate(device.createdAt)}
                      </Text>
                      
                      {device.updatedAt && (
                        <Text style={{
                          fontSize: 12,
                          fontFamily: fonts.primary[400],
                          color: '#10B981'
                        }}>
                          Diperbarui: {formatDate(device.updatedAt)}
                        </Text>
                      )}
                    </View>

                    {/* Action Buttons */}
                    <View style={{
                      flexDirection: 'row',
                      gap: 8
                    }}>
                      <TouchableOpacity
                        onPress={() => handleEdit(device)}
                        disabled={loading}
                        style={{
                          backgroundColor: editingDevice?.id === device.id ? '#10B981' : '#3B82F6',
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 8,
                          opacity: loading ? 0.5 : 1,
                          right:10
                        }}
                      >
                        <Text style={{
                          color: 'white',
                          fontFamily: fonts.primary[500],
                          fontSize: 12
                        }}>
                          {editingDevice?.id === device.id ? 'Editing' : 'Edit'}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={() => handleDelete(device)}
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
}
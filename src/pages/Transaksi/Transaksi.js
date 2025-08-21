import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native'
import React, { useState, useEffect } from 'react'
import { colors, fonts } from '../../utils'
import { MyCalendar, MyHeader, MyInput, MyPicker } from '../../components'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function Transaksi() {
  const [formData, setFormData] = useState({
    tanggal: '',
    namaKostumer: '',
    selectedDevices: [],
    totalHarga: 0
  })
  const [loading, setLoading] = useState(false)
  const [kostumerData, setKostumerData] = useState([])
  const [deviceData, setDeviceData] = useState([])
  const [devicePickerData, setDevicePickerData] = useState([])
  const [inputMode, setInputMode] = useState('picker')
  const [devicePickerValue, setDevicePickerValue] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    calculateTotal()
  }, [formData.selectedDevices])

  const calculateTotal = () => {
    const total = formData.selectedDevices.reduce((sum, device) => {
      return sum + (parseFloat(device.harga) || 0)
    }, 0)
    setFormData(prev => ({ ...prev, totalHarga: total }))
  }

  const loadData = async () => {
    await loadKostumerData()
    await loadDeviceData()
  }

  const loadKostumerData = async () => {
    try {
      const data = await AsyncStorage.getItem('datakostumer')
      if (data) {
        const parsed = JSON.parse(data)
        let kostumerArray = Array.isArray(parsed) ? parsed : Object.values(parsed || {})
        
        const validKostumer = kostumerArray.filter(item => 
          item && (item.nama || item.namaKostumer)
        )
        
        const kostumerOptions = validKostumer.map(item => ({
          label: item.nama || item.namaKostumer || 'Unknown',
          value: item.nama || item.namaKostumer || 'Unknown'
        }))
        
        setKostumerData(kostumerOptions)
      }
    } catch (error) {
      console.error('Error loading kostumer:', error)
      setKostumerData([])
    }
  }

  const loadDeviceData = async () => {
    try {
      const data = await AsyncStorage.getItem('datadevice')
      if (data) {
        const parsed = JSON.parse(data)
        let deviceArray = Array.isArray(parsed) ? parsed : Object.values(parsed || {})
        
        const validDevices = deviceArray.filter((device, index) => 
          device && (device.namaDevice || device.nama)
        )
        
        const normalizedDevices = validDevices.map((device, index) => ({
          id: String(device.id || index + 1),
          namaDevice: String(device.namaDevice || device.nama || `Device ${index + 1}`)
        }))
        
        setDeviceData(normalizedDevices)
        
        const deviceOptions = normalizedDevices.map(device => ({
          label: `${device.namaDevice} (ID: ${device.id})`,
          value: String(device.id)
        }))
        
        setDevicePickerData(deviceOptions)
      }
    } catch (error) {
      console.error('Error loading device:', error)
      setDeviceData([])
      setDevicePickerData([])
    }
  }

  const handleDeviceSelection = (deviceId) => {
    setDevicePickerValue('') // Reset picker
    
    if (!deviceId) return
    
    // Check if already selected
    const isAlreadySelected = formData.selectedDevices.some(d => 
      String(d.id) === String(deviceId)
    )
    
    if (isAlreadySelected) {
      Alert.alert('Info', 'Device sudah dipilih')
      return
    }
    
    // Find device
    const selectedDevice = deviceData.find(d => String(d.id) === String(deviceId))
    if (!selectedDevice) {
      Alert.alert('Error', 'Device tidak ditemukan')
      return
    }
    
    // Add to selected list
    const newDevice = {
      id: selectedDevice.id,
      namaDevice: selectedDevice.namaDevice,
      harga: ''
    }
    
    setFormData(prev => ({
      ...prev,
      selectedDevices: [...prev.selectedDevices, newDevice]
    }))
  }

  const updateDevicePrice = (deviceId, price) => {
    const cleanPrice = price.replace(/[^0-9.]/g, '')
    setFormData(prev => ({
      ...prev,
      selectedDevices: prev.selectedDevices.map(device => 
        String(device.id) === String(deviceId)
          ? { ...device, harga: cleanPrice }
          : device
      )
    }))
  }

  const removeDevice = (deviceId) => {
    setFormData(prev => ({
      ...prev,
      selectedDevices: prev.selectedDevices.filter(d => 
        String(d.id) !== String(deviceId)
      )
    }))
  }

  const validateForm = () => {
    if (!formData.tanggal) {
      Alert.alert('Error', 'Tanggal harus diisi')
      return false
    }
    if (!formData.namaKostumer) {
      Alert.alert('Error', 'Nama kostumer harus diisi')
      return false
    }
    if (formData.selectedDevices.length === 0) {
      Alert.alert('Error', 'Pilih minimal 1 device')
      return false
    }
    
    const devicesWithoutPrice = formData.selectedDevices.filter(d => 
      !d.harga || parseFloat(d.harga) <= 0
    )
    
    if (devicesWithoutPrice.length > 0) {
      Alert.alert('Error', 'Semua device harus diisi harga')
      return false
    }
    
    return true
  }

  const handleSave = async () => {
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      const existingData = await AsyncStorage.getItem('dataservice')
      const serviceList = existingData ? JSON.parse(existingData) : []
      
      const newService = {
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      }
      
      serviceList.push(newService)
      await AsyncStorage.setItem('dataservice', JSON.stringify(serviceList))
      
      Alert.alert('Success', 'Data berhasil disimpan!')
      
      // Reset form
      setFormData({
        tanggal: '',
        namaKostumer: '',
        selectedDevices: [],
        totalHarga: 0
      })
      setDevicePickerValue('')
      
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan data')
      console.error('Save error:', error)
    }
    
    setLoading(false)
  }

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return 'Rp 0'
    return `Rp ${amount.toLocaleString('id-ID')}`
  }

  // Safe render helpers
  const getDeviceCount = () => String(formData.selectedDevices.length)
  const getKostumerCount = () => String(kostumerData.length)
  const getDeviceDataCount = () => String(deviceData.length)

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <MyHeader title="Data Service"/>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ padding: 20 }}>

          {/* Debug Info */}
          <TouchableOpacity
            style={{
              backgroundColor: '#6B7280',
              padding: 10,
              borderRadius: 8,
              marginBottom: 15,
              alignItems: 'center'
            }}
            onPress={loadData}
          >
            <Text style={{ color: 'white', fontSize: 12 }}>
              Refresh (Kostumer: {getKostumerCount()} | Device: {getDeviceDataCount()})
            </Text>
          </TouchableOpacity>

          {/* Tanggal */}
          <MyCalendar 
            label="Tanggal"
            value={formData.tanggal}
            placeholder="Pilih Tanggal"
            onDateChange={(date) => setFormData(prev => ({ ...prev, tanggal: date }))}
          />

          {/* Mode Toggle */}
          <View style={{ marginBottom: 15 }}>
            <Text style={{ fontSize: 14, marginBottom: 8, color: colors.black }}>
              Pilih Kostumer:
            </Text>
            <View style={{ flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 4 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: 'center',
                  backgroundColor: inputMode === 'picker' ? colors.primary : 'transparent',
                  borderRadius: 6
                }}
                onPress={() => {
                  setInputMode('picker')
                  setFormData(prev => ({ ...prev, namaKostumer: '' }))
                }}
              >
                <Text style={{ 
                  color: inputMode === 'picker' ? 'white' : '#6B7280',
                  fontSize: 14
                }}>
                  Pilih dari List ({getKostumerCount()})
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: 'center',
                  backgroundColor: inputMode === 'manual' ? colors.primary : 'transparent',
                  borderRadius: 6
                }}
                onPress={() => {
                  setInputMode('manual')
                  setFormData(prev => ({ ...prev, namaKostumer: '' }))
                }}
              >
                <Text style={{ 
                  color: inputMode === 'manual' ? 'white' : '#6B7280',
                  fontSize: 14
                }}>
                  Ketik Manual
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Kostumer Input */}
          {inputMode === 'picker' ? (
            <MyPicker 
              label="Nama Kostumer"
              data={kostumerData}
              value={formData.namaKostumer}
              onChangeText={(value) => setFormData(prev => ({ ...prev, namaKostumer: value }))}
              placeholder={kostumerData.length > 0 ? "Pilih kostumer" : "Tidak ada data"}
            />
          ) : (
            <MyInput 
              label="Nama Kostumer" 
              placeholder="Ketik nama kostumer"
              value={formData.namaKostumer}
              onChangeText={(value) => setFormData(prev => ({ ...prev, namaKostumer: value }))}
            />
          )}

          {/* Device Picker */}
          <MyPicker 
            label="Tambah Device"
            data={devicePickerData}
            placeholder={devicePickerData.length > 0 ? "Pilih device" : "Tidak ada data"}
            onChangeText={handleDeviceSelection}
            value={devicePickerValue}
          />

          {/* Selected Devices */}
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 14, marginBottom: 12, color: colors.black }}>
              Device Dipilih ({getDeviceCount()}):
            </Text>
            
            {formData.selectedDevices.length > 0 ? (
              <View style={{ backgroundColor: '#F9FAFB', borderRadius: 12, padding: 15 }}>
                {formData.selectedDevices.map((device, index) => (
                  <View 
                    key={`device-${device.id}-${index}`}
                    style={{
                      flexDirection: 'row',
                      backgroundColor: 'white',
                      padding: 15,
                      borderRadius: 10,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: '#E5E7EB'
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                        {device.namaDevice}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>
                        ID: {device.id}
                      </Text>
                      
                      <Text style={{ fontSize: 14, marginBottom: 6 }}>Harga Service:</Text>
                      <TextInput
                        style={{
                          borderWidth: 1,
                          borderColor: '#D1D5DB',
                          borderRadius: 8,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          backgroundColor: '#F9FAFB'
                        }}
                        placeholder="Masukkan harga"
                        keyboardType="numeric"
                        value={device.harga}
                        onChangeText={(value) => updateDevicePrice(device.id, value)}
                      />
                      
                      {device.harga && parseFloat(device.harga) > 0 && (
                        <Text style={{ fontSize: 16, color: colors.primary, marginTop: 4 }}>
                          {formatCurrency(parseFloat(device.harga))}
                        </Text>
                      )}
                    </View>
                    
                    <TouchableOpacity
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 15,
                        backgroundColor: '#EF4444',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginLeft: 10
                      }}
                      onPress={() => removeDevice(device.id)}
                    >
                      <Text style={{ color: 'white', fontSize: 18 }}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                
                {/* Total */}
                <View style={{ 
                  paddingTop: 15, 
                  borderTopWidth: 2, 
                  borderTopColor: colors.primary,
                  alignItems: 'flex-end' 
                }}>
                  <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>
                    Total Biaya:
                  </Text>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.primary }}>
                    {formatCurrency(formData.totalHarga)}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={{
                backgroundColor: '#F9FAFB',
                borderRadius: 10,
                padding: 20,
                alignItems: 'center',
                borderWidth: 2,
                borderColor: '#E5E7EB',
                borderStyle: 'dashed'
              }}>
                <Text style={{ fontSize: 16, color: '#6B7280', textAlign: 'center' }}>
                  Belum ada device yang dipilih
                </Text>
              </View>
            )}
          </View>
          
          {/* Save Button */}
          <TouchableOpacity
            style={{
              padding: 15,
              borderRadius: 12,
              backgroundColor: loading ? colors.primary + '80' : colors.primary,
              marginTop: 20,
              alignItems: 'center'
            }}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
              {loading ? 'Menyimpan...' : 'Simpan Data Service'}
            </Text>
          </TouchableOpacity>
          
          {/* Summary */}
          <View style={{
            marginTop: 15,
            padding: 15,
            backgroundColor: '#F0F9FF',
            borderRadius: 10
          }}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.primary, marginBottom: 8 }}>
              Ringkasan:
            </Text>
            <Text style={{ fontSize: 12, color: '#0369A1', marginBottom: 4 }}>
              • Device terpilih: {getDeviceCount()} item
            </Text>
            <Text style={{ fontSize: 12, color: '#0369A1' }}>
              • Total biaya: {formatCurrency(formData.totalHarga)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
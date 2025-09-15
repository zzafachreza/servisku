import React, {useEffect, useState, useCallback} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import {Icon} from 'react-native-elements';
import {Color, colors} from '../../utils/colors';
import {fonts} from '../../utils/fonts';
import MyInput from '../MyInput';

const MyPicker = ({
  label = '',
  iconname = '',
  onChangeText = null,
  onValueChange = null,
  value = '',
  data = [],
  placeholder = 'Silahkan pilih',
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dataList, setDataList] = useState([]);
  const [searchText, setSearchText] = useState('');

  // Validate and process data
  const processData = useCallback(rawData => {
    try {
      if (!Array.isArray(rawData)) return [];

      return rawData.filter(item => {
        return (
          item &&
          typeof item === 'object' &&
          item.label !== undefined &&
          item.label !== null &&
          item.label !== '' &&
          item.value !== undefined &&
          item.value !== null
        );
      });
    } catch (error) {
      console.warn('MyPicker: Error processing data', error);
      return [];
    }
  }, []);

  // Initialize data
  useEffect(() => {
    const validData = processData(data);
    setDataList(validData);
    setSearchText('');
  }, [data, processData]);

  // Update selected item when value changes
  useEffect(() => {
    try {
      if (
        (!value && value !== 0) ||
        !Array.isArray(dataList) ||
        dataList.length === 0
      ) {
        setSelectedItem(null);
        return;
      }

      const foundItem = dataList.find(item => {
        try {
          return String(item.value) === String(value);
        } catch (error) {
          return false;
        }
      });

      setSelectedItem(foundItem || null);
    } catch (error) {
      console.warn('MyPicker: Error updating selected item', error);
      setSelectedItem(null);
    }
  }, [value, dataList]);

  // Handle item selection
  const handleItemPress = useCallback(
    item => {
      try {
        if (!item || (!item.value && item.value !== 0)) return;

        setSelectedItem(item);

        if (typeof onChangeText === 'function') {
          onChangeText(item.value);
        }

        if (typeof onValueChange === 'function') {
          onValueChange(item.value);
        }

        setModalVisible(false);
        setSearchText('');
        setDataList(processData(data));
      } catch (error) {
        console.warn('MyPicker: Error handling item press', error);
      }
    },
    [onChangeText, onValueChange, data, processData],
  );

  // Render item
  const renderItem = useCallback(
    ({item, index}) => {
      try {
        if (!item || !item.label) return null;

        return (
          <TouchableOpacity
            key={item.value || index}
            style={styles.itemContainer}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.7}>
            <Text style={styles.itemText} numberOfLines={2}>
              {String(item.label)}
            </Text>
          </TouchableOpacity>
        );
      } catch (error) {
        console.warn('MyPicker: Error rendering item', error);
        return null;
      }
    },
    [handleItemPress],
  );

  // Handle search
  const handleSearch = useCallback(
    searchValue => {
      try {
        const searchStr = String(searchValue || '').toLowerCase();
        setSearchText(searchValue || '');

        if (!searchStr) {
          setDataList(processData(data));
          return;
        }

        const filtered = processData(data).filter(item => {
          try {
            return String(item.label).toLowerCase().includes(searchStr);
          } catch (error) {
            return false;
          }
        });

        setDataList(filtered);
      } catch (error) {
        console.warn('MyPicker: Error filtering data', error);
        setDataList(processData(data));
      }
    },
    [data, processData],
  );

  // Modal handlers
  const openModal = useCallback(() => {
    try {
      setModalVisible(true);
      setDataList(processData(data));
      setSearchText('');
    } catch (error) {
      console.warn('MyPicker: Error opening modal', error);
    }
  }, [data, processData]);

  const closeModal = useCallback(() => {
    try {
      setModalVisible(false);
      setSearchText('');
      setDataList(processData(data));
    } catch (error) {
      console.warn('MyPicker: Error closing modal', error);
    }
  }, [data, processData]);

  // Get display text
  const getDisplayText = () => {
    try {
      if (selectedItem && selectedItem.label) {
        return String(selectedItem.label);
      }

      if (!value && value !== 0 && Array.isArray(data) && data.length > 0) {
        const foundItem = data.find(item => {
          try {
            return String(item.value) === String(value);
          } catch (error) {
            return false;
          }
        });

        if (foundItem && foundItem.label) {
          return String(foundItem.label);
        }
      }

      return String(placeholder);
    } catch (error) {
      console.warn('MyPicker: Error getting display text', error);
      return String(placeholder);
    }
  };

  const displayText = getDisplayText();
  const isPlaceholder = displayText === String(placeholder);

  // Key extractor for FlatList
  const keyExtractor = useCallback((item, index) => {
    try {
      if (item && item.value !== undefined && item.value !== null) {
        return `item_${String(item.value)}`;
      }
      return `index_${index}`;
    } catch (error) {
      return `fallback_${index}`;
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Label */}
      {label ? <Text style={styles.labelText}>{String(label)}</Text> : null}

      {/* Picker Button */}
      <TouchableOpacity
        style={styles.pickerContainer}
        onPress={openModal}
        activeOpacity={0.7}>
        {/* Left Icon */}
        {iconname ? (
          <View style={styles.iconContainer}>
            <Icon
              type="ionicon"
              name={iconname}
              color={Color.blueGray[300]}
              size={24}
            />
          </View>
        ) : null}

        {/* Display Text */}
        <Text
          style={[
            styles.selectedText,
            isPlaceholder && styles.placeholderText,
            !iconname && styles.selectedTextNoIcon,
          ]}
          numberOfLines={1}>
          {displayText}
        </Text>

        {/* Dropdown Icon */}
        <View style={styles.iconContainer}>
          <Icon
            type="ionicon"
            name="caret-down-outline"
            color={Color.blueGray[300]}
            size={24}
          />
        </View>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
        animationType="slide">
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {`Pilih ${label || 'Item'}`}
                  </Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={closeModal}
                    activeOpacity={0.7}>
                    <Icon
                      type="ionicon"
                      name="close"
                      color={colors.primary}
                      size={24}
                    />
                  </TouchableOpacity>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                  <MyInput
                    nolabel={true}
                    placeholder="Pencarian..."
                    value={searchText}
                    onChangeText={handleSearch}
                  />
                </View>

                {/* List */}
                {Array.isArray(dataList) && dataList.length > 0 ? (
                  <FlatList
                    data={dataList}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    style={styles.flatList}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => (
                      <View style={styles.separator} />
                    )}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={10}
                    windowSize={10}
                  />
                ) : (
                  <View style={styles.emptyContainer}>
                    <Icon
                      type="ionicon"
                      name="search-outline"
                      color={Color.blueGray[300]}
                      size={48}
                    />
                    <Text style={styles.emptyText}>
                      {searchText
                        ? 'Tidak ada hasil pencarian'
                        : 'Tidak ada data tersedia'}
                    </Text>
                    {searchText ? (
                      <TouchableOpacity
                        style={styles.clearSearchButton}
                        onPress={() => handleSearch('')}
                        activeOpacity={0.7}>
                        <Text style={styles.clearSearchText}>
                          Hapus Pencarian
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  labelText: {
    fontFamily: fonts.secondary[600],
    fontSize: 12,
    color: colors.black,
    marginBottom: 4,
    marginVertical: 10,
    marginLeft: 4,
  },
  pickerContainer: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: Color.blueGray[300],
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 30,
    alignItems: 'center',
  },
  selectedText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 26,
    fontFamily: fonts.secondary[600],
    color: colors.black,
    textAlign: 'left',
    marginHorizontal: 10,
  },
  selectedTextNoIcon: {
    marginLeft: 0,
  },
  placeholderText: {
    color: Color.blueGray[400],
    fontFamily: fonts.secondary[400],
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: 15,
    width: '90%',
    maxHeight: '70%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Color.blueGray[100],
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fonts.primary[600],
    color: colors.primary,
  },
  closeButton: {
    padding: 5,
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  flatList: {
    paddingHorizontal: 10,
  },
  itemContainer: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: colors.white,
  },
  itemText: {
    fontSize: 14,
    fontFamily: fonts.primary[500],
    color: colors.black,
    lineHeight: 20,
  },
  separator: {
    height: 1,
    backgroundColor: Color.blueGray[100],
    marginHorizontal: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.primary[400],
    color: Color.blueGray[400],
    textAlign: 'center',
    marginTop: 10,
  },
  clearSearchButton: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  clearSearchText: {
    fontSize: 12,
    fontFamily: fonts.primary[500],
    color: colors.white,
  },
});

export default MyPicker;

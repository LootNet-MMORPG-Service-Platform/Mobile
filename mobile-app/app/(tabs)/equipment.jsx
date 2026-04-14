import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import authService from '../../services/authService';

export default function EquipmentScreen() {
  const [equipment, setEquipment] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const categories = ['all', 'weapon', 'armor', 'helmet', 'shield', 'boots', 'accessory'];

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    setIsLoading(true);
    try {
      const result = await authService.getEquipment();
      if (result.success) {
        setEquipment(result.data || []);
      } else {
        Alert.alert('Error', result.error || 'Failed to load equipment');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load equipment');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEquipment = selectedCategory === 'all' 
    ? equipment 
    : equipment.filter(item => {
        if (selectedCategory === 'weapon') {
          return item.weaponType !== undefined;
        } else if (selectedCategory === 'armor') {
          return item.armorType !== undefined;
        }
        return false;
      });

  const getRarityColor = (item) => {
    if (item.weaponType) {
      return '#8B7355';
    } else if (item.armorType) {
      return '#4169E1';
    }
    return '#666666';
  };

  const getRarityBorder = (item) => {
    const color = getRarityColor(item);
    return color.replace('#', '#654321');
  };

  const getWeaponTypeDisplay = (weaponType) => {
    const types = {
      'Sword': 'Sword',
      'Axe': 'Axe', 
      'Spear': 'Spear',
      'Mace': 'Mace'
    };
    return types[weaponType] || 'Unknown';
  };

  const getArmorTypeDisplay = (armorType) => {
    const types = {
      1: 'Light Armor',
      2: 'Medium Armor', 
      3: 'Heavy Armor'
    };
    return types[armorType] || 'Unknown';
  };

  const renderEquipmentItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.itemContainer, { borderColor: getRarityBorder(item) }]}
      onPress={() => setSelectedItem(item)}
    >
      <View style={styles.itemIcon}>
        <IconSymbol 
          name={item.weaponType ? 'sword' : 'shield'} 
          size={32} 
          color={getRarityColor(item)} 
        />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={[styles.itemType, { color: getRarityColor(item) }]}>
          {item.weaponType ? getWeaponTypeDisplay(item.weaponType) : getArmorTypeDisplay(item.armorType)}
        </Text>
      </View>
      <View style={styles.itemStats}>
        {item.weaponType && (
          <>
            <Text style={styles.statText}>Cut: {item.cut || 0}</Text>
            <Text style={styles.statText}>Blunt: {item.blunt || 0}</Text>
          </>
        )}
        {item.armorType && (
          <>
            <Text style={styles.statText}>Cut Res: {item.cutResistance || 0}</Text>
            <Text style={styles.statText}>Blunt Res: {item.bluntResistance || 0}</Text>
          </>
        )}
        {item.elements && item.elements.map((element, index) => (
          <Text key={index} style={styles.statText}>Element: {element.type}</Text>
        ))}
      </View>
    </TouchableOpacity>
  );

  const renderEquipmentDetail = () => {
    if (!selectedItem) return null;

    return (
      <View style={styles.detailOverlay}>
        <View style={styles.detailContainer}>
          <View style={styles.detailHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedItem(null)}
            >
              <IconSymbol name="xmark" size={24} color="#8B7355" />
            </TouchableOpacity>
            <Text style={styles.detailTitle}>{selectedItem.name}</Text>
          </View>

          <ScrollView style={styles.detailContent}>
            <View style={styles.detailIconContainer}>
              <View style={[styles.detailIcon, { backgroundColor: getRarityColor(selectedItem) }]}>
                <IconSymbol 
                  name={selectedItem.weaponType ? 'sword' : 'shield'} 
                  size={64} 
                  color="#fff" 
                />
              </View>
              <Text style={[styles.detailRarity, { color: getRarityColor(selectedItem) }]}>
                {selectedItem.weaponType ? getWeaponTypeDisplay(selectedItem.weaponType) : getArmorTypeDisplay(selectedItem.armorType)}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Properties</Text>
              <Text style={styles.descriptionText}>
                Category: {selectedItem.category}
              </Text>
              {selectedItem.weaponType && (
                <Text style={styles.descriptionText}>
                  Weapon Type: {getWeaponTypeDisplay(selectedItem.weaponType)}
                </Text>
              )}
              {selectedItem.armorType && (
                <Text style={styles.descriptionText}>
                  Armor Type: {getArmorTypeDisplay(selectedItem.armorType)}
                </Text>
              )}
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Statistics</Text>
              {selectedItem.weaponType && (
                <>
                  <View style={styles.detailStatRow}>
                    <Text style={styles.statName}>Cut Damage</Text>
                    <Text style={styles.statValue}>{selectedItem.cut || 0}</Text>
                  </View>
                  <View style={styles.detailStatRow}>
                    <Text style={styles.statName}>Blunt Damage</Text>
                    <Text style={styles.statValue}>{selectedItem.blunt || 0}</Text>
                  </View>
                </>
              )}
              {selectedItem.armorType && (
                <>
                  <View style={styles.detailStatRow}>
                    <Text style={styles.statName}>Cut Resistance</Text>
                    <Text style={styles.statValue}>{selectedItem.cutResistance || 0}</Text>
                  </View>
                  <View style={styles.detailStatRow}>
                    <Text style={styles.statName}>Blunt Resistance</Text>
                    <Text style={styles.statValue}>{selectedItem.bluntResistance || 0}</Text>
                  </View>
                </>
              )}
              {selectedItem.elements && selectedItem.elements.map((element, index) => (
                <View key={index} style={styles.detailStatRow}>
                  <Text style={styles.statName}>Element</Text>
                  <Text style={styles.statValue}>{element.type}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Equipment Inventory</Text>
        <Text style={styles.headerSubtitle}>Browse your war gear</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === category && styles.categoryButtonTextActive,
            ]}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.equipmentList}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading equipment...</Text>
          </View>
        ) : (
          filteredEquipment.map(renderEquipmentItem)
        )}
      </ScrollView>

      {renderEquipmentDetail()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C1810',
  },
  header: {
    backgroundColor: '#1A0E08',
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#8B7355',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F4E4C1',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#A0826D',
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  },
  categoryScroll: {
    backgroundColor: '#1A0E08',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#8B7355',
  },
  categoryButton: {
    backgroundColor: '#3E2723',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#8B7355',
  },
  categoryButtonActive: {
    backgroundColor: '#8B7355',
    borderColor: '#F4E4C1',
  },
  categoryButtonText: {
    color: '#A0826D',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  categoryButtonTextActive: {
    color: '#F4E4C1',
  },
  equipmentList: {
    flex: 1,
    padding: 10,
  },
  itemContainer: {
    backgroundColor: '#3E2723',
    borderWidth: 2,
    borderRadius: 8,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  itemIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#2C1810',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8B7355',
    marginRight: 15,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F4E4C1',
    marginBottom: 4,
  },
  itemType: {
    fontSize: 12,
    color: '#A0826D',
    fontStyle: 'italic',
  },
  itemStats: {
    alignItems: 'flex-start',
  },
  statText: {
    fontSize: 11,
    color: '#F4E4C1',
    marginBottom: 2,
  },
  detailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 14, 8, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContainer: {
    backgroundColor: '#2C1810',
    margin: 20,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#8B7355',
    maxHeight: '80%',
    width: '90%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#8B7355',
    backgroundColor: '#1A0E08',
  },
  closeButton: {
    padding: 5,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F4E4C1',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  detailContent: {
    padding: 20,
  },
  detailIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  detailIcon: {
    width: 100,
    height: 100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  detailRarity: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  detailSection: {
    marginBottom: 20,
    backgroundColor: '#1A0E08',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B7355',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F4E4C1',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#8B7355',
    paddingBottom: 5,
  },
  descriptionText: {
    fontSize: 14,
    color: '#A0826D',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  detailStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#3E2723',
  },
  statName: {
    fontSize: 14,
    color: '#F4E4C1',
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#F4E4C1',
  },
});

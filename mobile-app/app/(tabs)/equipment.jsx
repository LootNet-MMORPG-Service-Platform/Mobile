import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import api from '../../services/api';

export default function EquipmentScreen() {
  const [equipment, setEquipment] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const categories = ['all', 'weapon', 'armor', 'helmet', 'shield', 'boots', 'accessory'];

  const mockEquipment = {
    weapon: [
      {
        id: 1,
        name: 'War Sword',
        type: 'weapon',
        rarity: 'common',
        icon: 'sword',
        damage: 25,
        speed: 1.2,
        description: 'A sturdy sword forged in the northern lands.',
        stats: { 'Attack': 25, 'Speed': 1.2 },
        requirements: { 'Strength': 15, 'Level': 5 },
      },
      {
        id: 2,
        name: 'Battle Axe',
        type: 'weapon',
        rarity: 'rare',
        icon: 'axe',
        damage: 35,
        speed: 0.9,
        description: 'Heavy axe favored by Nord warriors.',
        stats: { 'Attack': 35, 'Speed': 0.9 },
        requirements: { 'Strength': 25, 'Level': 10 },
      },
      {
        id: 3,
        name: 'Longbow',
        type: 'weapon',
        rarity: 'epic',
        icon: 'bow',
        damage: 40,
        range: 150,
        description: 'Masterfully crafted bow for ranged combat.',
        stats: { 'Attack': 40, 'Range': 150 },
        requirements: { 'Dexterity': 20, 'Level': 15 },
      },
    ],
    armor: [
      {
        id: 4,
        name: 'Chain Mail',
        type: 'armor',
        rarity: 'common',
        icon: 'shield',
        defense: 20,
        description: 'Basic chain mail armor.',
        stats: { 'Defense': 20 },
        requirements: { 'Level': 3 },
      },
      {
        id: 5,
        name: 'Plate Armor',
        type: 'armor',
        rarity: 'rare',
        icon: 'shield',
        defense: 45,
        description: 'Heavy plate armor for elite warriors.',
        stats: { 'Defense': 45 },
        requirements: { 'Strength': 30, 'Level': 12 },
      },
    ],
  };

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    setIsLoading(true);
    try {
      // Use mock data for now since API is empty
      const allItems = Object.values(mockEquipment).flat();
      setEquipment(allItems);
    } catch (error) {
      Alert.alert('Error', 'Failed to load equipment');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEquipment = selectedCategory === 'all' 
    ? equipment 
    : equipment.filter(item => item.type === selectedCategory);

  const getRarityColor = (rarity) => {
    const colors = {
      common: '#8B7355', // brown
      uncommon: '#1E90FF', // blue
      rare: '#9370DB', // purple
      epic: '#FF8C00', // orange
      legendary: '#FFD700', // gold
    };
    return colors[rarity] || '#8B7355';
  };

  const getRarityBorder = (rarity) => {
    const borders = {
      common: '#654321',
      uncommon: '#4169E1',
      rare: '#6A0DAD',
      epic: '#CC5500',
      legendary: '#B8860B',
    };
    return borders[rarity] || '#654321';
  };

  const renderEquipmentItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.itemContainer, { borderColor: getRarityBorder(item.rarity) }]}
      onPress={() => setSelectedItem(item)}
    >
      <View style={styles.itemIcon}>
        <IconSymbol name={item.icon || 'cube'} size={32} color={getRarityColor(item.rarity)} />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={[styles.itemRarity, { color: getRarityColor(item.rarity) }]}>
          {item.rarity.toUpperCase()}
        </Text>
        <Text style={styles.itemType}>{item.type}</Text>
      </View>
      <View style={styles.itemStats}>
        {Object.entries(item.stats).map(([stat, value]) => (
          <Text key={stat} style={styles.statText}>
            {stat}: {value}
          </Text>
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
              <View style={[styles.detailIcon, { backgroundColor: getRarityColor(selectedItem.rarity) }]}>
                <IconSymbol name={selectedItem.icon || 'cube'} size={64} color="#fff" />
              </View>
              <Text style={[styles.detailRarity, { color: getRarityColor(selectedItem.rarity) }]}>
                {selectedItem.rarity.toUpperCase()}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{selectedItem.description || 'No description available'}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Statistics</Text>
              {selectedItem.stats && Object.entries(selectedItem.stats).map(([stat, value]) => (
                <View key={stat} style={styles.detailStatRow}>
                  <Text style={styles.statName}>{stat}</Text>
                  <Text style={styles.statValue}>+{value}</Text>
                </View>
              ))}
            </View>

            {selectedItem.requirements && (
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Requirements</Text>
                {Object.entries(selectedItem.requirements).map(([req, value]) => (
                  <View key={req} style={styles.requirementRow}>
                    <Text style={styles.requirementText}>{req}: {value}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Properties</Text>
              <View style={styles.propertyRow}>
                <Text style={styles.propertyLabel}>Type:</Text>
                <Text style={styles.propertyValue}>{selectedItem.type}</Text>
              </View>
              <View style={styles.propertyRow}>
                <Text style={styles.propertyLabel}>Category:</Text>
                <Text style={styles.propertyValue}>{selectedItem.type}</Text>
              </View>
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
    backgroundColor: '#2C1810', // Dark medieval brown background
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
    color: '#F4E4C1', // Parchment color
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
  itemRarity: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
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
  requirementRow: {
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#3E2723',
  },
  requirementText: {
    fontSize: 14,
    color: '#FF9800',
  },
  propertyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#3E2723',
  },
  propertyLabel: {
    fontSize: 14,
    color: '#A0826D',
  },
  propertyValue: {
    fontSize: 14,
    color: '#F4E4C1',
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

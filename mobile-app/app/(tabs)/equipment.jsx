import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import api from '../../services/api';

export default function EquipmentScreen() {
  const [equipment, setEquipment] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const response = await api.getEquipment();
      setEquipment(response.equipment || []);
    } catch (error) {
      console.error('Error loading equipment:', error);
      Alert.alert('Error', 'Failed to load equipment');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEquipment();
    setRefreshing(false);
  };

  const categories = [
    { id: 'all', name: 'All', icon: 'grid' },
    { id: 'weapon', name: 'Weapons', icon: 'gamecontroller' },
    { id: 'armor', name: 'Armor', icon: 'shield' },
    { id: 'accessory', name: 'Accessories', icon: 'star' },
  ];

  const getRarityColor = (rarity) => {
    switch (rarity?.toLowerCase()) {
      case 'common':
        return '#9E9E9E';
      case 'uncommon':
        return '#4CAF50';
      case 'rare':
        return '#2196F3';
      case 'epic':
        return '#9C27B0';
      case 'legendary':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const filteredEquipment = selectedCategory === 'all' 
    ? equipment 
    : equipment.filter(item => item.category === selectedCategory);

  const renderEquipmentItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.equipmentItem}
      onPress={() => setSelectedItem(item)}
    >
      <View style={styles.itemHeader}>
        <View style={[styles.itemIcon, { backgroundColor: getRarityColor(item.rarity) }]}>
          <IconSymbol name={item.icon || 'cube'} size={24} color="#fff" />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemType}>{item.type}</Text>
        </View>
        <View style={styles.itemRarity}>
          <Text style={[styles.rarityText, { color: getRarityColor(item.rarity) }]}>
            {item.rarity}
          </Text>
        </View>
      </View>
      
      <View style={styles.itemStats}>
        {item.stats && Object.entries(item.stats).map(([stat, value]) => (
          <View key={stat} style={styles.statRow}>
            <IconSymbol name="arrow.up" size={12} color="#4CAF50" />
            <Text style={styles.statText}>
              {stat}: +{value}
            </Text>
          </View>
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
              <IconSymbol name="xmark" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.detailTitle}>{selectedItem.name}</Text>
          </View>

          <ScrollView style={styles.detailContent}>
            <View style={styles.detailIconContainer}>
              <View style={[styles.detailIcon, { backgroundColor: getRarityColor(selectedItem.rarity) }]}>
                <IconSymbol name={selectedItem.icon || 'cube'} size={48} color="#fff" />
              </View>
              <Text style={[styles.detailRarity, { color: getRarityColor(selectedItem.rarity) }]}>
                {selectedItem.rarity}
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
                <Text style={styles.propertyValue}>{selectedItem.category}</Text>
              </View>
              <View style={styles.propertyRow}>
                <Text style={styles.propertyLabel}>Level:</Text>
                <Text style={styles.propertyValue}>{selectedItem.level || 1}</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Equipment</Text>
          <Text style={styles.subtitle}>
            Manage your character's gear and items
          </Text>
        </View>

        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <IconSymbol
                  name={category.icon}
                  size={20}
                  color={selectedCategory === category.id ? '#fff' : '#666'}
                />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.categoryTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.equipmentList}>
          {filteredEquipment.length > 0 ? (
            filteredEquipment.map(renderEquipmentItem)
          ) : (
            <View style={styles.emptyContainer}>
              <IconSymbol name="cube.box" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No equipment found</Text>
              <Text style={styles.emptySubtext}>
                Start acquiring gear to see it here
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {renderEquipmentDetail()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
  },
  equipmentList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  equipmentItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 15,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemType: {
    fontSize: 14,
    color: '#666',
  },
  itemRarity: {
    alignItems: 'flex-end',
  },
  rarityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  statText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#333',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  detailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 5,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 15,
    flex: 1,
  },
  detailContent: {
    padding: 20,
  },
  detailIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  detailIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailRarity: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  detailStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  statName: {
    fontSize: 14,
    color: '#333',
  },
  statValue: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  requirementRow: {
    paddingVertical: 3,
  },
  requirementText: {
    fontSize: 14,
    color: '#666',
  },
  propertyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  propertyLabel: {
    fontSize: 14,
    color: '#666',
  },
  propertyValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
});

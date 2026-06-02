import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useFocusEffect } from '@react-navigation/native';
import authService from '../../services/authService';

const CATEGORY_OPTIONS = [
  { label: 'All', value: null },
  { label: 'Weapons', value: 'Weapon' },
  { label: 'Armor', value: 'Armor' },
];

const SORT_OPTIONS = [
  { label: 'Low', value: 'asc' },
  { label: 'High', value: 'desc' },
];

const getItemCategory = (item) => {
  if (item?.weaponType !== undefined) return 'Weapon';
  if (item?.armorType !== undefined) return 'Armor';
  return item?.category === 0 ? 'Weapon' : item?.category === 1 ? 'Armor' : item?.category;
};

const formatCategory = (category) => {
  return normalizeCategory(category) || 'Item';
};

const normalizeCategory = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const raw = String(value).toLowerCase();
  if (value === 0 || raw === '0' || raw === 'weapon' || raw === 'weapons') return 'Weapon';
  if (value === 1 || raw === '1' || raw === 'armor' || raw === 'armors') return 'Armor';
  return String(value);
};

const listingMatchesCategory = (listing, selectedCategory) => {
  const normalized = normalizeCategory(selectedCategory);
  if (!normalized) return true;
  return normalizeCategory(listing?.category) === normalized;
};

const mergeListings = (items = []) => {
  const seen = new Set();
  return items.filter((listing) => {
    const key = listing?.id || listing?.itemId;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export default function MarketScreen() {
  const [activeMode, setActiveMode] = useState('buy');
  const [category, setCategory] = useState(null);
  const [sort, setSort] = useState('asc');
  const [listings, setListings] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const selectedItem = useMemo(
    () => equipment.find((item) => item.id === selectedItemId),
    [equipment, selectedItemId],
  );

  const loadMarket = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const [listingResult, equipmentResult] = await Promise.all([
        authService.getMarketListings(category, 1, 30, sort),
        authService.getInventory('inventory'),
      ]);

      if (listingResult.success) {
        setListings(mergeListings(listingResult.data || []));
      } else {
        setLoadError(listingResult.error || 'Failed to load listings');
      }

      if (equipmentResult.success) {
        const nextEquipment = equipmentResult.data || [];
        setEquipment(nextEquipment);
        setSelectedItemId((currentId) =>
          nextEquipment.some((item) => item.id === currentId) ? currentId : null,
        );
      } else {
        setEquipment([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [category, sort]);

  useFocusEffect(
    useCallback(() => {
      loadMarket();
    }, [loadMarket]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMarket();
    setRefreshing(false);
  };

  const handleBuy = (listing) => {
    Alert.alert(
      'Buy Item',
      `Buy ${listing.itemName || 'this item'} for ${listing.price} currency?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: async () => {
            setIsSubmitting(true);
            const result = await authService.buyMarketItem(listing.id);
            setIsSubmitting(false);

            if (result.success) {
              Alert.alert('Purchased', 'The item was added to your equipment.');
              await loadMarket();
            } else {
              Alert.alert('Purchase Failed', result.error || 'Unable to buy this item');
            }
          },
        },
      ],
    );
  };

  const handleSell = async () => {
    const numericPrice = Number(price);

    if (!selectedItemId) {
      Alert.alert('Choose Item', 'Select an item from your equipment first.');
      return;
    }

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      Alert.alert('Invalid Price', 'Enter a price greater than zero.');
      return;
    }

    setIsSubmitting(true);
    const result = await authService.createMarketListing(selectedItemId, numericPrice);
    setIsSubmitting(false);

    if (result.success) {
      Alert.alert('Listed', `${selectedItem?.name || 'Item'} is now listed on the market.`);
      const createdListing = result.data || {
        id: `listed-${selectedItemId}`,
        itemId: selectedItemId,
        itemName: selectedItem?.name || 'Listed item',
        price: numericPrice,
        category: getItemCategory(selectedItem),
      };
      setListings((current) => mergeListings([createdListing, ...current]));
      setEquipment((current) => current.filter((item) => item.id !== selectedItemId));
      setSelectedItemId(null);
      setPrice('');
      setActiveMode('buy');
      setCategory(null);
    } else {
      Alert.alert('Listing Failed', result.error || 'Unable to list this item');
    }
  };

  const visibleListings = useMemo(
    () =>
      listings
        .filter((listing) => listingMatchesCategory(listing, category))
        .sort((a, b) =>
          sort === 'desc' ? Number(b.price) - Number(a.price) : Number(a.price) - Number(b.price),
        ),
    [listings, category, sort],
  );

  const renderListing = (listing) => (
    <View key={listing.id} style={styles.listing}>
      <View style={styles.listingIcon}>
        <IconSymbol
          name={formatCategory(listing.category) === 'Weapon' ? 'sword' : 'shield'}
          size={28}
          color="#D6A84F"
        />
      </View>
      <View style={styles.listingBody}>
        <Text style={styles.listingName}>{listing.itemName || 'Unknown Item'}</Text>
        <Text style={styles.listingMeta}>{formatCategory(listing.category)}</Text>
      </View>
      <View style={styles.listingAction}>
        <Text style={styles.price}>{listing.price}</Text>
        <TouchableOpacity
          style={[styles.smallButton, isSubmitting && styles.buttonDisabled]}
          onPress={() => handleBuy(listing)}
          disabled={isSubmitting}
        >
          <Text style={styles.smallButtonText}>Buy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSellItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.sellItem, selectedItemId === item.id && styles.sellItemSelected]}
      onPress={() => setSelectedItemId(item.id)}
    >
      <IconSymbol
        name={getItemCategory(item) === 'Weapon' ? 'sword' : 'shield'}
        size={24}
        color={selectedItemId === item.id ? '#2C1810' : '#D6A84F'}
      />
      <View style={styles.sellItemBody}>
        <Text
          style={[styles.sellItemName, selectedItemId === item.id && styles.sellItemNameSelected]}
        >
          {item.name}
        </Text>
        <Text
          style={[styles.sellItemMeta, selectedItemId === item.id && styles.sellItemMetaSelected]}
        >
          {getItemCategory(item)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F4E4C1" />
      }
    >
      <View style={styles.header}>
        <IconSymbol name="store" size={42} color="#D6A84F" />
        <Text style={styles.title}>Marketplace</Text>
        <Text style={styles.subtitle}>Buy and sell player gear.</Text>
      </View>

      <View style={styles.modeSwitch}>
        <TouchableOpacity
          style={[styles.modeButton, activeMode === 'buy' && styles.modeButtonActive]}
          onPress={() => setActiveMode('buy')}
        >
          <Text
            style={[styles.modeButtonText, activeMode === 'buy' && styles.modeButtonTextActive]}
          >
            Buy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, activeMode === 'sell' && styles.modeButtonActive]}
          onPress={() => setActiveMode('sell')}
        >
          <Text
            style={[styles.modeButtonText, activeMode === 'sell' && styles.modeButtonTextActive]}
          >
            Sell
          </Text>
        </TouchableOpacity>
      </View>

      {activeMode === 'buy' ? (
        <>
          <View style={styles.filterRow}>
            {CATEGORY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.label}
                style={[
                  styles.filterButton,
                  category === option.value && styles.filterButtonActive,
                ]}
                onPress={() => setCategory(option.value)}
              >
                <Text
                  style={[styles.filterText, category === option.value && styles.filterTextActive]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterRow}>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.filterButton, sort === option.value && styles.filterButtonActive]}
                onPress={() => setSort(option.value)}
              >
                <Text style={[styles.filterText, sort === option.value && styles.filterTextActive]}>
                  {option.label} Price
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Listings</Text>
            {isLoading ? (
              <Text style={styles.emptyText}>Loading listings...</Text>
            ) : loadError ? (
              <Text style={styles.errorText}>{loadError}</Text>
            ) : visibleListings.length > 0 ? (
              visibleListings.map(renderListing)
            ) : (
              <Text style={styles.emptyText}>No active listings found.</Text>
            )}
          </View>
        </>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Equipment</Text>
          {equipment.length > 0 ? (
            equipment.map(renderSellItem)
          ) : (
            <Text style={styles.emptyText}>Claim a daily reward before listing items.</Text>
          )}

          <View style={styles.priceInputRow}>
            <IconSymbol name="payments" size={22} color="#D6A84F" />
            <TextInput
              style={styles.priceInput}
              placeholder="Listing price"
              placeholderTextColor="#D7C0A5"
              keyboardType="decimal-pad"
              value={price}
              onChangeText={setPrice}
            />
          </View>

          <TouchableOpacity
            style={[styles.sellButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleSell}
            disabled={isSubmitting}
          >
            <IconSymbol name="sell" size={20} color="#F4E4C1" />
            <Text style={styles.sellButtonText}>{isSubmitting ? 'Listing...' : 'List Item'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C1810',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#1A0E08',
    borderBottomWidth: 2,
    borderBottomColor: '#8B7355',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Lato_700Bold',
    color: '#F4E4C1',
    marginTop: 10,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    color: '#A0826D',
    textAlign: 'center',
    marginTop: 6,
  },
  modeSwitch: {
    flexDirection: 'row',
    margin: 20,
    borderWidth: 1,
    borderColor: '#8B7355',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#3E2723',
  },
  modeButtonActive: {
    backgroundColor: '#D6A84F',
  },
  modeButtonText: {
    color: '#D7C0A5',
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    fontWeight: 'bold',
  },
  modeButtonTextActive: {
    color: '#2C1810',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#3E2723',
    borderWidth: 1,
    borderColor: '#8B7355',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#8B7355',
  },
  filterText: {
    color: '#D7C0A5',
    fontSize: 14,
    fontFamily: 'Lato_700Bold',
    fontWeight: 'bold',
  },
  filterTextActive: {
    color: '#F4E4C1',
  },
  section: {
    margin: 20,
    marginTop: 10,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#F4E4C1',
    fontFamily: 'Lato_700Bold',
    fontWeight: 'bold',
  },
  listing: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3E2723',
    borderWidth: 1,
    borderColor: '#8B7355',
    borderRadius: 8,
    padding: 14,
  },
  listingIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C1810',
    marginRight: 12,
  },
  listingBody: {
    flex: 1,
  },
  listingName: {
    color: '#F4E4C1',
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    fontWeight: 'bold',
  },
  listingMeta: {
    color: '#D7C0A5',
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    marginTop: 3,
  },
  listingAction: {
    alignItems: 'flex-end',
    gap: 8,
  },
  price: {
    color: '#D6A84F',
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    fontWeight: 'bold',
  },
  smallButton: {
    backgroundColor: '#8B7355',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  smallButtonText: {
    color: '#F4E4C1',
    fontWeight: 'bold',
  },
  sellItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3E2723',
    borderWidth: 1,
    borderColor: '#8B7355',
    borderRadius: 8,
    padding: 14,
  },
  sellItemSelected: {
    backgroundColor: '#D6A84F',
    borderColor: '#F4E4C1',
  },
  sellItemBody: {
    marginLeft: 12,
    flex: 1,
  },
  sellItemName: {
    color: '#F4E4C1',
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    fontWeight: 'bold',
  },
  sellItemNameSelected: {
    color: '#2C1810',
  },
  sellItemMeta: {
    color: '#D7C0A5',
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    marginTop: 3,
  },
  sellItemMetaSelected: {
    color: '#3E2723',
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3E2723',
    borderWidth: 1,
    borderColor: '#8B7355',
    borderRadius: 8,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  priceInput: {
    flex: 1,
    color: '#F4E4C1',
    height: 48,
    fontSize: 17,
    fontFamily: 'Lato_400Regular',
    marginLeft: 10,
  },
  sellButton: {
    height: 52,
    borderRadius: 8,
    backgroundColor: '#8B7355',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  sellButtonText: {
    color: '#F4E4C1',
    fontSize: 18,
    fontFamily: 'Lato_700Bold',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  emptyText: {
    color: '#D7C0A5',
    fontSize: 16,
    fontFamily: 'Lato_400Regular',
    lineHeight: 22,
  },
  errorText: {
    color: '#F6A96B',
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
    lineHeight: 21,
  },
});

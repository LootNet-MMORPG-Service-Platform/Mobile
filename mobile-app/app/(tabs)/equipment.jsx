import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import authService from '../../services/authService';

const MENU = [
  { key: 'inventory', label: 'Inventory' },
  { key: 'run', label: 'Adventure Gear' },
  { key: 'market', label: 'Market Listings' },
  { key: 'equipment', label: 'Equipment' },
];

const FILTERS = ['all', 'weapon', 'armor'];
const SLOTS = [1, 2, 3, 4];
const DIFFICULTIES = [
  { key: 'easy', label: 'Scout', description: 'A lighter path with one foe' },
  { key: 'normal', label: 'Warband', description: 'Standard challenge' },
];

const fmt = (v) => Number(v ?? 0).toFixed(1);
const isWeapon = (i) => i?.weaponType !== undefined;

export default function EquipmentScreen() {
  const [view, setView] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [activeRun, setActiveRun] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [runInventory, setRunInventory] = useState([]);
  const [marketInventory, setMarketInventory] = useState([]);
  const [equipPool, setEquipPool] = useState([]);
  const [equipmentSlots, setEquipmentSlots] = useState({});
  const [selectedRunLoadout, setSelectedRunLoadout] = useState([]);
  const [runDifficulty, setRunDifficulty] = useState('easy');
  const [detailItem, setDetailItem] = useState(null);

  const applyFilter = useCallback((arr) => (
    arr.filter((x) => (
      filter === 'all' || (filter === 'weapon' ? isWeapon(x) : !isWeapon(x))
    ))
  ), [filter]);

  const fetchCommon = useCallback(async () => {
    const run = await authService.getActiveRun();
    const runData = run.success ? run.data : null;
    setActiveRun(runData);
    return runData;
  }, []);

  const loadData = useCallback(async () => {
    if (!view) return;
    setLoading(true);
    const runData = await fetchCommon();

    if (view === 'inventory') {
      const inv = await authService.getInventory('inventory');
      setInventory(inv.success ? (inv.data || []) : []);
      if (!inv.success) Alert.alert('Error', inv.error || 'Cannot load inventory');
    } else if (view === 'run') {
      const [inv, runInv] = await Promise.all([
        authService.getInventory('inventory'),
        authService.getInventory('run'),
      ]);
      const invData = inv.success ? (inv.data || []) : [];
      setInventory(invData);
      setRunInventory(runInv.success ? (runInv.data || []) : []);
      if (!inv.success || !runInv.success) Alert.alert('Error', 'Cannot load adventure gear');

      if (!runData) {
        setSelectedRunLoadout((prev) => {
          const valid = new Set(invData.map((x) => x.id));
          return prev.filter((id) => valid.has(id));
        });
      }
    } else if (view === 'market') {
      const market = await authService.getInventory('market');
      setMarketInventory(market.success ? (market.data || []) : []);
      if (!market.success) Alert.alert('Error', market.error || 'Cannot load market inventory');
    } else if (view === 'equipment') {
      const [slots, inv] = await Promise.all([
        authService.getEquipmentSlots(),
        authService.getInventory(runData ? 'run' : 'inventory'),
      ]);
      setEquipmentSlots(slots.success ? (slots.data || {}) : {});
      setEquipPool(inv.success ? (inv.data || []) : []);
      if (!slots.success || !inv.success) Alert.alert('Error', 'Cannot load equipment view');
    }
    setLoading(false);
  }, [view, fetchCommon]);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  const pushToRunLoadout = (itemId) => {
    if (activeRun) return;
    setSelectedRunLoadout((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
  };

  const removeFromRunLoadout = (itemId) => {
    if (activeRun) return;
    setSelectedRunLoadout((prev) => prev.filter((x) => x !== itemId));
  };

  const startRunWithLoadout = async () => {
    if (activeRun) {
      Alert.alert('Run active', 'You already have an active run.');
      return;
    }
    if (!selectedRunLoadout.length) {
      Alert.alert('Run', 'Select adventure gear first.');
      return;
    }
    const result = await authService.startRun(selectedRunLoadout, runDifficulty);
    if (!result.success) {
      Alert.alert('Start failed', result.error || 'Cannot start run');
      return;
    }
    setSelectedRunLoadout([]);
    await loadData();
  };

  const recall = async (itemId) => {
    const res = await authService.returnFromMarket(itemId);
    if (!res.success) {
      Alert.alert('Recall failed', res.error || 'Cannot recall item');
      return;
    }
    loadData();
  };

  const equipArmor = async (itemId) => {
    const res = await authService.equipItem({ id: itemId, armorType: 0 });
    if (!res.success) {
      Alert.alert('Equip failed', res.error || 'Cannot equip armor');
      return;
    }
    loadData();
  };

  const equipWeaponToSlot = async (itemId, slot) => {
    const res = await authService.equipWeaponToSlot(itemId, slot);
    if (!res.success) {
      Alert.alert('Equip failed', res.error || 'Cannot equip weapon');
      return;
    }
    loadData();
  };

  const filteredInventory = useMemo(() => applyFilter(inventory), [inventory, applyFilter]);
  const filteredRun = useMemo(() => applyFilter(runInventory), [runInventory, applyFilter]);
  const filteredMarket = useMemo(() => applyFilter(marketInventory), [marketInventory, applyFilter]);
  const filteredEquipPool = useMemo(() => applyFilter(equipPool), [equipPool, applyFilter]);
  const equippedItemIds = useMemo(() => {
    const ids = new Set();
    Object.values(equipmentSlots || {}).forEach((item) => {
      if (item?.id) ids.add(item.id);
    });
    return ids;
  }, [equipmentSlots]);
  const filteredUnequippedPool = useMemo(
    () => filteredEquipPool.filter((i) => !equippedItemIds.has(i.id)),
    [filteredEquipPool, equippedItemIds]
  );

  const runLoadoutItems = useMemo(() => {
    const byId = new Map(inventory.map((x) => [x.id, x]));
    return selectedRunLoadout.map((id) => byId.get(id)).filter(Boolean);
  }, [selectedRunLoadout, inventory]);

  const inRunLoadout = useMemo(() => new Set(selectedRunLoadout), [selectedRunLoadout]);

  const renderMiniCard = (item, options = {}) => {
    const { showStats = false, extraAction = null } = options;
    return (
      <TouchableOpacity key={item.id} style={styles.miniCard} onPress={() => setDetailItem(item)}>
        <IconSymbol name={isWeapon(item) ? 'sword' : 'shield'} size={22} color="#F4E4C1" />
        {showStats && (
          <Text style={styles.miniStats}>
            {isWeapon(item) ? `C ${fmt(item.cut)} / B ${fmt(item.blunt)}` : `CR ${fmt(item.cutResistance)} / BR ${fmt(item.bluntResistance)}`}
          </Text>
        )}
        {extraAction}
      </TouchableOpacity>
    );
  };

  const showFilters = !!view;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}><Text style={styles.title}>Inventory</Text></View>

      {!view && (
        <View style={styles.menuWrap}>
          {MENU.map((m) => (
            <TouchableOpacity key={m.key} style={styles.menuBtn} onPress={() => setView(m.key)}>
              <Text style={styles.menuTxt}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {view && (
        <>
          <TouchableOpacity style={styles.back} onPress={() => setView(null)}>
            <IconSymbol name="chevron.left" size={16} color="#F4E4C1" />
            <Text style={styles.backTxt}>Back to Menu</Text>
          </TouchableOpacity>

          {showFilters && (
            <View style={styles.filterContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterRowContent}>
                {FILTERS.map((f) => (
                  <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => setFilter(f)}>
                    <Text style={[styles.filterTxt, filter === f && styles.filterTxtActive]}>{f.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {loading && <Text style={styles.helper}>Loading...</Text>}

          {view === 'inventory' && (
            <>
              {activeRun ? (
                <Text style={styles.lockInfo}>Run is active. Selection is locked.</Text>
              ) : (
                <Text style={styles.lockInfo}>Inventory view.</Text>
              )}
              <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                {filteredInventory.map((i) => renderMiniCard(i, {
                  showStats: true,
                }))}
              </ScrollView>
            </>
          )}

          {view === 'run' && (
            <>
              {activeRun ? (
                <Text style={styles.lockInfo}>Run is active. Run inventory editing is blocked.</Text>
              ) : (
                <TouchableOpacity style={styles.startBtn} onPress={startRunWithLoadout}>
                  <Text style={styles.startTxt}>Start Run ({selectedRunLoadout.length} selected)</Text>
                </TouchableOpacity>
              )}

              {!activeRun && (
                <>
                  <Text style={styles.sectionLabel}>Difficulty</Text>
                  <View style={styles.difficultyRow}>
                    {DIFFICULTIES.map((difficulty) => (
                      <TouchableOpacity
                        key={difficulty.key}
                        style={[styles.difficultyBtn, runDifficulty === difficulty.key && styles.difficultyBtnActive]}
                        onPress={() => setRunDifficulty(difficulty.key)}
                      >
                        <Text style={[styles.difficultyTitle, runDifficulty === difficulty.key && styles.difficultyTitleActive]}>
                          {difficulty.label}
                        </Text>
                        <Text style={[styles.difficultyDesc, runDifficulty === difficulty.key && styles.difficultyDescActive]}>
                          {difficulty.description}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.sectionLabel}>Selected Adventure Gear</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList} contentContainerStyle={styles.horizontalListContent}>
                    {runLoadoutItems.map((i) => renderMiniCard(i, {
                      showStats: true,
                      extraAction: (
                        <TouchableOpacity style={styles.actionBtn} onPress={() => removeFromRunLoadout(i.id)}>
                          <Text style={styles.actionTxt}>Remove</Text>
                        </TouchableOpacity>
                      ),
                    }))}
                    {runLoadoutItems.length === 0 && <Text style={styles.helper}>No selected items.</Text>}
                  </ScrollView>

                  <Text style={styles.sectionLabel}>Choose Gear</Text>
                  <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                    {filteredInventory.map((i) => renderMiniCard(i, {
                      showStats: true,
                      extraAction: (
                        <TouchableOpacity
                          style={[styles.actionBtn, inRunLoadout.has(i.id) && styles.actionBtnActive]}
                          onPress={() => pushToRunLoadout(i.id)}
                        >
                          <Text style={styles.actionTxt}>{inRunLoadout.has(i.id) ? 'Added' : 'Take Along'}</Text>
                        </TouchableOpacity>
                      ),
                    }))}
                  </ScrollView>
                </>
              )}

              {activeRun && (
                <>
                  <Text style={styles.sectionLabel}>Adventure Gear</Text>
                  <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                    {filteredRun.map((i) => renderMiniCard(i, { showStats: true }))}
                  </ScrollView>
                </>
              )}
            </>
          )}

          {view === 'market' && (
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {filteredMarket.map((i) => renderMiniCard(i, {
                showStats: true,
                extraAction: (
                  <TouchableOpacity style={styles.actionBtn} onPress={() => recall(i.id)}>
                    <Text style={styles.actionTxt}>Recall</Text>
                  </TouchableOpacity>
                ),
              }))}
            </ScrollView>
          )}

          {view === 'equipment' && (
            <>
              <View style={styles.slotGrid}>
                {SLOTS.map((s) => (
                  <TouchableOpacity
                    key={`w${s}`}
                    style={styles.slotCard}
                    onPress={() => {
                      const item = equipmentSlots[`weapon${s}`] || equipmentSlots[`Weapon${s}`];
                      if (item) setDetailItem(item);
                    }}
                  >
                    <Text style={styles.slotLabel}>Weapon {s}</Text>
                    <Text style={styles.slotValue}>{equipmentSlots[`weapon${s}`]?.name || equipmentSlots[`Weapon${s}`]?.name || 'Empty'}</Text>
                  </TouchableOpacity>
                ))}
                {['head', 'body', 'gloves', 'legs', 'boots'].map((k) => (
                  <TouchableOpacity
                    key={k}
                    style={styles.slotCard}
                    onPress={() => {
                      const key = k.charAt(0).toUpperCase() + k.slice(1);
                      const item = equipmentSlots[k] || equipmentSlots[key];
                      if (item) setDetailItem(item);
                    }}
                  >
                    <Text style={styles.slotLabel}>{k.toUpperCase()}</Text>
                    <Text style={styles.slotValue}>{equipmentSlots[k]?.name || equipmentSlots[k.charAt(0).toUpperCase() + k.slice(1)]?.name || 'Empty'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                {filteredUnequippedPool.map((i) => renderMiniCard(i, {
                  showStats: true,
                  extraAction: isWeapon(i) ? (
                    <View style={styles.slotBtnsRow}>
                      {SLOTS.map((s) => (
                        <TouchableOpacity key={s} style={styles.actionBtn} onPress={() => equipWeaponToSlot(i.id, s)}>
                          <Text style={styles.actionTxt}>S{s}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => equipArmor(i.id)}>
                      <Text style={styles.actionTxt}>Equip</Text>
                    </TouchableOpacity>
                  ),
                }))}
              </ScrollView>
            </>
          )}
        </>
      )}

      {detailItem && (
        <TouchableOpacity style={styles.modalBg} onPress={() => setDetailItem(null)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{detailItem.name}</Text>
            <Text style={styles.modalLine}>{isWeapon(detailItem) ? `Cut ${fmt(detailItem.cut)} / Blunt ${fmt(detailItem.blunt)}` : `Cut Res ${fmt(detailItem.cutResistance)} / Blunt Res ${fmt(detailItem.bluntResistance)}`}</Text>
            {!!detailItem.elements?.length && (
              <Text style={styles.modalLine}>Elements: {detailItem.elements.map((e) => e.type).join(', ')}</Text>
            )}
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2C1810' },
  header: { backgroundColor: '#1A0E08', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: '#8B7355' },
  title: { color: '#F4E4C1', textAlign: 'center', fontSize: 20, fontWeight: '700', fontFamily: 'Lato_700Bold' },
  menuWrap: { padding: 10 },
  menuBtn: { height: 46, marginBottom: 8, backgroundColor: '#3E2723', borderColor: '#8B7355', borderWidth: 1, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  menuTxt: { color: '#F4E4C1', fontWeight: '700', fontFamily: 'Lato_700Bold' },
  back: { marginTop: 6, marginHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' },
  backTxt: { color: '#F4E4C1', marginLeft: 4, fontFamily: 'Lato_400Regular' },
  filterContainer: { height: 50, justifyContent: 'center' },
  filterRow: { paddingHorizontal: 10 },
  filterRowContent: { alignItems: 'center' },
  filterBtn: { height: 34, minWidth: 84, marginRight: 8, borderRadius: 6, borderWidth: 1, borderColor: '#8B7355', justifyContent: 'center', alignItems: 'center', backgroundColor: '#3E2723' },
  filterBtnActive: { backgroundColor: '#8B7355' },
  filterTxt: { color: '#A0826D', fontSize: 11, fontWeight: '700' },
  filterTxtActive: { color: '#F4E4C1' },
  startBtn: { marginHorizontal: 10, marginBottom: 8, backgroundColor: '#8B7355', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  startTxt: { color: '#F4E4C1', fontWeight: '700', fontSize: 12, fontFamily: 'Lato_700Bold' },
  lockInfo: { color: '#A0826D', marginHorizontal: 10, marginBottom: 8, fontFamily: 'Lato_400Regular' },
  helper: { color: '#A0826D', marginHorizontal: 10, marginBottom: 8, fontFamily: 'Lato_400Regular' },
  sectionLabel: { color: '#D6A84F', marginHorizontal: 10, marginBottom: 6, fontSize: 12, fontWeight: '700', fontFamily: 'Lato_700Bold' },
  difficultyRow: { flexDirection: 'row', gap: 8, marginHorizontal: 10, marginBottom: 10 },
  difficultyBtn: { flex: 1, backgroundColor: '#3E2723', borderWidth: 1, borderColor: '#8B7355', borderRadius: 8, padding: 10 },
  difficultyBtnActive: { backgroundColor: '#D6A84F', borderColor: '#F4E4C1' },
  difficultyTitle: { color: '#F4E4C1', fontSize: 13, fontWeight: '700', fontFamily: 'Lato_700Bold' },
  difficultyTitleActive: { color: '#2C1810' },
  difficultyDesc: { color: '#A0826D', fontSize: 11, marginTop: 4, fontFamily: 'Lato_400Regular' },
  difficultyDescActive: { color: '#3E2723' },
  list: { flex: 1, paddingHorizontal: 10 },
  listContent: { paddingBottom: 16 },
  horizontalList: { maxHeight: 126, marginBottom: 8 },
  horizontalListContent: { paddingHorizontal: 10, alignItems: 'center' },
  miniCard: { width: 148, minHeight: 84, backgroundColor: '#3E2723', borderWidth: 1, borderColor: '#8B7355', borderRadius: 8, padding: 8, marginRight: 8, marginBottom: 8, justifyContent: 'center', alignItems: 'center' },
  miniStats: { color: '#A0826D', marginTop: 6, fontSize: 11, textAlign: 'center', fontFamily: 'Lato_400Regular' },
  actionBtn: { marginTop: 6, backgroundColor: '#8B7355', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 },
  actionBtnActive: { backgroundColor: '#4F9D69' },
  actionTxt: { color: '#F4E4C1', fontSize: 11, fontWeight: '700', fontFamily: 'Lato_700Bold' },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 10, marginBottom: 6 },
  slotCard: { minWidth: 92, backgroundColor: '#3E2723', borderColor: '#8B7355', borderWidth: 1, borderRadius: 8, padding: 6 },
  slotLabel: { color: '#D6A84F', fontSize: 10, fontFamily: 'Lato_700Bold' },
  slotValue: { color: '#F4E4C1', fontSize: 11, marginTop: 3, fontFamily: 'Lato_400Regular' },
  slotBtnsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 6 },
  modalBg: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#2C1810', borderWidth: 1, borderColor: '#8B7355', borderRadius: 10, padding: 14 },
  modalTitle: { color: '#F4E4C1', fontSize: 18, fontWeight: '700', fontFamily: 'Lato_700Bold' },
  modalLine: { color: '#A0826D', marginTop: 8, fontFamily: 'Lato_400Regular' },
});

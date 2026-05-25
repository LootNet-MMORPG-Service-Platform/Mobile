import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import authService from '../../services/authService';

const runStatusMap = {
  0: 'Active',
  1: 'In Battle',
  2: 'Won',
  3: 'Lost',
  4: 'Aborted',
};

const ACTION = {
  ATTACK: 0,
  CHANGE_EQUIPMENT: 1,
  CHANGE_POSITION: 2,
  END_TURN: 3,
};

const read = (obj, a, b) => obj?.[a] ?? obj?.[b];
const fmt = (v) => Number(v ?? 0).toFixed(1);
const scrubDebugIds = (value = '') =>
  String(value).replace(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
    'an opponent',
  );

const normalizeWeapon = (item) => {
  if (!item) return null;
  const id = read(item, 'id', 'Id');
  if (!id) return null;
  return {
    id,
    name: read(item, 'name', 'Name') || 'Unknown weapon',
    weaponType: read(item, 'weaponType', 'WeaponType'),
    cut: read(item, 'cut', 'Cut') ?? 0,
    blunt: read(item, 'blunt', 'Blunt') ?? 0,
    category: read(item, 'category', 'Category') ?? 1,
    elements: read(item, 'elements', 'Elements') || [],
  };
};

const isTwoHanded = (weapon) => {
  if (!weapon) return false;
  const t = weapon.weaponType;
  if (typeof t === 'string') {
    const s = t.toLowerCase();
    return (
      s.includes('twohand') || s.includes('polearm') || s.includes('bow') || s.includes('crossbow')
    );
  }
  if (typeof t === 'number') {
    return [3, 4, 5, 6, 7].includes(t);
  }
  return false;
};

export default function BattleScreen() {
  const [run, setRun] = useState(null);
  const [battle, setBattle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [turnLog, setTurnLog] = useState([]);
  const [turnState, setTurnState] = useState('');
  const [battleRewards, setBattleRewards] = useState([]);
  const [battleMessage, setBattleMessage] = useState('');
  const [equipmentSlots, setEquipmentSlots] = useState({});
  const [helpOpen, setHelpOpen] = useState(false);

  const [handsEditorOpen, setHandsEditorOpen] = useState(false);
  const [selectedLeftHandId, setSelectedLeftHandId] = useState(null);
  const [selectedRightHandId, setSelectedRightHandId] = useState(null);

  const refreshRunState = useCallback(async () => {
    const active = await authService.getActiveRun();
    if (!(active.success && active.data)) {
      setRun(null);
      setBattle(null);
      return;
    }

    setRun(active.data);
    if (active.data.status === 1) {
      const [currentBattle, slots] = await Promise.all([
        authService.getCurrentBattle(),
        authService.getEquipmentSlots(),
      ]);
      const nextBattle = currentBattle.success ? currentBattle.data : null;
      const nextSlots = slots.success ? slots.data || {} : {};
      setBattle(nextBattle);
      setEquipmentSlots(nextSlots);
      setSelectedLeftHandId(nextBattle?.leftHandItemId || nextBattle?.LeftHandItemId || null);
      setSelectedRightHandId(nextBattle?.rightHandItemId || nextBattle?.RightHandItemId || null);
    } else {
      setBattle(null);
      setEquipmentSlots({});
      setSelectedLeftHandId(null);
      setSelectedRightHandId(null);
      setHandsEditorOpen(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshRunState();
    }, [refreshRunState]),
  );

  const startRun = async () => {
    setLoading(true);
    const equippedItems = await authService.getEquippedItems();
    if (!equippedItems.success || !(equippedItems.data || []).length) {
      setLoading(false);
      Alert.alert('Run', 'Equip at least one item before starting a run.');
      return;
    }

    const result = await authService.startRun([]);
    setLoading(false);
    if (!result.success) {
      Alert.alert('Error', result.error || 'Failed to start run');
      return;
    }
    setTurnLog([]);
    await refreshRunState();
  };

  const goFurther = async () => {
    setLoading(true);
    const result = await authService.goFurther();
    setLoading(false);
    if (!result.success) {
      Alert.alert('Error', result.error || 'Failed to progress run');
      return;
    }
    setBattle(result.data);
    setTurnLog([]);
    setTurnState('');
    await refreshRunState();
  };

  const endRun = async () => {
    setLoading(true);
    const result = await authService.endRun();
    setLoading(false);
    if (!result.success) {
      Alert.alert('Error', result.error || 'Failed to end run');
      return;
    }
    setRun(null);
    setBattle(null);
    setTurnLog([]);
    setTurnState('');
    setHandsEditorOpen(false);
    await refreshRunState();
  };

  const finishTurn = async (action, waitingLabel) => {
    if (!battle?.battleId) return;
    setTurnState(waitingLabel || 'Resolving action...');
    setLoading(true);
    const result = await authService.finishTurn({ battleId: battle.battleId, action });
    setLoading(false);
    if (!result.success) {
      setTurnState('');
      Alert.alert('Turn failed', result.error || 'Could not finish turn');
      return;
    }
    const currentLog = Array.isArray(result.data?.log) ? result.data.log : [];
    setBattleRewards(Array.isArray(result.data?.rewardItems) ? result.data.rewardItems : []);
    setBattleMessage(result.data?.message || '');
    if (result.data?.playerDefeated) {
      Alert.alert('Defeat', result.data?.message || 'You lost the battle.');
      setBattle(null);
      setBattleMessage(result.data?.message || 'You lost the battle.');
    }
    const enriched = [
      ...currentLog.map((line) => scrubDebugIds(line)),
      `You dealt ${result.data?.damageDealt ?? 0} damage. Incoming damage: ${result.data?.enemyDamage ?? 0}.`,
    ];
    setTurnLog((prev) => [...prev, ...enriched]);
    setTurnState('Resolving action...');
    await refreshRunState();
    setTurnState('');
  };

  const moveFrontTarget = useMemo(() => Math.min(3, (battle?.playerPosition ?? 0) + 1), [battle]);
  const moveBackTarget = useMemo(() => Math.max(0, (battle?.playerPosition ?? 0) - 1), [battle]);
  const occupiedEnemyPositions = useMemo(
    () => new Set((battle?.enemies || []).map((e) => e.position)),
    [battle],
  );
  const canMoveFront =
    !!battle &&
    battle.playerPosition < 3 &&
    !occupiedEnemyPositions.has(moveFrontTarget) &&
    !loading;
  const canMoveBack =
    !!battle &&
    battle.playerPosition > 0 &&
    !occupiedEnemyPositions.has(moveBackTarget) &&
    !loading;

  const weaponOptions = useMemo(() => {
    const keys = [
      'weapon1',
      'weapon2',
      'weapon3',
      'weapon4',
      'Weapon1',
      'Weapon2',
      'Weapon3',
      'Weapon4',
    ];
    const seen = new Set();
    const out = [];
    keys.forEach((k) => {
      const normalized = normalizeWeapon(equipmentSlots?.[k]);
      if (normalized?.id && !seen.has(normalized.id)) {
        seen.add(normalized.id);
        out.push(normalized);
      }
    });
    return out;
  }, [equipmentSlots]);

  const weaponById = useMemo(() => {
    const map = new Map();
    weaponOptions.forEach((w) => map.set(w.id, w));
    return map;
  }, [weaponOptions]);

  const leftHandLabel = useMemo(
    () =>
      weaponOptions.find((w) => w.id === (battle?.leftHandItemId || battle?.LeftHandItemId))
        ?.name || 'None',
    [weaponOptions, battle],
  );
  const rightHandLabel = useMemo(
    () =>
      weaponOptions.find((w) => w.id === (battle?.rightHandItemId || battle?.RightHandItemId))
        ?.name || 'None',
    [weaponOptions, battle],
  );

  const selectedLeftWeapon = useMemo(
    () => weaponById.get(selectedLeftHandId) || null,
    [weaponById, selectedLeftHandId],
  );
  const selectedRightWeapon = useMemo(
    () => weaponById.get(selectedRightHandId) || null,
    [weaponById, selectedRightHandId],
  );

  const clearTwoHandIfEquipped = () => {
    if (!selectedLeftHandId || selectedLeftHandId !== selectedRightHandId) return;
    const w = weaponById.get(selectedLeftHandId);
    if (w && isTwoHanded(w)) {
      setSelectedLeftHandId(null);
      setSelectedRightHandId(null);
    }
  };

  const assignLeft = (weapon) => {
    if (!weapon || isTwoHanded(weapon)) return;
    clearTwoHandIfEquipped();
    setSelectedLeftHandId(weapon.id);
    if (selectedRightHandId === weapon.id) setSelectedRightHandId(null);
  };

  const assignRight = (weapon) => {
    if (!weapon || isTwoHanded(weapon)) return;
    clearTwoHandIfEquipped();
    setSelectedRightHandId(weapon.id);
    if (selectedLeftHandId === weapon.id) setSelectedLeftHandId(null);
  };

  const assignTwoHand = (weapon) => {
    if (!weapon || !isTwoHanded(weapon)) return;
    setSelectedLeftHandId(weapon.id);
    setSelectedRightHandId(weapon.id);
  };

  const applyBattleHands = async () => {
    const leftWeapon = weaponById.get(selectedLeftHandId) || null;
    const rightWeapon = weaponById.get(selectedRightHandId) || null;

    if (!leftWeapon && !rightWeapon) {
      Alert.alert('Battle hands', 'Select at least one weapon hand.');
      return;
    }

    if (leftWeapon && rightWeapon && leftWeapon.id === rightWeapon.id && !isTwoHanded(leftWeapon)) {
      Alert.alert('Battle hands', 'One-handed weapon cannot be in both hands.');
      return;
    }

    if (
      leftWeapon &&
      isTwoHanded(leftWeapon) &&
      (!rightWeapon || rightWeapon.id !== leftWeapon.id)
    ) {
      Alert.alert('Battle hands', 'Two-handed weapon must occupy both hands.');
      return;
    }

    if (
      rightWeapon &&
      isTwoHanded(rightWeapon) &&
      (!leftWeapon || leftWeapon.id !== rightWeapon.id)
    ) {
      Alert.alert('Battle hands', 'Two-handed weapon must occupy both hands.');
      return;
    }

    await finishTurn(
      {
        type: ACTION.CHANGE_EQUIPMENT,
        targetPosition: battle?.playerPosition ?? 0,
        leftWeapon,
        rightWeapon,
      },
      'Applying hand change...',
    );
    setHandsEditorOpen(false);
  };

  const cancelHandsEditor = () => {
    setSelectedLeftHandId(battle?.leftHandItemId || battle?.LeftHandItemId || null);
    setSelectedRightHandId(battle?.rightHandItemId || battle?.RightHandItemId || null);
    setHandsEditorOpen(false);
  };

  const renderMiniCard = (item) => {
    const twoH = isTwoHanded(item);
    return (
      <View key={item.id} style={styles.miniCard}>
        <IconSymbol name="sword" size={22} color="#F4E4C1" />
        <Text style={styles.miniStats}>
          C {fmt(item.cut)} / B {fmt(item.blunt)}
        </Text>
        <Text style={styles.miniName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.miniActionsRow}>
          {twoH ? (
            <TouchableOpacity style={styles.miniActionBtnWide} onPress={() => assignTwoHand(item)}>
              <Text style={styles.miniActionTxt}>2H</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.miniActionBtn} onPress={() => assignLeft(item)}>
                <Text style={styles.miniActionTxt}>L</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.miniActionBtn} onPress={() => assignRight(item)}>
                <Text style={styles.miniActionTxt}>R</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={{ width: 34 }} />
            <Text style={styles.title}>Run</Text>
            <TouchableOpacity style={styles.helpButton} onPress={() => setHelpOpen(true)}>
              <Text style={styles.helpButtonText}>?</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Choose a route, fight, and bring loot home.</Text>
        </View>

        {!run ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>No active run</Text>
            <Text style={styles.panelText}>Start an adventure with the gear you prepared.</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={startRun} disabled={loading}>
              <IconSymbol name="play.fill" size={16} color="#F4E4C1" />
              <Text style={styles.actionText}>{loading ? 'Starting...' : 'Start Run'}</Text>
            </TouchableOpacity>
          </View>
        ) : battle ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Battle</Text>
            <Text style={styles.panelText}>
              HP: {battle.playerCurrentHp} / {battle.playerMaxHp}
            </Text>
            <Text style={styles.panelText}>Position: {battle.playerPosition}</Text>
            <Text style={styles.panelText}>Left hand: {leftHandLabel}</Text>
            <Text style={styles.panelText}>Right hand: {rightHandLabel}</Text>
            <Text style={styles.panelText}>State: {turnState || 'Ready'}</Text>

            <Text style={styles.sectionTitle}>Enemies</Text>
            {(battle.enemies || []).length === 0 && (
              <Text style={styles.panelText}>No enemies in current battle.</Text>
            )}
            {(battle.enemies || []).map((e, idx) => (
              <View key={e.id} style={styles.enemyRow}>
                <Text style={styles.enemyText}>{e.name || e.Name || `Opponent ${idx + 1}`}</Text>
                <Text style={styles.enemyText}>Distance {e.position}</Text>
                <Text style={styles.enemyText}>
                  HP {e.currentHp}/{e.maxHp}
                </Text>
                <TouchableOpacity
                  style={styles.enemyAttackBtn}
                  onPress={() =>
                    finishTurn(
                      { type: ACTION.ATTACK, targetPosition: e.position },
                      `Resolving attack on enemy ${idx + 1}...`,
                    )
                  }
                  disabled={loading}
                >
                  <Text style={styles.enemyAttackText}>Attack</Text>
                </TouchableOpacity>
              </View>
            ))}

            {!handsEditorOpen ? (
              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.actionBtn, loading && styles.actionBtnDisabled]}
                  onPress={() => setHandsEditorOpen(true)}
                  disabled={loading}
                >
                  <Text style={styles.actionText}>Change Battle Hands</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.handsPanel}>
                <TouchableOpacity style={styles.back} onPress={cancelHandsEditor}>
                  <IconSymbol name="chevron.left" size={16} color="#F4E4C1" />
                  <Text style={styles.backTxt}>Cancel</Text>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>Hands Setup</Text>
                <View style={styles.handsSlotsRow}>
                  <View style={styles.handSlotCard}>
                    <Text style={styles.handSlotLabel}>LEFT</Text>
                    <Text style={styles.handSlotValue} numberOfLines={1}>
                      {selectedLeftWeapon?.name || 'Empty'}
                    </Text>
                  </View>
                  <View style={styles.handSlotCard}>
                    <Text style={styles.handSlotLabel}>RIGHT</Text>
                    <Text style={styles.handSlotValue} numberOfLines={1}>
                      {selectedRightWeapon?.name || 'Empty'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.sectionHint}>
                  1H: use L/R. 2H: only 2H. Selecting 1H removes active 2H from both hands.
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.horizontalList}
                  contentContainerStyle={styles.horizontalListContent}
                >
                  {weaponOptions.map((w) => renderMiniCard(w))}
                  {weaponOptions.length === 0 && (
                    <Text style={styles.panelText}>No equipped weapon slots found.</Text>
                  )}
                </ScrollView>

                <View style={styles.row}>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      (loading || (!selectedLeftWeapon && !selectedRightWeapon)) &&
                        styles.actionBtnDisabled,
                    ]}
                    onPress={applyBattleHands}
                    disabled={loading || (!selectedLeftWeapon && !selectedRightWeapon)}
                  >
                    <Text style={styles.actionText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.actionBtn, !canMoveFront && styles.actionBtnDisabled]}
                onPress={() =>
                  finishTurn(
                    { type: ACTION.CHANGE_POSITION, targetPosition: moveFrontTarget },
                    'Resolving move...',
                  )
                }
                disabled={!canMoveFront}
              >
                <Text style={styles.actionText}>Move Front</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, !canMoveBack && styles.actionBtnDisabled]}
                onPress={() =>
                  finishTurn(
                    { type: ACTION.CHANGE_POSITION, targetPosition: moveBackTarget },
                    'Resolving move...',
                  )
                }
                disabled={!canMoveBack}
              >
                <Text style={styles.actionText}>Move Back</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, loading && styles.actionBtnDisabled]}
              onPress={() =>
                finishTurn(
                  { type: ACTION.END_TURN, targetPosition: battle?.playerPosition ?? 0 },
                  'Ending turn...',
                )
              }
              disabled={loading}
            >
              <IconSymbol name="forward.end.fill" size={16} color="#F4E4C1" />
              <Text style={styles.actionText}>End Turn</Text>
            </TouchableOpacity>

            <View style={styles.logBox}>
              <Text style={styles.sectionTitle}>Battle Log</Text>
              <ScrollView style={styles.logScroll}>
                {turnLog.length === 0 ? (
                  <Text style={styles.logLine}>No turn log yet.</Text>
                ) : (
                  turnLog.map((line, idx) => (
                    <Text key={idx} style={styles.logLine}>
                      {line}
                    </Text>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        ) : (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Run Active</Text>
            {!!battleMessage && <Text style={styles.panelText}>{battleMessage}</Text>}
            {battleRewards.length > 0 && (
              <View style={styles.logBox}>
                <Text style={styles.sectionTitle}>Win Battle Rewards</Text>
                {battleRewards.map((item) => (
                  <Text key={item.id || item.Id} style={styles.logLine}>
                    {item.name || item.Name}
                  </Text>
                ))}
              </View>
            )}
            <Text style={styles.panelText}>
              Status: {runStatusMap[run.status] || run.status || run.Status}
            </Text>
            <Text style={styles.panelText}>Encounter: {run.battleIndex || run.BattleIndex}</Text>
            <Text style={styles.panelText}>
              HP: {run.playerCurrentHp || run.PlayerCurrentHp} /{' '}
              {run.playerMaxHp || run.PlayerMaxHp}
            </Text>

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={goFurther}
                disabled={loading || run.status === 3 || run.Status === 3}
              >
                <IconSymbol name="chevron.right" size={16} color="#F4E4C1" />
                <Text style={styles.actionText}>
                  {run.status === 3 || run.Status === 3
                    ? 'Run Lost'
                    : loading
                      ? 'Working...'
                      : 'Go Further'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.endBtn]}
                onPress={endRun}
                disabled={loading}
              >
                <IconSymbol name="xmark" size={16} color="#F4E4C1" />
                <Text style={styles.actionText}>End Run</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        transparent
        visible={helpOpen}
        animationType="fade"
        onRequestClose={() => setHelpOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBg}
          activeOpacity={1}
          onPress={() => setHelpOpen(false)}
        >
          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>How Battles Work</Text>
            <Text style={styles.helpLine}>
              Attack, move, change hands, or end turn to resolve enemy counterattacks.
            </Text>
            <Text style={styles.helpLine}>
              Distance shows how far each opponent is on the battle line. Move front or back to
              change your position.
            </Text>
            <Text style={styles.helpLine}>
              Change battle hands when you need a different weapon setup. One-handed weapons use one
              hand; two-handed weapons use both.
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2C1810' },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#1A0E08',
    borderBottomWidth: 2,
    borderBottomColor: '#8B7355',
  },
  headerTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F4E4C1',
    textTransform: 'uppercase',
    fontFamily: 'Lato_700Bold',
  },
  subtitle: { marginTop: 6, color: '#A0826D', fontFamily: 'Lato_400Regular' },
  helpButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#8B7355',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3E2723',
  },
  helpButtonText: { color: '#F4E4C1', fontSize: 18, fontWeight: '700', fontFamily: 'Lato_700Bold' },
  panel: {
    margin: 16,
    backgroundColor: '#3E2723',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#8B7355',
    padding: 16,
  },
  panelTitle: {
    color: '#F4E4C1',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'Lato_700Bold',
  },
  panelText: { color: '#A0826D', marginBottom: 6, fontFamily: 'Lato_400Regular' },
  sectionTitle: {
    color: '#D6A84F',
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 8,
    fontFamily: 'Lato_700Bold',
  },
  sectionHint: { color: '#A0826D', fontSize: 12, marginBottom: 8, fontFamily: 'Lato_400Regular' },
  enemyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#2C1810',
    borderWidth: 1,
    borderColor: '#8B7355',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  enemyText: { color: '#F4E4C1', fontSize: 12, fontFamily: 'Lato_400Regular' },
  enemyAttackBtn: {
    backgroundColor: '#8B7355',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  enemyAttackText: {
    color: '#F4E4C1',
    fontWeight: '700',
    fontSize: 11,
    fontFamily: 'Lato_700Bold',
  },
  actionBtn: {
    marginTop: 12,
    backgroundColor: '#8B7355',
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
  },
  actionBtnDisabled: { opacity: 0.45 },
  actionText: { color: '#F4E4C1', fontWeight: '700', fontFamily: 'Lato_700Bold' },
  row: { flexDirection: 'row', gap: 10 },
  endBtn: { backgroundColor: '#654321' },
  logBox: {
    marginTop: 10,
    backgroundColor: '#2C1810',
    borderWidth: 1,
    borderColor: '#8B7355',
    borderRadius: 8,
    padding: 8,
  },
  logScroll: { maxHeight: 180 },
  logLine: { color: '#A0826D', fontSize: 12, marginBottom: 4, fontFamily: 'Lato_400Regular' },
  back: {
    marginTop: 4,
    marginBottom: 4,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backTxt: { color: '#F4E4C1', marginLeft: 4, fontFamily: 'Lato_400Regular' },
  handsPanel: {
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#8B7355',
    borderRadius: 8,
    backgroundColor: '#2C1810',
  },
  handsSlotsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  handSlotCard: {
    flex: 1,
    backgroundColor: '#3E2723',
    borderColor: '#8B7355',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  handSlotLabel: { color: '#D6A84F', fontSize: 11, fontWeight: '700', fontFamily: 'Lato_700Bold' },
  handSlotValue: { color: '#F4E4C1', marginTop: 4, fontSize: 12, fontFamily: 'Lato_400Regular' },
  horizontalList: { maxHeight: 148, marginBottom: 6 },
  horizontalListContent: { paddingVertical: 4, alignItems: 'center' },
  miniCard: {
    width: 148,
    minHeight: 120,
    backgroundColor: '#3E2723',
    borderWidth: 1,
    borderColor: '#8B7355',
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniStats: {
    color: '#A0826D',
    marginTop: 6,
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'Lato_400Regular',
  },
  miniName: {
    color: '#F4E4C1',
    marginTop: 4,
    fontSize: 11,
    maxWidth: 130,
    fontFamily: 'Lato_400Regular',
  },
  miniActionsRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  miniActionBtn: {
    backgroundColor: '#8B7355',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  miniActionBtnWide: {
    backgroundColor: '#8B7355',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  miniActionTxt: { color: '#F4E4C1', fontSize: 11, fontWeight: '700', fontFamily: 'Lato_700Bold' },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  helpCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#2C1810',
    borderWidth: 1,
    borderColor: '#8B7355',
    borderRadius: 10,
    padding: 16,
  },
  helpTitle: {
    color: '#F4E4C1',
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 10,
    fontFamily: 'Lato_700Bold',
  },
  helpLine: {
    color: '#A0826D',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: 'Lato_400Regular',
  },
});

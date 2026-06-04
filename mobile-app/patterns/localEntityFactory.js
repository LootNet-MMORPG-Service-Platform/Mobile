const OPPONENT_TYPES = [
  { name: 'Raider', hp: 35, position: 2 },
  { name: 'Duelist', hp: 42, position: 2 },
  { name: 'Guard', hp: 50, position: 3 },
];

const createId = (prefix) => `${prefix}-${Date.now()}`;

export const LocalEntityFactory = {
  createRun(itemIds) {
    return {
      id: createId('local-run'),
      status: 0,
      battleIndex: 0,
      playerCurrentHp: 100,
      playerMaxHp: 100,
      itemIds,
    };
  },

  createBattle(run, equipmentSlots = {}) {
    const enemyCount = 1;

    return {
      battleId: createId('local-battle'),
      playerCurrentHp: run.playerCurrentHp,
      playerMaxHp: run.playerMaxHp,
      playerPosition: 1,
      leftHandItemId: equipmentSlots.weapon1?.id || null,
      rightHandItemId: equipmentSlots.weapon2?.id || equipmentSlots.weapon1?.id || null,
      enemies: Array.from({ length: enemyCount }, (_, index) => {
        const type = OPPONENT_TYPES[(run.battleIndex + index) % OPPONENT_TYPES.length];

        return {
          id: `${createId('enemy')}-${index}`,
          name: type.name,
          position: type.position,
          currentHp: type.hp,
          maxHp: type.hp,
        };
      }),
    };
  },

  createReward(normalizeItem) {
    return normalizeItem({
      id: createId('local-item'),
      name: 'Adventure Loot',
      category: 'Weapon',
      weaponType: 0,
      cut: 8 + Math.round(Math.random() * 8),
      blunt: 4 + Math.round(Math.random() * 6),
      elements: [],
    });
  },

  createMarketListing(item, price, isWeapon) {
    return {
      id: createId('local-listing'),
      itemId: item.id,
      itemName: item.name,
      category: isWeapon(item) ? 'Weapon' : 'Armor',
      price,
      isSold: false,
    };
  },
};

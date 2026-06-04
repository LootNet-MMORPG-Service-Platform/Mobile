const ACTION_TYPES = {
  ATTACK: 0,
  CHANGE_EQUIPMENT: 1,
  CHANGE_POSITION: 2,
  END_TURN: 3,
};

const attackStrategy = {
  execute({ battle, action }) {
    const target =
      battle.enemies.find((enemy) => enemy.position === action.targetPosition) || battle.enemies[0];

    if (!target) {
      return { log: ['You attacked, but there was no target.'], damageDealt: 0 };
    }

    const damageDealt = 24;
    target.currentHp = Math.max(0, target.currentHp - damageDealt);

    return {
      log: [`You hit opponent at distance ${target.position}.`],
      damageDealt,
    };
  },
};

const changeEquipmentStrategy = {
  execute({ battle, action }) {
    battle.leftHandItemId = action.leftWeapon?.id || null;
    battle.rightHandItemId = action.rightWeapon?.id || null;

    return {
      log: ['You changed battle hands.'],
      damageDealt: 0,
    };
  },
};

const changePositionStrategy = {
  execute({ battle, action }) {
    battle.playerPosition = action.targetPosition ?? battle.playerPosition;

    return {
      log: [`You moved to position ${battle.playerPosition}.`],
      damageDealt: 0,
    };
  },
};

const endTurnStrategy = {
  execute() {
    return {
      log: ['You held position and ended the turn.'],
      damageDealt: 0,
    };
  },
};

const strategies = {
  [ACTION_TYPES.ATTACK]: attackStrategy,
  [ACTION_TYPES.CHANGE_EQUIPMENT]: changeEquipmentStrategy,
  [ACTION_TYPES.CHANGE_POSITION]: changePositionStrategy,
  [ACTION_TYPES.END_TURN]: endTurnStrategy,
};

export const resolveBattleAction = (context) => {
  const strategy = strategies[context.type] || endTurnStrategy;
  return strategy.execute(context);
};

export { ACTION_TYPES };

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  RefreshControl,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import Storage from '../../utils/storage';

const BATTLE_HISTORY_KEY = 'battleHistory';
const BOT_CONFIG = {
  easy: { name: 'Training Bot', health: 80, minDamage: 6, maxDamage: 12 },
  normal: { name: 'Arena Bot', health: 100, minDamage: 10, maxDamage: 18 },
  hard: { name: 'Champion Bot', health: 130, minDamage: 14, maxDamage: 24 },
};

export default function BattleScreen() {
  const [battleState, setBattleState] = useState('idle'); // idle, fighting, victory, defeat
  const [currentBattle, setCurrentBattle] = useState(null);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [botHealth, setBotHealth] = useState(100);
  const [battleLog, setBattleLog] = useState([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [battleHistory, setBattleHistory] = useState([]);
  
  const fadeAnim = new Animated.Value(1);
  const shakeAnim = new Animated.Value(0);

  useEffect(() => {
    loadBattleHistory();
  }, []);

  const loadBattleHistory = async () => {
    try {
      const storedHistory = await Storage.getItem(BATTLE_HISTORY_KEY);
      setBattleHistory(storedHistory ? JSON.parse(storedHistory) : []);
    } catch (error) {
      console.error('Error loading battle history:', error);
    }
  };

  const startBattle = async (difficulty = 'normal') => {
    try {
      const bot = BOT_CONFIG[difficulty] || BOT_CONFIG.normal;
      const battle = {
        bot,
        difficulty,
        playerHealth: 100,
        botHealth: bot.health,
      };

      setCurrentBattle(battle);
      setBattleState('fighting');
      setPlayerHealth(battle.playerHealth);
      setBotHealth(battle.botHealth);
      setBattleLog([`Battle started against ${bot.name}!`]);
      setIsPlayerTurn(true);
      fadeAnim.setValue(1);
    } catch (_error) {
      Alert.alert('Error', 'Failed to start battle');
    }
  };

  const performAttack = async (damage = 20) => {
    if (!isPlayerTurn || battleState !== 'fighting') return;

    // Player attack
    const newBotHealth = Math.max(0, botHealth - damage);
    setBotHealth(newBotHealth);
    addToBattleLog(`You deal ${damage} damage!`);
    
    // Shake animation for bot
    shakeAnimation();

    if (newBotHealth <= 0) {
      endBattle('victory');
      return;
    }

    setIsPlayerTurn(false);

    // Bot counter-attack after delay
    setTimeout(() => {
      botCounterAttack();
    }, 1500);
  };

  const botCounterAttack = () => {
    if (battleState !== 'fighting') return;

    const bot = currentBattle?.bot || BOT_CONFIG.normal;
    const botDamage = Math.floor(Math.random() * (bot.maxDamage - bot.minDamage + 1)) + bot.minDamage;
    const newPlayerHealth = Math.max(0, playerHealth - botDamage);
    setPlayerHealth(newPlayerHealth);
    addToBattleLog(`${currentBattle?.bot?.name || 'Bot'} deals ${botDamage} damage!`);

    // Shake animation for player
    shakeAnimation();

    if (newPlayerHealth <= 0) {
      endBattle('defeat');
      return;
    }

    setIsPlayerTurn(true);
  };

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const addToBattleLog = (message) => {
    setBattleLog(prev => [...prev, message]);
  };

  const endBattle = async (result) => {
    setBattleState(result);
    if (result === 'victory') {
      addToBattleLog('Victory! You won the battle!');
      Animated.timing(fadeAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }).start();
    } else {
      addToBattleLog('Defeat! You lost the battle.');
      Animated.timing(fadeAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }).start();
    }
    
    const historyEntry = {
      result,
      opponent: currentBattle?.bot?.name || 'Bot',
      date: new Date().toISOString(),
    };

    const nextHistory = [historyEntry, ...battleHistory].slice(0, 20);
    setBattleHistory(nextHistory);
    await Storage.setItem(BATTLE_HISTORY_KEY, JSON.stringify(nextHistory));
  };

  const resetBattle = () => {
    setBattleState('idle');
    setCurrentBattle(null);
    setPlayerHealth(100);
    setBotHealth(100);
    setBattleLog([]);
    setIsPlayerTurn(true);
    fadeAnim.setValue(1);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBattleHistory();
    setRefreshing(false);
  };

  const renderBattleArena = () => {
    if (battleState === 'idle') {
      return (
        <View style={styles.battleSetup}>
          <Text style={styles.setupTitle}>Choose Your Opponent</Text>
          
          <TouchableOpacity
            style={styles.difficultyButton}
            onPress={() => startBattle('easy')}
          >
            <IconSymbol name="leaf" size={24} color="#4CAF50" />
            <View style={styles.difficultyInfo}>
              <Text style={styles.difficultyName}>Easy Bot</Text>
              <Text style={styles.difficultyDesc}>Perfect for beginners</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.difficultyButton}
            onPress={() => startBattle('normal')}
          >
            <IconSymbol name="flame" size={24} color="#FF9800" />
            <View style={styles.difficultyInfo}>
              <Text style={styles.difficultyName}>Normal Bot</Text>
              <Text style={styles.difficultyDesc}>Balanced challenge</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.difficultyButton}
            onPress={() => startBattle('hard')}
          >
            <IconSymbol name="bolt" size={24} color="#F44336" />
            <View style={styles.difficultyInfo}>
              <Text style={styles.difficultyName}>Hard Bot</Text>
              <Text style={styles.difficultyDesc}>For experienced fighters</Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.battleArena}>
        <View style={styles.battleHeader}>
          <Text style={styles.battleTitle}>Battle Arena</Text>
          <Text style={styles.turnIndicator}>
            {isPlayerTurn ? "Your Turn" : "Bot's Turn"}
          </Text>
        </View>

        <View style={styles.combatants}>
          <Animated.View
            style={[
              styles.combatant,
              styles.playerCombatant,
              { transform: [{ translateX: shakeAnim }] },
            ]}
          >
            <View style={styles.combatantHeader}>
              <IconSymbol name="person.fill" size={32} color="#007AFF" />
              <Text style={styles.combatantName}>You</Text>
            </View>
            <View style={styles.healthBarContainer}>
              <View style={[styles.healthBar, { width: `${playerHealth}%` }]} />
              <Text style={styles.healthText}>{playerHealth}/100 HP</Text>
            </View>
          </Animated.View>

          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          <Animated.View
            style={[
              styles.combatant,
              styles.botCombatant,
              { transform: [{ translateX: Animated.multiply(shakeAnim, -1) }] },
            ]}
          >
            <View style={styles.combatantHeader}>
              <IconSymbol name="gamecontroller" size={32} color="#F44336" />
              <Text style={styles.combatantName}>
                {currentBattle?.bot?.name || 'Bot'}
              </Text>
            </View>
            <View style={styles.healthBarContainer}>
              <View style={[styles.healthBar, { width: `${botHealth}%` }]} />
              <Text style={styles.healthText}>{botHealth}/100 HP</Text>
            </View>
          </Animated.View>
        </View>

        {battleState === 'fighting' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, !isPlayerTurn && styles.buttonDisabled]}
              onPress={() => performAttack(15)}
              disabled={!isPlayerTurn}
            >
              <IconSymbol name="sword" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Light Attack</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, !isPlayerTurn && styles.buttonDisabled]}
              onPress={() => performAttack(25)}
              disabled={!isPlayerTurn}
            >
              <IconSymbol name="flame" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Heavy Attack</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, !isPlayerTurn && styles.buttonDisabled]}
              onPress={() => performAttack(10)}
              disabled={!isPlayerTurn}
            >
              <IconSymbol name="shield" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Defend</Text>
            </TouchableOpacity>
          </View>
        )}

        {(battleState === 'victory' || battleState === 'defeat') && (
          <View style={styles.battleResult}>
            <IconSymbol
              name={battleState === 'victory' ? 'trophy' : 'xmark.circle'}
              size={48}
              color={battleState === 'victory' ? '#FFD700' : '#F44336'}
            />
            <Text style={[
              styles.resultText,
              battleState === 'victory' ? styles.victoryText : styles.defeatText
            ]}>
              {battleState === 'victory' ? 'Victory!' : 'Defeat!'}
            </Text>
            <TouchableOpacity style={styles.resetButton} onPress={resetBattle}>
              <Text style={styles.resetButtonText}>Fight Again</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView style={styles.battleLogContainer}>
          <Text style={styles.logTitle}>Battle Log</Text>
          {battleLog.map((log, index) => (
            <Text key={index} style={styles.logEntry}>
              {log}
            </Text>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Battle System</Text>
        <Text style={styles.subtitle}>
          Challenge AI opponents and test your skills
        </Text>
      </View>

      {renderBattleArena()}

      {battleHistory.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>Recent Battles</Text>
          {battleHistory.slice(0, 5).map((battle, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyResult}>
                <IconSymbol
                  name={battle.result === 'victory' ? 'trophy' : 'xmark.circle'}
                  size={16}
                  color={battle.result === 'victory' ? '#4CAF50' : '#F44336'}
                />
                <Text style={styles.historyOpponent}>{battle.opponent}</Text>
              </View>
              <Text style={styles.historyDate}>
                {new Date(battle.date).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECE7DF',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F130D',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#3E2E25',
    textAlign: 'center',
  },
  battleSetup: {
    padding: 20,
  },
  setupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F130D',
    textAlign: 'center',
    marginBottom: 30,
  },
  difficultyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  difficultyInfo: {
    marginLeft: 15,
    flex: 1,
  },
  difficultyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F130D',
  },
  difficultyDesc: {
    fontSize: 16,
    color: '#3E2E25',
    marginTop: 4,
  },
  battleArena: {
    padding: 20,
  },
  battleHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  battleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F130D',
    marginBottom: 5,
  },
  turnIndicator: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  combatants: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  combatant: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerCombatant: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  botCombatant: {
    borderWidth: 2,
    borderColor: '#F44336',
  },
  combatantHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  combatantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F130D',
    marginTop: 8,
  },
  healthBarContainer: {
    width: '100%',
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  healthBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 10,
  },
  healthText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 14,
    color: '#1F130D',
    fontWeight: 'bold',
  },
  vsContainer: {
    paddingHorizontal: 20,
  },
  vsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3E2E25',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  battleResult: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 20,
  },
  victoryText: {
    color: '#4CAF50',
  },
  defeatText: {
    color: '#F44336',
  },
  resetButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    paddingHorizontal: 30,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  battleLogContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    maxHeight: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F130D',
    marginBottom: 10,
  },
  logEntry: {
    fontSize: 16,
    color: '#3E2E25',
    marginBottom: 5,
  },
  historyContainer: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F130D',
    marginBottom: 15,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  historyResult: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyOpponent: {
    fontSize: 16,
    color: '#1F130D',
    marginLeft: 8,
  },
  historyDate: {
    fontSize: 16,
    color: '#3E2E25',
  },
});

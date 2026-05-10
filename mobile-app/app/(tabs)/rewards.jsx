import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import authService from '../../services/authService';

export default function RewardsScreen() {
  const [lastReward, setLastReward] = useState(null);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const claimDailyReward = async () => {
    setIsLoading(true);
    try {
      const result = await authService.claimDailyReward();

      if (result.success) {
        setLastReward(result.data);
        setAlreadyClaimed(false);
        Alert.alert('Daily Reward Claimed!', `You received ${result.data?.name || 'a new item'}.`);
      } else if (result.error?.toLowerCase().includes('already claimed')) {
        setAlreadyClaimed(true);
        Alert.alert('Already Claimed', 'Your next daily reward will be available tomorrow.');
      } else if (result.error?.toLowerCase().includes('profile')) {
        Alert.alert(
          'Reward Not Ready',
          'Your account is missing a loot generation profile. Ask the backend team to assign one before claiming rewards.'
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to claim daily reward');
      }
    } catch (_error) {
      Alert.alert('Error', 'Failed to claim daily reward');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F4E4C1" />
      }
    >
      <View style={styles.header}>
        <IconSymbol name="gift" size={42} color="#D6A84F" />
        <Text style={styles.title}>Daily Reward</Text>
        <Text style={styles.subtitle}>Claim once per day to generate a new piece of loot.</Text>
      </View>

      <View style={styles.rewardPanel}>
        <View style={styles.rewardIcon}>
          <IconSymbol name={lastReward?.weaponType !== undefined ? 'sword' : 'shield'} size={54} color="#2C1810" />
        </View>
        <Text style={styles.rewardName}>{lastReward?.name || 'Mystery Loot'}</Text>
        <Text style={styles.rewardDescription}>
          {lastReward
            ? `Category: ${lastReward.category ?? 'Item'}`
            : alreadyClaimed
              ? 'You have already claimed today.'
              : 'A generated item will be added to your equipment.'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.claimButton, isLoading && styles.claimButtonDisabled]}
        onPress={claimDailyReward}
        disabled={isLoading}
      >
        <IconSymbol name="gift" size={20} color="#F4E4C1" />
        <Text style={styles.claimButtonText}>
          {isLoading ? 'Claiming...' : alreadyClaimed ? 'Check Reward' : 'Claim Daily Reward'}
        </Text>
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Reward Rules</Text>
        <Text style={styles.infoText}>One reward can be claimed each UTC day.</Text>
        <Text style={styles.infoText}>The backend generates either a weapon or armor item.</Text>
        <Text style={styles.infoText}>New rewards appear in the Equipment tab after claiming.</Text>
      </View>
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
    color: '#F4E4C1',
    marginTop: 10,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 18,
    color: '#D7C0A5',
    textAlign: 'center',
    marginTop: 6,
  },
  rewardPanel: {
    margin: 20,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#3E2723',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B7355',
  },
  rewardIcon: {
    width: 96,
    height: 96,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D6A84F',
    marginBottom: 18,
  },
  rewardName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F4E4C1',
    textAlign: 'center',
  },
  rewardDescription: {
    color: '#D7C0A5',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 8,
  },
  claimButton: {
    marginHorizontal: 20,
    height: 54,
    borderRadius: 8,
    backgroundColor: '#8B7355',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  claimButtonDisabled: {
    backgroundColor: '#654321',
  },
  claimButtonText: {
    color: '#F4E4C1',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  infoContainer: {
    margin: 20,
    padding: 18,
    backgroundColor: '#1A0E08',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B7355',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F4E4C1',
    marginBottom: 10,
  },
  infoText: {
    color: '#D7C0A5',
    fontSize: 16,
    marginBottom: 6,
  },
});

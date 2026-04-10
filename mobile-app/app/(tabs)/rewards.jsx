import React, { useState, useEffect } from 'react';
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
import api from '../../services/api';

export default function RewardsScreen() {
  const [dailyReward, setDailyReward] = useState(null);
  const [canClaim, setCanClaim] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkDailyRewardStatus();
  }, []);

  const checkDailyRewardStatus = async () => {
    try {
      const response = await api.get('/game/daily-reward/status');
      setDailyReward(response.reward);
      setCanClaim(response.canClaim);
    } catch (error) {
      console.error('Error checking daily reward status:', error);
    }
  };

  const claimDailyReward = async () => {
    if (!canClaim) return;

    setIsLoading(true);
    try {
      const response = await api.claimDailyReward();
      Alert.alert(
        'Daily Reward Claimed!',
        `You received: ${response.reward.description}`,
        [{ text: 'OK', onPress: () => checkDailyRewardStatus() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to claim daily reward');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkDailyRewardStatus();
    setRefreshing(false);
  };

  const renderRewardCalendar = () => {
    const days = [];
    const currentDay = new Date().getDate();
    
    for (let i = 1; i <= 30; i++) {
      const isClaimed = i < currentDay;
      const isToday = i === currentDay;
      const canClaimToday = isToday && canClaim;
      
      days.push(
        <View
          key={i}
          style={[
            styles.dayBox,
            isClaimed && styles.dayClaimed,
            isToday && styles.dayToday,
            canClaimToday && styles.dayCanClaim,
          ]}
        >
          <Text
            style={[
              styles.dayNumber,
              isClaimed && styles.dayNumberClaimed,
              isToday && styles.dayNumberToday,
            ]}
          >
            {i}
          </Text>
          {isClaimed && <IconSymbol name="checkmark" size={16} color="#fff" />}
          {canClaimToday && (
            <IconSymbol name="gift" size={16} color="#007AFF" />
          )}
        </View>
      );
    }
    
    return days;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Daily Rewards</Text>
        <Text style={styles.subtitle}>
          Claim your rewards every day to build your streak!
        </Text>
      </View>

      <View style={styles.streakContainer}>
        <View style={styles.streakItem}>
          <IconSymbol name="flame" size={24} color="#FF6B6B" />
          <Text style={styles.streakLabel}>Current Streak</Text>
          <Text style={styles.streakValue}>{dailyReward?.currentStreak || 0} days</Text>
        </View>
        <View style={styles.streakItem}>
          <IconSymbol name="calendar" size={24} color="#4ECDC4" />
          <Text style={styles.streakLabel}>Next Reward</Text>
          <Text style={styles.streakValue}>
            {canClaim ? 'Available!' : 'Tomorrow'}
          </Text>
        </View>
      </View>

      <View style={styles.calendarContainer}>
        <Text style={styles.calendarTitle}>Reward Calendar</Text>
        <View style={styles.calendarGrid}>
          {renderRewardCalendar()}
        </View>
      </View>

      {dailyReward && (
        <View style={styles.rewardInfoContainer}>
          <Text style={styles.rewardTitle}>Today's Reward</Text>
          <View style={styles.rewardItem}>
            <IconSymbol name="gift" size={32} color="#FFD93D" />
            <View style={styles.rewardDetails}>
              <Text style={styles.rewardName}>{dailyReward.name}</Text>
              <Text style={styles.rewardDescription}>
                {dailyReward.description}
              </Text>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.claimButton,
          !canClaim && styles.claimButtonDisabled,
          isLoading && styles.claimButtonLoading,
        ]}
        onPress={claimDailyReward}
        disabled={!canClaim || isLoading}
      >
        <Text style={styles.claimButtonText}>
          {isLoading ? 'Claiming...' : canClaim ? 'Claim Daily Reward' : 'Already Claimed'}
        </Text>
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <Text style={styles.infoText}>
          {'\u2022 Claim rewards daily to maintain your streak'}
        </Text>
        <Text style={styles.infoText}>
          {'\u2022 Higher streaks mean better rewards'}
        </Text>
        <Text style={styles.infoText}>
          {'\u2022 Missing a day resets your streak'}
        </Text>
        <Text style={styles.infoText}>
          {'\u2022 Rewards refresh every 24 hours'}
        </Text>
      </View>
    </ScrollView>
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
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  streakItem: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    flex: 1,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streakLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  streakValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  calendarContainer: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayBox: {
    width: '14%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dayClaimed: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  dayToday: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  dayCanClaim: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  dayNumberClaimed: {
    color: '#fff',
  },
  dayNumberToday: {
    color: '#007AFF',
  },
  rewardInfoContainer: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardDetails: {
    marginLeft: 15,
    flex: 1,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  rewardDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  claimButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    marginHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  claimButtonDisabled: {
    backgroundColor: '#ccc',
  },
  claimButtonLoading: {
    backgroundColor: '#0056b3',
  },
  claimButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

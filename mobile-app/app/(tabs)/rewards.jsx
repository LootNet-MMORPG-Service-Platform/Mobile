import React, { useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import authService from '../../services/authService';

const getNextUtcMidnight = () => {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  return next.getTime();
};

const formatCountdown = (ms) => {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function RewardsScreen() {
  const [lastReward, setLastReward] = useState(null);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nowTs, setNowTs] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeLeft = useMemo(() => formatCountdown(getNextUtcMidnight() - nowTs), [nowTs]);

  const claimDailyReward = async () => {
    if (alreadyClaimed) return;
    setIsLoading(true);
    const result = await authService.claimDailyReward();
    if (result.success) {
      setLastReward(result.data);
      setAlreadyClaimed(true);
      Alert.alert('Daily Reward Claimed', `You received ${result.data?.name || 'a new item'}.`);
    } else if (result.error?.toLowerCase().includes('already claimed')) {
      setAlreadyClaimed(true);
    } else {
      Alert.alert('Error', result.error || 'Failed to claim daily reward');
    }
    setIsLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setNowTs(Date.now());
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F4E4C1" />}
    >
      <View style={styles.header}>
        <IconSymbol name="gift" size={42} color="#D6A84F" />
        <Text style={styles.title}>Daily Reward</Text>
        <Text style={styles.subtitle}>Claim once per UTC day.</Text>
      </View>

      <View style={styles.rewardPanel}>
        <View style={styles.rewardIcon}>
          <IconSymbol name="gift" size={52} color="#2C1810" />
        </View>
        <Text style={styles.rewardName}>{lastReward?.name || 'Mystery Loot'}</Text>
        <Text style={styles.rewardDescription}>
          {alreadyClaimed ? `Next reward in ${timeLeft}` : 'Reward goes directly to your inventory.'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.claimButton, (isLoading || alreadyClaimed) && styles.claimButtonDisabled]}
        onPress={claimDailyReward}
        disabled={isLoading || alreadyClaimed}
      >
        <IconSymbol name="gift" size={20} color="#F4E4C1" />
        <Text style={styles.claimButtonText}>
          {isLoading ? 'Claiming...' : alreadyClaimed ? `Available in ${timeLeft}` : 'Claim Daily Reward'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2C1810' },
  header: { alignItems: 'center', padding: 24, backgroundColor: '#1A0E08', borderBottomWidth: 2, borderBottomColor: '#8B7355' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#F4E4C1', marginTop: 10, textTransform: 'uppercase', fontFamily: 'Lato_700Bold' },
  subtitle: { fontSize: 15, color: '#A0826D', textAlign: 'center', marginTop: 6, fontFamily: 'Lato_400Regular' },
  rewardPanel: { margin: 20, padding: 24, alignItems: 'center', backgroundColor: '#3E2723', borderRadius: 8, borderWidth: 1, borderColor: '#8B7355' },
  rewardIcon: { width: 96, height: 96, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#D6A84F', marginBottom: 18 },
  rewardName: { fontSize: 22, fontWeight: 'bold', color: '#F4E4C1', textAlign: 'center', fontFamily: 'Lato_700Bold' },
  rewardDescription: { color: '#A0826D', fontSize: 15, textAlign: 'center', marginTop: 8, fontFamily: 'Lato_400Regular' },
  claimButton: { marginHorizontal: 20, minHeight: 54, borderRadius: 8, backgroundColor: '#8B7355', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 12 },
  claimButtonDisabled: { backgroundColor: '#4C3A32' },
  claimButtonText: { color: '#F4E4C1', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', fontFamily: 'Lato_700Bold' },
});

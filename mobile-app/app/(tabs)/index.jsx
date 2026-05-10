import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import authService from '../../services/authService';

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    const loadDashboard = async () => {
      const [profileResult, equipmentResult] = await Promise.all([
        authService.getMobileProfile(),
        authService.getEquipment(),
      ]);

      if (profileResult.success) {
        setProfile(profileResult.data);
      }

      if (equipmentResult.success) {
        setItemCount(equipmentResult.data?.length || 0);
      }
    };

    loadDashboard();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <IconSymbol name="shield" size={48} color="#D6A84F" />
        <Text style={styles.title}>LootNet</Text>
        <Text style={styles.subtitle}>Welcome back, {profile?.username || 'Player'}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <IconSymbol name="payments" size={28} color="#D6A84F" />
          <Text style={styles.statValue}>{profile?.currency ?? 0}</Text>
          <Text style={styles.statLabel}>Currency</Text>
        </View>
        <View style={styles.statCard}>
          <IconSymbol name="inventory" size={28} color="#D6A84F" />
          <Text style={styles.statValue}>{itemCount}</Text>
          <Text style={styles.statLabel}>Items</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/equipment')}>
          <IconSymbol name="shield" size={24} color="#F4E4C1" />
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Equipment</Text>
            <Text style={styles.actionSubtitle}>Review generated loot</Text>
          </View>
          <IconSymbol name="chevron.right" size={22} color="#D7C0A5" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/rewards')}>
          <IconSymbol name="gift" size={24} color="#F4E4C1" />
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Daily Reward</Text>
            <Text style={styles.actionSubtitle}>Generate today&apos;s item</Text>
          </View>
          <IconSymbol name="chevron.right" size={22} color="#D7C0A5" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/battle')}>
          <IconSymbol name="gamecontroller" size={24} color="#F4E4C1" />
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Battle</Text>
            <Text style={styles.actionSubtitle}>Practice with local bots</Text>
          </View>
          <IconSymbol name="chevron.right" size={22} color="#D7C0A5" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/market')}>
          <IconSymbol name="store" size={24} color="#F4E4C1" />
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Marketplace</Text>
            <Text style={styles.actionSubtitle}>Buy and sell player gear</Text>
          </View>
          <IconSymbol name="chevron.right" size={22} color="#D7C0A5" />
        </TouchableOpacity>
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
    padding: 28,
    backgroundColor: '#1A0E08',
    borderBottomWidth: 2,
    borderBottomColor: '#8B7355',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F4E4C1',
    marginTop: 10,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: '#D7C0A5',
    fontSize: 18,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
  },
  statCard: {
    flex: 1,
    padding: 18,
    backgroundColor: '#3E2723',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B7355',
    alignItems: 'center',
  },
  statValue: {
    color: '#F4E4C1',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: '#D7C0A5',
    fontSize: 16,
    marginTop: 4,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3E2723',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B7355',
    padding: 16,
  },
  actionText: {
    flex: 1,
    marginLeft: 14,
  },
  actionTitle: {
    color: '#F4E4C1',
    fontSize: 19,
    fontWeight: 'bold',
  },
  actionSubtitle: {
    color: '#D7C0A5',
    fontSize: 16,
    marginTop: 2,
  },
});

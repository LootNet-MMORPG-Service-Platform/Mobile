import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState(user);
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    setProfile(user);
  }, [user]);

  const loadDashboard = useCallback(async () => {
    const [profileResult, mainInv, runInv] = await Promise.all([
      authService.getMobileProfile(),
      authService.getInventory('inventory'),
      authService.getInventory('run'),
    ]);

    if (profileResult.success) {
      setProfile(profileResult.data);
    }

    const uniqueItemIds = new Set(
      [...(mainInv.success ? mainInv.data || [] : []), ...(runInv.success ? runInv.data || [] : [])]
        .map((item) => item?.id ?? item?.Id)
        .filter(Boolean),
    );
    setItemCount(uniqueItemIds.size);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoMark}>
          <IconSymbol name="shield" size={34} color="#1A0E08" />
        </View>
        <Text style={styles.title}>LOOTNET</Text>
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
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/equipment')}
        >
          <IconSymbol name="shield" size={24} color="#F4E4C1" />
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Equipment</Text>
            <Text style={styles.actionSubtitle}>Review generated loot</Text>
          </View>
          <IconSymbol name="chevron.right" size={22} color="#A0826D" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/rewards')}
        >
          <IconSymbol name="gift" size={24} color="#F4E4C1" />
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Daily Reward</Text>
            <Text style={styles.actionSubtitle}>Generate today&apos;s item</Text>
          </View>
          <IconSymbol name="chevron.right" size={22} color="#A0826D" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/battle')}>
          <IconSymbol name="gamecontroller" size={24} color="#F4E4C1" />
          <View style={styles.actionText}>
            <Text style={styles.actionTitle}>Adventure</Text>
            <Text style={styles.actionSubtitle}>Go on an adventure</Text>
          </View>
          <IconSymbol name="chevron.right" size={22} color="#A0826D" />
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
    fontSize: 42,
    fontFamily: 'UnifrakturCook_700Bold',
    color: '#F4E4C1',
    marginTop: 8,
  },
  logoMark: {
    width: 62,
    height: 62,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D6A84F',
    borderWidth: 2,
    borderColor: '#F4E4C1',
  },
  subtitle: {
    color: '#A0826D',
    fontSize: 15,
    fontFamily: 'Lato_400Regular',
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
    fontFamily: 'Lato_700Bold',
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: '#A0826D',
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
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
    fontSize: 17,
    fontFamily: 'Lato_700Bold',
    fontWeight: 'bold',
  },
  actionSubtitle: {
    color: '#A0826D',
    fontSize: 13,
    fontFamily: 'Lato_400Regular',
    marginTop: 2,
  },
});

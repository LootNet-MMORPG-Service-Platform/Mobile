import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import authService from '../../services/authService';

export default function ProfileScreen() {
  const router = useRouter();
  const [user] = useState(authService.getUser());
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await authService.logout();
              router.replace('/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: 'person.fill',
      title: 'Account Settings',
      subtitle: 'Update your profile information',
      onPress: () => router.push('/profile/settings'),
    },
    {
      icon: 'shield',
      title: 'Security',
      subtitle: 'Manage password and security settings',
      onPress: () => router.push('/profile/security'),
    },
    {
      icon: 'bell',
      title: 'Notifications',
      subtitle: 'Configure app notifications',
      onPress: () => router.push('/profile/notifications'),
    },
    {
      icon: 'questionmark.circle',
      title: 'Help & Support',
      subtitle: 'Get help with the app',
      onPress: () => router.push('/profile/help'),
    },
    {
      icon: 'doc.text',
      title: 'Terms & Privacy',
      subtitle: 'View terms of service and privacy policy',
      onPress: () => router.push('/profile/terms'),
    },
  ];

  const statsItems = [
    {
      icon: 'gamecontroller',
      label: 'Battles',
      value: '42',
    },
    {
      icon: 'trophy',
      label: 'Victories',
      value: '28',
    },
    {
      icon: 'flame',
      label: 'Streak',
      value: '7',
    },
    {
      icon: 'calendar',
      label: 'Days Active',
      value: '15',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <IconSymbol name="person.fill" size={48} color="#fff" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.username}>{user?.username || 'Player'}</Text>
            <Text style={styles.email}>{user?.email || 'player@example.com'}</Text>
            <Text style={styles.level}>Level {user?.level || 1}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Game Statistics</Text>
        <View style={styles.statsGrid}>
          {statsItems.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <IconSymbol name={stat.icon} size={24} color="#007AFF" />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Settings</Text>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuLeft}>
              <IconSymbol name={item.icon} size={24} color="#666" />
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={16} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.logoutContainer}>
        <TouchableOpacity
          style={[styles.logoutButton, isLoading && styles.logoutButtonDisabled]}
          onPress={handleLogout}
          disabled={isLoading}
        >
          <IconSymbol name="arrow.right.square" size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>
            {isLoading ? 'Logging Out...' : 'Logout'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.version}>Game Companion App v1.0.0</Text>
        <Text style={styles.copyright}>© 2024 MMORPG Companion</Text>
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
    backgroundColor: '#007AFF',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 20,
    flex: 1,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 5,
  },
  level: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: 'bold',
  },
  statsContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  menuContainer: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuText: {
    marginLeft: 15,
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  logoutContainer: {
    margin: 20,
    marginTop: 0,
  },
  logoutButton: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonDisabled: {
    backgroundColor: '#ccc',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  version: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  copyright: {
    fontSize: 12,
    color: '#999',
  },
});

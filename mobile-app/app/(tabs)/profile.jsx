import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';

const roleMap = {
  0: 'Super Admin',
  1: 'Admin',
  2: 'Game Moderator',
  3: 'Player',
};

const resolveProfileImage = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `https://lootnet-api.onrender.com${path}`;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(user);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const result = await authService.getMobileProfile();
      if (result.success) setProfile(result.data);
    })();
  }, []);

  const roleValue = profile?.role ?? user?.role;
  const roleLabel = roleMap[roleValue] || roleValue || 'Player';
  const isPlayer = roleValue === 3 || roleLabel === 'Player';
  const profileImageUri = resolveProfileImage(profile?.profileImagePath);

  const handleLogout = async () => {
    setIsLoading(true);
    await logout();
    setIsLoading(false);
    router.replace('/login');
  };

  const handleChangeProfilePicture = async () => {
    try {
      let ImagePicker;
      try {
        ImagePicker = await import('expo-image-picker');
      } catch {
        Alert.alert('Unavailable', 'Profile pictures are not available right now.');
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission denied', 'Gallery permission is required.');
        return;
      }

      const pick = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.85,
      });

      if (pick.canceled || !pick.assets?.length) {
        return;
      }

      const asset = pick.assets[0];
      const lowerUri = (asset.uri || '').toLowerCase();
      const resolvedMime = asset.mimeType
        || (lowerUri.endsWith('.png') ? 'image/png'
          : lowerUri.endsWith('.webp') ? 'image/webp'
            : 'image/jpeg');
      const resolvedFileName = asset.fileName
        || `profile.${resolvedMime === 'image/png' ? 'png' : resolvedMime === 'image/webp' ? 'webp' : 'jpg'}`;
      const upload = await authService.uploadProfilePicture(
        asset.uri,
        resolvedFileName,
        resolvedMime
      );

      if (!upload.success) {
        Alert.alert('Upload failed', upload.error || 'Unable to upload profile picture.');
        return;
      }

      const refreshed = await authService.getMobileProfile();
      if (refreshed.success) {
        setProfile(refreshed.data);
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Unexpected upload error');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          {profileImageUri ? (
            <Image source={{ uri: profileImageUri }} style={styles.avatarImage} />
          ) : (
            <IconSymbol name="person.fill" size={42} color="#F4E4C1" />
          )}
        </View>
        <Text style={styles.username}>{profile?.username || user?.username || 'Player'}</Text>
        {!isPlayer && <Text style={styles.role}>{roleLabel}</Text>}
        <Text style={styles.currency}>Currency: {profile?.currency ?? 0}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.row} onPress={() => router.push('/reset-password')}>
          <IconSymbol name="lock" size={18} color="#D6A84F" />
          <Text style={styles.rowText}>Reset Password</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.row}
          onPress={handleChangeProfilePicture}
        >
          <IconSymbol name="camera" size={18} color="#D6A84F" />
          <Text style={styles.rowText}>Change Profile Picture</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logoutWrap}>
        <TouchableOpacity style={[styles.logoutBtn, isLoading && styles.logoutDisabled]} disabled={isLoading} onPress={handleLogout}>
          <Text style={styles.logoutText}>{isLoading ? 'Logging out...' : 'Logout'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2C1810' },
  header: { alignItems: 'center', padding: 24, backgroundColor: '#1A0E08', borderBottomWidth: 2, borderBottomColor: '#8B7355' },
  avatar: { width: 86, height: 86, borderRadius: 43, borderWidth: 2, borderColor: '#8B7355', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: '#3E2723' },
  avatarImage: { width: '100%', height: '100%' },
  username: { marginTop: 12, fontSize: 24, fontWeight: 'bold', color: '#F4E4C1', fontFamily: 'Lato_700Bold' },
  role: { marginTop: 6, fontSize: 13, color: '#D6A84F', fontFamily: 'Lato_700Bold' },
  currency: { marginTop: 8, color: '#A0826D', fontFamily: 'Lato_400Regular' },
  section: { margin: 16, backgroundColor: '#3E2723', borderRadius: 10, borderWidth: 1, borderColor: '#8B7355' },
  sectionTitle: { color: '#F4E4C1', fontSize: 16, fontWeight: '700', padding: 14, borderBottomWidth: 1, borderBottomColor: '#8B7355', fontFamily: 'Lato_700Bold' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 10 },
  rowText: { color: '#F4E4C1', fontFamily: 'Lato_400Regular' },
  logoutWrap: { margin: 16 },
  logoutBtn: { backgroundColor: '#8B7355', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  logoutDisabled: { backgroundColor: '#654321' },
  logoutText: { color: '#F4E4C1', fontWeight: '700', fontFamily: 'Lato_700Bold' },
});

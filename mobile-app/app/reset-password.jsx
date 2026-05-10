import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '../contexts/AuthContext';

export default function ResetPasswordScreen() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { resetPassword } = useAuth();

  const handleResetPassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword(oldPassword, newPassword);
      if (result.success) {
        Alert.alert('Success', 'Password changed', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/profile') },
        ]);
      } else {
        Alert.alert('Password Change Failed', result.error || 'Unable to change password');
      }
    } catch (_error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color="#F4E4C1" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <IconSymbol name="lock" size={42} color="#8B7355" />
          <Text style={styles.title}>Change Password</Text>
          <Text style={styles.subtitle}>Update your account password</Text>
        </View>

        <View style={styles.inputContainer}>
          <IconSymbol name="lock" size={20} color="#A0826D" />
          <TextInput
            style={styles.input}
            placeholder="Current password"
            placeholderTextColor="#A0826D"
            value={oldPassword}
            onChangeText={setOldPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <IconSymbol name="lock.reset" size={20} color="#A0826D" />
          <TextInput
            style={styles.input}
            placeholder="New password"
            placeholderTextColor="#A0826D"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <IconSymbol name="checkmark" size={20} color="#A0826D" />
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            placeholderTextColor="#A0826D"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            onSubmitEditing={handleResetPassword}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Changing...' : 'Change Password'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C1810',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    color: '#F4E4C1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F4E4C1',
    marginTop: 12,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 15,
    color: '#A0826D',
    marginTop: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3E2723',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#8B7355',
  },
  input: {
    flex: 1,
    height: 50,
    color: '#F4E4C1',
    fontSize: 16,
    marginLeft: 10,
  },
  button: {
    backgroundColor: '#8B7355',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#654321',
  },
  buttonText: {
    color: '#F4E4C1',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

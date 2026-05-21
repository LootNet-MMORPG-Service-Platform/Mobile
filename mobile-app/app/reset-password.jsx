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
import { usePreventScreenCapture } from 'expo-screen-capture';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '../contexts/AuthContext';
import { isSafeAuthError, validatePassword, validatePasswordConfirmation } from '../utils/security';

export default function ResetPasswordScreen() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { resetPassword } = useAuth();
  usePreventScreenCapture();

  const handleResetPassword = async () => {
    const oldPasswordError = validatePassword(oldPassword, 'Current password');
    const newPasswordError = validatePassword(newPassword, 'New password');
    const confirmationError = validatePasswordConfirmation(newPassword, confirmPassword);

    if (oldPasswordError || newPasswordError || confirmationError) {
      Alert.alert('Error', oldPasswordError || newPasswordError || confirmationError);
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
        Alert.alert('Password Change Failed', isSafeAuthError(result.error) ? result.error : 'Unable to change password');
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
          <IconSymbol name="lock" size={20} color="#D7C0A5" />
          <TextInput
            style={styles.input}
            placeholder="Current password"
            placeholderTextColor="#D7C0A5"
            value={oldPassword}
            onChangeText={setOldPassword}
            secureTextEntry
            textContentType="password"
            autoComplete="password"
            maxLength={128}
          />
        </View>

        <View style={styles.inputContainer}>
          <IconSymbol name="lock.reset" size={20} color="#D7C0A5" />
          <TextInput
            style={styles.input}
            placeholder="New password"
            placeholderTextColor="#D7C0A5"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
            maxLength={128}
          />
        </View>

        <View style={styles.inputContainer}>
          <IconSymbol name="checkmark" size={20} color="#D7C0A5" />
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            placeholderTextColor="#D7C0A5"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textContentType="newPassword"
            autoComplete="new-password"
            maxLength={128}
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
    fontSize: 18,
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
    fontSize: 18,
    color: '#D7C0A5',
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
    fontSize: 18,
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
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

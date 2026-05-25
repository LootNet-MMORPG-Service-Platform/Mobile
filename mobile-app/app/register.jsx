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
import {
  isSafeAuthError,
  sanitizeEmail,
  sanitizeUsername,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateUsername,
} from '../utils/security';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { register } = useAuth();
  usePreventScreenCapture();

  const handleRegister = async () => {
    const cleanUsername = sanitizeUsername(username);
    const cleanEmail = sanitizeEmail(email);
    const usernameError = validateUsername(cleanUsername);
    const emailError = validateEmail(cleanEmail);
    const passwordError = validatePassword(password);
    const confirmationError = validatePasswordConfirmation(password, confirmPassword);

    if (usernameError || emailError || passwordError || confirmationError) {
      Alert.alert('Error', usernameError || emailError || passwordError || confirmationError);
      return;
    }

    setIsLoading(true);
    try {
      const result = await register({
        username: cleanUsername,
        email: cleanEmail,
        password,
      });

      if (result.success) {
        Alert.alert('Success', 'Account created. Check your email before logging in.');
        router.replace('/login');
      } else {
        Alert.alert(
          'Registration Failed',
          isSafeAuthError(result.error) ? result.error : 'Unable to create account.',
        );
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
        <View style={styles.header}>
          <IconSymbol name="shield" size={48} color="#8B7355" />
          <Text style={styles.title}>Join LootNet</Text>
          <Text style={styles.subtitle}>Create your account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <IconSymbol name="person" size={20} color="#D7C0A5" />
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={(value) => setUsername(value.slice(0, 32))}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              textContentType="username"
              autoComplete="username-new"
              maxLength={32}
            />
          </View>

          <View style={styles.inputContainer}>
            <IconSymbol name="email" size={20} color="#D7C0A5" />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={(value) => setEmail(value.slice(0, 256))}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              textContentType="emailAddress"
              autoComplete="email"
              maxLength={256}
            />
          </View>

          <View style={styles.inputContainer}>
            <IconSymbol name="lock" size={20} color="#D7C0A5" />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="next"
              textContentType="newPassword"
              autoComplete="new-password"
              maxLength={128}
            />
          </View>

          <View style={styles.inputContainer}>
            <IconSymbol name="lock" size={20} color="#D7C0A5" />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              returnKeyType="done"
              textContentType="newPassword"
              autoComplete="new-password"
              maxLength={128}
              onSubmitEditing={handleRegister}
            />
          </View>

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.registerButtonText}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.footerLink}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F4E4C1',
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    color: '#D7C0A5',
    marginTop: 5,
    fontStyle: 'italic',
  },
  form: {
    width: '100%',
    maxWidth: 400,
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
  registerButton: {
    backgroundColor: '#8B7355',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonDisabled: {
    backgroundColor: '#654321',
  },
  registerButtonText: {
    color: '#F4E4C1',
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  footer: {
    marginTop: 30,
  },
  footerLink: {
    color: '#D7C0A5',
    fontSize: 16,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});

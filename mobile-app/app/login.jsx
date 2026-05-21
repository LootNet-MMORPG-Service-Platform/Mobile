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
import { isSafeAuthError, sanitizeUsername, validatePassword, validateUsername } from '../utils/security';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  usePreventScreenCapture();

  const handleLogin = async () => {
    const cleanUsername = sanitizeUsername(username);
    const usernameError = validateUsername(cleanUsername);
    const passwordError = validatePassword(password);

    if (usernameError || passwordError) {
      Alert.alert('Error', usernameError || passwordError);
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(cleanUsername, password);
      
      if (result.success) {
        Alert.alert('Success', 'Welcome back!');
        router.replace('/(tabs)');
      } else {
        Alert.alert('Login Failed', isSafeAuthError(result.error) ? result.error : 'Unable to sign in.');
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
          <Text style={styles.title}>LootNet</Text>
          <Text style={styles.subtitle}>Companion App</Text>
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
              autoComplete="username"
              maxLength={32}
            />
          </View>

          <View style={styles.inputContainer}>
            <IconSymbol name="lock" size={20} color="#D7C0A5" />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              textContentType="password"
              autoComplete="password"
              maxLength={128}
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <IconSymbol 
                name={showPassword ? "eye.slash" : "eye"} 
                size={20} 
                color="#D7C0A5" 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.footerLink}>Create Account</Text>
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
  eyeIcon: {
    padding: 10,
  },
  loginButton: {
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
  loginButtonDisabled: {
    backgroundColor: '#654321',
  },
  loginButtonText: {
    color: '#F4E4C1',
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  footerLink: {
    color: '#D7C0A5',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

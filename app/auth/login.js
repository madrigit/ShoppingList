import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import validation from '../utils/validation';
const { isValidEmail, isValidPasswordCharacters } = validation;

// Components
import CustomInput from '../components/CustomInput';
import AuthButton from '../components/AuthButton';
import ErrorMessage from '../components/ErrorMessage';

// Context
import LoadingProvider, { LoadingContext } from '../context/LoadingContext';

// API
import { signInWithEmail, signInWithGoogle, signInWithFacebook } from '../../api/auth';

export default function LoginScreen() {
  const { showLoading, hideLoading } = useContext(LoadingContext);
  const router = useRouter();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [networkError, setNetworkError] = useState('');
  
  // Check if form is valid
  const isFormValid = email.length > 0 && password.length > 0;
  
  // Handle email login
  const handleLogin = async () => {
    // Clear previous errors
    setError('');
    setNetworkError('');
    
    // Validate inputs
    if (!isValidEmail(email) || !isValidPasswordCharacters(password)) {
      setError('Invalid credentials');
      return;
    }
    
    showLoading('Signing in...');
    
    try {
      const result = await signInWithEmail(email, password);
      console.log("Result:", result);
      if (!result.success) {
        // Check if error is related to credentials
        if (result.error.includes('password') || result.error.includes('user')) {
          setError('Invalid credentials');
        } else {
          // Network or other technical error
          setNetworkError('Login failed. Your device or the service may be offline.');
        }
      } else {
        console.log("Successfully logged in");
        router.replace("/(app)");
      }
    } catch (error) {
      console.log(error);
      setNetworkError('Login failed. Your device or the service may be offline.');
    } finally {
      hideLoading();
    }
  };
  
  // Handle Google login
  const handleGoogleLogin = async () => {
    setError('');
    setNetworkError('');
    showLoading('Signing in with Google...');
    
    try {
      const result = await signInWithGoogle();
      
      if (!result.success) {
        setNetworkError('Login failed. Please try again.');
      }
    } catch (error) {
      setNetworkError('Login failed. Your device or the service may be offline.');
    } finally {
      hideLoading();
    }
  };
  
  // Handle Facebook login
  const handleFacebookLogin = async () => {
    setError('');
    setNetworkError('');
    showLoading('Signing in with Facebook...');
    
    try {
      const result = await signInWithFacebook();
      
      if (!result.success) {
        setNetworkError('Login failed. Please try again.');
      }
    } catch (error) {
      setNetworkError('Login failed. Your device or the service may be offline.');
    } finally {
      hideLoading();
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>
          
          <View style={styles.formContainer}>
            <CustomInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <CustomInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry={true}
              maxLength={50}
            />
            
            {error ? <ErrorMessage message={error} /> : null}
            
            <AuthButton
              title="Sign In"
              onPress={handleLogin}
              disabled={!isFormValid}
            />
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign in with</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <View style={styles.socialButtons}>
              <AuthButton
                title="Google"
                onPress={handleGoogleLogin}
                type="google"
              />
              
              <AuthButton
                title="Facebook"
                onPress={handleFacebookLogin}
                type="facebook"
              />
            </View>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/auth/signup" asChild>
              <TouchableOpacity>
                <Text style={styles.signupText}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
          
          {networkError ? (
            <ErrorMessage 
              message={networkError} 
              autoHide={true}
              style={styles.networkError}
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    marginBottom: 32,
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
  },
  formContainer: {
    width: '100%',
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  signupText: {
    fontSize: 14,
    color: '#6200ee',
    fontWeight: '500',
  },
  networkError: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
});
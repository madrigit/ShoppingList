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
const { isValidName, isValidEmail, isValidPassword } = validation;

// Components
import CustomInput from '../components/CustomInput';
import PasswordValidator from '../components/PasswordValidator';
import AuthButton from '../components/AuthButton';
import ErrorMessage from '../components/ErrorMessage';

// Context
import LoadingProvider, { LoadingContext } from '../context/LoadingContext';

// API
import { signUpWithEmail, signInWithGoogle, signInWithFacebook } from '../../api/auth';

export default function SignupScreen() {
  const { showLoading, hideLoading } = useContext(LoadingContext);
  const router = useRouter();
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    general: ''
  });
  const [networkError, setNetworkError] = useState('');
  
  // Handle form validation
  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      name: '',
      email: '',
      password: '',
      general: ''
    };
    
    // Validate name
    if (!name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    } else if (!isValidName(name)) {
      newErrors.name = 'Name can only contain letters, spaces, and hyphens';
      isValid = false;
    } else if (name.length > 50) {
      newErrors.name = 'Name must be 50 characters or less';
      isValid = false;
    }
    
    // Validate email
    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Invalid email address';
      isValid = false;
    }
    
    // Validate password
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (!isValidPassword(password)) {
      newErrors.password = 'Invalid password';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Handle signup with email/password
  const handleSignup = async () => {
    // Clear previous errors
    setNetworkError('');
    
    // Validate the form
    if (!validateForm()) {
      return;
    }
    
    showLoading('Creating account...');
    
    try {
      const result = await signUpWithEmail(email, password, name);
      
      if (!result.success) {
        // Handle specific errors
        if (result.error.includes('email-already-in-use')) {
          setErrors(prev => ({
            ...prev,
            email: 'Email is already in use'
          }));
        } else if (result.error.includes('invalid-email')) {
          setErrors(prev => ({
            ...prev,
            email: 'Invalid email address'
          }));
        } else if (result.error.includes('weak-password')) {
          setErrors(prev => ({
            ...prev,
            password: 'Password is too weak'
          }));
        } else {
          // Network or other technical error
          setNetworkError('Sign up failed. Your device or the service may be offline.');
        }
      } else {
        router.replace("/(app)");
      }
    } catch (error) {
      setNetworkError('Sign up failed. Your device or the service may be offline.');
    } finally {
      hideLoading();
    }
  };
  
  // Handle Google signup
  const handleGoogleSignup = async () => {
    setNetworkError('');
    showLoading('Signing up with Google...');
    
    try {
      const result = await signInWithGoogle();
      
      if (!result.success) {
        setNetworkError('Sign up failed. Please try again.');
      }
    } catch (error) {
      setNetworkError('Sign up failed. Your device or the service may be offline.');
    } finally {
      hideLoading();
    }
  };
  
  // Handle Facebook signup
  const handleFacebookSignup = async () => {
    setNetworkError('');
    showLoading('Signing up with Facebook...');
    
    try {
      const result = await signInWithFacebook();
      
      if (!result.success) {
        setNetworkError('Sign up failed. Please try again.');
      }
    } catch (error) {
      setNetworkError('Sign up failed. Your device or the service may be offline.');
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
          <Link href="/auth/login" asChild>
            <TouchableOpacity style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back to Login</Text>
            </TouchableOpacity>
          </Link>
          
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>
          
          <View style={styles.formContainer}>
            <CustomInput
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              autoCapitalize="words"
              maxLength={50}
              error={errors.name}
            />
            
            <CustomInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            
            <CustomInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              secureTextEntry={true}
              maxLength={50}
              error={errors.password}
              isPassword={true}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
            
            <PasswordValidator 
              password={password} 
              visible={passwordFocused}
            />
            
            {errors.general ? <ErrorMessage message={errors.general} /> : null}
            
            <AuthButton
              title="Sign Up"
              onPress={handleSignup}
              disabled={!name || !email || !password}
            />
            
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign up with</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <View style={styles.socialButtons}>
              <AuthButton
                title="Google"
                onPress={handleGoogleSignup}
                type="google"
              />
              
              <AuthButton
                title="Facebook"
                onPress={handleFacebookSignup}
                type="facebook"
              />
            </View>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/auth/login" asChild>
              <TouchableOpacity>
                <Text style={styles.loginText}>Sign In</Text>
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
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6200ee',
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
  loginText: {
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
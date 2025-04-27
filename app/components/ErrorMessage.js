import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const ErrorMessage = ({ message, type = 'error', timeout = 5000, style, autoHide = false }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  
  useEffect(() => {
    if (!message) return;
    
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Auto hide after timeout if enabled
    if (autoHide) {
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, timeout);
      
      return () => clearTimeout(timer);
    }
  }, [message, autoHide, timeout, fadeAnim]);
  
  if (!message) return null;
  
  return (
    <Animated.View 
      style={[
        styles.container,
        type === 'error' ? styles.errorContainer : styles.infoContainer,
        { opacity: fadeAnim },
        style
      ]}
    >
      <Text style={[
        styles.message,
        type === 'error' ? styles.errorText : styles.infoText
      ]}>
        {message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 4,
    marginVertical: 8,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  infoContainer: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  message: {
    fontSize: 14,
  },
  errorText: {
    color: '#D32F2F',
  },
  infoText: {
    color: '#1976D2',
  }
});

export default ErrorMessage;
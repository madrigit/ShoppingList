import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const AuthButton = ({ 
  title, 
  onPress, 
  type = 'primary', 
  disabled = false,
  isLoading = false,
  icon = null,
  style,
  textStyle,
  ...props 
}) => {
  // Button style based on type
  const getButtonStyle = () => {
    switch(type) {
      case 'google':
        return styles.googleButton;
      case 'facebook':
        return styles.facebookButton;
      case 'secondary':
        return styles.secondaryButton;
      case 'primary':
      default:
        return styles.primaryButton;
    }
  };

  // Text style based on type
  const getTextStyle = () => {
    switch(type) {
      case 'google':
      case 'facebook':
      case 'secondary':
        return styles.darkText;
      case 'primary':
      default:
        return styles.lightText;
    }
  };

  // Icon based on type
  const getIcon = () => {
    if (icon) return icon;
    
    switch(type) {
      case 'google':
        return <FontAwesome name="google" size={18} color="#444" style={styles.icon} />;
      case 'facebook':
        return <FontAwesome name="facebook" size={18} color="#444" style={styles.icon} />;
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        disabled && styles.disabledButton,
        style
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={type === 'primary' ? '#fff' : '#333'} />
      ) : (
        <>
          {getIcon()}
          <Text 
            style={[
              styles.text, 
              getTextStyle(),
              disabled && styles.disabledText,
              textStyle
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 4,
    minWidth: 120,
    marginVertical: 8,
  },
  primaryButton: {
    backgroundColor: '#6200ee',
  },
  secondaryButton: {
    backgroundColor: '#f2f2f2',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  facebookButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
    borderColor: '#ccc',
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
  lightText: {
    color: '#fff',
  },
  darkText: {
    color: '#333',
  },
  disabledText: {
    color: '#9e9e9e',
  },
  icon: {
    marginRight: 8,
  }
});

export default AuthButton;
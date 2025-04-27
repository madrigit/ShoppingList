import React, { useContext } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';
import LoadingProvider, { LoadingContext } from '../context/LoadingContext';

const LoadingSpinner = () => {
  const { isLoading, loadingMessage } = useContext(LoadingContext);

  if (!isLoading) return null;

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={isLoading}
    >
      <View style={styles.spinnerContainerContainer}>
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          {loadingMessage && <Text style={styles.message}>{loadingMessage}</Text>}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  spinnerContainerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  spinnerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
});

export default LoadingSpinner;
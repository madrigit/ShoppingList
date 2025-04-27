import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PasswordValidator = ({ password, visible = false }) => {
  const [rules, setRules] = useState([
    { id: 'length', message: 'Between 8 and 50 characters', valid: false },
    { id: 'uppercase', message: 'At least 1 uppercase letter', valid: false },
    { id: 'lowercase', message: 'At least 1 lowercase letter', valid: false },
    { id: 'number', message: 'At least 1 number', valid: false },
    { id: 'special', message: 'Only alphanumeric characters plus !@$%^&+#', valid: false },
  ]);

  useEffect(() => {
    if (!password) {
      // Reset all rules to invalid when password is empty
      setRules(prevRules => 
        prevRules.map(rule => ({ ...rule, valid: false }))
      );
      return;
    }

    // Create updated rules
    const updatedRules = [
      {
        id: 'length',
        message: 'Between 8 and 50 characters',
        valid: password.length >= 8 && password.length <= 50,
      },
      {
        id: 'uppercase',
        message: 'At least 1 uppercase letter',
        valid: /[A-Z]/.test(password),
      },
      {
        id: 'lowercase',
        message: 'At least 1 lowercase letter',
        valid: /[a-z]/.test(password),
      },
      {
        id: 'number',
        message: 'At least 1 number',
        valid: /[0-9]/.test(password),
      },
      {
        id: 'special',
        message: 'Only alphanumeric characters plus !@$%^&+#',
        valid: /^[a-zA-Z0-9!@$%^&+#]*$/.test(password),
      },
    ];

    setRules(updatedRules);
  }, [password]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Password requirements:</Text>
      {rules.map((rule) => (
        <View key={rule.id} style={styles.ruleContainer}>
          <Text
            style={[
              styles.ruleText,
              { color: rule.valid ? '#4CAF50' : '#F44336' }
            ]}
          >
            • {rule.message}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  ruleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  ruleText: {
    fontSize: 12,
  },
});

export default PasswordValidator;
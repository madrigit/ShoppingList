// Validate email with regex
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Validate name (alphabetical characters, spaces and hyphens only)
const isValidName = (name) => {
    const nameRegex = /^[a-zA-Z\s-]*$/;
    return nameRegex.test(name);
  };
  
  // Validate password characters (alphanumeric plus specific symbols)
const isValidPasswordCharacters = (password) => {
    const passwordRegex = /^[a-zA-Z0-9!@$%^&+#]*$/;
    return passwordRegex.test(password);
  };
  
  // Check if password has at least one uppercase letter
const hasUppercase = (password) => {
    return /[A-Z]/.test(password);
  };
  
  // Check if password has at least one lowercase letter
const hasLowercase = (password) => {
    return /[a-z]/.test(password);
  };
  
  // Check if password has at least one number
const hasNumber = (password) => {
    return /[0-9]/.test(password);
  };
  
  // Check if password length is between min and max
const hasValidLength = (password, min = 8, max = 50) => {
    return password.length >= min && password.length <= max;
  };
  
  // Validate complete password
const isValidPassword = (password) => {
    return (
      hasValidLength(password) &&
      hasUppercase(password) &&
      hasLowercase(password) &&
      hasNumber(password) &&
      isValidPasswordCharacters(password)
    );
  };

// app/utils/validation.js
// Keep your existing functions first

// ... existing validation functions ...

// Then create a component and export it as default
const validation = () => {
  return null; // Empty component since this is just for utilities
};

// Attach all of your utility functions to the component
validation.isValidEmail = isValidEmail;
validation.isValidName = isValidName;
validation.isValidPasswordCharacters = isValidPasswordCharacters;
validation.hasUppercase = hasUppercase;
validation.hasLowercase = hasLowercase;
validation.hasNumber = hasNumber;
validation.hasValidLength = hasValidLength;
validation.isValidPassword = isValidPassword;

// Continue to export individual functions for convenience
export {
  isValidEmail,
  isValidName,
  isValidPasswordCharacters,
  hasUppercase,
  hasLowercase,
  hasNumber,
  hasValidLength,
  isValidPassword
};

export default validation;
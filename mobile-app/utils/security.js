const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,32}$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

export const sanitizeUsername = (value = '') => value.trim().slice(0, 32);

export const validateUsername = (value) => {
  const username = sanitizeUsername(value);

  if (!username) {
    return 'Username is required.';
  }

  if (!USERNAME_PATTERN.test(username)) {
    return 'Username must be 3-32 characters and use only letters, numbers, dot, dash or underscore.';
  }

  return null;
};

export const validatePassword = (value, label = 'Password') => {
  if (!value) {
    return `${label} is required.`;
  }

  if (value.length < PASSWORD_MIN_LENGTH) {
    return `${label} must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }

  if (value.length > PASSWORD_MAX_LENGTH) {
    return `${label} must be no longer than ${PASSWORD_MAX_LENGTH} characters.`;
  }

  if (/\s/.test(value)) {
    return `${label} cannot contain whitespace.`;
  }

  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return `${label} must contain at least one letter and one number.`;
  }

  return null;
};

export const validatePasswordConfirmation = (password, confirmation) => {
  if (password !== confirmation) {
    return 'Passwords do not match.';
  }

  return null;
};

export const isSafeAuthError = (message) => (
  typeof message === 'string' &&
  message.length <= 220 &&
  !/Bearer\s+|https?:\/\/|authToken|refreshToken/i.test(message)
);
/**
 * Email validation regex
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Password validation: at least 6 characters and a number
 */
export const isValidPassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[0-9]).{6,}$/;
  return passwordRegex.test(password);
};

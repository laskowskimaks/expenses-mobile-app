export const validateEmail = (email) => {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const validatePassword = (password, minLength = 6) => {
  if (!password) return false;
  return password.length >= minLength;
};

export const validateCredentials = (email, password) => {
    if (!email && !password) {
        return { isValid: false, message: 'Podaj e-mail i hasło!' };
    }
    if (!email) {
        return { isValid: false, message: 'Wprowadź adres e-mail!' };
    }
    if (!validateEmail(email)) {
        return { isValid: false, message: 'Niepoprawny adres e-mail!' };
    }
    if (!password) {
        return { isValid: false, message: 'Wprowadź hasło!' };
    }
    if (!validatePassword(password)) {
        return { isValid: false, message: 'Hasło musi mieć co najmniej 6 znaków!' };
    }

    return { isValid: true, message: null };
};
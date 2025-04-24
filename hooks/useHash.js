import * as Crypto from 'expo-crypto';

export const generateSalt = () =>
  Math.random().toString(36).substring(2, 15);

export const hashPassword = async (password, salt) => {
  try {
    const result = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password + salt
    );
    return result;
  } catch (error) {
    console.log('[useHash]: Error hashing password:', error);
    throw error;
  }
};

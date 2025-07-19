import * as Crypto from 'expo-crypto';

export const generateSalt = (byteCount = 16) => {
  const randomBytes = Crypto.getRandomBytes(byteCount);
  return Array.from(randomBytes).map(byte => byte.toString(16).padStart(2, '0')).join('');
};

export const hashData = async (data, salt) => {
  try {
    const result = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data + salt,
    );
    return result;
  } catch (error) {
    console.error('[cryptoUtils]: Błąd podczas hashowania danych:', error);
    throw error;
  }
};

export const createUser = async (db, email, hashedPassword, salt) => {
  try {
    await db.runAsync(
      'INSERT INTO users (email, password, salt) VALUES (?, ?, ?);',
      email,
      hashedPassword,
      salt
    );
    console.log('[authService] User created:', email);
    return true;
  } catch (error) {
    console.error('[authService] Create user failed:', error);
    return false;
  }
};

export const getUserByEmail = async (db, email) => {
  try {
    const user = await db.getFirstAsync(
      'SELECT * FROM users WHERE email = ?;',
      email
    );
    console.log('[authService] User fetched:', email);
    return user;
  } catch (error) {
    console.error('[authService] Get user failed:', error);
    return null;
  }
};

export const getUserById = async (db, id) => {
  return await db.getFirstAsync('SELECT * FROM users WHERE id = ?;', id);
};

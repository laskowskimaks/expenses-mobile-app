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
    console.log('[authService] Create user failed:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      console.log('[authService] Email already registered:', email);
      alert('Nazwa użytkownika już zajęta');
    } else {
      console.log('[authService] Create user error:', error);
      alert('Wystąpił błąd podczas rejestracji.');
    }
    return false;
  }
};

export const getUserByEmail = async (db, email) => {
  try {
    const user = await db.getFirstAsync(
      'SELECT * FROM users WHERE email = ?;',
      email
    );
    if (!user) {
      console.log('[authService] No user found with email:', email);
    } else {
      console.log('[authService] User fetched:', email);
    }
    return user;
  } catch (error) {
    console.error('[authService]  user faiGetled:', error);
    return null;
  }
};

export const getUserById = async (db, id) => {
  return await db.getFirstAsync('SELECT * FROM users WHERE id = ?;', id);
};

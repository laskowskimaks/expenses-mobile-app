export const createUser = async (db, username, hashedPassword, salt) => {
  try {
    await db.runAsync(
      'INSERT INTO users (username, password, salt) VALUES (?, ?, ?);',
      username,
      hashedPassword,
      salt
    );
    console.log('[authService] User created:', username);
    return true;
  } catch (error) {
    console.log('[authService] Create user failed:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      console.log('[authService] Username already registered:', username);
      alert('Nazwa użytkownika już zajęta');
    } else {
      console.log('[authService] Create user error:', error);
      alert('Wystąpił błąd podczas rejestracji.');
    }
    return false;
  }
};

export const getUserByUsername = async (db, username) => {
  try {
    const user = await db.getFirstAsync(
      'SELECT * FROM users WHERE username = ?;',
      username
    );
    if (!user) {
      console.log('[authService] No user found with username:', username);
    } else {
      console.log('[authService] User fetched:', username);
    }
    return user;
  } catch (error) {
    console.log('[authService] Get user failed:', error);
    return null;
  }
};

export const getUserById = async (db, id) => {
  try {
    const user = await db.getFirstAsync('SELECT * FROM users WHERE id = ?;', id);
    if (!user) {
      console.log('[authService] No user found with id:', id);
    } else {
      console.log('[authService] User fetched by id:', id);
    }
    return user;
  } catch (error) {
    console.log('[authService] Get user by id failed:', error);
    return null;
  }
};

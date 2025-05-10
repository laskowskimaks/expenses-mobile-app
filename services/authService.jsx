import { users } from "@/database/schema";
import { eq } from 'drizzle-orm';

export const createUser = async (db, username, hashedPassword, salt) => {

  try {
    await db.insert(users).values({
      username,
      password: hashedPassword,
      salt,
    });
    console.log('[authService] User created:', username);
    return true;
  } catch (error) {
    console.error('[authService] Create user failed:', error);
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
    const user = await db.select().from(users).where(eq(users.username, username)).get();


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
    const user = await db.select().from(users).where(eq(users.id, id)).get();
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

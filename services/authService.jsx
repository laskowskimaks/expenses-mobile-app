import { users } from "@/database/schema";
import { eq } from 'drizzle-orm';
import { generateSalt, hashPassword } from '../hooks/useHash';

export const getAllUsers = async (db) => {
  try {
    const usersList = await db.select().from(users).all();
    return usersList;
  } catch (error) {
    console.error('[authService] Get all users failed:', error);
    return [];
  }
};

export const createUser = async (db, email, plainPassword) => {
  try {
    const salt = generateSalt();
    const hashedPassword = hashPassword(plainPassword, salt);

    await db.insert(users).values({
      email,
      password: hashedPassword,
      salt,
    }).execute();

    console.log('[authService] User created:', email);
    return true;
  } catch (error) {
    console.error('[authService] Create user failed:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      console.log('[authService] email already registered:', email);
      alert('Nazwa użytkownika już zajęta');
    } else {
      console.log('[authService] Create user error:', error);
      alert('Wystąpił błąd podczas rejestracji.');
    }
    return false;
  }
};

export const getUserByemail = async (db, email) => {
  try {
    const user = await db.select().from(users).where(eq(users.email, email)).get();

    if (!user) {
      console.log('[authService] No user found with email:', email);
    } else {
      console.log('[authService] User fetched:', email);
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

import { users } from "@/database/schema";
import { eq } from 'drizzle-orm';
import { generateSalt, hashData } from '../utils/hashUtils';

export const getAllUsers = async (db) => {
  try {
    const usersList = await db.select().from(users).all();
    return usersList;
  } catch (error) {
    console.error('[authService] Pobieranie wszystkich użytkowników nie powiodło się:', error);
    return [];
  }
};

export const createUser = async (db, email, plainPassword) => {
  try {
    const passwordSalt = generateSalt();
    const hashedPassword = await hashData(plainPassword, passwordSalt);

    await db.insert(users).values({
      email,
      password: hashedPassword,
      passwordSalt,
    }).execute();

    console.log('[authService] Użytkownik utworzony:', email);
    return true;
  } catch (error) {
    console.error('[authService] Tworzenie użytkownika nie powiodło się:', error);

    if (error.message.includes('UNIQUE constraint failed')) {
      console.log('[authService] email już zarejestrowany:', email);
      alert('Nazwa użytkownika już zajęta');
    } else {
      console.log('[authService] Błąd podczas tworzenia użytkownika:', error);
      alert('Wystąpił błąd podczas rejestracji.');
    }
    return false;
  }
};

export const getUserByemail = async (db, email) => {
  try {
    const user = await db.select().from(users).where(eq(users.email, email)).get();

    if (!user) {
      console.log('[authService] Nie znaleziono użytkownika o emailu:', email);
    } else {
      console.log('[authService] Użytkownik pobrany:', email);
    }
    return user;
  } catch (error) {
    console.log('[authService] Pobieranie użytkownika nie powiodło się:', error);
    return null;
  }
};

export const getUserById = async (db, id) => {
  try {
    const user = await db.select().from(users).where(eq(users.id, id)).get();
    if (!user) {
      console.log('[authService] Nie znaleziono użytkownika o id:', id);
    } else {
      console.log('[authService] Użytkownik pobrany po id:', id);
    }
    return user;
  } catch (error) {
    console.log('[authService] Pobieranie użytkownika po id nie powiodło się:', error);
    return null;
  }
};

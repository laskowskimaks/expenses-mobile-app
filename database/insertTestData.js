import { loyaltyCards, periodicTransactions, transactions } from '@/database/schema';
import { getCurrentTimestamp } from '@/utils/dateUtils';

export const insertTestData = async (db) => {
  try {
    console.log('[TestData] Rozpoczynam dodawanie testowych danych...');

    const currentTimestamp = getCurrentTimestamp();

    const daysAgo = (days) => currentTimestamp - (days * 24 * 60 * 60);
    const hoursAgo = (hours) => currentTimestamp - (hours * 60 * 60);
    const monthsAgo = (months) => {
      const date = new Date();
      date.setMonth(date.getMonth() - months);
      return Math.floor(date.getTime() / 1000);
    };

    // 1. Loyalty Cards
    const loyaltyCardsData = [
      { name: 'Moja Biedronka', cardNumber: '9876543210987', barcodeData: '9876543210987', barcodeFormat: 'EAN_13', notes: 'Główna karta na zakupy spożywcze' },
      { name: 'Lidl Plus', cardNumber: null, barcodeData: 'qr-code-data-string-lidl', barcodeFormat: 'QR_CODE', notes: 'Aplikacja w telefonie' },
      { name: 'Rossmann Klub', cardNumber: '1122334455', barcodeData: '1122334455', barcodeFormat: 'CODE_128', notes: null },
      { name: 'Orlen Vitay', cardNumber: '01230000456789', barcodeData: '01230000456789', barcodeFormat: 'EAN_13', notes: 'Karta do tankowania' }
    ];

    for (const card of loyaltyCardsData) {
      await db.insert(loyaltyCards).values(card).execute();
    }

    // 2. Periodic Transactions
    const periodicData = [
      {
        amount: -2250.00,
        title: 'Rata kredytu hipotecznego',
        categoryId: 8,
        repeatInterval: 1,
        repeatUnit: 'month',
        startDate: monthsAgo(6),
        nextOccurrenceDate: daysAgo(5),
        endDate: null,
        notes: 'Kredyt na mieszkanie - rata stała'
      },
      {
        amount: -149.99,
        title: 'Karnet na siłownię',
        categoryId: 4,
        repeatInterval: 1,
        repeatUnit: 'month',
        startDate: monthsAgo(3),
        nextOccurrenceDate: daysAgo(4),
        endDate: null,
        notes: 'Karnet miesięczny na siłownię'
      },
      {
        amount: -43.00,
        title: 'Subskrypcja Netflix',
        categoryId: 6,
        repeatInterval: 1,
        repeatUnit: 'month',
        startDate: monthsAgo(4),
        nextOccurrenceDate: daysAgo(3),
        endDate: null,
        notes: 'Subskrypcja Netflix'
      },
      {
        amount: -19.99,
        title: 'Subskrypcja Spotify',
        categoryId: 6,
        repeatInterval: 1,
        repeatUnit: 'month',
        startDate: monthsAgo(3),
        nextOccurrenceDate: daysAgo(2),
        endDate: null,
        notes: 'Subskrypcja Spotify'
      },
      {
        amount: -89.00,
        title: 'Internet i TV',
        categoryId: 2,
        repeatInterval: 1,
        repeatUnit: 'month',
        startDate: monthsAgo(4),
        nextOccurrenceDate: daysAgo(1),
        endDate: null,
        notes: 'Internet i TV'
      },
      {
        amount: -65.00,
        title: 'Abonament telefoniczny',
        categoryId: 2,
        repeatInterval: 1,
        repeatUnit: 'month',
        startDate: monthsAgo(2),
        nextOccurrenceDate: currentTimestamp,
        endDate: null,
        notes: 'Abonament telefoniczny'
      }
    ];

    for (const periodic of periodicData) {
      await db.insert(periodicTransactions).values(periodic).execute();
    }

    // 3. Transactions - ostatnie 60 dni
    const transactionsData = [
      { amount: -65.10, title: 'Zakupy w Żabce', transactionDate: hoursAgo(2), categoryId: 1, notes: 'Szybkie zakupy po pracy', location: 'Żabka' },
      { amount: -6.00, title: 'Bilet normalny 75-min', transactionDate: hoursAgo(5), categoryId: 3, notes: null, location: 'MPK App' },

      { amount: -300.00, title: 'Zaliczka na wakacje', transactionDate: daysAgo(1), categoryId: 9, notes: 'Opłata za hotel', location: 'Booking.com' },
      { amount: -32.50, title: 'Domowe środki czystości', transactionDate: daysAgo(1), categoryId: 2, notes: 'Płyn do naczyń, gąbki', location: 'Carrefour Express' },

      { amount: -18.00, title: 'Frytki belgijskie', transactionDate: daysAgo(2), categoryId: 1, notes: 'Przekąska na mieście', location: 'Frytkownia' },
      { amount: -45.99, title: 'Książka', transactionDate: daysAgo(2), categoryId: 5, notes: 'Nowy kryminał', location: 'Świat Książki' },

      { amount: -45.00, title: 'Pralnia chemiczna', transactionDate: daysAgo(3), categoryId: 2, notes: 'Czyszczenie garnituru', location: '5-a-sec' },
      { amount: -18.20, title: 'Przejazd hulajnogą', transactionDate: daysAgo(3), categoryId: 3, notes: 'Szybki dojazd na spotkanie', location: 'Bolt' },

      { amount: -120.00, title: 'Wizyta u fizjoterapeuty', transactionDate: daysAgo(7), categoryId: 4, notes: 'Kontrola pleców', location: 'Centrum Medyczne LUX MED' },
      { amount: -40.00, title: 'Obiad na mieście', transactionDate: daysAgo(7), categoryId: 1, notes: 'Szybki lunch', location: 'Bar Mleczny' },

      { amount: -55.00, title: 'Apteczka domowa', transactionDate: daysAgo(14), categoryId: 4, notes: 'Plastry, środki przeciwbólowe', location: 'Apteka Super-Pharm' },
      { amount: -15.00, title: 'Lody', transactionDate: daysAgo(14), categoryId: 1, notes: null, location: 'Lodziarnia "Grycan"' },

      { amount: 5200.00, title: 'Wynagrodzenie', transactionDate: daysAgo(30), categoryId: 8, notes: 'Pensja za poprzedni miesiąc', location: 'Pracodawca S.A.' },
      { amount: -150.00, title: 'Prezent urodzinowy dla mamy', transactionDate: daysAgo(30), categoryId: 9, notes: null, location: 'Empik' },
      { amount: -55.40, title: 'Jedzenie z dostawą', transactionDate: daysAgo(30), categoryId: 1, notes: 'Zamówienie wieczorem', location: 'Pyszne.pl / Uber Eats' },

      { amount: -95.60, title: 'Zakupy', transactionDate: daysAgo(35), categoryId: 1, notes: 'Małe zakupy i coś na grilla', location: 'Lidl' },
      { amount: -8.80, title: 'Bilety komunikacji miejskiej', transactionDate: daysAgo(35), categoryId: 3, notes: '2 x 20-minutowy', location: 'Automat biletowy' },

      { amount: -45.00, title: 'Rachunek za gaz', transactionDate: daysAgo(42), categoryId: 2, notes: 'Wyrównanie', location: 'PGNiG' },
      { amount: -4.40, title: 'Bilet komunikacji miejskiej', transactionDate: daysAgo(42), categoryId: 3, notes: null, location: 'Automat biletowy' },

      { amount: -112.50, title: 'Etui na telefon i szkło', transactionDate: daysAgo(49), categoryId: 7, notes: 'Zamówienie online', location: 'Allegro' },
      { amount: -17.30, title: 'Warzywa i owoce', transactionDate: daysAgo(49), categoryId: 1, notes: null, location: 'Lokalny ryneczek' },

      { amount: 5200.00, title: 'Wynagrodzenie', transactionDate: daysAgo(60), categoryId: 8, notes: 'Pensja za 2 miesiące temu', location: 'Pracodawca S.A.' },
      { amount: -222.80, title: 'Zakupy spożywcze', transactionDate: daysAgo(60), categoryId: 1, notes: 'Duże zakupy', location: 'Auchan' },
      { amount: -28.00, title: 'Karma dla kota', transactionDate: daysAgo(58), categoryId: 9, notes: 'Sucha karma 1.5kg', location: 'Zooplus.pl' },
      { amount: -79.99, title: 'Gra na Steam', transactionDate: daysAgo(57), categoryId: 6, notes: 'Wyprzedaż letnia', location: 'Steam Store' },
      { amount: -38.00, title: 'Myjnia samochodowa', transactionDate: daysAgo(55), categoryId: 3, notes: null, location: 'Myjnia bezdotykowa' },
      { amount: -10.00, title: 'Opłata za prowadzenie konta', transactionDate: daysAgo(54), categoryId: 8, notes: 'Opłata miesięczna', location: 'mBank' },
      { amount: -310.80, title: 'Tankowanie samochodu', transactionDate: daysAgo(52), categoryId: 3, notes: 'Do pełna', location: 'BP' },
      { amount: -30.00, title: 'Darowizna na schronisko', transactionDate: daysAgo(50), categoryId: 9, notes: 'Wsparcie dla zwierząt', location: 'Schronisko "Na Paluchu"' }
    ];

    for (const transaction of transactionsData) {
      await db.insert(transactions).values(transaction).execute();
    }

    console.log('[TestData] Testowe dane zostały dodane pomyślnie!');
    return { success: true, message: 'Testowe dane zostały dodane pomyślnie!' };

  } catch (error) {
    console.error('[TestData] Błąd podczas dodawania testowych danych:', error);
    return { success: false, message: 'Błąd podczas dodawania testowych danych: ' + error.message };
  }
};
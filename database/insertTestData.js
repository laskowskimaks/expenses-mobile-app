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
      { name: 'Moja Biedronka', barcodeData: '9876543210987', barcodeFormat: 'ean13', notes: 'Główna karta na zakupy spożywcze' },
      { name: 'Lidl Plus', barcodeData: 'qr-code-data-string-lidl', barcodeFormat: 'qr', notes: 'Aplikacja w telefonie' },
      { name: 'Rossmann Klub', barcodeData: '1122334455', barcodeFormat: 'code128', notes: null },
      { name: 'Orlen Vitay', barcodeData: '10230000456789', barcodeFormat: 'ean13', notes: 'Karta do tankowania' }
    ];

    for (const card of loyaltyCardsData) {
      await db.insert(loyaltyCards).values(card).execute();
    }

    // 2. Periodic Transactions
    const periodicData = [
      {
        amount: -2250.00,
        title: 'Rata kredytu hipotecznego',
        categoryId: 8, // Dom
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
        categoryId: 6, // Zdrowie
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
        categoryId: 4, // Rozrywka i kultura
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
        categoryId: 4, // Rozrywka i kultura
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
        categoryId: 8, // Dom
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
        categoryId: 8, // Dom
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
      { amount: -65.10, title: 'Zakupy w Żabce', transactionDate: hoursAgo(2), categoryId: 9, notes: 'Szybkie zakupy po pracy', location: 'Żabka' }, // Żywność
      { amount: -6.00, title: 'Bilet normalny 75-min', transactionDate: hoursAgo(5), categoryId: 7, notes: null, location: 'MPK App' }, // Transport

      { amount: -300.00, title: 'Zaliczka na wakacje', transactionDate: daysAgo(1), categoryId: 4, notes: 'Opłata za hotel', location: 'Booking.com' }, // Rozrywka i kultura
      { amount: -32.50, title: 'Domowe środki czystości', transactionDate: daysAgo(1), categoryId: 8, notes: 'Płyn do naczyń, gąbki', location: 'Carrefour Express' }, // Dom

      { amount: -18.00, title: 'Frytki belgijskie', transactionDate: daysAgo(2), categoryId: 9, notes: 'Przekąska na mieście', location: 'Frytkownia' }, // Żywność
      { amount: -45.99, title: 'Książka', transactionDate: daysAgo(2), categoryId: 5, notes: 'Nowy kryminał', location: 'Świat Książki' }, // Edukacja

      { amount: -45.00, title: 'Pralnia chemiczna', transactionDate: daysAgo(3), categoryId: 8, notes: 'Czyszczenie garnituru', location: '5-a-sec' }, // Dom
      { amount: -18.20, title: 'Przejazd hulajnogą', transactionDate: daysAgo(3), categoryId: 7, notes: 'Szybki dojazd na spotkanie', location: 'Bolt' }, // Transport

      { amount: -120.00, title: 'Wizyta u fizjoterapeuty', transactionDate: daysAgo(7), categoryId: 6, notes: 'Kontrola pleców', location: 'Centrum Medyczne LUX MED' }, // Zdrowie
      { amount: -40.00, title: 'Obiad na mieście', transactionDate: daysAgo(7), categoryId: 9, notes: 'Szybki lunch', location: 'Bar Mleczny' }, // Żywność

      { amount: -55.00, title: 'Apteczka domowa', transactionDate: daysAgo(14), categoryId: 6, notes: 'Plastry, środki przeciwbólowe', location: 'Apteka Super-Pharm' }, // Zdrowie
      { amount: -15.00, title: 'Lody', transactionDate: daysAgo(14), categoryId: 9, notes: null, location: 'Lodziarnia "Grycan"' }, // Żywność

      { amount: 5200.00, title: 'Wynagrodzenie', transactionDate: daysAgo(30), categoryId: 2, notes: 'Pensja za poprzedni miesiąc', location: 'Pracodawca S.A.' }, // Finanse (przychód)
      { amount: -150.00, title: 'Prezent urodzinowy dla mamy', transactionDate: daysAgo(30), categoryId: 1, notes: null, location: 'Empik' }, // Inne
      { amount: -55.40, title: 'Jedzenie z dostawą', transactionDate: daysAgo(30), categoryId: 9, notes: 'Zamówienie wieczorem', location: 'Pyszne.pl / Uber Eats' }, // Żywność

      { amount: -95.60, title: 'Zakupy', transactionDate: daysAgo(35), categoryId: 9, notes: 'Małe zakupy i coś na grilla', location: 'Lidl' }, // Żywność
      { amount: -8.80, title: 'Bilety komunikacji miejskiej', transactionDate: daysAgo(35), categoryId: 7, notes: '2 x 20-minutowy', location: 'Automat biletowy' }, // Transport

      { amount: -45.00, title: 'Rachunek za gaz', transactionDate: daysAgo(42), categoryId: 8, notes: 'Wyrównanie', location: 'PGNiG' }, // Dom
      { amount: -4.40, title: 'Bilet komunikacji miejskiej', transactionDate: daysAgo(42), categoryId: 7, notes: null, location: 'Automat biletowy' }, // Transport

      { amount: -112.50, title: 'Etui na telefon i szkło', transactionDate: daysAgo(49), categoryId: 3, notes: 'Zamówienie online', location: 'Allegro' }, // Zakupy i ubrania
      { amount: -17.30, title: 'Warzywa i owoce', transactionDate: daysAgo(49), categoryId: 9, notes: null, location: 'Lokalny ryneczek' }, // Żywność

      { amount: 5200.00, title: 'Wynagrodzenie', transactionDate: daysAgo(60), categoryId: 2, notes: 'Pensja za 2 miesiące temu', location: 'Pracodawca S.A.' }, // Finanse (przychód)
      { amount: -222.80, title: 'Zakupy spożywcze', transactionDate: daysAgo(60), categoryId: 9, notes: 'Duże zakupy', location: 'Auchan' }, // Żywność
      { amount: -28.00, title: 'Karma dla kota', transactionDate: daysAgo(58), categoryId: 8, notes: 'Sucha karma 1.5kg', location: 'Zooplus.pl' }, // Dom
      { amount: -79.99, title: 'Gra na Steam', transactionDate: daysAgo(57), categoryId: 4, notes: 'Wyprzedaż letnia', location: 'Steam Store' }, // Rozrywka i kultura
      { amount: -38.00, title: 'Myjnia samochodowa', transactionDate: daysAgo(55), categoryId: 7, notes: null, location: 'Myjnia bezdotykowa' }, // Transport
      { amount: -10.00, title: 'Opłata za prowadzenie konta', transactionDate: daysAgo(54), categoryId: 2, notes: 'Opłata miesięczna', location: 'mBank' }, // Finanse
      { amount: -310.80, title: 'Tankowanie samochodu', transactionDate: daysAgo(52), categoryId: 7, notes: 'Do pełna', location: 'BP' }, // Transport
      { amount: -30.00, title: 'Darowizna na schronisko', transactionDate: daysAgo(50), categoryId: 1, notes: 'Wsparcie dla zwierząt', location: 'Schronisko "Na Paluchu"' } // Inne
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
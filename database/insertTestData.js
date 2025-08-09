import { loyaltyCards, periodicTransactions, transactions } from '@/database/schema';
import { getCurrentTimestamp } from '@/utils/dateUtils';

export const insertTestData = async (db) => {
  try {
    console.log('[TestData] Rozpoczynam dodawanie testowych danych...');

    const currentTimestamp = getCurrentTimestamp();

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
      { amount: -2250.00, title: 'Rata kredytu hipotecznego', categoryId: 8, repeatInterval: 1, repeatUnit: 'month', startDate: 1718409600, nextOccurrenceDate: currentTimestamp - (5 * 24 * 60 * 60), endDate: null, notes: 'Kredyt na mieszkanie - rata stała' },
      { amount: -149.99, title: 'Karnet na siłownię', categoryId: 4, repeatInterval: 1, repeatUnit: 'month', startDate: 1717200000, nextOccurrenceDate: currentTimestamp - (4 * 24 * 60 * 60), endDate: null, notes: 'Karnet miesięczny na siłownię' },
      { amount: -43.00, title: 'Subskrypcja Netflix', categoryId: 6, repeatInterval: 1, repeatUnit: 'month', startDate: 1717545600, nextOccurrenceDate: currentTimestamp - (3 * 24 * 60 * 60), endDate: null, notes: 'Subskrypcja Netflix' },
      { amount: -19.99, title: 'Subskrypcja Spotify', categoryId: 6, repeatInterval: 1, repeatUnit: 'month', startDate: 1717804800, nextOccurrenceDate: currentTimestamp - (2 * 24 * 60 * 60), endDate: null, notes: 'Subskrypcja Spotify' },
      { amount: -89.00, title: 'Internet i TV', categoryId: 2, repeatInterval: 1, repeatUnit: 'month', startDate: 1717286400, nextOccurrenceDate: currentTimestamp - (1 * 24 * 60 * 60), endDate: null, notes: 'Internet i TV' },
      { amount: -65.00, title: 'Abonament telefoniczny', categoryId: 2, repeatInterval: 1, repeatUnit: 'month', startDate: 1718841600, nextOccurrenceDate: currentTimestamp, endDate: null, notes: 'Abonament telefoniczny' }
    ];

    for (const periodic of periodicData) {
      await db.insert(periodicTransactions).values(periodic).execute();
    }

    // 3. Transactions 
    const transactionsData = [
      { amount: 5200.00, title: 'Wynagrodzenie', transactionDate: 1748736000, categoryId: 8, notes: 'Pensja za maj 2025', location: 'Pracodawca S.A.' },
      { amount: -185.43, title: 'Zakupy spożywcze', transactionDate: 1748764800, categoryId: 1, notes: 'Większe zakupy na tydzień', location: 'Biedronka' },
      { amount: -15.80, title: 'Zakupy w piekarni', transactionDate: 1748894400, categoryId: 1, notes: 'Chleb i bułki', location: 'Piekarnia "Złoty Kłos"' },
      { amount: -4.40, title: 'Bilet komunikacji miejskiej', transactionDate: 1748896200, categoryId: 3, notes: 'Bilet 20-minutowy', location: 'Jakdojade' },
      { amount: -35.00, title: 'Lunch w pracy', transactionDate: 1748912400, categoryId: 1, notes: null, location: 'Stołówka biurowa' },
      { amount: -7.50, title: 'Drożdżówka do pracy', transactionDate: 1748984400, categoryId: 1, notes: null, location: 'Lokalna cukiernia' },
      { amount: -80.00, title: 'Strzyżenie męskie', transactionDate: 1749096000, categoryId: 4, notes: 'Wizyta u fryzjera', location: 'Barber Shop' },
      { amount: -280.15, title: 'Tankowanie samochodu', transactionDate: 1749110400, categoryId: 3, notes: 'Benzyna 95', location: 'Orlen' },
      { amount: -65.50, title: 'Wyjście na pizzę', transactionDate: 1749117600, categoryId: 1, notes: 'Pizza ze znajomymi', location: 'Pizzeria Roma' },
      { amount: -9.99, title: 'Opłata za chmurę iCloud', transactionDate: 1749178800, categoryId: 9, notes: '200GB miesięcznie', location: 'Apple Services' },
      { amount: -12.00, title: 'Opłata za parking', transactionDate: 1749175200, categoryId: 3, notes: null, location: 'Parking miejski' },
      { amount: -95.40, title: 'Zakupy w aptece', transactionDate: 1749279600, categoryId: 4, notes: 'Kosmetyki, krem z filtrem', location: 'Super-Pharm' },
      { amount: -78.90, title: 'Kosmetyki i chemia', transactionDate: 1749366000, categoryId: 7, notes: 'Pasta, szampon, proszek', location: 'Rossmann' },
      { amount: -18.50, title: 'Kawa na mieście', transactionDate: 1749447000, categoryId: 1, notes: 'Spotkanie z Anią', location: 'Costa Coffee' },
      { amount: -25.40, title: 'Zakupy w Żabce', transactionDate: 1749459600, categoryId: 1, notes: 'Napoje i przekąska', location: 'Żabka' },
      { amount: -88.21, title: 'Zakupy spożywcze', transactionDate: 1749538800, categoryId: 1, notes: 'Uzupełnienie lodówki', location: 'Lidl' },
      { amount: -12.00, title: 'Przesyłka InPost', transactionDate: 1749626400, categoryId: 9, notes: 'Wysłanie paczki', location: 'InPost Paczkomat' },
      { amount: -42.00, title: 'Bilety do kina', transactionDate: 1749732000, categoryId: 6, notes: 'Nowy film akcji', location: 'Cinema City' },
      { amount: -35.50, title: 'Przekąski w kinie', transactionDate: 1749732300, categoryId: 1, notes: 'Popcorn i cola', location: 'Cinema City Bar' },
      { amount: -175.00, title: 'Rachunek za prąd', transactionDate: 1749958800, categoryId: 2, notes: 'Opłata za maj', location: 'Tauron' },
      { amount: -150.00, title: 'Kontrola dentystyczna', transactionDate: 1749967200, categoryId: 4, notes: 'Przegląd i skaling', location: 'Stomatolog Med-Dent' },
      { amount: -48.30, title: 'Leki i suplementy', transactionDate: 1750053600, categoryId: 4, notes: 'Witamina D, ból gardła', location: 'Apteka "Dbam o Zdrowie"' },
      { amount: -4.40, title: 'Bilet komunikacji miejskiej', transactionDate: 1750105800, categoryId: 3, notes: null, location: 'Jakdojade' },
      { amount: -65.80, title: 'Płyn do spryskiwaczy i żarówki', transactionDate: 1750140000, categoryId: 3, notes: 'Akcesoria samochodowe', location: 'Action' },
      { amount: -650.00, title: 'Czynsz administracyjny', transactionDate: 1750201200, categoryId: 2, notes: 'Czynsz, zaliczka na media', location: 'Spółdzielnia Mieszkaniowa' },
      { amount: -220.40, title: 'Nowe buty do biegania', transactionDate: 1750316400, categoryId: 7, notes: 'Wyprzedaż letnia', location: 'Decathlon' },
      { amount: -19.90, title: 'Prasa i krzyżówki', transactionDate: 1750388400, categoryId: 6, notes: null, location: 'Inmedio' },
      { amount: -30.00, title: 'Darowizna na schronisko', transactionDate: 1750402800, categoryId: 9, notes: 'Wsparcie dla zwierząt', location: 'Schronisko "Na Paluchu"' },
      { amount: -310.80, title: 'Tankowanie samochodu', transactionDate: 1750483200, categoryId: 3, notes: 'Do pełna', location: 'BP' },
      { amount: -10.00, title: 'Opłata za prowadzenie konta', transactionDate: 1750510800, categoryId: 8, notes: 'Opłata miesięczna', location: 'mBank' },
      { amount: -38.00, title: 'Myjnia samochodowa', transactionDate: 1750647600, categoryId: 3, notes: null, location: 'Myjnia bezdotykowa' },
      { amount: -79.99, title: 'Gra na Steam', transactionDate: 1750669200, categoryId: 6, notes: 'Wyprzedaż letnia', location: 'Steam Store' },
      { amount: -28.00, title: 'Karma dla kota', transactionDate: 1750737600, categoryId: 9, notes: 'Sucha karma 1.5kg', location: 'Zooplus.pl' },
      { amount: -222.80, title: 'Zakupy spożywcze', transactionDate: 1750838400, categoryId: 1, notes: 'Duże zakupy', location: 'Auchan' },
      { amount: -17.30, title: 'Warzywa i owoce', transactionDate: 1750993200, categoryId: 1, notes: null, location: 'Lokalny ryneczek' },
      { amount: -112.50, title: 'Etui na telefon i szkło', transactionDate: 1751090400, categoryId: 7, notes: 'Zamówienie online', location: 'Allegro' },
      { amount: -4.40, title: 'Bilet komunikacji miejskiej', transactionDate: 1751171400, categoryId: 3, notes: null, location: 'Automat biletowy' },
      { amount: -45.00, title: 'Rachunek za gaz', transactionDate: 1751238000, categoryId: 2, notes: 'Wyrównanie', location: 'PGNiG' },
      { amount: 5200.00, title: 'Wynagrodzenie', transactionDate: 1751328000, categoryId: 8, notes: 'Pensja za czerwiec 2025', location: 'Pracodawca S.A.' },
      { amount: -95.60, title: 'Zakupy', transactionDate: 1751362800, categoryId: 1, notes: 'Małe zakupy i coś na grilla', location: 'Lidl' },
      { amount: -8.80, title: 'Bilety komunikacji miejskiej', transactionDate: 1751413200, categoryId: 3, notes: '2 x 20-minutowy', location: 'Automat biletowy' },
      { amount: -55.40, title: 'Jedzenie z dostawą', transactionDate: 1751532000, categoryId: 1, notes: 'Zamówienie wieczorem', location: 'Pyszne.pl / Uber Eats' },
      { amount: -150.00, title: 'Prezent urodzinowy dla mamy', transactionDate: 1751535600, categoryId: 9, notes: null, location: 'Empik' },
      { amount: -15.00, title: 'Lody', transactionDate: 1751618400, categoryId: 1, notes: null, location: 'Lodziarnia "Grycan"' },
      { amount: -55.00, title: 'Apteczka domowa', transactionDate: 1751708400, categoryId: 4, notes: 'Plastry, środki przeciwbólowe', location: 'Apteka Super-Pharm' },
      { amount: -40.00, title: 'Obiad na mieście', transactionDate: 1751780400, categoryId: 1, notes: 'Szybki lunch', location: 'Bar Mleczny' },
      { amount: -120.00, title: 'Wizyta u fizjoterapeuty', transactionDate: 1751888400, categoryId: 4, notes: 'Kontrola pleców', location: 'Centrum Medyczne LUX MED' },
      { amount: -18.20, title: 'Przejazd hulajnogą', transactionDate: 1751976600, categoryId: 3, notes: 'Szybki dojazd na spotkanie', location: 'Bolt' },
      { amount: -45.00, title: 'Pralnia chemiczna', transactionDate: 1752032400, categoryId: 2, notes: 'Czyszczenie garnituru', location: '5-a-sec' },
      { amount: -45.99, title: 'Książka', transactionDate: 1752061200, categoryId: 5, notes: 'Nowy kryminał', location: 'Świat Książki' },
      { amount: -18.00, title: 'Frytki belgijskie', transactionDate: 1752151200, categoryId: 1, notes: 'Przekąska na mieście', location: 'Frytkownia' },
      { amount: -32.50, title: 'Domowe środki czystości', transactionDate: 1752320400, categoryId: 2, notes: 'Płyn do naczyń, gąbki', location: 'Carrefour Express' },
      { amount: -300.00, title: 'Zaliczka na wakacje', transactionDate: 1752388800, categoryId: 9, notes: 'Opłata za hotel', location: 'Booking.com' },
      { amount: -65.10, title: 'Zakupy w Żabce', transactionDate: 1752493200, categoryId: 1, notes: 'Szybkie zakupy po pracy', location: 'Żabka' },
      { amount: -6.00, title: 'Bilet normalny 75-min', transactionDate: 1752540600, categoryId: 3, notes: null, location: 'MPK App' }
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
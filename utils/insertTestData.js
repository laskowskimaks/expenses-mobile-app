import { loyaltyCards, periodicTransactions, transactions, tags, transactionTags, periodicTransactionTags } from '@/database/schema';
import { getCurrentTimestamp } from '@/utils/dateUtils';

export const insertTestData = async (db) => {
  try {
    console.log('[TestData] Rozpoczynam dodawanie danych z zrzutu SQL...');

    // Obliczamy przesunięcie czasowe
    const originalLastDate = 1758040560; // Ostatnia transakcja z oryginalnych danych
    const currentTimestamp = getCurrentTimestamp();
    const timeOffset = currentTimestamp - originalLastDate;

    // Funkcja do przesuwania dat
    const adjustTimestamp = (timestamp) => timestamp + timeOffset;

    // 1. Tags - dane z zrzutu w odpowiedniej kolejności (bez podawania ID)
    const tagsData = [
      { name: 'niekonieczne', color: '#0ea5e9' },        // ID 1
      { name: 'slodycze', color: '#10b981' },            // ID 2
      { name: 'konieczne', color: '#f59e0b' },           // ID 3
      { name: 'jedzenie na miescie', color: '#10b981' }, // ID 4
      { name: 'Wycieczka do Krakowa', color: '#22c55e' }, // ID 5
      { name: 'alkohol', color: '#a855f7' },             // ID 6
      { name: 'kawa', color: '#14b8a6' },                // ID 7
      { name: 'fast food', color: '#f97316' },           // ID 8
      { name: 'charytatywnosc', color: '#ef4444' },      // ID 9
      { name: 'prezent', color: '#3b22f6' },             // ID 10
      { name: 'Slub Ewy i Adama', color: '#f97316' },    // ID 11
      { name: 'kebab', color: '#f97316' }                // ID 12
    ];

    for (const tag of tagsData) {
      await db.insert(tags).values({ name: tag.name, color: tag.color }).execute();
    }

    // 2. Loyalty Cards - dane z zrzutu
    const loyaltyCardsData = [
      { name: 'sads', barcodeData: '19859149', barcodeFormat: 'ean8', notes: '', imageUri: null },
      { name: 'Biedronka', barcodeData: null, barcodeFormat: null, notes: '', imageUri: 'file:///data/user/0/host.exp.exponent/files/loyalty_card_images/card_1757924544381.jpg' },
      { name: 'hebe', barcodeData: '9930095914078', barcodeFormat: 'ean13', notes: '', imageUri: null }
    ];

    for (const card of loyaltyCardsData) {
      await db.insert(loyaltyCards).values(card).execute();
    }

    // 3. Periodic Transactions - dane z zrzutu z przesunięciem dat
    const periodicData = [
      { amount: 4666.0, title: 'Wyplata', repeatInterval: 1, repeatUnit: 'month', startDate: adjustTimestamp(1754820000), nextOccurrenceDate: adjustTimestamp(1760090400), endDate: null, notes: null, categoryId: 2 },
      { amount: -1350.0, title: 'Mieszkanie', repeatInterval: 1, repeatUnit: 'month', startDate: adjustTimestamp(1755195600), nextOccurrenceDate: adjustTimestamp(1760466000), endDate: null, notes: '', categoryId: 8 },
      { amount: -15.99, title: '5 GB iCloud', repeatInterval: 1, repeatUnit: 'month', startDate: adjustTimestamp(1754834640), nextOccurrenceDate: adjustTimestamp(1760105040), endDate: null, notes: null, categoryId: 1 },
      { amount: -30.0, title: 'Spotify', repeatInterval: 1, repeatUnit: 'month', startDate: adjustTimestamp(1754834700), nextOccurrenceDate: adjustTimestamp(1760105100), endDate: null, notes: null, categoryId: 4 },
      { amount: -40.0, title: 'Zrzutka na hospicjum', repeatInterval: 1, repeatUnit: 'month', startDate: adjustTimestamp(1754834820), nextOccurrenceDate: adjustTimestamp(1760105220), endDate: null, notes: null, categoryId: 1 },
      { amount: -120.0, title: 'Karnet silownia', repeatInterval: 1, repeatUnit: 'month', startDate: adjustTimestamp(1754835420), nextOccurrenceDate: adjustTimestamp(1760105820), endDate: null, notes: null, categoryId: 6 },
      { amount: 70.0, title: 'Korepetycje', repeatInterval: 1, repeatUnit: 'week', startDate: adjustTimestamp(1756737060), nextOccurrenceDate: adjustTimestamp(1758551460), endDate: null, notes: 'Korepetycje z matematyki', categoryId: 2 },
      { amount: -34.99, title: 'Netflix', repeatInterval: 1, repeatUnit: 'month', startDate: adjustTimestamp(1754836500), nextOccurrenceDate: adjustTimestamp(1760106900), endDate: null, notes: null, categoryId: 4 },
      { amount: -73.0, title: 'Abonament telefoniczny i internet', repeatInterval: 1, repeatUnit: 'month', startDate: adjustTimestamp(1754830680), nextOccurrenceDate: adjustTimestamp(1760101080), endDate: null, notes: null, categoryId: 8 }
    ];

    for (const periodic of periodicData) {
      await db.insert(periodicTransactions).values(periodic).execute();
    }

    // 4. Periodic Transaction Tags - dane z zrzutu
    const periodicTransactionTagsData = [
      { periodicTransactionId: 2, tagId: 3 },
      { periodicTransactionId: 4, tagId: 1 },
      { periodicTransactionId: 5, tagId: 9 },
      { periodicTransactionId: 8, tagId: 1 },
      { periodicTransactionId: 9, tagId: 3 }
    ];

    for (const ptTag of periodicTransactionTagsData) {
      await db.insert(periodicTransactionTags).values(ptTag).execute();
    }

    // 5. Transactions - wszystkie dane z zrzutu z przesunięciem dat
    const transactionsData = [
      { amount: 4666.0, title: 'Wyplata', transactionDate: adjustTimestamp(1754820000), notes: null, location: null, periodicTransactionId: 1, categoryId: 2 },
      { amount: 4666.0, title: 'Wyplata', transactionDate: adjustTimestamp(1757498400), notes: null, location: null, periodicTransactionId: 1, categoryId: 2 },
      { amount: -5.99, title: 'Chleb', transactionDate: adjustTimestamp(1755503040), notes: '', location: 'Piekarnia Piekus', periodicTransactionId: null, categoryId: 9 },
      { amount: -5.99, title: 'Chleb', transactionDate: adjustTimestamp(1755773160), notes: '', location: 'Piekarnia Piekus', periodicTransactionId: null, categoryId: 9 },
      { amount: -5.99, title: 'Chleb', transactionDate: adjustTimestamp(1756118820), notes: '', location: 'Piekarnia Piekus', periodicTransactionId: null, categoryId: 9 },
      { amount: -5.99, title: 'Chleb', transactionDate: adjustTimestamp(1756291680), notes: '', location: 'Piekarnia Piekus', periodicTransactionId: null, categoryId: 9 },
      { amount: -13.38, title: 'Cos slodkiego', transactionDate: adjustTimestamp(1756291740), notes: '', location: 'Piekarnia Piekus', periodicTransactionId: null, categoryId: 9 },
      { amount: -5.99, title: 'Chleb', transactionDate: adjustTimestamp(1757069700), notes: '', location: 'Piekarnia Piekus', periodicTransactionId: null, categoryId: 9 },
      { amount: -2.5, title: 'Pol chleba', transactionDate: adjustTimestamp(1757328900), notes: '', location: 'Piekarnia Piekus', periodicTransactionId: null, categoryId: 9 },
      { amount: -5.99, title: 'Chleb', transactionDate: adjustTimestamp(1757588160), notes: '', location: 'Piekarnia Piekus', periodicTransactionId: null, categoryId: 9 },
      { amount: -8.6, title: 'Chleb i bulki', transactionDate: adjustTimestamp(1757933820), notes: '', location: '', periodicTransactionId: null, categoryId: 9 },
      { amount: -20.99, title: 'Kanapka bartkowscy', transactionDate: adjustTimestamp(1756904880), notes: '', location: 'Piekarnia Bartkowscy', periodicTransactionId: null, categoryId: 9 },
      { amount: -1350.0, title: 'Mieszkanie', transactionDate: adjustTimestamp(1755195600), notes: '', location: null, periodicTransactionId: 2, categoryId: 8 },
      { amount: -1350.0, title: 'Mieszkanie', transactionDate: adjustTimestamp(1757874000), notes: '', location: null, periodicTransactionId: 2, categoryId: 8 },
      { amount: -63.35, title: 'Pociag do Krakowa', transactionDate: adjustTimestamp(1755263820), notes: 'PKP IC', location: '', periodicTransactionId: null, categoryId: 7 },
      { amount: -64.3, title: 'Pociag powrotny z Krakowa', transactionDate: adjustTimestamp(1755437160), notes: '', location: '', periodicTransactionId: null, categoryId: 7 },
      { amount: 150.0, title: 'Wygrana w zdrapce', transactionDate: adjustTimestamp(1757942820), notes: 'Lotto', location: '', periodicTransactionId: null, categoryId: 2 },
      { amount: -140.0, title: 'Nocleg w Krakowie', transactionDate: adjustTimestamp(1755264480), notes: 'Akademik w Krakowie', location: '', periodicTransactionId: null, categoryId: 8 },
      { amount: -25.0, title: 'Bilet ZTP w Krakowie 72 h', transactionDate: adjustTimestamp(1755264660), notes: '', location: '', periodicTransactionId: null, categoryId: 7 },
      { amount: -84.45, title: 'Jedzenie do akademika', transactionDate: adjustTimestamp(1755279180), notes: 'Ser, szynka, chleb', location: 'Lidl', periodicTransactionId: null, categoryId: 9 },
      { amount: -32.0, title: 'Piwo ze znajomymi', transactionDate: adjustTimestamp(1755286500), notes: '', location: 'Craftownia', periodicTransactionId: null, categoryId: 4 },
      { amount: -16.9, title: 'Duza kawa', transactionDate: adjustTimestamp(1755337020), notes: '', location: '', periodicTransactionId: null, categoryId: 9 },
      { amount: -43.0, title: 'Pamiatki dla rodziny', transactionDate: adjustTimestamp(1755342480), notes: '', location: '', periodicTransactionId: null, categoryId: 3 },
      { amount: -26.0, title: 'Obiad w pierogarni', transactionDate: adjustTimestamp(1755344520), notes: '', location: 'Pierogarnia Krakowiak', periodicTransactionId: null, categoryId: 9 },
      { amount: -15.0, title: 'Zwiedzanie Zamku Krolewskiego', transactionDate: adjustTimestamp(1755351780), notes: '', location: 'Zamek Krolewski Wawel', periodicTransactionId: null, categoryId: 4 },
      { amount: -45.0, title: 'Kolacja', transactionDate: adjustTimestamp(1755359160), notes: 'Burger', location: 'Burgerownia TOP', periodicTransactionId: null, categoryId: 9 },
      { amount: -36.0, title: 'Mikstury w Wilczym Dole', transactionDate: adjustTimestamp(1755370140), notes: '', location: 'Pub Wilczy Dol', periodicTransactionId: null, categoryId: 4 },
      { amount: -41.0, title: 'Sniadanie z kawa', transactionDate: adjustTimestamp(1755413400), notes: '', location: 'Cafe Camelot', periodicTransactionId: null, categoryId: 9 },
      { amount: -110.0, title: 'Wycieczka do Kopalni Soli w Wieliczce', transactionDate: adjustTimestamp(1755417120), notes: '', location: '', periodicTransactionId: null, categoryId: 4 },
      { amount: -39.0, title: 'Jedzenie w maku', transactionDate: adjustTimestamp(1755435240), notes: '', location: 'Mc Donald\'s ', periodicTransactionId: null, categoryId: 9 },
      { amount: -125.43, title: 'Wieksze zakupy spozywcze', transactionDate: adjustTimestamp(1754834340), notes: '', location: 'Kaufland', periodicTransactionId: null, categoryId: 9 },
      { amount: -15.99, title: '5 GB iCloud', transactionDate: adjustTimestamp(1754834640), notes: null, location: null, periodicTransactionId: 3, categoryId: 1 },
      { amount: -15.99, title: '5 GB iCloud', transactionDate: adjustTimestamp(1757513040), notes: null, location: null, periodicTransactionId: 3, categoryId: 1 },
      { amount: -30.0, title: 'Spotify', transactionDate: adjustTimestamp(1754834700), notes: null, location: null, periodicTransactionId: 4, categoryId: 4 },
      { amount: -30.0, title: 'Spotify', transactionDate: adjustTimestamp(1757513100), notes: null, location: null, periodicTransactionId: 4, categoryId: 4 },
      { amount: -40.0, title: 'Zrzutka na hospicjum', transactionDate: adjustTimestamp(1754834820), notes: null, location: null, periodicTransactionId: 5, categoryId: 1 },
      { amount: -40.0, title: 'Zrzutka na hospicjum', transactionDate: adjustTimestamp(1757513220), notes: null, location: null, periodicTransactionId: 5, categoryId: 1 },
      { amount: -2.3, title: 'Bilet miejski', transactionDate: adjustTimestamp(1755353340), notes: '', location: '', periodicTransactionId: null, categoryId: 7 },
      { amount: -2.3, title: 'Bilet miejski', transactionDate: adjustTimestamp(1755526200), notes: '', location: '', periodicTransactionId: null, categoryId: 7 },
      { amount: -2.3, title: 'Bilet miejski', transactionDate: adjustTimestamp(1755612600), notes: '', location: '', periodicTransactionId: null, categoryId: 7 },
      { amount: -25.0, title: 'Rovee', transactionDate: adjustTimestamp(1755699060), notes: '', location: '', periodicTransactionId: null, categoryId: 7 },
      { amount: -150.0, title: 'Paliwo', transactionDate: adjustTimestamp(1755871860), notes: '', location: '', periodicTransactionId: null, categoryId: 7 },
      { amount: -35.0, title: 'Bilet do Smetowa PKP', transactionDate: adjustTimestamp(1755871920), notes: '', location: '', periodicTransactionId: null, categoryId: 7 },
      { amount: -35.0, title: 'Bilet do Torunia PKP', transactionDate: adjustTimestamp(1756044720), notes: '', location: '', periodicTransactionId: null, categoryId: 7 },
      { amount: -2.3, title: 'Bilet miejski', transactionDate: adjustTimestamp(1756131180), notes: '', location: '', periodicTransactionId: null, categoryId: 7 },
      { amount: -2.3, title: 'Bilet miejski', transactionDate: adjustTimestamp(1755785580), notes: '', location: '', periodicTransactionId: null, categoryId: 7 },
      { amount: -2.3, title: 'Bilet miejski', transactionDate: adjustTimestamp(1756217640), notes: '', location: '', periodicTransactionId: null, categoryId: 7 },
      { amount: -2.3, title: 'Bilet miejski', transactionDate: adjustTimestamp(1756563300), notes: '', location: '', periodicTransactionId: null, categoryId: 7 },
      { amount: -2.3, title: 'Bilet miejski', transactionDate: adjustTimestamp(1757945760), notes: '', location: '', periodicTransactionId: null, categoryId: 7 },
      { amount: -2.3, title: 'Bilet miejski', transactionDate: adjustTimestamp(1756649760), notes: '', location: '', periodicTransactionId: null, categoryId: 7 },
      { amount: -2.3, title: 'Bilet miejski', transactionDate: adjustTimestamp(1756822560), notes: '', location: '', periodicTransactionId: null, categoryId: 7 },
      { amount: -2.3, title: 'Bilet miejski', transactionDate: adjustTimestamp(1756995360), notes: '', location: '', periodicTransactionId: null, categoryId: 7 },
      { amount: -2.3, title: 'Bilet miejski', transactionDate: adjustTimestamp(1757427420), notes: '', location: '', periodicTransactionId: null, categoryId: 7 },
      { amount: -120.0, title: 'Karnet silownia', transactionDate: adjustTimestamp(1754835420), notes: null, location: null, periodicTransactionId: 6, categoryId: 6 },
      { amount: -120.0, title: 'Karnet silownia', transactionDate: adjustTimestamp(1757513820), notes: null, location: null, periodicTransactionId: 6, categoryId: 6 },
      { amount: -41.57, title: 'Uzupelnienie apteczki', transactionDate: adjustTimestamp(1756909080), notes: '', location: 'Gemini', periodicTransactionId: null, categoryId: 6 },
      { amount: -160.0, title: 'Kurs angielskiego', transactionDate: adjustTimestamp(1757686740), notes: '', location: '', periodicTransactionId: null, categoryId: 5 },
      { amount: 70.0, title: 'Korepetycje', transactionDate: adjustTimestamp(1756737060), notes: 'Korepetycje z matematyki', location: null, periodicTransactionId: 7, categoryId: 2 },
      { amount: 70.0, title: 'Korepetycje', transactionDate: adjustTimestamp(1757341860), notes: 'Korepetycje z matematyki', location: null, periodicTransactionId: 7, categoryId: 2 },
      { amount: 70.0, title: 'Korepetycje', transactionDate: adjustTimestamp(1757946660), notes: 'Korepetycje z matematyki', location: null, periodicTransactionId: 7, categoryId: 2 },
      { amount: -75.0, title: 'Ubezpiecznie NNW', transactionDate: adjustTimestamp(1756996380), notes: '', location: '', periodicTransactionId: null, categoryId: 2 },
      { amount: -34.99, title: 'Netflix', transactionDate: adjustTimestamp(1754836500), notes: null, location: null, periodicTransactionId: 8, categoryId: 4 },
      { amount: -34.99, title: 'Netflix', transactionDate: adjustTimestamp(1757514900), notes: null, location: null, periodicTransactionId: 8, categoryId: 4 },
      { amount: -160.73, title: 'Ubranie', transactionDate: adjustTimestamp(1757687760), notes: 'Spodnie i bluza', location: '', periodicTransactionId: null, categoryId: 3 },
      { amount: -130.0, title: 'Buty', transactionDate: adjustTimestamp(1756046220), notes: '', location: 'CCC', periodicTransactionId: null, categoryId: 3 },
      { amount: -39.99, title: 'Ksiazka', transactionDate: adjustTimestamp(1757947080), notes: 'Droga Krolow, Sanderson', location: 'Empik', periodicTransactionId: null, categoryId: 4 },
      { amount: -30.0, title: 'Kino', transactionDate: adjustTimestamp(1757788740), notes: '', location: 'Cinema City', periodicTransactionId: null, categoryId: 4 },
      { amount: -43.0, title: 'Kwiatki dla mamy', transactionDate: adjustTimestamp(1755873660), notes: '', location: 'Kwiaciania', periodicTransactionId: null, categoryId: 1 },
      { amount: -150.0, title: 'Paliwo', transactionDate: adjustTimestamp(1756565040), notes: 'Paliwo do Pelplina', location: '', periodicTransactionId: null, categoryId: 7 },
      { amount: -50.0, title: 'Pranie garnituru', transactionDate: adjustTimestamp(1756392360), notes: '', location: '', periodicTransactionId: null, categoryId: 3 },
      { amount: -700.0, title: 'Prezent slubny', transactionDate: adjustTimestamp(1756565220), notes: '', location: '', periodicTransactionId: null, categoryId: 1 },
      { amount: -71.0, title: 'Prezent urodzinowy dla Wojciecha', transactionDate: adjustTimestamp(1755615060), notes: '', location: '', periodicTransactionId: null, categoryId: 1 },
      { amount: -20.0, title: 'Kawa', transactionDate: adjustTimestamp(1755787920), notes: '', location: 'Grande Coffe', periodicTransactionId: null, categoryId: 9 },
      { amount: -17.9, title: 'Kawa', transactionDate: adjustTimestamp(1756911180), notes: '', location: '', periodicTransactionId: null, categoryId: 9 },
      { amount: -17.9, title: 'Kawa', transactionDate: adjustTimestamp(1757343180), notes: '', location: '', periodicTransactionId: null, categoryId: 9 },
      { amount: -45.0, title: 'Kawa z ciastem', transactionDate: adjustTimestamp(1757775240), notes: '', location: '', periodicTransactionId: null, categoryId: 9 },
      { amount: -14.0, title: 'Drozdzowka', transactionDate: adjustTimestamp(1757343300), notes: '', location: '', periodicTransactionId: null, categoryId: 9 },
      { amount: -140.0, title: 'Wieksze zakupy spozywcze', transactionDate: adjustTimestamp(1755615300), notes: '', location: 'Kaufland', periodicTransactionId: null, categoryId: 9 },
      { amount: -600.0, title: 'Dentysta', transactionDate: adjustTimestamp(1756220160), notes: '', location: 'Dentaurus', periodicTransactionId: null, categoryId: 6 },
      { amount: -138.0, title: 'Wieksze zakupy spozywcze', transactionDate: adjustTimestamp(1756738740), notes: '', location: 'Biedronka', periodicTransactionId: null, categoryId: 9 },
      { amount: -10.0, title: 'Piernik', transactionDate: adjustTimestamp(1757689200), notes: '', location: '', periodicTransactionId: null, categoryId: 9 },
      { amount: -151.48, title: 'Wieksze zakupy spozywcze', transactionDate: adjustTimestamp(1757516520), notes: '', location: 'Biedronka', periodicTransactionId: null, categoryId: 9 },
      { amount: -31.0, title: 'Mniejsze zakupy spozywcze', transactionDate: adjustTimestamp(1755788640), notes: '', location: 'Polo ', periodicTransactionId: null, categoryId: 9 },
      { amount: -48.0, title: 'Mniejsze zakupy spozywcze', transactionDate: adjustTimestamp(1756998300), notes: '', location: 'Polo', periodicTransactionId: null, categoryId: 9 },
      { amount: -26.0, title: 'Mniejsze zakupy spozywcze', transactionDate: adjustTimestamp(1757689560), notes: '', location: 'Polo', periodicTransactionId: null, categoryId: 9 },
      { amount: -38.0, title: 'Bolt', transactionDate: adjustTimestamp(1757786820), notes: '', location: '', periodicTransactionId: null, categoryId: 7 },
      { amount: -42.0, title: 'Zel pod prysznic itp', transactionDate: adjustTimestamp(1757948880), notes: '', location: 'Rossman', periodicTransactionId: null, categoryId: 3 },
      { amount: -34.0, title: 'Kebab', transactionDate: adjustTimestamp(1757956140), notes: '', location: '', periodicTransactionId: null, categoryId: 9 },
      { amount: -34.0, title: 'Kebab', transactionDate: adjustTimestamp(1757257740), notes: '', location: '', periodicTransactionId: null, categoryId: 9 },
      { amount: -34.0, title: 'Kebab', transactionDate: adjustTimestamp(1757603400), notes: '', location: '', periodicTransactionId: null, categoryId: 9 },
      { amount: -31.0, title: 'Piwo ze znajomymi', transactionDate: adjustTimestamp(1757603520), notes: '', location: '', periodicTransactionId: null, categoryId: 4 },
      { amount: -53.0, title: 'Srodki chemiczne', transactionDate: adjustTimestamp(1757335980), notes: '', location: '', periodicTransactionId: null, categoryId: 8 },
      { amount: -45.0, title: 'Fryzjer', transactionDate: adjustTimestamp(1757595240), notes: '', location: '', periodicTransactionId: null, categoryId: 6 },
      { amount: -140.0, title: 'Wieksze zakupy spozywcze', transactionDate: adjustTimestamp(1757940840), notes: '', location: 'Kaufland', periodicTransactionId: null, categoryId: 9 },
      { amount: -84.0, title: 'Suplementy', transactionDate: adjustTimestamp(1755608160), notes: '', location: '', periodicTransactionId: null, categoryId: 6 },
      { amount: -74.0, title: 'Suplementy', transactionDate: adjustTimestamp(1758027420), notes: '', location: '', periodicTransactionId: null, categoryId: 6 },
      { amount: -41.0, title: 'Dobre wino', transactionDate: adjustTimestamp(1758027420), notes: '', location: 'Swiat win', periodicTransactionId: null, categoryId: 9 },
      { amount: -73.0, title: 'Abonament telefoniczny i internet', transactionDate: adjustTimestamp(1754830680), notes: null, location: null, periodicTransactionId: 9, categoryId: 8 },
      { amount: -73.0, title: 'Abonament telefoniczny i internet', transactionDate: adjustTimestamp(1757509080), notes: null, location: null, periodicTransactionId: 9, categoryId: 8 },
      { amount: -20.0, title: 'Inwestycja', transactionDate: adjustTimestamp(1758027600), notes: '', location: '', periodicTransactionId: null, categoryId: 2 },
      { amount: 1000.0, title: 'Oszczednosci', transactionDate: adjustTimestamp(1754744400), notes: '', location: '', periodicTransactionId: null, categoryId: 2 },
      { amount: -16.0, title: 'Kawa', transactionDate: adjustTimestamp(1757924160), notes: '', location: 'piekus', periodicTransactionId: null, categoryId: 9 },
      { amount: -14.0, title: 'kawa', transactionDate: adjustTimestamp(1758040560), notes: '', location: 'Piekus', periodicTransactionId: null, categoryId: 9 }
    ];

    for (const transaction of transactionsData) {
      await db.insert(transactions).values(transaction).execute();
    }

    // 6. Transaction Tags - wszystkie połączenia z zrzutu (zgodnie z oryginalną kolejnością ID)
    const transactionTagsData = [
      { transactionId: 13, tagId: 3 }, { transactionId: 6, tagId: 3 }, { transactionId: 7, tagId: 3 },
      { transactionId: 9, tagId: 1 }, { transactionId: 9, tagId: 2 }, { transactionId: 8, tagId: 3 },
      { transactionId: 14, tagId: 3 }, { transactionId: 14, tagId: 4 }, { transactionId: 10, tagId: 3 },
      { transactionId: 11, tagId: 3 }, { transactionId: 12, tagId: 3 }, { transactionId: 15, tagId: 3 },
      { transactionId: 16, tagId: 3 }, { transactionId: 17, tagId: 5 }, { transactionId: 19, tagId: 1 },
      { transactionId: 20, tagId: 5 }, { transactionId: 21, tagId: 5 }, { transactionId: 22, tagId: 5 },
      { transactionId: 18, tagId: 5 }, { transactionId: 23, tagId: 1 }, { transactionId: 23, tagId: 5 },
      { transactionId: 23, tagId: 6 }, { transactionId: 25, tagId: 5 }, { transactionId: 26, tagId: 4 },
      { transactionId: 26, tagId: 5 }, { transactionId: 27, tagId: 5 }, { transactionId: 28, tagId: 5 },
      { transactionId: 28, tagId: 4 }, { transactionId: 29, tagId: 5 }, { transactionId: 29, tagId: 6 },
      { transactionId: 30, tagId: 4 }, { transactionId: 30, tagId: 5 }, { transactionId: 30, tagId: 7 },
      { transactionId: 24, tagId: 5 }, { transactionId: 24, tagId: 7 }, { transactionId: 31, tagId: 5 },
      { transactionId: 32, tagId: 4 }, { transactionId: 32, tagId: 5 }, { transactionId: 32, tagId: 8 },
      { transactionId: 33, tagId: 3 }, { transactionId: 36, tagId: 1 }, { transactionId: 37, tagId: 1 },
      { transactionId: 39, tagId: 9 }, { transactionId: 40, tagId: 9 }, { transactionId: 59, tagId: 3 },
      { transactionId: 60, tagId: 3 }, { transactionId: 64, tagId: 3 }, { transactionId: 65, tagId: 1 },
      { transactionId: 66, tagId: 1 }, { transactionId: 67, tagId: 3 }, { transactionId: 68, tagId: 3 },
      { transactionId: 69, tagId: 1 }, { transactionId: 70, tagId: 1 }, { transactionId: 71, tagId: 10 },
      { transactionId: 72, tagId: 11 }, { transactionId: 73, tagId: 11 }, { transactionId: 74, tagId: 11 },
      { transactionId: 74, tagId: 10 }, { transactionId: 75, tagId: 10 }, { transactionId: 81, tagId: 3 },
      { transactionId: 82, tagId: 3 }, { transactionId: 83, tagId: 3 }, { transactionId: 84, tagId: 1 },
      { transactionId: 84, tagId: 2 }, { transactionId: 80, tagId: 2 }, { transactionId: 80, tagId: 1 },
      { transactionId: 79, tagId: 2 }, { transactionId: 79, tagId: 7 }, { transactionId: 79, tagId: 1 },
      { transactionId: 76, tagId: 7 }, { transactionId: 76, tagId: 1 }, { transactionId: 77, tagId: 7 },
      { transactionId: 77, tagId: 1 }, { transactionId: 78, tagId: 7 }, { transactionId: 78, tagId: 1 },
      { transactionId: 85, tagId: 3 }, { transactionId: 86, tagId: 3 }, { transactionId: 87, tagId: 3 },
      { transactionId: 88, tagId: 3 }, { transactionId: 90, tagId: 3 }, { transactionId: 92, tagId: 12 },
      { transactionId: 92, tagId: 8 }, { transactionId: 92, tagId: 4 }, { transactionId: 93, tagId: 12 },
      { transactionId: 93, tagId: 8 }, { transactionId: 93, tagId: 4 }, { transactionId: 95, tagId: 3 },
      { transactionId: 96, tagId: 3 }, { transactionId: 97, tagId: 3 }, { transactionId: 91, tagId: 4 },
      { transactionId: 91, tagId: 8 }, { transactionId: 91, tagId: 12 }, { transactionId: 98, tagId: 3 },
      { transactionId: 99, tagId: 3 }, { transactionId: 94, tagId: 6 }, { transactionId: 94, tagId: 1 },
      { transactionId: 100, tagId: 6 }, { transactionId: 100, tagId: 1 }, { transactionId: 101, tagId: 3 },
      { transactionId: 102, tagId: 3 }, { transactionId: 105, tagId: 7 }, { transactionId: 105, tagId: 1 },
      { transactionId: 106, tagId: 7 }, { transactionId: 106, tagId: 1 }
    ];

    for (const txTag of transactionTagsData) {
      await db.insert(transactionTags).values(txTag).execute();
    }

    console.log('[TestData] Dane z zrzutu SQL zostały dodane pomyślnie z przesunięciem czasowym i tagami!');
    return { success: true, message: 'Dane z zrzutu SQL zostały dodane pomyślnie z przesunięciem czasowym i tagami!' };

  } catch (error) {
    console.error('[TestData] Błąd podczas dodawania danych z zrzutu:', error);
    return { success: false, message: 'Błąd podczas dodawania danych z zrzutu: ' + error.message };
  }
};
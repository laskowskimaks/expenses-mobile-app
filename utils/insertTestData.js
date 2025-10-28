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

    // 1. Tags - dane z zrzutu w odpowiedniej kolejności (dokładnie jak we wzorze)
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
      { name: 'prezent', color: '#5943feff' },             // ID 10
      { name: 'Slub Ewy i Adama', color: '#f97316' },    // ID 11
      { name: 'kebab', color: '#f97316' }                // ID 12
    ];

    for (const tag of tagsData) {
      await db.insert(tags).values({ name: tag.name, color: tag.color }).execute();
    }

    // 2. Loyalty Cards - dane z zrzutu
    const loyaltyCardsData = [
      { name: 'hebe', barcodeData: '9930095914078', barcodeFormat: 'ean13', notes: '', imageUri: null },
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
      { amount: 70.0, title: 'Korepetycje', repeatInterval: 1, repeatUnit: 'week', startDate: adjustTimestamp(1756737060), nextOccurrenceDate: adjustTimestamp(1760365860), endDate: null, notes: 'Korepetycje z matematyki', categoryId: 2 },
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

    // 5. Transactions - dokładnie w takiej kolejności jak w transactions.csv
    const transactionsData = [
      { amount: 4666.0, title: 'Wyplata', transactionDate: adjustTimestamp(1754820000), notes: null, location: null, periodicTransactionId: 1, categoryId: 2 }, // ID 1
      { amount: 4666.0, title: 'Wyplata', transactionDate: adjustTimestamp(1757498400), notes: null, location: null, periodicTransactionId: 1, categoryId: 2 }, // ID 2
      // Brak ID 3, 4 w CSV - dodajemy puste sloty
      { amount: -5.99, title: 'Chleb', transactionDate: adjustTimestamp(1755503040), notes: '', location: 'Piekarnia Piekus', periodicTransactionId: null, categoryId: 9 }, // ID 3 (odpowiada CSV ID 5)
      { amount: -5.99, title: 'Chleb', transactionDate: adjustTimestamp(1755773160), notes: '', location: 'Piekarnia Piekus', periodicTransactionId: null, categoryId: 9 }, // ID 4 (odpowiada CSV ID 6)
      { amount: -5.99, title: 'Chleb', transactionDate: adjustTimestamp(1756118820), notes: '', location: 'Piekarnia Piekus', periodicTransactionId: null, categoryId: 9 }, // ID 5 (odpowiada CSV ID 7)
      { amount: -5.99, title: 'Chleb', transactionDate: adjustTimestamp(1756291680), notes: '', location: 'Piekarnia Piekus', periodicTransactionId: null, categoryId: 9 }, // ID 6 (odpowiada CSV ID 8)
      { amount: -13.38, title: 'Cos slodkiego', transactionDate: adjustTimestamp(1756291740), notes: '', location: 'Piekarnia Piekus', periodicTransactionId: null, categoryId: 9 }, // ID 7 (odpowiada CSV ID 9)
      { amount: -5.99, title: 'Chleb', transactionDate: adjustTimestamp(1757069700), notes: '', location: 'Piekarnia Piekus', periodicTransactionId: null, categoryId: 9 }, // ID 8 (odpowiada CSV ID 10)
      { amount: -2.5, title: 'Pol chleba', transactionDate: adjustTimestamp(1757328900), notes: '', location: 'Piekarnia Piekus', periodicTransactionId: null, categoryId: 9 }, // ID 9 (odpowiada CSV ID 11)
      { amount: -5.99, title: 'Chleb', transactionDate: adjustTimestamp(1757588160), notes: '', location: 'Piekarnia Piekus', periodicTransactionId: null, categoryId: 9 }, // ID 10 (odpowiada CSV ID 12)
      { amount: -8.6, title: 'Chleb i bulki', transactionDate: adjustTimestamp(1757933820), notes: '', location: '', periodicTransactionId: null, categoryId: 9 }, // ID 11 (odpowiada CSV ID 13)
      { amount: -20.99, title: 'Kanapka bartkowscy', transactionDate: adjustTimestamp(1756904880), notes: '', location: 'Piekarnia Bartkowscy', periodicTransactionId: null, categoryId: 9 }, // ID 12 (odpowiada CSV ID 14)
      { amount: -1350.0, title: 'Mieszkanie', transactionDate: adjustTimestamp(1755195600), notes: '', location: null, periodicTransactionId: 2, categoryId: 8 }, // ID 13 (odpowiada CSV ID 15)
      { amount: -1350.0, title: 'Mieszkanie', transactionDate: adjustTimestamp(1757874000), notes: '', location: null, periodicTransactionId: 2, categoryId: 8 }, // ID 14 (odpowiada CSV ID 16)
      { amount: -63.35, title: 'Pociag do Krakowa', transactionDate: adjustTimestamp(1755263820), notes: 'PKP IC', location: '', periodicTransactionId: null, categoryId: 7 }, // ID 15 (odpowiada CSV ID 17)
      { amount: -64.3, title: 'Pociag powrotny z Krakowa', transactionDate: adjustTimestamp(1755437160), notes: '', location: '', periodicTransactionId: null, categoryId: 7 }, // ID 16 (odpowiada CSV ID 18)
      { amount: 150.0, title: 'Wygrana w zdrapce', transactionDate: adjustTimestamp(1757942820), notes: 'Lotto', location: '', periodicTransactionId: null, categoryId: 2 }, // ID 17 (odpowiada CSV ID 19)
      { amount: -140.0, title: 'Nocleg w Krakowie', transactionDate: adjustTimestamp(1755264480), notes: 'Akademik w Krakowie', location: '', periodicTransactionId: null, categoryId: 8 }, // ID 18 (odpowiada CSV ID 20)
      { amount: -25.0, title: 'Bilet ZTP w Krakowie 72 h', transactionDate: adjustTimestamp(1755264660), notes: '', location: '', periodicTransactionId: null, categoryId: 7 }, // ID 19 (odpowiada CSV ID 21)
      { amount: -84.45, title: 'Jedzenie do akademika', transactionDate: adjustTimestamp(1755279180), notes: 'Ser, szynka, chleb', location: 'Lidl', periodicTransactionId: null, categoryId: 9 }, // ID 20 (odpowiada CSV ID 22)
      { amount: -32.0, title: 'Piwo ze znajomymi', transactionDate: adjustTimestamp(1755286500), notes: '', location: 'Craftownia', periodicTransactionId: null, categoryId: 4 }, // ID 21 (odpowiada CSV ID 23)
      { amount: -16.9, title: 'Duza kawa', transactionDate: adjustTimestamp(1755337020), notes: '', location: '', periodicTransactionId: null, categoryId: 9 }, // ID 22 (odpowiada CSV ID 24)
      { amount: -43.0, title: 'Pamiatki dla rodziny', transactionDate: adjustTimestamp(1755342480), notes: '', location: '', periodicTransactionId: null, categoryId: 3 }, // ID 23 (odpowiada CSV ID 25)
      { amount: -26.0, title: 'Obiad w pierogarni', transactionDate: adjustTimestamp(1755344520), notes: '', location: 'Pierogarnia Krakowiak', periodicTransactionId: null, categoryId: 9 }, // ID 24 (odpowiada CSV ID 26)
      { amount: -15.0, title: 'Zwiedzanie Zamku Krolewskiego', transactionDate: adjustTimestamp(1755351780), notes: '', location: 'Zamek Krolewski Wawel', periodicTransactionId: null, categoryId: 4 }, // ID 25 (odpowiada CSV ID 27)
      { amount: -45.0, title: 'Kolacja', transactionDate: adjustTimestamp(1755359160), notes: 'Burger', location: 'Burgerownia TOP', periodicTransactionId: null, categoryId: 9 }, // ID 26 (odpowiada CSV ID 28)
      { amount: -36.0, title: 'Mikstury w Wilczym Dole', transactionDate: adjustTimestamp(1755370140), notes: '', location: 'Pub Wilczy Dol', periodicTransactionId: null, categoryId: 4 }, // ID 27 (odpowiada CSV ID 29)
      { amount: -41.0, title: 'Sniadanie z kawa', transactionDate: adjustTimestamp(1755413400), notes: '', location: 'Cafe Camelot', periodicTransactionId: null, categoryId: 9 }, // ID 28 (odpowiada CSV ID 30)
      { amount: -110.0, title: 'Wycieczka do Kopalni Soli w Wieliczce', transactionDate: adjustTimestamp(1755417120), notes: '', location: '', periodicTransactionId: null, categoryId: 4 }, // ID 29 (odpowiada CSV ID 31)
      { amount: -39.0, title: 'Jedzenie w maku', transactionDate: adjustTimestamp(1755435240), notes: '', location: 'Mc Donald\'s ', periodicTransactionId: null, categoryId: 9 }, // ID 30 (odpowiada CSV ID 32)
      { amount: -125.43, title: 'Wieksze zakupy spozywcze', transactionDate: adjustTimestamp(1754834340), notes: '', location: 'Kaufland', periodicTransactionId: null, categoryId: 9 }, // ID 31 (odpowiada CSV ID 33)
      { amount: -15.99, title: '5 GB iCloud', transactionDate: adjustTimestamp(1754834640), notes: null, location: null, periodicTransactionId: 3, categoryId: 1 }, // ID 32 (odpowiada CSV ID 34)
      { amount: -15.99, title: '5 GB iCloud', transactionDate: adjustTimestamp(1757513040), notes: null, location: null, periodicTransactionId: 3, categoryId: 1 }, // ID 33 (odpowiada CSV ID 35)
      { amount: -30.0, title: 'Spotify', transactionDate: adjustTimestamp(1754834700), notes: null, location: null, periodicTransactionId: 4, categoryId: 4 }, // ID 34 (odpowiada CSV ID 36)
      { amount: -30.0, title: 'Spotify', transactionDate: adjustTimestamp(1757513100), notes: null, location: null, periodicTransactionId: 4, categoryId: 4 }, // ID 35 (odpowiada CSV ID 37)
      // Brak ID 38 w CSV
      { amount: -40.0, title: 'Zrzutka na hospicjum', transactionDate: adjustTimestamp(1754834820), notes: null, location: null, periodicTransactionId: 5, categoryId: 1 }, // ID 36 (odpowiada CSV ID 39)
      { amount: -40.0, title: 'Zrzutka na hospicjum', transactionDate: adjustTimestamp(1757513220), notes: null, location: null, periodicTransactionId: 5, categoryId: 1 }, // ID 37 (odpowiada CSV ID 40)
      { amount: -2.3, title: 'Bilet miejski', transactionDate: adjustTimestamp(1755353340), notes: '', location: '', periodicTransactionId: null, categoryId: 7 }, // ID 38 (odpowiada CSV ID 41)
      { amount: -2.3, title: 'Bilet miejski', transactionDate: adjustTimestamp(1755526200), notes: '', location: '', periodicTransactionId: null, categoryId: 7 }, // ID 39 (odpowiada CSV ID 42)
      { amount: -2.3, title: 'Bilet miejski', transactionDate: adjustTimestamp(1755612600), notes: '', location: '', periodicTransactionId: null, categoryId: 7 }, // ID 40 (odpowiada CSV ID 43)
      { amount: -25.0, title: 'Rovee', transactionDate: adjustTimestamp(1755699060), notes: '', location: '', periodicTransactionId: null, categoryId: 7 }, // ID 41 (odpowiada CSV ID 44)
      { amount: -150.0, title: 'Paliwo', transactionDate: adjustTimestamp(1755871860), notes: '', location: '', periodicTransactionId: null, categoryId: 7 }, // ID 42 (odpowiada CSV ID 45)
      { amount: -35.0, title: 'Bilet do Smetowa PKP', transactionDate: adjustTimestamp(1755871920), notes: '', location: '', periodicTransactionId: null, categoryId: 7 }, // ID 43 (odpowiada CSV ID 46)
      { amount: -35.0, title: 'Bilet do Torunia PKP', transactionDate: adjustTimestamp(1756044720), notes: '', location: '', periodicTransactionId: null, categoryId: 7 }, // ID 44 (odpowiada CSV ID 47)
      { amount: -2.3, title: 'Bilet miejski', transactionDate: adjustTimestamp(1756131180), notes: '', location: '', periodicTransactionId: null, categoryId: 7 }, // ID 45 (odpowiada CSV ID 48)
      { amount: -2.3, title: 'Bilet miejski', transactionDate: adjustTimestamp(1755785580), notes: '', location: '', periodicTransactionId: null, categoryId: 7 }, // ID 46 (odpowiada CSV ID 49)
      { amount: -2.3, title: 'Bilet miejski', transactionDate: adjustTimestamp(1756217640), notes: '', location: '', periodicTransactionId: null, categoryId: 7 }, // ID 47 (odpowiada CSV ID 50)
      { amount: -2.3, title: 'Bilet miejski', transactionDate: adjustTimestamp(1756563300), notes: '', location: '', periodicTransactionId: null, categoryId: 7 }, // ID 48 (odpowiada CSV ID 51)
      { amount: -2.3, title: 'Bilet miejski', transactionDate: adjustTimestamp(1757945760), notes: '', location: '', periodicTransactionId: null, categoryId: 7 }, // ID 49 (odpowiada CSV ID 52)
      { amount: -2.3, title: 'Bilet miejski', transactionDate: adjustTimestamp(1756649760), notes: '', location: '', periodicTransactionId: null, categoryId: 7 }, // ID 50 (odpowiada CSV ID 53)
      { amount: -2.3, title: 'Bilet miejski', transactionDate: adjustTimestamp(1756822560), notes: '', location: '', periodicTransactionId: null, categoryId: 7 }, // ID 51 (odpowiada CSV ID 54)
      { amount: -2.3, title: 'Bilet miejski', transactionDate: adjustTimestamp(1756995360), notes: '', location: '', periodicTransactionId: null, categoryId: 7 }, // ID 52 (odpowiada CSV ID 55)
      { amount: -2.3, title: 'Bilet miejski', transactionDate: adjustTimestamp(1757427420), notes: '', location: '', periodicTransactionId: null, categoryId: 7 }, // ID 53 (odpowiada CSV ID 56)
      { amount: -120.0, title: 'Karnet silownia', transactionDate: adjustTimestamp(1754835420), notes: null, location: null, periodicTransactionId: 6, categoryId: 6 }, // ID 54 (odpowiada CSV ID 57)
      { amount: -120.0, title: 'Karnet silownia', transactionDate: adjustTimestamp(1757513820), notes: null, location: null, periodicTransactionId: 6, categoryId: 6 }, // ID 55 (odpowiada CSV ID 58)
      { amount: -41.57, title: 'Uzupelnienie apteczki', transactionDate: adjustTimestamp(1756909080), notes: '', location: 'Gemini', periodicTransactionId: null, categoryId: 6 }, // ID 56 (odpowiada CSV ID 59)
      { amount: -160.0, title: 'Kurs angielskiego', transactionDate: adjustTimestamp(1757686740), notes: '', location: '', periodicTransactionId: null, categoryId: 5 }, // ID 57 (odpowiada CSV ID 60)
      // Brak ID 61-63 w CSV
      { amount: -75.0, title: 'Ubezpiecznie NNW', transactionDate: adjustTimestamp(1756996380), notes: '', location: '', periodicTransactionId: null, categoryId: 2 }, // ID 58 (odpowiada CSV ID 64)
      { amount: -34.99, title: 'Netflix', transactionDate: adjustTimestamp(1754836500), notes: null, location: null, periodicTransactionId: 8, categoryId: 4 }, // ID 59 (odpowiada CSV ID 65)
      { amount: -34.99, title: 'Netflix', transactionDate: adjustTimestamp(1757514900), notes: null, location: null, periodicTransactionId: 8, categoryId: 4 }, // ID 60 (odpowiada CSV ID 66)
      { amount: -160.73, title: 'Ubranie', transactionDate: adjustTimestamp(1757687760), notes: 'Spodnie i bluza', location: '', periodicTransactionId: null, categoryId: 3 }, // ID 61 (odpowiada CSV ID 67)
      { amount: -130.0, title: 'Buty', transactionDate: adjustTimestamp(1756046220), notes: '', location: 'CCC', periodicTransactionId: null, categoryId: 3 }, // ID 62 (odpowiada CSV ID 68)
      { amount: -39.99, title: 'Ksiazka', transactionDate: adjustTimestamp(1757947080), notes: 'Droga Krolow, Sanderson', location: 'Empik', periodicTransactionId: null, categoryId: 4 }, // ID 63 (odpowiada CSV ID 69)
      { amount: -30.0, title: 'Kino', transactionDate: adjustTimestamp(1757788740), notes: '', location: 'Cinema City', periodicTransactionId: null, categoryId: 4 }, // ID 64 (odpowiada CSV ID 70)
      { amount: -43.0, title: 'Kwiatki dla mamy', transactionDate: adjustTimestamp(1755873660), notes: '', location: 'Kwiaciania', periodicTransactionId: null, categoryId: 1 }, // ID 65 (odpowiada CSV ID 71)
      { amount: -150.0, title: 'Paliwo', transactionDate: adjustTimestamp(1756565040), notes: 'Paliwo do Pelplina', location: '', periodicTransactionId: null, categoryId: 7 }, // ID 66 (odpowiada CSV ID 72)
      { amount: -50.0, title: 'Pranie garnituru', transactionDate: adjustTimestamp(1756392360), notes: '', location: '', periodicTransactionId: null, categoryId: 3 }, // ID 67 (odpowiada CSV ID 73)
      { amount: -700.0, title: 'Prezent slubny', transactionDate: adjustTimestamp(1756565220), notes: '', location: '', periodicTransactionId: null, categoryId: 1 }, // ID 68 (odpowiada CSV ID 74)
      { amount: -71.0, title: 'Prezent urodzinowy dla Wojciecha', transactionDate: adjustTimestamp(1755615060), notes: '', location: '', periodicTransactionId: null, categoryId: 1 }, // ID 69 (odpowiada CSV ID 75)
      { amount: -20.0, title: 'Kawa', transactionDate: adjustTimestamp(1755787920), notes: '', location: 'Grande Coffe', periodicTransactionId: null, categoryId: 9 }, // ID 70 (odpowiada CSV ID 76)
      { amount: -17.9, title: 'Kawa', transactionDate: adjustTimestamp(1756911180), notes: '', location: '', periodicTransactionId: null, categoryId: 9 }, // ID 71 (odpowiada CSV ID 77)
      { amount: -17.9, title: 'Kawa', transactionDate: adjustTimestamp(1757343180), notes: '', location: '', periodicTransactionId: null, categoryId: 9 }, // ID 72 (odpowiada CSV ID 78)
      { amount: -45.0, title: 'Kawa z ciastem', transactionDate: adjustTimestamp(1757775240), notes: '', location: '', periodicTransactionId: null, categoryId: 9 }, // ID 73 (odpowiada CSV ID 79)
      { amount: -14.0, title: 'Drozdzowka', transactionDate: adjustTimestamp(1757343300), notes: '', location: '', periodicTransactionId: null, categoryId: 9 }, // ID 74 (odpowiada CSV ID 80)
      { amount: -140.0, title: 'Wieksze zakupy spozywcze', transactionDate: adjustTimestamp(1755615300), notes: '', location: 'Kaufland', periodicTransactionId: null, categoryId: 9 }, // ID 75 (odpowiada CSV ID 81)
      { amount: -600.0, title: 'Dentysta', transactionDate: adjustTimestamp(1756220160), notes: '', location: 'Dentaurus', periodicTransactionId: null, categoryId: 6 }, // ID 76 (odpowiada CSV ID 82)
      { amount: -138.0, title: 'Wieksze zakupy spozywcze', transactionDate: adjustTimestamp(1756738740), notes: '', location: 'Biedronka', periodicTransactionId: null, categoryId: 9 }, // ID 77 (odpowiada CSV ID 83)
      { amount: -10.0, title: 'Piernik', transactionDate: adjustTimestamp(1757689200), notes: '', location: '', periodicTransactionId: null, categoryId: 9 }, // ID 78 (odpowiada CSV ID 84)
      { amount: -151.48, title: 'Wieksze zakupy spozywcze', transactionDate: adjustTimestamp(1757516520), notes: '', location: 'Biedronka', periodicTransactionId: null, categoryId: 9 }, // ID 79 (odpowiada CSV ID 85)
      { amount: -31.0, title: 'Mniejsze zakupy spozywcze', transactionDate: adjustTimestamp(1755788640), notes: '', location: 'Polo ', periodicTransactionId: null, categoryId: 9 }, // ID 80 (odpowiada CSV ID 86)
      { amount: -48.0, title: 'Mniejsze zakupy spozywcze', transactionDate: adjustTimestamp(1756998300), notes: '', location: 'Polo', periodicTransactionId: null, categoryId: 9 }, // ID 81 (odpowiada CSV ID 87)
      { amount: -26.0, title: 'Mniejsze zakupy spozywcze', transactionDate: adjustTimestamp(1757689560), notes: '', location: 'Polo', periodicTransactionId: null, categoryId: 9 }, // ID 82 (odpowiada CSV ID 88)
      { amount: -38.0, title: 'Bolt', transactionDate: adjustTimestamp(1757786820), notes: '', location: '', periodicTransactionId: null, categoryId: 7 }, // ID 83 (odpowiada CSV ID 89)
      { amount: -42.0, title: 'Zel pod prysznic itp', transactionDate: adjustTimestamp(1757948880), notes: '', location: 'Rossman', periodicTransactionId: null, categoryId: 3 }, // ID 84 (odpowiada CSV ID 90)
      { amount: -34.0, title: 'Kebab', transactionDate: adjustTimestamp(1757956140), notes: '', location: '', periodicTransactionId: null, categoryId: 9 }, // ID 85 (odpowiada CSV ID 91)
      { amount: -34.0, title: 'Kebab', transactionDate: adjustTimestamp(1757257740), notes: '', location: '', periodicTransactionId: null, categoryId: 9 }, // ID 86 (odpowiada CSV ID 92)
      { amount: -34.0, title: 'Kebab', transactionDate: adjustTimestamp(1757603400), notes: '', location: '', periodicTransactionId: null, categoryId: 9 }, // ID 87 (odpowiada CSV ID 93)
      { amount: -31.0, title: 'Piwo ze znajomymi', transactionDate: adjustTimestamp(1757603520), notes: '', location: '', periodicTransactionId: null, categoryId: 4 }, // ID 88 (odpowiada CSV ID 94)
      { amount: -53.0, title: 'Srodki chemiczne', transactionDate: adjustTimestamp(1757335980), notes: '', location: '', periodicTransactionId: null, categoryId: 8 }, // ID 89 (odpowiada CSV ID 95)
      { amount: -45.0, title: 'Fryzjer', transactionDate: adjustTimestamp(1757595240), notes: '', location: '', periodicTransactionId: null, categoryId: 6 }, // ID 90 (odpowiada CSV ID 96)
      { amount: -140.0, title: 'Wieksze zakupy spozywcze', transactionDate: adjustTimestamp(1757940840), notes: '', location: 'Kaufland', periodicTransactionId: null, categoryId: 9 }, // ID 91 (odpowiada CSV ID 97)
      { amount: -84.0, title: 'Suplementy', transactionDate: adjustTimestamp(1755608160), notes: '', location: '', periodicTransactionId: null, categoryId: 6 }, // ID 92 (odpowiada CSV ID 98)
      { amount: -74.0, title: 'Suplementy', transactionDate: adjustTimestamp(1758027420), notes: '', location: '', periodicTransactionId: null, categoryId: 6 }, // ID 93 (odpowiada CSV ID 99)
      { amount: -41.0, title: 'Dobre wino', transactionDate: adjustTimestamp(1758027420), notes: '', location: 'Swiat win', periodicTransactionId: null, categoryId: 9 }, // ID 94 (odpowiada CSV ID 100)
      { amount: -73.0, title: 'Abonament telefoniczny i internet', transactionDate: adjustTimestamp(1754830680), notes: null, location: null, periodicTransactionId: 9, categoryId: 8 }, // ID 95 (odpowiada CSV ID 101)
      { amount: -73.0, title: 'Abonament telefoniczny i internet', transactionDate: adjustTimestamp(1757509080), notes: null, location: null, periodicTransactionId: 9, categoryId: 8 }, // ID 96 (odpowiada CSV ID 102)
      { amount: -20.0, title: 'Inwestycja', transactionDate: adjustTimestamp(1758027600), notes: '', location: '', periodicTransactionId: null, categoryId: 2 }, // ID 97 (odpowiada CSV ID 103)
      { amount: 1000.0, title: 'Oszczednosci', transactionDate: adjustTimestamp(1754744400), notes: '', location: '', periodicTransactionId: null, categoryId: 2 }, // ID 98 (odpowiada CSV ID 104)
      { amount: -16.0, title: 'Kawa', transactionDate: adjustTimestamp(1757924160), notes: '', location: 'piekus', periodicTransactionId: null, categoryId: 9 }, // ID 99 (odpowiada CSV ID 105)
      { amount: -14.0, title: 'kawa', transactionDate: adjustTimestamp(1758040560), notes: '', location: 'Piekus', periodicTransactionId: null, categoryId: 9 }, // ID 100 (odpowiada CSV ID 106)
      { amount: 70.0, title: 'Korepetycje', transactionDate: adjustTimestamp(1756737060), notes: 'Korepetycje z matematyki', location: null, periodicTransactionId: 7, categoryId: 2 }, // ID 101 (odpowiada CSV ID 2110)
      { amount: 70.0, title: 'Korepetycje', transactionDate: adjustTimestamp(1757341860), notes: 'Korepetycje z matematyki', location: null, periodicTransactionId: 7, categoryId: 2 }, // ID 102 (odpowiada CSV ID 2111)
      { amount: 70.0, title: 'Korepetycje', transactionDate: adjustTimestamp(1757946660), notes: 'Korepetycje z matematyki', location: null, periodicTransactionId: 7, categoryId: 2 }, // ID 103 (odpowiada CSV ID 2112)
      { amount: -6.0, title: 'chleb', transactionDate: adjustTimestamp(1758208680), notes: '', location: '', periodicTransactionId: null, categoryId: 9 }, // ID 104 (odpowiada CSV ID 2114)
      { amount: 70.0, title: 'Korepetycje', transactionDate: adjustTimestamp(1758551460), notes: 'Korepetycje z matematyki', location: null, periodicTransactionId: 7, categoryId: 2 }, // ID 105 (odpowiada CSV ID 2115)
      { amount: 70.0, title: 'Korepetycje', transactionDate: adjustTimestamp(1759156260), notes: 'Korepetycje z matematyki', location: null, periodicTransactionId: 7, categoryId: 2 }, // ID 106 (odpowiada CSV ID 2116)
      { amount: 70.0, title: 'Korepetycje', transactionDate: adjustTimestamp(1759761060), notes: 'Korepetycje z matematyki', location: null, periodicTransactionId: 7, categoryId: 2 } // ID 107 (odpowiada CSV ID 2117)
    ];

    // Wstawiamy wszystkie transakcje standardowym Drizzle ORM
    for (const transaction of transactionsData) {
      await db.insert(transactions).values(transaction).execute();
    }

    // 6. Transaction Tags - skorygowane mapowanie według rzeczywistych ID transakcji w Drizzle
    // Drizzle ID = pozycja w tablicy + 1, ale z uwzględnieniem przesunięć przez brakujące CSV ID
    const transactionTagsData = [
      // CSV ID 13 -> Drizzle ID 11 (Chleb i bulki)
      { transactionId: 11, tagId: 3 },
      // CSV ID 6 -> Drizzle ID 4 (Chleb)
      { transactionId: 4, tagId: 3 },
      // CSV ID 7 -> Drizzle ID 5 (Chleb)
      { transactionId: 5, tagId: 3 },
      // CSV ID 9 -> Drizzle ID 7 (Cos slodkiego)
      { transactionId: 7, tagId: 1 },
      { transactionId: 7, tagId: 2 },
      // CSV ID 8 -> Drizzle ID 6 (Chleb)
      { transactionId: 6, tagId: 3 },
      // CSV ID 14 -> Drizzle ID 12 (Kanapka bartkowscy)
      { transactionId: 12, tagId: 3 },
      { transactionId: 12, tagId: 4 },
      // CSV ID 10 -> Drizzle ID 8 (Chleb)
      { transactionId: 8, tagId: 3 },
      // CSV ID 11 -> Drizzle ID 9 (Pol chleba)
      { transactionId: 9, tagId: 3 },
      // CSV ID 12 -> Drizzle ID 10 (Chleb)
      { transactionId: 10, tagId: 3 },
      // CSV ID 15 -> Drizzle ID 13 (Mieszkanie)
      { transactionId: 13, tagId: 3 },
      // CSV ID 16 -> Drizzle ID 14 (Mieszkanie)
      { transactionId: 14, tagId: 3 },
      // CSV ID 17 -> Drizzle ID 15 (Pociag do Krakowa)
      { transactionId: 15, tagId: 5 },
      // CSV ID 19 -> Drizzle ID 17 (Wygrana w zdrapce)
      { transactionId: 17, tagId: 1 },
      // CSV ID 20 -> Drizzle ID 18 (Nocleg w Krakowie)
      { transactionId: 18, tagId: 5 },
      // CSV ID 21 -> Drizzle ID 19 (Bilet ZTP w Krakowie)
      { transactionId: 19, tagId: 5 },
      // CSV ID 22 -> Drizzle ID 20 (Jedzenie do akademika)
      { transactionId: 20, tagId: 5 },
      // CSV ID 18 -> Drizzle ID 16 (Pociag powrotny z Krakowa)
      { transactionId: 16, tagId: 5 },
      // CSV ID 23 -> Drizzle ID 21 (Piwo ze znajomymi)
      { transactionId: 21, tagId: 1 },
      { transactionId: 21, tagId: 5 },
      { transactionId: 21, tagId: 6 },
      // CSV ID 25 -> Drizzle ID 23 (Pamiatki dla rodziny)
      { transactionId: 23, tagId: 5 },
      // CSV ID 26 -> Drizzle ID 24 (Obiad w pierogarni)
      { transactionId: 24, tagId: 4 },
      { transactionId: 24, tagId: 5 },
      // CSV ID 27 -> Drizzle ID 25 (Zwiedzanie Zamku)
      { transactionId: 25, tagId: 5 },
      // CSV ID 28 -> Drizzle ID 26 (Kolacja)
      { transactionId: 26, tagId: 5 },
      { transactionId: 26, tagId: 4 },
      // CSV ID 29 -> Drizzle ID 27 (Mikstury w Wilczym Dole)
      { transactionId: 27, tagId: 5 },
      { transactionId: 27, tagId: 6 },
      // CSV ID 30 -> Drizzle ID 28 (Sniadanie z kawa)
      { transactionId: 28, tagId: 4 },
      { transactionId: 28, tagId: 5 },
      { transactionId: 28, tagId: 7 },
      // CSV ID 24 -> Drizzle ID 22 (Duza kawa)
      { transactionId: 22, tagId: 5 },
      { transactionId: 22, tagId: 7 },
      // CSV ID 31 -> Drizzle ID 29 (Wycieczka do Kopalni Soli)
      { transactionId: 29, tagId: 5 },
      // CSV ID 32 -> Drizzle ID 30 (Jedzenie w maku)
      { transactionId: 30, tagId: 4 },
      { transactionId: 30, tagId: 5 },
      { transactionId: 30, tagId: 8 },
      // CSV ID 33 -> Drizzle ID 31 (Wieksze zakupy spozywcze)
      { transactionId: 31, tagId: 3 },
      // CSV ID 36 -> Drizzle ID 34 (Spotify)
      { transactionId: 34, tagId: 1 },
      // CSV ID 37 -> Drizzle ID 35 (Spotify)
      { transactionId: 35, tagId: 1 },
      // CSV ID 39 -> Drizzle ID 36 (Zrzutka na hospicjum)
      { transactionId: 36, tagId: 9 },
      // CSV ID 40 -> Drizzle ID 37 (Zrzutka na hospicjum)
      { transactionId: 37, tagId: 9 },
      // CSV ID 59 -> Drizzle ID 56 (Uzupelnienie apteczki)
      { transactionId: 56, tagId: 3 },
      // CSV ID 60 -> Drizzle ID 57 (Kurs angielskiego)
      { transactionId: 57, tagId: 3 },
      // CSV ID 64 -> Drizzle ID 58 (Ubezpiecznie NNW)
      { transactionId: 58, tagId: 3 },
      // CSV ID 65 -> Drizzle ID 59 (Netflix)
      { transactionId: 59, tagId: 1 },
      // CSV ID 66 -> Drizzle ID 60 (Netflix)
      { transactionId: 60, tagId: 1 },
      // CSV ID 67 -> Drizzle ID 61 (Ubranie)
      { transactionId: 61, tagId: 3 },
      // CSV ID 68 -> Drizzle ID 62 (Buty)
      { transactionId: 62, tagId: 3 },
      // CSV ID 69 -> Drizzle ID 63 (Ksiazka)
      { transactionId: 63, tagId: 1 },
      // CSV ID 70 -> Drizzle ID 64 (Kino)
      { transactionId: 64, tagId: 1 },
      // CSV ID 71 -> Drizzle ID 65 (Kwiatki dla mamy)
      { transactionId: 65, tagId: 10 },
      // CSV ID 72 -> Drizzle ID 66 (Paliwo do Pelplina)
      { transactionId: 66, tagId: 11 },
      // CSV ID 73 -> Drizzle ID 67 (Pranie garnituru)
      { transactionId: 67, tagId: 11 },
      // CSV ID 74 -> Drizzle ID 68 (Prezent slubny)
      { transactionId: 68, tagId: 11 },
      { transactionId: 68, tagId: 10 },
      // CSV ID 75 -> Drizzle ID 69 (Prezent urodzinowy)
      { transactionId: 69, tagId: 10 },
      // CSV ID 81 -> Drizzle ID 75 (Wieksze zakupy spozywcze)
      { transactionId: 75, tagId: 3 },
      // CSV ID 82 -> Drizzle ID 76 (Dentysta)
      { transactionId: 76, tagId: 3 },
      // CSV ID 83 -> Drizzle ID 77 (Wieksze zakupy spozywcze)
      { transactionId: 77, tagId: 3 },
      // CSV ID 84 -> Drizzle ID 78 (Piernik)
      { transactionId: 78, tagId: 1 },
      { transactionId: 78, tagId: 2 },
      // CSV ID 80 -> Drizzle ID 74 (Drozdzowka)
      { transactionId: 74, tagId: 2 },
      { transactionId: 74, tagId: 1 },
      // CSV ID 79 -> Drizzle ID 73 (Kawa z ciastem)
      { transactionId: 73, tagId: 2 },
      { transactionId: 73, tagId: 7 },
      { transactionId: 73, tagId: 1 },
      // CSV ID 76 -> Drizzle ID 70 (Kawa)
      { transactionId: 70, tagId: 7 },
      { transactionId: 70, tagId: 1 },
      // CSV ID 77 -> Drizzle ID 71 (Kawa)
      { transactionId: 71, tagId: 7 },
      { transactionId: 71, tagId: 1 },
      // CSV ID 78 -> Drizzle ID 72 (Kawa)
      { transactionId: 72, tagId: 7 },
      { transactionId: 72, tagId: 1 },
      // CSV ID 85 -> Drizzle ID 79 (Wieksze zakupy spozywcze)
      { transactionId: 79, tagId: 3 },
      // CSV ID 86 -> Drizzle ID 80 (Mniejsze zakupy spozywcze)
      { transactionId: 80, tagId: 3 },
      // CSV ID 87 -> Drizzle ID 81 (Mniejsze zakupy spozywcze)
      { transactionId: 81, tagId: 3 },
      // CSV ID 88 -> Drizzle ID 82 (Mniejsze zakupy spozywcze)
      { transactionId: 82, tagId: 3 },
      // CSV ID 90 -> Drizzle ID 84 (Zel pod prysznic)
      { transactionId: 84, tagId: 3 },
      // CSV ID 92 -> Drizzle ID 86 (Kebab)
      { transactionId: 86, tagId: 12 },
      { transactionId: 86, tagId: 8 },
      { transactionId: 86, tagId: 4 },
      // CSV ID 93 -> Drizzle ID 87 (Kebab)
      { transactionId: 87, tagId: 12 },
      { transactionId: 87, tagId: 8 },
      { transactionId: 87, tagId: 4 },
      // CSV ID 95 -> Drizzle ID 89 (Srodki chemiczne)
      { transactionId: 89, tagId: 3 },
      // CSV ID 96 -> Drizzle ID 90 (Fryzjer)
      { transactionId: 90, tagId: 3 },
      // CSV ID 97 -> Drizzle ID 91 (Wieksze zakupy spozywcze)
      { transactionId: 91, tagId: 3 },
      // CSV ID 91 -> Drizzle ID 85 (Kebab)
      { transactionId: 85, tagId: 4 },
      { transactionId: 85, tagId: 8 },
      { transactionId: 85, tagId: 12 },
      // CSV ID 98 -> Drizzle ID 92 (Suplementy)
      { transactionId: 92, tagId: 3 },
      // CSV ID 99 -> Drizzle ID 93 (Suplementy)
      { transactionId: 93, tagId: 3 },
      // CSV ID 94 -> Drizzle ID 88 (Piwo ze znajomymi)
      { transactionId: 88, tagId: 6 },
      { transactionId: 88, tagId: 1 },
      // CSV ID 100 -> Drizzle ID 94 (Dobre wino)
      { transactionId: 94, tagId: 6 },
      { transactionId: 94, tagId: 1 },
      // CSV ID 101 -> Drizzle ID 95 (Abonament telefoniczny)
      { transactionId: 95, tagId: 3 },
      // CSV ID 102 -> Drizzle ID 96 (Abonament telefoniczny)
      { transactionId: 96, tagId: 3 },
      // CSV ID 105 -> Drizzle ID 99 (Kawa)
      { transactionId: 99, tagId: 7 },
      { transactionId: 99, tagId: 1 },
      // CSV ID 106 -> Drizzle ID 100 (kawa)
      { transactionId: 100, tagId: 7 },
      { transactionId: 100, tagId: 1 },
      // CSV ID 2114 -> Drizzle ID 104 (chleb)
      { transactionId: 104, tagId: 3 }
    ];

    for (const txTag of transactionTagsData) {
      await db.insert(transactionTags).values(txTag).execute();
    }

    console.log('[TestData] Dane z zrzutu SQL zostały dodane pomyślnie ');
    return { success: true, message: 'Dane z zrzutu SQL zostały dodane pomyślnie ' };

  } catch (error) {
    console.error('[TestData] Błąd podczas dodawania danych z zrzutu:', error);
    return { success: false, message: 'Błąd podczas dodawania danych z zrzutu: ' + error.message };
  }
};
// Comprehensive Offline Polish Nutritional Database (IŻŻ / Clinical standard per 100g)
// Provides instant 0ms offline baseline for all 229 BiteCraft recipes and fallback for Open Food Facts

export const NUTRITION_DATABASE = [
  // --- Mięso, drób i ryby ---
  { name: 'Mięso z piersi kurczaka', keywords: ['kurczak', 'piersi kurczak', 'filet z kurczak'], kcal: 99, protein: 21.5, fat: 1.3, carbs: 0, dept: 'Mięso i ryby' },
  { name: 'Mięso z piersi indyka', keywords: ['indyk', 'piersi indyk', 'szynka z indyk'], kcal: 84, protein: 19.2, fat: 0.7, carbs: 0, dept: 'Mięso i ryby' },
  { name: 'Chude mięso mielone drobiowe', keywords: ['mielone z indyk', 'mielone drobiow', 'mielone z kurczak'], kcal: 120, protein: 19, fat: 4.5, carbs: 0, dept: 'Mięso i ryby' },
  { name: 'Mięso mielone wołowe', keywords: ['mielone wołow', 'wołowin'], kcal: 155, protein: 20, fat: 8, carbs: 0, dept: 'Mięso i ryby' },
  { name: 'Polędwiczka wieprzowa', keywords: ['polędwic'], kcal: 109, protein: 21, fat: 2.2, carbs: 0, dept: 'Mięso i ryby' },
  { name: 'Schab wieprzowy', keywords: ['schab'], kcal: 129, protein: 22, fat: 4.5, carbs: 0, dept: 'Mięso i ryby' },
  { name: 'Szynka z kurczaka / indyka', keywords: ['szynk', 'wędlin'], kcal: 95, protein: 18, fat: 2, carbs: 1, dept: 'Mięso i ryby' },
  { name: 'Łosoś świeży', keywords: ['łosoś'], kcal: 201, protein: 20, fat: 13, carbs: 0, dept: 'Mięso i ryby' },
  { name: 'Dorsz świeży', keywords: ['dorsz'], kcal: 78, protein: 17.7, fat: 0.7, carbs: 0, dept: 'Mięso i ryby' },
  { name: 'Pstrąg tęczowy', keywords: ['pstrąg'], kcal: 140, protein: 19, fat: 7, carbs: 0, dept: 'Mięso i ryby' },
  { name: 'Tuńczyk w sosie własnym', keywords: ['tuńczyk'], kcal: 109, protein: 25.5, fat: 0.8, carbs: 0, dept: 'Mięso i ryby' },
  { name: 'Krewetki', keywords: ['krewetk'], kcal: 86, protein: 18.5, fat: 0.8, carbs: 0.5, dept: 'Mięso i ryby' },
  { name: 'Tofu naturalne', keywords: ['tofu'], kcal: 118, protein: 12, fat: 7, carbs: 2, dept: 'Nabiał i jaja' },
  { name: 'Tempeh', keywords: ['tempeh'], kcal: 192, protein: 20, fat: 11, carbs: 7, dept: 'Nabiał i jaja' },

  // --- Nabiał i jaja ---
  { name: 'Jajko kurze całe', keywords: ['jajko', 'jajka', 'jaj'], kcal: 140, protein: 12.5, fat: 9.7, carbs: 0.6, dept: 'Nabiał i jaja' },
  { name: 'Białko jajka kurzego', keywords: ['białko jaj'], kcal: 52, protein: 11, fat: 0.2, carbs: 0.7, dept: 'Nabiał i jaja' },
  { name: 'Jogurt skyr naturalny', keywords: ['skyr', 'jogurt skyr'], kcal: 65, protein: 12, fat: 0.2, carbs: 4, dept: 'Nabiał i jaja' },
  { name: 'Jogurt naturalny 2%', keywords: ['jogurt naturaln'], kcal: 60, protein: 4.3, fat: 2, carbs: 6, dept: 'Nabiał i jaja' },
  { name: 'Jogurt grecki', keywords: ['jogurt greck'], kcal: 115, protein: 9, fat: 5, carbs: 4, dept: 'Nabiał i jaja' },
  { name: 'Serek wiejski lekki', keywords: ['serek wiejski lekki'], kcal: 81, protein: 11, fat: 3, carbs: 2, dept: 'Nabiał i jaja' },
  { name: 'Serek wiejski klasyczny', keywords: ['serek wiejsk'], kcal: 97, protein: 11, fat: 5, carbs: 2, dept: 'Nabiał i jaja' },
  { name: 'Ser twarogowy półtłusty', keywords: ['twaróg', 'twarogow', 'twarożek'], kcal: 113, protein: 17.5, fat: 4, carbs: 3.7, dept: 'Nabiał i jaja' },
  { name: 'Ser twarogowy chudy', keywords: ['twaróg chud'], kcal: 86, protein: 19.8, fat: 0.5, carbs: 3.5, dept: 'Nabiał i jaja' },
  { name: 'Ser mozzarella kulka', keywords: ['mozzarella'], kcal: 250, protein: 18, fat: 19, carbs: 1.5, dept: 'Nabiał i jaja' },
  { name: 'Ser mozzarella light', keywords: ['mozzarella light'], kcal: 165, protein: 19, fat: 9, carbs: 1.5, dept: 'Nabiał i jaja' },
  { name: 'Ser typu Feta', keywords: ['feta', 'fety'], kcal: 264, protein: 14, fat: 21, carbs: 4, dept: 'Nabiał i jaja' },
  { name: 'Ser Grana Padano / Parmezan', keywords: ['grana padano', 'parmezan'], kcal: 392, protein: 33, fat: 28, carbs: 0, dept: 'Nabiał i jaja' },
  { name: 'Ser Cheddar', keywords: ['cheddar'], kcal: 403, protein: 25, fat: 33, carbs: 1.3, dept: 'Nabiał i jaja' },
  { name: 'Ser gouda', keywords: ['gouda'], kcal: 356, protein: 25, fat: 27, carbs: 0, dept: 'Nabiał i jaja' },
  { name: 'Ser camembert', keywords: ['camembert'], kcal: 300, protein: 20, fat: 24, carbs: 0.5, dept: 'Nabiał i jaja' },
  { name: 'Ser halloumi', keywords: ['halloumi'], kcal: 320, protein: 21, fat: 25, carbs: 2, dept: 'Nabiał i jaja' },
  { name: 'Ser burrata', keywords: ['burrata', 'burratą'], kcal: 250, protein: 11, fat: 23, carbs: 1.5, dept: 'Nabiał i jaja' },
  { name: 'Mleko 1,5%', keywords: ['mleko 1,5', 'mleko 1.5', 'mleko'], kcal: 47, protein: 3.3, fat: 1.5, carbs: 4.8, dept: 'Nabiał i jaja' },
  { name: 'Napój sojowy', keywords: ['napój sojow', 'mleko sojow'], kcal: 40, protein: 3.3, fat: 1.8, carbs: 2.5, dept: 'Nabiał i jaja' },
  { name: 'Napój migdałowy', keywords: ['napój migdałow', 'mleko migdałow'], kcal: 15, protein: 0.5, fat: 1.1, carbs: 0.3, dept: 'Nabiał i jaja' },
  { name: 'Napój owsiany', keywords: ['napój owsian', 'mleko owsian'], kcal: 45, protein: 1, fat: 1.5, carbs: 7, dept: 'Nabiał i jaja' },
  { name: 'Pudding proteinowy Go Active', keywords: ['pudding proteinow', 'active'], kcal: 76, protein: 10, fat: 1.5, carbs: 5.5, dept: 'Nabiał i jaja' },
  { name: 'Odżywka białkowa WPC', keywords: ['odżywka białkow'], kcal: 380, protein: 75, fat: 5, carbs: 7, dept: 'Spiżarnia i przyprawy' },

  // --- Zboża, makarony, pieczywo ---
  { name: 'Płatki owsiane górskie', keywords: ['płatki owsian'], kcal: 366, protein: 13.5, fat: 7, carbs: 62, dept: 'Pieczywo i zboża' },
  { name: 'Płatki jaglane', keywords: ['płatki jaglan'], kcal: 360, protein: 11, fat: 3, carbs: 70, dept: 'Pieczywo i zboża' },
  { name: 'Płatki gryczane', keywords: ['płatki gryczan'], kcal: 350, protein: 12, fat: 3, carbs: 67, dept: 'Pieczywo i zboża' },
  { name: 'Kasza manna', keywords: ['kasza manna', 'kaszy manny'], kcal: 348, protein: 8.7, fat: 1.3, carbs: 74, dept: 'Pieczywo i zboża' },
  { name: 'Ryż basmati / jaśminowy', keywords: ['ryż basmati', 'ryż jaśminow', 'ryż biały', 'ryż'], kcal: 350, protein: 8.5, fat: 1, carbs: 77, dept: 'Pieczywo i zboża' },
  { name: 'Kasza gryczana', keywords: ['kasza gryczan', 'kaszy gryczan'], kcal: 340, protein: 12.6, fat: 3.1, carbs: 63, dept: 'Pieczywo i zboża' },
  { name: 'Kasza jaglana', keywords: ['kasza jaglan', 'kaszy jaglan'], kcal: 350, protein: 10.5, fat: 2.9, carbs: 68, dept: 'Pieczywo i zboża' },
  { name: 'Kasza bulgur', keywords: ['kasza bulgur', 'kaszy bulgur'], kcal: 342, protein: 12, fat: 1.3, carbs: 65, dept: 'Pieczywo i zboża' },
  { name: 'Kasza pęczak', keywords: ['kasza pęczak', 'pęczak'], kcal: 335, protein: 8.4, fat: 2, carbs: 71, dept: 'Pieczywo i zboża' },
  { name: 'Komosa ryżowa (quinoa)', keywords: ['quinoa', 'komosa'], kcal: 368, protein: 14, fat: 6, carbs: 64, dept: 'Pieczywo i zboża' },
  { name: 'Makaron pełnoziarnisty', keywords: ['makaron pełnoziarnist', 'makaron'], kcal: 348, protein: 14, fat: 2.5, carbs: 65, dept: 'Pieczywo i zboża' },
  { name: 'Gnocchi ziemniaczane', keywords: ['gnocchi'], kcal: 150, protein: 3.5, fat: 0.5, carbs: 32, dept: 'Pieczywo i zboża' },
  { name: 'Ziemniaki', keywords: ['ziemniak'], kcal: 77, protein: 2, fat: 0.1, carbs: 17, dept: 'Warzywa i owoce' },
  { name: 'Bataty', keywords: ['batat'], kcal: 86, protein: 1.6, fat: 0.1, carbs: 20, dept: 'Warzywa i owoce' },
  { name: 'Chleb żytni razowy', keywords: ['chleb żytni', 'chleb razow', 'chleb'], kcal: 225, protein: 5.6, fat: 1.7, carbs: 45, dept: 'Pieczywo i zboża' },
  { name: 'Chleb orkiszowy', keywords: ['chleb orkiszow'], kcal: 240, protein: 8, fat: 2, carbs: 46, dept: 'Pieczywo i zboża' },
  { name: 'Bułka grahamka', keywords: ['bułka grahamk', 'grahamka', 'bułka'], kcal: 250, protein: 8.5, fat: 1.8, carbs: 48, dept: 'Pieczywo i zboża' },
  { name: 'Bajgiel', keywords: ['bajgiel'], kcal: 260, protein: 9, fat: 2, carbs: 50, dept: 'Pieczywo i zboża' },
  { name: 'Tortilla pełnoziarnista', keywords: ['tortilla', 'tortilli', 'wrap'], kcal: 290, protein: 8.5, fat: 6, carbs: 48, dept: 'Pieczywo i zboża' },
  { name: 'Pinsa rzemieślnicza', keywords: ['pinsa', 'pinsy'], kcal: 240, protein: 8, fat: 4, carbs: 43, dept: 'Pieczywo i zboża' },
  { name: 'Wafle ryżowe', keywords: ['wafle ryżow'], kcal: 380, protein: 8, fat: 2.5, carbs: 80, dept: 'Pieczywo i zboża' },
  { name: 'Biszkopty', keywords: ['biszkopt'], kcal: 380, protein: 9, fat: 4, carbs: 76, dept: 'Pieczywo i zboża' },
  { name: 'Mąka pszenna pełnoziarnista', keywords: ['mąka pszenn', 'mąka'], kcal: 340, protein: 12, fat: 2, carbs: 65, dept: 'Spiżarnia i przyprawy' },

  // --- Owoce ---
  { name: 'Banan', keywords: ['banan'], kcal: 89, protein: 1.1, fat: 0.3, carbs: 22, dept: 'Warzywa i owoce' },
  { name: 'Jabłko', keywords: ['jabłk'], kcal: 52, protein: 0.3, fat: 0.2, carbs: 12, dept: 'Warzywa i owoce' },
  { name: 'Gruszka', keywords: ['gruszk'], kcal: 57, protein: 0.4, fat: 0.1, carbs: 14, dept: 'Warzywa i owoce' },
  { name: 'Truskawki', keywords: ['truskawk'], kcal: 32, protein: 0.7, fat: 0.3, carbs: 6, dept: 'Warzywa i owoce' },
  { name: 'Borówki amerykańskie', keywords: ['borówk', 'jagod'], kcal: 57, protein: 0.7, fat: 0.3, carbs: 12, dept: 'Warzywa i owoce' },
  { name: 'Maliny', keywords: ['malin'], kcal: 52, protein: 1.2, fat: 0.7, carbs: 5.5, dept: 'Warzywa i owoce' },
  { name: 'Pomarańcza', keywords: ['pomarańcz'], kcal: 47, protein: 0.9, fat: 0.1, carbs: 9.4, dept: 'Warzywa i owoce' },
  { name: 'Mandarynki', keywords: ['mandarynk'], kcal: 53, protein: 0.8, fat: 0.3, carbs: 11, dept: 'Warzywa i owoce' },
  { name: 'Kiwi', keywords: ['kiwi'], kcal: 61, protein: 1.1, fat: 0.5, carbs: 12, dept: 'Warzywa i owoce' },
  { name: 'Brzoskwinia', keywords: ['brzoskwini', 'nektarynk'], kcal: 39, protein: 0.9, fat: 0.3, carbs: 8, dept: 'Warzywa i owoce' },
  { name: 'Śliwki', keywords: ['śliwk'], kcal: 46, protein: 0.7, fat: 0.3, carbs: 10, dept: 'Warzywa i owoce' },
  { name: 'Mango', keywords: ['mango'], kcal: 60, protein: 0.8, fat: 0.4, carbs: 14, dept: 'Warzywa i owoce' },
  { name: 'Ananas', keywords: ['ananas'], kcal: 50, protein: 0.5, fat: 0.1, carbs: 12, dept: 'Warzywa i owoce' },
  { name: 'Czereśnie', keywords: ['czereśn', 'wiśn'], kcal: 50, protein: 1, fat: 0.3, carbs: 11, dept: 'Warzywa i owoce' },
  { name: 'Awokado', keywords: ['awokado'], kcal: 160, protein: 2, fat: 15, carbs: 2, dept: 'Warzywa i owoce' },
  { name: 'Żurawina suszona', keywords: ['żurawina'], kcal: 308, protein: 0.1, fat: 1.4, carbs: 82, dept: 'Spiżarnia i przyprawy' },
  { name: 'Daktyle suszone', keywords: ['daktyl'], kcal: 282, protein: 2.5, fat: 0.4, carbs: 75, dept: 'Spiżarnia i przyprawy' },

  // --- Warzywa ---
  { name: 'Pomidor świeży', keywords: ['pomidor', 'pomidorki koktajlowe'], kcal: 18, protein: 0.9, fat: 0.2, carbs: 2.6, dept: 'Warzywa i owoce' },
  { name: 'Pomidory suszone w oleju (odsączone)', keywords: ['pomidory suszone'], kcal: 213, protein: 5, fat: 14, carbs: 14, dept: 'Warzywa i owoce' },
  { name: 'Ogórek świeży', keywords: ['ogórek', 'ogórki'], kcal: 15, protein: 0.7, fat: 0.1, carbs: 2.4, dept: 'Warzywa i owoce' },
  { name: 'Ogórek kiszony', keywords: ['ogórek kiszon', 'ogórki kiszon'], kcal: 11, protein: 0.5, fat: 0.1, carbs: 1.8, dept: 'Warzywa i owoce' },
  { name: 'Papryka czerwona', keywords: ['papryka czerwon', 'papryka'], kcal: 31, protein: 1, fat: 0.3, carbs: 4.6, dept: 'Warzywa i owoce' },
  { name: 'Cukinia', keywords: ['cukinia', 'cukinią'], kcal: 17, protein: 1.2, fat: 0.3, carbs: 2.1, dept: 'Warzywa i owoce' },
  { name: 'Szpinak świeży', keywords: ['szpinak'], kcal: 23, protein: 2.9, fat: 0.4, carbs: 0.8, dept: 'Warzywa i owoce' },
  { name: 'Rukola', keywords: ['rukola'], kcal: 25, protein: 2.6, fat: 0.7, carbs: 2, dept: 'Warzywa i owoce' },
  { name: 'Roszponka', keywords: ['roszponk'], kcal: 21, protein: 2, fat: 0.4, carbs: 1.5, dept: 'Warzywa i owoce' },
  { name: 'Sałata', keywords: ['sałat'], kcal: 15, protein: 1.4, fat: 0.2, carbs: 1.8, dept: 'Warzywa i owoce' },
  { name: 'Brokuł', keywords: ['brokuł'], kcal: 34, protein: 2.8, fat: 0.4, carbs: 4, dept: 'Warzywa i owoce' },
  { name: 'Szparagi', keywords: ['szparag'], kcal: 20, protein: 2.2, fat: 0.1, carbs: 2, dept: 'Warzywa i owoce' },
  { name: 'Dynia świeża', keywords: ['dynia', 'dynią'], kcal: 26, protein: 1, fat: 0.1, carbs: 5.5, dept: 'Warzywa i owoce' },
  { name: 'Marchew', keywords: ['marchew', 'marchwią'], kcal: 41, protein: 0.9, fat: 0.2, carbs: 6.8, dept: 'Warzywa i owoce' },
  { name: 'Cebula', keywords: ['cebula', 'cebulą'], kcal: 40, protein: 1.1, fat: 0.1, carbs: 7.6, dept: 'Warzywa i owoce' },
  { name: 'Szczypiorek', keywords: ['szczypiorek'], kcal: 30, protein: 3, fat: 0.7, carbs: 3.5, dept: 'Warzywa i owoce' },
  { name: 'Czosnek świeży', keywords: ['czosnek'], kcal: 149, protein: 6.4, fat: 0.5, carbs: 33, dept: 'Warzywa i owoce' },
  { name: 'Pieczarki', keywords: ['pieczarki', 'pieczarkami'], kcal: 22, protein: 3.1, fat: 0.3, carbs: 0.3, dept: 'Warzywa i owoce' },
  { name: 'Kurki świeże', keywords: ['kurkami', 'kurki'], kcal: 32, protein: 1.5, fat: 0.5, carbs: 3.8, dept: 'Warzywa i owoce' },
  { name: 'Ciecierzyca konserwowa', keywords: ['ciecierzyca'], kcal: 120, protein: 7, fat: 2, carbs: 17, dept: 'Warzywa i owoce' },
  { name: 'Soczewica czerwona nasiona', keywords: ['soczewic'], kcal: 340, protein: 25, fat: 1.5, carbs: 53, dept: 'Warzywa i owoce' },

  // --- Tłuszcze, orzechy, nasiona, dodatki ---
  { name: 'Oliwa z oliwek', keywords: ['oliwa z oliwek', 'oliwa'], kcal: 824, protein: 0, fat: 91.6, carbs: 0, dept: 'Spiżarnia i przyprawy' },
  { name: 'Olej rzepakowy', keywords: ['olej rzepakow', 'olej'], kcal: 828, protein: 0, fat: 92, carbs: 0, dept: 'Spiżarnia i przyprawy' },
  { name: 'Masło extra', keywords: ['masło extra', 'masło'], kcal: 748, protein: 0.7, fat: 82.5, carbs: 0.7, dept: 'Nabiał i jaja' },
  { name: 'Masło orzechowe 100%', keywords: ['masłem orzechow', 'masło orzechow'], kcal: 588, protein: 25, fat: 50, carbs: 12, dept: 'Spiżarnia i przyprawy' },
  { name: 'Pasta pistacjowa 100%', keywords: ['pasta pistacjow'], kcal: 630, protein: 21, fat: 53, carbs: 18, dept: 'Spiżarnia i przyprawy' },
  { name: 'Orzechy włoskie', keywords: ['orzechy włoskie', 'orzechami włoskimi'], kcal: 654, protein: 15, fat: 65, carbs: 7, dept: 'Spiżarnia i przyprawy' },
  { name: 'Migdały', keywords: ['migdały', 'płatki migdałów'], kcal: 579, protein: 21, fat: 50, carbs: 10, dept: 'Spiżarnia i przyprawy' },
  { name: 'Orzechy nerkowca', keywords: ['nerkowce', 'nerkowcami'], kcal: 553, protein: 18, fat: 44, carbs: 30, dept: 'Spiżarnia i przyprawy' },
  { name: 'Orzechy pistacjowe', keywords: ['pistacje', 'pistacj'], kcal: 562, protein: 20, fat: 45, carbs: 17, dept: 'Spiżarnia i przyprawy' },
  { name: 'Nasiona chia', keywords: ['chia'], kcal: 486, protein: 17, fat: 31, carbs: 8, dept: 'Spiżarnia i przyprawy' },
  { name: 'Siemię lniane', keywords: ['siemię lnian', 'siemieniem'], kcal: 534, protein: 18, fat: 42, carbs: 2, dept: 'Spiżarnia i przyprawy' },
  { name: 'Pestki dyni', keywords: ['pestki dyni'], kcal: 559, protein: 30, fat: 49, carbs: 5, dept: 'Spiżarnia i przyprawy' },
  { name: 'Tahini klasyczne', keywords: ['tahini'], kcal: 595, protein: 17, fat: 54, carbs: 12, dept: 'Spiżarnia i przyprawy' },
  { name: 'Czekolada gorzka 70%', keywords: ['czekolada gorzk', 'czekoladą gorzk'], kcal: 570, protein: 7.8, fat: 41, carbs: 36, dept: 'Spiżarnia i przyprawy' },
  { name: 'Miód pszczeli', keywords: ['miód', 'miodem'], kcal: 304, protein: 0.3, fat: 0, carbs: 82, dept: 'Spiżarnia i przyprawy' },
  { name: 'Syrop klonowy', keywords: ['syrop klonow'], kcal: 260, protein: 0, fat: 0, carbs: 67, dept: 'Spiżarnia i przyprawy' },
  { name: 'Erytrol / Ksylitol', keywords: ['erytrol', 'ksylitol'], kcal: 0, protein: 0, fat: 0, carbs: 0, dept: 'Spiżarnia i przyprawy' },
  { name: 'Kakao ciemne bez cukru', keywords: ['kakao'], kcal: 300, protein: 19, fat: 11, carbs: 14, dept: 'Spiżarnia i przyprawy' }
];

/**
 * Searches local verified nutrition table for matching ingredient
 * @param {string} ingredientName
 * @returns {object|null}
 */
export function findNutrientsForIngredient(ingredientName) {
  if (!ingredientName) return null;
  const norm = ingredientName.toLowerCase().trim();

  // 1. Direct keywords match
  for (const item of NUTRITION_DATABASE) {
    if (item.keywords.some(kw => norm.includes(kw))) {
      // Disambiguation
      if (norm.includes('masło orzechow') && item.name === 'Masło extra') continue;
      if (norm.includes('napój') && item.name === 'Mleko 1,5%') continue;
      return item;
    }
  }

  // 2. Fallback word match
  const words = norm.split(/\s+/).filter(w => w.length > 3);
  for (const item of NUTRITION_DATABASE) {
    if (item.keywords.some(kw => words.some(w => kw.includes(w)))) {
      return item;
    }
  }

  return null;
}

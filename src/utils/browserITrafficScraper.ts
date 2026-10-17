import { FeedItem } from '../types';
import { parseDateToMillis } from './dateParser';
import { cleanTrafficText } from './textSanitizer';

export const ITRAFFIC_GAUTENG_SOURCE_URL = "https://www.i-traffic.co.za/list/events/traffic?start=0&length=25&filters%5B0%5D%5Bi%5D=1&filters%5B0%5D%5Bs%5D=Gauteng&order%5Bi%5D=8&order%5Bdir%5D=desc";
export const ITRAFFIC_KZN_SOURCE_URL = "https://www.i-traffic.co.za/list/events/traffic?start=0&length=25&filters%5B0%5D%5Bi%5D=1&filters%5B0%5D%5Bs%5D=KwaZulu-Natal&order%5Bi%5D=8&order%5Bdir%5D=desc";
export const ITRAFFIC_WC_SOURCE_URL = "https://www.i-traffic.co.za/list/events/traffic?start=0&length=25&filters%5B0%5D%5Bi%5D=1&filters%5B0%5D%5Bs%5D=Western%20Cape&order%5Bi%5D=8&order%5Bdir%5D=desc";
export const ITRAFFIC_EC_SOURCE_URL = "https://www.i-traffic.co.za/list/events/traffic?start=0&length=25&filters%5B0%5D%5Bi%5D=1&filters%5B0%5D%5Bs%5D=Eastern%20Cape&order%5Bi%5D=8&order%5Bdir%5D=desc";
export const ITRAFFIC_POST_ENDPOINT = "https://www.i-traffic.co.za/List/GetData/traffic";

// i-Traffic Live Highway Travel Times (Gauteng Corridor default)
export const ITRAFFIC_TRAVELTIMES_PAGE_URL = "https://www.i-traffic.co.za/traveltimes?start=0&length=25&filters%5B0%5D%5Bi%5D=3&filters%5B0%5D%5Bs%5D=Gauteng&order%5Bi%5D=0&order%5Bdir%5D=asc";
export const ITRAFFIC_TRAVELTIMES_POST_ENDPOINT = "https://www.i-traffic.co.za/List/GetData/traveltimes";

// Known landmark coordinates along Gauteng Highway Corridors
const GAUTENG_LANDMARK_COORDS: Array<{ keywords: string[]; lat: number; lng: number; roadway?: string }> = [
  { keywords: ["rigel", "delmas", "r50"], lat: -25.810562, lng: 28.25797, roadway: "N1" },
  { keywords: ["allandale", "midrand", "waterfall"], lat: -26.0142, lng: 28.1189, roadway: "N1" },
  { keywords: ["new rd", "new road"], lat: -25.982621, lng: 28.125654, roadway: "N1" },
  { keywords: ["rand show", "nasrec", "m79", "expo"], lat: -26.251768, lng: 27.964376, roadway: "N1" },
  { keywords: ["proefplaas", "lynnwood", "m6"], lat: -25.747249, lng: 28.269682, roadway: "N1" },
  { keywords: ["garsfontein", "menlyn", "m30"], lat: -25.787668, lng: 28.269431, roadway: "N1" },
  { keywords: ["atterbury", "faerie glen", "m11"], lat: -25.7728, lng: 28.2831, roadway: "N1" },
  { keywords: ["john vorster", "centurion", "m19"], lat: -25.8679, lng: 28.2031, roadway: "N1" },
  { keywords: ["jean ave", "m34", "centurion"], lat: -25.8504, lng: 28.1884, roadway: "N1" },
  { keywords: ["samrand", "olifantsfontein", "r562"], lat: -25.9329, lng: 28.1472, roadway: "N1" },
  { keywords: ["buccleuch", "woodmead", "m1 interchange"], lat: -26.0594, lng: 28.0933, roadway: "N1" },
  { keywords: ["rivonia", "m9", "sunninghill"], lat: -26.0463, lng: 28.0592, roadway: "N1" },
  { keywords: ["william nicol", "winnie madikizela", "m81", "fourways"], lat: -26.0357, lng: 28.0163, roadway: "N1" },
  { keywords: ["malibongwe", "hans strijdom", "r512"], lat: -26.0691, lng: 27.9698, roadway: "N1" },
  { keywords: ["beyers naude", "cresta", "m5"], lat: -26.1158, lng: 27.9547, roadway: "N1" },
  { keywords: ["14th ave", "fourteenth ave", "fairland"], lat: -26.1436, lng: 27.9463, roadway: "N1" },
  { keywords: ["maraisburg", "m86"], lat: -26.1821, lng: 27.9392, roadway: "N1" },
  { keywords: ["golden hwy", "r553", "devland"], lat: -26.277158, lng: 27.947326, roadway: "N1" },
  { keywords: ["pumulani", "karee", "carousel", "n1 north toll"], lat: -25.6293, lng: 28.2882, roadway: "N1" },
  { keywords: ["gilloolys", "bedfordview", "n3 n12"], lat: -26.1706, lng: 28.1408, roadway: "N3" },
  { keywords: ["geldenhuys", "germiston", "m2 interchange"], lat: -26.2084, lng: 28.1458, roadway: "N3" },
  { keywords: ["marlboro", "linbro", "m60"], lat: -26.0883, lng: 28.1072, roadway: "N3" },
  { keywords: ["modderfontein", "edenvale", "r25"], lat: -26.1215, lng: 28.1256, roadway: "N3" },
  { keywords: ["solomon mahlangu", "m10", "silverton"], lat: -25.7482, lng: 28.3374, roadway: "N4" },
  { keywords: ["r223", "donkerhoek", "cullinan"], lat: -25.769587, lng: 28.410655, roadway: "N4" },
  { keywords: ["griffiths", "kempton park", "jet park"], lat: -26.1486, lng: 28.2372, roadway: "R21" },
  { keywords: ["ortia", "airport", "o.r. tambo", "r21 r24"], lat: -26.1367, lng: 28.2411, roadway: "R21" },
  { keywords: ["pomona", "r21 north"], lat: -26.0963, lng: 28.2694, roadway: "R21" },
  { keywords: ["barbara", "isando", "m59"], lat: -26.1472, lng: 28.1925, roadway: "R24" },
  { keywords: ["grayston", "sandton", "m40"], lat: -26.1039, lng: 28.0722, roadway: "M1" },
  { keywords: ["corlett", "bramley", "m30"], lat: -26.1284, lng: 28.0694, roadway: "M1" },
  { keywords: ["crown", "booysens", "m1 south"], lat: -26.2215, lng: 28.0264, roadway: "M1" },
  { keywords: ["kliprivier", "r59", "meyerton"], lat: -26.3120, lng: 28.0890, roadway: "R59" }
];

// Known landmark coordinates along KwaZulu-Natal (KZN) Highway Corridors
const KZN_LANDMARK_COORDS: Array<{ keywords: string[]; lat: number; lng: number; roadway?: string }> = [
  // N3 Corridor (Durban to Van Reenen)
  { keywords: ["marianhill", "mariannhill", "toll plaza"], lat: -29.8450, lng: 30.7950, roadway: "N3" },
  { keywords: ["pinetown", "new germany", "fields hill"], lat: -29.8167, lng: 30.8667, roadway: "N3" },
  { keywords: ["westville", "45th cutting", "sherwood"], lat: -29.8333, lng: 30.9333, roadway: "N3" },
  { keywords: ["kloof", "hillcrest", "shongweni", "alverstone"], lat: -29.7750, lng: 30.7600, roadway: "N3" },
  { keywords: ["cato ridge", "hammarsdale", "inchanga"], lat: -29.7289, lng: 30.6033, roadway: "N3" },
  { keywords: ["camperdown", "lynnfield"], lat: -29.7200, lng: 30.5300, roadway: "N3" },
  { keywords: ["ashburton", "shortts retreat", "mkondeni"], lat: -29.6800, lng: 30.4500, roadway: "N3" },
  { keywords: ["pietermaritzburg", "pmb", "scottsville", "chatterton"], lat: -29.6006, lng: 30.3794, roadway: "N3" },
  { keywords: ["townhill", "town hill", "peter brown", "armitage"], lat: -29.5667, lng: 30.3400, roadway: "N3" },
  { keywords: ["hilton", "cedara", "merrivale"], lat: -29.5500, lng: 30.3000, roadway: "N3" },
  { keywords: ["howick", "midmar", "tweedie"], lat: -29.4778, lng: 30.2278, roadway: "N3" },
  { keywords: ["nottingham road", "lions river", "currys post"], lat: -29.3580, lng: 30.0020, roadway: "N3" },
  { keywords: ["mooi river", "mooiriver", "mooi river toll"], lat: -29.2167, lng: 30.0000, roadway: "N3" },
  { keywords: ["estcourt", "beacon hill", "wembesi"], lat: -29.0111, lng: 29.8736, roadway: "N3" },
  { keywords: ["colenso", "frere", "chieveley"], lat: -28.7360, lng: 29.8240, roadway: "N3" },
  { keywords: ["ladysmith", "tugela", "tugela plaza"], lat: -28.5598, lng: 29.7807, roadway: "N3" },
  { keywords: ["van reenen", "van reenen pass", "swinburne"], lat: -28.3750, lng: 29.3833, roadway: "N3" },

  // N2 North Coast & South Coast Corridors
  { keywords: ["umhlanga", "gateway", "mount edgecombe", "m41"], lat: -29.7265, lng: 31.0664, roadway: "N2" },
  { keywords: ["king shaka", "ksia", "airport", "dube"], lat: -29.6099, lng: 31.1197, roadway: "N2" },
  { keywords: ["tongaat", "tongaat toll", "verulam"], lat: -29.5800, lng: 31.1200, roadway: "N2" },
  { keywords: ["ballito", "salt rock", "shakas rock", "dolphin coast"], lat: -29.5390, lng: 31.2144, roadway: "N2" },
  { keywords: ["tinley manor", "blythedale", "kwadukuza", "stanger"], lat: -29.3360, lng: 31.2880, roadway: "N2" },
  { keywords: ["gingindlovu", "mtunzini", "nyoni"], lat: -29.0180, lng: 31.5830, roadway: "N2" },
  { keywords: ["empangeni", "richards bay", "port of richards bay"], lat: -28.7807, lng: 32.0383, roadway: "N2" },
  { keywords: ["amanzimtoti", "toti", "galleria", "kingsburgh"], lat: -30.0467, lng: 30.8850, roadway: "N2" },
  { keywords: ["ilovo", "umkomaas", "scotsburgh", "scottburgh"], lat: -30.2833, lng: 30.7500, roadway: "N2" },
  { keywords: ["hibberdene", "port shepstone", "shelly beach", "margate"], lat: -30.7411, lng: 30.4550, roadway: "N2" },

  // Durban Arterials (M4, M7, M13, M19)
  { keywords: ["durban cbd", "warwick", "tollgate", "berea"], lat: -29.8587, lng: 31.0218, roadway: "M4" },
  { keywords: ["edwin swales", "solomon mahlangu durban", "m7", "bayhead", "bluff"], lat: -29.8900, lng: 31.0000, roadway: "M7" },
  { keywords: ["umgeni road", "springfield park", "m19", "inanda rd"], lat: -29.8050, lng: 30.9800, roadway: "M19" },
  { keywords: ["ruth first", "m4 north", "blue lagoon", "broadway", "la lucia"], lat: -29.7800, lng: 31.0450, roadway: "M4" }
];

// Known landmark coordinates along Western Cape (WC) Highway Corridors
const WESTERN_CAPE_LANDMARK_COORDS: Array<{ keywords: string[]; lat: number; lng: number; roadway?: string }> = [
  // N1 Western Cape (Cape Town to Worcester)
  { keywords: ["table bay", "foreshore", "cape town cbd", "buitengracht", "christiaan barnard", "m60", "heerengracht"], lat: -33.918861, lng: 18.423300, roadway: "N1" },
  { keywords: ["woodstock", "marine drive", "paarden eiland"], lat: -33.9234, lng: 18.4521, roadway: "N1" },
  { keywords: ["century city", "sable road", "canal walk", "ratanga"], lat: -33.8908, lng: 18.5133, roadway: "N1" },
  { keywords: ["wingfield", "goodwood", "n1 city", "monte vista"], lat: -33.8860, lng: 18.5520, roadway: "N1" },
  { keywords: ["plattekloof", "parow", "mcintyre", "mike pienaar", "m16", "karl bremer"], lat: -33.8760, lng: 18.5840, roadway: "N1" },
  { keywords: ["jip de jager", "durbanville", "durban rd", "willie van schoor"], lat: -33.8720, lng: 18.6300, roadway: "N1" },
  { keywords: ["bellville", "tygervalley", "old oak", "voortrekker"], lat: -33.8750, lng: 18.6470, roadway: "N1" },
  { keywords: ["brackenfell", "brackenfell blvd", "okavango"], lat: -33.8770, lng: 18.6970, roadway: "N1" },
  { keywords: ["kraaifontein", "brighton", "maroela"], lat: -33.8650, lng: 18.7300, roadway: "N1" },
  { keywords: ["joostenbergvlakte", "klapmuts", "r44"], lat: -33.8150, lng: 18.8680, roadway: "N1" },
  { keywords: ["paarl", "suid agter paarl", "paarl main", "r101"], lat: -33.7430, lng: 18.9630, roadway: "N1" },
  { keywords: ["huguenot tunnel", "du toitskloof", "dutoitskloof"], lat: -33.7310, lng: 19.0660, roadway: "N1" },
  { keywords: ["rawsonville", "goudini"], lat: -33.6820, lng: 19.3100, roadway: "N1" },
  { keywords: ["worcester", "breede river", "r60"], lat: -33.6450, lng: 19.4450, roadway: "N1" },

  // N2 Western Cape (Cape Town to Garden Route)
  { keywords: ["settlers way", "nelson mandela blvd", "hospital bend"], lat: -33.9430, lng: 18.4680, roadway: "N2" },
  { keywords: ["mowbray", "raapenberg", "pinelands"], lat: -33.9450, lng: 18.4980, roadway: "N2" },
  { keywords: ["jan smuts", "surrey", "athlone"], lat: -33.9580, lng: 18.5250, roadway: "N2" },
  { keywords: ["vanguard", "heideveld", "m7 vanguard"], lat: -33.9680, lng: 18.5490, roadway: "N2" },
  { keywords: ["borcherds quarry", "nyanga", "gugulethu"], lat: -33.9780, lng: 18.5770, roadway: "N2" },
  { keywords: ["cape town airport", "airport industria", "cpt airport", "df malan"], lat: -33.9710, lng: 18.6010, roadway: "N2" },
  { keywords: ["robert sobukwe", "modderdam", "belhar"], lat: -33.9850, lng: 18.6180, roadway: "N2" },
  { keywords: ["r300 n2", "kuils river interchange"], lat: -34.0040, lng: 18.6730, roadway: "N2" },
  { keywords: ["mew way", "khayelitsha", "spine rd", "spine road", "m32"], lat: -34.0260, lng: 18.7050, roadway: "N2" },
  { keywords: ["baden powell", "r310", "macassar"], lat: -34.0530, lng: 18.7620, roadway: "N2" },
  { keywords: ["broadlands", "firgrove", "somerset west", "de beers", "de beers ave", "somerset mall"], lat: -34.0840, lng: 18.8350, roadway: "N2" },
  { keywords: ["strand", "gordon's bay", "gordons bay"], lat: -34.1200, lng: 18.8600, roadway: "N2" },
  { keywords: ["sir lowry's pass", "sir lowrys pass"], lat: -34.1480, lng: 18.9250, roadway: "N2" },
  { keywords: ["grabouw", "elgin", "houwhoek"], lat: -34.1520, lng: 19.0150, roadway: "N2" },
  { keywords: ["botrivier", "bot river", "hermanus turnoff"], lat: -34.2250, lng: 19.2050, roadway: "N2" },
  { keywords: ["caledon", "r316", "r43"], lat: -34.2330, lng: 19.4260, roadway: "N2" },
  { keywords: ["swellendam", "heidelberg cape", "riversdale"], lat: -34.0220, lng: 20.4420, roadway: "N2" },
  { keywords: ["mossel bay", "voorbaai", "hartenbos"], lat: -34.1680, lng: 22.1050, roadway: "N2" },
  { keywords: ["george", "york street", "garden route mall", "kaaimans"], lat: -33.9630, lng: 22.4610, roadway: "N2" },
  { keywords: ["wilderness", "sedgefield", "knysna", "plettenberg bay"], lat: -34.0350, lng: 23.0470, roadway: "N2" },

  // N7 Corridors (Wingfield, Dunoon, Malmesbury, Moorreesburg, Piketberg, Citrusdal, Namaqualand)
  { keywords: ["n7 wingfield", "bosmansdam", "n7 interchange", "n7/n1", "wingfield"], lat: -33.8850, lng: 18.5150, roadway: "N7" },
  { keywords: ["dunoon", "morningstar", "potsdam", "vissershok", "bothasig n7"], lat: -33.7800, lng: 18.5500, roadway: "N7" },
  { keywords: ["philadelphia", "atlantis turnoff"], lat: -33.6500, lng: 18.6000, roadway: "N7" },
  { keywords: ["malmesbury", "moorreesburg", "abbotsdale", "swartland"], lat: -33.4600, lng: 18.7200, roadway: "N7" },
  { keywords: ["piketberg", "citrusdal", "clanwilliam", "piekenierskloof"], lat: -32.5500, lng: 18.9000, roadway: "N7" },
  { keywords: ["n7", "bothasig", "malmesbury"], lat: -33.8200, lng: 18.5400, roadway: "N7" },
  { keywords: ["m3", "philip kgosana", "de waal", "rhodes memorial", "newlands", "wynberg", "tokai", "blue route", "muizenberg"], lat: -33.9920, lng: 18.4680, roadway: "M3" },
  { keywords: ["m5", "black river parkway", "maitland", "berkley", "kromboom", "lansdowne", "ottery", "prince george"], lat: -33.9650, lng: 18.5020, roadway: "M5" },
  { keywords: ["r300", "kuils river freeway", "hindle", "delft", "mitchells plain", "stellenbosch arterial", "van riebeeck", "r102"], lat: -33.9550, lng: 18.6650, roadway: "R300" }
];

// Known landmark coordinates along Eastern Cape (EC) Highway Corridors
const EASTERN_CAPE_LANDMARK_COORDS: Array<{ keywords: string[]; lat: number; lng: number; roadway?: string }> = [
  // N2 Eastern Cape (Tsitsikamma to Mthatha)
  { keywords: ["tsitsikamma", "storms river", "bloukrans"], lat: -33.9720, lng: 23.8850, roadway: "N2" },
  { keywords: ["humansdorp", "jeffreys bay", "jbay", "gamtoos"], lat: -34.0450, lng: 24.9120, roadway: "N2" },
  { keywords: ["van stadens", "thornhill", "woodridge"], lat: -33.9050, lng: 25.2150, roadway: "N2" },
  { keywords: ["gqeberha", "port elizabeth", "pe cbd", "settlers way pe", "deal party"], lat: -33.9580, lng: 25.6180, roadway: "N2" },
  { keywords: ["swartkops", "bluewater bay", "st georges strand"], lat: -33.8650, lng: 25.6250, roadway: "N2" },
  { keywords: ["coega", "idzone", "ngqura"], lat: -33.7920, lng: 25.6700, roadway: "N2" },
  { keywords: ["colchester", "sundays river", "nanaga"], lat: -33.6850, lng: 25.8250, roadway: "N2" },
  { keywords: ["grahamstown", "makhanda", "waainek", "bothas hill"], lat: -33.3040, lng: 26.5260, roadway: "N2" },
  { keywords: ["peddie", "great fish river"], lat: -33.1950, lng: 27.1200, roadway: "N2" },
  { keywords: ["king william's town", "qonce", "bisho"], lat: -32.8750, lng: 27.3920, roadway: "N2" },
  { keywords: ["east london", "el cbd", "oxford street", "settlers way el"], lat: -33.0150, lng: 27.9050, roadway: "N2" },
  { keywords: ["beacon bay", "nahoon", "gonubie"], lat: -32.9650, lng: 27.9620, roadway: "N2" },
  { keywords: ["butterworth", "gcuwa", "kei bridge", "kei cuttings"], lat: -32.3320, lng: 28.1480, roadway: "N2" },
  { keywords: ["dutywa", "idutywa"], lat: -32.0050, lng: 28.3050, roadway: "N2" },
  { keywords: ["mthatha", "umtata", "mthatha airport"], lat: -31.5889, lng: 28.7844, roadway: "N2" },
  { keywords: ["mount frere", "kwaBhaca", "mount ayliff", "kokstad"], lat: -30.9050, lng: 28.9850, roadway: "N2" },

  // N10, N6, R72 Corridors
  { keywords: ["n10", "paterson", "olifantskop", "cookhouse", "cradock", "middelburg cape"], lat: -32.1650, lng: 25.6200, roadway: "N10" },
  { keywords: ["n6", "stutterheim", "cathcart", "queenstown", "komani", "aliwal north"], lat: -31.8950, lng: 26.8750, roadway: "N6" },
  { keywords: ["r72", "kenton-on-sea", "port alfred", "alexandria", "bushmans river", "kidd's beach"], lat: -33.5950, lng: 26.8850, roadway: "R72" },
  { keywords: ["uitenhage", "kariega", "despatch", "william moffett", "cape road pe"], lat: -33.7750, lng: 25.4050, roadway: "R75" }
];

export function resolveCoordinatesFromText(text: string, roadway?: string, regionHint?: string): { lat: number; lng: number } {
  const lower = text.toLowerCase();
  const regionHintLower = (regionHint || '').toLowerCase();

  const isWC = regionHintLower.includes('western cape') ||
    regionHintLower.includes('cape town') ||
    lower.includes('cape town') ||
    lower.includes('western cape') ||
    lower.includes('paarl') ||
    lower.includes('stellenbosch') ||
    lower.includes('somerset west') ||
    lower.includes('bellville') ||
    lower.includes('century city') ||
    lower.includes('du toitskloof') ||
    lower.includes('huguenot tunnel') ||
    lower.includes('sir lowry') ||
    lower.includes('worcester') ||
    lower.includes('george') ||
    lower.includes('mossel bay') ||
    lower.includes('knysna') ||
    lower.includes('r300');

  const isEC = regionHintLower.includes('eastern cape') ||
    lower.includes('eastern cape') ||
    lower.includes('gqeberha') ||
    lower.includes('port elizabeth') ||
    lower.includes('east london') ||
    lower.includes('mthatha') ||
    lower.includes('makhanda') ||
    lower.includes('grahamstown') ||
    lower.includes('qonce') ||
    lower.includes('king william') ||
    lower.includes('jeffreys bay') ||
    lower.includes('coega') ||
    lower.includes('gonubie');

  const isKZN = regionHintLower.includes('natal') || 
    regionHintLower.includes('kzn') || 
    lower.includes('kzn') || 
    lower.includes('durban') || 
    lower.includes('pietermaritzburg') || 
    lower.includes('pmb') || 
    lower.includes('umhlanga') || 
    lower.includes('ballito') || 
    lower.includes('marianhill') || 
    lower.includes('townhill') || 
    lower.includes('mooi river') || 
    lower.includes('amanzimtoti') || 
    lower.includes('ksia');

  if (isWC) {
    for (const item of WESTERN_CAPE_LANDMARK_COORDS) {
      if (item.keywords.some((k) => lower.includes(k))) {
        return { lat: item.lat, lng: item.lng };
      }
    }
  }

  if (isEC) {
    for (const item of EASTERN_CAPE_LANDMARK_COORDS) {
      if (item.keywords.some((k) => lower.includes(k))) {
        return { lat: item.lat, lng: item.lng };
      }
    }
  }

  if (isKZN) {
    for (const item of KZN_LANDMARK_COORDS) {
      if (item.keywords.some((k) => lower.includes(k))) {
        return { lat: item.lat, lng: item.lng };
      }
    }
  }

  // Check Gauteng landmarks
  for (const item of GAUTENG_LANDMARK_COORDS) {
    if (item.keywords.some((k) => lower.includes(k))) {
      return { lat: item.lat, lng: item.lng };
    }
  }

  // Check WC landmarks as fallback
  for (const item of WESTERN_CAPE_LANDMARK_COORDS) {
    if (item.keywords.some((k) => lower.includes(k))) {
      return { lat: item.lat, lng: item.lng };
    }
  }

  // Check EC landmarks as fallback
  for (const item of EASTERN_CAPE_LANDMARK_COORDS) {
    if (item.keywords.some((k) => lower.includes(k))) {
      return { lat: item.lat, lng: item.lng };
    }
  }

  // Check KZN landmarks as fallback
  for (const item of KZN_LANDMARK_COORDS) {
    if (item.keywords.some((k) => lower.includes(k))) {
      return { lat: item.lat, lng: item.lng };
    }
  }

  // Roadway defaults
  if (roadway) {
    const rwLower = roadway.toLowerCase();
    if (isWC) {
      if (rwLower.includes("n1")) return { lat: -33.8908, lng: 18.5133 };
      if (rwLower.includes("n2")) return { lat: -33.9710, lng: 18.6010 };
      if (rwLower.includes("n7")) return { lat: -33.8200, lng: 18.5400 };
      if (rwLower.includes("m3")) return { lat: -33.9920, lng: 18.4680 };
      if (rwLower.includes("m5")) return { lat: -33.9650, lng: 18.5020 };
      if (rwLower.includes("r300")) return { lat: -33.9550, lng: 18.6650 };
      return { lat: -33.9249, lng: 18.4241 };
    }

    if (isEC) {
      if (rwLower.includes("n2")) return { lat: -33.9580, lng: 25.6180 };
      if (rwLower.includes("n10")) return { lat: -32.1650, lng: 25.6200 };
      if (rwLower.includes("n6")) return { lat: -31.8950, lng: 26.8750 };
      if (rwLower.includes("r72")) return { lat: -33.5950, lng: 26.8850 };
      return { lat: -33.9608, lng: 25.6022 };
    }

    if (isKZN) {
      if (rwLower.includes("n3")) return { lat: -29.6006, lng: 30.3794 }; // PMB
      if (rwLower.includes("n2")) return { lat: -29.7265, lng: 31.0664 }; // Umhlanga
      if (rwLower.includes("m4")) return { lat: -29.8000, lng: 31.0400 }; // M4 Durban
      if (rwLower.includes("m7")) return { lat: -29.8900, lng: 31.0000 }; // M7 Durban
      if (rwLower.includes("m13")) return { lat: -29.8167, lng: 30.8667 }; // Pinetown
      if (rwLower.includes("m19")) return { lat: -29.8050, lng: 30.9800 }; // Springfield
      return { lat: -29.8587, lng: 31.0218 };
    }

    if (rwLower.includes("n1")) return { lat: -25.9826, lng: 28.1256 };
    if (rwLower.includes("n3")) return { lat: -26.1706, lng: 28.1408 };
    if (rwLower.includes("n4")) return { lat: -25.7582, lng: 28.3474 };
    if (rwLower.includes("r21")) return { lat: -26.1486, lng: 28.2372 };
    if (rwLower.includes("r24")) return { lat: -26.1472, lng: 28.1925 };
    if (rwLower.includes("m1")) return { lat: -26.1039, lng: 28.0722 };
    if (rwLower.includes("n12")) return { lat: -26.1750, lng: 28.2000 };
    if (rwLower.includes("n14")) return { lat: -25.8600, lng: 28.1300 };
    if (rwLower.includes("n2")) return { lat: -29.7265, lng: 31.0664 };
  }

  if (isWC) return { lat: -33.9249, lng: 18.4241 };
  if (isEC) return { lat: -33.9608, lng: 25.6022 };
  if (isKZN) return { lat: -29.8587, lng: 31.0218 };
  return { lat: -26.1500, lng: 28.1000 };
}

export type SAProvinceQuery = 
  | 'Gauteng' 
  | 'KwaZulu-Natal' 
  | 'Western Cape' 
  | 'Eastern Cape' 
  | 'Free State' 
  | 'Mpumalanga' 
  | 'Limpopo' 
  | 'North West' 
  | 'Northern Cape';

async function fetchRegionDataInBrowser(regionName: SAProvinceQuery): Promise<any[]> {
  // First attempt local backend endpoint which has authenticated session management
  try {
    const localRes = await fetch(`/api/feed/sync-itraffic?region=${encodeURIComponent(regionName)}`, {
      method: 'POST',
      signal: AbortSignal.timeout(6000)
    });
    if (localRes.ok) {
      const localData = await localRes.json();
      const list = Array.isArray(localData.events) ? localData.events : (Array.isArray(localData.feed) ? localData.feed : []);
      if (list.length > 0) {
        return list.map((item: any) => ({
          ...item,
          DT_RowId: item.id || item.DT_RowId,
          _region: regionName,
          roadwayName: item.roadwayName,
          location: item.location,
          description: item.content || item.description,
          startTime: item.startTime || item.timestamp,
          endTime: item.endTime
        }));
      }
    }
  } catch {
    // try direct proxies
  }

  // Public CORS proxies (allorigins, codetabs) have severe rate limits and trigger 429 errors when queried for 9 provinces.
  // We strictly rely on the server-side proxy which manages authenticated sessions and rate limits safely.
  return [];
}

// Client-side direct scraper supporting all 9 South African Provinces
export async function scrapeLiveITrafficInBrowser(region: SAProvinceQuery | 'all' = 'all'): Promise<FeedItem[]> {
  let rawList: any[] = [];

  if (region === 'all') {
    const provinceList: SAProvinceQuery[] = [
      'Gauteng',
      'KwaZulu-Natal',
      'Western Cape',
      'Eastern Cape',
      'Free State',
      'Mpumalanga',
      'Limpopo',
      'North West',
      'Northern Cape'
    ];
    const results = await Promise.allSettled(
      provinceList.map(p => fetchRegionDataInBrowser(p))
    );

    for (const res of results) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        rawList.push(...res.value);
      }
    }
  } else {
    rawList = await fetchRegionDataInBrowser(region);
  }

  if (!rawList || rawList.length === 0) {
    return [];
  }

  // Deduplicate by eventId or DT_RowId
  const seenIds = new Set<string>();
  const uniqueRawList: any[] = [];
  for (const raw of rawList) {
    const uid = String(raw.DT_RowId || raw.eventId || `${raw.roadwayName}-${raw.location}-${raw.description}`).trim();
    if (!seenIds.has(uid)) {
      seenIds.add(uid);
      uniqueRawList.push(raw);
    }
  }

  // Parse raw table items into FeedItems
  const parsedItems: FeedItem[] = uniqueRawList.map((raw: any) => {
    const cleanDesc = cleanTrafficText(raw.description || "");

    let category: FeedItem["category"] = "traffic";
    const subType = (raw.eventSubType || raw.type || "").toLowerCase();
    const fullText = `${cleanDesc} ${raw.location || ""} ${raw.roadwayName || ""}`.toLowerCase();

    if (subType.includes("crash") || subType.includes("accident") || fullText.includes("crash") || fullText.includes("accident") || fullText.includes("collision")) {
      category = "accident";
    } else if (subType.includes("road work") || subType.includes("roadwork") || fullText.includes("roadworks") || fullText.includes("resurfacing")) {
      category = "roadworks";
    } else if (subType.includes("stationary") || fullText.includes("stationary vehicle") || fullText.includes("breakdown") || fullText.includes("hazard")) {
      category = "hazard";
    } else if (subType.includes("congestion") || fullText.includes("congestion") || fullText.includes("delay") || fullText.includes("queue")) {
      category = "traffic";
    }

    let regionName: string = raw.region || raw._region || "Gauteng";
    if (
      fullText.includes("cape town") ||
      fullText.includes("western cape") ||
      fullText.includes("paarl") ||
      fullText.includes("bellville") ||
      fullText.includes("stellenbosch") ||
      fullText.includes("somerset west") ||
      fullText.includes("century city") ||
      fullText.includes("huguenot tunnel") ||
      fullText.includes("du toitskloof")
    ) {
      regionName = "Western Cape";
    } else if (
      fullText.includes("eastern cape") ||
      fullText.includes("gqeberha") ||
      fullText.includes("port elizabeth") ||
      fullText.includes("east london") ||
      fullText.includes("mthatha") ||
      fullText.includes("makhanda") ||
      fullText.includes("grahamstown")
    ) {
      regionName = "Eastern Cape";
    } else if (
      fullText.includes("durban") ||
      fullText.includes("pietermaritzburg") ||
      fullText.includes("pmb") ||
      fullText.includes("umhlanga") ||
      fullText.includes("ballito") ||
      fullText.includes("marianhill") ||
      fullText.includes("townhill") ||
      fullText.includes("kzn")
    ) {
      regionName = "KwaZulu-Natal";
    }

    const isWC = regionName.toLowerCase().includes("western") || regionName.toLowerCase().includes("wc");
    const isEC = regionName.toLowerCase().includes("eastern") || regionName.toLowerCase().includes("ec");
    const isKZN = regionName.toLowerCase().includes("natal") || regionName.toLowerCase().includes("kzn");

    const fallbackCoord = resolveCoordinatesFromText(
      `${raw.roadwayName || ""} ${raw.location || ""} ${cleanDesc}`,
      raw.roadwayName,
      regionName
    );

    const fullLocation = [
      raw.roadwayName,
      raw.direction,
      raw.location
    ].filter(Boolean).join(" • ");

    let author = "Gauteng Traffic Control";
    let handle = "@LiveTrafficGP";
    let sourceLink = ITRAFFIC_GAUTENG_SOURCE_URL;
    let defaultLoc = "Gauteng Corridor";

    if (isWC) {
      author = "Western Cape Traffic Control";
      handle = "@LiveTrafficWC";
      sourceLink = ITRAFFIC_WC_SOURCE_URL;
      defaultLoc = "Western Cape Corridor";
    } else if (isEC) {
      author = "Eastern Cape Traffic Control";
      handle = "@LiveTrafficEC";
      sourceLink = ITRAFFIC_EC_SOURCE_URL;
      defaultLoc = "Eastern Cape Corridor";
    } else if (isKZN) {
      author = "KZN Traffic Control";
      handle = "@LiveTrafficKZN";
      sourceLink = ITRAFFIC_KZN_SOURCE_URL;
      defaultLoc = "KZN Highway Corridor";
    }

    return {
      id: `itraf-client-${raw.eventId || raw.DT_RowId || Math.random().toString(36).substring(2, 9)}`,
      source: "itraffic" as const,
      author,
      handle,
      content: cleanDesc || `${raw.eventSubType || "Traffic alert"} on ${raw.roadwayName || defaultLoc}`,
      location: fullLocation || defaultLoc,
      roadwayName: raw.roadwayName,
      direction: raw.direction,
      eventSubType: raw.eventSubType || raw.type,
      startTime: raw.startTime,
      endTime: raw.endTime,
      lastUpdated: raw.lastUpdated,
      region: regionName,
      timestamp: (() => {
        if (raw.lastUpdated) {
          const t = parseDateToMillis(raw.lastUpdated);
          if (t > 0) return new Date(t).toISOString();
        }
        if (raw.startTime) {
          const t = parseDateToMillis(raw.startTime);
          if (t > 0) return new Date(t).toISOString();
        }
        return new Date().toISOString();
      })(),
      category,
      verified: true,
      showOnLiveWatch: true,
      link: sourceLink,
      latitude: fallbackCoord.lat,
      longitude: fallbackCoord.lng
    };
  });

  const seenItemIds = new Set<string>();
  return parsedItems.filter(item => {
    if (!item || !item.id) return false;
    if (seenItemIds.has(item.id)) return false;
    seenItemIds.add(item.id);
    return true;
  });
}

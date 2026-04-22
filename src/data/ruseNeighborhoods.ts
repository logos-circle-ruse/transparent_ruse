export interface RuseNeighborhood {
  id: string;
  nameBg: string;
  nameEn: string;
}

export function normalizeNeighborhoodKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/жк|ж к|кв|вз|в з/g, "")
    .replace(/-|_/g, " ")
    .replace(/\s+/g, " ");
}

export const ruseNeighborhoods: RuseNeighborhood[] = [
  {
    id: "center",
    nameBg: "Център",
    nameEn: "Center",
  },
  {
    id: "vazrazhdane",
    nameBg: "Възраждане",
    nameEn: "Vazrazhdane",
  },
  {
    id: "druzhba-1",
    nameBg: "Дружба 1",
    nameEn: "Druzhba 1",
  },
  {
    id: "druzhba-2",
    nameBg: "Дружба 2",
    nameEn: "Druzhba 2",
  },
  {
    id: "druzhba-3",
    nameBg: "Дружба 3",
    nameEn: "Druzhba 3",
  },
  {
    id: "rodina-1",
    nameBg: "Родина 1",
    nameEn: "Rodina 1",
  },
  {
    id: "rodina-2",
    nameBg: "Родина 2",
    nameEn: "Rodina 2",
  },
  {
    id: "rodina-3",
    nameBg: "Родина 3",
    nameEn: "Rodina 3",
  },
  {
    id: "rodina-4",
    nameBg: "Родина 4",
    nameEn: "Rodina 4",
  },
  {
    id: "charodeyka",
    nameBg: "Чародейка",
    nameEn: "Charodeyka",
  },
  {
    id: "zdravets",
    nameBg: "Здравец",
    nameEn: "Zdravets",
  },
  {
    id: "zdravets-east",
    nameBg: "Здравец Изток",
    nameEn: "Zdravets East",
  },
  {
    id: "zdravets-north-1",
    nameBg: "Здравец Север 1",
    nameEn: "Zdravets North 1",
  },
  {
    id: "zdravets-north-2",
    nameBg: "Здравец Север 2",
    nameEn: "Zdravets North 2",
  },
  {
    id: "sredna-kula",
    nameBg: "Средна кула",
    nameEn: "Sredna Kula",
  },
  {
    id: "dolapite",
    nameBg: "Долапите",
    nameEn: "Dolapite",
  },
  {
    id: "hushove",
    nameBg: "Хъшове",
    nameEn: "Hushove",
  },
  {
    id: "yalta",
    nameBg: "Ялта",
    nameEn: "Yalta",
  },
  {
    id: "midiya-enos",
    nameBg: "Мидия Енос",
    nameEn: "Midiya Enos",
  },
  {
    id: "malyovitsa",
    nameBg: "Мальовица",
    nameEn: "Malyovitsa",
  },
  {
    id: "novata-mahala",
    nameBg: "Новата махала",
    nameEn: "Novata Mahala",
  },
  {
    id: "saraya",
    nameBg: "Сарая",
    nameEn: "Saraya",
  },
  {
    id: "shirok-center",
    nameBg: "Широк център",
    nameEn: "Wide Center",
  },
  {
    id: "central-south-region",
    nameBg: "Централен южен район",
    nameEn: "Central Southern Region",
  },
  {
    id: "zaharna-fabrika",
    nameBg: "Захарна фабрика",
    nameEn: "Sugar Factory",
  },
  {
    id: "traktsiata",
    nameBg: "Тракцията",
    nameEn: "Traktsiata",
  },
];

export const neighborhoodAliasByDistrict: Record<string, string> = {
  center: "center",
  "център": "center",
  "old center": "center",
  "old centre": "center",
  "wide center": "center",
  "wide centre": "center",
  "широк център": "shirok-center",
  "central southern district": "central-south-region",
  "централен южен район": "central-south-region",
  "vazrazhdane": "vazrazhdane",
  "възраждане": "vazrazhdane",
  "renaissance": "vazrazhdane",
  "druzhba 1": "druzhba-1",
  "дружба 1": "druzhba-1",
  friendship: "druzhba-1",
  "druzhba 2": "druzhba-2",
  "дружба 2": "druzhba-2",
  "druzhba 3": "druzhba-3",
  "дружба 3": "druzhba-3",
  "rodina 1": "rodina-1",
  "родина 1": "rodina-1",
  "rodina 2": "rodina-2",
  "родина 2": "rodina-2",
  "rodina 3": "rodina-3",
  "родина 3": "rodina-3",
  "rodina 4": "rodina-4",
  "родина 4": "rodina-4",
  "charodeyka": "charodeyka",
  "чародейка": "charodeyka",
  "чародейка север": "charodeyka",
  "чародейка юг": "charodeyka",
  "charodeyka north": "charodeyka",
  "charodeyka south": "charodeyka",
  "enchantress north": "charodeyka",
  "enchantress south": "charodeyka",
  "средна кула": "sredna-kula",
  "sredna kula": "sredna-kula",
  "долапите": "dolapite",
  "dolapite": "dolapite",
  "хъшове": "hushove",
  "hushove": "hushove",
  "ялта": "yalta",
  "yalta": "yalta",
  "мидия енос": "midiya-enos",
  "midiya enos": "midiya-enos",
  "мальовица": "malyovitsa",
  "malyovitsa": "malyovitsa",
  "новата махала": "novata-mahala",
  "novata mahala": "novata-mahala",
  "сарая": "saraya",
  "saraya": "saraya",
  "здравец": "zdravets",
  "zdravets": "zdravets",
  "здравец изток": "zdravets-east",
  "zdravets east": "zdravets-east",
  "здравец север 1": "zdravets-north-1",
  "zdravets north 1": "zdravets-north-1",
  "здравец север 2": "zdravets-north-2",
  "zdravets north 2": "zdravets-north-2",
  "захарна фабрика": "zaharna-fabrika",
  "sugar factory": "zaharna-fabrika",
  "zaharna fabrika": "zaharna-fabrika",
  "тракцията": "traktsiata",
  "traktsiata": "traktsiata",
};

export function getCanonicalNeighborhoodId(rawValue: string | null | undefined) {
  if (!rawValue) {
    return undefined;
  }
  return neighborhoodAliasByDistrict[normalizeNeighborhoodKey(rawValue)];
}

export interface NeighborhoodSeedRow {
  id: string;
  name_bg: string;
  name_en: string;
  aliases?: string[];
  sort_order?: number;
}

export const DEFAULT_NEIGHBORHOOD_SEED: NeighborhoodSeedRow[] = [
  { id: "center", name_bg: "Център", name_en: "Center", aliases: ["център", "center"] },
  { id: "vazrazhdane", name_bg: "Възраждане", name_en: "Vazrazhdane", aliases: ["възраждане"] },
  { id: "druzhba-1", name_bg: "Дружба 1", name_en: "Druzhba 1", aliases: ["дружба 1"] },
  { id: "druzhba-2", name_bg: "Дружба 2", name_en: "Druzhba 2", aliases: ["дружба 2"] },
  { id: "druzhba-3", name_bg: "Дружба 3", name_en: "Druzhba 3", aliases: ["дружба 3"] },
  { id: "rodina-1", name_bg: "Родина 1", name_en: "Rodina 1", aliases: ["родина 1"] },
  { id: "rodina-2", name_bg: "Родина 2", name_en: "Rodina 2", aliases: ["родина 2"] },
  { id: "rodina-3", name_bg: "Родина 3", name_en: "Rodina 3", aliases: ["родина 3"] },
  { id: "rodina-4", name_bg: "Родина 4", name_en: "Rodina 4", aliases: ["родина 4"] },
  { id: "charodeyka", name_bg: "Чародейка", name_en: "Charodeyka", aliases: ["чародейка"] },
  { id: "zdravets", name_bg: "Здравец", name_en: "Zdravets", aliases: ["здравец"] },
  { id: "zdravets-east", name_bg: "Здравец Изток", name_en: "Zdravets East", aliases: ["здравец изток"] },
  { id: "zdravets-north-1", name_bg: "Здравец Север 1", name_en: "Zdravets North 1", aliases: ["здравец север 1"] },
  { id: "zdravets-north-2", name_bg: "Здравец Север 2", name_en: "Zdravets North 2", aliases: ["здравец север 2"] },
  { id: "sredna-kula", name_bg: "Средна кула", name_en: "Sredna Kula", aliases: ["средна кула"] },
  { id: "dolapite", name_bg: "Долапите", name_en: "Dolapite", aliases: ["долапите"] },
  { id: "hushove", name_bg: "Хъшове", name_en: "Hushove", aliases: ["хъшове"] },
  { id: "yalta", name_bg: "Ялта", name_en: "Yalta", aliases: ["ялта"] },
  { id: "midiya-enos", name_bg: "Мидия Енос", name_en: "Midiya Enos", aliases: ["мидия енос"] },
  { id: "malyovitsa", name_bg: "Мальовица", name_en: "Malyovitsa", aliases: ["мальовица"] },
  { id: "novata-mahala", name_bg: "Новата махала", name_en: "Novata Mahala", aliases: ["новата махала"] },
  { id: "saraya", name_bg: "Сарая", name_en: "Saraya", aliases: ["сарая"] },
  { id: "shirok-center", name_bg: "Широк център", name_en: "Wide Center", aliases: ["широк център"] },
  {
    id: "central-south-region",
    name_bg: "Централен южен район",
    name_en: "Central Southern Region",
    aliases: ["централен южен район"],
  },
  { id: "zaharna-fabrika", name_bg: "Захарна фабрика", name_en: "Sugar Factory", aliases: ["захарна фабрика"] },
  { id: "traktsiata", name_bg: "Тракцията", name_en: "Traktsiata", aliases: ["тракцията"] },
];

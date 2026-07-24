import { ruseNeighborhoods, type RuseNeighborhood } from "../data/ruseNeighborhoods";
import { hasSupabaseEnv, supabase } from "./supabaseClient";

export interface NeighborhoodRecord {
  id: string;
  nameBg: string;
  nameEn: string;
  aliases: string[];
  sortOrder: number;
  active: boolean;
}

function mapRow(row: {
  id: string;
  name_bg: string;
  name_en: string;
  aliases: string[] | null;
  sort_order: number;
  active: boolean;
}): NeighborhoodRecord {
  return {
    id: row.id,
    nameBg: row.name_bg,
    nameEn: row.name_en,
    aliases: row.aliases ?? [],
    sortOrder: row.sort_order,
    active: row.active,
  };
}

function fallbackNeighborhoods(): NeighborhoodRecord[] {
  return ruseNeighborhoods.map((item, index) => ({
    id: item.id,
    nameBg: item.nameBg,
    nameEn: item.nameEn,
    aliases: [],
    sortOrder: index,
    active: true,
  }));
}

export async function fetchNeighborhoodCatalog(): Promise<NeighborhoodRecord[]> {
  if (!hasSupabaseEnv || !supabase) {
    return fallbackNeighborhoods();
  }

  const { data, error } = await supabase
    .from("neighborhoods")
    .select("id,name_bg,name_en,aliases,sort_order,active")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    return fallbackNeighborhoods();
  }

  return data.map(mapRow);
}

export function toRuseNeighborhoodShape(records: NeighborhoodRecord[]): RuseNeighborhood[] {
  return records.map((record) => ({
    id: record.id,
    nameBg: record.nameBg,
    nameEn: record.nameEn,
  }));
}

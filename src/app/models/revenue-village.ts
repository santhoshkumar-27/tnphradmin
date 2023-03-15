export class RevenueVillage {
  district_id: string;
  district_name?: string;
  taluk_id: string;
  taluk_name?: string;
  rev_village_id: string;
  rev_village_name: string;
  rev_village_local_name: string;
  rev_village_gid: number;
  firka_id: string;
  firka_name: string;
  active: boolean;
}

export class RevenueVillageFilters {
  DISTRICT_ID: string | null;
  TALUK_ID: string | null;
  REV_VILLAGE_NAME: string | null;
  REV_VILLAGE_GID: number | null;
}

export class UpsertRevenueVillage {
    district_id: string;
    taluk_id: string;
    rev_village_id: string;
    rev_village_name: string;
    rev_village_local_name: string;
    rev_village_gid: number;
    firka_id: string;
    firka_name: string;
    active: boolean;
}
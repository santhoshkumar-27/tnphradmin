export class HABITATION_FILTERS {
  'DISTRICT_ID': string | null;
  'HUD_ID': string | null;
  'BLOCK_ID': string | null;
  'VILLAGE_ID': string | null;
  'HABITATION_NAME': string | null;
  'HABITATION_GID': number | null;
}

export class HABITATION {
  'district_id': string;
  'district_name'?: string | null;
  'hud_id': string;
  'hud_name'?: string | null;
  'block_id': string;
  'block_name'?: string | null;
  'village_id': string;
  'village_name'?: string | null;
  'habitation_id': string;
  'habitation_gid': number;
  'habitation_name': string;
  'habitation_local_name': string | null;
  'active': boolean;
}

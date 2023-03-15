export class Village {
    district_id: string;
    district_name?: string;
    hud_id: string;
    hud_name?: string;
    block_id: string;
    block_name?: string;
    village_id: string;
    village_gid: number;
    village_name: string;
    village_local_name: string;
    village_type: string;
    active: boolean;
    village_local_body_code: number | null;
    village_lgd_code: number | null;
}

export class VillageFilterType {
    DISTRICT_ID: string | null;
    HUD_ID: string | null;
    BLOCK_ID: string | null;
    VILLAGE_NAME: string | null;
    VILLAGE_GID: number | null;
    VILLAGE_TYPE: string | null;
}

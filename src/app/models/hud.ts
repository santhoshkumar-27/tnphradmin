export class HUD_FILTERS {
    DISTRICT_ID: string | null;
    HUD_NAME: string | null;
    HUD_GID: number | null;
}

export class HUD {
    district_id: string;
    district_name?: string | null;
    hud_id: string;
    hud_gid: number;
    hud_name: string;
    hud_local_name?: string | null;
    hud_short_code?: number | null;
    active: boolean;
}
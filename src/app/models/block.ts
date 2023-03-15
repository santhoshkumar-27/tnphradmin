export class Block {
    district_id: string;
    district_name?: string;
    hud_id: string;
    hud_name?: string;
    block_id: string;
    block_gid: number;
    block_name: string;
    block_local_name: string;
    block_type: string;
    active: boolean;
    block_health_main_phc_name: string;
    block_health_main_phc_local_name: string;
    block_385_report_id: number;
    block_mpco_report_id: number;
    block_hmis_code: number | null;
    block_picme_id: number | null;
    block_rd_code: number | null;
    block_lgd_code: number | null;
}

export class BlockFilterType {
    DISTRICT_ID: string | null;
    HUD_ID: string | null;
    BLOCK_NAME: string | null;
    BLOCK_GID: number | null;
    BLOCK_TYPE: string | null;
}
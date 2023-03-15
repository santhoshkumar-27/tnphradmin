export class District {
    state_id: string;
    state_name?: string;
    district_id: string;
    district_gid: number;
    district_name: string;
    district_local_name: string | null;;
    district_lgd_code: number | null;
    district_rev_code: number | null;
    district_picme_code: number | null;
    district_rd_code: number | null;
    district_short_code: string | null;
    active: boolean;
}

export class DistrictFilterType {
    DISTRICT_NAME: string | null;
    DISTRICT_GID: number | null;
}
export class Taluk {
    taluk_id: string;
    taluk_gid: number;
    taluk_name: string;
    taluk_local_name: string;
    taluk_lgd_code: number | null;
    district_id: Array<string> | null;
    active: boolean;
}

export class TalukFilterType {
    DISTRICT_ID: string | null;
    TALUK_NAME: string | null;
    TALUK_GID: number | null;
}
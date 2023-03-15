export class VillageMaster{
    village_id: string;
    village_gid: number;
    village_name: string;
    district_id: string;
    block_id:string;
    hud_id:string;

    static mapJsonToVillage(data: JSON) : VillageMaster {
        let village = new VillageMaster();
        Object.assign(village, data);
        return village;
    }
}

export class RevVillageMaster{
    rev_village_id: string;
    rev_village_gid: number;
    rev_village_name: string;
    district_id: string;
    taluk_id:string;

    static mapJsonToRevVillage(data: JSON) : RevVillageMaster {
        let village = new RevVillageMaster();
        Object.assign(village, data);
        return village;
    }
}
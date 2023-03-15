export class HudMaster{
    district_id: string;
    hud_id: string;
    hud_gid: number;
    hud_name: string;

    static mapJsonToHud(data: JSON) : HudMaster {
        let item = new HudMaster();
        Object.assign(item, data);
        return item;
    }
}
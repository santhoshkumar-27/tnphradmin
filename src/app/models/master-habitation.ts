export class HabitationMaster{
    habitation_id: string;
    habitation_gid: string;
    habitation_name: string;
    district_id: string;
    hud_id: string;
    block_id: string;
    village_id: string;

    static mapJsonToHabitation(data: JSON) : HabitationMaster {
        let masterObject = new HabitationMaster();
        Object.assign(masterObject, data);
        return masterObject;
    }
}
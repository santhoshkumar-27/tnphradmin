export class FacilityLevelMaster{
    facility_level_id: string;
    facility_level_name: string;
    reference_id: number;
    owner_id: string;
    directorate_id: string;
    category_id: string;
    facility_type_id: string;

    static mapJsonToFacilityLevel(data: JSON) : FacilityLevelMaster {
        let item = new FacilityLevelMaster();
        Object.assign(item, data);
        return item;
    }
}
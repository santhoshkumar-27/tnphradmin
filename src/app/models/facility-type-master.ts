export class FacilityTypeMaster{
    facility_type_id: string;
    facility_type_name: string;
    reference_id: number;
    owner_id: string;
    directorate_id: string;
    category_id: string;

    static mapJsonToFacilityType(data: JSON) : FacilityTypeMaster {
        let item = new FacilityTypeMaster();
        Object.assign(item, data);
        return item;
    }
}
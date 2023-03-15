export class FacilityMaster {

    facility_id: string;
    facility_name: string;
    institution_gid: number;
    block_id: string;
    block_name: string;
    district_id: string;
    district_name: string;
    owner_id: string;
    directorate_id:string;
    directorate_name: string;
    category_id: string;
    category_name: string;
    facility_type_id: string;
    facility_type_name: string;
    facility_level_id: string;
    facility_level: string;

    static mapJsonToFacility(data: JSON) : FacilityMaster {
        let facility = new FacilityMaster();
        Object.assign(facility, data);
        //console.log("User Object after Conversion: ", user);
        return facility;
    }

    static mapFacilityToJson(facility: FacilityMaster) : string {
       return JSON.stringify(facility);
    }    

}
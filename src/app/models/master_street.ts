export class StreetMaster {

    street_id: string;
    street_name: string;
    street_gid: number;
    district_id: string;
    hud_id: string;
    block_id: string;
    village_id: string;
    rev_village_id: string;
    rev_village_name: string;
    taluk_id: string;
    taluk_name: string;

    static mapJsonToStreet(data: JSON) : StreetMaster {
        let street = new StreetMaster();
        Object.assign(street, data);
        //console.log("User Object after Conversion: ", user);
        return street;
    }

    static mapFacilityToJson(street: StreetMaster) : string {
       return JSON.stringify(street);
    }    

}
export class DistrictMaster{
    district_id: string;
    district_gid: number;
    district_name: string;

    static mapJsonToDistrict(data: JSON) : DistrictMaster {
        let district = new DistrictMaster();
        Object.assign(district, data);
        return district;
    }
}
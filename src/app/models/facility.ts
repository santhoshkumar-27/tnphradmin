export class Facility {
    facility_id: string;
    facility_name: string;
    institution_gid: number;
    district_id: string;
    block_id: string;
    owner_id: string;
    directorate_id: string;
    category_id: string;
    facility_type_id: string;
    facility_level: string;
    facility_level_id: string;
    facility_latitude: number;
    facility_longtitude: number;
    mobile_number: number;
    landline_number: number;
    email: string;
    parent_facility: string;
    child_facility: [];
    hq_street: string;
    street_name?: string;
    is_hwc: string;
    govt_department: string;
    parent_facility_name?: string;
    active: boolean;
    hud_id? : string;
    date_created? : string;
    last_update_date? : string;
  
    static mapJsonToFacility(data: JSON):Facility {
      let facility = new Facility();
      Object.assign(facility, data);
      return facility;
    }
  
    static mapfacilityToJson(facility: Facility): string {
      return JSON.stringify(facility);
    }
  }
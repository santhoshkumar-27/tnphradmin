export class Street {
  block_id: string;
  block_name?: string;
  village_id: string;
  village_name?: string;
  street_id: string;
  street_gid: number;
  district_id: string;
  district_name?: string;
  hud_id: string;
  hud_name?: string;
  street_name: string;
  facility_id: string;
  facility_name?: string;
  rev_village_id: string;
  rev_village_name?: string;
  habitation_id: string;
  habitation_name?: string;
  pincode: number;
  street_latitude: string;
  street_longitude: string;
  coastal_area: boolean;
  hilly_area: boolean;
  forest_area: boolean;
  tribal_area: boolean;
  assembly_constituency_id: string;
  assembly_constituency_name?: string;
  parlimentary_constituency_id: string;
  parlimentary_constituency_name?: string;
  hsc_unit_id?: string;
  hsc_unit_name: string;
  catering_anganwadi_id: string;
  catering_anganwadi_name?: string;
  ward_number: string;
  active: boolean;
  date_created?: string;
  last_update_date?: string;


  static mapJsonToStreet(data: JSON): Street {
    let street = new Street();
    Object.assign(street, data);
    return street;
  }

  static mapStreetToJson(street: Street): string {
    return JSON.stringify(street);
  }
}

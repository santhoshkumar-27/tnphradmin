import { Injectable } from '@angular/core';
import Dexie from 'dexie';
import { Constants } from 'src/app/config/constants/constants';

@Injectable({
  providedIn: 'root',
})
export class DataStoreService {
  private DB_NAME: string = "tnphr"
  db: any;
  constructor() {
    console.log('Initialize db');
    this.db = new Dexie(this.DB_NAME);
    this.db.version(13).stores({
      facilities: 'facility_id, facility_name, institution_gid, block_id, district_id, owner_id, directorate_id, directorate_name, category_id, category_name, facility_type_id, facility_type_name, facility_level_id, facility_level, parent_facility',
      blocks: 'block_id, block_gid, block_name, district_id, hud_id',
      streets: 'street_id, street_gid, street_name, rev_village_id, rev_village_name, taluk_id, taluk_name, district_id, district_name',
      districts: 'district_id, district_gid, district_name',
      villages: 'village_id, village_gid, village_name, block_id, hud_id, district_id',
      departments: 'department_id, department_code, department_name, department_unit',
      clinics: 'clinic_id, clinic_name',
      clinicTypes: 'clinic_type_id, clinic_type_name',
      habitations: 'habitation_id, habitation_gid, habitation_name, district_id, hud_id, block_id, village_id',
      revVillages: 'rev_village_id, rev_village_gid, rev_village_name, district_id, taluk_id',
      owners: 'owner_id, owner_name, reference_id',
      directorates: 'directorate_id, directorate_name, reference_id, owner_id',
      categories: 'category_id, category_name, reference_id, owner_id, directorate_id',
      facilityTypes: 'facility_type_id, facility_type_name, reference_id, owner_id, directorate_id, category_id',
      facilityLevels: 'facility_level_id, facility_level_name, reference_id, owner_id, directorate_id, category_id, facility_type_id',
      huds: 'hud_id, hud_gid, hud_name, district_id',
      employeeRoles: 'role_id, role_name',
      parlimentaryConstituencies:'parlimentary_constituency_id,parlimentary_constituency_name, reference_id',
      asseblyConstituencies:'assembly_constituency_id,reference_id,assembly_constituency_name,district_id,parlimentary_constituency_id',
      taluks: 'taluk_id, taluk_name, taluk_gid, district_id',
      states:'state_id,state_name,state_gid',
    });
    console.log('Initialize db done');
  }
  
  clearDatastore() {
    this.db.delete().then(() => {
        console.log("Datastore successfully deleted");
    }).catch((err: any) => {
        console.error("Error deleting datastore:", err);
    });
  }

  async clearTables() {
    await Promise.all([
      this.db.facilities.clear(),
      this.db.blocks.clear(),
      this.db.streets.clear(),
      this.db.districts.clear(),
      this.db.villages.clear(),
      this.db.departments.clear(),
      this.db.clinics.clear(),
      this.db.clinicTypes.clear(),
      this.db.habitations.clear(),
      this.db.revVillages.clear(),
      this.db.owners.clear(),
      this.db.directorates.clear(),
      this.db.categories.clear(),
      this.db.facilityTypes.clear(),
      this.db.facilityLevels.clear(),
      this.db.huds.clear(),
      this.db.employeeRoles.clear(),
      this.db.parlimentaryConstituencies.clear(),
      this.db.asseblyConstituencies.clear(),
      this.db.states.clear(),
      this.db.taluks.clear(),
    ]).then(() => {
      console.log('Datastore service | Cleared all tables.');
    });
  }
}

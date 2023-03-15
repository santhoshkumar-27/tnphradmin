import { Injectable } from "@angular/core";
import { Constants } from "../config/constants/constants";
import { User } from "../models/user";
import { DataStoreService } from "../starter/services/datastore.service";

@Injectable()
export class UtilService {
    constructor(private _dataService: DataStoreService) {}

    wait=ms=>new Promise(resolve => setTimeout(resolve, ms));

    async isNhmAdmin(user: User) {
        let isNhmAdmin: boolean = false;
        let user_facility_id = user.facility_id; // UUID
        let user_directorate = user.directorate_name; // "NHM"
        let user_role_in_facilitiy = user.role_in_facility; // "Admin"
        let user_role_id = user.role; // UUID
        let user_phr_role = user.phr_role; // "STATE_ADMIN"
        let facilities: Array<any> = await this._dataService.db.facilities.where("facility_id").equals(user_facility_id).toArray();
        let employee_roles: Array<any> = await this._dataService.db.employeeRoles.where('role_id').equals(user_role_id).toArray();

        // If local cache has not completely loaded, wait for 10 seconds.
        if(facilities.length == 0 || employee_roles.length == 0) {
            await this.wait(10000);
            facilities = await this._dataService.db.facilities.where("facility_id").equals(user_facility_id).toArray();
            employee_roles = await this._dataService.db.employeeRoles.where('role_id').equals(user_role_id).toArray();
        }

        console.log('---------->facilities[0].facility_name:', facilities[0]?.facility_name);
        console.log('---------->employee_roles[0].role_name:', employee_roles[0]?.role_name);
        if ((user_phr_role === Constants.STATE_ADMIN || user_phr_role === Constants.WEB_STATE_ADMIN) && facilities.length > 0
            && (facilities[0].facility_name === Constants.TNPHR_ADMIN_FACILITY || facilities[0].facility_name === Constants.NHM_STATE_ADMIN_FACILITY)
            && employee_roles.length > 0 && employee_roles[0].role_name === Constants.STATE_SUPERVISOR_ROLE
            && user_directorate === Constants.NHM_DIRCTORATE && user_role_in_facilitiy === Constants.ADMIN_FACILITY_USER_ROLE) {
            isNhmAdmin = true;
        }

        return isNhmAdmin;
    }
}
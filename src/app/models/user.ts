export class User
{
    user_id: string;
    user_first_name: string;
    user_last_name: string;
    user_title: string;
    designation: string;
    mobile_number: number;
    email: string;
    gender: string;
    birth_date: Date;
    employee_id: string;
    employee_type: string;
    facility_id: string;
    facility_name?: string;
    sub_facility_id: string;
    sub_facility_details: string; 
    role_in_facility: string;
    role: string;
    phr_role: string;
    postal_address: string;
    nature_of_work: string;
    status: string;
    active: boolean;
    esign_required: boolean;
    date_of_joining: Date;
    has_displinary_action: boolean;
    last_login_time: Date;
    assigned_jurisdiction:JSON;
    block_id? : string;
    district_id? : string;
    directorate_name? : string;
    directorate_id? : string;
    hud_id? : string;
    department_name? : string;
    date_created? : string;
    last_update_date? : string;

    static mapJsonToUser(data: JSON) : User {
        let user = new User();
        Object.assign(user, data);
        //console.log("User Object after Conversion: ", user);
        return user;
    }

    static mapUserToJson(user: User) : string {
       return JSON.stringify(user);
    }      
}
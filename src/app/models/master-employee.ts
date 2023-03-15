export class EmployeeRoleMaster{
    role_id: string;
    role_name: string;

    static mapJsonToEmployeeRole(data: JSON) : EmployeeRoleMaster {
        let item = new EmployeeRoleMaster();
        Object.assign(item, data);
        return item;
    }
}

export class EmployeeDesignationMaster{
    employee_designation_id: string;
    employee_designation_name: string;

    static mapJsonToEmployeeDesignation(data: JSON) : EmployeeDesignationMaster {
        let item = new EmployeeDesignationMaster();
        Object.assign(item, data);
        return item;
    }
}
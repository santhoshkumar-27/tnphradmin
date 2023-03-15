export class DepartmentMaster{
    department_id: string;
    department_code: string;
    department_name: string;
    department_unit: string;

    static mapJsonToDepartment(data: JSON) : DepartmentMaster {
        let department = new DepartmentMaster();
        Object.assign(department, data);
        return department;
    }
}
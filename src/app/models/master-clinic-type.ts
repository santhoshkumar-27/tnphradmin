export class ClinicTypeMaster{
    clinic_type_id: string;
    clinic_type_name: string;

    static mapJsonToClinicType(data: JSON) : ClinicTypeMaster {
        let clinicType = new ClinicTypeMaster();
        Object.assign(clinicType, data);
        return clinicType;
    }
}
export class ClinicMaster{
    clinic_id: string;
    clinic_name: string;

    static mapJsonToClinic(data: JSON) : ClinicMaster {
        let clinic = new ClinicMaster();
        Object.assign(clinic, data);
        return clinic;
    }
}
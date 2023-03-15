export class TalukMaster{
    district_id?: string;
    district_ids?: Array<string>;
    taluk_id: string;
    taluk_gid: number;
    taluk_name: string;

    static mapJsonToTaluk(data: JSON) : TalukMaster {
        let item = new TalukMaster();
        Object.assign(item, data);
        return item;
    }
}
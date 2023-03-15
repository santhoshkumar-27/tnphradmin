export class DirectorateMaster{
    owner_id: string;
    directorate_id: string;
    directorate_name: string;
    reference_id: string;

    static mapJsonToDirectorate(data: JSON) : DirectorateMaster {
        let item = new DirectorateMaster();
        Object.assign(item, data);
        return item;
    }
}
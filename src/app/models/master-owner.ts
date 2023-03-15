export class OwnerMaster{
    owner_id: string;
    owner_name: string;
    reference_id: number;

    static mapJsonToOwner(data: JSON) : OwnerMaster {
        let item = new OwnerMaster();
        Object.assign(item, data);
        return item;
    }
}
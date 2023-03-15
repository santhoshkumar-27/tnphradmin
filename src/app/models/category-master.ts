export class CategoryMaster{
    category_id: string;
    category_name: string;
    reference_id: number;
    owner_id: string;
    directorate_id: string;

    static mapJsonToCategory(data: JSON) : CategoryMaster {
        let item = new CategoryMaster();
        Object.assign(item, data);
        return item;
    }
}
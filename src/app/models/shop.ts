export class Shop
{
    shop_id: string;
    district: string;
    taluk: string;	
    village: string;	
    shop_name: string;	
    shop_code: string;
    latitude: number;
    longitude: number;
    street_name: string;	
    street_gid: number;
    active: boolean;
    rev_village_id? : string;
    date_created? : string;
    last_update_date? : string;

    static mapJsonToShop(data: JSON) : Shop {
        let shop = new Shop();
        Object.assign(shop, data);
        //console.log("User Object after Conversion: ", user);
        return shop;
    }

    static mapShopToJson(shop: Shop) : string {
       return JSON.stringify(shop);
    }      
}
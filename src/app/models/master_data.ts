export class DataMaster {

    id: string;
    name: string;

    static mapJsonToMaster(data: JSON) : DataMaster {
        let dataM = new DataMaster();
        Object.assign(dataM, data);
        //console.log("User Object after Conversion: ", user);
        return dataM;
    }

    static mapFacilityToJson(data: DataMaster) : string {
       return JSON.stringify(data);
    }    

}
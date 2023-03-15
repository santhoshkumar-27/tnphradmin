import { NgModule, Pipe, PipeTransform } from '@angular/core';
import { Constants } from '../config/constants/constants';
import { DataStoreService } from '../starter/services/datastore.service';

@Pipe({ name: 'districtIdToName' })
export class DistrictIdToNamePipe implements PipeTransform {
  constructor(private _dataService: DataStoreService) { }

  transform(districtId: string): Promise<string> {

    if(districtId){
      console.log('at pipe value:', districtId);
      //return this._dataService.db.districts.get({ district_id: districtId });
      return new Promise((resolve, reject) => {
        this._dataService.db.districts.get({ district_id: districtId }).then((districtObj: any) => {
          resolve(districtObj.district_name);
        }).catch((error: any) => {
          resolve('None');
        });
      });  
    }

    return new Promise((resolve)=>{resolve('None')});
  }
}

@Pipe({ name: 'blockIdToName' })
export class BlockIdToNamePipe implements PipeTransform {
  constructor(private _dataService: DataStoreService) {}

  transform(blockId: string): Promise<string> {
    if (blockId) {
      console.log('BlockId pipe value:', blockId);
      return new Promise((resolve, reject) => {
        this._dataService.db.blocks
          .get({ block_id: blockId })
          .then((blockObj: any) => {
            resolve(blockObj.block_name);
          })
          .catch((error: any) => {
            resolve('None');
          });
      });
    }

    return new Promise((resolve) => {
      resolve('None');
    });
  }
}

@Pipe({ name: 'villageIdToName' })
export class VillageIdToNamePipe implements PipeTransform {
  constructor(private _dataService: DataStoreService) {}

  transform(villageId: string): Promise<string> {
    if (villageId) {
      console.log('VillageId pipe value:', villageId);
      return new Promise((resolve, reject) => {
        this._dataService.db.villages
          .get({ village_id: villageId })
          .then((blockObj: any) => {
            resolve(blockObj.village_name);
          })
          .catch((error: any) => {
            resolve('None');
          });
      });
    }

    return new Promise((resolve) => {
      resolve('None');
    });
  }
}

@Pipe({ name: 'facilityIdToName' })
export class FacilityIdToNamePipe implements PipeTransform {
  constructor(private _dataService: DataStoreService) {}

  transform(facilityId: string): Promise<string> {
    if (facilityId) {
      console.log('FacilityId pipe value:', facilityId);
      return new Promise((resolve, reject) => {
        this._dataService.db.facilities
          .get({ facility_id: facilityId })
          .then((facilityObj: any) => {
            resolve(facilityObj.facility_name);
          })
          .catch((error: any) => {
            console.log('Error in facility pipe:', error);
            resolve('None');
          });
      });
    }

    return new Promise((resolve) => {
      resolve('None');
    });
  }
}

@Pipe({ name: 'OwnerIdToName', })
export class OwnerIdToNamePipe implements PipeTransform {
  constructor(private _dataService: DataStoreService) { }

  transform(OwnerId: string): Promise<string> {

    if(OwnerId){
      console.log('at pipe value:', OwnerId);
      //return this._dataService.db.districts.get({ district_id: districtId });
      return new Promise((resolve, reject) => {
        this._dataService.db.owners.get({ owner_id: OwnerId }).then((OwnerObj: any) => {
          resolve(OwnerObj.owner_name);
        }).catch((error: any) => {
          resolve('None');
        });
      });  
    }
    return new Promise((resolve)=>{resolve('None')});
  }
}

@Pipe({ name: 'CategoryIdToName'})
export class CategoryIdToNamePipe implements PipeTransform {
  constructor(private _dataService: DataStoreService) { }

  transform(CategoryId: string): Promise<string> {

    if(CategoryId){
      console.log('at pipe value:', CategoryId);
      //return this._dataService.db.districts.get({ district_id: districtId });
      return new Promise((resolve, reject) => {
        this._dataService.db.categories.get({ category_id: CategoryId }).then((CategoryObj: any) => {
          resolve(CategoryObj.category_name);
        }).catch((error: any) => {
          resolve('None');
        });
      });  
    }
    return new Promise((resolve)=>{resolve('None')});
  }
}

@Pipe({ name: 'TypeIdToName'})
export class TypeIdToNamePipe implements PipeTransform {
  constructor(private _dataService: DataStoreService) { }

  transform(TypeId: string): Promise<string> {

    if(TypeId){
      console.log('at pipe value:', TypeId);
      //return this._dataService.db.districts.get({ district_id: districtId });
      return new Promise((resolve, reject) => {
        this._dataService.db.facilityTypes.get({ facility_type_id: TypeId }).then((TypeObj: any) => {
          resolve(TypeObj.facility_type_name);
        }).catch((error: any) => {
          resolve('None');
        });
      });  
    }
    return new Promise((resolve)=>{resolve('None')});
  }
}

@Pipe({ name: 'DirectorateIdToName'})
export class DirectorateIdToNamePipe implements PipeTransform {
  constructor(private _dataService: DataStoreService) { }

  transform(DirectorateId: string): Promise<string> {

    if(DirectorateId){
      console.log('at pipe value:', DirectorateId);
      //return this._dataService.db.districts.get({ district_id: districtId });
      return new Promise((resolve, reject) => {
        this._dataService.db.directorates.get({ directorate_id: DirectorateId }).then((DirectorateObj: any) => {
          resolve(DirectorateObj.directorate_name);
        }).catch((error: any) => {
          resolve('None');
        });
      });  
    }
    return new Promise((resolve)=>{resolve('None')});
  }
}

@Pipe({ name: 'villageTypeToName' })
export class VillageTypeToNamePipe implements PipeTransform {
  transform(villageType: string): Promise<string> {
    if (villageType) {
      console.log('villageType pipe value:', villageType);
      return new Promise((resolve, reject) => {
        let villageTypeItem = Constants.VILLAGE_TYPE.find(item => item.value === villageType);
        resolve(villageTypeItem ? villageTypeItem.name: 'Unknown');
      });
    }

    return new Promise((resolve) => {
      resolve('Unknown');
    });
  }
}

@Pipe({ name: 'hudIdToName' })
export class HudIdToName implements PipeTransform {
  constructor(private _dataService: DataStoreService) { }

  transform(hudId: string): Promise<string> {

    if(hudId){
      return new Promise((resolve, reject) => {
        this._dataService.db.huds.get({ hud_id: hudId }).then((hudObj: any) => {
          resolve(hudObj.hud_name);
        }).catch((error: any) => {
          resolve('None');
        });
      });  
    }

    return new Promise((resolve)=>{resolve('None')});
  }
}

let pipes: any = [
  DistrictIdToNamePipe,
  BlockIdToNamePipe,
  VillageIdToNamePipe,
  VillageTypeToNamePipe,
  OwnerIdToNamePipe,
  CategoryIdToNamePipe,
  DirectorateIdToNamePipe,
  TypeIdToNamePipe,
  FacilityIdToNamePipe,
  HudIdToName,
];

@NgModule({
  imports: [],
  declarations: [pipes],
  exports: [pipes]
})
export class IdToNameModule { }
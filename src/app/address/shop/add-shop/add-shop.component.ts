import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { Shop } from 'src/app/models/shop';
import { ShopService } from '../service/shop.service';
import { User } from 'src/app/models/user';
import { Constants } from 'src/app/config/constants/constants';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/starter/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MasterDataService } from 'src/app/starter/services/master-data.service';
import {
  optionObjectObjectValidator,
  selectedOptionObjectValidator,
} from 'src/app/validators/searchSelect.validator';
import { DataStoreService } from 'src/app/starter/services/datastore.service';
import { CanComponentDeactivate } from 'src/app/navigation/services/can-deactivate-guard.service';
import { isUnallocated } from 'src/app/utils/unallocated.util';

@Component({
  selector: 'app-add-shop',
  templateUrl: './add-shop.component.html',
  styleUrls: ['./add-shop.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AddShopComponent implements OnInit, CanComponentDeactivate {
  shop: Shop;
  currentUser: User;
  isEdit: boolean;
  title: string;
  isCallInProgress: boolean = false;

  streetList: any = [];
  filteredStreets: any = new Subject();
  villageList: any;
  filteredVillages: any = new Subject();

  // Vertical Stepper
  shopDetails: FormGroup;

  // Private
  private _unsubscribeAll: Subject<any>;

  isSubmit: boolean = false;

  /**
   * Constructor
   *
   * @param {FormBuilder} _formBuilder
   */
  constructor(
    private _formBuilder: FormBuilder,
    private _service: ShopService,
    private _router: Router,
    private _authService: AuthService,
    private _dataservice: MasterDataService,
    private _snackBar: MatSnackBar,
    private _dataService: DataStoreService
  ) {
    this.isEdit = false;
    this.title = 'Create Shop';

    // Set the private defaults
    this._unsubscribeAll = new Subject();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    console.log('document.referrer:', this._router.url);
    this._authService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });

    let userString = sessionStorage.getItem(Constants.CURRENT_USER);
    console.log('Shop Add : Current User:', userString);
    if (userString) {
      this._dataservice.getVillageList().subscribe((values: Array<any>) => {
        console.log('value-village-2:', values);
        this.villageList = values;
        this.shopDetails
          .get('village')
          ?.addValidators([
            optionObjectObjectValidator(this.villageList, 'village_name'),
          ]);
        this.shopDetails.get('village')?.updateValueAndValidity();
        this.shopDetails.get('village')?.setValue('');
        if (this.shop) {
          const findObj = this.villageList.find((list: any) => list?.village_name.includes(this.shop.village));
          if (findObj) {
            this.shopDetails.get('village')?.setValue({ ...findObj });
          }
        }
      });
    } else {
      console.log('Shop Add : Navigating to login');
      this._router.navigateByUrl('/login');
      return;
    }

    let _editObject = sessionStorage.getItem('EDIT_SHOP');

    if (_editObject) {
      this.shop = JSON.parse(_editObject);
      this.title = 'Edit Shop';
      this.isEdit = true;

      console.log('Shop being edited :', this.shop);
    }

    // Vertical Stepper form stepper
    this.shopDetails = this._formBuilder.group({
      district: [
        this.shop ? this.shop.district : '',
        [Validators.required, Validators.pattern('[0-9a-zA-Z .()_-]*')],
      ],
      taluk: [this.shop ? this.shop.taluk : '', [Validators.required, Validators.pattern('[0-9a-zA-Z .()_-]*')]],
      rev_village: ['', [Validators.required]],
      shop_name: [
        { value: this.shop ? this.shop.shop_name : '', disabled: this.isEdit },
        [Validators.required, Validators.pattern('[0-9a-zA-Z .()_-]*')]
      ],
      shop_code: [
        { value: this.shop ? this.shop.shop_code : '', disabled: this.isEdit },
        [Validators.required, Validators.pattern('[0-9a-zA-Z .()_-]*')]
      ],
      latitude: [
        this.shop ? this.shop.latitude : 0.0,
        [Validators.required, Validators.pattern('([0-9]+[.][0-9]*[1-9]+)')],
      ],
      longitude: [
        this.shop ? this.shop.longitude : 0.0,
        [Validators.required, Validators.pattern('([0-9]+[.][0-9]*[1-9]+)')],
      ],
      street_name: [
        this.shop ? this.shop.street_name : '',
        [Validators.required, Validators.pattern("[0-9a-zA-Z: -_{},']*")]
      ],
      village: [''],
      //street_gid: [this.shop ? this.shop.street_gid : 'None', Validators.required]
      active: [
        this.shop ? this.returnYesOrNo(this.shop.active) : '',
        [Validators.required],
      ],
    });

    this.shopDetails.get('district')?.disable();
    this.shopDetails.get('taluk')?.disable();
    this.shopDetails.get('rev_village')?.disable();

    if (this.shop?.rev_village_id)
      this.getRevVillageName(this.shop.rev_village_id);

    if (this.shop && this.shop.street_gid) {
      console.log('Retreiving street details from local db for:', this.shop.street_gid);
      this._dataService.db.streets.get({ street_gid: this.shop.street_gid }).then((streetDetails: any) => {
        console.log('Retrieved street:', streetDetails);
        if (streetDetails) {
          this.shopDetails.patchValue({ street_name: { street_name: streetDetails.street_name, street_id: streetDetails.street_id, street_gid: this.shop.street_gid } });
        } else {
          this.shopDetails.get('street_name')?.reset();
          // this.shopDetails.get('street_name')?.reset();
        }
      }).catch((error: any) => {
        console.log('Error while retrieving street:', error);
      });
    }

    this.onChanges();
  }

  async getRevVillageName(id) {
    let revVillage = await this._service.getRevVillageName(id);
    this.shopDetails.get('rev_village')?.setValue(revVillage);
  }

  onChanges(): void {
    console.log('=> called onChange() 2');

    this.shopDetails.get('village')?.valueChanges.subscribe((val: any) => {
      console.log('village value:', val, ' and type:', typeof val);
      const filterValue =
        typeof val === 'object'
          ? val.village_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.villageList.filter((village: any) =>
        village.village_name.toLowerCase().includes(filterValue)
      );
      this.filteredVillages.next(
        filteredOne.length > 25 ? filteredOne.slice(0, 25) : filteredOne
      );
    });

    this.shopDetails.get('street_name')?.valueChanges.subscribe((val: any) => {
      console.log('Street value:', val, ' and type:', typeof val);
      const filterValue =
        typeof val === 'object'
          ? val.street_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.streetList.filter((street: any) =>
        street.street_name.toLowerCase().includes(filterValue)
      );
      this.filteredStreets.next(
        filteredOne.length > 25 ? filteredOne.slice(0, 25) : filteredOne
      );
    });
  }
  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Finish the vertical stepper
   */
  submitForm(): void {
    if (!this.shopDetails.valid) {
      console.log('Form not valid!');
      return;
    }

    this.isSubmit = true;
    this.isCallInProgress = true;
    //alert('You have finished the vertical stepper!');
    if (!this.isEdit) {
      this.shop = new Shop();
      this.shop.shop_id = uuidv4();
    }

    if (this.shopDetails.get('district')?.disabled) {
      this.shop.district = this.shopDetails.getRawValue().district;
    } else {
      this.shop.district = this.shopDetails.value['district'];
    }

    if (this.shopDetails.get('taluk')?.disabled) {
      this.shop.taluk = this.shopDetails.getRawValue().taluk;
    } else {
      this.shop.taluk = this.shopDetails.value['taluk'];
    }

    if (this.shopDetails.get('village')?.disabled) {
      this.shop.village = this.shopDetails.getRawValue().village?.village_name;
    } else {
      this.shop.village = this.shopDetails.value['village']?.village_name;
    }

    if (this.shopDetails.get('shop_name')?.disabled) {
      this.shop.shop_name = this.shopDetails.getRawValue().shop_name;
    } else {
      this.shop.shop_name = this.shopDetails.value['shop_name'];
    }

    if (this.shopDetails.get('shop_code')?.disabled) {
      this.shop.shop_code = this.shopDetails.getRawValue().shop_code;
    } else {
      this.shop.shop_code = this.shopDetails.value['shop_code'];
    }

    let street = this.shopDetails.value['street_name'];
    console.log('street:', street);
    this.shop.street_name = street.street_name;
    this.shop.street_gid = street.street_gid;
    this.shop.latitude = parseFloat(this.shopDetails.value['latitude']);
    this.shop.longitude = parseFloat(this.shopDetails.value['longitude']);

    this.shop.active = this.shopDetails.value['active'] == 'Yes' ? true : false;

    //delete unnessesary parameters
    delete this.shop.rev_village_id;
    delete this.shop.date_created;
    delete this.shop.last_update_date;

    this._service
      .upsertShop(this.currentUser, this.shop)
      .subscribe((status) => {
        console.log('Add shop response:', status);
        // Navigate back if status is SUCCESS else stay here.
        if (status === Constants.SUCCESS_FLAG) {
          sessionStorage.removeItem('EDIT_SHOP');
          this._snackBar.open('Shop Added/Updated successfully.', 'Dismiss', {
            duration: 4000,
          });
          this._router.navigateByUrl('/addr/shops');
        } else {
          this._snackBar.open('Shop Add/Edit failed.', 'Dismiss', {
            duration: 4000,
          });
        }

        this.isCallInProgress = false;
      });
  }

  onStreetBlur() {
    let street = this.shopDetails.value['street_name'];
    console.log('on street blur:', street);
    if (street) {
      if (this.isEdit) {
        this.shopDetails.patchValue({
          district: street.district_name,
          taluk: street.taluk_name,
          rev_village: street.rev_village_name,
        });
        if (
          this.shopDetails.get('latitude')?.value == '' ||
          this.shopDetails.get('latitude')?.value == 0.0
        ) {
          this.shopDetails.patchValue({
            latitude: street.latitude,
          });
        }
        if (
          this.shopDetails.get('longitude')?.value == '' ||
          this.shopDetails.get('longitude')?.value == 0.0
        ) {
          this.shopDetails.patchValue({
            longitude: street.longitude,
          });
        }
      } else {
        this.shopDetails.patchValue({
          district: street.district_name,
          taluk: street.taluk_name,
          rev_village: street.rev_village_name,
          latitude: street.latitude,
          longitude: street.longitude,
        });
      }
    } else {
      if (this.isEdit) {
        this.shopDetails.patchValue({
          district: '',
          taluk: '',
          rev_village: '',
        });
        if (
          this.shopDetails.get('latitude')?.value == '' ||
          this.shopDetails.get('latitude')?.value == 0.0
        ) {
          this.shopDetails.patchValue({
            latitude: '',
          });
        }
        if (
          this.shopDetails.get('longitude')?.value == '' ||
          this.shopDetails.get('longitude')?.value == 0.0
        ) {
          this.shopDetails.patchValue({
            longitude: '',
          });
        }
      } else {
        this.shopDetails.patchValue({
          district: '',
          taluk: '',
          rev_village: '',
          latitude: '',
          longitude: '',
        });
      }
    }
  }

  onVillageBlur() {
    console.log('Street Add | onVillageBlur()');
    let village = this.shopDetails.value['village'];
    if (village && this.shopDetails.get('village')?.valid) {
      let filter: any = {};
      filter['VILLAGE_ID'] = village.village_id;

      this._service
        .getStreetListForce(filter)
        .subscribe((values: Array<any>) => {
          console.log('Street Add | Street list:', values);
          this.streetList = values;
          this.filteredStreets.next(this.streetList);
          this.shopDetails.get('street_name')?.clearValidators();
          this.shopDetails
            .get('street_name')
            ?.addValidators([
              Validators.required,
              optionObjectObjectValidator(this.streetList, 'street_name'),
            ]);
          this.shopDetails.get('street_name')?.updateValueAndValidity();
          this.shopDetails.get('street_name')?.setValue('');
        });
    }
  }

  displayStreetFn(street?: any): string {
    return street ? street.street_name : '';
  }

  displayVillageFn(village?: any): string {
    return village ? village.village_name : '';
  }

  returnYesOrNo(flag: boolean) {
    return flag ? 'Yes' : 'No';
  }

  canDeactivate(): boolean {
    // if submit btn is clicked do not show the pop up
    if (this.isSubmit) return false;
    else return this.shopDetails.dirty;
  }

  isUnallocated(): boolean {
    return isUnallocated(this.shopDetails);
  }
}

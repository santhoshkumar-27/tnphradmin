import { Component, Inject, INJECTOR, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Constants } from 'src/app/config/constants/constants';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/starter/services/auth.service';
import { MasterDataService } from 'src/app/starter/services/master-data.service';
import { isStateAdmin } from 'src/app/utils/session.util';
import { optionObjectObjectValidator } from 'src/app/validators/searchSelect.validator';
import { StreetService } from '../service/street.service';

@Component({
  selector: 'app-street-bulk-edit-dialog',
  templateUrl: './street-bulk-edit-dialog.component.html',
  styleUrls: ['./street-bulk-edit-dialog.component.scss'],
})
export class StreetBulkEditDialogComponent implements OnInit {
  streetDetails: FormGroup;

  currentUser: User;

  facilityList: any;
  filteredFacilities: any = new Subject();
  revVillageList: any;
  filteredRevVillages: any = new Subject();
  AssemblyList: any;
  filteredAssConstituency: any = new Subject();
  ParliamentList: any;
  filteredParConstituency: any = new Subject();
  anganwadiList: any = [];
  filteredAnganwadis: any = new Subject();

  isCallInProgress: boolean = false;

  errMsg: string = '';

  constructor(
    private _authService: AuthService,
    private _dataservice: MasterDataService,
    private _formBuilder: FormBuilder,
    private streetService: StreetService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<StreetBulkEditDialogComponent>
  ) {}

  ngOnInit(): void {
    this._authService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });

    this.streetDetails = this._formBuilder.group({
      facility: [''],
      pincode: ['', [Validators.pattern('[1-9][0-9]{5}')]],
      revVillage: [''],
      assConstituency: [''],
      parConstituency: [''],
      anganwadi: [''],
      ward_number: [
        '',
        [Validators.pattern('[1-9]{1}[0-9]{0,3}[a-zA-Z]{0,1}')],
      ],
      active: [''],
    });

    this.getAssemblyConsList();
    this.getParlimentaryConsList();
    this.getRevVillageList();

    if (this.data.blockIds?.length == 1) {
      this.getCateringHscs(this.data.blockIds[0]);
      this.getAnganwadies(this.data.blockIds[0]);
    } else {
      this.streetDetails.get('facility')?.disable();
      this.streetDetails.get('anganwadi')?.disable();
    }

    if (this.data.villageIds?.length > 1) {
      this.streetDetails.get('ward_number')?.disable();
    }

    this.onChanges();
  }

  getAssemblyConsList() {
    this._dataservice
      .getAssemblyConstituencyList()
      .subscribe((values: Array<any>) => {
        this.AssemblyList = values;
        this.streetDetails
          .get('assConstituency')
          ?.addValidators([
            optionObjectObjectValidator(
              this.AssemblyList,
              'assembly_constituency_name'
            ),
          ]);
        this.streetDetails.get('assConstituency')?.setValue('');
      });
  }

  getParlimentaryConsList() {
    this._dataservice
      .getParliamentConstituencyList()
      .subscribe((values: Array<any>) => {
        this.ParliamentList = values;
        this.streetDetails
          .get('parConstituency')
          ?.addValidators([
            optionObjectObjectValidator(
              this.ParliamentList,
              'parlimentary_constituency_name'
            ),
          ]);
        this.streetDetails.get('parConstituency')?.setValue('');
      });
  }

  getRevVillageList() {
    this._dataservice.getRevVillageList().subscribe((values: Array<any>) => {
      console.log('Add Street | rev village list:', values);
      this.revVillageList = values;
      this.streetDetails
        .get('revVillage')
        ?.addValidators([
          optionObjectObjectValidator(this.revVillageList, 'rev_village_name'),
        ]);
      this.streetDetails.get('revVillage')?.setValue('');
    });
  }

  getCateringHscs(blockId) {
    if (isStateAdmin(this.currentUser)) {
      this.streetService
        .getHSCFacilities(this.currentUser, blockId)
        .pipe(
          map((response: any) => {
            const facilities: Array<any> = response.data;
            return facilities.filter(
              (facility) => facility.facility_level === 'HSC'
            );
          })
        )
        .subscribe((facilities: Array<any>) => {
          console.log('Street Add | Received facilities:', facilities);
          this.facilityList = facilities;
          this.streetDetails
            .get('facility')
            ?.addValidators([
              optionObjectObjectValidator(this.facilityList, 'facility_name'),
            ]);
          this.streetDetails.get('facility')?.setValue('');
        });
    } else {
      this.streetService
        .getBlockFacilities(blockId)
        .then((facilities: Array<any>) => {
          console.log('Street Add | Received facilities:', facilities);
          this.facilityList = facilities;
          this.streetDetails
            .get('facility')
            ?.addValidators([
              optionObjectObjectValidator(this.facilityList, 'facility_name'),
            ]);
          this.streetDetails.get('facility')?.setValue('');
        });
    }
  }

  getAnganwadies(blockId: any) {
    this.streetService
      .getAnganwadis(this.currentUser, blockId)
      .pipe(
        map((response: any) => {
          const anganwadis: Array<any> = response.data;
          return anganwadis;
        })
      )
      .subscribe((anganwadis: Array<any>) => {
        this.anganwadiList = anganwadis;
        this.streetDetails
          .get('anganwadi')
          ?.addValidators([
            optionObjectObjectValidator(this.anganwadiList, 'facility_name'),
          ]);
        this.streetDetails.get('anganwadi')?.setValue('');
      });
  }

  onChanges(): void {
    this.streetDetails.get('facility')?.valueChanges.subscribe((val: any) => {
      const filterValue =
        typeof val === 'object'
          ? val.facility_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.facilityList.filter((facility: any) =>
        facility.facility_name.toLowerCase().includes(filterValue)
      );
      this.filteredFacilities.next(
        filteredOne.length > 25 ? filteredOne.slice(0, 25) : filteredOne
      );
    });

    this.streetDetails.get('anganwadi')?.valueChanges.subscribe((val: any) => {
      const filterValue =
        typeof val === 'object'
          ? val.facility_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.anganwadiList.filter((anganwadi: any) =>
        anganwadi.facility_name.toLowerCase().includes(filterValue)
      );
      this.filteredAnganwadis.next(
        filteredOne.length > 25 ? filteredOne.slice(0, 25) : filteredOne
      );
    });

    this.streetDetails.get('revVillage')?.valueChanges.subscribe((val: any) => {
      const filterValue =
        typeof val === 'object'
          ? val.rev_village_name.toLowerCase()
          : val.toLowerCase();
      let filteredOne = this.revVillageList.filter((revVillage: any) =>
        revVillage.rev_village_name.toLowerCase().includes(filterValue)
      );
      this.filteredRevVillages.next(
        filteredOne.length > 25 ? filteredOne.slice(0, 25) : filteredOne
      );
    });

    this.streetDetails
      .get('assConstituency')
      ?.valueChanges.subscribe((val: any) => {
        const filterValue =
          typeof val === 'object'
            ? val.assembly_constituency_name.toLowerCase()
            : val.toLowerCase();
        let filteredOne = this.AssemblyList.filter((assConstituency: any) =>
          assConstituency.assembly_constituency_name
            .toLowerCase()
            .includes(filterValue)
        );
        this.filteredAssConstituency.next(
          filteredOne.length > 25 ? filteredOne.slice(0, 25) : filteredOne
        );
      });

    this.streetDetails
      .get('parConstituency')
      ?.valueChanges.subscribe((val: any) => {
        const filterValue =
          typeof val === 'object'
            ? val.parlimentary_constituency_name.toLowerCase()
            : val.toLowerCase();
        let filteredOne = this.ParliamentList.filter((parConstituency: any) =>
          parConstituency.parlimentary_constituency_name
            .toLowerCase()
            .includes(filterValue)
        );
        this.filteredParConstituency.next(
          filteredOne.length > 25 ? filteredOne.slice(0, 25) : filteredOne
        );
      });
  }

  // check if the data is having all "" values
  validateStreetsData(): boolean {
    let obj = this.streetDetails.value;
    for (let key in obj) {
      if (obj[key] != '') {
        return false;
      }
    }
    return true;
  }

  updateStreets() {
    console.log(this.streetDetails.value);
    console.log(this.data.streetIds);

    if (this.streetDetails.invalid) return;

    if (this.validateStreetsData()) {
      this.errMsg = 'Please select atleast one value to update';
      return;
    }

    this.errMsg = '';

    const streetObj: any = {};

    streetObj.ward_number =
      this.streetDetails.get('ward_number')?.value || null;
    streetObj.pincode = this.streetDetails.value['pincode']
      ? parseInt(this.streetDetails.value['pincode'])
      : null;
    streetObj.facility_id =
      this.streetDetails.get('facility')?.value?.facility_id || null;
    streetObj.rev_village_id =
      this.streetDetails.value['revVillage']?.rev_village_id || null;
    streetObj.assembly_constituency_id =
      this.streetDetails.value['assConstituency']?.assembly_constituency_id ||
      null;
    streetObj.assembly_constituency_name =
      this.streetDetails.value['assConstituency']?.assembly_constituency_name ||
      null;
    streetObj.parlimentary_constituency_id =
      this.streetDetails.value['parConstituency']
        ?.parlimentary_constituency_id || null;
    streetObj.parlimentary_constituency_name =
      this.streetDetails.value['parConstituency']
        ?.parlimentary_constituency_name || null;
    streetObj.catering_anganwadi_id =
      this.streetDetails.get('anganwadi')?.value?.facility_id || null;
    streetObj.active =
      this.streetDetails.value['active'] != ''
        ? this.streetDetails.value['active'] == 'Yes'
          ? true
          : false
        : null;

    console.log('bulk update street', streetObj);

    let ward_data: any = null;
    if (streetObj.ward_number != null) {
      ward_data = {
        village_id: this.data.wardData?.village_id,
        district_id: this.data.wardData?.district_id,
        hud_id: this.data.wardData?.hud_id,
        block_id: this.data.wardData?.block_id,
      };
    }

    this.isCallInProgress = true;

    this.streetService
      .bulkUpdateStreets(
        this.currentUser,
        streetObj,
        this.data.streetIds,
        ward_data
      )
      .subscribe((status: string) => {
        if (status === Constants.SUCCESS_FLAG) {
          this._snackBar.open('Streets Updated successfully.', 'Dismiss', {
            duration: 4000,
          });
          this.dialogRef.close(true);
        } else {
          this._snackBar.open('Streets Update failed.', 'Dismiss', {
            duration: 4000,
          });
          this.dialogRef.close(false);
        }

        this.isCallInProgress = false;
      });
  }

  displayFacilityFn(facility?: any): string {
    return facility ? facility.facility_name : '';
  }

  displayAnganwadiFn(anganwadi?: any): string {
    return anganwadi ? anganwadi.facility_name : '';
  }

  displayRevVillageFn(revVillage?: any): string {
    return revVillage ? revVillage.rev_village_name : '';
  }

  displayAssemblyConstituencyFn(assConstituency?: any): string {
    return assConstituency ? assConstituency.assembly_constituency_name : '';
  }

  displayParliamentConstituencyFn(parConstituency?: any): string {
    return parConstituency
      ? parConstituency.parlimentary_constituency_name
      : '';
  }
}

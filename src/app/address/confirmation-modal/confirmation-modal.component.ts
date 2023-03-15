import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { FacilityMaster } from 'src/app/models/master_facility';
import { User } from 'src/app/models/user';
import { EntityService } from 'src/app/services/entity.service';
import { AuthService } from 'src/app/starter/services/auth.service';
import { optionObjectObjectValidator } from 'src/app/validators/searchSelect.validator';

@Component({
  selector: 'app-confirmation-modal',
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.scss'],
})
export class ConfirmationModalComponent implements OnInit {
  user: User;
  optionsPanel: FormGroup;
  message: any;
  showCateringHsc: boolean;
  isCallInProgress: boolean;

  facilityList: FacilityMaster[];
  filteredFacilities: Subject<FacilityMaster[]> = new Subject();

  constructor(
    public dialogRef: MatDialogRef<ConfirmationModalComponent>,
    private _formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data,
    private _authService: AuthService,
    private _entityService: EntityService
  ) {}

  ngOnInit(): void {
    this._authService.currentUser.subscribe((user) => {
      this.user = user;
    });

    this.showCateringHsc = this.data.showCateringHsc;

    this.dialogRef.updatePosition({ top: '30px' });

    this.getLowerEntities();

    if (this.showCateringHsc) {
      this.optionsPanel = this._formBuilder.group({
        facility: ['', Validators.required],
      });

      this.optionsPanel.get('facility')?.valueChanges.subscribe((val: any) => {
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

      this.getCateringHscs();
    }
  }

  getCateringHscs() {
    this._entityService
      .getHSCFacilities(this.user, this.data.blockId)
      .subscribe((result: any) => {
        let facilities = result?.data;
        this.facilityList = facilities.filter(
          (facility: any) => facility.facility_level == 'HSC'
        );
        this.optionsPanel
          .get('facility')
          ?.addValidators(
            optionObjectObjectValidator(this.facilityList, 'facility_name')
          );
        this.optionsPanel.get('facility')?.setValue('');
      });
  }

  getLowerEntities() {
    this.isCallInProgress = true;
    this._entityService
      .getLowerEntities(this.user, this.data?.payload)
      .subscribe((respone: any) => {
        this.message = Object.entries(respone?.data);
        this.isCallInProgress = false;
      });
  }

  closeDialog() {
    this.dialogRef.close(true);
  }

  submitForm() {
    if (this.optionsPanel.valid)
      this.dialogRef.close(this.optionsPanel.value['facility']?.facility_id);
  }

  displayFacilityFn(facility?: any) {
    return facility ? facility.facility_name : '';
  }
}

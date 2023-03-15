import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Constants } from 'src/app/config/constants/constants';
import { User } from 'src/app/models/user';
import { AuthService } from 'src/app/starter/services/auth.service';
import { ShopService } from '../service/shop.service';

@Component({
  selector: 'app-shop-bulk-edit',
  templateUrl: './shop-bulk-edit.component.html',
  styleUrls: ['./shop-bulk-edit.component.scss'],
})
export class ShopBulkEditComponent implements OnInit {
  shopDetails: FormGroup;
  currentUser: User;
  isCallInProgress: boolean = false;

  constructor(
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _shopService: ShopService,
    private _authService: AuthService,
    private _snackBar: MatSnackBar,
    private _dialogRef: MatDialogRef<ShopBulkEditComponent>
  ) {}

  ngOnInit(): void {
    this._authService.currentUser.subscribe((user) => {
      this.currentUser = user;
    });

    this.shopDetails = this.fb.group({
      active: [''],
    });
  }

  updateShops() {
    if (this.shopDetails.invalid) return;
    console.log(this.shopDetails.value);
    console.log(this.data.shopIds);

    let shop_data = {
      active: this.shopDetails.value['active'] == 'Yes' ? true : false,
    };

    this.isCallInProgress = true;

    this._shopService
      .updateBulkEdit(this.currentUser, shop_data, this.data.shopIds)
      .subscribe((status: any) => {
        if (status === Constants.SUCCESS_FLAG) {
          this._snackBar.open('Shops Updated successfully.', 'Dismiss', {
            duration: 4000,
          });
          this._dialogRef.close(true);
        } else {
          this._snackBar.open('Shops Update failed.', 'Dismiss', {
            duration: 4000,
          });
          this._dialogRef.close(false);
        }

        this.isCallInProgress = false;
      });
  }
}

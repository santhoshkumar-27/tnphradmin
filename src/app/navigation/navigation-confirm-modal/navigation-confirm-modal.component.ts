import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navigation-confirm-modal',
  templateUrl: './navigation-confirm-modal.component.html',
  styleUrls: ['./navigation-confirm-modal.component.scss']
})
export class NavigationConfirmModalComponent implements OnInit {

  constructor( public dialogRef: MatDialogRef<NavigationConfirmModalComponent>,
               @Inject(MAT_DIALOG_DATA) public data: any) {
                dialogRef.disableClose = true;
              }

  ngOnInit(): void {
    this.dialogRef.updatePosition({ top: '30px'});
  }

  closeDialog() {
    this.dialogRef.close('Yes');
  }

}

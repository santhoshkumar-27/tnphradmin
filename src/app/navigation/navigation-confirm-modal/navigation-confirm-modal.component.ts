import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-navigation-confirm-modal',
  templateUrl: './navigation-confirm-modal.component.html',
  styleUrls: ['./navigation-confirm-modal.component.scss']
})
export class NavigationConfirmModalComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<NavigationConfirmModalComponent>) { }

  ngOnInit(): void {
    this.dialogRef.updatePosition({ top: '30px'});
  }

  closeDialog() {
    this.dialogRef.close('Yes');
  }

}

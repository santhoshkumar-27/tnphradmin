import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanDeactivate,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs/internal/Observable';
import { MatDialog } from '@angular/material/dialog';
import { NavigationConfirmModalComponent } from '../../navigation/navigation-confirm-modal/navigation-confirm-modal.component';
import { SubscribableOrPromise, Subscription } from 'rxjs';

export interface CanComponentDeactivate {
  canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CanDeactivateGuardService
  implements CanDeactivate<CanComponentDeactivate>
{
  constructor(private dialog: MatDialog) {}

  canDeactivate(
    component: CanComponentDeactivate,
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ) {
    if (component.canDeactivate) {
      const formChanged = component.canDeactivate();
      console.log(formChanged);
      if (formChanged) {
        const dialogRef = this.dialog.open(NavigationConfirmModalComponent, {
          data: { message: 'You have unsaved changes. Are you sure you want to leave this page?', invalidToken: false },
        });
        return dialogRef.afterClosed().toPromise().then((result) => {
          return result == 'Yes' ? true : false;
        });
      } else {
        return true;
      }
    } else {
      return true;
    }
  }
}

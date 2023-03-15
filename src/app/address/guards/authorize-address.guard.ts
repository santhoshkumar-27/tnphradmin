import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { Constants } from 'src/app/config/constants/constants';

@Injectable({
  providedIn: 'root'
})
export class AuthorizeAddressGuard implements CanActivate {

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      let user: any = sessionStorage.getItem(Constants.CURRENT_USER);
      user = JSON.parse(user);
      if (user.directorate_name == "DPH" || user.directorate_name == "NHM") {
        return true;
      }
      return false;
  }
  
}

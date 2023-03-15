import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from "@angular/router";
import { Observable } from "rxjs";
import { Constants } from "src/app/config/constants/constants";
import { UtilService } from "src/app/services/util.service";

@Injectable({providedIn: 'root'})
export class AuthorizeNhmGuard implements CanActivate {
    constructor(
        private _utilService: UtilService,
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
        let user: any = sessionStorage.getItem(Constants.CURRENT_USER);
        user = JSON.parse(user);
        return this._utilService.isNhmAdmin(user);
    }

}
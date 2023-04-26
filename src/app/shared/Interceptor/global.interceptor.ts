import { Injectable } from "@angular/core";
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpResponse,
} from "@angular/common/http";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { environment } from "src/environments/environment";
import { catchError, concatMap, filter, finalize, map, switchMap, take, tap } from "rxjs/operators";
import { RefreshtokenService } from "src/app/services/refreshtoken.service";
import { MatDialog } from "@angular/material/dialog";
import { NavigationConfirmModalComponent } from "src/app/navigation/navigation-confirm-modal/navigation-confirm-modal.component";
import { Router } from "@angular/router";
import { AuthService } from "src/app/starter/services/auth.service";

@Injectable()
export class GlobalInterceptor implements HttpInterceptor {
  token = "";
  currentUser = '';
  dialogRef: any;
  isRefreshingToken: any;
  tokenRefreshed$ = new BehaviorSubject<boolean>(false);
  dialogTriggered = false;

  constructor( private refreshToken: RefreshtokenService,
               private dialog: MatDialog,
               private _route: Router,
               private _authService: AuthService ) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
      // this.currentUser = sessionStorage.getItem("current_user")
      // ? JSON.parse(sessionStorage.getItem("current_user") as any)
      // : "";

    // if (!!this.currentUser) {
    //   this.token = (this.currentUser as any).auth_token;
    // }
    const customReq = request.clone({
      withCredentials: true,
      url: environment.apiURL + request.url,
      // headers: request.headers.set("x-access-token", this.token),
    });
    return next.handle(customReq).pipe(
      tap((resp: any) => {
        if (resp instanceof HttpResponse) {
          if (resp?.body?.message?.includes("Token Expired")) {
            throw new HttpErrorResponse({
              error: 'Token Expired',
              // headers: evt.headers,
              status: 403,
              statusText: 'Warning',
              // url: evt.url
          });
            // return this.handle403Error(customReq, next);
          }
          if (resp?.body?.message?.includes("Invalid Token")) {
            if (!this.dialogTriggered) {
              this.dialogTriggered = true;
              this.logoutDialog();
            }
          }
        } else {
          return resp;
        }
      }),
      catchError((error: any) => {
        // return Observable.throw(error);
      //   // logging the http response to browser's console in case of a failuer
        if (error instanceof HttpErrorResponse) {
          if (error?.error?.includes("Token Expired")) {
            return this.handle403Error(request, next);
          } else {
            return throwError(error);
          }
        } else {
          return throwError(error);
        }
      })
    );
  }
  /**
   * @description
   * To refresh the token on token expiry and retry the failed api
   */
  handle403Error(request: HttpRequest<any>, next: HttpHandler) {
    if (this.isRefreshingToken) {
      return this.tokenRefreshed$.pipe(
        filter(Boolean),
        concatMap(() => next.handle(this.addToken(request)))
      );
    }
    this.isRefreshingToken = true;
    // Reset here so that the following requests wait until the token
    // comes back from the refreshToken call.
    this.tokenRefreshed$.next(false);
    return this.refreshToken.getRefreshedToken().pipe(
      switchMap((res: any) => {
        this.isRefreshingToken = false;
        this.tokenRefreshed$.next(true);
        if(res.message.includes('Invalid Token') && !(!!this.dialogRef)) {
          console.log('the token has become invalid'); 
          this.logoutDialog();
          return throwError('Invalid Token');   
        } else {
          return next.handle(this.addToken(request));
        }
      }),
      finalize(() => {
        this.isRefreshingToken = false;
      })
    );
  }

  logoutDialog() {
   this.dialogRef = this.dialog.open(NavigationConfirmModalComponent, {
            data: { message: 'Your token is Invalid Please Login again', invalidToken: true },
          });    
          this.dialogRef.afterClosed().toPromise().then((result) => {
            if (result == 'Yes') {
              this.dialogTriggered = false;
              this._authService.logout();
              this._route.navigateByUrl('/login');
            }
          });
  }
  /**
   * @description
   * To add the token to the headers key of the payload
   */
  addToken(req: HttpRequest<any>): HttpRequest<any> {
    const body = req.body;
    // const currUser = sessionStorage.getItem("current_user");
    // body.headers["x-access-token"] = sessionStorage.getItem("current_user");
    return req.clone({
      withCredentials: true,
      url: environment.apiURL + req.url,
      body: { ...body },
    });
  }
}

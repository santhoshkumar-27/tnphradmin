import { Injectable } from "@angular/core";
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpResponse,
} from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { environment } from "src/environments/environment";
import { catchError, map, switchMap, tap } from "rxjs/operators";
import { RefreshtokenService } from "src/app/services/refreshtoken.service";

@Injectable()
export class GlobalInterceptor implements HttpInterceptor {
  token = "";
  currentUser = '';

  constructor(private refreshToken: RefreshtokenService) {}

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
      url: environment.devApiURL + request.url,
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
    return this.refreshToken.getRefreshedToken().pipe(
      tap((token: any) => {
        (this.currentUser as any).auth_token = token.data;
        sessionStorage.setItem("current_user", JSON.stringify(this.currentUser));
      }),
      switchMap((res: any) => {
        return next.handle(this.addToken(request, res.data));
      })
    );
  }
  /**
   * @description
   * To add the token to the headers key of the payload
   */
  addToken(req: HttpRequest<any>, token: any): HttpRequest<any> {
    const body = req.body;
    // const currUser = sessionStorage.getItem("current_user");
    // body.headers["x-access-token"] = sessionStorage.getItem("current_user");
    return req.clone({
      url: environment.devApiURL + req.url,
      headers: req.headers.set(
        'x-access-token', 
        `${token}`
      ),
      body: { ...body },
    });
  }
}

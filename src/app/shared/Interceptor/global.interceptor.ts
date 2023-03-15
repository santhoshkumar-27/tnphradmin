import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class GlobalInterceptor implements HttpInterceptor {

  token = '';

  constructor() { 
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let token = sessionStorage.getItem("current_user") ? JSON.parse(sessionStorage.getItem("current_user") as any) : '';
    console.log('token', token);

    if (token) {
      this.token = token.auth_token;
      console.log('token123', this.token);
    }
    const customReq = request.clone({
      url: environment.apiURL + request.url,
      headers: request.headers.set('x-access-token', this.token)
    });
    return next.handle(customReq);
  }
}

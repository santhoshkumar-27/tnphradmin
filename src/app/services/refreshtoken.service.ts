import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RefreshtokenService {

  constructor(
    private http: HttpClient,
  ) { }

  getRefreshedToken() {
    return this.http.post('admin_api_refresh_token', {});
  }
}

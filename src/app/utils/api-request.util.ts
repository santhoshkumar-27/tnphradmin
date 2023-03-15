import { HttpHeaders } from '@angular/common/http';

export function getHeaders(token: string | null): HttpHeaders {
  let headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'x-access-token': token? token : '',
  });

  return headers;
}

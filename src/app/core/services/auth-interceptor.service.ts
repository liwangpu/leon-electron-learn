import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpEvent, HttpRequest, HttpHandler } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppCacheService } from './app-cache.service';


@Injectable()
export class AuthInterceptorService implements HttpInterceptor {


  constructor(protected cacheSrv: AppCacheService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let token = this.cacheSrv.token;
    if (token) {
      let secureHeaders = req.headers;
      secureHeaders = secureHeaders.append('Authorization', `bearer ${token}`);
      const secureReq = req.clone({ headers: secureHeaders });
      return next.handle(secureReq);
    }
    return next.handle(req);
  }//intercept

}

import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpEvent, HttpRequest, HttpHandler } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppCacheService } from './app-cache.service';


@Injectable()
export class LocalizationInterceptorService implements HttpInterceptor {

  constructor(protected cacheSrv: AppCacheService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let language = this.cacheSrv.lastLanguage;
    language = language ? language : 'en';
    let localizationHeaders = req.headers;
    localizationHeaders = localizationHeaders.append('Accept-Language', language);
    const secureReq = req.clone({ headers: localizationHeaders });
    return next.handle(secureReq);
  }//intercept
}

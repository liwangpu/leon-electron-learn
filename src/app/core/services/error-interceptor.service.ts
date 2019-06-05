import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { MessageCenterService } from './message-center.service';

@Injectable()
export class ErrorInterceptorService implements HttpInterceptor {

  constructor(private translate: TranslateService, private msgSrv: MessageCenterService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    return next.handle(req)
      .pipe(catchError(response => {
        let responseIns = response as HttpErrorResponse;

        if (responseIns.status == 0) {
          this.translate.get('message.cannotConnectToServer').subscribe(msg => this.msgSrv.message(msg));
        }
        else if (responseIns.status == 400) {
          let messageArr: string[] = responseIns['error']['messages'];
          let message = messageArr.join("  ");
          this.msgSrv.message(message);
          return throwError(messageArr);
        }
        return throwError(response);
      }));
  }//intercept

}

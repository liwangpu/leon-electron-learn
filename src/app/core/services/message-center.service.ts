import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable()
export class MessageCenterService {

  constructor(private translateSrv: TranslateService, private snackBarSrv: MatSnackBar) {

  }//constructor

  message(msg: string, translate?: boolean) {
    let options: MatSnackBarConfig = {
      duration: 1000,
      horizontalPosition: "center"
    };
    if (translate) {
      this.translateSrv.get(msg).subscribe(message => this.snackBarSrv.open(message, null, options));
    }
    else {
      this.snackBarSrv.open(msg, null, options);
    }
  }//message
}

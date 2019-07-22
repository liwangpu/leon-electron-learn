import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable()
export class MessageCenterService {

  constructor(private translate: TranslateService, private snackBarSrv: MatSnackBar) {

  }//constructor

  message(msg: string, translate?: boolean) {
    let options: MatSnackBarConfig = {
      duration: 3500,
      horizontalPosition: "center"
    };
    if (translate) {
      this.translate.get(msg).subscribe(message => this.snackBarSrv.open(message, null, options));
    }
    else {
      this.snackBarSrv.open(msg, null, options);
    }
  }//message

  operateSuccessfully() {
    this.message('message.operateSuccessfully', true);
  }//operateSuccessfully

  saveSuccessfully() {
    this.message('message.saveSuccessfully', true);
  }//保存成功
}

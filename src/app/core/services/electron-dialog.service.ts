import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';

@Injectable()
export class ElectronDialogService {

  constructor(protected electSrv: ElectronService) {

  }//constructor

  showOpenDialog(option?: object) {
    if (!this.electSrv.isElectron) return;
    let projectDir = this.electSrv.remote.dialog.showOpenDialog(option);

    console.log('project dir:',projectDir);
  }//showOpenDialog

}

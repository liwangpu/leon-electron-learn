import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';

@Injectable()
export class BrowserWindowService {

  constructor(protected electSrv: ElectronService) {

  }//constructor

  minimize() {
    if (this.electSrv.isElectron) {
      this.electSrv.win.minimize();
    }//if
  }//minimize

  maximize() {
    if (this.electSrv.isElectron) {
      this.electSrv.win.maximize();
    }//if
  }//maximize

  unmaximize() {
    if (this.electSrv.isElectron) {
      this.electSrv.win.unmaximize();
    }//if
  }//unmaximize

  close() {
    if (this.electSrv.isElectron) {
      this.electSrv.win.close();
    }//if
  }//close
}

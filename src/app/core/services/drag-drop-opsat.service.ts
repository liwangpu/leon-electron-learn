import { Injectable } from '@angular/core';
import { ElectronService } from './electron.service';

@Injectable()
export class DragDropOpsatService {

  constructor(protected electSrv: ElectronService) {

    // this.electSrv.ipcRenderer.on('app-ondragend', (evt, arg) => {
    //   console.log(111, evt, arg);
    // });

    // if (!this.electSrv.isElectron) return;
    // this.electSrv.ipcMain.on('app-ondragend',(evt, arg)=>{
    //   console.log('app-ondragend', evt, arg); 
    // });

  }//constructor


}

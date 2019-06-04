import { Component } from '@angular/core';
import { BrowserWindowService } from '@app/core';
import { filter } from "rxjs/operators";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  _maxWindowState = false;
  constructor(protected browserWinSrv: BrowserWindowService) {

    // translate.setDefaultLang('en');
    // console.log('AppConfig', AppConfig);

    // if (electronService.isElectron) {
    //   console.log('Mode electron');
    //   console.log('Electron ipcRenderer', electronService.ipcRenderer);
    //   console.log('NodeJS childProcess', electronService.childProcess);
    // } else {
    //   console.log('Mode web');
    // }

    // this.browserWinSrv.browserWindowEvents.pipe(filter(tp => tp.topic == 'maximize')).subscribe(() => {
    //   this._maxWindowState = true;
    //   // console.log('maximize',this._maxWindowState);
    // });//subscribe
    // this.browserWinSrv.browserWindowEvents.pipe(filter(tp => tp.topic == 'unmaximize')).subscribe(() => {
    //   this._maxWindowState = false;
    //   // console.log('unmaximize',this._maxWindowState);
    // });//subscribe


  }//constructor

  toggleWindowMode() {
    if (this.browserWinSrv.isMaximize)
      this.browserWinSrv.unmaximize();
    else
      this.browserWinSrv.maximize();
    // if (this._maxWindowState)
    //   this.browserWinSrv.unmaximize();
    // else
    //   this.browserWinSrv.maximize();
    // this._maxWindowState = !this._maxWindowState;
  }//toggleWindowMode
}

import { Component } from '@angular/core';
import { BrowserWindowService } from '@app/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  _maxWindow = false;
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
  }//constructor

  toggleWindowMode() {
    this._maxWindow = !this._maxWindow;
    if (this._maxWindow)
      this.browserWinSrv.maximize();
    else
      this.browserWinSrv.unmaximize();
  }//toggleWindowMode
}

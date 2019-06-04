import { Component } from '@angular/core';
import { BrowserWindowService, AppCacheService } from '@app/core';
import { filter } from "rxjs/operators";
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  _maxWindowState = false;
  constructor(private translateSrv: TranslateService, private cacheSrv: AppCacheService, public browserWinSrv: BrowserWindowService) {

    let lastLanguage = this.cacheSrv.lastLanguage;
    if (lastLanguage) {
      this.translateSrv.use(lastLanguage);
    }
    else {
      let broswerLang = this.translateSrv.getBrowserLang();
      broswerLang = broswerLang && broswerLang.match(/en|zh/) ? broswerLang : 'zh';
      this.translateSrv.use(broswerLang);
      this.cacheSrv.lastLanguage = broswerLang;
    }

    // console.log(process.versions);

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

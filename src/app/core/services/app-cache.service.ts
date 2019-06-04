import { Injectable } from '@angular/core';
import { LocalStoreService } from './local-store.service';

const c_last_lang = 'dmz_app_last_lang';

@Injectable()
export class AppCacheService {

  private _language: string;

  constructor(protected localStoreSrv: LocalStoreService) {

  }//constructor


  set lastLanguage(vl: string) {
    this._language = vl;
    this.localStoreSrv.setItem(c_last_lang, vl);
  }
  get lastLanguage() {
    if (!this._language)
      this._language = this.localStoreSrv.getItem(c_last_lang);
    return this._language;
  }


}

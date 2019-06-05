import { Injectable } from '@angular/core';
import { LocalStoreService } from './local-store.service';

const c_server = 'dmz_app_server';
const c_token = 'dmz_app_token';
const c_token_expires = 'dmz_app_token_expires';
const c_last_lang = 'dmz_app_last_lang';
const c_last_login_account = 'dmz_app_last_login_account';

@Injectable()
export class AppCacheService {

  private _server: string;
  private _token: string;
  private _tokenExpires: string;
  private _lastLoginAccount: string;
  private _language: string;

  constructor(protected localStoreSrv: LocalStoreService) {

  }//constructor

  set server(vl: string) {
    this._server = vl;
    this.localStoreSrv.setItem(c_server, vl);
  }
  get server() {
    if (!this._server)
      this._server = this.localStoreSrv.getItem(c_server);
    return this._server;
  }
  set token(vl: string) {
    this._token = vl;
    this.localStoreSrv.setItem(c_token, vl);
  }
  get token() {
    if (!this._token)
      this._token = this.localStoreSrv.getItem(c_token);
    return this._token;
  }
  set tokenExpires(vl: string) {
    this._tokenExpires = vl;
    this.localStoreSrv.setItem(c_token_expires, vl);
  }
  get tokenExpires() {
    if (!this._tokenExpires)
      this._tokenExpires = this.localStoreSrv.getItem(c_token_expires);
    return this._tokenExpires;
  }
  set lastLoginAccount(vl: string) {
    this._lastLoginAccount = vl;
    this.localStoreSrv.setItem(c_last_login_account, vl);
  }
  get lastLoginAccount() {
    if (!this._lastLoginAccount)
      this._lastLoginAccount = this.localStoreSrv.getItem(c_last_login_account);
    return this._lastLoginAccount;
  }
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

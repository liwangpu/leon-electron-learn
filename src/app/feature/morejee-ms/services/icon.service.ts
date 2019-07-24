import { Injectable } from '@angular/core';
import { AppConfigService } from '@app/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class IconService {

   get _URI() {
    return `${this.configSrv.server}/oss/icons`;
  }
  constructor(protected configSrv: AppConfigService, protected httpClient: HttpClient) {

  }//constructor

  // checkFileExistByMd5(md5: string) {
  //   return this.httpClient.get(`${this._URI}/Md5/${md5}`, { responseType: "text" });
  // }//checkFileExistByMd5
}

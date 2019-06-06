import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConfigService } from '@app/core';

@Injectable()
export class SrcClientAssetService {

  private get _URI() {
    return `${this.configSrv.server}/oss/srcClientAssets`;
  }
  constructor(protected configSrv: AppConfigService, protected httpClient: HttpClient) {

  }//constructor

  checkFileExistByMd5(md5: string) {
    return this.httpClient.get<boolean>(`${this._URI}/Md5/${md5}`);
  }//checkFileExistByMd5
}

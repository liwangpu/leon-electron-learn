import { Injectable } from '@angular/core';
import { AppConfigService } from '@app/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import * as queryString from 'query-string';
import { Fileasset } from '../models/fileasset';
@Injectable()
export class FileassetService {

  private get _URI() {
    return `${this.configSrv.server}/oss/files`;
  }
  private get _header() {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }
  constructor(protected configSrv: AppConfigService, protected httpClient: HttpClient) {

  }//constructor


  query(queryParam: object) {
    let queryPart = queryString.stringify(queryParam);
    return this.httpClient.get<{ total: number, data: Fileasset[] }>(`${this._URI}?${queryPart}`);
  }//query

  getById(id: string) {
    return this.httpClient.get<Fileasset>(`${this._URI}/${id}`);
  }//get

  checkFileExistByMd5(md5: string) {
    return this.httpClient.get<{ exist: boolean }>(`${this._URI}/Md5/${md5}`);
  }//checkFileExistByMd5

  post(entity: Fileasset) {
    return this.httpClient.post<Fileasset>(this._URI, entity, { headers: this._header });
  }//post

  patch(entity: Fileasset) {
    let hdr = new HttpHeaders({
      'Content-Type': 'application/json-patch+json'
    });
    return this.httpClient.patch(`${this._URI}/${entity.id}`, Fileasset.GenPatchDoc(entity), { headers: hdr });
  }//patch


}

import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { AppConfigService } from '@app/core';
import { Map } from "../models/map";
@Injectable()
export class MapService {

  private get _URI() {
    return `${this.configSrv.server}/morejee/maps`;
  }
  private get _header() {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }
  constructor(protected configSrv: AppConfigService, protected httpClient: HttpClient) {

  }//constructor


  post(entity: Map) {
    return this.httpClient.post<Map>(this._URI, entity, { headers: this._header });
  }//post


}

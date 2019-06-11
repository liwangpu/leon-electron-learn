import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { AppConfigService } from '@app/core';
import { Material } from '../models/material';

@Injectable()
export class MaterialService {

  private get _URI() {
    return `${this.configSrv.server}/morejee/materials`;
  }
  private get _header() {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }
  constructor(protected configSrv: AppConfigService, protected httpClient: HttpClient) {

  }//constructor


  post(entity: Material) {
    return this.httpClient.post<Material>(this._URI, entity, { headers: this._header });
  }//post
}

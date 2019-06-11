import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { AppConfigService } from '@app/core';
import { StaticMesh } from '../models/static-mesh';

@Injectable()
export class StaticMeshService {

  private get _URI() {
    return `${this.configSrv.server}/morejee/staticMeshs`;
  }
  private get _header() {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }
  constructor(protected configSrv: AppConfigService, protected httpClient: HttpClient) {

  }//constructor


  post(entity: StaticMesh) {
    return this.httpClient.post<StaticMesh>(this._URI, entity, { headers: this._header });
  }//post
}

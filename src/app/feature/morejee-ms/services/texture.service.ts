import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { AppConfigService } from '@app/core';
import { Texture } from '../models/texture';

@Injectable()
export class TextureService {

  private get _URI() {
    return `${this.configSrv.server}/morejee/textures`;
  }
  private get _header() {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }
  constructor(protected configSrv: AppConfigService, protected httpClient: HttpClient) {

  }//constructor


  post(entity: Texture) {
    return this.httpClient.post<Texture>(this._URI, entity, { headers: this._header });
  }//post
}

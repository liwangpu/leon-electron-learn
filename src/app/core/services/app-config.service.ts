import { Injectable } from '@angular/core';
import { AppCacheService } from './app-cache.service';

@Injectable()
export class AppConfigService {

  get server() {
    return this.cacheSrv.server;
  }
  constructor(protected cacheSrv: AppCacheService) { }

}

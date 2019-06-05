import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AssetUploaderMd5CacheService {

  private _cache = {};
  constructor() { }

  cacheMd5(pck: string, md5: string) {
    this._cache[pck] = md5;
  }//cacheMd5

  getMd5Cache(pck: string) {
    return this._cache[pck];
  }//getMd5Cache

}

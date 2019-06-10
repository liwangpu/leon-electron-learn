import { Injectable } from '@angular/core';
import * as os from "os";
import * as path from "path";
import * as fsExtra from "fs-extra";

class MD5CacheDetail {
  md5: string;
  modifiedTime: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class AssetUploaderMd5CacheService {

  private _cacheFileName: string;
  private _cache: { [key: string]: MD5CacheDetail } = {};
  private _cacheLoad = false;
  private _cacheChange = false;
  constructor() {
    let tmpDir = os.tmpdir();
    this._cacheFileName = path.join(tmpDir, 'asset-upload-md5-cache.json');
    console.log('md5 cache file', this._cacheFileName);
  }//constructor

  loadCacheFile() {
    if (this._cacheLoad) return;
    fsExtra.readJSON(this._cacheFileName, { encoding: 'utf8' }, (err, obj) => {
      if (err) return;
      this._cacheLoad = true;
      // console.log('loadCacheFile cache:', obj); 
      if (obj)
        this._cache = obj;
    });
  }//loadCacheFile

  persistCache2File() {
    if (!this._cacheChange) return;
    fsExtra.writeJSON(this._cacheFileName, this._cache);
  }//persistCache2File

  cacheMd5(pck: string, md5: string, modifiedTime: number, size: number) {
    this._cache[pck] = {
      md5: md5,
      modifiedTime: modifiedTime,
      size: size
    };
    this._cacheChange = true;
  }//cacheMd5

  getMd5Cache(pck: string, modifiedTime: number, size: number) {
    let it = this._cache[pck];
    if (!it) return;
    if (it.modifiedTime != modifiedTime) return;
    if (it.size != size) return;
    return it.md5;
  }//getMd5Cache

}

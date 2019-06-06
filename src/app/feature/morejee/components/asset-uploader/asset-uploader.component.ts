import { Component, OnInit, OnDestroy } from '@angular/core';
import { ElectronDialogService, MessageCenterService, AppCacheService, FileHelper, AppConfigService } from '@app/core';
import * as path from "path";
import * as fs from 'fs';
import * as fsExtra from "fs-extra";
import * as  md5File from 'md5-file';
import { MatDialog } from '@angular/material/dialog';
import { SimpleMessageDialogComponent } from '../simple-message-dialog/simple-message-dialog.component';
import { FileassetService, SrcClientAssetService } from '@app/morejee-ms';
import { HttpClient } from '@angular/common/http';
import * as request from 'request';
import * as promiseLimit from 'promise-limit';
import { AssetUploaderMd5CacheService } from '../../services/asset-uploader-md5-cache.service';

class AssetList {
  dataMap: { [key: string]: DataMap };
  dependencies: { [key: string]: DataMap };
}

class DataMap {
  package: string;
  name: string;
  class: string;
  tags: object;
  localPath: string;
  dependencies: { [key: string]: AssetDependency };
  srcFile: AssetDependency;
  unCookedFile: AssetDependency;
  //客户端资源,是需要创建材质模型等对象的
  _clientAsset: boolean;
  _iconUrl: string;
  
  _sourceClientAssetUrl: string;
  _unCookedClientAssetUrl: string;
  _fileAssetId: string;
  _md5: string;
  _modifiedTime: number;
  _size: number;
}

class AssetDependency {
  package: string;
  name: string;
  class: string;
  level: number;
  localPath: string;
  fileAssetId: string;
  objId: string;
}

@Component({
  selector: 'morejee-asset-uploader',
  templateUrl: './asset-uploader.component.html',
  styleUrls: ['./asset-uploader.component.scss']
})
export class AssetUploaderComponent implements OnInit, OnDestroy {

  //UE4项目文件夹名称
  private _projectFolderName: string;
  //UE4项目文件夹路径
  _projectDir = "";
  _uploading = false;
  _uploadingProcessStep = 0;
  allAsset: { [key: string]: DataMap } = {};
  get allAssetCount() {
    return Object.keys(this.allAsset).length;
  }
  constructor(protected electDialogSrv: ElectronDialogService, protected messageSrv: MessageCenterService, protected dialogSrv: MatDialog, private assetSrv: FileassetService, protected cacheSrv: AppCacheService, protected configSrv: AppConfigService, protected assetMd5CacheSrv: AssetUploaderMd5CacheService, protected srcAssetSrv: SrcClientAssetService, protected httpClient: HttpClient) {

  }//constructor

  ngOnInit() {
    this.assetMd5CacheSrv.loadCacheFile();
  }//ngOnInit

  ngOnDestroy(): void {
    this.assetMd5CacheSrv.persistCache2File();



  }//ngOnDestroy

  toArrayBuffer(buf) {
    var ab = new ArrayBuffer(buf.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; ++i) {
      view[i] = buf[i];
    }
    return ab;
  }

  test() {
    // let filePath = 'C:\\Users\\Leon\\Desktop\\AssetMinimalTemplate\\Saved\\Cooked\\WindowsNoEditor\\AssetMinimalTemplate\\Content\\EHOME-MAT\\20181224\\DiffuseTextures\\1-faxintietu\\85-danyi-nom3.uasset';

    // md5File(filePath, (err, hash) => {
    //   if (err) throw err

    //   console.log(`The MD5 sum of LICENSE.md is: ${hash}`)
    // });

    // this.assetSrv.checkFileExistByMd5("03328fc6226b5ae926445a454618acbc1").subscribe(exist => {
    //   console.log(111, exist, typeof exist);
    // });


  }//test

  clearAssetList() {
    this._projectDir = "";
    this.allAsset = {};
    // this._allAssetDataMap = [];
  }//clearAssetList

  selectProjectDir() {
    let dirs = this.electDialogSrv.showOpenDialog({ properties: ['openDirectory'] });
    if (!dirs || dirs.length == 0) return;
    //分析项目文件夹名称和路径
    this._projectDir = dirs[0];
    let sdx = this._projectDir.lastIndexOf(path.sep);
    this._projectFolderName = this._projectDir.slice(sdx + 1, this._projectDir.length);

    // 校验配置文件是否存在
    let checkAssetListFile = (configPath: string) => {
      return new Promise((resolve, reject) => {
        fs.exists(configPath, exist => {
          if (exist) {
            resolve(configPath);
            return;
          }
          reject("message.cannotFindAssetListFile");
        });
      });
    };//checkAssetListFile

    //分析配置文件里面所包含的资源
    let analyzeAllAssetFromConfig = (configPath: string) => {
      return new Promise((resolve, reject) => {
        fsExtra.readJSON(configPath, { encoding: 'utf8' }, (err, assetList: AssetList) => {
          if (err) {
            reject(err.message);
            return;
          }

          if (assetList.dataMap) {
            for (let k in assetList.dataMap) {
              let it = assetList.dataMap[k];
              it._clientAsset = true;
              this.allAsset[it.package] = it;
            }
          }//if

          if (assetList.dependencies) {
            for (let k in assetList.dependencies) {
              let it = assetList.dependencies[k];
              this.allAsset[it.package] = it;
            }
          }//if
          resolve();
        });
      });
    };//analyzeAllAssetFromConfig

    checkAssetListFile(path.join(this._projectDir, "Saved", "AssetMan", "assetlist.txt")).then(analyzeAllAssetFromConfig).then(() => {
      // console.log('res', this.allAsset);
    });
  }//selectProjectDir

  upload() {
    this._uploading = true;

    let allPackageNames = Object.keys(this.allAsset);

    //修正资源localPath可能出现的路径异常
    let fixLocalPathError = () => {
      allPackageNames.forEach(pck => {
        let it = this.allAsset[pck];
        //修正依赖文件
        let idx = it.localPath.indexOf(this._projectFolderName);
        let tplocalStr = it.localPath.slice(idx + this._projectFolderName.length, it.localPath.length);
        //不知道ue4那边对文件路径分隔符是什么,都尝试一下
        let sep = '/';
        if (tplocalStr.indexOf(sep) == -1)
          sep = "\\";
        let tarr = tplocalStr.split(sep);
        let prjName = tarr.join(path.sep);
        it.localPath = this._projectDir + prjName;
        //修正source文件
        if (it.srcFile && it.srcFile.localPath) {
          idx = it.srcFile.localPath.indexOf(this._projectFolderName);
          tplocalStr = it.srcFile.localPath.slice(idx + this._projectFolderName.length, it.srcFile.localPath.length);
          tarr = tplocalStr.split(sep);
          prjName = tarr.join(path.sep);
          it.srcFile.localPath = this._projectDir + prjName;
        }
        //修正unCooked文件
        if (it.unCookedFile && it.unCookedFile.localPath) {
          idx = it.unCookedFile.localPath.indexOf(this._projectFolderName);
          tplocalStr = it.unCookedFile.localPath.slice(idx + this._projectFolderName.length, it.unCookedFile.localPath.length);
          tarr = tplocalStr.split(sep);
          prjName = tarr.join(path.sep);
          it.unCookedFile.localPath = this._projectDir + prjName;
        }
      });
      return Promise.resolve();
    };//fixLocalPathError

    //检测文件修改时间信息,用来校验md5,不能只根据package记录md5,还应该加上修改时间
    let checkAssetStat = () => {
      this._uploadingProcessStep = 1;
      let limit = promiseLimit(20);
      let checkStat = (it: DataMap) => {
        return new Promise((resolve, reject) => {
          if (it._modifiedTime) {
            resolve();
            return;
          }

          fs.stat(it.localPath, (err, stat) => {
            if (err) {
              reject(err.message);
              return;
            }
            it._modifiedTime = stat.mtime.getTime();
            it._size = stat.size;
            resolve();
          });//stat
        });
      };//checkStat
      return Promise.all(allPackageNames.map(pck => {
        let it = this.allAsset[pck];
        return limit(() => checkStat(it));
      }));
    };//checkAssetStat

    //计算文件的md5信息
    let calcFileMD5 = () => {
      this._uploadingProcessStep = 2;
      let limit = promiseLimit(10);
      let calcMD5 = (it: DataMap) => {
        return new Promise((resolve, reject) => {
          if (it._md5) {
            resolve();
            return;
          }

          let _md5 = this.assetMd5CacheSrv.getMd5Cache(it.package, it._modifiedTime, it._size);
          // console.log(111, _md5);
          if (!_md5) {
            md5File(it.localPath, (err, hash) => {
              if (err) {
                reject(err.message);
                return;
              }
              it._md5 = hash;
              this.assetMd5CacheSrv.cacheMd5(it.package, hash, it._modifiedTime, it._size);
              resolve();
              return;
            });
          }
          else {
            it._md5 = _md5;
            resolve();
          }
        });
      };//calcMD5
      return Promise.all(allPackageNames.map(pck => {
        let it = this.allAsset[pck];
        return limit(() => calcMD5(it));
      }));
    };//calcFileMD5

    //计算source文件的md5信息
    let calcSourceFileMD5=()=>{

    };//calcSourceFileMD5

    //上传资源文件
    let uploadSingleFiles = () => {
      this._uploadingProcessStep = 3;
      let limit = promiseLimit(20);
      let uploadFile = (it: DataMap) => {
        return new Promise((resolve, reject) => {
          this.assetSrv.checkFileExistByMd5(it._md5).subscribe(exist => {
            if (exist) {
              resolve();
              return;
            }

            //上传文件
            let uploadReq = request.post(`${this.configSrv.server}/oss/files/stream`, { auth: { bearer: this.cacheSrv.token }, headers: { fileExt: FileHelper.getFileExt(it.localPath), timeout: 600000 } }, (err, re, body) => {
              if (err) {
                reject(err.message);
                return;
              }
              // console.log(111, err, re);  
              resolve();
            });
            fs.createReadStream(it.localPath).pipe(uploadReq);
            console.log('not exist', it);
          }, err => {
            reject("服务器无法连接");
          });//subscribe
        });//
      };//uploadFile
      return Promise.all(allPackageNames.map(pck => {
        let it = this.allAsset[pck];
        return limit(() => uploadFile(it));
      }));
    };//uploadSingleFiles

    //上传图标
    let uploadIconFiles = () => {
      this._uploadingProcessStep = 4;
      let limit = promiseLimit(20);
      let uploadIcon = (it: DataMap) => {
        return new Promise((resolve, reject) => {
          //非对象资源
          if (!it._clientAsset) {
            resolve();
            return;
          }//if
          //不含图标信息
          let allDeps = Object.keys(it.dependencies);
          if (allDeps.every(pck => pck.indexOf("UploadIcons") == -1)) {
            resolve();
            return;
          }//if
          //
          let pck = allDeps.filter(pck => pck.indexOf("UploadIcons") > -1)[0];
          let iconAsset = it.dependencies[pck];
          let idx = iconAsset.localPath.indexOf(this._projectFolderName);
          let tplocalStr = iconAsset.localPath.slice(idx + this._projectFolderName.length, iconAsset.localPath.length);
          //不知道ue4那边对文件路径分隔符是什么,都尝试一下
          let sep = '/';
          if (tplocalStr.indexOf(sep) == -1)
            sep = "\\";
          let tarr = tplocalStr.split(sep);
          let prjName = tarr.join(path.sep);
          let iconPath = this._projectDir + prjName;
          //校验一下文件是否真实存在
          fs.exists(iconPath, exist => {
            if (!exist) {
              resolve();
              return;
            }

            let uploadReq = request.post(`${this.configSrv.server}/oss/icons/stream`, { auth: { bearer: this.cacheSrv.token }, headers: { fileExt: FileHelper.getFileExt(iconPath), timeout: 600000 } }, (err, re, body) => {
              if (err) {
                resolve();
                console.error('upload icon error:', err);
                return;
              }
              it._iconUrl = body;
              resolve();
            });
            fs.createReadStream(iconPath).pipe(uploadReq);
          });//exists

        });
      };//uploadIcon
      return Promise.all(allPackageNames.map(pck => {
        let it = this.allAsset[pck];
        return limit(() => uploadIcon(it));
      }));
    };//uploadIconFiles

    //上传Source原文件
    let uploadSourceClientAssets = () => {
      this._uploadingProcessStep = 5;
      let limit = promiseLimit(20);
      let uploadSource = (it: DataMap) => {
        return new Promise((resolve, rejcet) => {

          if (!it.srcFile || !it.srcFile.localPath) {
            resolve();
            return;
          }//if

          //校验一下文件是否真实存在
          fs.exists(it.srcFile.localPath, exist => {
            if (!exist) {
              resolve();
              return;
            }


            // this.srcAssetSrv.checkFileExistByMd5();


            let uploadReq = request.post(`${this.configSrv.server}/oss/srcClientAssets/stream`, { auth: { bearer: this.cacheSrv.token }, headers: { fileExt: FileHelper.getFileExt(it.srcFile.localPath), timeout: 600000 } }, (err, re, body) => {
              if (err) {
                resolve();
                console.error('upload source asset error:', err);
                return;
              }
              it._sourceClientAssetUrl = body;
              resolve();
            });
            fs.createReadStream(it.srcFile.localPath).pipe(uploadReq);
          });//exists
        });
      };//uploadSource
      return Promise.all(allPackageNames.map(pck => {
        let it = this.allAsset[pck];
        return limit(() => uploadSource(it));
      }));
    }//uploadSourceClientAssets

    //上传UnCooked原文件
    let uploadUnCookedClientAssets = () => {
      this._uploadingProcessStep = 6;
      let limit = promiseLimit(20);
      let uploadUnCooked = (it: DataMap) => {
        return new Promise((resolve, reject) => {
          if (!it.unCookedFile || !it.unCookedFile.localPath) {
            resolve();
            return;
          }//if

          //校验一下文件是否真实存在
          fs.exists(it.unCookedFile.localPath, exist => {
            if (!exist) {
              resolve();
              return;
            }

            let uploadReq = request.post(`${this.configSrv.server}/oss/srcClientAssets/stream`, { auth: { bearer: this.cacheSrv.token }, headers: { fileExt: FileHelper.getFileExt(it.unCookedFile.localPath), timeout: 600000 } }, (err, re, body) => {
              if (err) {
                resolve();
                console.error('upload source asset error:', err);
                return;
              }
              it._unCookedClientAssetUrl = body;
              resolve();
            });
            fs.createReadStream(it.unCookedFile.localPath).pipe(uploadReq);
          });//exists

        });
      };//uploadUnCooked
      return Promise.all(allPackageNames.map(pck => {
        let it = this.allAsset[pck];
        return limit(() => uploadUnCooked(it));
      }));
    };//uploadUnCookedClientAssets

    fixLocalPathError().then(checkAssetStat).then(calcFileMD5).then(() => {
      this._uploading = false;
      this.assetMd5CacheSrv.persistCache2File();
      // console.log(this.allAsset);
      let cc = allPackageNames.map(pck => this.allAsset[pck].srcFile.localPath).filter(url => url);
      console.log('cc', cc);
    }, err => {
      console.error('some err:', err);
      this._uploading = false;
    });//then

    // fixLocalPathError().then(checkAssetStat).then(calcFileMD5).then(uploadIconFiles).then(uploadSourceClientAssets).then(uploadUnCookedClientAssets).then(() => {
    //   this._uploading = false;
    //   this.assetMd5CacheSrv.persistCache2File();
    //   // console.log();
    //   let cc = allPackageNames.map(pck => this.allAsset[pck]._sourceClientAssetUrl).filter(url => url);
    //   console.log('cc', cc);
    // }, err => {
    //   console.error('some err:', err);
    //   this._uploading = false;
    // });//then


    // fixLocalPathError().then(checkAssetStat).then(calcFileMD5).then(uploadSingleFiles).then(() => {
    //   this._uploading = false;
    //   this.assetMd5CacheSrv.persistCache2File();
    // }, err => {
    //   console.error('some err:', err);
    //   this._uploading = false;
    // });//then

  }//upload


  confirmLeaveUploader() {
    this.dialogSrv.open(SimpleMessageDialogComponent, { width: '300px', height: '250px', data: { message: 'message.waitTilFinishUploadingBeforeLeaving' } });
  }//confirmLeaveUploader

}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ElectronDialogService, MessageCenterService, AppCacheService, FileHelper, AppConfigService } from '@app/core';
import * as path from "path";
import * as fs from 'fs';
import * as fsExtra from "fs-extra";
// import * as MD5 from "MD5";
import * as  md5File from 'md5-file';
import { MatDialog } from '@angular/material/dialog';
import { SimpleMessageDialogComponent } from '../simple-message-dialog/simple-message-dialog.component';
import { FileassetService } from '@app/morejee-ms';
import { HttpClient } from '@angular/common/http';
import * as request from 'request';
import * as promiseLimit from 'promise-limit';
import { AssetUploaderMd5CacheService } from '../../services/asset-uploader-md5-cache.service';
// import { SimpleConfirmDialogComponent } from '@app/shared';
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
  //客户端资源,是需要创建材质模型等对象的
  _clientAsset: boolean;
  _fileAssetId: string;
  _md5: string;
  _modifiedTime: number;
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
  // _allAssetDataMap: DataMap[] = [];
  // _uploadSubscription: Subscription;
  allAsset: { [key: string]: DataMap } = {};
  constructor(protected electDialogSrv: ElectronDialogService, protected messageSrv: MessageCenterService, protected dialogSrv: MatDialog, private assetSrv: FileassetService, protected cacheSrv: AppCacheService, protected configSrv: AppConfigService, protected assetMd5CacheSrv: AssetUploaderMd5CacheService, protected httpClient: HttpClient) {

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
    let filePath = 'C:\\Users\\Leon\\Desktop\\AssetMinimalTemplate\\Saved\\Cooked\\WindowsNoEditor\\AssetMinimalTemplate\\Content\\EHOME-MAT\\20181224\\DiffuseTextures\\1-faxintietu\\85-danyi-nom3.uasset';

    md5File(filePath, (err, hash) => {
      if (err) throw err

      console.log(`The MD5 sum of LICENSE.md is: ${hash}`)
    });

    // fs.readFile(filePath, (err, buff) => {
    //   if (err) {
    //     console.error(err);
    //     return;
    //   } 
    //   console.log('md5', MD5(buff));
    // });
    // // let rerr = request.post("http://192.168.99.100:9503/oss/files/stream", { auth: { bearer: this.cacheSrv.token }, headers: { fileExt: FileHelper.getFileExt(filePath) } }, (err, res, body) => {
    // //   console.log(111, err, res, body);
    // // });
    // // fs.createReadStream(filePath).pipe(rerr);


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



    // console.log(1111, allPackageNames.length);
    //修正资源localPath可能出现的路径异常
    let fixLocalPathError = () => {
      allPackageNames.forEach(pck => {
        let it = this.allAsset[pck];
        let idx = it.localPath.indexOf(this._projectFolderName);
        let tplocalStr = it.localPath.slice(idx + this._projectFolderName.length, it.localPath.length);
        //不知道ue4那边对文件路径分隔符是什么,都尝试一下
        let sep = '/';
        if (tplocalStr.indexOf(sep) == -1)
          sep = "\\";
        let tarr = tplocalStr.split(sep);
        let prjName = tarr.join(path.sep);
        it.localPath = this._projectDir + prjName;
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

          let _md5 = this.assetMd5CacheSrv.getMd5Cache(it.package, it._modifiedTime);
          // console.log(111, _md5);
          if (!_md5) {
            md5File(it.localPath, (err, hash) => {
              if (err) {
                reject(err.message);
                return;
              }
              it._md5 = hash;
              this.assetMd5CacheSrv.cacheMd5(it.package, hash, it._modifiedTime);
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

    //上传资源文件
    let uploadSingleFiles = () => {
      this._uploadingProcessStep = 3;
      let limit = promiseLimit(20);
      let uploadFile = (it: DataMap) => {
        return new Promise((resolve, reject) => {
          this.assetSrv.checkFileExistByMd5(it._md5).subscribe(rs => {
            if (rs.exist) {
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
            console.log('not exist',it);
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

    // fixLocalPathError().then(checkAssetStat).then(calcFileMD5).then(() => {
    //   console.log('finished!', this.allAsset);
    //   this._uploading = false;
    //   this.assetMd5CacheSrv.persistCache2File();
    // }, err => {
    //   console.error('some err:', err);
    //   this._uploading = false;
    // });

    fixLocalPathError().then(checkAssetStat).then(calcFileMD5).then(uploadSingleFiles).then(() => {
      console.log('finished!', this.allAsset);
      this._uploading = false;
      this.assetMd5CacheSrv.persistCache2File();
    }, err => {
      console.error('some err:', err);
      this._uploading = false;
    });
  }//upload


  confirmLeaveUploader() {
    this.dialogSrv.open(SimpleMessageDialogComponent, { width: '300px', height: '250px', data: { message: 'message.waitTilFinishUploadingBeforeLeaving' } });
  }//confirmLeaveUploader

}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ElectronDialogService, MessageCenterService, AppCacheService, FileHelper, AppConfigService } from '@app/core';
import * as path from "path";
import * as fs from 'fs';
import * as fsExtra from "fs-extra";
import * as md5File from "md5-file";
import { MatDialog } from '@angular/material/dialog';
import { SimpleMessageDialogComponent } from '../simple-message-dialog/simple-message-dialog.component';
import { Subscription } from 'rxjs';
import { FileassetService } from '@app/morejee-ms';
import { HttpClient } from '@angular/common/http';
import * as request from 'request';
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
  _fileAssetId: string;
  _md5: string;
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

  private _projectFolderName: string;
  _uploading = false;
  _uploadingProcessStep = 0;
  _projectDir = "";
  _allAssetDataMap: DataMap[] = [];
  _uploadSubscription: Subscription;
  constructor(protected electDialogSrv: ElectronDialogService, protected messageSrv: MessageCenterService, protected dialogSrv: MatDialog, private assetSrv: FileassetService, protected cacheSrv: AppCacheService, protected configSrv: AppConfigService, protected httpClient: HttpClient) {

  }//constructor

  ngOnInit() {

  }//ngOnInit

  ngOnDestroy(): void {
    if (this._uploadSubscription) {
      this._uploadSubscription.unsubscribe();
    }
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
    // let filePath = 'C:\\Users\\Leon\\Desktop\\400x300.png';

    // let rerr = request.post("http://192.168.99.100:9503/oss/files/stream", { auth: { bearer: this.cacheSrv.token }, headers: { fileExt: FileHelper.getFileExt(filePath) } }, (err, res, body) => {
    //   console.log(111, err, res, body);
    // });
    // fs.createReadStream(filePath).pipe(rerr);


  }//test

  clearAssetList() {
    this._projectDir = "";
    this._allAssetDataMap = [];
  }//clearAssetList

  selectProjectDir() {

    let dirs = this.electDialogSrv.showOpenDialog({ properties: ['openDirectory'] });
    if (!dirs || dirs.length == 0) return;
    this._projectDir = dirs[0];
    let sdx = this._projectDir.lastIndexOf(path.sep);
    this._projectFolderName = this._projectDir.slice(sdx + 1, this._projectDir.length);

    let checkAssetListFile = (configPath: string) => {
      return new Promise((res, rej) => {
        fs.exists(configPath, exist => {
          if (!exist) {
            rej("message.cannotFindAssetListFile");
          }
          else
            res(configPath);
        });//exists
      });//Promise
    };//checkAssetListFile

    let analyzeAllAssetFromConfig = (configPath: string) => {
      return new Promise((res, rej) => {
        fsExtra.readJSON(configPath, { encoding: 'utf8' }, (err, assetList: AssetList) => {
          if (err) {
            rej(err);
            return;
          }

          if (assetList.dataMap) {
            for (let k in assetList.dataMap) {
              let it = assetList.dataMap[k];
              this._allAssetDataMap.push(it);
            }
          }//if
          if (assetList.dependencies) {
            for (let k in assetList.dependencies) {
              let it = assetList.dependencies[k];
              this._allAssetDataMap.push(it);
            }
          }//if
          res();
          // console.log(111, this._allAssetDataMap[1]);
        });//readJSON
      });//Promise
    };//analyzeAllAssetFromConfig


    // console.log('assetListPath', assetListPath);

    checkAssetListFile(path.join(this._projectDir, "Saved", "AssetMan", "assetlist.txt")).then(analyzeAllAssetFromConfig).then(() => {
      console.log('res');

    });
  }//selectProjectDir

  upload() {
    this._uploading = true;


    let checkFilePathAndCalcFilesMd5 = () => {
      this._uploadingProcessStep = 1;
      for (let i = this._allAssetDataMap.length - 1; i >= 0; i--) {
        let it = this._allAssetDataMap[i];
        if (!it.localPath) continue;
        if (it._md5) continue;
        //找到真实的文件路径
        let idx = it.localPath.indexOf(this._projectFolderName);
        let tplocalStr = it.localPath.slice(idx + this._projectFolderName.length, it.localPath.length);
        //不知道ue4那边对文件路径分隔符是什么,都尝试一下
        let sep = '/';
        if (tplocalStr.indexOf(sep) == -1)
          sep = "\\";
        let tarr = tplocalStr.split(sep);
        let prjName = tarr.join(path.sep);
        it.localPath = this._projectDir + prjName;
      }//for


      return Promise.all(this._allAssetDataMap.map(it => {
        return new Promise((res, rej) => {
          md5File(it.localPath, (err, hash) => {
            if (err) {
              rej(err);
              return;
            }
            for (let i = this._allAssetDataMap.length - 1; i >= 0; i--) {
              let file = this._allAssetDataMap[i];
              file._md5 = hash;
            }
            res();
          });
        });//Promise
      })).then(() => {
        return Promise.resolve();
      });//all
    };//calcFileMd5

    let uploadSingleFiles = () => {
      this._uploadingProcessStep = 2;
      return Promise.all(this._allAssetDataMap.splice(0, 1).map(it => {
        return new Promise((res, rej) => {
          // let exitAsset = this.assetSrv.getById(it._md5);
          // this.assetSrv.getById(it._md5).subscribe(rs=>{
          //   console.log('uploadSingleFiles',rs);
          // }); 

          let uploadReq = request.post(`${this.configSrv.server}/oss/files/stream`, { auth: { bearer: this.cacheSrv.token }, headers: { fileExt: FileHelper.getFileExt(it.localPath) } }, (err, re, body) => {
            console.log(111, err, re, body,it);
            res();
          });
          fs.createReadStream(it.localPath).pipe(uploadReq);


          // this.assetSrv.checkFileExistByMd5(it._md5).subscribe(rs => {
          //   console.log('check', rs);
          // });
        });//Promise
      })).then(() => {
        return Promise.resolve();
      });//all
    };//uploadSingleFiles

    checkFilePathAndCalcFilesMd5().then(uploadSingleFiles).then(() => {
      console.log('上传完毕');
    });

  }//upload

  // cancelUpload() {
  //   this._uploading = false;
  //   this.dialogSrv.open(SimpleConfirmDialogComponent, { width: '300px', height: '250px', data: { message: 'message.cancelThenDeleteAllAssetList' } });
  // }//cancelUpload

  // analyzeAssetFromConfig(assetListPath: string) {
  //   fsExtra.readJSON(assetListPath, { encoding: 'utf8' }, (err, assetList: AssetList) => {
  //     if (err) {
  //       console.error(err);
  //       return;
  //     }

  //     // this._allAssetDataMap.push();
  //     if (assetList.dataMap) {
  //       for (let k in assetList.dataMap) {
  //         let it = assetList.dataMap[k];
  //         this._allAssetDataMap.push(it);
  //       }
  //     }//if
  //     if (assetList.dependencies) {
  //       for (let k in assetList.dependencies) {
  //         let it = assetList.dataMap[k];
  //         this._allAssetDataMap.push(it);
  //       }
  //     }//if

  //     // console.log(111, this._allAssetDataMap[1]);
  //   });//readJSON

  // }//analyzeAssetFromConfig

  confirmLeaveUploader() {
    this.dialogSrv.open(SimpleMessageDialogComponent, { width: '300px', height: '250px', data: { message: 'message.waitTilFinishUploadingBeforeLeaving' } });
  }//confirmLeaveUploader

  identify(index: number, item: DataMap) {
    return item.package;
  }//identify
}

import { Component, OnInit } from '@angular/core';
import { ElectronDialogService, MessageCenterService } from '@app/core';
import * as path from "path";
import * as fs from 'fs';
import * as fsExtra from "fs-extra";
import * as md5File from "md5-file";
import { MatDialog } from '@angular/material/dialog';
import { SimpleConfirmDialogComponent } from '../simple-confirm-dialog/simple-confirm-dialog.component';
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
export class AssetUploaderComponent implements OnInit {

  _uploading = false;
  _projectDir = "";
  _allAssetDataMap: DataMap[] = [];
  constructor(protected electDialogSrv: ElectronDialogService, protected messageSrv: MessageCenterService, protected dialogSrv: MatDialog) {

  }//constructor

  ngOnInit() {
    // for (let idx = 1; idx <= 100; idx++) {
    //   let it = new DataMap();
    //   it.package = `Package ${idx}`;
    //   it.name = `Name ${idx}`;
    //   this._allAssetDataMap.push(it);
    // }
  }//ngOnInit

  test() {
    console.log('点我干嘛', new Date());
  }

  clearAssetList() {
    this._projectDir = "";
    this._allAssetDataMap = [];
  }//clearAssetList

  selectProjectDir() {
    // this.messageSrv.message("message.cannotFindAssetListFile",true);

    let dirs = this.electDialogSrv.showOpenDialog({ properties: ['openDirectory'] });
    if (!dirs || dirs.length == 0) return;
    this._projectDir = dirs[0];
    let sdx = this._projectDir.lastIndexOf(path.sep);
    let projectFolderName = this._projectDir.slice(sdx + 1, this._projectDir.length);

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

    let checkFilePathAndCalcFilesMd5 = () => {
      for (let i = this._allAssetDataMap.length - 1; i >= 0; i--) {
        let it = this._allAssetDataMap[i];
        if (!it.localPath) continue;
        //找到真实的文件路径
        let idx = it.localPath.indexOf(projectFolderName);
        let tplocalStr = it.localPath.slice(idx + projectFolderName.length, it.localPath.length);
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

      // console.log(11111, allFiles[2]);
      // md5File(it.localPath, (err, hash) => {
      //   console.log('md5', err, hash);
      // });
    };//calcFileMd5
    // console.log('assetListPath', assetListPath);

    checkAssetListFile(path.join(this._projectDir, "Saved", "AssetMan", "assetlist.txt")).then(analyzeAllAssetFromConfig).then((res) => {
      console.log('res', res);

    });
  }//selectProjectDir

  upload() {
    this._uploading = true;
  }//upload

  cancelUpload() {
    this._uploading = false;
    this.dialogSrv.open(SimpleConfirmDialogComponent, { width: '300px', height: '250px', data: { message: 'message.cancelThenDeleteAllAssetList' } });
  }//cancelUpload

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
    alert('你要干嘛');
  }//confirmLeaveUploader

  identify(index: number, item: DataMap) {
    return item.package;
  }//identify
}

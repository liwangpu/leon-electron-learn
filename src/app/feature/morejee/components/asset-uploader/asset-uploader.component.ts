import { Component, OnInit } from '@angular/core';
import { ElectronDialogService, MessageCenterService } from '@app/core';
import * as path from "path";
import * as fs from 'fs';
import * as fsExtra from "fs-extra";
import * as md5File from "md5-file";
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

  _projectDir = "";
  // _allAssetDataMap: DataMap[] = [];
  constructor(protected electDialogSrv: ElectronDialogService, protected messageSrv: MessageCenterService) {

  }//constructor

  ngOnInit() {

  }//ngOnInit

  test() {
    console.log('点我干嘛', new Date());
  }
  selectProjectDir() {
    // this.messageSrv.message("message.cannotFindAssetListFile",true);

    let dirs = this.electDialogSrv.showOpenDialog({ properties: ['openDirectory'] });
    if (!dirs || dirs.length == 0) return;
    this._projectDir = dirs[0];
    // console.log(1, this._projectDir);
    // let projectFolderName=
    let sdx = this._projectDir.lastIndexOf(path.sep);
    let projectFolderName = this._projectDir.slice(sdx + 1, this._projectDir.length);
    // console.log('a', projectFolderName);

    let assetListPath = path.join(this._projectDir, "Saved", "AssetMan", "assetlist.txt");
    // fs.exists(assetListPath, exist => {
    //   if (!exist) {
    //     this.messageSrv.message("message.cannotFindAssetListFile");
    //     return;
    //   };
    //   this.analyzeAssetFromConfig(assetListPath);
    // });

    let checkAssetListFile = () => {
      return new Promise((res, rej) => {
        fs.exists(assetListPath, exist => {
          if (!exist) {
            rej("message.cannotFindAssetListFile");
          }
          else
            res(assetListPath);
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

          let allAssetDataMap = [];
          if (assetList.dataMap) {
            for (let k in assetList.dataMap) {
              let it = assetList.dataMap[k];
              allAssetDataMap.push(it);
            }
          }//if
          if (assetList.dependencies) {
            for (let k in assetList.dependencies) {
              let it = assetList.dependencies[k];
              allAssetDataMap.push(it);
            }
          }//if
          res(allAssetDataMap);
          // console.log(111, this._allAssetDataMap[1]);
        });//readJSON
      });//Promise
    };//analyzeAllAssetFromConfig

    let calcFilesMd5 = (allFiles: DataMap[]) => {
      // console.log(564, allFiles);

      for (let i = allFiles.length - 1; i >= 0; i--) {
        let it = allFiles[i];
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


      console.log(564, allFiles);
      // Promise.all(allFiles.map(it => {
      //   return new Promise((innerRes, innerRej) => {
      //     md5File(it.localPath, (err, hash) => {
      //       if (err) {
      //         innerRej(err);
      //         return;
      //       }

      //       console.log('md5', err, hash);
      //     });
      //   });
      // }));

      // console.log(11111, allFiles[2]);
      // md5File(it.localPath, (err, hash) => {
      //   console.log('md5', err, hash);
      // });
    };//calcFileMd5
    // console.log('assetListPath', assetListPath);

    checkAssetListFile().then(analyzeAllAssetFromConfig).then(calcFilesMd5).then((res) => {
      // console.log('res', res);
    });
  }//selectProjectDir

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


}

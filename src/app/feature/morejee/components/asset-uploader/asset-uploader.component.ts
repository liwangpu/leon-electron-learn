import { Component, OnInit } from '@angular/core';
import { ElectronDialogService, MessageCenterService } from '@app/core';
import * as path from "path";
import * as fs from 'fs';
import * as fsExtra from "fs-extra";

class AssetList {
  dataMap: { [key: string]: DataMap };
  dependencies: { [key: string]: DataMap };
}

class DataMap {
  package: string;
  name: string;
  class: string;
  tags: object;
  dependencies: { [key: string]: AssetDependency };
  _fileAssetId: string;
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
              let it = assetList.dataMap[k];
              allAssetDataMap.push(it);
            }
          }//if
          res(allAssetDataMap);
          // console.log(111, this._allAssetDataMap[1]);
        });//readJSON
      });//Promise
    };//analyzeAllAssetFromConfig

    let calcFilesMd5 = (allFiles: DataMap[]) => {
      return new Promise((res, rej) => {
        console.log(564, allFiles);
      });//Promise
    };//calcFileMd5
    // console.log('assetListPath', assetListPath);

    checkAssetListFile().then(analyzeAllAssetFromConfig).then(calcFilesMd5).then((res) => {
      // console.log('res', res);
    })
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

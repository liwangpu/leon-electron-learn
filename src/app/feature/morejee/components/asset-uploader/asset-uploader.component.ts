import { Component, OnInit, OnDestroy } from '@angular/core';
import { ElectronDialogService, MessageCenterService, AppCacheService, FileHelper, AppConfigService } from '@app/core';
import * as path from "path";
import * as fs from 'fs';
import * as fsExtra from "fs-extra";
import * as  md5File from 'md5-file';
import { MatDialog } from '@angular/material/dialog';
import { SimpleMessageDialogComponent } from '../simple-message-dialog/simple-message-dialog.component';
import { FileassetService, SrcClientAssetService, MapService, Map, TextureService, Texture, MaterialService, Material, StaticMeshService, StaticMesh } from '@app/morejee-ms';
import * as request from 'request';
import * as promiseLimit from 'promise-limit';
import { AssetUploaderMd5CacheService } from '../../services/asset-uploader-md5-cache.service';


class AssetItem {
  package: string;
  name: string;
  class: string;
  property: string;
  dependencies: string[];
  iconFile: string;
  srcFile: string;
  unCookedFile: string;
  win64CookedFile: string;
  androidCookedFile: string;
  iosCookedFile: string;

  static getIconFile(it: AssetItem): SingleFile {
    if (!it.iconFile) return null;
    let f = new SingleFile();
    f.package = it.package;
    f.localPath = it.iconFile;
    return f;
  }//getIconFile

  static getSourceFile(it: AssetItem): SingleFile {
    if (!it.srcFile) return null;
    let f = new SingleFile();
    f.package = it.package;
    f.localPath = it.srcFile;
    return f;
  }//getSourceFile

  static getUnCookedFile(it: AssetItem): SingleFile {
    if (!it.unCookedFile) return null;
    let f = new SingleFile();
    f.package = it.package;
    f.localPath = it.unCookedFile;
    return f;
  }//getUnCookedFile

  static getWin64CookedFile(it: AssetItem): SingleFile {
    if (!it.win64CookedFile) return null;
    let f = new SingleFile();
    f.package = it.package;
    f.localPath = it.win64CookedFile;
    return f;
  }//getWin64CookedFile

  static getAndroidCookedFile(it: AssetItem): SingleFile {
    if (!it.androidCookedFile) return null;
    let f = new SingleFile();
    f.package = it.package;
    f.localPath = it.androidCookedFile;
    return f;
  }//getAndroidCookedFile

  static getIOSCookedFile(it: AssetItem): SingleFile {
    if (!it.iosCookedFile) return null;
    let f = new SingleFile();
    f.package = it.package;
    f.localPath = it.iosCookedFile;
    return f;
  }//getIOSCookedFile
}

class ClientAssetObject {
  name: string;
  icon: string;
}

class SingleFile {
  _md5: string;
  _url: string;
  _size: number;
  _modifiedTime: number;
  _notExist: boolean;
  package: string;
  fileType: FileType;
  localPath: string;
}

enum FileType {
  Icon,
  Source,
  UCooked,
  Cooked
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
  _analyzeFileStructureProcess = false;
  _uploadingProcess = false;
  _uploadingProcessStep = 0;












  constructor(protected electDialogSrv: ElectronDialogService, protected messageSrv: MessageCenterService, protected dialogSrv: MatDialog, private assetSrv: FileassetService, protected cacheSrv: AppCacheService, protected configSrv: AppConfigService, protected assetMd5CacheSrv: AssetUploaderMd5CacheService, protected srcAssetSrv: SrcClientAssetService, protected mapSrv: MapService, protected textureSrv: TextureService, protected materialSrv: MaterialService, protected meshSrv: StaticMeshService) {

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

  clearAssetList() {
    this._projectDir = "";
    // this.allAsset = {};
  }//clearAssetList

  selectProjectDir() {
    let dirs = this.electDialogSrv.showOpenDialog({ properties: ['openDirectory'] });
    if (!dirs || dirs.length == 0) return;
    //分析项目文件夹名称和路径
    this._projectDir = dirs[0];
    let sdx = this._projectDir.lastIndexOf(path.sep);
    this._projectFolderName = this._projectDir.slice(sdx + 1, this._projectDir.length);

    /*
    * 在项目文件夹有个json的配置文件projectname/Saved/AssetMan/assetlist.json
    * 记录着需要上传的资源信息
    */

    //配置文件路径
    let configPath = path.join(this._projectDir, "Saved", "AssetMan", "assetlist.json");

    //校验配置文件是否存在
    let checkAssetListFile = (configPath: string) => {
      this._analyzeFileStructureProcess = true;
      return new Promise((resolve, reject) => {
        fs.exists(configPath, exist => {
          if (!exist) return reject("message.cannotFindAssetListFile");
          resolve(configPath);
        });
      });
    };//checkAssetListFile

    //解析配置文件下的资源信息
    let analyzeAssetFromConfig = (cfgPath: string) => {
      return new Promise((resolve, reject) => {
        fsExtra.readJSON(configPath, { encoding: 'utf8' }, (err, assetList: AssetItem[]) => {
          if (err) return reject(`assetlist.json JSON解析异常:${err}`);

          for (let it of assetList) {
            console.log(1, it);










          }//for


          resolve();
        });//readJSON
      });
    }//analyzeAssetFromConfig

    checkAssetListFile(configPath).then(analyzeAssetFromConfig).then(() => {
      console.log('successful,');
      this._analyzeFileStructureProcess = false;
    }, err => {
      console.log('err:', err);
      this.messageSrv.message(err, true);
      this._analyzeFileStructureProcess = false;
    })
  }//selectProjectDir






  upload() {


  }//upload


  confirmLeaveUploader() {
    this.dialogSrv.open(SimpleMessageDialogComponent, { width: '300px', height: '250px', data: { message: 'message.waitTilFinishUploadingBeforeLeaving' } });
  }//confirmLeaveUploader

}

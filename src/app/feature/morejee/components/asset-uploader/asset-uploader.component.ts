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
    f.fileType = FileType.Icon;
    f.package = it.package;
    f.localPath = it.iconFile;
    return f;
  }//getIconFile

  static getSourceFile(it: AssetItem): SingleFile {
    if (!it.srcFile) return null;
    let f = new SingleFile();
    f.fileType = FileType.Source;
    f.package = it.package;
    f.localPath = it.srcFile;
    return f;
  }//getSourceFile

  static getUnCookedFile(it: AssetItem): SingleFile {
    if (!it.unCookedFile) return null;
    let f = new SingleFile();
    f.fileType = FileType.UCooked;
    f.package = it.package;
    f.localPath = it.unCookedFile;
    return f;
  }//getUnCookedFile

  static getWin64CookedFile(it: AssetItem): SingleFile {
    if (!it.win64CookedFile) return null;
    let f = new SingleFile();
    f.fileType = FileType.Cooked;
    f.package = it.package;
    f.localPath = it.win64CookedFile;
    return f;
  }//getWin64CookedFile

  static getAndroidCookedFile(it: AssetItem): SingleFile {
    if (!it.androidCookedFile) return null;
    let f = new SingleFile();
    f.fileType = FileType.Cooked;
    f.package = it.package;
    f.localPath = it.androidCookedFile;
    return f;
  }//getAndroidCookedFile

  static getIOSCookedFile(it: AssetItem): SingleFile {
    if (!it.iosCookedFile) return null;
    let f = new SingleFile();
    f.fileType = FileType.Cooked;
    f.package = it.package;
    f.localPath = it.iosCookedFile;
    return f;
  }//getIOSCookedFile

  static getClientAssetObject(it: AssetItem): ClientAssetObject {
    if (!it.class) return null;
    let cobj = new ClientAssetObject();
    cobj.name = it.name;
    cobj.package = it.package;
    if (it.class.indexOf("World") > -1)
      cobj.classType = ClientObjectType.Map;
    else if (it.class.indexOf("Texture") > -1)
      cobj.classType = ClientObjectType.Texture;
    else if (it.class.indexOf("Material") > -1)
      cobj.classType = ClientObjectType.Material;
    else if (it.class.indexOf("StaticMesh") > -1)
      cobj.classType = ClientObjectType.StaticMesh;
    else
      cobj.classType = ClientObjectType.Other;
    return cobj;
  }//getClientAssetObject

}

class AnalysisAssetList {

  clientObjects: { [key: string]: ClientAssetObject } = {};
  singleFiles: { [key: string]: SingleFile } = {};
}

class ClientAssetObject {
  name: string;
  icon: string;
  package: string;
  classType: ClientObjectType
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

enum ClientObjectType {
  Map,
  Texture,
  StaticMesh,
  Material,
  Other
}

enum FileType {
  Icon,
  Source,
  UCooked,
  Cooked
}

function generateCDKEY(pck: string, ft: FileType) {
  return `${pck}@@${ft}`;
}//生成类型和package唯一识别码

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
  _analysisAssetList = new AnalysisAssetList();











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
    this._analysisAssetList = new AnalysisAssetList();
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

            let clientObj = AssetItem.getClientAssetObject(it);
            let iconSF = AssetItem.getIconFile(it);
            let srcSF = AssetItem.getSourceFile(it);
            let unCookedSF = AssetItem.getUnCookedFile(it);
            let win64CookSF = AssetItem.getWin64CookedFile(it);
            let androidCookedSF = AssetItem.getAndroidCookedFile(it);
            let iosCookedSF = AssetItem.getAndroidCookedFile(it);
            if (iconSF)
              this._analysisAssetList.singleFiles[generateCDKEY(iconSF.package, iconSF.fileType)] = iconSF;
            if (srcSF)
              this._analysisAssetList.singleFiles[generateCDKEY(srcSF.package, srcSF.fileType)] = srcSF;
            if (unCookedSF)
              this._analysisAssetList.singleFiles[generateCDKEY(unCookedSF.package, unCookedSF.fileType)] = unCookedSF;
            if (win64CookSF)
              this._analysisAssetList.singleFiles[generateCDKEY(win64CookSF.package, win64CookSF.fileType)] = win64CookSF;
            if (androidCookedSF)
              this._analysisAssetList.singleFiles[generateCDKEY(androidCookedSF.package, androidCookedSF.fileType)] = androidCookedSF;
            if (iosCookedSF)
              this._analysisAssetList.singleFiles[generateCDKEY(iosCookedSF.package, iosCookedSF.fileType)] = iosCookedSF;
            if (clientObj)
              this._analysisAssetList.clientObjects[clientObj.package] = clientObj;


          }//for


          resolve();
        });//readJSON
      });
    }//analyzeAssetFromConfig

    checkAssetListFile(configPath).then(analyzeAssetFromConfig).then(() => {
      console.log(this._analysisAssetList);
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

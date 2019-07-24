import { Component, OnInit, OnDestroy } from '@angular/core';
import { ElectronDialogService, MessageCenterService, AppCacheService, FileHelper, AppConfigService } from '@app/core';
import * as path from "path";
import * as fs from 'fs';
import * as fsExtra from "fs-extra";
import * as  md5File from 'md5-file';
import { MatDialog } from '@angular/material/dialog';
import { SimpleMessageDialogComponent } from '../simple-message-dialog/simple-message-dialog.component';
import { FileassetService, SrcClientAssetService, MapService, Map, TextureService, Texture, MaterialService, Material, StaticMeshService, StaticMesh, IconService } from '@app/morejee-ms';
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

  static getPackageMap(it: AssetItem): PackageMap {
    let mp = new PackageMap();
    mp.package = it.package;
    mp.dependencies = it.dependencies;
    return mp;
  }//getPackageMap

  static getIconFile(it: AssetItem): SingleFile {
    if (!it.iconFile) return null;
    let f = new SingleFile();
    f.fileType = FileType.Icon;
    f.package = it.package;
    f.name = it.name;
    f.localPath = it.iconFile;
    return f;
  }//getIconFile

  static getSourceFile(it: AssetItem): SingleFile {
    if (!it.srcFile) return null;
    let f = new SingleFile();
    f.fileType = FileType.Source;
    f.package = it.package;
    f.name = it.name;
    f.localPath = it.srcFile;
    return f;
  }//getSourceFile

  static getUnCookedFile(it: AssetItem): SingleFile {
    if (!it.unCookedFile) return null;
    let f = new SingleFile();
    f.fileType = FileType.UnCooked;
    f.package = it.package;
    f.name = it.name;
    f.localPath = it.unCookedFile;
    return f;
  }//getUnCookedFile

  static getWin64CookedFile(it: AssetItem): SingleFile {
    if (!it.win64CookedFile) return null;
    let f = new SingleFile();
    f.fileType = FileType.Win64Cooked;
    f.package = it.package;
    f.name = it.name;
    f.localPath = it.win64CookedFile;
    return f;
  }//getWin64CookedFile

  static getAndroidCookedFile(it: AssetItem): SingleFile {
    if (!it.androidCookedFile) return null;
    let f = new SingleFile();
    f.fileType = FileType.AndroidCooked;
    f.package = it.package;
    f.name = it.name;
    f.localPath = it.androidCookedFile;
    return f;
  }//getAndroidCookedFile

  static getIOSCookedFile(it: AssetItem): SingleFile {
    if (!it.iosCookedFile) return null;
    let f = new SingleFile();
    f.fileType = FileType.IOSCooked;
    f.package = it.package;
    f.name = it.name;
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
  packageMaps: { [key: string]: PackageMap } = {};
  clientObjects: { [key: string]: ClientAssetObject } = {};
  singleFiles: { [key: string]: SingleFile } = {};
}

class PackageMap {
  _srcAssetUrl: string;
  _unCookedAssetUrl: string;
  _win64CookedAssetUrl: string;
  _androidCookedAssetUrl: string;
  _iosCookedAssetUrl: string;
  package: string;
  dependencies: string[] = [];
  dependencyRelationOfSrc: PackageMapRelation[] = [];
  dependencyRelationOfUnCooked: PackageMapRelation[] = [];
  dependencyRelationOfWin64Cooked: PackageMapRelation[] = [];
  dependencyRelationOfAndroidCooked: PackageMapRelation[] = [];
  dependencyRelationOfIOSCooked: PackageMapRelation[] = [];
}

class PackageMapRelation {
  constructor(public packageName: string, public assetUrl: string) {
  }
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
  name: string;
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
  Icon = "Icon",
  Source = "Source",
  UnCooked = "UnCooked",
  Win64Cooked = "Win64Cooked",
  AndroidCooked = "AndroidCooked",
  IOSCooked = "IOSCooked",
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
  get allAssetCount() {
    return Object.keys(this._analysisAssetList.singleFiles).length;
  }

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
            let clientObj = AssetItem.getClientAssetObject(it);
            let iconSF = AssetItem.getIconFile(it);
            let srcSF = AssetItem.getSourceFile(it);
            let unCookedSF = AssetItem.getUnCookedFile(it);
            let win64CookSF = AssetItem.getWin64CookedFile(it);
            let androidCookedSF = AssetItem.getAndroidCookedFile(it);
            let iosCookedSF = AssetItem.getIOSCookedFile(it);
            let pckMap = AssetItem.getPackageMap(it);
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
            this._analysisAssetList.packageMaps[pckMap.package] = pckMap;
          }//for

          resolve();
        });//readJSON
      });
    };//analyzeAssetFromConfig

    checkAssetListFile(configPath).then(analyzeAssetFromConfig).then(() => {
      console.log(this._analysisAssetList);
      this._analyzeFileStructureProcess = false;
    }, err => {
      console.error('selectProjectDir err:', err);
      this.messageSrv.message(err, true);
      this._analyzeFileStructureProcess = false;
    })
  }//selectProjectDir

  upload() {

    this._uploadingProcess = true;

    let allPackages = [];
    let allSFPackages = [];
    let iconSFPackages = [];
    let sourceSFPackages = [];
    let cookedSFPackages = [];
    //提取出各个类型的包名称,省得重复遍历
    for (let pck in this._analysisAssetList.singleFiles) {
      let it = this._analysisAssetList.singleFiles[pck];
      allSFPackages.push(pck);
      allPackages.push(pck);
      if (it.fileType == FileType.Icon)
        iconSFPackages.push(pck);
      else if (it.fileType == FileType.Source || it.fileType == FileType.UnCooked)
        sourceSFPackages.push(pck);
      else
        cookedSFPackages.push(pck);
    }//for

    //使用Node API上传文件
    let nodeJsAPIUploadFile = (localPath: string, server: string, callback: (err: any, data?: any) => void) => {
      let uploadReq = request.post(server, { auth: { bearer: this.cacheSrv.token }, headers: { fileExt: FileHelper.getFileExt(localPath), timeout: 600000 } }, (err, rs, body) => {
        if (rs.statusCode >= 300 || rs.statusCode < 200) {
          callback(rs.statusMessage);
          return;
        }
        callback(null, body);
      });
      fs.createReadStream(localPath).pipe(uploadReq);
    }//nodeJsUploadFile

    //修正资源localPath可能出现的路径异常
    let fixLocalPathError = () => {
      for (let pck in this._analysisAssetList.singleFiles) {
        let it = this._analysisAssetList.singleFiles[pck];
        let idx = it.localPath.indexOf(this._projectFolderName);
        let tplocalStr = it.localPath.slice(idx + this._projectFolderName.length, it.localPath.length);
        //不知道ue4那边对文件路径分隔符是什么,都尝试一下
        let sep = '/';
        if (tplocalStr.indexOf(sep) == -1)
          sep = "\\";
        let tarr = tplocalStr.split(sep);
        let prjName = tarr.join(path.sep);
        it.localPath = this._projectDir + prjName;
      }
      return Promise.resolve();
    };//fixLocalPathError

    //检测文件修改时间信息,用来校验md5,不能只根据package记录md5,还应该加上修改时间
    let checkAssetStat = () => {
      this._uploadingProcessStep = 1;
      let limit = promiseLimit(20);
      let checkStat = (it: SingleFile) => {
        return new Promise((resolve) => {
          if (it._modifiedTime) return resolve();

          fs.stat(it.localPath, (err, stat) => {
            if (err) {
              console.warn(`发现文件不存在,具体路径为:${it.localPath}`);
              it._notExist = true;
              return resolve();
            }

            it._modifiedTime = stat.mtime.getTime();
            it._size = stat.size;
            resolve();
          });//stat
        });//Promise
      };//checkStat
      return Promise.all(allSFPackages.map(lcp => {
        let it = this._analysisAssetList.singleFiles[lcp];
        return limit(() => checkStat(it));
      }));
    };//checkAssetStat

    //计算文件的md5信息
    let calcFileMD5 = () => {
      this._uploadingProcessStep = 2;
      let limit = promiseLimit(10);
      let calcMD5 = (it: SingleFile) => {
        return new Promise((resolve, reject) => {
          if (it._notExist) return resolve();
          if (it._md5) return resolve();
          let _md5 = this.assetMd5CacheSrv.getMd5Cache(it.localPath, it._modifiedTime, it._size);
          if (_md5) {
            it._md5 = _md5;
            return resolve();
          }

          md5File(it.localPath, (err, hash) => {
            if (err) return reject(err.message);

            it._md5 = hash;
            this.assetMd5CacheSrv.cacheMd5(it.localPath, hash, it._modifiedTime, it._size);
            return resolve();
          });//md5File

        });//Promise
      };//calcMD5
      return Promise.all(allSFPackages.map(lcp => {
        let it = this._analysisAssetList.singleFiles[lcp];
        return limit(() => calcMD5(it));
      }));
    };//calcFileMD5

    //上传图标文件
    let uploadIconFiles = () => {
      this._uploadingProcessStep = 3;
      let limit = promiseLimit(15);
      let uploadFile = (it: SingleFile) => {
        return new Promise((resolve, reject) => {
          if (it._notExist) return resolve();
          if (it._url) return resolve();

          nodeJsAPIUploadFile(it.localPath, `${this.configSrv.server}/oss/icons/stream`, (err, url) => {
            if (err) {
              console.error('上传icon file异常:', err);
              return resolve();
            }

            it._url = url;
            resolve();
          });//nodeJsAPIUploadFile
        });//Promise
      };//uploadFile

      return Promise.all(iconSFPackages.map(lcp => {
        let it = this._analysisAssetList.singleFiles[lcp];
        return limit(() => uploadFile(it));
      }));
    };//uploadIcon

    //上传原资源文件
    let uploadSourceAndUnCookedFiles = () => {
      this._uploadingProcessStep = 4;
      let limit = promiseLimit(15);
      let uploadFile = (it: SingleFile) => {
        return new Promise((resolve, reject) => {
          if (it._notExist) return resolve();
          if (it._url) return resolve();
          this.srcAssetSrv.checkFileExistByMd5(it._md5).subscribe(url => {
            if (url) {
              it._url = url;
              return resolve();
            }

            nodeJsAPIUploadFile(it.localPath, `${this.configSrv.server}/oss/srcClientAssets/stream`, (err, url) => {
              if (err) {
                console.error('上传source file异常:', err);
                return resolve();
              }

              it._url = url;
              resolve();
            });//nodeJsAPIUploadFile
          });//checkFileExistByMd5
        });//Promise
      };//uploadFile 

      return Promise.all(sourceSFPackages.map(lcp => {
        let it = this._analysisAssetList.singleFiles[lcp];
        return limit(() => uploadFile(it));
      }));
    };//uploadSourceAndUnCookedFiles

    let uploadAlPlatformCookedFiles = () => {
      this._uploadingProcessStep = 5;
      let limit = promiseLimit(15);
      let uploadFile = (it: SingleFile) => {
        return new Promise((resolve, reject) => {
          if (it._notExist) return resolve();
          if (it._url) return resolve();
          this.assetSrv.checkFileExistByMd5(it._md5).subscribe(url => {
            if (url) {
              it._url = url;
              return resolve();
            }

            nodeJsAPIUploadFile(it.localPath, `${this.configSrv.server}/oss/files/stream`, (err, res) => {
              if (err) {
                console.error('上传cooked file异常:', err);
                return resolve();
              }

              let obj = JSON.parse(res);
              it._url = obj.url;
              resolve();
            });//nodeJsAPIUploadFile
          });//checkFileExistByMd5
        });//Promise
      };//uploadFile
      return Promise.all(cookedSFPackages.map(lcp => {
        let it = this._analysisAssetList.singleFiles[lcp];
        return limit(() => uploadFile(it));
      }));
    };//uploadAlPlatformCookedFiles

    let setPackageAssetUrls = () => {
      for (let pckName in this._analysisAssetList.packageMaps) {
        let it = this._analysisAssetList.packageMaps[pckName];

        let srcFS = this._analysisAssetList.singleFiles[generateCDKEY(pckName, FileType.Source)];
        let unCookedFS = this._analysisAssetList.singleFiles[generateCDKEY(pckName, FileType.UnCooked)];
        let win64CookedFS = this._analysisAssetList.singleFiles[generateCDKEY(pckName, FileType.Win64Cooked)];
        let androidCookedFS = this._analysisAssetList.singleFiles[generateCDKEY(pckName, FileType.AndroidCooked)];
        let iosCookedFS = this._analysisAssetList.singleFiles[generateCDKEY(pckName, FileType.IOSCooked)];
        if (srcFS)
          it._srcAssetUrl = srcFS._url;
        if (unCookedFS)
          it._unCookedAssetUrl = unCookedFS._url;
        if (win64CookedFS)
          it._win64CookedAssetUrl = win64CookedFS._url;
        if (androidCookedFS)
          it._androidCookedAssetUrl = androidCookedFS._url;
        if (iosCookedFS)
          it._iosCookedAssetUrl = iosCookedFS._url;
      }//for


      return Promise.resolve();
    }//setPackageAssetUrls

    let analyzePackageMaps = () => {

      let findRelation = (parent: PackageMap, dePckName: string) => {
        let dePck = this._analysisAssetList.packageMaps[dePckName];

        for (let subPckName of dePck.dependencies) findRelation(parent, subPckName);

        if (dePck._srcAssetUrl)
          parent.dependencyRelationOfSrc.push(new PackageMapRelation(dePck.package, dePck._srcAssetUrl));
        if (dePck._unCookedAssetUrl)
          parent.dependencyRelationOfUnCooked.push(new PackageMapRelation(dePck.package, dePck._unCookedAssetUrl));
        if (dePck._win64CookedAssetUrl)
          parent.dependencyRelationOfWin64Cooked.push(new PackageMapRelation(dePck.package, dePck._win64CookedAssetUrl));
        if (dePck._androidCookedAssetUrl)
          parent.dependencyRelationOfAndroidCooked.push(new PackageMapRelation(dePck.package, dePck._androidCookedAssetUrl));
        if (dePck._iosCookedAssetUrl)
          parent.dependencyRelationOfIOSCooked.push(new PackageMapRelation(dePck.package, dePck._iosCookedAssetUrl));
      };
      for (let pckName in this._analysisAssetList.packageMaps) {
        let parent = this._analysisAssetList.packageMaps[pckName];

        for (let pn of parent.dependencies) {
          findRelation(parent, pn);
        }
      }//for

      return Promise.resolve();
    };//analyzePackageMaps

    fixLocalPathError().then(checkAssetStat).then(calcFileMD5).then(uploadIconFiles).then(uploadSourceAndUnCookedFiles).then(uploadAlPlatformCookedFiles).then(setPackageAssetUrls).then(analyzePackageMaps).then(() => {
      console.log(this._analysisAssetList);
      this._uploadingProcess = false;
    }, err => {
      this._uploadingProcess = false;
      console.error('upload error:', err);
    });

  }//upload

  confirmLeaveUploader() {
    this.dialogSrv.open(SimpleMessageDialogComponent, { width: '300px', height: '250px', data: { message: 'message.waitTilFinishUploadingBeforeLeaving' } });
  }//confirmLeaveUploader

}

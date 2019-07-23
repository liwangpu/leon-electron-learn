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

class AssetList {
  dataMap: { [key: string]: AssetItem };
  dependencies: { [key: string]: AssetItem };
}

class AssetItem {
  package: string;
  name: string;
  class: string;
  tags: object;
  localPath: string;
  dependencies: { [key: string]: AssetDependency };
  srcFile: AssetDependency;
  unCookedFile: AssetDependency;

  static getSourceFile(it: AssetItem): AnalysisFile {
    if (!it.srcFile || !it.srcFile.localPath) return;
    let f = new AnalysisFile();
    f.fileType = FileType.source;
    f.package = it.package;
    f.name = it.name;
    f.localPath = it.srcFile.localPath;
    f.class = it.class;
    return f;
  }//getSourceFile

  static getUnCookedFile(it: AssetItem): AnalysisFile {
    if (!it.unCookedFile || !it.unCookedFile.localPath) return;

    let f = new AnalysisFile();
    f.fileType = FileType.source;
    f.package = it.package;
    f.name = it.name;
    f.localPath = it.unCookedFile.localPath;
    f.class = it.class;
    return f;
  }//getUnCookedFile

  static getCookedFile(it: AssetItem): AnalysisFile {
    let f = new AnalysisFile();
    f.fileType = FileType.cooked;
    f.package = it.package;
    f.name = it.name;
    f.localPath = it.localPath;
    f.class = it.class;
    return f;
  }//getCookedFile

  static getIconFile(it: AssetItem): AnalysisFile {
    if (it.dependencies) {
      for (let dpc in it.dependencies) {
        if (dpc.indexOf('UploadIcons') > -1) {
          let iconFile = it.dependencies[dpc];
          let f = new AnalysisFile();
          f.fileType = FileType.icon;
          f.name = iconFile.name;
          f.package = iconFile.package;
          f.localPath = iconFile.localPath;
          return f;
        }//if
      }//for
    }
    return;
  }//getIconFile

  static getPackageMap(it: AssetItem): AnalysisPackageMap {
    let sourcF = AssetItem.getSourceFile(it);
    let unCookedF = AssetItem.getUnCookedFile(it);
    let pckMap = new AnalysisPackageMap();
    pckMap.package = it.package;
    pckMap.srcPackageName = sourcF ? sourcF.package : '';
    pckMap.unCookedPackageName = unCookedF ? unCookedF.package : '';
    if (it.dependencies) {
      for (let dpc in it.dependencies) {
        if (dpc.indexOf('UploadIcons') == -1)
          pckMap.dependencyPackages.push(dpc);
      }//for
    }
    return pckMap;
  }//getPackageMap

  static getClientAsset(it: AssetItem): AnalysisClientAsset {
    let iconF = AssetItem.getIconFile(it);
    let cAsset = new AnalysisClientAsset();
    cAsset.name = it.name;
    cAsset.package = it.package;
    cAsset.iconPackageName = iconF ? iconF.package : '';
    if (it.class.indexOf("World") > -1)
      cAsset.clientAssetType = ClientAssetType.map;
    else if (it.class.indexOf("Texture") > -1)
      cAsset.clientAssetType = ClientAssetType.texture;
    else if (it.class.indexOf("Material") > -1)
      cAsset.clientAssetType = ClientAssetType.material;
    else if (it.class.indexOf("StaticMesh") > -1)
      cAsset.clientAssetType = ClientAssetType.staticMesh;
    else
      cAsset.clientAssetType = ClientAssetType.other;
    return cAsset;
  }//getClientAsset

}

class AssetDependency {
  package: string;
  name: string;
  localPath: string;
}


/**
 * 以上是配置文件原始的对象格式
 * 而该类是解读配置文件后整理的一个需要上传的数据结构
 */
class AnalysisFileSetStructure {
  clientAssets: { [key: string]: AnalysisClientAsset } = {};
  packageMaps: { [key: string]: AnalysisPackageMap } = {};
  files: { [key: string]: AnalysisFile } = {};

  get filePackageNames(): string[] {
    return Object.keys(this.files);
  }
}

//资源对象
class AnalysisClientAsset {
  objId: string;
  package: string;
  name: string;
  iconPackageName: string;
  clientAssetType: ClientAssetType;
}


class AnalysisPackageMap {
  package: string;
  srcPackageName: string;
  unCookedPackageName: string;
  srcFileUrl: string;
  cookedFileUrl: string;
  unCookedFileUrl: string;
  dependencyPackages: string[] = [];
  dependencyCookedFileUrls: string[] = [];
  dependencyUnCookedFileUrls: string[] = [];
  dependencySrcdFileUrls: string[] = [];
}

//单个资源文件,包括资源对象和依赖项还有图标文件
class AnalysisFile {
  objId: string;
  url: string;
  name: string;
  class: string;
  package: string;
  localPath: string;
  md5: string;
  size: number;
  modifiedTime: number;
  notExist: boolean;
  fileType: FileType;
}

enum FileType {
  icon,
  source,
  cooked,
  unCooked
}

enum ClientAssetType {
  map,
  texture,
  staticMesh,
  material,
  other
}

function GenerateCDKEY(pck: string, ft: FileType) {
  return `${ft}@${pck}`;
}//生成类型和package唯一识别码

// /**
//  * 从配置文件读出的文件有层级结构
//  * 修正路径和计算md5次数重复,所以拆解成单文件格式
//  */
// class SingleAsset {
//   localPath: string;
//   _notExist: boolean;
//   _iconFile: boolean;
//   _srcAsset: boolean;
//   _url: string;
//   _md5: string;
//   _modifiedTime: number;
//   _size: number;
//   constructor(lcp: string) {
//     this.localPath = lcp;
//   }
// }

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
  _analyzeFileStructure = new AnalysisFileSetStructure();
  _analyzeFileStructureProcess = false;
  _uploadingProcess = false;
  _uploadingProcessStep = 0;
  get allAssetCount() {
    return Object.keys(this._analyzeFileStructure.files).length;
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
    * 在项目文件夹有个txt的配置文件projectname/Saved/AssetMan/assetlist.txt,该配置文件是json格式的
    * 记录着需要上传的资源信息
    */

    //配置文件路径
    let configPath = path.join(this._projectDir, "Saved", "AssetMan", "assetlist.txt");

    //校验配置文件是否存在
    let checkAssetListFile = (configPath: string) => {
      this._analyzeFileStructureProcess = true;
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

    //分析配置里面所包含的资源
    let analyzeAllAssetFromConfig = (configPath: string) => {
      return new Promise((resolve, reject) => {
        fsExtra.readJSON(configPath, { encoding: 'utf8' }, (err, assetList: AssetList) => {
          if (err) {
            reject(`assetlist.txt JSON解析异常:${err}`);
            return;
          }

          if (assetList.dataMap) {
            for (let k in assetList.dataMap) {
              let it = assetList.dataMap[k];
              let sourcF = AssetItem.getSourceFile(it);
              let unCookedF = AssetItem.getUnCookedFile(it);
              let cookedF = AssetItem.getCookedFile(it);
              // let iconF = it.getIconFile();

              if (sourcF)
                this._analyzeFileStructure.files[GenerateCDKEY(sourcF.package, sourcF.fileType)] = sourcF;
              if (unCookedF)
                this._analyzeFileStructure.files[GenerateCDKEY(unCookedF.package, unCookedF.fileType)] = unCookedF;
              if (cookedF)
                this._analyzeFileStructure.files[GenerateCDKEY(cookedF.package, cookedF.fileType)] = cookedF;

              let cAsset = AssetItem.getClientAsset(it);
              this._analyzeFileStructure.clientAssets[cAsset.package] = cAsset;
              let pckMap = AssetItem.getPackageMap(it);
              this._analyzeFileStructure.packageMaps[pckMap.package] = pckMap;
            }//for
          }//if

          if (assetList.dependencies) {
            for (let k in assetList.dependencies) {
              let it = assetList.dependencies[k];

              let sourcF = AssetItem.getSourceFile(it);
              let unCookedF = AssetItem.getUnCookedFile(it);
              let cookedF = AssetItem.getCookedFile(it);

              if (sourcF)
                this._analyzeFileStructure.files[GenerateCDKEY(sourcF.package, sourcF.fileType)] = sourcF;
              if (unCookedF)
                this._analyzeFileStructure.files[GenerateCDKEY(unCookedF.package, unCookedF.fileType)] = unCookedF;
              if (cookedF)
                this._analyzeFileStructure.files[GenerateCDKEY(cookedF.package, cookedF.fileType)] = cookedF;

              let pckMap = AssetItem.getPackageMap(it);
              this._analyzeFileStructure.packageMaps[pckMap.package] = pckMap;
            }//for
          }//if

          resolve();
        });
      });
    };//analyzeAllAssetFromConfig

    // this.messageSrv.message("什么鬼");

    checkAssetListFile(configPath).then(analyzeAllAssetFromConfig).then(() => {
      console.log('成功!', this._analyzeFileStructure);
      this._analyzeFileStructureProcess = false;
    }, err => {
      this.messageSrv.message(err, true);
      this._analyzeFileStructureProcess = false;
    });




    // // 校验配置文件是否存在
    // let checkAssetListFile = (configPath: string) => {
    //   return new Promise((resolve, reject) => {
    //     fs.exists(configPath, exist => {
    //       if (exist) {
    //         resolve(configPath);
    //         return;
    //       }
    //       reject("message.cannotFindAssetListFile");
    //     });
    //   });
    // };//checkAssetListFile

    // //分析配置文件里面所包含的资源
    // let analyzeAllAssetFromConfig = (configPath: string) => {
    //   return new Promise((resolve, reject) => {
    //     fsExtra.readJSON(configPath, { encoding: 'utf8' }, (err, assetList: AssetList) => {
    //       if (err) {
    //         reject(err.message);
    //         return;
    //       }

    //       if (assetList.dataMap) {
    //         for (let k in assetList.dataMap) {
    //           let it = assetList.dataMap[k];
    //           it._clientAsset = true;
    //           this.allAsset[it.package] = it;
    //         }
    //       }//if

    //       if (assetList.dependencies) {
    //         for (let k in assetList.dependencies) {
    //           let it = assetList.dependencies[k];
    //           this.allAsset[it.package] = it;
    //         }
    //       }//if
    //       resolve();
    //     });
    //   });
    // };//analyzeAllAssetFromConfig

    // checkAssetListFile(path.join(this._projectDir, "Saved", "AssetMan", "assetlist.txt")).then(analyzeAllAssetFromConfig).then(() => {
    //   // console.log('res', this.allAsset);
    // });
  }//selectProjectDir






  upload() {
    this._uploadingProcess = true;

    //临时存储单文件的package,避免重复计算
    let singleFilePackageNames = this._analyzeFileStructure.filePackageNames;
    // console.log(1, this._singleFilePackageNames);

    //修正资源localPath可能出现的路径异常
    let fixLocalPathError = () => {
      for (let pck in this._analyzeFileStructure.files) {
        let it = this._analyzeFileStructure.files[pck];
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
    }//fixLocalPathError

    //检测文件修改时间信息,用来校验md5,不能只根据package记录md5,还应该加上修改时间
    let checkAssetStat = () => {
      this._uploadingProcessStep = 1;
      let limit = promiseLimit(20);
      let checkStat = (it: AnalysisFile) => {
        return new Promise((resolve) => {
          if (it.modifiedTime) {
            resolve();
            return;
          }

          fs.stat(it.localPath, (err, stat) => {
            if (err) {
              //文件可能不存在,不可以直接终止程序
              console.warn(`发现文件不存在,具体路径为:${it.localPath}`);
              it.notExist = true;
              resolve();
              return;
            }
            it.modifiedTime = stat.mtime.getTime();
            it.size = stat.size;
            resolve();
          });//stat
        });
      };//checkAssetStat

      return Promise.all(singleFilePackageNames.map(lcp => {
        let it = this._analyzeFileStructure.files[lcp];
        return limit(() => checkStat(it));
      }));
    }//_checkAssetStat

    //计算文件的md5信息
    let calcFileMD5 = () => {
      this._uploadingProcessStep = 2;
      let limit = promiseLimit(10);
      let calcMD5 = (it: AnalysisFile) => {
        return new Promise((resolve, reject) => {
          if (it.notExist) {
            resolve();
            return;
          }

          if (it.md5) {
            resolve();
            return;
          }

          let _md5 = this.assetMd5CacheSrv.getMd5Cache(it.localPath, it.modifiedTime, it.size);
          // console.log(111, _md5);
          if (!_md5) {
            md5File(it.localPath, (err, hash) => {
              if (err) {
                reject(err.message);
                return;
              }
              it.md5 = hash;
              this.assetMd5CacheSrv.cacheMd5(it.localPath, hash, it.modifiedTime, it.size);
              resolve();
              return;
            });
          }
          else {
            it.md5 = _md5;
            resolve();
          }
        });
      };//calcMD5
      return Promise.all(singleFilePackageNames.map(lcp => {
        let it = this._analyzeFileStructure.files[lcp];
        return limit(() => calcMD5(it));
      }));
    }//calcFileMD5

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

    let uploadSrcFiles = () => {
      this._uploadingProcessStep = 4;
      let limit = promiseLimit(20);
      let uploadSrcFile = (it: AnalysisFile) => {
        return new Promise((resolve, reject) => {
          if (it.notExist || it.fileType != FileType.source) {
            resolve();
            return;
          }

          console.log(6);
          this.srcAssetSrv.checkFileExistByMd5(it.md5).subscribe(url => {
            if (url) {
              it.url = url;
              resolve();
              return;
            }

            nodeJsAPIUploadFile(it.localPath, `${this.configSrv.server}/oss/srcClientAssets/stream`, (err, url) => {
              if (err) {
                console.error('上传source file异常:', err);
                resolve();
                return;
              }

              it.url = url;
              resolve();
            });//nodeJsAPIUploadFile
          }, err => {
            console.log("上传源文件异常:", err);
            resolve();
          });//subscribe
        });
      };//uploadSrcFile

      // return Promise.all(singleFilePackageNames.map(lcp => {
      //   let it = this._analyzeFileStructure.files[lcp];
      //   return limit(() => uploadSrcFile(it));
      // }));



      let packageNames = [];
      for (let pck in this._analyzeFileStructure.files) {
        let it = this._analyzeFileStructure.files[pck];

        if (it.notExist) continue;
        if (it.fileType != FileType.source) continue;

        console.log(111, it);
        packageNames.push(pck);
      }


      console.log(2, packageNames);
      return Promise.resolve();
    }//uploadSrcFiles









    fixLocalPathError().then(checkAssetStat).then(calcFileMD5).then(uploadSrcFiles).then(() => {
      console.log('成功!', this._analyzeFileStructure);
      this._uploadingProcess = false;
    }, err => {
      console.warn('error', err);
      this._uploadingProcess = false;
    });
    // let allPackageNames = Object.keys(this.allAsset);


    // //上传icon
    // let uploadIconFiles = () => {
    //   this._uploadingProcessStep = 3;
    //   let limit = promiseLimit(20);
    //   let uploadIcon = (it: SingleAsset) => {
    //     return new Promise((resolve, reject) => {
    //       if (it._notExist || !it._iconFile) {
    //         resolve();
    //         return;
    //       }

    //       nodeJsAPIUploadFile(it.localPath, `${this.configSrv.server}/oss/icons/stream`, (err, url) => {
    //         if (err) {
    //           console.error('上传图标异常:', err);
    //           resolve();
    //           return;
    //         }
    //         it._url = url;
    //         resolve();
    //       });//nodeJsAPIUploadFile
    //     });
    //   };//uploadIcon
    //   return Promise.all(singleFileNames.map(lcp => {
    //     let it = this._allSingleFileAsset[lcp];
    //     return limit(() => uploadIcon(it));
    //   }));
    // };//uploadIconFiles

    // //上传原文件
    // let uploadSrcAssetFiles = () => {
    //   this._uploadingProcessStep = 4;
    //   let limit = promiseLimit(20);
    //   let uploadSrcFile = (it: SingleAsset) => {
    //     return new Promise((resolve, reject) => {
    //       if (it._notExist || !it._srcAsset) {
    //         resolve();
    //         return;
    //       }

    //       this.srcAssetSrv.checkFileExistByMd5(it._md5).subscribe(url => {
    //         if (url) {
    //           it._url = url;
    //           resolve();
    //           return;
    //         }

    //         nodeJsAPIUploadFile(it.localPath, `${this.configSrv.server}/oss/srcClientAssets/stream`, (err, url) => {
    //           if (err) {
    //             console.error('上传source file异常:', err);
    //             resolve();
    //             return;
    //           }
    //           // console.log(6, url);
    //           it._url = url;
    //           resolve();
    //         });//nodeJsAPIUploadFile
    //       }, err => {
    //         console.log("上传源文件异常:", err);
    //         resolve();
    //       });//subscribe
    //     });
    //   };//uploadSrcFile

    //   return Promise.all(singleFileNames.map(lcp => {
    //     let it = this._allSingleFileAsset[lcp];
    //     return limit(() => uploadSrcFile(it));
    //   }));
    // };//uploadSrcAssetFiles

    // //上传依赖文件
    // let uploadSingleFiles = () => {
    //   this._uploadingProcessStep = 5;
    //   let limit = promiseLimit(20);
    //   let uploadFile = (it: SingleAsset) => {
    //     return new Promise((resolve, reject) => {
    //       if (it._notExist || it._iconFile || it._srcAsset) {
    //         resolve();
    //         return;
    //       }

    //       this.assetSrv.checkFileExistByMd5(it._md5).subscribe(url => {
    //         // console.log('dep url:',url);
    //         if (url) {
    //           it._url = url;
    //           resolve();
    //           return;
    //         }

    //         nodeJsAPIUploadFile(it.localPath, `${this.configSrv.server}/oss/files/stream`, (err, data) => {
    //           if (err) {
    //             console.error('上传依赖文件异常 nodejs:', err);
    //             resolve();
    //             return;
    //           }
    //           // console.log('sdfsdf', data, data.url);
    //           it._url = data.url;
    //           resolve();
    //         });//nodeJsAPIUploadFile
    //       }, err => {
    //         console.log("上传依赖文件异常 subscribe:", err);
    //         resolve();
    //       });//subscribe
    //     });//
    //   };//uploadFile
    //   return Promise.all(singleFileNames.map(lcp => {
    //     let it = this._allSingleFileAsset[lcp];
    //     return limit(() => uploadFile(it));
    //   }));
    // };//uploadSingleFiles


    // let createClientObject = () => {
    //   this._uploadingProcessStep = 6;
    //   let limit = promiseLimit(20);
    //   let createObj = (it: DataMap) => {
    //     return new Promise((resolve, reject) => {
    //       if (!it._clientAsset) {
    //         resolve();
    //         return;
    //       }

    //       if (it._objId) {
    //         resolve();
    //         return;
    //       }

    //       let clientAsset = {};
    //       clientAsset["name"] = it.name;
    //       let f = this._allSingleFileAsset[it.localPath];
    //       clientAsset["cookedAssetId"] = f._md5;
    //       clientAsset["packageName"] = it.package;
    //       if (it.srcFile && it.srcFile.localPath && this._allSingleFileAsset[it.srcFile.localPath]) {
    //         f = this._allSingleFileAsset[it.srcFile.localPath];
    //         clientAsset["sourceAssetId"] = f._md5;
    //       }
    //       if (it.unCookedFile && it.unCookedFile.localPath && this._allSingleFileAsset[it.unCookedFile.localPath]) {
    //         f = this._allSingleFileAsset[it.unCookedFile.localPath];
    //         clientAsset["unCookedAssetId"] = f._md5;
    //       }
    //       if (it._iconLocalPath) {
    //         f = this._allSingleFileAsset[it._iconLocalPath];
    //         clientAsset["icon"] = f._url;
    //       }
    //       if (it.dependencies) {
    //         let dependencyStr = "";
    //         let dcpNs = Object.keys(it.dependencies);
    //         if (dcpNs.length > 0) {
    //           for (let pck of dcpNs) {
    //             let lcp = package2SingleFileMap[pck];
    //             let f = this._allSingleFileAsset[lcp];
    //             //不存在的是icon
    //             if (f) {
    //               dependencyStr += `${f._url},${pck};`;
    //             }
    //           }
    //           clientAsset["dependencies"] = dependencyStr;
    //         }

    //       }
    //       if (it.tags) {
    //         let propertyStr = "";
    //         let tgNs = Object.keys(it.tags);
    //         if (tgNs.length > 0) {
    //           for (let k of tgNs) {
    //             propertyStr += `${k}=${it.tags[k]};`;
    //           }
    //           clientAsset["properties"] = propertyStr;
    //         }
    //       }


    //       if (it.class.indexOf("World") > -1) {
    //         this.mapSrv.post(clientAsset as Map).subscribe(rs => {
    //           it._objId = rs.id;
    //           resolve();
    //         }, err => {
    //           console.error("Map创建异常:", err);
    //           resolve();
    //         });
    //         // resolve();
    //       }
    //       else if (it.class.indexOf("Texture") > -1) {
    //         this.textureSrv.post(clientAsset as Texture).subscribe(rs => {
    //           it._objId = rs.id;
    //           resolve();
    //         }, err => {
    //           console.error("Texture创建异常:", err);
    //           resolve();
    //         });
    //       }
    //       else if (it.class.indexOf("Material") > -1) {
    //         this.materialSrv.post(clientAsset as Material).subscribe(rs => {
    //           it._objId = rs.id;
    //           resolve();
    //         }, err => {
    //           console.error("Material创建异常:", err);
    //           resolve();
    //         });
    //       }
    //       else if (it.class.indexOf("StaticMesh") > -1) {
    //         clientAsset["createProduct"] = true;
    //         this.meshSrv.post(clientAsset as StaticMesh).subscribe(rs => {
    //           it._objId = rs.id;
    //           resolve();
    //         }, err => {
    //           console.error("StaticMesh创建异常:", err);
    //           resolve();
    //         });
    //       }
    //       else {
    //         console.error("什么,还有class为其他类型:", it.class);
    //         resolve();
    //       }
    //     });
    //   };//createObj
    //   return Promise.all(allPackageNames.map(pck => {
    //     let it = this.allAsset[pck];
    //     return limit(() => createObj(it));
    //   }));
    // };//createClientObject

    // fixLocalPathError().then(checkAssetStat).then(calcFileMD5).then(uploadSrcAssetFiles).then(uploadSingleFiles).then(createClientObject).then(() => {
    //   this.messageSrv.operateSuccessfully();
    //   this._uploading = false;
    //   this.assetMd5CacheSrv.persistCache2File();
    // }, err => {
    //   this._uploading = false;
    //   console.error('矮油,上传过程出现异常,详情为:', err);
    // });

    // fixLocalPathError().then(checkAssetStat).then(calcFileMD5).then(uploadIconFiles).then(uploadSrcAssetFiles).then(uploadSingleFiles).then(createClientObject).then(() => {
    //   this.messageSrv.operateSuccessfully();
    //   this._uploading = false;
    //   this.assetMd5CacheSrv.persistCache2File();
    // }, err => {
    //   this._uploading = false;
    //   console.error('矮油,上传过程出现异常,详情为:', err);
    // });

  }//upload


  confirmLeaveUploader() {
    this.dialogSrv.open(SimpleMessageDialogComponent, { width: '300px', height: '250px', data: { message: 'message.waitTilFinishUploadingBeforeLeaving' } });
  }//confirmLeaveUploader

}

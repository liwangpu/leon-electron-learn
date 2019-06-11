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
  _iconLocalPath: string;
  //创建实体对象后的Id,比如map,texture的id
  _objId: string;
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

/**
 * 从配置文件读出的文件有层级结构
 * 修正路径和计算md5次数重复,所以拆解成单文件格式
 */
class SingleAsset {
  localPath: string;
  _notExist: boolean;
  _iconFile: boolean;
  _srcAsset: boolean;
  _url: string;
  _md5: string;
  _modifiedTime: number;
  _size: number;
  constructor(lcp: string) {
    this.localPath = lcp;
  }
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
  private _allSingleFileAsset: { [key: string]: SingleAsset } = {};
  _projectDir = "";
  _uploading = false;
  _uploadingProcessStep = 0;
  allAsset: { [key: string]: DataMap } = {};
  get allAssetCount() {
    return Object.keys(this.allAsset).length;
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

  test() {
    // let filePath = 'C:\\Users\\Leon\\Desktop\\AssetMinimalTemplate\\Saved\\Cooked\\WindowsNoEditor\\AssetMinimalTemplate\\Content\\EHOME-MAT\\20181224\\DiffuseTextures\\1-faxintietu\\85-danyi-nom3.uasset';

    // md5File(filePath, (err, hash) => {
    //   if (err) throw err

    //   console.log(`The MD5 sum of LICENSE.md is: ${hash}`)
    // });

    // this.assetSrv.checkFileExistByMd5("03328fc6226b5ae926445a454618acbc1").subscribe(exist => {
    //   console.log(111, exist, typeof exist);
    // });


    // let meshs = [];
    // for (let i = 1; i <= 500; i++) {
    //   let m = new StaticMesh();
    //   m.name = "test mesh " + i;
    //   m.packageName = "/tm/" + i;
    //   m.cookedAssetId = "c" + i;
    //   m.unCookedAssetId = "c" + i;
    //   m.sourceAssetId = "s" + i;
    //   m["createProduct"] = true;
    //   meshs.push(m);
    // }


    // let limit = promiseLimit(50);
    // let createMesh = (mesh: StaticMesh) => {
    //   return new Promise((resolve, reject) => {
    //     this.meshSrv.post(mesh).subscribe(rs => {
    //       console.log('成功', rs);
    //       resolve();
    //     }, err => {
    //       console.log('失败', err);
    //       resolve();
    //     });
    //   });
    // };//createMesh
    // Promise.all(meshs.map(m => {
    //   return limit(() => createMesh(m));
    // }));


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

    let package2SingleFileMap = {};
    //提取所有单文件
    for (let pck of allPackageNames) {
      let item = this.allAsset[pck];
      //顶级文件
      this._allSingleFileAsset[item.localPath] = new SingleAsset(item.localPath);
      package2SingleFileMap[item.package] = item.localPath;
      //source file
      if (item.srcFile && item.srcFile.localPath) {
        let f = new SingleAsset(item.srcFile.localPath);
        f._srcAsset = true;
        this._allSingleFileAsset[item.srcFile.localPath] = f;
      }
      //uncooked file
      if (item.unCookedFile && item.unCookedFile.localPath) {
        let f = new SingleAsset(item.unCookedFile.localPath);
        f._srcAsset = true;
        this._allSingleFileAsset[item.unCookedFile.localPath] = f;
      }
      //icon file
      let dcpPackageNames = Object.keys(item.dependencies);
      if (dcpPackageNames.length > 0) {
        let iconPck = dcpPackageNames.filter(x => x.indexOf('UploadIcons') > -1)[0];
        if (iconPck) {
          let iconItem = item.dependencies[iconPck];
          let f = new SingleAsset(iconItem.localPath);
          f._iconFile = true;
          this._allSingleFileAsset[iconItem.localPath] = f;
          //标记有图标
          item._iconLocalPath = iconItem.localPath;
        }
      }
    }//for

    let singleFileNames = Object.keys(this._allSingleFileAsset);

    let nodeJsAPIUploadFile = (localPath: string, server: string, callback: (err: any, data?: any) => void) => {
      let uploadReq = request.post(server, { auth: { bearer: this.cacheSrv.token }, headers: { fileExt: FileHelper.getFileExt(localPath), timeout: 600000 } }, (err, rs, body) => {
        if (rs.statusCode >= 300 || rs.statusCode < 200) {
          callback(rs.statusMessage);
          return;
        }
        callback(null, body);
      });
      fs.createReadStream(localPath).pipe(uploadReq);
    };//nodeJsUploadFile

    // 修正资源localPath可能出现的路径异常
    let fixLocalPathError = () => {
      singleFileNames.forEach(lcp => {
        let it = this._allSingleFileAsset[lcp];
        let idx = it.localPath.indexOf(this._projectFolderName);
        let tplocalStr = it.localPath.slice(idx + this._projectFolderName.length, it.localPath.length);
        //不知道ue4那边对文件路径分隔符是什么,都尝试一下
        let sep = '/';
        if (tplocalStr.indexOf(sep) == -1)
          sep = "\\";
        let tarr = tplocalStr.split(sep);
        let prjName = tarr.join(path.sep);
        it.localPath = this._projectDir + prjName;
      });//forEach
      return Promise.resolve();
    }//fixLocalPathError

    //检测文件修改时间信息,用来校验md5,不能只根据package记录md5,还应该加上修改时间
    let checkAssetStat = () => {
      this._uploadingProcessStep = 1;
      let limit = promiseLimit(20);
      let checkStat = (it: SingleAsset) => {
        return new Promise((resolve) => {
          if (it._modifiedTime) {
            resolve();
            return;
          }

          fs.stat(it.localPath, (err, stat) => {
            if (err) {
              //文件可能不存在,不可以直接终止程序
              console.warn(`发现文件不存在,具体路径为:${it.localPath}`);
              it._notExist = true;
              resolve();
              return;
            }
            it._modifiedTime = stat.mtime.getTime();
            it._size = stat.size;
            resolve();
          });//stat
        });
      };//checkStat
      return Promise.all(singleFileNames.map(lcp => {
        let it = this._allSingleFileAsset[lcp];
        return limit(() => checkStat(it));
      }));
    };//checkAssetStat

    //计算文件的md5信息
    let calcFileMD5 = () => {
      this._uploadingProcessStep = 2;
      let limit = promiseLimit(10);
      let calcMD5 = (it: SingleAsset) => {
        return new Promise((resolve, reject) => {
          if (it._notExist) {
            resolve();
            return;
          }

          if (it._md5) {
            resolve();
            return;
          }

          let _md5 = this.assetMd5CacheSrv.getMd5Cache(it.localPath, it._modifiedTime, it._size);
          // console.log(111, _md5);
          if (!_md5) {
            md5File(it.localPath, (err, hash) => {
              if (err) {
                reject(err.message);
                return;
              }
              it._md5 = hash;
              this.assetMd5CacheSrv.cacheMd5(it.localPath, hash, it._modifiedTime, it._size);
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
      return Promise.all(singleFileNames.map(lcp => {
        let it = this._allSingleFileAsset[lcp];
        return limit(() => calcMD5(it));
      }));
    };//calcFileMD5

    //上传icon
    let uploadIconFiles = () => {
      this._uploadingProcessStep = 3;
      let limit = promiseLimit(20);
      let uploadIcon = (it: SingleAsset) => {
        return new Promise((resolve, reject) => {
          if (it._notExist || !it._iconFile) {
            resolve();
            return;
          }

          nodeJsAPIUploadFile(it.localPath, `${this.configSrv.server}/oss/icons/stream`, (err, url) => {
            if (err) {
              console.error('上传图标异常:', err);
              resolve();
              return;
            }
            it._url = url;
            resolve();
          });//nodeJsAPIUploadFile
        });
      };//uploadIcon
      return Promise.all(singleFileNames.map(lcp => {
        let it = this._allSingleFileAsset[lcp];
        return limit(() => uploadIcon(it));
      }));
    };//uploadIconFiles

    let uploadSrcAssetFiles = () => {
      this._uploadingProcessStep = 4;
      let limit = promiseLimit(20);
      let uploadSrcFile = (it: SingleAsset) => {
        return new Promise((resolve, reject) => {
          if (it._notExist || !it._srcAsset) {
            resolve();
            return;
          }

          this.srcAssetSrv.checkFileExistByMd5(it._md5).subscribe(url => {
            if (url) {
              it._url = url;
              resolve();
              return;
            }

            nodeJsAPIUploadFile(it.localPath, `${this.configSrv.server}/oss/srcClientAssets/stream`, (err, url) => {
              if (err) {
                console.error('上传source file异常:', err);
                resolve();
                return;
              }
              // console.log(6, url);
              it._url = url;
              resolve();
            });//nodeJsAPIUploadFile
          }, err => {
            console.log("上传源文件异常:", err);
            resolve();
          });//subscribe
        });
      };//uploadSrcFile

      return Promise.all(singleFileNames.map(lcp => {
        let it = this._allSingleFileAsset[lcp];
        return limit(() => uploadSrcFile(it));
      }));
    };//uploadSrcAssetFiles

    //上传依赖文件
    let uploadSingleFiles = () => {
      this._uploadingProcessStep = 5;
      let limit = promiseLimit(20);
      let uploadFile = (it: SingleAsset) => {
        return new Promise((resolve, reject) => {
          if (it._notExist || it._iconFile || it._srcAsset) {
            resolve();
            return;
          }

          this.assetSrv.checkFileExistByMd5(it._md5).subscribe(url => {
            if (url) {
              it._url = url;
              resolve();
              return;
            }

            nodeJsAPIUploadFile(it.localPath, `${this.configSrv.server}/oss/files/stream`, (err, data) => {
              if (err) {
                console.error('上传依赖文件异常 nodejs:', err);
                resolve();
                return;
              }
              // console.log('sdfsdf', data, data.url);
              it._url = data.url;
              resolve();
            });//nodeJsAPIUploadFile
          }, err => {
            console.log("上传依赖文件异常 subscribe:", err);
            resolve();
          });//subscribe
        });//
      };//uploadFile
      return Promise.all(singleFileNames.map(lcp => {
        let it = this._allSingleFileAsset[lcp];
        return limit(() => uploadFile(it));
      }));
    };//uploadSingleFiles


    let createClientObject = () => {
      this._uploadingProcessStep = 6;
      let limit = promiseLimit(20);
      let createObj = (it: DataMap) => {
        return new Promise((resolve, reject) => {
          if (!it._clientAsset) {
            resolve();
            return;
          }

          if (it._objId) {
            resolve();
            return;
          }

          let clientAsset = {};
          clientAsset["name"] = it.name;
          let f = this._allSingleFileAsset[it.localPath];
          clientAsset["cookedAssetId"] = f._md5;
          clientAsset["packageName"] = it.package;
          if (it.srcFile && it.srcFile.localPath && this._allSingleFileAsset[it.srcFile.localPath]) {
            f = this._allSingleFileAsset[it.srcFile.localPath];
            clientAsset["sourceAssetId"] = f._md5;
          }
          if (it.unCookedFile && it.unCookedFile.localPath && this._allSingleFileAsset[it.unCookedFile.localPath]) {
            f = this._allSingleFileAsset[it.unCookedFile.localPath];
            clientAsset["unCookedAssetId"] = f._md5;
          }
          if (it._iconLocalPath) {
            f = this._allSingleFileAsset[it._iconLocalPath];
            clientAsset["icon"] = f._url;
          }
          if (it.dependencies) {
            let dependencyStr = "";
            let dcpNs = Object.keys(it.dependencies);
            if (dcpNs.length > 0) {
              for (let pck of dcpNs) {
                let lcp = package2SingleFileMap[pck];
                let f = this._allSingleFileAsset[lcp];
                //不存在的是icon
                if (f) {
                  dependencyStr += `${f._url},${pck};`;
                }
              }
              clientAsset["dependencies"] = dependencyStr;
            }

          }
          if (it.tags) {
            let propertyStr = "";
            let tgNs = Object.keys(it.tags);
            if (tgNs.length > 0) {
              for (let k of tgNs) {
                propertyStr += `${k}=${it.tags[k]};`;
              }
              clientAsset["properties"] = propertyStr;
            }
          }


          if (it.class.indexOf("World") > -1) {
            this.mapSrv.post(clientAsset as Map).subscribe(rs => {
              it._objId = rs.id;
              resolve();
            }, err => {
              console.error("Map创建异常:", err);
              resolve();
            });
            // resolve();
          }
          else if (it.class.indexOf("Texture") > -1) {
            this.textureSrv.post(clientAsset as Texture).subscribe(rs => {
              it._objId = rs.id;
              resolve();
            }, err => {
              console.error("Texture创建异常:", err);
              resolve();
            });
          }
          else if (it.class.indexOf("Material") > -1) {
            this.materialSrv.post(clientAsset as Material).subscribe(rs => {
              it._objId = rs.id;
              resolve();
            }, err => {
              console.error("Material创建异常:", err);
              resolve();
            });
          }
          else if (it.class.indexOf("StaticMesh") > -1) {
            clientAsset["createProduct"] = true;
            this.meshSrv.post(clientAsset as StaticMesh).subscribe(rs => {
              it._objId = rs.id;
              resolve();
            }, err => {
              console.error("StaticMesh创建异常:", err);
              resolve();
            });
          }
          else {
            console.error("什么,还有class为其他类型:", it.class);
            resolve();
          }
        });
      };//createObj
      return Promise.all(allPackageNames.map(pck => {
        let it = this.allAsset[pck];
        return limit(() => createObj(it));
      }));
    };//createClientObject

    fixLocalPathError().then(checkAssetStat).then(calcFileMD5).then(uploadIconFiles).then(uploadSrcAssetFiles).then(uploadSingleFiles).then(createClientObject).then(() => {
      this.messageSrv.operateSuccessfully();
      this._uploading = false;
      this.assetMd5CacheSrv.persistCache2File();
    }, err => {
      this._uploading = false;
      console.error('矮油,上传过程出现异常,详情为:', err);
    });


  }//upload


  confirmLeaveUploader() {
    this.dialogSrv.open(SimpleMessageDialogComponent, { width: '300px', height: '250px', data: { message: 'message.waitTilFinishUploadingBeforeLeaving' } });
  }//confirmLeaveUploader

}

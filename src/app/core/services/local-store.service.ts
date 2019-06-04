import { Injectable } from '@angular/core';

@Injectable()
export class LocalStoreService {

  constructor() { }

  /**
 * 存储信息
 * @param key 键
 * @param value 值
 */
  setItem(key: string, value: string) {
    if (typeof localStorage == 'undefined') return;
    localStorage.setItem(key, value);
  }//setItem

  /**
   * 获取存储信息
   * @param key 键
   */
  getItem(key: string) {
    if (typeof localStorage == 'undefined') return;
    return localStorage.getItem(key);
  }//getItem
}

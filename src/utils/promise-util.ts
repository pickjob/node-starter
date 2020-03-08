import * as util from 'util';
import * as fs from 'fs';
import { resolve } from 'dns';

export abstract class PromiseUtil {

    // 等待毫秒数
    static async delay(millisecond: number): Promise<void> {
        return util.promisify(setTimeout)(millisecond);
    }

    // 移动文件
    static async move(src: string, dest: string): Promise<void> {
        return util.promisify(fs.rename)(src, dest);
    }

    // 读取文件夹文件名
    static async readDir(dir: string): Promise<string[]> {
        const lstat = await util.promisify(fs.lstat)(dir);
        if (lstat.isDirectory()) {
            return util.promisify(fs.readdir)(dir);
        } else {
            return new Promise(resolve => {
                resolve([]);
            });
        }

    }
}
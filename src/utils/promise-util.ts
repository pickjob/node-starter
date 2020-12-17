import * as util from 'util';
import * as fs from 'fs';
import { exec, ExecOptions } from 'child_process';

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

    static async statFile(file: string): Promise<fs.Stats> {
        return util.promisify(fs.lstat)(file);
    }

    static async deleteFile(file: string): Promise<void> {
        return util.promisify(fs.unlink)(file);
    }

    static async exists(path: string): Promise<boolean> {
        return util.promisify(fs.exists)(path);
    }

    static async mk(path: string): Promise<void> {
        return util.promisify(fs.mkdir)(path, { recursive: true });
    }

    static async exec(command: string, options: ExecOptions): Promise<{ stdout: string, stderr: string }> {
        return util.promisify(exec)(command, options);
    }

}
import * as dotenv from 'dotenv';
import { GitHub } from './puppeteer/github';
import { LogUtil } from "./utils/log-utils";
// import { GitHub } from './puppeteer/github';

const logger = LogUtil.createLogger('app');
logger.info('loading dotenv file');
dotenv.config();
logger.info('hello, %s', 'node');
// let githubTask = async () => {
//     const github = new GitHub('pickjob');
//     await github.pullUserAllRepository();
// };
// githubTask().then(() => {
//     logger.info("正在退出程序...");
// });
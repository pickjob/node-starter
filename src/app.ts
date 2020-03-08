import * as dotnet from 'dotenv';
import { LogUtil } from "./utils/log-utils";

const logger = LogUtil.createLogger('app');
logger.info('loading .env');
dotnet.config();
logger.info('hello, %s', 'node');
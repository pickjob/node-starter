import * as dotnet from 'dotenv';
import * as LogUtils from "./utils/log-utils";

dotnet.config();
const logger = LogUtils.createLogger('index');
logger.info('hello, %s', 'world');
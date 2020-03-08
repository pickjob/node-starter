import { launch } from 'puppeteer-core';
import { LogUtil } from "../utils/log-utils";
import { MongoUtils } from '../utils/mongo-util';
import { PromiseUtil } from '../utils/promise-util';

const logger = LogUtil.createLogger('wallPaper');
const baseUrlPrefix = 'https://store.kde.org/browse/page/';
const baseUrlSufix = '/cat/299/ord/rating/';
const exePath = '';
const tmpPath = '';
const picPath = '';
const collectionName = 'wall-paper';

export abstract class WallPaper {

    static async waitDownload(fileName: string): Promise<void> {
        while (true) {
            await PromiseUtil.delay(10000);
            const files = await PromiseUtil.readDir(tmpPath);
            for (const file of files) {
                logger.debug(file);
                if (!file.endsWith('.crdownload')) {
                    await PromiseUtil.move(tmpPath + '/' + file, picPath + '/' + file);
                    await MongoUtils.insertOne(collectionName, { fileName: fileName });
                    logger.info(`${file} has been downloaded successfully.`);
                    return;
                }
            }
        }
    }

    static async run(): Promise<void> {
        const browser = await launch({ executablePath: exePath });
        let i = 0;
        while (true) {
            try {
                i++;
                if (i > 500) break;
                logger.info(`page: ${i}`)
                const url = baseUrlPrefix + i + baseUrlSufix;
                const page = await browser.newPage();
                await page.setDefaultTimeout(0);
                await page.setRequestInterception(true);
                page.on('request', interceptedRequest => {
                    if (interceptedRequest.url().endsWith('.png'))
                        interceptedRequest.abort();
                    else
                        interceptedRequest.continue();
                });
                logger.info(`goto url: ${url}`);
                page.goto(url)
                    .catch(err => {
                        logger.error(`${err.name}: ${err.message}`);
                    });
                logger.info('waiting for #product-browse-list-container');
                await page.waitForSelector('#product-browse-list-container');
                const containers = await page.$$('.product-browse-item');
                if (containers.length > 0) {
                    const imageUrls = [];
                    for (const container of containers) {
                        const url = await container.$eval('a', ele => {
                            return (ele as HTMLLinkElement).href;
                        });
                        imageUrls.push(url);
                    }
                    for (const imageUrl of imageUrls) {
                        try {
                            const imagePage = await browser.newPage();
                            const client = await imagePage.target().createCDPSession();
                            await client.send('Page.setDownloadBehavior', {
                                behavior: 'allow',
                                // This path must match the WORKSPACE_DIR in Step 1
                                downloadPath: tmpPath,
                            });
                            await imagePage.setDefaultTimeout(0);
                            logger.info(`goto url: ${imageUrl}`);
                            imagePage.goto(imageUrl)
                                .catch(err => {
                                    logger.error(`${err.name}: ${err.message}`);
                                });;
                            await imagePage.waitForSelector('table.table-ocs-file tbody tr');
                            logger.info('waiting for table.table-ocs-file tbody tr');
                            await imagePage.waitForSelector('a[href="#files-panel"]');
                            const filePannel = await imagePage.$('a[href="#files-panel"]');
                            if (filePannel) {
                                await filePannel.click();
                                PromiseUtil.delay(5000);
                                const fileTable = await imagePage.$('.table-ocs-file');
                                if (fileTable) {
                                    const fileTrs = await fileTable.$$('tbody tr');
                                    for (const fileTr of fileTrs) {
                                        try {
                                            const fileTds = await fileTr.$$('td');
                                            const fileName = await fileTds[0].$eval('a', e => {
                                                return (e as HTMLLinkElement).innerText;
                                            });
                                            let isExist = false;
                                            await MongoUtils.findAndExecute(collectionName, { fileName: fileName }, item => {
                                                isExist = true;
                                            });
                                            if (isExist) {
                                                logger.info(`${fileName} is existing.`);
                                                continue;
                                            }
                                            const downloadButton = await fileTds[6].$('a');
                                            if (downloadButton) {
                                                await downloadButton.click();
                                                await PromiseUtil.delay(10000);
                                                const childFrame = await imagePage.mainFrame().childFrames()[0];
                                                if (childFrame) {
                                                    await childFrame.waitForSelector("#Form1 button");
                                                    const button = await childFrame.$('#Form1 button');
                                                    if (button) {
                                                        await button.click();
                                                        await this.waitDownload(fileName);
                                                    }
                                                }
                                            }
                                        } catch (err) {
                                            logger.error(`${err.name}: ${err.message}`);
                                            continue;
                                        }
                                    }
                                }
                            }
                            await imagePage.close();
                        } catch (err) {
                            logger.error(`${err.name}: ${err.message}`);
                            continue;
                        }
                    }
                }
                await page.close();
            } catch (err) {
                logger.error(`${err.name}: ${err.message}`);
                continue;
            }
        }
        await browser.close();
    }
}
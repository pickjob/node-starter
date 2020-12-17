import { rejects } from 'assert';
import { Browser, launch, Page, ElementHandle } from 'puppeteer-core';
import { LogUtil } from "../utils/log-utils";
import { PromiseUtil } from '../utils/promise-util';

const logger = LogUtil.createLogger('gitHub');
const baseUrl = 'https://github.com'
const errorHandler = (err: Error) => {
    logger.error(`${err.name}: ${err.message}`);
}

export class GitHub {
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    async pullUserAllRepository(): Promise<void> {
        const page = await this.buildBroswerAndPage();
        if (page) {
            let reposUrl: string = `${baseUrl}/${this.name}?tab=repositories`;
            let repos = new Set<string>();
            while (true) {
                try {
                    logger.info(`repositoryUrl: ${reposUrl}`);
                    await page.goto(reposUrl).catch(errorHandler);
                    let eles = await this.findAllElementHandleByExpr(['#user-repositories-list ul li', '#org-repositories ul li'], page);
                    for (const ele of eles) {
                        const u = await ele.$$eval('A[itemprop="name codeRepository"]', eles => {
                            // return eles.map(e => e.tagName);
                            return (eles[0] as HTMLLinkElement).href;
                        }).catch(err => {
                            errorHandler(err);
                            return null;
                        });
                        if (u) {
                            // logger.info(`url: ${u}`);
                            repos.add(u);
                        }
                    }
                    reposUrl = await page.$eval('a.next_page', ele => {
                        return (ele as HTMLLinkElement).href;
                    }).catch(err => {
                        logger.error(`${err.name}: ${err.message}`);
                        return '';
                    });
                    if (reposUrl == '') {
                        break;
                    }
                } catch (err) {
                    logger.error(`${err.name}: ${err.message}`);
                    return;
                }
            }
            logger.info(`userName ${this.name} size: ${repos.size}`);
            await this.pullRepos(repos);
            await page.browser().close();
        }
    }

    async pullTopicRepository(): Promise<void> {
        const page = await this.buildBroswerAndPage();
        if (page) {
            const topicUrl = `${baseUrl}/topics/${this.name}`;
            logger.info(`topicUrl: ${topicUrl}`);
            let repos = new Set<string>();
            await page.goto(topicUrl).catch(errorHandler);
            await this.autoClickElement('article:nth-last-child(1)', 'button[type="submit"]', page);
            let eles = await this.findAllElementHandleByExpr(['article > div:nth-child(1)'], page);
            for (const ele of eles) {
                const u = await ele.$$eval('A', eles => {
                    // return eles.map(e => e.tagName);
                    return (eles[1] as HTMLLinkElement).href;
                }).catch(err => {
                    errorHandler(err);
                    return null;
                });
                if (u) {
                    // logger.info(`url: ${u}`);
                    repos.add(u);
                }
            }
            logger.info(`topicUrl ${topicUrl} size: ${repos.size}`);
            await this.pullRepos(repos);
            await page.browser().close();
        }
    }

    async findAllElementHandleByExpr(exps: string[], page: Page): Promise<ElementHandle[]> {
        let arr = [];
        for (const exp of exps) {
            arr.push(page.$$(exp));
        }
        const elementHandleArrayList = await Promise.all(arr);
        let result: ElementHandle[] = [];
        for (const elementHandleArray of elementHandleArrayList) {
            if (elementHandleArray.length > 0) {
                for (const elementHandle of elementHandleArray) {
                    result.push(elementHandle);
                }
            }
        }
        logger.info(`${exps} size: ${result.length}`)
        return new Promise((resolve) => {
            resolve(result);
        });
    }

    async autoClickElement(scrollViewExp: string, btnExp: string, page: Page): Promise<void> {
        let flag = false;
        while (true) {
            await page.evaluate((exp) => {
                let ele = document.querySelector(exp);
                if (ele) {
                    ele.scrollIntoView();
                }
                // window.scrollBy(0, window.innerHeight);
            }, scrollViewExp);
            await PromiseUtil.delay(1000);
            await page.click(btnExp)
                .catch(err => {
                    errorHandler(err);
                    flag = true;
                });
            await PromiseUtil.delay(4000);
            if (flag) {
                break;
            }
        }
    }

    async buildBroswerAndPage(): Promise<Page | void> {
        const browser = await launch({
            executablePath: process.env.CHROME_PATH
        }).catch(errorHandler);
        if (browser) {
            const page = await browser.newPage()
                .catch(errorHandler);
            return page;
        }
    }

    private async pullRepos(repos: Set<string>): Promise<void> {
        const exists = await PromiseUtil.exists(process.env.REPOS_PATH + "");
        if (!exists) {
            logger.info(`mkdir ${process.env.REPOS_PATH}`)
            await PromiseUtil.mk(process.env.REPOS_PATH + "");
        }
        for (const repo of repos) {
            logger.info(`git clone url: ${repo}`);
            await PromiseUtil.exec(`git clone  ${repo}`, {
                cwd: process.env.REPOS_PATH
            }).catch(errorHandler);
        }
    }
}
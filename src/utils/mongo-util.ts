import { MongoClient, Db } from "mongodb";
import { LogUtil } from "../utils/log-utils";

const logger = LogUtil.createLogger('mongoUtil');

export abstract class MongoUtils {
    private static _client: MongoClient;
    private static _db?: Db;
    private static isInit: boolean = false;

    static async init() {
        logger.info(`mongoUrl: ${process.env.MONGO_URL}`)
        this._client = new MongoClient(process.env.MONGO_URL ? process.env.MONGO_URL : '', {
            useUnifiedTopology: true
        });
        await this._client.connect();
        this._db = this._client.db(process.env.MONGO_DB);
    }

    static async insertOne(collectionName: string, data: Object) {
        if (!this.isInit) {
            await this.init();
            this.isInit = true;
        }
        if (this._db) {
            let collection = this._db.collection(collectionName);
            await collection.insertOne(data);
        } else {
            throw new Error('Can not connect to mongodb');
        }
    }

    static async findAndExecute(collectionName: string, param: Object, callback: (obj: object) => void) {
        if (!this.isInit) {
            await this.init();
            this.isInit = true;
        }
        if (this._db) {
            let collection = this._db.collection(collectionName);
            let list: object[] = await collection.find(param).toArray();
            for (let obj of list) {
                callback(obj);
            }
        } else {
            throw new Error('Can not connect to mongodb');
        }
    }

    static async close() {
        this.isInit = false;
        await this._client.close();
    }
}
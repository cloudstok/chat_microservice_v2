import { type PoolConnection, type PoolOptions, createPool } from "mysql2/promise";
import { sleep } from "bun";
import { configTable } from "./tables";
import type { ILoadDBConfigData, TableCategory } from "../interfaces";

export let DB_TABLES_LIST: string[] = [];
export let DB_TABLES_CAT: Record<TableCategory, string[]>;

export class DbConnectRead {
    static readInstance: DbConnectRead;
    maxRetryCount: number;
    retryCount: number = 0;
    protected pool!: PoolConnection;
    dbConfig: PoolOptions;

    constructor() {
        this.dbConfig = {
            host: process.env.DB_READ_HOST,
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || "",
        };
        this.maxRetryCount = Number(process.env.DB_MAX_RETRIES) || 5;
    };


    static getReadInstance() {
        if (!this.readInstance) this.readInstance = new DbConnectRead();
        return this.readInstance;
    }

    async initDbPoolConnection() {
        console.log("try number", this.retryCount);
        try {

            this.pool = await createPool(this.dbConfig).getConnection();
            if (!this.pool) throw new Error("unable to connect");

            await this.pool.execute(configTable)

            console.log("DB Connection Successful");
            this.retryCount = 0;

            return;
        } catch (error: any) {

            this.retryCount++
            console.error("error occured", error.message, " retry count number", this.retryCount);

            if (this.retryCount > this.maxRetryCount) process.exit(1);
            else {
                await sleep(1000);
                await this.initDbPoolConnection();
            }
        }
    }

    async loadDbTablesList() {
        const [configs]: any = await this.pool.query(`select * from config_master where is_active = true`);
        configs.forEach((e: ILoadDBConfigData) => {
            switch (e.data_key) {
                case "db_tables_list": DB_TABLES_LIST = e.value as string[]; break;
                case "db_tables_cat": DB_TABLES_CAT = e.value as Record<string, string[]>; break;
                default: break;
            }
        });
        console.log({ DB_TABLES_LIST, DB_TABLES_CAT });
        return;
    }

    async getPool() {
        if (!this.pool) { console.log("pool not found"); await this.initDbPoolConnection(); }
        return this.pool;
    }
}

export class DbConnectWrite {
    static writeInstance: DbConnectWrite;
    maxRetryCount: number;
    retryCount: number = 0;
    protected pool!: PoolConnection;
    dbConfig: PoolOptions;

    constructor() {
        this.dbConfig = {
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || "",
        };
        this.maxRetryCount = Number(process.env.DB_MAX_RETRIES) || 5;
    };


    static getWriteInstance() {
        if (!this.writeInstance) this.writeInstance = new DbConnectWrite();
        return this.writeInstance;
    }

    async initDbPoolConnection() {
        console.log("try number", this.retryCount);
        try {

            this.pool = await createPool(this.dbConfig).getConnection();
            if (!this.pool) throw new Error("unable to connect");

            await this.pool.execute(configTable)

            console.log("DB Connection Successful");
            this.retryCount = 0;

            return;
        } catch (error: any) {

            this.retryCount++
            console.error("error occured", error.message, " retry count number", this.retryCount);

            if (this.retryCount > this.maxRetryCount) process.exit(1);
            else {
                await sleep(1000);
                await this.initDbPoolConnection();
            }
        }
    }

    async getPool() {
        if (!this.pool) { console.log("pool not found"); await this.initDbPoolConnection(); }
        return this.pool;
    }
}
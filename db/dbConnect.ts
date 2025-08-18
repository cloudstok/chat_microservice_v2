import { type PoolConnection, type PoolOptions, createPool } from "mysql2/promise";
import { sleep } from "bun";
import { dbConfigTable } from "./tables";
import type { ILoadDBConfigData } from "../interfaces";

export let DB_TABLES_LIST: string[] = [];

export class DbConnect {
    static instance: DbConnect
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

    static getInstance() {
        if (!this.instance) this.instance = new DbConnect();
        return this.instance;
    }

    async initDbPoolConnection() {
        console.log("try number", this.retryCount);
        try {

            this.pool = await createPool(this.dbConfig).getConnection();
            if (!this.pool) throw new Error("unable to connect");

            await this.pool.execute(dbConfigTable)

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
        const [configs]: any = await this.pool.query(`select * from db_config where is_active = true`);
        configs.forEach((e: ILoadDBConfigData) => {
            DB_TABLES_LIST = e.value
        });
        console.log(DB_TABLES_LIST);
        return;
    }

    async getPool() {
        if (!this.pool) { console.log("pool not found"); await this.initDbPoolConnection(); }
        return this.pool;
    }
}
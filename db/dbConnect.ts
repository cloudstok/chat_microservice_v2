import { type PoolConnection, type PoolOptions, createPool } from "mysql2/promise";
import { sleep } from "bun";
import { configTable } from "./tables";
import type { ILoadDBConfigData, TableCategory, TPool } from "../interfaces";

export let DB_TABLES_LIST: string[] = [];
export let DB_TABLES_CAT: Record<TableCategory, string[]>;

export class DbConnect {
    static instance: DbConnect;
    protected rPool!: PoolConnection;
    protected wPool!: PoolConnection;
    dbReadConfig: PoolOptions;
    dbWriteConfig: PoolOptions;
    maxRetryCount: number;
    retryCount: number = 0;

    constructor() {
        this.dbReadConfig = {
            host: process.env.DB_READ_HOST,
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || "",
        };
        this.dbWriteConfig = {
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

    async initDbPools() {
        let r = await this.initDbPoolConnection("READ")
        if (r) this.rPool = r;
        let w = await this.initDbPoolConnection("WRITE");
        if (w) this.wPool = w;

    }

    async initDbPoolConnection(poolType: TPool): Promise<PoolConnection | undefined> {
        try {

            let config;
            if (poolType == "READ") config = this.dbReadConfig;
            else config = this.dbWriteConfig

            const pool = await createPool(config).getConnection();
            if (!pool) throw new Error("unable to connect");

            if (poolType == "WRITE") await pool.execute(configTable)
            this.retryCount = 0;

            console.log("DB Connection Successful for", poolType, "try number", this.retryCount);

            return pool;
        } catch (error: any) {

            this.retryCount++
            console.error("error occured", error.message, " retry count number", this.retryCount);

            if (this.retryCount > this.maxRetryCount) process.exit(1);
            else {
                await sleep(1000);
                await this.initDbPoolConnection(poolType);
            }
        }
    }

    async loadDbTablesList() {
        const [configs]: any = await this.rPool.query(`select * from config_master where is_active = true`);
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

    async getPool(poolType: TPool) {
        switch (poolType) {
            case "READ": {
                if (!this.rPool) {
                    console.log("pool not found");
                    let r = await this.initDbPoolConnection("READ");
                    if (r) this.rPool = r;
                }
                return this.rPool;
            }
            case "WRITE": {
                if (!this.wPool) {
                    console.log("pool not found");
                    let w = await this.initDbPoolConnection("WRITE");
                    if (w) this.rPool = w
                }
                return this.wPool;
            }

        }

    }
};
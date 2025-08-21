import type { PoolConnection } from "mysql2/promise";
import { dbRead, dbWrite } from "..";
import { getTableQuery } from "../db/tables";

export class TablesService {
    wPool!: PoolConnection;
    rPool!: PoolConnection;
    getTableQuery: (tableName: string) => string;
    constructor() {
        this.getTableQuery = getTableQuery;
        (async () => {
            this.rPool = await dbRead.getPool();
            this.wPool = await dbWrite.getPool()
        })();
    }

    async tableExits(dbName: string, tableName: string): Promise<boolean> {
        try {
            const [tablesList]: any = await this.rPool.query(`show tables;`);

            const ifExits = tablesList.find((e: any) => e[`Tables_in_${dbName}`] == tableName);
            if (ifExits) return true;

            return false;
        } catch (error: any) {
            console.error("error occured:", error.message);
            return false
        }
    }

    async createNewTable(table: string) {
        const query = this.getTableQuery(table);
        const [r]: any = await this.wPool.execute(query);
        return r;
    }

    async updateTablesList() {
        return await dbRead.loadDbTablesList();
    }
}
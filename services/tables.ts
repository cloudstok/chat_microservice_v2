import type { PoolConnection } from "mysql2/promise";
import { dbInstance } from "..";
import { getTableQuery } from "../db/tables";

export class TablesService {
    pool!: PoolConnection;
    getTableQuery: (tableName: string) => string;
    constructor() {
        this.getTableQuery = getTableQuery;
        (async () => { this.pool = await dbInstance.getPool(); })();
    }

    async tableExits(dbName: string, tableName: string): Promise<boolean> {
        try {
            const [tablesList]: any = await this.pool.query(`show tables;`);

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
        const [r]: any = await this.pool.execute(query);
        return r;
    }

    async updateTablesList() {
        return await dbInstance.loadDbTablesList();
    }
}
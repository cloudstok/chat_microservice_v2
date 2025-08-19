import type { PoolConnection } from "mysql2/promise";
import { dbInstance } from "..";
import { DB_TABLES_CAT } from "../db/dbConnect";

export class TablesService {
    pool!: PoolConnection;
    constructor() {
        (async () => { this.pool = await dbInstance.getPool(); })();
    }

    getTableQuery(tableName: string): string {
        const query = {
            like: `CREATE TABLE IF NOT EXISTS ${tableName} (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id VARCHAR(128) NOT NULL,
            operator_id VARCHAR(64) NOT NULL,
            avatar INT DEFAULT NULL,
            msg TEXT DEFAULT NULL,
            gif TEXT DEFAULT NULL,
            user_likes json DEFAULT null,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );`,
            no_like: `CREATE TABLE IF NOT EXISTS ${tableName} (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id VARCHAR(128) NOT NULL,
            operator_id VARCHAR(64) NOT NULL,
            avatar INT DEFAULT NULL,
            msg TEXT DEFAULT NULL,
            gif TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );`
        }
        let returnQuery = ""
        DB_TABLES_CAT["like"].includes(tableName) ? returnQuery = query["like"] : returnQuery = query["no_like"]
        return returnQuery; // default with like
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
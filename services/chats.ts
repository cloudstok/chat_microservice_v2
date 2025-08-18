import type { PoolConnection } from "mysql2/promise";
import { dbInstance } from "..";

export class ChatService {
    private pool!: PoolConnection
    constructor() {
        (async () => { this.pool = await dbInstance.getPool(); })();
    }
    async create(game: string, args: any) {
        const query = `insert into ${game} (${Object.keys(args).join(", ")}) values (${Object.values(args).map(() => " ?").join(",")})`;
        console.log(query);
        const [data]: any = await this.pool.execute(query, Object.values(args));
        return data.insertId;
    }
    async loadChats(table: string) {
        const query = `select * from ${table} order by created_at desc limit 50`;
        const [chats]: any = await this.pool.query(query);
        return chats.reverse();
    }
    async deleteOldChats(table: string) {
        const query = `delete from ${table} where created_at <= now() - interval '2 days'`;
        const [r]: any = await this.pool.execute(query);
        return r;
    }

}
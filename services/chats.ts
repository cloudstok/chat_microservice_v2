import type { PoolConnection } from "mysql2/promise";
import { dbRead, dbWrite } from "..";

export class ChatService {
    private rPool!: PoolConnection
    private wPool!: PoolConnection
    constructor() {
        (async () => {
            this.rPool = await dbRead.getPool();
            this.wPool = await dbWrite.getPool()
        })();
    }
    async create(game: string, args: any) {
        const query = `insert into ${game} (${Object.keys(args).join(", ")}) values (${Object.values(args).map(() => " ?").join(",")})`;
        console.log(query);
        const [data]: any = await this.wPool.execute(query, Object.values(args));
        return data.insertId;
    }
    async getMsg(game: string, msgId: string | number) {
        const query = `select * from ${game} where id = ?`;
        const [data]: any = await this.rPool.query(query, [msgId]);
        return data[0];
    }
    async likeMsg(game: string, msgId: string | number, likes: { user_id: string, operatorId: string }[]) {
        const query = `update ${game} set user_likes = ? where id = ?`;
        const [data]: any = await this.wPool.execute(query, [likes, msgId]);
        return data;
    }
    async loadChats(table: string, limit: number = 50, offset: number = 0) {
        const query = `select * from ${table} order by created_at desc limit ${limit} offset ${offset}`;
        const [chats]: any = await this.rPool.query(query);
        return chats.reverse();
    }
    async deleteOldChats(table: string) {
        const query = `delete from ${table} where created_at <= now() - interval 2 day;`;
        const [r]: any = await this.wPool.execute(query);
        return r;
    }

}
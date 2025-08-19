import { createClient, type RedisClientType, } from "redis";
import { sleep } from "bun";

export class RedisClient {
    connection!: RedisClientType;
    maxRetries: number = 5;
    retryCount = 0;
    host: string = process.env.REDIS_HOST || "localhost";
    port: string = process.env.REDIS_PORT || "6379";
    pass: string = process.env.REDIS_PASSWORD || "";

    async connect(): Promise<void> {
        try {

            this.connection = createClient({
                url: `redis://${this.host}:${this.port}`,
                password: this.pass,
            });
            this.connection.on("error", async (err) => {
                console.error("Redis Client Error", err.message);
                await this.handleReconnect();
            });

            await this.connection.connect();
            if (this.connection) console.info("redis connection successful");

            return;
        } catch (error: any) {
            console.error("error", error.message);
            await this.handleReconnect()
        }
    }

    async handleReconnect() {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            await sleep(1000);
            return await this.connect();
        } else {
            console.error("max retries exceeded, redis connection failed");
            return process.exit(1);
        }
    }

    async checkConnection() { if (!this.connection) await this.connect(); }

    async getCache(key: string) {
        await this.checkConnection();
        const data = await this.connection.get(key);
        return data && typeof data === "string" ? JSON.parse(data) : null;

    }
    async setCache(key: string, data: any, ttl = 3600) {
        await this.checkConnection();
        return (await this.connection.set(key, typeof data !== "string" ? JSON.stringify(data) : data, { EX: ttl })) || null;
    }
    async delCache(key: string) {
        await this.checkConnection();
        return (await this.connection.del(key)) || null;
    }

    async incCount(room: string): Promise<number> {
        await this.checkConnection();
        return await this.connection.incr(room);
    }

    async decCount(room: string): Promise<number> {
        await this.checkConnection();
        return await this.connection.decr(room);
    }

    async pub(channel: string, msg: string) {
        return await this.connection.publish(channel, msg)
    }
    async sub(channel: string, callback: () => Promise<any>) {
        return await this.connection.subscribe(channel, callback);
    }
}

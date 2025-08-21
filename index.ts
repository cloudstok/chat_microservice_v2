import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import { config } from "dotenv";
import { DbConnectRead, DbConnectWrite } from "./db/dbConnect";
import { RedisClient } from "./cache/redis.ts";
import { ChatHandler } from "./handlers/chat";
import { checkAuth } from "./middlewares/socketAuth.ts";
import { socketRouter } from "./routes/socket.ts";
import { startJobs } from "./jobs/cron.ts";
import { router as indexRouter } from "./routes/index.ts";

config({ path: ".env" });

const PORT = process.env.PORT;
export const app = express();
export const httpServer = http.createServer(app);
export const serverIo = new Server(httpServer, { cors: { origin: "*" } })
export const redis = new RedisClient();
export let dbRead: DbConnectRead = DbConnectRead.getReadInstance();
export let dbWrite: DbConnectWrite = DbConnectWrite.getWriteInstance();
export let chat: ChatHandler;

(async () => {
    await dbRead.initDbPoolConnection();
    await dbRead.loadDbTablesList();
    await dbWrite.initDbPoolConnection();
    await redis.connect();
    chat = new ChatHandler(serverIo, redis);
    startJobs();
})();

serverIo
    .use(async (s: Socket, n: Function) => await checkAuth(s, n))
    .on("connection", async (s: Socket) => await socketRouter(serverIo, s));

app.use("/", indexRouter);

httpServer.listen(PORT, () => console.log("server running on port", PORT));

// let x = {
//     DB_TABLES_LIST: ["aviator", "jetx", "rocket_queen", "tropicana", "cricketx", "crashRoyale", "astronaut"],
//     DB_TABLES_CAT: {
//         like_gif: ["aviator"],
//         like_no_gif: [],
//         no_like_gif: ["rocket_queen", "tropicana", "astronaut"],
//         no_like_no_gif: ["jetx", "crash_royale", "cricketx"],
//     },
// }

// console.log(JSON.stringify(x));
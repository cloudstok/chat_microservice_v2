import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import { config } from "dotenv";
import { DbConnect } from "./db/dbConnect";
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
export let dbInstance: DbConnect = DbConnect.getInstance();
export let chat: ChatHandler;

(async () => {
    await dbInstance.initDbPoolConnection();
    await dbInstance.loadDbTablesList();
    await redis.connect();
    chat = new ChatHandler(serverIo, redis);
    startJobs();
})();

serverIo
    .use(async (s: Socket, n: Function) => await checkAuth(s, n))
    .on("connection", async (s: Socket) => await socketRouter(serverIo, s));

app.use("/", indexRouter);

httpServer.listen(PORT, () => console.log("server running on port", PORT));
import { Socket, type Server } from "socket.io";
import type { RedisClient } from "../cache/redis";
import { DB_TABLES_CAT, DB_TABLES_LIST, DB_TABLES_LIST as roomsList } from "../db/dbConnect";
import { ChatService } from "../services/chats";
import type { IChatMsg, TableCategory } from "../interfaces";
import { TablesService } from "../services/tables";
import { getRandomAvatarIndex } from "../utils/avatar";

export class ChatHandler {
    private io: Server;
    private redis: RedisClient;
    private chatService: ChatService;
    private tablesService: TablesService;
    private dbName: string;

    constructor(io: Server, redis: RedisClient) {
        this.io = io
        this.redis = redis;
        this.dbName = process.env.DB_NAME || "chat_service";
        this.chatService = new ChatService();
        this.tablesService = new TablesService();
    }

    private async incrementRoomCount(room: string) {
        return await this.redis.incCount(`PlCount:${room}`);
    }

    private async decrementRoomCount(room: string) {
        return await this.redis.decCount(`PlCount:${room}`);
    }

    private emitMsg(room: string, msg: any) {
        return this.io.to(room).emit("Msg", msg);
    }
    private emitChatToRoom(room: string, chats: IChatMsg[]) {
        return this.io.to(room).emit("Chats", chats);
    }
    private emitErr(socket: Socket, errMsg: string) {
        return socket.emit("Error", errMsg);
    }

    async joinRoom(socket: Socket, room: string) {
        if (!DB_TABLES_LIST.includes(room)) return this.emitErr(socket, "room doesn't exists/ invalid room id");
        if (socket.rooms.has(room)) return this.emitErr(socket, "already joined the room");
        if (socket.rooms.size >= 2) return this.emitErr(socket, "already present in another room");
        socket.join(room);
        this.io.to(room).emit("PlCount", await this.incrementRoomCount(room))
        // this.emitMsg(room, `${socket.id} joined the room`);
        await this.getRoomMsgs(socket, room);
        return;
    }

    async leaveRoom(socket: Socket, room?: string) {
        let roomsToLeave = [];
        if (room && !socket.rooms.has(room)) return this.emitErr(socket, "already left the room");
        if (room && !roomsList.includes(room)) return this.emitErr(socket, "invalid room")
        else roomsToLeave.push(room)

        if (!room) {
            roomsToLeave = [...roomsToLeave, ...socket.rooms];
            roomsToLeave = roomsToLeave.filter(room => room !== socket.id);
        }
        console.log({ roomsToLeave, socketRooms: socket.rooms });

        for (const room of roomsToLeave) {
            if (room) {
                await socket.leave(room);
                this.io.to(room).emit("PlCount", await this.decrementRoomCount(room))
                this.emitMsg(room, `${socket.id} left the ${room} room`)
            }
        }
        console.log("after leave", socket.rooms);
        return;
    }

    async sendMsg(socket: Socket, data: string) {
        const [room, urId, operatorId, ...m] = data.split(":");
        const msg = m.join(":");
        console.log("this.sendMsg called", room, msg, socket.id);

        if (!DB_TABLES_LIST.includes(room))
            return this.emitErr(socket, "room doesn't exist / invalid room id");

        if (!socket.rooms.has(room))
            return this.emitErr(socket, "room not joined yet");

        const chats = await this.getChats(room);
        if (chats.length >= 50) chats.shift(); // keep last 50

        const isUrl = /^https?:\/\//.test(msg);

        const userMsg = {
            user_id: urId,
            operator_id: operatorId,
            avatar: getRandomAvatarIndex(urId),
        } as unknown as IChatMsg;

        for (const cat of Object.keys(DB_TABLES_CAT) as TableCategory[]) {
            if (DB_TABLES_CAT[cat].includes(room)) {
                switch (cat) {
                    case "like_gif":
                        userMsg.user_likes = [];
                        userMsg.msg = isUrl ? "" : msg;
                        userMsg.gif = isUrl ? msg : "";
                        break;
                    case "no_like_gif":
                        userMsg.msg = isUrl ? "" : msg;
                        userMsg.gif = isUrl ? msg : "";
                        break;
                    case "like_no_gif":
                        if (isUrl) return this.emitErr(socket, "gifs are not allowed in this chat room")
                        userMsg.user_likes = [];
                        userMsg.msg = msg;
                        break;
                    case "no_like_no_gif":
                        if (isUrl) return this.emitErr(socket, "gifs are not allowed in this chat room")
                        userMsg.msg = msg;
                        break;
                }
                break; // stop after first match
            }
        }

        // const exists = await this.tablesService.tableExits(this.dbName, room);
        // if (!exists) await this.tablesService.createNewTable(room);

        const id = await this.chatService.create(room, userMsg);
        if (!id) return this.emitErr(socket, "unable to send message");

        userMsg.id = id;
        userMsg.created_at = new Date().toISOString();

        chats.push(userMsg);
        await this.redis.setCache(room, chats);

        return this.emitMsg(room, userMsg);
    }


    async likeMsg(socket: Socket, data: string) {

        const [room, urId, operatorId, msgId] = data.split(":");

        if (!DB_TABLES_LIST.includes(room)) return this.emitErr(socket, "room doesn't exists/ invalid room id");
        if (!DB_TABLES_CAT.like_gif.includes(room) && !DB_TABLES_CAT.like_no_gif.includes(room)) return this.emitErr(socket, "not allowed to like msg in this chat room")
        if (!socket.rooms.has(room)) return this.emitErr(socket, "room not joined yet");
        if (!msgId) return this.emitErr(socket, "invalid msg id");

        const msgFromDb: IChatMsg = await this.chatService.getMsg(room, msgId);
        if (!msgFromDb) return this.emitErr(socket, "msg with id not found");

        const like: { user_id: string, operator_id: string } = { user_id: urId, operator_id: operatorId }
        if (Array.isArray(msgFromDb.user_likes) && msgFromDb.user_likes.length) {
            const isAlreadyLiked = msgFromDb.user_likes.find(e => e.user_id == urId && e.operator_id == operatorId);
            if (isAlreadyLiked) return this.emitErr(socket, "already liked!");
            msgFromDb.user_likes.push(like)
        }
        else msgFromDb.user_likes = [like];

        await this.chatService.likeMsg(room, msgId, msgFromDb.user_likes)

        const chats = await this.getChats(room);
        const msgIdx = chats.findIndex(m => m.id == msgFromDb.id);
        chats[msgIdx] = {
            ...chats[msgIdx],
            user_likes: msgFromDb.user_likes,
        }

        await this.redis.setCache(room, chats);
        this.emitChatToRoom(room, chats);

        return;
    }

    async getRoomMsgs(socket: Socket, room: string): Promise<void> {
        const chats = await this.getChats(room);
        socket.emit("Chats", chats);
        return
    }

    async getChats(room: string): Promise<IChatMsg[]> {
        let chats = await this.redis.getCache(room);
        if (!chats || !Array.isArray(chats) || chats.length < 50) {
            const exists = await this.tablesService.tableExits(this.dbName, room)
            if (!exists) await this.tablesService.createNewTable(room);
            chats = await this.chatService.loadChats(room);
            await this.redis.setCache(room, chats);
        }
        return chats || [];
    }

}


import { Socket, type Server } from "socket.io";
import type { RedisClient } from "../cache/redis";
import { DB_TABLES_LIST, DB_TABLES_LIST as roomsList } from "../db/dbConnect";
import { ChatService } from "../services/chats";
import type { IChatMsg, Info } from "../interfaces";
import { TablesService } from "../services/tables";

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
    private emitErr(socket: Socket, errMsg: string) {
        return socket.emit("Error", errMsg);
    }

    async joinRoom(socket: Socket, room: string) {
        if (!DB_TABLES_LIST.includes(room)) return this.emitErr(socket, "room doesn't exists/ invalid room id");
        if (socket.rooms.has(room)) return this.emitErr(socket, "already joined the room");
        if (socket.rooms.size >= 2) return this.emitErr(socket, "already present in another room");
        socket.join(room);
        this.io.to(room).emit("PlCount", await this.incrementRoomCount(room))
        this.emitMsg(room, `${socket.id} joined the room`);
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

        const [room, msg] = data.split(":");
        console.log("this.sendMsg called", room, msg, socket.id)
        if (!DB_TABLES_LIST.includes(room)) return this.emitErr(socket, "room doesn't exists/ invalid room id");
        if (!socket.rooms.has(room)) return this.emitErr(socket, "room not joined yet");

        const infoKey = socket.id;
        const info: Info = await this.redis.getCache(infoKey);
        if (!info) return this.emitErr(socket, "user details not found");

        const chats = await this.getChats(room);
        const userMsg: IChatMsg = {
            user_id: info.urId,
            operator_id: info.operatorId,
            avatar: info.avatar || 0,
            // name: info.urNm,
            msg: msg,
            gif: msg,
            user_likes: []
        }
        chats.shift();
        chats.push({ ...userMsg, created_at: new Date().toISOString() });
        await this.redis.setCache(room, chats);

        const exists = await this.tablesService.tableExits(this.dbName, room);
        if (!exists) {
            await this.tablesService.createNewTable(room);
        }
        await this.chatService.create(room, userMsg);

        this.emitMsg(room, { ...userMsg, created_at: new Date().toISOString() });
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
            chats = await this.chatService.loadChats(room);
            await this.redis.setCache(room, chats);
        }
        return chats || [];
    }

}


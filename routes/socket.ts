import type { Server, Socket } from "socket.io";
import { chat } from "..";
import type { ISendMsgPayload } from "../interfaces";

export const socketRouter = async (io: Server, socket: Socket) => {
    try {

        console.log(socket.id, "connected");

        socket.on("join", async (room) => await chat.joinRoom(socket, room));
        socket.on("leave", async (room) => await chat.leaveRoom(socket, room));
        socket.on("send", async (data) => await chat.sendMsg(socket, data));
        socket.on("like", async (data) => await chat.likeMsg(socket, data));
        socket.on("load_chats", async (data) => await chat.getOldChats(socket, data))

        socket.on("disconnect", async () => {
            await chat.leaveRoom(socket, { room: "" });
            console.log(socket.id, "disconnected")
        })

    } catch (error: any) {
        console.error("error occured:", error.message)
    }
}
import type { Server, Socket } from "socket.io";
import { chat } from "..";

export const socketRouter = async (io: Server, socket: Socket) => {
    try {

        console.log(socket.id, "connected");

        socket.on("join", async (room: string) => await chat.joinRoom(socket, room));
        socket.on("leave", async (room: string) => await chat.leaveRoom(socket, room));
        socket.on("send", async (data: string) => await chat.sendMsg(socket, data));

        socket.on("disconnect", async () => {
            await chat.leaveRoom(socket);
            console.log(socket.id, "disconnected")
        })


    } catch (error: any) {
        console.error("error occured:", error.message)
    }
}
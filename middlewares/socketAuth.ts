import type { IUserDetailResponse } from "../interfaces";
import { Socket } from "socket.io";

export const checkAuth = async (socket: Socket, next: Function) => {
    try {
        const token: string = socket.handshake.query?.token as string;
        if (!token) return next(new Error("Authentication error: Invalid token"));

        const newUser = await getUserDetail({ token });
        if (!newUser || newUser.status === false) {
            console.log("Authentication failed: User not found or invalid token");
            return next(
                new Error("Authentication error: Failed to authenticate user")
            );
        }

        next();
    } catch (error: any) {
        console.error("Authentication error:", error.message);
        next(new Error("Authentication error: " + error.message));
    }
};

export const getUserDetail = async ({ token }: { token: string }): Promise<IUserDetailResponse> => {
    const url = `${process.env.service_base_url}/service/user/detail`;
    try {
        if (!token) throw new Error("Invalid token");
        const resp = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json", token },
        });
        if (!resp.ok) {
            throw new Error(`HTTP error! status: ${resp.status}`);
        }
        const respJson = (await resp.json()) as IUserDetailResponse;
        if (respJson.status === false) {
            throw new Error("Invalid token or user not found");
        }
        return respJson;
    } catch (error: any) {
        console.error("Error fetching user details:", error.message);
        throw error;
    }
};

export const getUserIP = (socket: any): string => {
    const forwardedFor = socket.handshake.headers?.["x-forwarded-for"];
    if (forwardedFor) {
        const ip = forwardedFor.split(",")[0].trim();
        if (ip) return ip;
    }
    return socket.handshake.address || "";
};

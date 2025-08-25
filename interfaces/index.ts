export interface IUserDetailResponse {
    status: boolean;
    user: {
        user_id: string;
        name: string;
        balance: number;
        avatar: number;
        operatorId: string;
    };
}

export interface Info {
    urId: string;
    urNm: string;
    bl: number;
    operatorId: string;
    ip: string;
    avatar: number
}

export type TRedisConfig = {
    host: string;
    port: number;
    password: string;
}

export type TableCategory = "old_crash" | "like_gif" | "no_like_gif" | "like_no_gif" | "no_like_no_gif";
export type TPool = "READ" | "WRITE";
export interface ILoadConfigData {
    id: number;
    data_key: string;
    is_active: number;
    created_at: Date;
    updated_at: Date;
}

export interface ILoadDBConfigData extends ILoadConfigData {
    value: string[] | Record<string, string[]>;
}

export interface IChatMsg {
    id: number;
    user_id: string,
    operator_id: string,
    avatar: number,
    msg: string,
    gif?: string,
    user_likes?: any[],
    created_at?: string
}

export interface ISendMsgPayload {
    room: string; urId: string; operatorId: string; avtr: number | string; msg: string; gif: string;
}

export interface ILikeMsgPayload {
    room: string; urId: string; operatorId: string; msgId: number;
}   
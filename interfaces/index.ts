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

export interface ILoadConfigData {
    id: number;
    data_key: string;
    is_active: number;
    created_at: Date;
    updated_at: Date;
}

export interface ILoadDBConfigData extends ILoadConfigData {
    value: string[];
}

export interface IChatMsg {
    user_id: string,
    operator_id: string,
    avatar: number,
    // name: string,
    msg: string,
    gif: string,
    user_likes: any[],
    created_at?: string
}
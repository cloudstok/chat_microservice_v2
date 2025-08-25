import type { TableCategory } from "../interfaces";
import { DB_TABLES_CAT } from "./dbConnect";

export const configTable = `
create table if not exists config_master(
    id int auto_increment primary key,
    data_key varchar(50) not null,
    value json not null,
    is_active bool default true,
    created_at timestamp default current_timestamp
);`;

export const getTableQuery = (tableName: string): string => {
    const tableQuery: Record<TableCategory, string> = {
        old_crash: `CREATE TABLE IF NOT EXISTS ${tableName} (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id VARCHAR(128) NOT NULL,
            operator_id VARCHAR(64) NOT NULL,
            avatar TEXT DEFAULT NULL,
            msg TEXT DEFAULT NULL,
            gif TEXT DEFAULT NULL,
            user_likes json DEFAULT null,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );`,
        like_gif: `CREATE TABLE IF NOT EXISTS ${tableName} (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id VARCHAR(128) NOT NULL,
            operator_id VARCHAR(64) NOT NULL,
            avatar INT DEFAULT NULL,
            msg TEXT DEFAULT NULL,
            gif TEXT DEFAULT NULL,
            user_likes json DEFAULT null,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );`,
        no_like_gif: `CREATE TABLE IF NOT EXISTS ${tableName} (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id VARCHAR(128) NOT NULL,
            operator_id VARCHAR(64) NOT NULL,
            avatar INT DEFAULT NULL,
            msg TEXT DEFAULT NULL,
            gif TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );`,
        like_no_gif: `CREATE TABLE IF NOT EXISTS ${tableName} (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id VARCHAR(128) NOT NULL,
            operator_id VARCHAR(64) NOT NULL,
            avatar INT DEFAULT NULL,
            msg TEXT DEFAULT NULL,
            user_likes json DEFAULT null,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );`,
        no_like_no_gif: `CREATE TABLE IF NOT EXISTS ${tableName} (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id VARCHAR(128) NOT NULL,
            operator_id VARCHAR(64) NOT NULL,
            avatar INT DEFAULT NULL,
            msg TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );`
    }

    for (const cat of Object.keys(DB_TABLES_CAT) as TableCategory[]) {
        if (DB_TABLES_CAT[cat].includes(tableName)) {
            console.log(tableQuery[cat]);
            return tableQuery[cat];
        }
    }

    return tableQuery.no_like_no_gif;
}
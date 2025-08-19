import { DB_TABLES_LIST } from "../db/dbConnect";
import { ChatService } from "../services/chats";
import { TablesService } from "../services/tables";

export class CronTasks {
    tableService: TablesService;
    chatService: ChatService
    dbName = process.env.DB_NAME || "chat_service";
    constructor() {
        this.tableService = new TablesService();
        this.chatService = new ChatService();
    }

    async createNewTable() {
        for (const table of DB_TABLES_LIST) {
            const exists = await this.tableService.tableExits(this.dbName, table);
            console.log(table, "exists ?", exists);
            if (!exists) {
                await this.tableService.createNewTable(table);
                console.log(`${table} created successfully`);
            }
        }
        return;
    }
    async updateNodeCache() {
        await this.tableService.updateTablesList();
    }
    async deleteOldChats() {
        for (const table of DB_TABLES_LIST) {
            const exists = await this.tableService.tableExits(this.dbName, table);
            if (exists) await this.chatService.deleteOldChats(table);
        }
        return;
    }

}
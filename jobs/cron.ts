import nodeCron from "node-cron";
import { CronTasks } from "../handlers/cronTaskHandlers";

export function startJobs() {
    const cronTasks = new CronTasks();

    // 6 hour -> 2 days later data delete
    nodeCron.schedule("0 */6 * * *", async () => {
        await cronTasks.deleteOldChats();
        console.info("Old chats deleted 6 hr", new Date());
    })
    //  1/2 hour -> update node cache then -> db tables list update and create table if not found will be trigered
    nodeCron.schedule("*/30 * * * *", async () => {
        await cronTasks.createNewTable();
        console.info("node cron running for 30 min", new Date());
    })
    // 5 min cron for node cache update, cron expression -> "*/5 * * * *"
    nodeCron.schedule("*/5 * * * *", async () => {
        await cronTasks.updateNodeCache();
        console.info("node cron running for 5 min", new Date())
    });
}
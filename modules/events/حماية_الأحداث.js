const fs = require("fs-extra");
const path = __dirname + "/../commands/cache/protection_settings.json";

module.exports.config = {
    name: "مراقب_الحماية",
    eventType: ["log:unsubscribe", "log:thread-name", "log:user-nickname"],
    version: "4.5.0",
    credits: "Gemini",
    description: "المراقب الذكي الصارم"
};

module.exports.run = async ({ api, event }) => {
    if (!fs.existsSync(path)) return;
    const data = fs.readJsonSync(path);
    const settings = data[event.threadID];
    if (!settings) return;

    const { logMessageType, logMessageData, author, threadID } = event;
    const botID = api.getCurrentUserID();

    // 🛡️ 1. مكافحة الخروج
    if (logMessageType === "log:unsubscribe" && settings.antileave) {
        if (logMessageData.leftParticipantId == author) {
            return api.addUserToGroup(author, threadID, (err) => {
                if (err) return api.sendMessage("العب اغبى من انو ينضاف تاني 🐸", threadID);
                api.sendMessage("مارق وين يحب 🐸؟", threadID);
            });
        }
    }

    // فحص الادمن لبقية العمليات
    const threadInfo = await api.getThreadInfo(threadID);
    if (!threadInfo.adminIDs.some(i => i.id == botID)) return;

    // 🛡️ 2. حماية الاسم
    if (logMessageType === "log:thread-name" && settings.antiname) {
        if (author == botID) return;
        return api.setTitle(settings.snapshot.name, threadID);
    }

    // 🛡️ 3. حماية الكنيات
    if (logMessageType === "log:user-nickname" && settings.antinickname) {
        if (author == botID) return;
        const targetID = logMessageData.participantId;
        const oldNick = settings.snapshot.nicknames[targetID] || "";
        return api.changeNickname(oldNick, threadID, targetID);
    }
};

const fs = require("fs-extra");
const path = __dirname + "/cache/groupSettings.json";

module.exports.config = {
    name: "الاعدادات",
    version: "4.1.0",
    hasPermssion: 1,
    credits: "Gemini AI",
    description: "إعدادات حماية المجموعة",
    commandCategory: "حماية",
    usages: "الرد بالأرقام ثم التفاعل بـ 👍",
    cooldowns: 2,
};

function loadData() {
    if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}));
    return JSON.parse(fs.readFileSync(path));
}
function saveData(data) {
    fs.writeFileSync(path, JSON.stringify(data, null, 4));
}

module.exports.run = async ({ api, event }) => {
    let data = loadData();
    const { threadID, messageID, senderID } = event;

    if (!data[threadID]) {
        data[threadID] = { 1: false, 2: false, 3: false, 4: false, 5: false, originalTitle: "", originalNicknames: {} };
        saveData(data);
    }

    const s = data[threadID];
    const msg = `⚙️ إعدادات حماية المجموعة:\n\n` +
                `1. حماية اسم المجموعة [${s[1] ? "✅" : "❌"}]\n` +
                `2. فلترة الروابط (طرد) [${s[2] ? "✅" : "❌"}]\n` +
                `3. منع تغيير الكنيات [${s[3] ? "✅" : "❌"}]\n` +
                `4. منع الخروج (إعادة إضافة) [${s[4] ? "✅" : "❌"}]\n` +
                `5. إشعارات الأحداث [${s[5] ? "✅" : "❌"}]\n\n` +
                `* رد برقم الخيار، ثم تفاعل بـ 👍 على رسالة البوت لتثبيت البيانات الحالية.`;

    return api.sendMessage(msg, threadID, (err, info) => {
        global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: senderID
        });
    }, messageID);
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
    if (event.senderID != handleReply.author) return;
    let data = loadData();
    const numbers = event.body.split(/\s+/);
    let updatedText = "";
    const namesMap = { "1": "حماية الاسم", "2": "منع الروابط", "3": "منع الكنيات", "4": "منع الخروج", "5": "الإشعارات" };

    numbers.forEach(num => {
        if (data[event.threadID] && namesMap[num]) {
            data[event.threadID][num] = !data[event.threadID][num];
            updatedText += `${num}. ${namesMap[num]}\n`;
        }
    });

    saveData(data);
    return api.sendMessage(`⚠️ تم تعديل:\n${updatedText}\nتفاعل بـ 👍 على هذه الرسالة لحفظ حالة المجموعة الآن.`, event.threadID, (err, info) => {
        global.client.handleReaction.push({
            name: this.config.name,
            messageID: info.messageID,
            author: event.senderID
        });
    }, event.messageID);
};

module.exports.handleReaction = async ({ api, event, handleReaction }) => {
    if (event.userID != handleReaction.author || event.reaction != "👍") return;
    let data = loadData();
    let threadInfo = await api.getThreadInfo(event.threadID);
    
    data[event.threadID].originalTitle = threadInfo.threadName;
    data[event.threadID].originalNicknames = threadInfo.nicknames || {};
    saveData(data);
    
    return api.sendMessage("✅ تم تفعيل الحماية وحفظ نسخة من بيانات المجموعة بنجاح!", event.threadID);
};

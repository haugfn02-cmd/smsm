const fs = require("fs-extra");
const path = __dirname + "/cache/groupSettings.json";

module.exports.config = {
    name: "الاعدادات",
    version: "2.0.0",
    hasPermssion: 1, // للمسؤولين فقط
    credits: "Gemini AI",
    description: "نظام حماية المجموعة المتكامل (إعدادات، روابط، أسماء)",
    commandCategory: "حماية",
    usages: "Settings",
    cooldowns: 5,
};

module.exports.run = async ({ api, event }) => {
    if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}));
    let data = JSON.parse(fs.readFileSync(path));
    if (!data[event.threadID]) {
        data[event.threadID] = {
            1: false, 2: false, 3: false, 4: false, 5: false,
            originalTitle: "",
            originalNicknames: {}
        };
    }

    const s = data[event.threadID];
    const msg = `⚙️ إعدادات حماية المجموعة:\n\n` +
                `1. حماية اسم المجموعة [${s[1] ? "✅" : "❌"}]\n` +
                `2. فلترة الروابط [${s[2] ? "✅" : "❌"}]\n` +
                `3. مكافحة تغير الكنيات [${s[3] ? "✅" : "❌"}]\n` +
                `4. مكافحة الخروج [${s[4] ? "✅" : "❌"}]\n` +
                `5. اخطار احداث المجموعة [${s[5] ? "✅" : "❌"}]\n\n` +
                `* رد برقم الخيار أو عدة أرقام (مثال: 1 2) لتغيير الحالة.`;

    return api.sendMessage(msg, event.threadID, (err, info) => {
        global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: event.senderID
        });
    }, event.messageID);
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
    if (event.senderID != handleReply.author) return;
    let data = JSON.parse(fs.readFileSync(path));
    const numbers = event.body.split(/\s+/);
    let updatedNames = [];

    numbers.forEach(num => {
        if (data[event.threadID] && data[event.threadID][num] !== undefined) {
            data[event.threadID][num] = !data[event.threadID][num];
            const names = ["حماية الاسم", "فلترة الروابط", "منع الكنيات", "منع الخروج", "إخطار الأحداث"];
            updatedNames.push(names[num - 1]);
        }
    });

    fs.writeFileSync(path, JSON.stringify(data, null, 4));

    api.sendMessage(`⚠️ تم تعديل: (${updatedNames.join(", ")})\n\nتفاعل بـ 👍 على هذه الرسالة لحفظ الإعدادات نهائياً.`, event.threadID, (err, info) => {
        global.client.handleReaction.push({
            name: this.config.name,
            messageID: info.messageID,
            author: event.senderID
        });
    });
};

module.exports.handleReaction = async ({ api, event, handleReaction }) => {
    if (event.userID != handleReaction.author || event.reaction != "👍") return;
    
    let data = JSON.parse(fs.readFileSync(path));
    let threadInfo = await api.getThreadInfo(event.threadID);
    
    // حفظ المعلومات الأصلية عند التفعيل
    data[event.threadID].originalTitle = threadInfo.threadName;
    fs.writeFileSync(path, JSON.stringify(data, null, 4));

    api.sendMessage("✅ تم حفظ الإعدادات وتفعيل الحماية بنجاح!", event.threadID);
};

// --- قسم مراقبة الأحداث (Events) ---
module.exports.handleEvent = async ({ api, event }) => {
    if (!fs.existsSync(path)) return;
    let data = JSON.parse(fs.readFileSync(path));
    let s = data[event.threadID];
    if (!s) return;

    // 1. فلترة الروابط (رقم 2)
    if (s[2] && (event.body || "").match(/\.(com|net|org|xyz|me|info|gov|edu|ly|tk)/gi)) {
        api.removeUserFromGroup(event.senderID, event.threadID);
        api.deleteMessage(event.messageID);
    }

    // 2. حماية الاسم (رقم 1)
    if (s[1] && event.logMessageType === "log:thread-name") {
        api.setTitle(s.originalTitle, event.threadID);
        api.sendMessage("⚠️ التغيير غير مسموح به، تمت إعادة الاسم الأصلي.", event.threadID);
    }

    // 3. مكافحة الخروج (رقم 4)
    if (s[4] && event.logMessageType === "log:unsubscribe") {
        if (event.logMessageData.leftParticipantID == event.senderID) {
            api.sendMessage(`👤 العضو غادر المجموعة، حماية الخروج مفعلة.`, event.threadID);
        }
    }
};

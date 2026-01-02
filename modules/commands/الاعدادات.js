const fs = require("fs-extra");
const path = __dirname + "/cache/groupSettings.json";

module.exports.config = {
    name: "الاعدادات",
    version: "4.0.0",
    hasPermssion: 1,
    credits: "Gemini AI",
    description: "نظام حماية المجموعة المتكامل",
    commandCategory: "حماية",
    usages: "الرد بالأرقام ثم التفاعل بـ 👍",
    cooldowns: 2,
};

// وظيفة التحميل والحفظ
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
        data[threadID] = {
            1: false, 2: false, 3: false, 4: false, 5: false,
            originalTitle: "",
            originalNicknames: {}
        };
        saveData(data);
    }

    const s = data[threadID];
    const msg = `⚙️ إعدادات حماية المجموعة:\n\n` +
                `1. حماية اسم المجموعة [${s[1] ? "✅" : "❌"}]\n` +
                `2. فلترة الروابط [${s[2] ? "✅" : "❌"}]\n` +
                `3. مكافحة تغير الكنيات [${s[3] ? "✅" : "❌"}]\n` +
                `4. مكافحة الخروج [${s[4] ? "✅" : "❌"}]\n` +
                `5. اخطار احداث المجموعة [${s[5] ? "✅" : "❌"}]\n\n` +
                `* رد برقم الخيار لتعديله.`;

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
    const namesMap = { "1": "حماية الاسم", "2": "منع الروابط", "3": "منع الكنيات", "4": "منع الخروج", "5": "الإخطارات" };

    numbers.forEach(num => {
        if (data[event.threadID] && namesMap[num]) {
            data[event.threadID][num] = !data[event.threadID][num];
            updatedText += `${num}. ${namesMap[num]}\n`;
        }
    });

    saveData(data);
    return api.sendMessage(`⚠️ تم تعديل:\n${updatedText}\nتفاعل بـ 👍 للحفظ نهائياً.`, event.threadID, (err, info) => {
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
    
    return api.sendMessage("✅ تم تفعيل الحماية وحفظ بيانات المجموعة!", event.threadID);
};

// --- هذا الجزء هو المسؤول عن التنفيذ التلقائي ---
module.exports.handleEvent = async ({ api, event }) => {
    const data = loadData();
    const s = data[event.threadID];
    if (!s) return;

    const { type, logMessageType, logMessageData, body, senderID, threadID, messageID } = event;

    // 1. فلترة الروابط (أثناء الدردشة العادية)
    if (s[2] && body && (body.includes("http") || body.includes("www.") || body.includes(".com"))) {
        // التحقق من أن المرسل ليس آدمن قبل الطرد
        api.getThreadInfo(threadID).then(info => {
            if (!info.adminIDs.some(item => item.id == senderID)) {
                api.deleteMessage(messageID);
                api.removeUserFromGroup(senderID, threadID);
            }
        });
    }

    // 2. معالجة أحداث السجل (تغيير اسم، كنية، خروج)
    if (type === "log:subscribe" || type === "log:unsubscribe" || type === "log:thread-name" || type === "log:user-nickname") {
        
        // حماية الاسم
        if (s[1] && logMessageType === "log:thread-name") {
            api.setTitle(s.originalTitle, threadID);
            api.sendMessage("❌ التغيير غير مسموح به!", threadID);
        }

        // حماية الكنيات
        if (s[3] && logMessageType === "log:user-nickname") {
            const tID = logMessageData.participantID;
            const oldNick = s.originalNicknames[tID] || "";
            api.changeNickname(oldNick, threadID, tID);
        }

        // مكافحة الخروج
        if (s[4] && logMessageType === "log:unsubscribe") {
            if (logMessageData.leftParticipantID == senderID) {
                api.sendMessage("⚠️ تنبيه: غادر أحد الأعضاء المجموعة.", threadID);
            }
        }
    }
};

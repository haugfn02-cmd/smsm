const fs = require("fs-extra");
const path = __dirname + "/cache/groupSettings.json";

module.exports.config = {
    name: "الاعدادات",
    version: "3.0.0",
    hasPermssion: 1,
    credits: "Gemini AI",
    description: "نظام حماية المجموعة المتكامل",
    commandCategory: "حماية",
    usages: "الرد بالأرقام ثم التفاعل بـ 👍",
    cooldowns: 2,
};

// وظيفة للتأكد من وجود ملف البيانات
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
                `* قم بالرد على هذه الرسالة بالأرقام التي تريد تغييرها.`;

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
    let updatedNames = "";
    const namesMap = {
        "1": "حماية اسم المجموعة",
        "2": "فلترة الروابط",
        "3": "مكافحة تغير الكنيات",
        "4": "مكافحة الخروج",
        "5": "اخطار احداث المجموعة"
    };

    numbers.forEach(num => {
        if (data[event.threadID] && data[event.threadID][num] !== undefined) {
            data[event.threadID][num] = !data[event.threadID][num];
            updatedNames += `${num}. ${namesMap[num]}\n`; // عرض عمودي
        }
    });

    saveData(data);

    const confirmMsg = `⚠️ تم تعديل الحالات التالية:\n\n${updatedNames}\nتفاعل بـ 👍 على هذه الرسالة لحفظ الإعدادات الجديدة.`;

    return api.sendMessage(confirmMsg, event.threadID, (err, info) => {
        global.client.handleReaction.push({
            name: this.config.name,
            messageID: info.messageID,
            author: event.senderID
        });
    }, event.messageID);
};

module.exports.handleReaction = async ({ api, event, handleReaction }) => {
    if (event.userID != handleReaction.author || event.reaction != "👍") return;

    try {
        let data = loadData();
        let threadInfo = await api.getThreadInfo(event.threadID);
        
        // حفظ الاسم الحالي كأصل للحماية
        data[event.threadID].originalTitle = threadInfo.threadName;
        // حفظ الكنيات الحالية كأصل
        data[event.threadID].originalNicknames = threadInfo.nicknames;
        
        saveData(data);
        
        return api.sendMessage("✅ تم حفظ الإعدادات وتحديث بيانات المجموعة بنجاح!", event.threadID);
    } catch (e) {
        return api.sendMessage("❌ فشل في الوصول لبيانات المجموعة، تأكد أن البوت آدمن.", event.threadID);
    }
};

module.exports.handleEvent = async ({ api, event }) => {
    const data = loadData();
    const s = data[event.threadID];
    if (!s) return;

    // 1. حماية الروابط (رقم 2) - حذف وطرد
    if (s[2] && event.body && /(https?:\/\/|www\.|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/.test(event.body)) {
        api.deleteMessage(event.messageID);
        api.removeUserFromGroup(event.senderID, event.threadID);
        api.sendMessage(`🚫 تم طرد عضو لإرساله رابطاً (الحماية مفعلة).`, event.threadID);
    }

    // 2. حماية الاسم (رقم 1)
    if (s[1] && event.logMessageType === "log:thread-name") {
        api.setTitle(s.originalTitle, event.threadID);
        api.sendMessage("⚠️ التغيير غير مسموح به، تمت إعادة الاسم.", event.threadID);
    }

    // 3. مكافحة تغير الكنيات (رقم 3)
    if (s[3] && event.logMessageType === "log:user-nickname") {
        const targetID = event.logMessageData.participantID;
        const oldNick = s.originalNicknames[targetID] || "";
        api.changeNickname(oldNick, event.threadID, targetID);
        api.sendMessage("⚠️ تغيير الكنيات غير مسموح به حالياً.", event.threadID);
    }

    // 4. مكافحة الخروج (رقم 4)
    if (s[4] && event.logMessageType === "log:unsubscribe") {
        if (event.logMessageData.leftParticipantID == event.senderID) {
            api.sendMessage("❌ أحد الأعضاء غادر المجموعة (مكافحة الخروج مفعلة).", event.threadID);
        }
    }
};

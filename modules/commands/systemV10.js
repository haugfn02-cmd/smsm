const fs = require("fs-extra");
const path = require("path");

const DEV_ID = "61581906898524";
const DEV_NAME = "كيرو"; 
const DATA_PATH = path.join(__dirname, "kiro_v11_pro.json");

if (!fs.existsSync(DATA_PATH)) {
    fs.writeJsonSync(DATA_PATH, {
        smartMode: true, isDevAway: false, awayUntil: 0,
        lastReportTime: Date.now(), adminActions: {}, logs: [],
        groupLocked: false, autoReply: true
    });
}

const load = () => fs.readJsonSync(DATA_PATH);
const save = (d) => fs.writeJsonSync(DATA_PATH, d, { spaces: 2 });

module.exports.config = {
    name: "النظام",
    version: "11.5.0",
    hasPermssion: 0,
    credits: "Kiro & Gemini AI",
    description: "نظام الغياب مع بث تلقائي للمجموعات",
    commandCategory: "النظام المطور",
    usages: "[غياب / اوامر / حالة]",
    cooldowns: 2
};

module.exports.run = async ({ api, event, args }) => {
    const { threadID, senderID, messageID } = event;
    let d = load();

    if (senderID !== DEV_ID) return api.sendMessage("❌ هذا الأمر للمطور كيرو فقط.", threadID);

    if (args[0] === "غياب") {
        return api.sendMessage("⏳ سيدي المطور، كم ساعة ستغيب عن النظام؟ (رد برقم فقط)", threadID, (err, info) => {
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: senderID
            });
        }, messageID);
    }

    if (!args[0] || args[0] === "اوامر") {
        const menu = `『 𝗞𝗜𝗥𝗢 𝗦𝗬𝗦𝗧𝗘𝗠 𝗩١١.٥ 』\n━━━━━━━━━━━━━\n⏳ النظام غياب : تفعيل الغياب مع إعلان عام\n🔒 النظام قفل [قفل/فتح] : وضع الطوارئ\n📊 النظام حالة : فحص الحماية\n━━━━━━━━━━━━━`;
        return api.sendMessage(menu, threadID);
    }
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
    if (event.senderID !== handleReply.author) return;
    let d = load();
    const hours = parseInt(event.body);

    if (isNaN(hours)) return api.sendMessage("⚠️ يرجى الرد برقم الساعات فقط.", event.threadID);

    d.isDevAway = true;
    d.awayUntil = Date.now() + (hours * 60 * 60 * 1000);
    save(d);

    // --- ميزة البث التلقائي لجميع المجموعات ---
    const allThreads = await api.getThreadList(100, null, ["INBOX"]);
    const announcement = `📢 【 إعـلان إداري عـام 】\n━━━━━━━━━━━━━\n👤 المطور: ${DEV_NAME}\n🛠️ تم تفعيل وضع "الإدارة الذاتية" الآن.\n⏳ مدة الغياب المتوقعة: ${hours} ساعة.\n🛡️ البوت سيقوم بحماية المجموعات والرد تلقائياً حتى عودة المطور.\n━━━━━━━━━━━━━`;
    
    for (const thread of allThreads) {
        if (thread.isGroup && thread.threadID !== event.threadID) {
            api.sendMessage(announcement, thread.threadID);
        }
    }

    return api.sendMessage(`✅ تم تفعيل وضع الغياب وإبلاغ جميع المجموعات بنجاح.`, event.threadID);
};

module.exports.handleEvent = async ({ api, event }) => {
    const { threadID, senderID, body, mentions, logMessageType, logMessageData } = event;
    let d = load();
    if (!d) return;

    // 1. إلغاء الغياب وإرسال إعلان عودة
    if (senderID === DEV_ID && d.isDevAway) {
        d.isDevAway = false;
        d.awayUntil = 0;
        save(d);
        
        const welcomeBack = `✅ 【 عـودة الـمـطور 】\n━━━━━━━━━━━━━\n🟢 المطور ${DEV_NAME} متواجد الآن.\n🛠️ تم إيقاف وضع الإدارة الذاتية وعودة التحكم اليدوي.\n━━━━━━━━━━━━━`;
        const allThreads = await api.getThreadList(100, null, ["INBOX"]);
        for (const thread of allThreads) {
            if (thread.isGroup) api.sendMessage(welcomeBack, thread.threadID);
        }
    }

    // 2. الرد عند التاغ أثناء الغياب
    if (d.isDevAway && senderID !== DEV_ID && body) {
        const isMentioned = (mentions && Object.keys(mentions).includes(DEV_ID)) || body.includes(DEV_NAME);
        if (isMentioned) {
            const timeLeft = Math.round((d.awayUntil - Date.now()) / 60000);
            api.sendMessage(`🌙 المطور غائب وسيعود بعد ${timeLeft > 0 ? timeLeft : "قليل"} دقيقة.\n🛡️ نظام الحماية الذكي قيد التشغيل حالياً.`, threadID);
        }
    }

    // 3. حماية مكافحة الانقلاب
    if (logMessageType === "log:unsubscribe" && logMessageData.leftParticipantID !== senderID) {
        if (!d.adminActions[senderID]) d.adminActions[senderID] = { count: 0, time: Date.now() };
        if (Date.now() - d.adminActions[senderID].time < 3600000) d.adminActions[senderID].count++;
        else d.adminActions[senderID] = { count: 1, time: Date.now() };

        if (d.adminActions[senderID].count >= 3 && senderID !== DEV_ID) {
            api.changeAdminStatus(threadID, senderID, false);
            api.sendMessage("🚨 كشف محاولة انقلاب! تم سحب الصلاحيات.", threadID);
        }
        save(d);
    }
};

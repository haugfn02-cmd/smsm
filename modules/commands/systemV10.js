const fs = require("fs-extra");
const path = require("path");

const DEV_ID = "61581906898524";
const DEV_NAME = "كيرو"; // اسمك ليتحسس منه البوت
const DATA_PATH = path.join(__dirname, "kiro_v10_pro.json");

if (!fs.existsSync(DATA_PATH)) {
    fs.writeJsonSync(DATA_PATH, {
        smartMode: true,
        isDevAway: false,
        awayUntil: 0,
        lastReportTime: Date.now(),
        adminActions: {},
        logs: [],
        groupLocked: false,
        autoReply: true
    });
}

const load = () => fs.readJsonSync(DATA_PATH);
const save = (d) => fs.writeJsonSync(DATA_PATH, d, { spaces: 2 });

module.exports.config = {
    name: "النظام",
    version: "10.5.0",
    hasPermssion: 0,
    credits: "Kiro & Gemini AI",
    description: "V10 Pro: ردود تلقائية، حماية انقلاب، إدارة غياب",
    commandCategory: "النظام المطور",
    usages: "[اوامر / غياب / قفل / ردود]",
    cooldowns: 2
};

module.exports.run = async ({ api, event, args }) => {
    const { threadID, senderID, messageID } = event;
    let d = load();
    const cmd = args[0];

    if (!cmd || cmd === "اوامر") {
        const menu = 
            `『 𝗞𝗜𝗥𝗢 𝗣𝗥𝗢 𝗠𝗔𝗫 𝗩١٠ 』\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `⏳ ◈ النظام غياب [ساعة] : تحديد مدة غيابك\n` +
            `🔒 ◈ النظام قفل [فتح/قفل] : وضع الطوارئ\n` +
            `💬 ◈ النظام ردود [قفل/فتح] : الرد عند التاغ\n` +
            `👻 ◈ النظام اشباح : كشف التفاعل\n` +
            `📊 ◈ النظام تقرير : سجل أحداث الحماية\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `⚙️ حالة الردود: ${d.autoReply ? "✅ مفعلة" : "❌ معطلة"}`;
        return api.sendMessage(menu, threadID);
    }

    if (senderID !== DEV_ID) return api.sendMessage("❌ عذراً، هذا التحكم مخصص لمالك البوت فقط.", threadID);

    if (cmd === "غياب") {
        const hours = parseInt(args[1]);
        if (isNaN(hours)) return api.sendMessage("⚠️ حدد الساعات.. مثال: النظام غياب 3", threadID);
        d.isDevAway = true;
        d.awayUntil = Date.now() + (hours * 60 * 60 * 1000);
        save(d);
        return api.sendMessage(`🌙 تم تفعيل وضع الغياب لمدة (${hours}) ساعة. سأقوم بالرد على من يناديك.`, threadID);
    }

    if (cmd === "ردود") {
        d.autoReply = args[1] === "فتح";
        save(d);
        return api.sendMessage(`💬 تم ${args[1] === "فتح" ? "تفعيل" : "إيقاف"} الردود التلقائية بنجاح.`, threadID);
    }

    if (cmd === "قفل") {
        d.groupLocked = args[1] === "قفل";
        save(d);
        return api.sendMessage(d.groupLocked ? "🔒 تم إغلاق المجموعة." : "🔓 تم فتح المجموعة.", threadID);
    }

    if (cmd === "تقرير") return api.sendMessage(`📝 سجل الحماية:\n\n${d.logs.slice(-10).join("\n") || "لا توجد أحداث."}`, threadID);
};

module.exports.handleEvent = async ({ api, event }) => {
    const { threadID, senderID, body, mentions, logMessageType, logMessageData } = event;
    let d = load();
    const now = Date.now();

    // 1. نظام الردود التلقائية عند التاغ أو ذكر الاسم
    if (d.autoReply && senderID !== DEV_ID && body) {
        const isMentioned = Object.keys(mentions).includes(DEV_ID) || body.includes(DEV_NAME);
        
        if (isMentioned) {
            if (d.isDevAway) {
                const timeLeft = Math.round((d.awayUntil - now) / 60000);
                const msg = timeLeft > 0 
                    ? `🌙 المطور كيرو غير متواجد حالياً.\n⏳ سيعود بعد حوالي ${timeLeft} دقيقة.\n🤖 أنا هنا لحمايتك، هل يمكنني مساعدتك؟`
                    : `🌙 المطور كيرو غائب حالياً لكنه سيعود قريباً جداً!`;
                api.sendMessage(msg, threadID);
            } else {
                api.sendMessage("🟢 المطور موجود حالياً في المتصلين، انتظر رده قليلاً..", threadID);
            }
        }
    }

    // 2. إلغاء الغياب عند ظهور المطور
    if (senderID === DEV_ID && d.isDevAway) {
        d.isDevAway = false;
        d.awayUntil = 0;
        save(d);
        api.sendMessage("👋 أهلاً بعودتك يا زعيم! تم إيقاف وضع الغياب والردود التلقائية للغياب.", threadID);
    }

    // 3. حماية الانقلاب (طرد 3 أشخاص)
    if (logMessageType === "log:unsubscribe" && logMessageData.leftParticipantID !== senderID) {
        if (!d.adminActions[senderID]) d.adminActions[senderID] = { count: 0, time: now };
        if (now - d.adminActions[senderID].time < 3600000) d.adminActions[senderID].count++;
        else d.adminActions[senderID] = { count: 1, time: now };

        if (d.adminActions[senderID].count >= 3 && senderID !== DEV_ID) {
            api.changeAdminStatus(threadID, senderID, false);
            api.sendMessage("🚨 كشف محاولة انقلاب! تم سحب الصلاحيات فوراً.", threadID);
            d.logs.push(`⚠️ إحباط انقلاب من ${senderID} في ${new Date().toLocaleString()}`);
            save(d);
        }
    }

    // 4. حماية القفل
    if (d.groupLocked && logMessageType === "log:subscribe") {
        const newUsers = logMessageData.addedParticipants;
        for (let user of newUsers) { api.removeUserFromGroup(user.userFbId, threadID); }
        api.sendMessage("🔒 المجموعة مقفلة، تم طرد المنضمين.", threadID);
    }

    // 5. تقرير دوري (3 ساعات)
    if (now - d.lastReportTime >= 3 * 60 * 60 * 1000) {
        d.lastReportTime = now;
        api.sendMessage(`🕒 تقرير النظام الدوري: كل شيء يعمل بكفاءة.`, DEV_ID);
        save(d);
    }
};

const fs = require("fs-extra");
const path = __dirname + "/cache/protection_settings.json";

module.exports.config = {
    name: "اعدادات",
    version: "4.5.0",
    hasPermssion: 1,
    credits: "Gemini",
    description: "نظام حماية المجموعات المطور - نسخة نهائية",
    commandCategory: "إدارة المجموعة",
    usages: "اعدادات",
    cooldowns: 5
};

module.exports.run = async ({ api, event }) => {
    const { threadID, messageID } = event;
    if (!fs.existsSync(__dirname + "/cache")) fs.mkdirSync(__dirname + "/cache");
    if (!fs.existsSync(path)) fs.writeJsonSync(path, {});
    
    let data = fs.readJsonSync(path);
    if (!data[threadID]) {
        data[threadID] = { 
            antispam: false, antileave: false, antiname: false, 
            antibox: false, antinickname: false, notify: false,
            snapshot: { name: "", nicknames: {} } 
        };
    }

    const s = data[threadID];
    const check = (status) => status ? "✅" : "❌";

    const msg = `⌈ اعـدادات الـمـجـموعـة ⌋\n
1. [${check(s.antispam)}] مكافحة الازعاج
2. [${check(s.antileave)}] مكافحة الخروج
3. [${check(s.antiname)}] مكافحة تغيير الاسم
4. [${check(s.antibox)}] مكافحة تغيير الصورة
5. [${check(s.antinickname)}] مكافحة تغيير الكنية\n
6. [${check(s.notify)}] اخطار احداث المجموعة\n
⇒ رد بأرقام الخيارات لتغييرها (مثال: 1 3 5)`;

    return api.sendMessage(msg, threadID, (err, info) => {
        global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            settings: s
        });
    }, messageID);
};

module.exports.handleReply = async ({ api, event, handleReply }) => {
    if (event.senderID != handleReply.author) return;
    const choices = event.body.split(/\s+/);
    let settings = handleReply.settings;
    const map = { "1": "antispam", "2": "antileave", "3": "antiname", "4": "antibox", "5": "antinickname", "6": "notify" };

    choices.forEach(num => { if (map[num]) settings[map[num]] = !settings[map[num]]; });

    api.sendMessage("◜ تفاعل بـ 👍 لحفظ الاعدادات وأخذ لقطة حماية ◞", event.threadID, (err, info) => {
        global.client.handleReaction.push({
            name: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            newSettings: settings
        });
    }, event.messageID);
};

module.exports.handleReaction = async ({ api, event, handleReaction }) => {
    if (event.userID != handleReaction.author || event.reaction != "👍") return;
    const { threadID } = event;
    const botID = api.getCurrentUserID();
    
    try {
        const threadInfo = await api.getThreadInfo(threadID);
        const isAdmin = threadInfo.adminIDs.some(i => i.id == botID);

        if (!isAdmin) {
            api.sendMessage("⚠️ تنبيه: البوت ليس ادمن! سيتم تجاهل (مكافحة الخروج، حماية الكنيات، والاسم) حتى ترفعني ادمن.", threadID);
        }

        handleReaction.newSettings.snapshot = {
            name: threadInfo.threadName || "",
            nicknames: threadInfo.nicknames || {}
        };

        let data = fs.readJsonSync(path);
        data[threadID] = handleReaction.newSettings;
        fs.writeJsonSync(path, data);
        
        api.unsendMessage(handleReaction.messageID);
        return api.sendMessage(`◜ تم حفظ الاعدادات بنجاح ${isAdmin ? "✅" : "⚠️"} ◞`, threadID);
    } catch (e) {
        return api.sendMessage("❌ فشل النظام في الحفظ.", threadID);
    }
};

module.exports.config = {
    name: "اعدادات",
    version: "1.0.0",
    hasPermssion: 1,
    credits: "Gemini AI",
    description: "التحكم في حماية المجموعة",
    commandCategory: "الادارة",
    usages: "[الرد برقم الخيار]",
    cooldowns: 3
};

module.exports.run = async function ({ api, event, Threads }) {
    const { threadID, messageID, senderID } = event;
    if (!event.isGroup) return api.sendMessage("❌ هذا الأمر للمجموعات فقط!", threadID, messageID);

    let data = (await Threads.getData(threadID)).data || {};
    let anti = data.antiSettings || {};

    const getStatus = (key) => (anti[key] ? "✅" : "❌");

    const msg = `⌈ إعـدادات الـحـمـيـة ⌋\n\n` +
                `1. [${getStatus("antiSpam")}] مكافحة السبام\n` +
                `2. [${getStatus("antiOut")}] منع الخروج\n` +
                `3. [${getStatus("antiChangeGroupName")}] منع تغيير الاسم\n` +
                `4. [${getStatus("antiChangeGroupImage")}] منع تغيير الصورة\n` +
                `5. [${getStatus("antiChangeNickname")}] منع تغيير الألقاب\n\n` +
                `⇒ رد برقم الإعداد لتغيير حالته.`;

    return api.sendMessage(msg, threadID, (err, info) => {
        global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            author: senderID
        });
    }, messageID);
};

module.exports.handleReply = async function ({ api, event, handleReply, Threads }) {
    const { body, threadID, messageID, senderID } = event;
    if (senderID != handleReply.author) return;

    const keys = ["antiSpam", "antiOut", "antiChangeGroupName", "antiChangeGroupImage", "antiChangeNickname"];
    let index = parseInt(body) - 1;

    if (isNaN(index) || index < 0 || index >= keys.length) 
        return api.sendMessage("⚠️ رقم غير صالح!", threadID, messageID);

    try {
        let threadData = (await Threads.getData(threadID)).data || {};
        if (!threadData.antiSettings) threadData.antiSettings = {};

        const key = keys[index];
        threadData.antiSettings[key] = !threadData.antiSettings[key];

        await Threads.setData(threadID, { data: threadData });
        api.unsendMessage(handleReply.messageID);
        return api.sendMessage(`✅ تم تحديث [${key}] إلى: ${threadData.antiSettings[key] ? "تفعيل" : "تعطيل"}`, threadID);
    } catch (e) {
        return api.sendMessage("❌ خطأ في حفظ البيانات!", threadID);
    }
};

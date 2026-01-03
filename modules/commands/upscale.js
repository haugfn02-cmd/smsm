const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "تحسين",
    version: "3.0.0",
    hasPermssion: 0,
    credits: "Kiro & Gemini AI",
    description: "رفع جودة الصور بتقنية AI المتطورة (دقة فائقة)",
    commandCategory: "الخدمات الذكية",
    usages: "[بالرد على صورة]",
    cooldowns: 15
};

module.exports.run = async ({ api, event }) => {
    const { threadID, messageID, type, messageReply } = event;

    // 1. التحقق الأولي الصارم
    if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
        return api.sendMessage("⚠️ عذراً، يجب عليك الرد بكلمة (تحسين) على صورة حصراً.", threadID, messageID);
    }

    const imgUrl = messageReply.attachments[0].url;
    api.sendMessage("⌛ جاري معالجة الصورة بأفضل سيرفر متاح.. يرجى الانتظار.", threadID, (err, info) => {
        setTimeout(() => api.unsendMessage(info.messageID), 15000);
    }, messageID);

    // 2. مصفوفة السيرفرات (لتقليل نسبة الخطأ في حال تعطل أحدها)
    const servers = [
        `https://api.vreden.my.id/api/remini?url=${encodeURIComponent(imgUrl)}`,
        `https://api.skididpappa.tech/api/remini?url=${encodeURIComponent(imgUrl)}`,
        `https://samirxpapi.onrender.com/remini?url=${encodeURIComponent(imgUrl)}`
    ];

    const cachePath = path.join(__dirname, 'cache', `upscale_${Date.now()}.jpg`);
    if (!fs.existsSync(path.join(__dirname, 'cache'))) fs.mkdirSync(path.join(__dirname, 'cache'), { recursive: true });

    let success = false;

    // 3. محاولة التنفيذ عبر السيرفرات المتوفرة
    for (const server of servers) {
        if (success) break;
        try {
            const res = await axios.get(server);
            const resultUrl = res.data.result || res.data.image || res.data.url;

            if (resultUrl) {
                const response = await axios.get(resultUrl, { responseType: 'arraybuffer' });
                fs.writeFileSync(cachePath, Buffer.from(response.data));
                success = true;
            }
        } catch (e) {
            console.error(`⚠️ فشل السيرفر: ${server.substring(0, 30)}...`);
            continue; // انتقل للسيرفر التالي
        }
    }

    // 4. النتيجة النهائية
    if (success) {
        return api.sendMessage({
            body: "✨ تم تحسين جودة الصورة باستخدام الذكاء الاصطناعي بنجاح!",
            attachment: fs.createReadStream(cachePath)
        }, threadID, () => {
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);
    } else {
        return api.sendMessage("❌ تعذر تحسين الصورة حالياً. جميع السيرفرات الذكية مشغولة، يرجى المحاولة لاحقاً.", threadID, messageID);
    }
};

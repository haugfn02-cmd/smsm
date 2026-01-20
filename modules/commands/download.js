module.exports.config = {
    name: "تحميل",
    version: "1.3.0",
    hasPermssion: 0,
    credits: "Kiros",
    description: "تحميل وسائط مع عرض الحجم ورقم الطلب",
    commandCategory: "الوسائط",
    usages: "[الرابط]",
    cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
    const axios = require("axios");
    const fs = require("fs-extra");
    const { threadID, messageID } = event;

    if (!args[0]) return api.sendMessage("⚠️ يرجى إدراج الرابط المراد تحميله.", threadID, messageID);

    const url = args[0];
    const orderID = Math.floor(Math.random() * 90000) + 10000; // رقم طلب خماسي أنيق

    // التفاعل البدئي
    api.setMessageReaction("📥", messageID, (err) => {}, true);

    try {
        let downloadUrl = "";
        let title = "غير محدد";
        let platform = "";
        let icon = "";

        const youtubeKey = global.config.youtube.YOUTUBE_API;
        const tiktokKey = global.config.tiktok.API_KEY;

        if (url.includes("tiktok.com")) {
            platform = "TIKTOK";
            icon = "🎵";
            const res = await axios.get(`https://api.tikwm.com/api/?url=${encodeURIComponent(url)}&key=${tiktokKey}`);
            downloadUrl = res.data.data.play;
            title = res.data.data.title || "فيديو تيك توك";
        } 
        else if (url.includes("youtube.com") || url.includes("youtu.be")) {
            platform = "YOUTUBE";
            icon = "🎬";
            const res = await axios.get(`https://api.samirxp.me/ytdl?url=${encodeURIComponent(url)}&apikey=${youtubeKey}`);
            downloadUrl = res.data.result.download_url;
            title = res.data.result.title || "فيديو يوتيوب";
        }
        else {
            api.setMessageReaction("❓", messageID, (err) => {}, true);
            return api.sendMessage("❌ المنصة غير مدعومة حالياً.", threadID, messageID);
        }

        const path = __dirname + `/cache/kiros_${orderID}.mp4`;
        
        // جلب الفيديو
        const response = await axios({
            method: 'get',
            url: downloadUrl,
            responseType: 'arraybuffer'
        });

        // حساب الحجم بالميغابايت
        const fileSizeInBytes = response.data.byteLength;
        const fileSizeInMegabytes = (fileSizeInBytes / (1024 * 1024)).toFixed(2);

        fs.writeFileSync(path, Buffer.from(response.data, "utf-8"));

        api.setMessageReaction("✅", messageID, (err) => {}, true);

        // إرسال النتيجة بالاستايل الجديد
        return api.sendMessage({
            body: `「 𝑲𝑰𝑹𝑶𝑺 𝑫𝑶𝑾𝑵𝑳𝑶𝑨𝑫𝑬𝑹 」\n` +
                  `━━━━━━━━━━━━━\n` +
                  `🔗 اﻟﻤﻨﺼﺔ : ${icon} ${platform}\n` +
                  `📝 اﻟﻌﻨﻮان : ${title}\n` +
                  `📦 اﻟﺤﺠﻢ : ${fileSizeInMegabytes} MB\n` +
                  `🆔 اﻟﻄﻠﺐ : #${orderID}\n` +
                  `━━━━━━━━━━━━━\n` +
                  `⚡ ʙʏ: 『⇄ 𝑩𝑶𝑻 𝑲𝑰𝑹𝑶𝑺 』`,
            attachment: fs.createReadStream(path)
        }, threadID, () => fs.unlinkSync(path), messageID);

    } catch (err) {
        api.setMessageReaction("❌", messageID, (err) => {}, true);
        return api.sendMessage(`❌ فشل تحميل الطلب #${orderID}.\nتأكد من الـ API أو حجم الفيديو.`, threadID, messageID);
    }
};

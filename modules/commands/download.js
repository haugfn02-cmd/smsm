const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "تحميل",
    version: "3.0.0",
    hasPermssion: 0,
    credits: "Kiro & Gemini AI",
    description: "تحميل فيديوهات من (TikTok, YouTube, FB, IG) برابط واحد مباشر",
    commandCategory: "الخدمات",
    usages: "[رابط الفيديو]",
    cooldowns: 15 // زيادة الكول داون لمنع حظر البوت
};

module.exports.run = async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const url = args[0];

    if (!url) {
        return api.sendMessage("⚠️ يرجى وضع رابط الفيديو المراد تحميله.\nمثال: تحميل https://vt.tiktok.com/xxx/", threadID, messageID);
    }

    // التحقق من صحة الرابط لتقليل الأخطاء قبل الإرسال للسيرفر
    if (!url.includes("http")) {
        return api.sendMessage("❌ الرابط غير صالح، يرجى التأكد من نسخ الرابط بالكامل.", threadID, messageID);
    }

    api.sendMessage("⏳ جاري فحص الرابط ومعالجة الفيديو... يرجى الانتظار.", threadID, (err, info) => {
        // حذف رسالة الانتظار بعد 15 ثانية تلقائياً
        setTimeout(() => { api.unsendMessage(info.messageID) }, 15000);
    }, messageID);

    try {
        // استخدام محرك تحميل شامل يدعم عدة منصات
        const res = await axios.get(`https://api.vreden.my.id/api/download?url=${encodeURIComponent(url)}`);
        
        if (!res.data || !res.data.result) {
            throw new Error("لم يتم العثور على ملف قابل للتحميل.");
        }

        const data = res.data.result;
        // بعض الـ APIs تعيد الفيديو في 'url' أو 'video' أو 'hd'
        const videoUrl = data.url || data.video || data.hd;
        const title = data.title || "تم التحميل بواسطة كيـرو";

        if (!videoUrl) throw new Error("رابط الفيديو غير صالح.");

        const cachePath = path.join(__dirname, 'cache', `download_${Date.now()}.mp4`);
        
        // إنشاء مجلد الكاش إذا لم يكن موجوداً
        if (!fs.existsSync(path.join(__dirname, 'cache'))) {
            fs.mkdirSync(path.join(__dirname, 'cache'));
        }

        // تحميل الفيديو إلى السيرفر مؤقتاً
        const videoBuffer = (await axios.get(videoUrl, { responseType: 'arraybuffer' })).data;
        
        // التأكد من حجم الملف (فيسبوك لا يسمح بإرسال ملفات ضخمة جداً عبر البوت)
        if (videoBuffer.length > 25 * 1024 * 1024) { // 25MB
            return api.sendMessage("⚠️ حجم الفيديو كبير جداً (أكثر من 25MB)، لا يمكن إرساله عبر ماسنجر.", threadID, messageID);
        }

        fs.writeFileSync(cachePath, Buffer.from(videoBuffer));

        // إرسال الفيديو
        return api.sendMessage({
            body: `✅ تـم الـتـحـمـيـل بـنـجـاح\n📝 العنوان: ${title}`,
            attachment: fs.createReadStream(cachePath)
        }, threadID, () => {
            if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
        }, messageID);

    } catch (error) {
        console.error("Download Error:", error.message);
        return api.sendMessage("❌ فشل التحميل! تأكد أن:\n1. الرابط صحيح.\n2. الفيديو عام (Public) وليس خاصاً.\n3. السيرفر لا يواجه ضغطاً حالياً.", threadID, messageID);
    }
};

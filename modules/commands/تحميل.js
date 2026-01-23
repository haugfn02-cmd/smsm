const axios = require("axios");
const fs = require("fs-extra");
const { alldown } = require("rx-dawonload");

module.exports = {
  config: {
    name: "تحميل",
    version: "1.2.0",
    hasPermssion: 0,
    credits: "rX & YUMI",
    description: "تحميل فيديوهات من اليوتيوب، تيك توك، إنستغرام، وفيسبوك عبر الرابط",
    commandCategory: "الخدمات",
    usages: "[الرابط]",
    cooldowns: 5,
  },

  run: async function ({ api, event, args }) {
    // التحقق من وجود رابط بعد كلمة تحميل
    const content = args.join(" ");
    if (!content || !content.startsWith("https://")) {
      return api.sendMessage("❌ يرجى وضع رابط صحيح بعد كلمة 'تحميل'\nمثال: تحميل https://tiktok.com/...", event.threadID, event.messageID);
    }

    // معرف الطلب فريد لكل عملية
    const requestId = event.messageID || Math.floor(Math.random() * 1000000);
    const filePath = __dirname + "/cache/" + requestId + ".mp4";

    try {
      // تحديد المنصة بشكل مرئي
      let site = "غير معروف";
      const urlLower = content.toLowerCase();
      if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be")) site = "YouTube 📺";
      else if (urlLower.includes("tiktok.com")) site = "TikTok 🎵";
      else if (urlLower.includes("instagram.com")) site = "Instagram 📸";
      else if (urlLower.includes("facebook.com") || urlLower.includes("fb.watch")) site = "Facebook 💙";

      // تفاعل البحث
      api.setMessageReaction("🔍", event.messageID, () => {}, true);

      // جلب بيانات الفيديو باستخدام المكتبة المثبتة
      const data = await alldown(content);
      
      if (!data || !data.url) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage("⚠️ عذراً، لم أتمكن من استخراج رابط الفيديو. قد يكون الحساب خاصاً أو الرابط غير مدعوم حالياً.", event.threadID, event.messageID);
      }

      const title = data.title || "فيديو بدون عنوان";
      const videoUrl = data.url;

      // تفاعل التحميل
      api.setMessageReaction("⬇️", event.messageID, () => {}, true);

      // تحميل الفيديو كبيانات Binary (Buffer)
      const response = await axios.get(videoUrl, { responseType: "arraybuffer" });
      
      // التأكد من وجود مجلد cache قبل الحفظ
      if (!fs.existsSync(__dirname + "/cache")) {
        fs.mkdirSync(__dirname + "/cache", { recursive: true });
      }

      // حفظ الملف
      fs.writeFileSync(filePath, Buffer.from(response.data));

      // إرسال الرسالة بالستايل الأنيق الجديد
      const stylishBody = 
        `✅ تم التحميل بنجاح!\n` +
        `━━━━━━━━━━━━━━━\n` +
        `🆔 معرف الطلب: ${requestId}\n` +
        `📍 المنصة: ${site}\n` +
        `🎬 العنوان: ${title}\n` +
        `━━━━━━━━━━━━━━━\n` +
        `『 ⚙︎ ڪايࢪوس  ͡🦋͜  فالخدمة 』`;

      api.sendMessage(
        {
          body: stylishBody,
          attachment: fs.createReadStream(filePath),
        },
        event.threadID,
        (err) => {
          // تنظيف الملفات المؤقتة فور الإرسال
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          
          if (!err) {
            api.setMessageReaction("✅", event.messageID, () => {}, true);
          } else {
            api.setMessageReaction("❌", event.messageID, () => {}, true);
          }
        },
        event.messageID
      );

    } catch (err) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      api.sendMessage(`❌ حدث خطأ تقني:\n${err.message}`, event.threadID, event.messageID);
    }
  },
};

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
  name: "تحميل",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Gemini AI",
  description: "تحميل الفيديوهات من فيسبوك، تيك توك، يوتيوب، وانستجرام",
  commandCategory: "الخدمات",
  usages: "[رابط الفيديو]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const url = args[0];

  if (!url) {
    return api.sendMessage("⚠️ يرجى تزويد رابط صالح بعد الأمر.\nمثال: تحميل [الرابط]", threadID, messageID);
  }

  api.sendMessage("⏳ جاري معالجة طلبك، يرجى الانتظار...", threadID, messageID);

  try {
    const response = await axios.post('https://api.cobalt.tools/api/json', {
      url: url,
      videoQuality: "720",
      filenameStyle: "basic"
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.data || !response.data.url) {
      throw new Error("لم يتم العثور على رابط تحميل.");
    }

    const videoUrl = response.data.url;
    // مسار حفظ الملف مؤقتاً في مجلد الكاش
    const cachePath = path.join(__dirname, 'cache', `download_${senderID}.mp4`);

    // جلب ملف الفيديو كـ Stream وحفظه
    const videoData = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    await fs.outputFile(cachePath, Buffer.from(videoData.data));

    const message = `
╭─── · · 📥 · · ───╮
    DOWNLOADER V1
╰─── · · ─── · · ───╯

┌ 🎬 ᴠɪᴅᴇᴏ ɪɴꜰᴏ
│ • sᴛᴀᴛᴜs : sᴜᴄᴄᴇss
│ • sᴏᴜʀᴄᴇ : ${new URL(url).hostname}
└───────────────┈

「 DONE BY YOUR BOT 」
    `.trim();

    return api.sendMessage({
      body: message,
      attachment: fs.createReadStream(cachePath)
    }, threadID, () => fs.unlinkSync(cachePath), messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage("❌ فشل تحميل الفيديو. تأكد من أن الرابط صحيح أو أن المحتوى ليس محمياً.", threadID, messageID);
  }
};

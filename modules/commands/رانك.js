const Jimp = require("jimp");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "رانك",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "GPT-5",
  description: "يعرض بطاقة الرانك الخاصة بك مع شريط تقدم وخلفية",
  commandCategory: "الألعاب",
  usages: "رانك",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, Users, Currencies }) {
  try {
    const userID = event.senderID;
    const userName = await Users.getNameUser(userID);

    // بيانات XP (يمكن ربطها بنظامك)
    const data = await Currencies.getData(userID);
    const exp = data.exp || 0;
    const level = Math.floor(exp / 1000);
    const expForNextLevel = 1000;
    const progress = Math.min(exp / expForNextLevel, 1);

    // تحميل صورة المستخدم
    const avatarURL = `https://graph.facebook.com/${userID}/picture?width=512&height=512`;
    const avatar = await Jimp.read(avatarURL);
    avatar.resize(180, 180).circle();

    // إنشاء البطاقة بلون صلب
    const card = new Jimp(900, 250, "#1e293b");

    // تحميل الخطوط
    const fontBig = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);

    // دمج صورة البروفايل
    card.composite(avatar, 30, 35);

    // كتابة البيانات بالإنجليزي
    card.print(fontBig, 240, 50, `Name: ${userName}`);
    card.print(fontSmall, 240, 110, `Level: ${level}`);
    card.print(fontSmall, 240, 150, `XP: ${exp} / ${expForNextLevel}`);

    // رسم شريط التقدم
    const barWidth = 500;
    const barHeight = 25;
    const xBar = 240;
    const yBar = 190;

    // خلفية الشريط
    card.scan(xBar, yBar, barWidth, barHeight, function (x, y, idx) {
      this.bitmap.data[idx + 0] = 100;
      this.bitmap.data[idx + 1] = 100;
      this.bitmap.data[idx + 2] = 100;
      this.bitmap.data[idx + 3] = 255;
    });

    // جزء التقدم
    card.scan(xBar, yBar, barWidth * progress, barHeight, function (x, y, idx) {
      this.bitmap.data[idx + 0] = 255;
      this.bitmap.data[idx + 1] = 215;
      this.bitmap.data[idx + 2] = 0;
      this.bitmap.data[idx + 3] = 255;
    });

    // حفظ البطاقة
    const outputPath = path.join(__dirname, "rank_card.png");
    await card.writeAsync(outputPath);

    // إرسال البطاقة
    api.sendMessage(
      {
        body: "🎖️ Your Rank Card:",
        attachment: fs.createReadStream(outputPath)
      },
      event.threadID,
      () => fs.unlinkSync(outputPath)
    );

  } catch (e) {
    console.log(e);
    api.sendMessage("❌ Error creating the rank card.", event.threadID);
  }
};

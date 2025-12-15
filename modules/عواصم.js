const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "capitalsPoints.json");

if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, JSON.stringify({}));
}

const capitals = [
  { country: "ليبيا", capital: "طرابلس" },
  { country: "مصر", capital: "القاهرة" },
  { country: "السعودية", capital: "الرياض" },
  { country: "السودان", capital: "الخرطوم" },
  { country: "الجزائر", capital: "الجزائر" },
  { country: "المغرب", capital: "الرباط" },
  { country: "تونس", capital: "تونس" },
  { country: "العراق", capital: "بغداد" },
  { country: "سوريا", capital: "دمشق" },
  { country: "الأردن", capital: "عمان" },
  { country: "فلسطين", capital: "القدس" },
  { country: "الإمارات", capital: "أبوظبي" },
  { country: "قطر", capital: "الدوحة" },
  { country: "الكويت", capital: "الكويت" },
  { country: "عُمان", capital: "مسقط" },
  { country: "اليمن", capital: "صنعاء" },
  { country: "لبنان", capital: "بيروت" },
  { country: "تركيا", capital: "أنقرة" },
  { country: "إيران", capital: "طهران" },
  { country: "أفغانستان", capital: "كابول" },

  { country: "فرنسا", capital: "باريس" },
  { country: "إيطاليا", capital: "روما" },
  { country: "ألمانيا", capital: "برلين" },
  { country: "إسبانيا", capital: "مدريد" },
  { country: "بريطانيا", capital: "لندن" },
  { country: "البرتغال", capital: "لشبونة" },
  { country: "هولندا", capital: "أمستردام" },
  { country: "بلجيكا", capital: "بروكسل" },
  { country: "سويسرا", capital: "برن" },
  { country: "النمسا", capital: "فيينا" },

  { country: "روسيا", capital: "موسكو" },
  { country: "الصين", capital: "بكين" },
  { country: "اليابان", capital: "طوكيو" },
  { country: "كوريا الجنوبية", capital: "سيول" },
  { country: "الهند", capital: "نيودلهي" },
  { country: "باكستان", capital: "إسلام آباد" },
  { country: "إندونيسيا", capital: "جاكرتا" },
  { country: "ماليزيا", capital: "كوالالمبور" },
  { country: "تايلاند", capital: "بانكوك" },

  { country: "الولايات المتحدة", capital: "واشنطن" },
  { country: "كندا", capital: "أوتاوا" },
  { country: "المكسيك", capital: "مكسيكو" },
  { country: "البرازيل", capital: "برازيليا" },
  { country: "الأرجنتين", capital: "بوينس آيرس" },
  { country: "تشيلي", capital: "سانتياغو" },

  { country: "أستراليا", capital: "كانبيرا" },
  { country: "نيوزيلندا", capital: "ويلينغتون" },
  { country: "جنوب أفريقيا", capital: "بريتوريا" },
  { country: "نيجيريا", capital: "أبوجا" },
  { country: "إثيوبيا", capital: "أديس أبابا" },
  { country: "كينيا", capital: "نيروبي" }
];

module.exports.config = {
  name: "عواصم",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "محمد إدريس",
  description: "لعبة عواصم الدول مع نظام نقاط"
};

module.exports.run = async function ({ api, event }) {
  const random = capitals[Math.floor(Math.random() * capitals.length)];

  api.sendMessage(
    `🌍 لعبة العواصم\n\n❓ ما هي عاصمة دولة:\n「 ${random.country} 」 ؟\n\n✍️ قم بالرد على هذه الرسالة بالإجابة`,
    event.threadID,
    (err, info) => {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: event.senderID,
        answer: random.capital
      });
    }
  );
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  if (event.senderID != handleReply.author) return;

  const pointsData = JSON.parse(fs.readFileSync(dataPath));
  const userID = event.senderID;

  if (!pointsData[userID]) pointsData[userID] = 0;

  if (event.body.trim() === handleReply.answer) {
    pointsData[userID] += 10;

    api.sendMessage(
      `🎉 إجابة صحيحة!\n✅ العاصمة: ${handleReply.answer}\n⭐ نقاطك: ${pointsData[userID]}`,
      event.threadID
    );
  } else {
    api.sendMessage(
      `❌ إجابة خاطئة\n📌 الإجابة الصحيحة: ${handleReply.answer}`,
      event.threadID
    );
  }

  fs.writeFileSync(dataPath, JSON.stringify(pointsData, null, 2));
};

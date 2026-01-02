const axios = require("axios");

module.exports.config = {
  name: "مواقيت",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ᎠᎯᎢᎬ ᏚᎮᎯᏒᎠᎯ",
  description: "عرض مواقيت الصلاة حسب مدينتك",
  commandCategory: "دين",
  usages: "[اسم المدينة]",
  cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;
  const city = args.join(" ");
  if (!city) return api.sendMessage("⚠️ ارجوك اكتب اسم المدينة (مثال: مواقيت مكة)", threadID, messageID);

  try {
    const res = await axios.get(`http://api.aladhan.com/v1/timingsByAddress?address=${encodeURIComponent(city)}`);
    const timings = res.data.data.timings;
    const date = res.data.data.date.readable;

    const msg = `🕌 ﹝ مواقيت الصلاة: ${city} ﹞\n\n` +
                `📅 التاريخ: ${date}\n` +
                `─── ❖ ── ✦ ── ❖ ───\n` +
                `🏙 الفجر: ${timings.Fajr}\n` +
                `☀️ الشروق: ${timings.Sunrise}\n` +
                `🌇 الظهر: ${timings.Dhuhr}\n` +
                `🌆 العصر: ${timings.Asr}\n` +
                `🌃 المغرب: ${timings.Maghrib}\n` +
                `🌌 العشاء: ${timings.Isha}\n` +
                `─── ❖ ── ✦ ── ❖ ───\n` +
                `✨ كايـࢪوس | الصلاة عماد الدين`;

    return api.sendMessage(msg, threadID, messageID);
  } catch (e) {
    return api.sendMessage("❌ تعذر العثور على المدينة، تأكد من كتابة الاسم بشكل صحيح.", threadID, messageID);
  }
};

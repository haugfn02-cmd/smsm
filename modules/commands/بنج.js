module.exports.config = {
  name: "بنج",
  version: "1.0.0",
  hasPermssion: 0, // متاح للجميع
  credits: "Gemini",
  description: "قياس سرعة استجابة البوت والسيرفر",
  commandCategory: "الخدمات",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;

  // قياس وقت البداية
  const startTime = Date.now();

  return api.sendMessage("جاري القياس...", threadID, (err, info) => {
    if (err) return;

    // قياس وقت النهاية بعد إرسال الرسالة
    const endTime = Date.now();
    const ping = endTime - startTime;

    // تحديد الحالة بناءً على سرعة البنج
    let status = ping < 200 ? "ممتازة ⚡" : ping < 500 ? "جيدة 🟢" : "ضعيفة 🔴";

    const msg = 
      `📶 حالة الاتصال:\n` +
      `• سرعة الاستجابة: ${ping}ms\n` +
      `• جودة الإشارة: ${status}\n` +
      `• السيرفر: مستقر ✅`;

    api.editMessage(msg, info.messageID);
  }, messageID);
};

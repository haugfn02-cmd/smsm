const fs = require("fs-extra");
const path = require("path");

const pathData = __dirname + "/../../includes/autopilot.json";
const cachePath = __dirname + "/../../cache/";

module.exports.config = {
  name: "طيار",
  version: "9.0.0",
  hasPermssion: 2,
  credits: "Gemini & Kiro",
  description: "نظام الإدارة الشامل + بصمة زمنية + منع سبام الإيموجي",
  commandCategory: "المطور",
  usages: "[ساعات / ايقاف / تنظيف]",
  cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, senderID } = event;
  const adminID = "61581906898524";

  if (senderID !== adminID) return api.sendMessage("⚠️ هذا النظام للمطور فقط.", threadID);

  let data = fs.existsSync(pathData) ? JSON.parse(fs.readFileSync(pathData)) : { isRunning: false, report: [], startTime: 0 };

  // --- 1. أمر التنظيف ---
  if (args[0] === "تنظيف") {
    const files = fs.readdirSync(cachePath);
    files.forEach(file => { if (file !== ".gitkeep") fs.unlinkSync(path.join(cachePath, file)); });
    return api.sendMessage(`🧹 تم تنظيف الكاش بنجاح.`, threadID);
  }

  // --- 2. إيقاف النظام ---
  if (args[0] === "ايقاف") {
    if (!data.isRunning) return api.sendMessage("❌ النظام متوقف بالفعل.", threadID);
    let reportMsg = "📊 『 تـقـريـر الـغـيـاب 』\n━━━━━━━━━━━━\n" + (data.report.length > 0 ? data.report.slice(-15).join("\n") : "✅ غياب هادئ.");
    
    data.isRunning = false;
    data.report = [];
    fs.writeFileSync(pathData, JSON.stringify(data, null, 4));
    return api.sendMessage(reportMsg, threadID);
  }

  // --- 3. التفعيل ---
  let hours = parseFloat(args[0]);
  if (isNaN(hours) || hours <= 0) return api.sendMessage("⚠️ حدد الساعات. مثال: طيار 5", threadID);

  data = {
    isRunning: true,
    startTime: Date.now(),
    endTime: Date.now() + (hours * 3600000),
    report: [],
    antiCoup: {},
    devID: adminID
  };

  fs.writeFileSync(pathData, JSON.stringify(data, null, 4));
  return api.sendMessage(`🚀 وضع الطيار الآلي نشط لـ (${hours}) ساعة.\n\n🌟 الميزات الجديدة:\n🔹 ترحيب آلي بالأعضاء\n🔹 منع سبام الإيموجي\n🔹 بصمة زمنية للغياب`, threadID);
};

module.exports.handleEvent = async ({ api, event }) => {
  if (!fs.existsSync(pathData)) return;
  let data = JSON.parse(fs.readFileSync(pathData));
  if (!data.isRunning) return;

  const { threadID, senderID, body, messageID, logMessageType } = event;
  const time = new Date().toLocaleTimeString();

  // 1. فحص انتهاء الوقت
  if (Date.now() > data.endTime) {
    data.isRunning = false;
    fs.writeFileSync(pathData, JSON.stringify(data, null, 4));
    return api.sendMessage("🔔 انتهت مدة الطيار الآلي المحددة.", threadID);
  }

  // 2. ترحيب الغياب (عند دخول عضو جديد)
  if (logMessageType === "log:subscribe") {
    api.sendMessage("👋 أهلاً بك! المطور غائب حالياً والبوت في وضع الحماية الذاتية، استمتع بوقتك!", threadID);
  }

  // 3. مكافحة الانقلاب (Anti-Coup)
  if (logMessageType === "log:unsubscribe") {
    const author = event.author;
    if (author && author !== api.getCurrentUserID() && author !== data.devID) {
        data.antiCoup[author] = (data.antiCoup[author] || 0) + 1;
        if (data.antiCoup[author] >= 3) {
            api.changeAdminStatus(threadID, author, false);
            api.sendMessage(`🚫 رصد محاولة تصفية! سحب رتبة الإدمن من المخرب.`, threadID);
            data.report.push(`- [${time}] سحب رتبة من (${author})`);
        }
        fs.writeFileSync(pathData, JSON.stringify(data, null, 4));
    }
  }

  if (body) {
    // 4. البصمة الزمنية عند المنشن
    if (body.includes(data.devID)) {
        const diff = Date.now() - data.startTime;
        const mins = Math.floor(diff / 60000);
        const hrs = Math.floor(mins / 60);
        let timeMsg = hrs > 0 ? `${hrs} ساعة و ${mins % 60} دقيقة` : `${mins} دقيقة`;
        api.sendMessage(`👤 المطور غائب منذ (${timeMsg}). أنا أدير الأمور حالياً!`, threadID);
    }

    // 5. منع سبام الإيموجي (> 10 إيموجي)
    const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
    const emojiCount = (body.match(emojiRegex) || []).length;
    if (emojiCount > 10) {
        api.unsendMessage(messageID);
        return api.sendMessage("⚠️ يمنع إرسال الكثير من الرموز التعبيرية (سبام إيموجي).", threadID);
    }

    // 6. حماية الروابط
    if (/https?:\/\/[^\s]+/g.test(body) && senderID !== api.getCurrentUserID()) {
        api.unsendMessage(messageID);
        data.report.push(`- [${time}] حذف رابط من (${senderID})`);
        fs.writeFileSync(pathData, JSON.stringify(data, null, 4));
    }
  }
};

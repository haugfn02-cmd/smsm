const fs = require("fs-extra");
const path = __dirname + "/../commands/cache/groups.json";

module.exports.config = {
  name: "antiChange",
  eventType: ["log:thread-name", "log:thread-icon", "log:user-nickname", "log:unsubscribe"],
  version: "2.0.0",
  credits: "Gemini",
  description: "منع التغييرات وإعادة الإعدادات الأصلية"
};

module.exports.run = async function ({ api, event }) {
  const { threadID, logMessageType, logMessageData, author } = event;
  const botID = api.getCurrentUserID();

  // إذا كان المغير هو البوت نفسه، تجاهل الأمر
  if (author == botID) return;

  if (!fs.existsSync(path)) return;
  let data = JSON.parse(fs.readFileSync(path));
  const s = data[threadID];
  if (!s) return;

  // 1. حماية اسم المجموعة
  if (logMessageType === "log:thread-name" && s.nameProtect) {
    api.setTitle(s.originalName, threadID, (err) => {
      if (!err) api.sendMessage("⚠️ التغيير غير مسموح به! تمت إعادة اسم المجموعة.", threadID);
    });
  }

  // 2. حماية الكنيات (حذف الكنية الجديدة)
  if (logMessageType === "log:user-nickname" && s.nicknameProtect) {
    // إرجاع الكنية القديمة أو حذف الكنية الحالية
    const oldNickname = logMessageData.oldNickname || "";
    api.changeNickname(oldNickname, threadID, logMessageData.participantFbId, (err) => {
      if (!err) api.sendMessage("⚠️ التغيير غير مسموح به! تم حذف/إعادة الكنية.", threadID);
    });
  }

  // 3. حماية الصورة
  if (logMessageType === "log:thread-icon" && s.imageProtect) {
     api.sendMessage("⚠️ تغيير صورة المجموعة غير مسموح به!", threadID);
     // ملاحظة: استعادة الصورة تتطلب صلاحيات كاملة ورفع ملف، فيسبوك يصعب استعادتها تلقائياً برابط.
  }

  // 4. مكافحة الخروج
  if (logMessageType === "log:unsubscribe" && s.antiOut) {
    if (logMessageData.leftParticipantFbId != botID) {
      api.addUserToGroup(logMessageData.leftParticipantFbId, threadID, (err) => {
        if (!err) api.sendMessage("⚠️ مكافحة الخروج مفعلة، تم إعادة العضو.", threadID);
      });
    }
  }
};

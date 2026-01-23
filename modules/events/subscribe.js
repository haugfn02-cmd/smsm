const fs = require("fs-extra");
const path = require("path");
const blacklistPath = path.join(__dirname, "..", "commands", "cache", "blacklist.json");

module.exports.config = {
  name: "subscribeNotification",
  eventType: ["log:subscribe"],
  version: "1.0.0",
  credits: "ᎠᎯᏁᎢᎬ ᏚᎮᎯᏒᎠᎯ",
  description: "تنبيه المطور عند إضافة البوت لمجموعة جديدة"
};

module.exports.run = async function({ api, event }) {
  const developerID = "61581906898524";
  const { threadID, author, logMessageData } = event;
  
  if (logMessageData.addedParticipants.some(p => p.userFbId == api.getCurrentUserID())) {
    // التحقق من الحظر
    let blacklist = fs.existsSync(blacklistPath) ? fs.readJsonSync(blacklistPath) : [];
    if (blacklist.includes(threadID)) {
      api.sendMessage("🚫 نـعتذر، هـذه الـمجموعة مـحـظـورة بـأمر مـن ᎠᎯᏁᎢᎬ ᏚᎮᎯᏒᎠᎯ.", threadID);
      return api.removeUserFromGroup(api.getCurrentUserID(), threadID);
    }

    if (author !== developerID) {
      // رسالة للمجموعة
      api.sendMessage(`📥 تـم إرسـال طـلـبك لـلمراجـعة!\n━━━━━━━━━━━━━\n🆔 ID: #${threadID.substring(0,8)}\n👑 المسؤول: ᎠᎯᏁᎢᎬ ᏚᎮᎯᏒᎠᎯ\n⏳ الـحـالة: قـيـد الـتـدقيق\n━━━━━━━━━━━━━\n🔔 سـيتم تفعيل البوت فور موافقة المطور.`, threadID);
      
      // إشعار خاص للمطور
      api.sendMessage(`🚩 إشـعـار انـضـمـام جـديـد:\n━━━━━━━━━━━━━\n👤 الـمضيف: ${author}\n👥 الـمجموعة: ${event.threadName || "مجهولة"}\n🆔 ID: ${threadID}\n━━━━━━━━━━━━━\nاستخدم امر (الطلبات) للموافقة أو الرفض.`, developerID);
    } else {
      api.sendMessage("⚔️ أهلاً بك سيدي ᎠᎯᏁᎢᎬ ᏚᎮᎯᏒᎠᎯ. تم تفعيل البوت تلقائياً لأنك المطور.", threadID);
      api.changeNickname(`[ ${(!global.config.BOTNAME) ? "ᎠᎯᏁᎢᎬ ᏚᎮᎯᏒᎠᎯ BOT" : global.config.BOTNAME} ]`, threadID, api.getCurrentUserID());
    }
  }
};

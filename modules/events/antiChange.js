const fs = require("fs-extra");
const moment = require("moment-timezone");
const path = __dirname + "/../commands/cache/groups.json";

module.exports.config = {
  name: "antiChange",
  eventType: ["log:thread-name", "log:thread-icon", "log:user-nickname", "log:unsubscribe", "log:subscribe"],
  version: "3.1.5",
  credits: "Gemini",
  description: "نظام حماية متكامل مع رسالة وداع أنيقة"
};

module.exports.run = async function ({ api, event }) {
  const { threadID, logMessageType, logMessageData, author } = event;
  const botID = api.getCurrentUserID();
  // توقيت السودان (الخرطوم)
  const time = moment.tz("Africa/Khartoum").format("HH:mm • DD/MM/YYYY");

  if (author == botID) return;
  if (!fs.existsSync(path)) return;
  let data = JSON.parse(fs.readFileSync(path));
  const s = data[threadID];
  if (!s) return;

  // --- 1. حماية اسم المجموعة ---
  if (logMessageType === "log:thread-name" && s.nameProtect) {
    return api.setTitle(s.originalName, threadID, () => {
      api.sendMessage("⌈ م تهبش 🦧 ⌋", threadID);
    });
  }

  // --- 2. حماية الكنيات (الألقاب) ---
  if (logMessageType === "log:user-nickname" && s.nicknameProtect) {
    // إرجاع اللقب لما كان عليه قبل التغيير
    const oldNickname = logMessageData.oldNickname || "";
    const victimID = logMessageData.participantFbId;
    return api.changeNickname(oldNickname, threadID, victimID, () => {
      api.sendMessage("⌈ م تناخس يعب 🦧🤞 ⌋", threadID);
    });
  }

  // --- 3. منع الدخول (Anti-Join) ---
  if (logMessageType === "log:subscribe" && s.antiJoin) {
    const addedUsers = logMessageData.addedParticipants;
    for (let user of addedUsers) {
      if (user.userFbId != botID) {
        api.removeUserFromGroup(user.userFbId, threadID);
      }
    }
    return api.sendMessage(`⚠️ منع الدخول مفعل حالياً، تم طرد المنضمين الجدد.`, threadID);
  }

  // --- 4. مكافحة الخروج أو الوداع (Unsubscribe) ---
  if (logMessageType === "log:unsubscribe") {
    const leftID = logMessageData.leftParticipantFbId;
    
    if (leftID == botID) return;

    if (s.antiOut) {
      // إذا كان منع الخروج مفعلاً: إعادة العضو
      api.addUserToGroup(leftID, threadID, (err) => {
        if (!err) api.sendMessage("الحق العب قال مارق بكرامتو 🐸🤞", threadID);
      });
    } else {
      // إذا كان منع الخروج معطلاً: إرسال رسالة وداع فخمة
      try {
        const info = await api.getUserInfo(leftID);
        const name = info[leftID].name;
        const threadInfo = await api.getThreadInfo(threadID);
        const threadName = threadInfo.threadName || "مجموعة غير مسمى";
        const participantCount = threadInfo.participantIDs.length;

        const msg = `╭─────────────╮\n         ⌈ غـادر أحـد الأعـضـاء ⌋\n╰─────────────╯\n\n  ⪼ الـعـضـو ⌭ ${name}\n  ⪼ الـمـجـمـوعـة ⌭ ${threadName}\n  ⪼ عـددنـا الآن ⌭ ( ${participantCount} )\n  ⪼ الـتـوقـيـت ⌭ ${time}\n\n⌬─────────────⌬`;
        api.sendMessage(msg, threadID);
      } catch (e) {
        console.log("Error in farewell message: ", e);
      }
    }
  }

  // --- 5. حماية الصورة ---
  if (logMessageType === "log:thread-icon" && s.imageProtect) {
    api.sendMessage("⌈ م تلعب بي امك 🦧 ⌋", threadID);
  }
};

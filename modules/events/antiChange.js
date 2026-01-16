const fs = require("fs-extra");
const path = __dirname + "/cache/groups.json";
const moment = require("moment-timezone");

module.exports.config = {
  name: "antiChange",
  eventType: ["log:thread-name", "log:thread-icon", "log:user-nickname", "log:unsubscribe", "log:subscribe"],
  version: "3.0.0",
  credits: "Gemini",
  description: "نظام حماية صامت مع وداع ذكي"
};

module.exports.run = async function ({ api, event }) {
  const { threadID, logMessageType, logMessageData, author } = event;
  const botID = api.getCurrentUserID();

  if (author == botID) return;
  if (!fs.existsSync(path)) return;
  let data = JSON.parse(fs.readFileSync(path));
  const s = data[threadID];
  if (!s) return;

  const time = moment.tz("Africa/Khartoum").format("HH:mm • DD/MM/YYYY");

  // 1. حماية اسم المجموعة
  if (logMessageType === "log:thread-name" && s.nameProtect) {
    return api.setTitle(s.originalName, threadID, () => api.sendMessage("م تهبش 🦧", threadID));
  }

  // 2. حماية الكنيات (تم الإصلاح لفرض الحذف)
  if (logMessageType === "log:user-nickname" && s.nicknameProtect) {
    return api.changeNickname("", threadID, logMessageData.participantFbId, () => {
      api.sendMessage("م تناخس يعب 🦧🤞", threadID);
    });
  }

  // 3. حماية الصورة
  if (logMessageType === "log:thread-icon" && s.imageProtect) {
    return api.sendMessage("م تلعب بي امك 🦧", threadID);
  }

  // 4. منع الدخول
  if (logMessageType === "log:subscribe" && s.antiJoin) {
    const addedUsers = logMessageData.addedParticipants;
    for (let user of addedUsers) {
      if (user.userFbId != botID) api.removeUserFromGroup(user.userFbId, threadID);
    }
    return api.sendMessage(`⚠️ منع الدخول مفعل حالياً.`, threadID);
  }

  // 5. الخروج (منع الخروج أو وداع)
  if (logMessageType === "log:unsubscribe") {
    const leftID = logMessageData.leftParticipantFbId;
    if (leftID == botID) return;

    if (s.antiOut) {
      return api.addUserToGroup(leftID, threadID, (err) => {
        if (!err) api.sendMessage("الحق العب قال مارق بكرامتو 🐸🤞", threadID);
      });
    } else {
      const info = await api.getThreadInfo(threadID);
      const userData = await api.getUserInfo(leftID);
      const name = userData[leftID] ? userData[leftID].name : "عضو";
      
      const goodbyeMsg = `⌬─────────────⌬\n` +
        `  ⪼ الـغـادر : ${name}\n` +
        `  ⪼ الـمـجـمـوعـة ⌭ ${info.threadName}\n` +
        `  ⪼ عـددنـا الآن ⌭ ( ${info.participantIDs.length} )\n` +
        `  ⪼ الـتـوقـيـت ⌭ ${time}\n` +
        `⌬─────────────⌬`;
      return api.sendMessage(goodbyeMsg, threadID);
    }
  }
};

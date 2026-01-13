const fs = require("fs-extra");
const path = __dirname + "/../commands/cache/groups.json";

module.exports.config = {
  name: "antiChange",
  eventType: ["log:thread-name", "log:thread-icon", "log:user-nickname", "log:unsubscribe", "log:subscribe"],
  version: "2.9.0",
  credits: "Gemini",
  description: "نظام حماية صامت (بدون إشعارات دخول/خروج)"
};

module.exports.run = async function ({ api, event }) {
  const { threadID, logMessageType, logMessageData, author } = event;
  const botID = api.getCurrentUserID();

  if (author == botID) return;
  if (!fs.existsSync(path)) return;
  let data = JSON.parse(fs.readFileSync(path));
  const s = data[threadID];
  if (!s) return;

  // 1. حماية اسم المجموعة
  if (logMessageType === "log:thread-name" && s.nameProtect) {
    return api.setTitle(s.originalName, threadID, () => api.sendMessage("م تهبش 🦧", threadID));
  }

  // 2. حماية الكنيات
  if (logMessageType === "log:user-nickname" && s.nicknameProtect) {
    return api.changeNickname("", threadID, logMessageData.participantFbId, () => api.sendMessage("م تناخس يعب 🦧🤞", threadID));
  }

  // 3. حماية الصورة
  if (logMessageType === "log:thread-icon" && s.imageProtect) {
    return api.sendMessage("م تلعب بي امك 🦧", threadID);
  }

  // 4. منع الدخول (Anti-Join)
  if (logMessageType === "log:subscribe" && s.antiJoin) {
    const addedUsers = logMessageData.addedParticipants;
    for (let user of addedUsers) {
      if (user.userFbId != botID) {
        api.removeUserFromGroup(user.userFbId, threadID, () => {
          api.sendMessage(`⚠️ منع الدخول مفعل حالياً.`, threadID);
        });
      }
    }
    return;
  }

  // 5. مكافحة الخروج (إعادة العضو فقط بدون إشعار باساتيل)
  if (logMessageType === "log:unsubscribe" && s.antiOut) {
    const leftID = logMessageData.leftParticipantFbId;
    if (leftID != botID) {
      api.addUserToGroup(leftID, threadID, (err) => {
        if (!err) api.sendMessage("الحق العب قال مارق بكرامتو 🐸🤞", threadID);
      });
    }
  }
};

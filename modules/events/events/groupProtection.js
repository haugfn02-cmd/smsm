const fs = require("fs");
const path = require("path");

const dataFile = path.join(__dirname, "../data/groupProtection.json");

function loadData() {
  if (!fs.existsSync(dataFile)) return {};
  return JSON.parse(fs.readFileSync(dataFile));
}

module.exports.config = {
  name: "groupProtection",
  eventType: [
    "log:thread-name",
    "log:thread-image",
    "log:user-nickname",
    "log:unsubscribe"
  ]
};

module.exports.run = async function ({ api, event }) {
  const data = loadData();
  const s = data[event.threadID];
  if (!s) return;

  /* ========= حماية اسم المجموعة ========= */
  if (event.logMessageType === "log:thread-name" && s.antiName) {
    if (s.name && event.logMessageData.name !== s.name) {
      await api.setTitle(s.name, event.threadID);
      api.sendMessage("🚫 ممنوع تغيير اسم المجموعة 🐸☝🏿", event.threadID);
    }
  }

  /* ========= حماية صورة المجموعة ========= */
  if (event.logMessageType === "log:thread-image" && s.antiImage) {
    if (!s.image || !fs.existsSync(s.image)) return;
    try {
      await api.setImage(fs.createReadStream(s.image), event.threadID);
      api.sendMessage("🚫 ممنوع تغيير صورة المجموعة 🐸☝🏿", event.threadID);
    } catch {}
  }

  /* ========= حماية الكنيات ========= */
  if (event.logMessageType === "log:user-nickname" && s.antiNickname) {
    const uid = event.logMessageData.participant_id;
    const oldNick = s.nicknames?.[uid] ?? "";

    await api.changeNickname(oldNick, event.threadID, uid);
    api.sendMessage("🚫 الكنية محمية 🐸☝🏿", event.threadID);
  }

  /* ========= مكافحة الخروج ========= */
  if (event.logMessageType === "log:unsubscribe" && s.antiLeave) {
    const uid = event.logMessageData.leftParticipantFbId;

    // تجاهل لو البوت نفسه
    if (uid === api.getCurrentUserID()) return;

    try {
      await api.addUserToGroup(uid, event.threadID);
      api.sendMessage("😂 قال مارق بكرامتو 🐸☝🏿", event.threadID);
    } catch {}
  }
};

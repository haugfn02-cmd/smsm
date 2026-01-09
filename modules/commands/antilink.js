const fs = require("fs-extra");
const path = require("path");

const dataPath = __dirname + "/cache/antilink.json";

module.exports.config = {
  name: "antilink",
  version: "2.0",
  hasPermssion: 1,
  credits: "ᎠᎯᎢᎬ ᏚᎮᎯᏒᎠᎯ",
  description: "منع الروابط مع حذف فوري وطرد العضو",
  commandCategory: "الحماية",
  usages: "on/off",
  cooldowns: 3,
};

module.exports.run = async function({ api, event, args }) {
  if (!fs.existsSync(dataPath)) fs.writeJsonSync(dataPath, {});
  const data = fs.readJsonSync(dataPath);
  const { threadID } = event;

  if (args[0] == "on") {
    data[threadID] = true;
    fs.writeJsonSync(dataPath, data);
    return api.sendMessage("🚫 تم تفعيل نظام مكافحة الروابط (الجغم مفعل).", threadID);
  } 
  if (args[0] == "off") {
    data[threadID] = false;
    fs.writeJsonSync(dataPath, data);
    return api.sendMessage("✅ تم إيقاف نظام مكافحة الروابط.", threadID);
  }
  return api.sendMessage("استخدم: antilink on أو off", threadID);
};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, senderID, body, messageID } = event;
  if (!body) return;

  if (!fs.existsSync(dataPath)) return;
  const data = fs.readJsonSync(dataPath);
  if (!data[threadID]) return;

  const linkRegex = /(https?:\/\/|www\.|facebook\.com|me\.me)/i;

  if (linkRegex.test(body)) {
    // 🛡️ استثناء الأدمن والمطور
    const threadInfo = await api.getThreadInfo(threadID);
    const admins = threadInfo.adminIDs.map(a => a.id);
    const developerID = "61570782968645"; 

    if (admins.includes(senderID) || senderID == developerID || senderID == api.getCurrentUserID()) return;

    // 1. حذف الرسالة فوراً
    try {
      api.unsendMessage(messageID);
    } catch (e) {}

    // 2. إرسال تحذير نهائي
    api.sendMessage(`يمنع نشر الروابط! جاري جغم العضو.. (⌣̀_𓁹)`, threadID);

    // 3. الطرد الفعلي
    setTimeout(() => {
      api.removeUserFromGroup(senderID, threadID, (err) => {
        if (err) return api.sendMessage("ما قدرت أطرد العضو، تأكد إن البوت أدمن (⌣̀_𓁹)", threadID);
        return api.sendMessage("تم الجغم بنجاح، طار العضو (⌣̀_𓁹)", threadID);
      });
    }, 2000); // طرد بعد ثانيتين من الحذف
  }
};

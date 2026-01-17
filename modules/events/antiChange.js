const fs = require("fs-extra");
const axios = require("axios");
const moment = require("moment-timezone");
const path = __dirname + "/../commands/cache/groups.json";

module.exports.config = {
  name: "antiChange",
  eventType: ["log:thread-name", "log:thread-icon", "log:user-nickname", "log:unsubscribe", "log:subscribe"],
  version: "3.2.0",
  credits: "Gemini",
  description: "نظام حماية متطور (استعادة بيانات + تمييز الطرد)"
};

module.exports.run = async function ({ api, event }) {
  const { threadID, logMessageType, logMessageData, author } = event;
  const botID = api.getCurrentUserID();
  const time = moment.tz("Africa/Khartoum").format("HH:mm • DD/MM/YYYY");

  if (author == botID) return;
  if (!fs.existsSync(path)) return;
  let data = JSON.parse(fs.readFileSync(path));
  const s = data[threadID];
  if (!s) return;

  // --- 1. حماية اسم المجموعة ---
  if (logMessageType === "log:thread-name" && s.nameProtect) {
    if (logMessageData.name !== s.originalName) {
      return api.setTitle(s.originalName, threadID, (err) => {
        if (!err) api.sendMessage("⌈ م تهبش الاسم يعب 🦧 ⌋", threadID);
      });
    }
  }

  // --- 2. حماية الكنيات (الألقاب) ---
  if (logMessageType === "log:user-nickname" && s.nicknameProtect) {
    const oldNickname = logMessageData.oldNickname || "";
    const victimID = logMessageData.participantFbId;
    // استعادة الكنية القديمة فوراً
    return api.changeNickname(oldNickname, threadID, victimID, (err) => {
      if (!err) api.sendMessage("⌈ م تناخس في الألقاب 🦧🤞 ⌋", threadID);
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
    return api.sendMessage(`⚠️ منع الدخول مفعل، المجموعة مغلقة حالياً.`, threadID);
  }

  // --- 4. معالجة المغادرة والطرد (Unsubscribe) ---
  if (logMessageType === "log:unsubscribe") {
    const leftID = logMessageData.leftParticipantFbId;
    if (leftID == botID) return;

    // الحالة أ: الشخص طُرد بواسطة مسؤول (Admin)
    if (author !== leftID) {
      return api.sendMessage("بلع بانكاي  <(｀^´)>", threadID);
    }

    // الحالة ب: الشخص خرج بنفسه (Anti-Out)
    if (s.antiOut) {
      api.addUserToGroup(leftID, threadID, (err) => {
        if (!err) {
          api.sendMessage("الحق العب قال مارق بكرامتو 🐸🤞", threadID);
        } else {
          api.sendMessage("حاول يهرب بس الحماية منعته (تعذر إعادته تلقائياً)", threadID);
        }
      });
    } else {
      // رسالة الوداع العادية
      try {
        const info = await api.getUserInfo(leftID);
        const name = info[leftID].name;
        const threadInfo = await api.getThreadInfo(threadID);
        const threadName = threadInfo.threadName || "مجموعة غير مسمى";
        const participantCount = threadInfo.participantIDs.length;

        const msg = `╭─────────────╮\n         ⌈ غـادر أحـد الأعـضـاء ⌋\n╰─────────────╯\n\n  ⪼ الـعـضـو ⌭ ${name}\n  ⪼ الـمـجـمـوعـة ⌭ ${threadName}\n  ⪼ عـددنـا الآن ⌭ ( ${participantCount} )\n  ⪼ الـتـوقـيـت ⌭ ${time}\n\n⌬─────────────⌬`;
        api.sendMessage(msg, threadID);
      } catch (e) {
        console.log(e);
      }
    }
  }

  // --- 5. حماية الصورة (تتطلب رابط الصورة في originalImage) ---
  if (logMessageType === "log:thread-icon" && s.imageProtect) {
    if (s.originalImage) {
      const imagePath = __dirname + "/cache/restored_icon.png";
      try {
        const getImg = (await axios.get(s.originalImage, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(imagePath, Buffer.from(getImg, "utf-8"));
        
        api.changeGroupImage(fs.createReadStream(imagePath), threadID, (err) => {
          fs.unlinkSync(imagePath);
          if (!err) api.sendMessage("⌈ م تلعب بـ صورة القروب 🦧 ⌋", threadID);
        });
      } catch (e) {
        api.sendMessage("⌈ م تلعب بي امك 🦧 ⌋\n(فشلت استعادة الصورة لعدم توفر رابط صالح)", threadID);
      }
    } else {
      api.sendMessage("⌈ م تلعب بي امك 🦧 ⌋", threadID);
    }
  }
};

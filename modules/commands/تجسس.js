module.exports.config = {
  name: "تجسس",
  version: "2.0.0",
  hasPermssion: 2,
  credits: "Gemini & Kiro",
  description: "نظام التجسس الذكي للمطور لمراقبة أحداث المجموعات",
  commandCategory: "المطور",
  usages: "[on / off]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const adminID = "100081948980908";

  if (senderID !== adminID) return api.sendMessage("⚠️ هذا الأمر للمطور فقط.", threadID);

  if (!global.config.spyMode) global.config.spyMode = false;

  if (args[0] === "on") {
    global.config.spyMode = true;
    return api.sendMessage("🕵️‍♂️ تم تفعيل نظام التجسس الذكي. ستصلك التقارير في الخاص.", threadID);
  }

  if (args[0] === "off") {
    global.config.spyMode = false;
    return api.sendMessage("📴 تم إيقاف نظام التجسس.", threadID);
  }
};

// --- نظام مراقبة الأحداث وإرسالها للمطور ---
module.exports.handleEvent = async function({ api, event }) {
  if (!global.config.spyMode) return;
  const adminID = "100081948980908";
  const { threadID, senderID, body, type, logMessageType, logMessageData } = event;

  // تجنب إرسال إشعارات عن أفعال المطور نفسه
  if (senderID === adminID) return;

  let msg = "";

  // 1. مراقبة المنشن للمطور
  if (body && (body.includes(adminID) || body.includes("المطور"))) {
    msg = `🔔 [إشعار ذكر]\n👤 العضو: ${senderID}\n Groups ID: ${threadID}\n📝 الرسالة: ${body}`;
  }

  // 2. مراقبة الانضمام والمغادرة
  if (type === "log:subscribe") {
    msg = `📥 [عضو جديد]\n👥 انضم عضو إلى المجموعة: ${threadID}\n👤 المضاف: ${logMessageData.addedParticipants[0].fullName}`;
  } 
  else if (type === "log:unsubscribe") {
    msg = `📤 [مغادرة]\n👥 غادر عضو من المجموعة: ${threadID}`;
  }

  // 3. مراقبة تغيير إعدادات المجموعة
  if (logMessageType === "log:thread-name") {
    msg = `✏️ [تغيير اسم]\n👥 تم تغيير اسم المجموعة (${threadID}) إلى: ${logMessageData.name}`;
  }

  // إرسال التقرير للمطور في الخاص
  if (msg !== "") {
    api.sendMessage(msg, adminID);
  }
};

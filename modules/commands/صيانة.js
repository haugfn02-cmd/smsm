module.exports.config = {
  name: "صيانة",
  version: "1.0.5",
  hasPermssion: 2,
  credits: "Gemini",
  description: "تفعيل أو تعطيل وضع الصيانة",
  commandCategory: "المطور",
  usages: "[on/off]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const adminID = "100081948980908"; 

  if (event.senderID !== adminID) {
    return api.sendMessage("⚠️ هذا الأمر للمطور فقط.", threadID, messageID);
  }

  if (args[0]?.toLowerCase() === "on") {
    global.config.maintenanceMode = true;
    return api.sendMessage("تم تفعيل الصيانة", threadID, messageID);
  } 

  if (args[0]?.toLowerCase() === "off") {
    global.config.maintenanceMode = false;
    return api.sendMessage("تم ايقاف وضع الصيانة", threadID, messageID);
  }

  return api.sendMessage("استخدم: صيانة on أو off", threadID, messageID);
};

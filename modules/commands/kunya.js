module.exports.config = {
  name: "كنية",
  version: "1.0.0",
  hasPermssion: 1, // أدمن فقط
  credits: "ChatGPT",
  description: "تعيين كنية لعضو أو لنفسك",
  commandCategory: "الإدارة",
  usages: "كنية <الكنية> + تاغ / رد (اختياري)",
  cooldowns: 0
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, mentions, type, messageReply } = event;

  // تجاهل غير الأدمن
  if (event.senderID && !event.isAdmin) return;

  if (!args[0]) return;

  const nickname = args.join(" ");

  let targetID = senderID;

  // إذا في رد
  if (type === "message_reply" && messageReply) {
    targetID = messageReply.senderID;
  }

  // إذا في تاغ
  else if (Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
  }

  try {
    await api.changeNickname(nickname, threadID, targetID);
  } catch (e) {
    return;
  }
};

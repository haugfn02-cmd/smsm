module.exports.config = {
  name: "بلاغ",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "YASSIN",
  description: "إرسال بلاغ أو رسالة للمطور",
  commandCategory: "نظام",
  usages: "[الرسالة]",
  cooldowns: 5
};

module.exports.handleReply = async function ({ api, event, handleReply, Threads }) {
  const { threadID, messageID, senderID, body } = event;
  const adminID = "100081948980908"; // الأيدي الخاص بك

  switch (handleReply.type) {
    case "reply": {
      // إذا كان المطور هو من يرد
      if (senderID == adminID) {
        api.sendMessage({
          body: `📩 رصيد من المطور إليك:\n\n${body}\n\nرد على هذه الرسالة إذا كنت تريد الاستمرار في التواصل.`,
        }, handleReply.threadID, (err, info) => {
          global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            threadID: handleReply.threadID,
            type: "reply"
          });
        }, handleReply.messageID);
      } 
      // إذا كان المستخدم يرد على رسالة المطور
      else {
        api.sendMessage({
          body: `📢 بلاغ جديد من: ${senderID}\nالجروب: ${(await Threads.getInfo(threadID)).threadName || "خاص"}\nالرسالة: ${body}`,
        }, adminID, (err, info) => {
          global.client.handleReply.push({
            name: this.config.name,
            messageID: info.messageID,
            threadID: threadID,
            type: "reply"
          });
        });
        api.sendMessage("✅ تم إرسال ردك إلى المطور.", threadID, messageID);
      }
      break;
    }
  }
};

module.exports.run = async function ({ api, event, args, Threads }) {
  const { threadID, messageID, senderID, body } = event;
  const adminID = "61581906898524"; // الأيدي الخاص بك

  if (!args[0]) return api.sendMessage("يرجى كتابة محتوى البلاغ!", threadID, messageID);

  var name = (await api.getUserInfo(senderID))[senderID].name;
  var threadName = (await Threads.getInfo(threadID)).threadName || "محادثة خاصة";

  api.sendMessage(`✅ تم إرسال بلاغك للمطور بنجاح.`, threadID, messageID);

  api.sendMessage({
    body: `⚠️ بلاغ من: ${name}\n🆔 الأيدي: ${senderID}\n🌐 من جروب: ${threadName}\n\n💬 المحتوى: ${args.join(" ")}`,
  }, adminID, (err, info) => {
    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      threadID: threadID,
      type: "reply"
    });
  });
};

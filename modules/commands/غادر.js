// ⚙️ أمر مغادرة احترافي - خاص بالمطور ⚙️
const approvedEmoji = '👍';
const developerID = "61581906898524";

module.exports.config = {
  name: "مغادرة",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "محمد إدريس + GPT-5",
  description: "يجعل البوت يغادر المجموعة بأناقة وسخرية 😎",
  commandCategory: "المطور",
  usages: "غادر",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  // لو المطور هو اللي كتب غادر
  if (senderID === developerID) {
    return api.sendMessage("تفاعل ب 👍 للتأكيد", threadID, (err, info) => {
      if (err) return console.error(err);

      // مراقبة التفاعل
      global.client.handleReaction.push({
        name: this.config.name,
        messageID: info.messageID,
        author: developerID,
        threadID: threadID
      });
    }, messageID);
  } else {
    // لو عضو عادي حاول يخلي البوت يغادر
    return api.sendMessage("قاعد في بيت ابوك انا ( 𓎲_𓎲)", threadID, messageID);
  }
};

// حدث التفاعل بالرموز (اللايك)
module.exports.handleReaction = async function({ api, event, handleReaction }) {
  const { userID, threadID, reaction } = event;

  // تحقق إن اللي تفاعل هو المطور وإنه حط 👍
  if (userID !== handleReaction.author || reaction !== approvedEmoji) return;

  // الجملة الساخرة قبل المغادرة
  await api.sendMessage(
    "انتو ظنوج ساكت قروب زي دا م بستاهل بوت ساكت احشكم واحش البضيفني ( 𓎲_𓎲)",
    threadID
  );

  // مغادرة المجموعة بعد ثانيتين
  setTimeout(() => {
    api.removeUserFromGroup(api.getCurrentUserID(), threadID);
  }, 2000);
};

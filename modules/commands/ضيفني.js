module.exports.config = {
  name: "ضيفني",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "Mustapha",
  description: "إضافة المطور إلى القروبات",
  commandCategory: "المطور",
  usages: "ضيفني",
  cooldowns: 5
};

const DEVELOPER_ID = "100081948980908";

module.exports.run = async function ({ api, event }) {
  if (event.senderID !== DEVELOPER_ID)
    return api.sendMessage("❌ هذا الأمر مخصص للمطور فقط", event.threadID);

  const threads = await api.getThreadList(50, null, ["INBOX"]);
  const groups = threads.filter(t => t.isGroup);

  if (groups.length === 0)
    return api.sendMessage("⚠️ لا يوجد قروبات", event.threadID);

  let msg = `⌈ 📂 قائمة القروبات ⌋\n\n`;
  groups.forEach((g, i) => {
    msg += `${i + 1}. 🏷️ ${g.name}\n`;
  });

  msg += `\n✦ رد برقم القروب للانضمام`;

  api.sendMessage(msg, event.threadID, (err, info) => {
    global.client.handleReply.push({
      name: "ضيفني",
      messageID: info.messageID,
      author: event.senderID,
      groups
    });
  });
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  if (event.senderID !== DEVELOPER_ID) return;

  const index = parseInt(event.body) - 1;
  const group = handleReply.groups[index];

  if (!group)
    return api.sendMessage("❌ رقم غير صحيح", event.threadID);

  try {
    await api.addUserToGroup(DEVELOPER_ID, group.threadID);

    api.sendMessage(
      "✅ تسجيل دخول المطور ʕ•͡-•ʔ",
      group.threadID
    );

    api.sendMessage(
      `✔️ تم إضافتك إلى:\n${group.name}`,
      event.threadID
    );

  } catch (e) {
    api.sendMessage("⚠️ فشل الإضافة (ربما المطور موجود بالفعل)", event.threadID);
  }
};

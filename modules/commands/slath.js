// 🦧 slath.js - أوامر المطور الكاملة 🦧
const fs = require("fs");

module.exports.config = {
  name: "slath",
  version: "4.6",
  hasPermssion: 2,
  credits: "محمد إدريس",
  description: "أوامر المطور الكاملة: إرسال، ريد، تصفية، باند، عرض القروبات",
  commandCategory: "المطور",
  usages: "slath",
  cooldowns: 5
};

// 🧑‍💻 ايدي المطورين (تم إضافة الاثنين كما طلبت)
const devID = ["61570782968645", "100018490916970"];

const bannedUsers = [];
const adminsFile = __dirname + "/admins.json";

function getAdmins() {
  if (!fs.existsSync(adminsFile)) return [];
  return JSON.parse(fs.readFileSync(adminsFile));
}
function saveAdmins(admins) {
  fs.writeFileSync(adminsFile, JSON.stringify(admins, null, 2));
}

module.exports.run = async ({ api, event }) => {
  if (!devID.includes(event.senderID))
    return api.sendMessage("⚠️ هذا الأمر مخصص للمطور فقط 🗿", event.threadID);

  const menu = `
╭━━━〔 ⚙️ قائمة المطور ⚙️ 〕━━━╮
┃
┃ 💠 1 ↝ إعادة تشغيل البوت 🔁
┃ 💬 2 ↝ إرسال رسالة لجميع القروبات
┃ 🧩 3 ↝ تغيير كنيات الأعضاء
┃ 🧹 4 ↝ تصفية المجموعة من الأعضاء
┃ 🚫 5 ↝ باند بارد لعضو
┃ 📜 6 ↝ عرض القروبات + إضافة المطور
┃
╰━━━━━━━━━━━━━━━━━━╯
💡 أرسل رقم الأمر للتنفيذ.
`;

  api.sendMessage(menu, event.threadID, (err, info) => {
    if (!global.client.handleReply) global.client.handleReply = [];
    global.client.handleReply.push({
      name: module.exports.config.name,
      messageID: info.messageID,
      author: event.senderID,
      type: "menu"
    });
  });
};

// 🛠️ التعامل مع الردود
module.exports.handleReply = async ({ api, event, handleReply }) => {
  if (!devID.includes(event.senderID))
    return api.sendMessage("⚠️ فقط المطور يمكنه استخدام هذا الأمر 🗿", event.threadID);

  const args = event.body.trim().split(" ");
  const choice = args[0];
  const extra = args.slice(1).join(" ");

  if (handleReply.type === "menu") {
    switch (choice) {
      case "1":
        api.sendMessage("🔄 جارٍ إعادة تشغيل البوت...", event.threadID, () => process.exit(1));
        break;

      case "2":
        api.sendMessage("📝 أرسل الآن الرسالة التي تريد نشرها في جميع القروبات:", event.threadID, (err, info) => {
          global.client.handleReply.push({
            name: module.exports.config.name,
            messageID: info.messageID,
            author: event.senderID,
            type: "sendWord"
          });
        });
        break;

      case "3":
        api.sendMessage("🪄 أرسل الصيغة الجديدة للكنية (ضع كلمة 'الاسم' ليتم استبدالها باسم العضو):", event.threadID, (err, info) => {
          global.client.handleReply.push({
            name: module.exports.config.name,
            messageID: info.messageID,
            author: event.senderID,
            type: "setNick"
          });
        });
        break;

      case "4":
        const infoThread = await api.getThreadInfo(event.threadID);
        for (let uid of infoThread.participantIDs) {
          if (!devID.includes(uid)) {
            try { await api.removeUserFromGroup(uid, event.threadID); } catch (e) {}
          }
        }
        api.sendMessage("🧹 تم تصفية المجموعة من جميع الأعضاء ما عدا المطورين ✅", event.threadID);
        break;

      case "5":
        api.sendMessage("⚠️ قم بالرد على رسالة العضو ليتم حظره من استخدام البوت.", event.threadID);
        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: event.messageID,
          author: event.senderID,
          type: "banUser"
        });
        break;

      case "6":
        const threads = await api.getThreadList(100, null, ["INBOX"]);
        if (!threads.length)
          return api.sendMessage("🚫 البوت غير موجود في أي مجموعة حالياً.", event.threadID);

        let msg = "📜 القروبات التي يتواجد فيها البوت:\n\n";
        threads.forEach((t, i) => msg += `${i + 1}. ${t.name}\n`);
        msg += "\n💡 للانضمام: أرسل (اضف رقم)\nمثال: اضف 1";

        api.sendMessage(msg, event.threadID, (err, info) => {
          global.client.handleReply.push({
            type: "addDev",
            name: module.exports.config.name,
            messageID: info.messageID,
            author: event.senderID,
            threads: threads
          });
        });
        break;

      default:
        api.sendMessage("❌ رقم غير صحيح! اختر من 1 إلى 6.", event.threadID);
    }
  }

  // إرسال كلمة لجميع القروبات
  if (handleReply.type === "sendWord") {
    const allThread = await api.getThreadList(100, null, ["INBOX"]);
    const now = new Date();
    const options = { timeZone: "Africa/Khartoum", hour12: false };
    const date = now.toLocaleDateString("ar-EG", options);
    const time = now.toLocaleTimeString("ar-EG", options);

    const message = `
╭━━━〔 📢 إشعار من المطور 〕━━━╮
💬 ${event.body}
╰━━━━━━━━━━━━━━━━━━╯
📅 التاريخ: ${date}
⏰ الوقت: ${time}
`;

    for (const t of allThread) {
      api.sendMessage(message, t.threadID);
    }

    api.sendMessage("✅ تم إرسال الرسالة لجميع القروبات بنجاح.", event.threadID);
    global.client.handleReply = global.client.handleReply.filter(e => e.messageID !== handleReply.messageID);
  }

  // تغيير الكنيات
  if (handleReply.type === "setNick") {
    const newNick = event.body;
    const threadInfo = await api.getThreadInfo(event.threadID);
    let count = 0;
    for (let user of threadInfo.userInfo) {
      try {
        const firstName = user.firstName || "عضو";
        const nick = newNick.replace("الاسم", firstName);
        await api.changeNickname(nick, event.threadID, user.id);
        count++;
      } catch (e) {}
    }
    api.sendMessage(`✅ تم تحديث ${count} كنية بنجاح.`, event.threadID);
  }

  // باند بارد
  if (handleReply.type === "banUser" && event.messageReply) {
    const uid = event.messageReply.senderID;
    if (!bannedUsers.includes(uid)) bannedUsers.push(uid);
    api.sendMessage(`⛔ تم حظر المستخدم ${uid} من استخدام البوت.`, event.threadID);
  }

  // إضافة المطور لمجموعة
  if (handleReply.type === "addDev") {
    if (!args[0].toLowerCase().startsWith("اضف")) return;
    const index = parseInt(args[1]) - 1;
    if (isNaN(index) || index < 0 || index >= handleReply.threads.length)
      return api.sendMessage("❌ الرقم غير صحيح!", event.threadID);

    const thread = handleReply.threads[index];
    try {
      await api.addUserToGroup(devID[0], thread.threadID);
      api.sendMessage("🗿 تم دخول المطور بنجاح ✨", thread.threadID);
      api.sendMessage(`✅ تمت إضافة المطور لمجموعة: ${thread.name}`, event.threadID);
    } catch (error) {
      api.sendMessage(`❌ فشل في إضافة المطور لمجموعة: ${thread.name}\n⚠️ تأكد أن البوت أدمن في المجموعة.`, event.threadID);
    }
  }
};

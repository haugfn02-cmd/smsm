const fs = require("fs-extra");
const path = require("path");
const { exec } = require("child_process");

module.exports.config = {
  name: "المطور",
  version: "4.0.0",
  hasPermssion: 2,
  credits: "ᎠᎯᎢᎬ ᏚᎮᎯᏒᎠᎯ",
  description: "لوحة تحكم متكاملة: تصفح، رفع، تعديل، وحذف",
  commandCategory: "المطور",
  usages: "[رقم / مسار]",
  cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
  // التحقق الإضافي من الآيدي الخاص بك
  const developerID = "61581906898524";
  if (event.senderID !== developerID) {
    return api.sendMessage("❌ عذراً، هذا الأمر مخصص لمطور البوت فقط.", event.threadID, event.messageID);
  }

  const rootPath = path.resolve(__dirname, '..', '..');
  return listContent(api, event, rootPath);
};

async function listContent(api, event, currentPath) {
  try {
    const files = fs.readdirSync(currentPath);
    let items = [];
    files.forEach(file => {
      const filePath = path.join(currentPath, file);
      const stat = fs.statSync(filePath);
      items.push({ name: file, path: filePath, isDir: stat.isDirectory() });
    });

    items.sort((a, b) => (b.isDir - a.isDir));

    let msg = `┏━━━━━━━┓\n┃ ⚡ 𝗗𝗘𝗩 𝗣𝗔𝗡𝗘𝗟 𝗩𝟰 ⚡\n┗━━━━━━━┛\n\n`;
    msg += `📂 المسار الحالي:\n» ${path.relative(process.cwd(), currentPath) || "الرئيسي"}\n\n`;

    items.forEach((item, index) => {
      msg += `${index + 1}. ${item.isDir ? "📁" : "📄"} ${item.name}\n`;
    });

    msg += `\n━━━━━━━━━━━━━━\n`;
    msg += `🎮 [أوامر التحكم]:\n`;
    msg += `• [الرقم] ← فتح مجلد\n`;
    msg += `• عرض [الرقم] ← قراءة الكود\n`;
    msg += `• تعديل [الرقم] ← استبدال كود ملف\n`;
    msg += `• رفع [اسم.js] ← كتابة ملف جديد\n`;
    msg += `• حذف [الرقم] ← مسح ملف/مجلد\n`;
    msg += `• امر [الأمر] ← تشغيل Terminal\n`;
    msg += `━━━━━━━━━━━━━━`;

    return api.sendMessage(msg, event.threadID, (err, info) => {
      global.client.handleReply.push({
        name: "المطور",
        messageID: info.messageID,
        author: event.senderID,
        items: items,
        currentPath: currentPath
      });
    }, event.messageID);
  } catch (e) {
    return api.sendMessage("❌ خطأ: " + e.message, event.threadID);
  }
}

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, body, senderID } = event;
  if (senderID != handleReply.author) return;

  const input = body.split(" ");
  const action = input[0].toLowerCase();

  // 1. تشغيل أوامر Terminal
  if (action === "امر") {
    exec(body.slice(4), (error, stdout, stderr) => {
      if (error) return api.sendMessage(`❌ خطأ:\n${error.message}`, threadID, messageID);
      api.sendMessage(`✅ النتيجة:\n${stdout || stderr}`, threadID, messageID);
    });
    return;
  }

  // 2. ميزة الرفع الذكي (اختيار المجلد)
  if (action === "رفع") {
    const fileName = input[1];
    const content = body.split("\n").slice(1).join("\n");
    if (!fileName || !content) return api.sendMessage("⚠️ تنبيه: اكتب (رفع اسم.js) ثم سطر جديد والكود.", threadID, messageID);
    
    return api.sendMessage(`📥 اختر رقم المجلد لحفظ ( ${fileName} ) بداخله من القائمة السابقة:`, threadID, (err, info) => {
      global.client.handleReply.push({
        name: "المطور",
        messageID: info.messageID,
        author: senderID,
        job: "CHOOSE_FOLDER",
        fileName: fileName,
        content: content,
        items: handleReply.items
      });
    }, messageID);
  }

  if (handleReply.job === "CHOOSE_FOLDER") {
    const folder = handleReply.items[parseInt(body) - 1];
    if (!folder || !folder.isDir) return api.sendMessage("❌ يجب اختيار رقم مجلد!", threadID, messageID);
    fs.writeFileSync(path.join(folder.path, handleReply.fileName), handleReply.content);
    return api.sendMessage(`✅ تم حفظ الملف في: ${folder.name}`, threadID, messageID);
  }

  // 3. ميزة التعديل (تحديث كود ملف موجود)
  if (action === "تعديل") {
    const item = handleReply.items[parseInt(input[1]) - 1];
    if (!item || item.isDir) return api.sendMessage("❌ اختر رقم ملف صالح لتعديله.", threadID, messageID);
    
    return api.sendMessage(`📝 قم بالرد على هذه الرسالة بالكود الجديد للملف: ${item.name}`, threadID, (err, info) => {
      global.client.handleReply.push({
        name: "المطور",
        messageID: info.messageID,
        author: senderID,
        job: "UPDATE_FILE",
        filePath: item.path
      });
    }, messageID);
  }

  if (handleReply.job === "UPDATE_FILE") {
    fs.writeFileSync(handleReply.filePath, body);
    return api.sendMessage("✅ تم تحديث كود الملف بنجاح!", threadID, messageID);
  }

  // 4. التنقل، العرض، والحذف
  const index = parseInt(input[1] || input[0]) - 1;
  const item = handleReply.items[index];
  if (!item) return;

  if (action === "عرض") {
    const code = fs.readFileSync(item.path, "utf-8");
    if (code.length > 3000) {
        const tmp = path.join(__dirname, "cache", item.name);
        fs.writeFileSync(tmp, code);
        return api.sendMessage({ body: `📄 الكود طويل، تم إرساله كملف:`, attachment: fs.createReadStream(tmp) }, threadID, () => fs.unlinkSync(tmp), messageID);
    }
    return api.sendMessage(`📝 كود: ${item.name}\n\n${code}`, threadID, messageID);
  }

  if (action === "حذف") {
    fs.removeSync(item.path);
    api.sendMessage(`🗑️ تم حذف: ${item.name}`, threadID, messageID);
    return listContent(api, event, handleReply.currentPath);
  }

  if (item.isDir && !isNaN(input[0])) {
    api.unsendMessage(handleReply.messageID);
    return listContent(api, event, item.path);
  }
};

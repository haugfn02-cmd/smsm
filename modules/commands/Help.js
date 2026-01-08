module.exports.config = {
  name: "اوامر",
  version: "1.1.2",
  hasPermssion: 0,
  credits: "ᎠᎯᎢᎬ ᏚᎮᎯᏒᎠᎯ",
  description: "عرض قائمة الأوامر بخطوط رفيعة وأنيقة",
  commandCategory: "نظام",
  usages: "[رقم الصفحة]",
  cooldowns: 5,
  envConfig: {
    autoUnsend: false,
    delayUnsend: 20
  }
};

module.exports.languages = {
  "en": {
    "moduleInfo": "─ التفاصيل ─\n\n- الاسم: %1\n- الوصف: %2\n- الاستخدام: %3\n- الفئة: %4\n- الانتظار: %5 ثانية\n- الصلاحية: %6\n\n» بواسطة: %7",
    "user": "المستخدم",
    "adminGroup": "مشرف المجموعة",
    "adminBot": "مطور البوت"
  }
};

module.exports.run = async function({ api, event, args, getText }) {
  const axios = require("axios");
  const { commands } = global.client;
  const { threadID, messageID } = event;

  const imgURL = "https://i.ibb.co/Vcsqzf4T/22ed4e077eadba33e9b9f78a64317ab9.jpg";
  const image = (await axios.get(imgURL, { responseType: "stream" })).data;

  const command = commands.get((args[0] || "").toLowerCase());
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;

  if (!command) {
    let categories = {};
    const hiddenCategories = ["المطور", "المالك", "developer", "config", "owner"];

    for (let [name, value] of commands) {
      let cat = value.config.commandCategory || "عام";
      if (hiddenCategories.includes(cat.toLowerCase())) continue;
      
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(name);
    }

    const finalCategories = { "إضافات": [] };
    for (let cat in categories) {
      if (categories[cat].length < 3 && cat !== "نظام") {
        finalCategories["إضافات"].push(...categories[cat]);
      } else {
        finalCategories[cat] = categories[cat];
      }
    }
    if (finalCategories["إضافات"].length === 0) delete finalCategories["إضافات"];

    let blocks = [];
    for (let cat in finalCategories) {
      const cmds = finalCategories[cat].sort();
      // استايل الخطوط الرفيعة
      let block = `┌── ${cat.toUpperCase()} ──┐\n`;
      block += `│ ${cmds.join(", ")}\n`;
      block += `└──────────────┘`;
      blocks.push(block);
    }

    const totalPages = 3;
    const itemsPerPage = Math.ceil(blocks.length / totalPages);
    const page = parseInt(args[0]) || 1;

    if (page < 1 || page > totalPages)
      return api.sendMessage(`⚠️ القائمة متوفرة في ${totalPages} صفحات فقط.`, threadID, messageID);

    const start = (page - 1) * itemsPerPage;
    const finalBlocks = blocks.slice(start, start + itemsPerPage).join("\n\n");

    const msg = `─── KAIROS SYSTEM ───\n\n${finalBlocks}\n\n┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈\n▫️ الأوامر: ${commands.size}\n▫️ الصفحة: ${page} / ${totalPages}\n▫️ المطور: ᎠᎯᎢᎬ ᏚᎮᎯᏒᎠᎯ\n\n💡 ${prefix}اوامر [اسم الأمر]\n✨ صلِّ على محمد ﷺ\n─────────────────`;

    return api.sendMessage({ body: msg, attachment: image }, threadID);
  }

  return api.sendMessage(
    getText(
      "moduleInfo",
      command.config.name,
      command.config.description,
      `${prefix}${command.config.name} ${(command.config.usages) ? command.config.usages : ""}`,
      command.config.commandCategory,
      command.config.cooldowns,
      (command.config.hasPermssion == 0) ? getText("user") : (command.config.hasPermssion == 1) ? getText("adminGroup") : getText("adminBot"),
      command.config.credits
    ),
    threadID,
    messageID
  );
};

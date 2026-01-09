module.exports.config = {
  name: "اوامر",
  version: "7.5.0",
  hasPermssion: 0,
  credits: "ᎠᎯᎢᎬ ᏚᎮᎯᏒᎠᎯ",
  description: "قائمة الأوامر النسخة الاحترافية",
  commandCategory: "نظام",
  usages: "[اسم الأمر/رقم الصفحة]",
  cooldowns: 5
};

module.exports.languages = {
  "en": {
    "moduleInfo": "─┈┈┈──┈┈┈─\n📜 تفاصيل الأمر\n─┈┈┈──┈┈┈─\n\n❒ الاسم: %1\n❒ الوصف: %2\n❒ الاستخدام: %3\n❒ الفئة: %4\n❒ الانتظار: %5 ثانية\n❒ الصلاحية: %6\n\n» بواسطة: %7",
    "user": "مستخدم",
    "adminGroup": "مشرف المجموعة",
    "adminBot": "مطور البوت"
  }
};

module.exports.run = async function({ api, event, args, getText }) {
  const axios = require("axios");
  const { commands } = global.client;
  const { threadID, messageID } = event;

  const imageUrl = "https://i.ibb.co/Vcsqzf4T/22ed4e077eadba33e9b9f78a64317ab9.jpg";
  const command = commands.get((args[0] || "").toLowerCase());
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;

  if (!command) {
    const categories = {};
    for (let [name, value] of commands) {
      if (value.config.hasPermssion == 2 || value.config.commandCategory?.toLowerCase() === "مطور") continue;
      const cat = value.config.commandCategory || "عام";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(name);
    }

    // دمج الفئات التي تحتوي على أقل من 3 أوامر في فئة "أخرى"
    const mergedCategories = {};
    const smallCategories = [];
    for (let cat in categories) {
      if (categories[cat].length < 3 && cat !== "عام") {
        smallCategories.push(...categories[cat]);
      } else {
        mergedCategories[cat] = categories[cat];
      }
    }
    if (smallCategories.length > 0) {
      mergedCategories["أخرى"] = (mergedCategories["أخرى"] || []).concat(smallCategories);
    }

    let sections = [];
    for (let cat in mergedCategories) {
      const cmds = mergedCategories[cat].sort();
      let section = `  ⌬──『 ${cat} 』──⌬\n`;
      section += `  ⌫ ${cmds.join(" • ")}\n`;
      sections.push(section);
    }

    // تقسيم الصفحات إلى 3 أقسام كما طلبت
    const itemsPerPage = 3; 
    const totalPages = Math.ceil(sections.length / itemsPerPage);
    let page = parseInt(args[0]) || 1;
    if (page < 1 || page > totalPages) page = 1;

    const start = (page - 1) * itemsPerPage;
    const displaySections = sections.slice(start, start + itemsPerPage).join("\n");

    const msg = 
`─┈┈┈──┈┈┈─
  قـائـمـة الأوامـر
─┈┈┈──┈┈┈─

${displaySections}

─┈┈┈──┈┈┈─
❒ عدد الأوامر: [ ${commands.size} ]
❒ الصفحة: [ ${page} / ${totalPages} ]
❒ الرمز الحالي: [ ${prefix} ]
─┈┈┈──┈┈┈─
💡 المطور: ᎠᎯᏁᎢᎬᏚᎮᎯᏒᎠᎯ
✨ اللهم صلِّ وسلم على نبينا محمد
─┈┈┈──┈┈┈─`;

    try {
      const image = (await axios.get(imageUrl, { responseType: "stream" })).data;
      return api.sendMessage({ body: msg, attachment: image }, threadID);
    } catch (e) {
      return api.sendMessage(msg, threadID);
    }
  }

  return api.sendMessage(
    getText(
      "moduleInfo",
      command.config.name,
      command.config.description,
      `${prefix}${command.config.name} ${(command.config.usages) ? command.config.usages : ""}`,
      command.config.commandCategory,
      command.config.cooldowns,
      (command.config.hasPermssion == 0)
        ? getText("user")
        : (command.config.hasPermssion == 1)
        ? getText("adminGroup")
        : getText("adminBot"),
      command.config.credits
    ),
    threadID,
    messageID
  );
};

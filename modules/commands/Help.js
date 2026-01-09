module.exports.config = {
  name: "اوامر",
  version: "7.0.0",
  hasPermssion: 0,
  credits: "ᎠᎯᎢᎬ ᏚᎮᎯᏒᎠᎯ",
  description: "قائمة الأوامر النسخة السابعة المتقدمة",
  commandCategory: "نظام",
  usages: "[اسم الأمر/رقم الصفحة]",
  cooldowns: 5,
  envConfig: {
    autoUnsend: false,
    delayUnsend: 20
  }
};

module.exports.languages = {
  "en": {
    "moduleInfo": "╭─────── ✧ ───────╮\n  📜 𝖣𝖤𝖳𝖠𝖨𝖫𝖲 𝖢𝖮𝖬𝖬𝖠𝖭𝖣\n╰─────── ✧ ───────╯\n\n❒ 𝖭𝖺𝗆𝖾: %1\n❒ 𝖣𝖾𝗌𝖼: %2\n❒ 𝖴𝗌𝖺𝖦𝖾: %3\n❒ 𝖢𝖺𝗍𝖾𝗀𝗈𝗋𝗒: %4\n❒ 𝖢𝗈𝗈𝗅𝖽𝗈𝗐𝗇: %5𝗌\n❒ 𝖯𝖾𝗋𝗆𝗂𝗌𝗌𝗂𝗈𝗇: %6\n\n» 𝖢𝗋𝖾𝖽𝗂𝗍𝗌: %7",
    "user": "𝖴𝗌𝖾𝗋",
    "adminGroup": "𝖠𝖽𝗆𝗂𝗇 𝖦𝗋𝗈𝗎𝗉",
    "adminBot": "𝖠𝖽𝗆𝗂𝗇 𝖡𝗈𝗍"
  }
};

module.exports.run = async function({ api, event, args, getText }) {
  const fs = require("fs");
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
      const cat = value.config.commandCategory || "General";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(name);
    }

    let sections = [];
    for (let cat in categories) {
      const cmds = categories[cat].sort();
      // استايل الفئات بخطوط رقيقة ناعمة
      let section = `   乂──『 𝖢𝖠𝖳𝖤𝖦𝖮𝖱𝖸: ${cat.toUpperCase()} 』──乂\n`;
      section += `  ╰┈➤ ${cmds.join("  •  ")}\n`;
      sections.push(section);
    }

    const itemsPerPage = 5; 
    const totalPages = Math.ceil(sections.length / itemsPerPage);
    let page = parseInt(args[0]) || 1;
    if (page < 1 || page > totalPages) page = 1;

    const start = (page - 1) * itemsPerPage;
    const displaySections = sections.slice(start, start + itemsPerPage).join("\n");

    const msg = 
`╭─────── ✦ ───────╮
    𝖪𝖠𝖨𝖱𝖮𝖲 𝖲𝖸𝖲𝖳𝖤𝖬 𝖵𝟩
╰─────── ✦ ───────╯

${displaySections}

━━━━━━━━━━━━━━━━━━━
❒ 𝖳𝗈𝗍𝖺𝗅 𝖢𝗆𝖽𝗌: [ ${commands.size} ]
❒ 𝖯𝖺𝗀𝖾: [ ${page} / ${totalPages} ]
❒ 𝖯𝗋𝖾𝖿𝗂𝗮: [ ${prefix} ]
━━━━━━━━━━━━━━━━━━━
💡 𝖡𝗈𝗍: ڪايࢪوس 👑
👑 𝖣𝖾𝗏: ᎠᎯᏁᎢᎬᏚᎮᎯᏒᎠᎯ
✨ اللهم صلِّ وسلم على سيدنا محمد 🍂
━━━━━━━━━━━━━━━━━━━`;

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

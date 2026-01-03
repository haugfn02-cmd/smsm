module.exports.config = {
  name: "اوامر",
  version: "1.0.7",
  hasPermssion: 0,
  credits: "ᎠᎯᎢᎬ ᏚᎮᎯᏒᎠᎯ",
  description: "قائمة الأوامر بشكل منسق وجميل مع إخفاء أوامر المطور",
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
    "moduleInfo": "「 %1 」\n%2\n\n❯ الاستخدام: %3\n❯ الفئة: %4\n❯ وقت الانتظار: %5 ثانية\n❯ الصلاحية: %6\n\n» كود الأداة بواسطة %7 «",
    "helpList": '[ يوجد %1 أمر في هذا البوت، استخدم: "%2اوامر اسم_الأمر" لمعرفة التفاصيل! ]',
    "user": "المستخدم",
    "adminGroup": "مشرف المجموعة",
    "adminBot": "مطور البوت"
  }
};

module.exports.run = async function({ api, event, args, getText }) {
  const axios = require("axios");
  const { commands } = global.client;
  const { threadID, messageID } = event;

  const image = (await axios.get("https://i.ibb.co/Vcsqzf4T/22ed4e077eadba33e9b9f78a64317ab9.jpg", { responseType: "stream" })).data;

  const command = commands.get((args[0] || "").toLowerCase());
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;

  if (!command) {
    const categories = {};
    let visibleCommandsCount = 0;

    // تصفية الأوامر وإخفاء أوامر المطور (التي تحمل صلاحية 2)
    for (let [name, value] of commands) {
      if (value.config.hasPermssion !== 2) { 
        const cat = value.config.commandCategory || "عام";
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(name);
        visibleCommandsCount++;
      }
    }

    let blocks = [];
    for (let cat in categories) {
      const cmds = categories[cat].sort();
      let block = `   乂──『 ${cat.toUpperCase()} 』──乂\n\n`;
      block += `${cmds.join("  •  ")}\n\n`;
      block += `   ───────────────`;
      blocks.push(block);
    }

    const totalPages = Math.ceil(blocks.length / 4);
    const page = parseInt(args[0]) || 1;

    if (page < 1 || page > totalPages)
      return api.sendMessage(`⚠️ اختر صفحة بين 1 - ${totalPages}`, threadID, messageID);

    const start = (page - 1) * 4;
    const finalBlocks = blocks.slice(start, start + 4).join("\n\n");

    const msg = `─⇄〖 ⤹   𝗞𝗔𝗜𝗥𝗢𝗦 𝗕𝗢𝗧 ⇊ 〗⇄─╮\n\n${finalBlocks}\n\n📌 المجموع: [ ${visibleCommandsCount} ] أمر\n💡 استخدم ${prefix}اوامر [اسم الأمر]\n📖 الصفحة: [ ${page} / ${totalPages} ]\n\n👑 المطور: ᎠᎯᎢᎬ ᏚᎮᎯᏒᎠᎯ\n${page === 1 ? "🍂 اللهم صلِّ وسلم على نبينا محمد ﷺ" : ""}\n╰───────────╯`;

    return api.sendMessage(
      { body: msg, attachment: image },
      threadID
    );
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

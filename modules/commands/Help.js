module.exports.config = {
  name: "اوامر",
  version: "1.0.6",
  hasPermssion: 0,
  credits: "انس",
  description: "قائمة الأوامر",
  commandCategory: "نظام",
  usages: "[رقم الصفحة]",
  cooldowns: 5,
  envConfig: {
    autoUnsend: false
  }
};

module.exports.languages = {
  "en": {
    "moduleInfo": "「 %1 」\n❯ Usage: %3\n❯ Category: %4\n❯ Waiting time: %5 seconds(s)\n❯ Permission: %6\n\n» Module code by %7 «",
    "user": "User",
    "adminGroup": "Admin group",
    "adminBot": "Admin bot"
  }
};

module.exports.handleEvent = function ({ api, event, getText }) {
  const { commands } = global.client;
  const { threadID, messageID, body } = event;

  if (!body || typeof body == "cmd" || body.indexOf("help") != 0) return;
  const splitBody = body.slice(body.indexOf("help")).trim().split(/\s+/);
  if (splitBody.length == 1 || !commands.has(splitBody[1].toLowerCase())) return;

  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const command = commands.get(splitBody[1].toLowerCase());
  const prefix = (threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX : global.config.PREFIX;

  return api.sendMessage(
    getText(
      "moduleInfo",
      command.config.name,
      "",
      `${prefix}${command.config.name}`,
      command.config.commandCategory,
      command.config.cooldowns,
      ((command.config.hasPermssion == 0)
        ? getText("user")
        : (command.config.hasPermssion == 1)
        ? getText("adminGroup")
        : getText("adminBot")),
      command.config.credits
    ),
    threadID,
    messageID
  );
};

module.exports.run = function({ api, event, args }) {
  const { commands } = global.client;
  const { threadID, messageID } = event;
  const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
  const prefix = (threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX : global.config.PREFIX;

  // فلترة أوامر المطور
  const arrayInfo = Array.from(commands.values())
    .filter(cmd => cmd.config.hasPermssion !== 2)
    .map(cmd => cmd.config.name)
    .sort();

  const page = parseInt(args[0]) || 1;
  const numberOfOnePage = 100;
  const startSlice = numberOfOnePage * page - numberOfOnePage;
  const returnArray = arrayInfo.slice(startSlice, startSlice + numberOfOnePage);

  let msg = "╭─⋅⋅─☾─⋅⋅─╮\n";
  msg += "  ◆ ◈ قائمة أوامر Kiros ◈ ◆\n";
  msg += "╰─⋅⋅─☾─⋅⋅─╯\n\n";

  // كل سطر 4 أوامر
  for (let i = 0; i < returnArray.length; i += 4) {
    msg += "│ " + returnArray.slice(i, i + 4).join(" • ") + "\n";
  }

  msg += "╰─────────⋅⋅\n\n";

  msg += `╭─⋅⋅─☾─⋅⋅─╮
 › إجمالي الأوامر: ${arrayInfo.length}
 › الصفحة: ${page}/${Math.ceil(arrayInfo.length / numberOfOnePage)}
 › اسم البوت: Kiros
 › المطور: ᎠᎯᏁᎢᎬᏚᎮᎯᏒᎠᎯ
 › استخدم: ${prefix}اوامر [رقم الصفحة]
╰─⋅⋅─☾─⋅⋅─╯`;

  return api.sendMessage(msg, threadID, messageID);
};

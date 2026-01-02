module.exports.config = {
  name: "بحث",
  version: "1.0.2",
  hasPermssion: 0,
  credits: "عمر",
  description: "البحث في ويكيبيديا باللغة العربية أو الإنجليزية",
  commandCategory: "خدمات",
  usages: "[نص البحث] أو [en نص البحث]",
  cooldowns: 1,
  dependencies: {
    "wikijs": ""
  }
};

module.exports.languages = {
  "vi": {
    "missingInput": "Nội dung cần tìm kiếm không được để trống!",
    "returnNotFound": "Không tìm thấy nội dung %1"
  },
  "en": {
    "missingInput": "⚠️ يرجى إدخال كلمة البحث بعد اسم الأمر.",
    "returnNotFound": "❌ عذراً، لم يتم العثور على نتائج لـ: %1"
  }
};

module.exports.run = async ({ event, args, api, getText }) => {
  const wiki = (global.nodemodule["wikijs"]).default;
  let content = args.join(" ");
  let url = 'https://ar.wikipedia.org/w/api.php';

  // التحقق من اللغة الإنجليزية
  if (args[0] === "en") {
    url = 'https://en.wikipedia.org/w/api.php';
    content = args.slice(1).join(" ");
  }

  // التحقق من وجود نص للبحث
  if (!content || content.trim() === "") {
    return api.sendMessage(getText("missingInput"), event.threadID, event.messageID);
  }

  try {
    const page = await wiki({ apiUrl: url }).page(content);
    const summary = await page.summary();

    if (summary) {
      return api.sendMessage(summary, event.threadID, event.messageID);
    } else {
      return api.sendMessage(getText("returnNotFound", content), event.threadID, event.messageID);
    }
  } catch (error) {
    return api.sendMessage(getText("returnNotFound", content), event.threadID, event.messageID);
  }
};

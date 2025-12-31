module.exports.config = {
  name: "الطلبات",
  version: "1.0.8",
  credits: "عمر",
  hasPermssion: 2,
  description: "طلبات مراسلة البوت",
  commandCategory: "المطور",
  usages: "ا",
  cooldowns: 5
};

module.exports.handleReply = async function({ api, event, handleReply, getText }) {
  if (String(event.senderID) !== String(handleReply.author)) return;
  const { body, threadID, messageID } = event;
  let count = 0;

  if ((isNaN(body) && body.indexOf("c") === 0) || body.indexOf("cancel") === 0) {
      const index = (body.slice(1)).split(/\s+/);
      for (const singleIndex of index) {
          if (isNaN(singleIndex) || singleIndex <= 0 || singleIndex > handleReply.pending.length) 
              return api.sendMessage(`❌ الرقم ${singleIndex} غير صالح.`, threadID, messageID);
      }
      return api.sendMessage(`✅ تم رفض الطلب بنجاح.`, threadID, messageID);
  } else {
      const index = body.split(/\s+/);
      for (const singleIndex of index) {
          if (isNaN(singleIndex) || singleIndex <= 0 || singleIndex > handleReply.pending.length)
              return api.sendMessage(`❌ الرقم ${singleIndex} غير صالح.`, threadID, messageID);

          api.unsendMessage(handleReply.messageID);
          api.changeNickname(`${(!global.config.BOTNAME) ? "Made by O M A R" : global.config.BOTNAME}`, handleReply.pending[singleIndex - 1].threadID, api.getCurrentUserID());
          
          // إرسال رسالة نصية فقط عند الموافقة
          api.sendMessage(`✅ تم الموافقة على طلبك بنجاح!\n❖ اسم البوت: ${(!global.config.BOTNAME) ? "Made by O M A R" : global.config.BOTNAME}\n❖ شكراً لاستخدامك البوت.`, handleReply.pending[singleIndex - 1].threadID);

          count += 1;
      }
      return api.sendMessage(`✅ تم الموافقة على ${count} طلب/طلبات بنجاح.`, threadID, messageID);
  }
}

module.exports.run = async function({ api, event, args, permission, handleReply }) {
  const developerID = "61581906898524";

  if (args.join() === "") {
      return api.sendMessage("❯ يمكنك استخدام الأوامر التالية:\n\n❖ طلبات المستخدمين: قائمة انتظار المستخدمين\n❖ طلبات المجموعات: قائمة انتظار المجموعات\n❖ طلبات الكل: جميع الطلبات\n❖ طلبات اليوم: عرض الطلبات الجديدة اليوم", event.threadID, event.messageID);
  }

  const content = args.slice(1).join(" ");

  switch (args[0]) {
    case "user":
    case "u":
    case "-u":
    case "المستخدمين": {
      if (event.senderID !== developerID) 
          return api.sendMessage("❌ ليس لديك صلاحية استخدام هذا الأمر.", event.threadID, event.messageID);

      const { threadID, messageID } = event;
      const commandName = this.config.name;
      let msg = "", index = 1;

      try {
          var spam = await api.getThreadList(100, null, ["OTHER"]) || [];
          var pending = await api.getThreadList(100, null, ["PENDING"]) || [];
      } catch (e) {
          return api.sendMessage("❌ لا يمكن الحصول على قائمة الانتظار.", threadID, messageID);
      }

      const list = [...spam, ...pending].filter(group => group.isGroup === false);
      for (const single of list) msg += `❖ ${index++} | ${single.name} (${single.threadID})\n`;

      if (list.length === 0) return api.sendMessage("❌ لا يوجد مستخدمين في قائمة الانتظار حالياً.", threadID, messageID);

      return api.sendMessage(`📋 إجمالي عدد المستخدمين في قائمة الانتظار: ${list.length}\n\n${msg}\n❖ للرد والموافقة، قم بالرد بالرقم المطلوب.`, threadID, (error, info) => {
          global.client.handleReply.push({
              name: commandName,
              messageID: info.messageID,
              author: event.senderID,
              pending: list
          });
      }, messageID);
    }

    case "thread":
    case "-t":
    case "t":
    case "المجموعات": {
      if (event.senderID !== developerID) 
          return api.sendMessage("❌ ليس لديك صلاحية استخدام هذا الأمر.", event.threadID, event.messageID);

      const { threadID, messageID } = event;
      const commandName = this.config.name;
      let msg = "", index = 1;

      try {
          var spam = await api.getThreadList(100, null, ["OTHER"]) || [];
          var pending = await api.getThreadList(100, null, ["PENDING"]) || [];
      } catch (e) {
          return api.sendMessage("❌ لا يمكن الحصول على قائمة الانتظار.", threadID, messageID);
      }

      const list = [...spam, ...pending].filter(group => group.isSubscribed && group.isGroup);
      for (const single of list) msg += `❖ ${index++} | ${single.name} (${single.threadID})\n`;

      if (list.length === 0) return api.sendMessage("❌ لا توجد مجموعات في قائمة الانتظار حالياً.", threadID, messageID);

      return api.sendMessage(`📋 إجمالي عدد المجموعات في قائمة الانتظار: ${list.length}\n\n${msg}\n❖ للرد والموافقة، قم بالرد بالرقم المطلوب.`, threadID, (error, info) => {
          global.client.handleReply.push({
              name: commandName,
              messageID: info.messageID,
              author: event.senderID,
              pending: list
          });
      }, messageID);
    }

    case "all":
    case "a":
    case "-a":
    case "الكل": {
      if (event.senderID !== developerID) 
          return api.sendMessage("❌ ليس لديك صلاحية استخدام هذا الأمر.", event.threadID, event.messageID);

      const { threadID, messageID } = event;
      const commandName = this.config.name;
      let msg = "", index = 1;

      try {
          var spam = await api.getThreadList(100, null, ["OTHER"]) || [];
          var pending = await api.getThreadList(100, null, ["PENDING"]) || [];
      } catch (e) {
          return api.sendMessage("❌ لا يمكن الحصول على قائمة الانتظار.", threadID, messageID);
      }

      const list = [...spam, ...pending].filter(group => group.isSubscribed);
      for (const single of list) msg += `❖ ${index++} | ${single.name} (${single.threadID})\n`;

      if (list.length === 0) return api.sendMessage("❌ لا توجد طلبات حالياً.", threadID, messageID);

      return api.sendMessage(`📋 إجمالي عدد الطلبات (مستخدمين + مجموعات): ${list.length}\n\n${msg}\n❖ للرد والموافقة، قم بالرد بالرقم المطلوب.`, threadID, (error, info) => {
          global.client.handleReply.push({
              name: commandName,
              messageID: info.messageID,
              author: event.senderID,
              pending: list
          });
      }, messageID);
    }

    case "today":
    case "اليوم": {
      if (event.senderID !== developerID)
          return api.sendMessage("❌ ليس لديك صلاحية استخدام هذا الأمر.", event.threadID, event.messageID);

      const { threadID, messageID } = event;
      const commandName = this.config.name;
      let msg = "", index = 1;

      try {
          const spam = await api.getThreadList(100, null, ["OTHER"]) || [];
          const pending = await api.getThreadList(100, null, ["PENDING"]) || [];
          const today = new Date().toLocaleDateString();
          const list = [...spam, ...pending].filter(item => {
              const itemDate = new Date(item.snippetTimestamp * 1000).toLocaleDateString();
              return itemDate === today;
          });

          for (const single of list) msg += `❖ ${index++} | ${single.name} (${single.threadID})\n`;

          if (list.length === 0) return api.sendMessage("❌ لا توجد طلبات جديدة اليوم.", threadID, messageID);

          return api.sendMessage(`📋 إجمالي عدد الطلبات الجديدة اليوم: ${list.length}\n\n${msg}\n❖ للرد والموافقة، قم بالرد بالرقم المطلوب.`, threadID, (error, info) => {
              global.client.handleReply.push({
                  name: commandName,
                  messageID: info.messageID,
                  author: event.senderID,
                  pending: list
              });
          }, messageID);

      } catch (e) {
          return api.sendMessage("❌ حدث خطأ أثناء جلب الطلبات الجديدة.", threadID, messageID);
      }
    }
  }
}

// الحدث عند إضافة البوت إلى قروب من شخص غير المطور
module.exports.onAddedToGroup = async function({ api, event }) {
  const developerID = "61581906898524";
  if (event.author != developerID) {
      return api.sendMessage("❌ عذراً، أنت غير مخول لإضافة البوت إلى هذه المجموعة.\nالرجاء التواصل مع المطور.", event.threadID);
  }
  }

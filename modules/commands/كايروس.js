module.exports.config = {
  name: "كايروس",
  Auth: 0,
  Class: "ذكاء اصطناعي",
  Owner: "محمد",
  Hide: false,
  How: "كايروس [سؤالك]",
  Multi: ["kairos", "ai"],
  Time: 0,
  Info: "مساعدك الشخصي الذكي كايروس"
};

const conversations = new Map();

module.exports.onPick = async function({ args, event, api, sh }) {
  const axios = require("axios");
  const userId = event.senderID;
  const question = args.join(" ").trim();
  
  // تصميم الواجهة (Header & Footer)
  const header = "╭───『 𝗞𝗔𝗜𝗥𝗢𝗦 』───⟡\n";
  const footer = "\n╰──────────────⟡";

  if (question === "مسح" || question === "reset") {
    conversations.delete(userId);
    return sh.reply(`${header}🔹 تم تنظيف سجل المحادثة بنجاح!${footer}`);
  }
  
  if (!question) {
    return sh.reply(`${header}⚠️ يرجى كتابة سؤالك للتحدث معي.${footer}`);
  }

  try {
    if (!conversations.has(userId)) {
      conversations.set(userId, []);
    }
    
    const history = conversations.get(userId);
    history.push({ role: "user", content: question });
    
    if (history.length > 20) history.splice(0, history.length - 20);

    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    let formData = `--${boundary}\r\nContent-Disposition: form-data; name="chat_style"\r\n\r\nchat\r\n` +
                   `--${boundary}\r\nContent-Disposition: form-data; name="chatHistory"\r\n\r\n${JSON.stringify(history)}\r\n` +
                   `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nstandard\r\n` +
                   `--${boundary}\r\nContent-Disposition: form-data; name="hacker_is_stinky"\r\n\r\nvery_stinky\r\n` +
                   `--${boundary}\r\nContent-Disposition: form-data; name="enabled_tools"\r\n\r\n[]\r\n--${boundary}--\r\n`;

    const response = await axios({
      method: "POST",
      url: "https://api.deepai.org/hacking_is_a_serious_crime",
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
        "origin": "https://deepai.org",
        "user-agent": "Mozilla/5.0"
      },
      data: formData
    });

    let reply = response.data.output || response.data.text || (typeof response.data === "string" ? response.data : "");
    reply = reply.replace(/\\n/g, "\n").replace(/\\u0021/g, "!").replace(/\\"/g, '"').trim();
    
    if (reply.length > 2000) reply = reply.substring(0, 1997) + "...";

    history.push({ role: "assistant", content: reply });

    const sent = await sh.reply(`${header}🤖 : ${reply}${footer}`);
    
    if (sent && sent.messageID) {
      global.shelly.Reply.push({
        name: "كايروس",
        ID: sent.messageID,
        author: event.senderID,
        type: "continue"
      });
    }

  } catch (error) {
    console.error("خطأ كايروس:", error.message);
    sh.reply(`${header}❌ عذراً، واجهت مشكلة في معالجة طلبك.${footer}`);
  }
};

module.exports.Reply = async function({ event, sh, Reply }) {
  if (Reply.type !== "continue" || Reply.author !== event.senderID) return;
  
  const axios = require("axios");
  const userId = event.senderID;
  const question = event.body.trim();
  if (!question) return;

  const header = "╭───『 𝗞𝗔𝗜𝗥𝗢𝗦 』───⟡\n";
  const footer = "\n╰──────────────⟡";

  try {
    const history = conversations.get(userId) || [];
    history.push({ role: "user", content: question });

    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    let formData = `--${boundary}\r\nContent-Disposition: form-data; name="chat_style"\r\n\r\nchat\r\n` +
                   `--${boundary}\r\nContent-Disposition: form-data; name="chatHistory"\r\n\r\n${JSON.stringify(history)}\r\n` +
                   `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nstandard\r\n` +
                   `--${boundary}\r\nContent-Disposition: form-data; name="hacker_is_stinky"\r\n\r\nvery_stinky\r\n` +
                   `--${boundary}\r\nContent-Disposition: form-data; name="enabled_tools"\r\n\r\n[]\r\n--${boundary}--\r\n`;

    const response = await axios({
      method: "POST",
      url: "https://api.deepai.org/hacking_is_a_serious_crime",
      headers: { "content-type": `multipart/form-data; boundary=${boundary}`, "origin": "https://deepai.org" },
      data: formData
    });

    let reply = response.data.output || response.data.text || "";
    reply = reply.trim();
    
    history.push({ role: "assistant", content: reply });
    const sent = await sh.reply(`${header}🤖 : ${reply}${footer}`);
    
    if (sent && sent.messageID) {
      global.shelly.Reply.push({
        name: "كايروس",
        ID: sent.messageID,
        author: userId,
        type: "continue"
      });
    }
  } catch (e) {
    sh.reply(`${header}❌ حدث خطأ أثناء الرد المستمر.${footer}`);
  }
};

const axios = require("axios");
const moment = require("moment-timezone");

module.exports.config = {
  name: "kairos", // اسم الأمر البرمجي
  version: "3.1.0",
  hasPermssion: 0,
  credits: "Rx Abdullah / تعريب وتطوير Gemini",
  description: "الذكاء الاصطناعي كايروس للإجابة على تساؤلاتك",
  commandCategory: "الذكاء الاصطناعي",
  cooldowns: 3,
  usePrefix: false // جعلناه يعمل بدون بريفكس لسهولة المناداة
};

let activeAIReplies = new Set();

// جلب رابط السيرفر من جيت هاب (طريقتك الأصلية لضمان الاستمرارية)
async function getBaseApiUrl() {
  try {
    const res = await axios.get("https://raw.githubusercontent.com/rummmmna21/rx-api/refs/heads/main/baseApiUrl.json");
    if (!res.data.gpt) throw new Error("رابط الـ API غير موجود");
    return res.data.gpt.trim().replace(/\/+$/, "");
  } catch (e) {
    console.error("❌ خطأ في جلب الرابط:", e.message);
    throw new Error("❌ فشل الاتصال بخادم جيت هاب");
  }
}

// مؤشر "جاري الكتابة" لإعطاء طابع واقعي
async function showTypingFor(api, threadID, ms) {
  try {
    await api.sendTypingIndicatorV2(true, threadID);
    await new Promise(r => setTimeout(r, ms));
  } catch (err) {
    console.log("⚠️ خطأ في مؤشر الكتابة:", err.message);
  }
}

async function getAIReply(baseUrl, question, imageUrl) {
  let apiUrl = `${baseUrl}/mrx/gpt.php?ask=${encodeURIComponent(question)}`;
  if (imageUrl) apiUrl += `&img=${encodeURIComponent(imageUrl)}`;
  const res = await axios.get(apiUrl);
  return typeof res.data === "object" ? res.data.answer || JSON.stringify(res.data) : res.data || "⚠️ عذراً، لم أستطع إيجاد رد مناسب.";
}

async function processQuestion(api, event, question) {
  const { threadID, messageID } = event;
  try {
    const baseUrl = await getBaseApiUrl();
    let imageUrl = event.messageReply?.attachments?.[0]?.type === "photo" ? event.messageReply.attachments[0].url : null;

    // تفعيل وضع الكتابة لمدة 3 ثوانٍ
    await showTypingFor(api, threadID, 3000);

    // محاولة جلب الرد
    const replyPromise = getAIReply(baseUrl, question, imageUrl);
    
    // إرسال رسالة "تفكير" إذا تأخر الرد
    let isFinished = false;
    const thinkingMsg = await new Promise(resolve => {
        setTimeout(async () => {
            if (!isFinished) {
                const msg = await api.sendMessage("🤔 لحظة، كايروس يفكر في إجابة دقيقة...", threadID);
                resolve(msg);
            } else resolve(null);
        }, 2500);
    });

    const reply = await replyPromise;
    isFinished = true;

    const finalResponse = `🤖「 كـايروس الذكـي 」\n━━━━━━━━━━━━━━\n${reply}\n━━━━━━━━━━━━━━\n📍 الخرطوم | ${moment().tz("Africa/Khartoum").format("hh:mm A")}`;

    if (thinkingMsg) {
      await api.editMessage(finalResponse, thinkingMsg.messageID);
      activeAIReplies.add(thinkingMsg.messageID);
    } else {
      const sentMsg = await api.sendMessage(finalResponse, threadID, messageID);
      activeAIReplies.add(sentMsg.messageID);
    }

  } catch (err) {
    console.error(err);
    await api.sendMessage("❌ عذراً، حدث خطأ أثناء الاتصال بعقل كايروس الصناعي.", threadID);
  }
}

module.exports.run = async ({ api, event, args }) => {
  const { body, messageReply } = event;
  
  // استخلاص السؤال (سواء كان بعد اسم كايروس أو في رد)
  let question = args.join(" ");
  
  // إذا بدأ المستخدم الرسالة بكلمة "كايروس"
  if (body.toLowerCase().startsWith("كايروس")) {
      question = body.slice(6).trim();
  }

  if (!question && messageReply) question = body;
  if (!question) return api.sendMessage("نعم؟ أنا كايروس، كيف يمكنني مساعدتك اليوم؟\nمثال: كايروس ما هي عاصمة السودان؟", event.threadID, event.messageID);

  await processQuestion(api, event, question);
};

module.exports.handleEvent = async ({ api, event }) => {
  const { body, messageReply, threadID } = event;
  // التفاعل إذا قام المستخدم بالرد على رسالة البوت السابقة
  if (!messageReply || !activeAIReplies.has(messageReply.messageID)) return;
  
  if (!body) return;
  await processQuestion(api, event, body);
};

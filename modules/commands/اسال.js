module.exports.config = {
  name: "اسال",
  version: "2.1.0",
  hasPermssion: 0,
  credits: "Mustapha",
  description: "أسئلة ثقافية متعددة (10 أسئلة)",
  commandCategory: "ألعاب",
  usages: "اسال",
  cooldowns: 5
};

const questions = [
  {
    q: "ما هو أقدم خط في اللغة العربية؟",
    a: ["الكوفي", "الثلث", "النسخ"],
    correct: 0
  },
  {
    q: "ما عاصمة الدولة الأموية؟",
    a: ["بغداد", "دمشق", "القاهرة"],
    correct: 1
  },
  {
    q: "من أول خليفة راشدي؟",
    a: ["عمر بن الخطاب", "علي بن أبي طالب", "أبو بكر الصديق"],
    correct: 2
  },
  {
    q: "كم عدد سور القرآن الكريم؟",
    a: ["112", "114", "116"],
    correct: 1
  },
  {
    q: "من مكتشف الجاذبية؟",
    a: ["نيوتن", "أينشتاين", "غاليلو"],
    correct: 0
  },
  {
    q: "ما أكبر كوكب في المجموعة الشمسية؟",
    a: ["الأرض", "زحل", "المشتري"],
    correct: 2
  },
  {
    q: "في أي قارة تقع مصر؟",
    a: ["آسيا", "أفريقيا", "أوروبا"],
    correct: 1
  },
  {
    q: "كم عدد أيام السنة الميلادية؟",
    a: ["360", "365", "366"],
    correct: 1
  },
  {
    q: "ما أسرع حيوان بري؟",
    a: ["الأسد", "الفهد", "الذئب"],
    correct: 1
  },
  {
    q: "ما عاصمة السعودية؟",
    a: ["جدة", "مكة", "الرياض"],
    correct: 2
  }
];

module.exports.run = async function ({ api, event }) {
  const q = questions[Math.floor(Math.random() * questions.length)];

  let msg = `⏳ عندك 20 ثانية للإجابة:\n\n`;
  msg += `📌 السؤال: ${q.q}\n\n`;
  q.a.forEach((ans, i) => {
    msg += `${i + 1}️⃣ ${ans}\n`;
  });
  msg += `\n✍️ اكتب رقم الإجابة فقط`;

  api.sendMessage(msg, event.threadID, (err, info) => {
    if (err) return;

    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      author: event.senderID,
      correct: q.correct
    });
  });
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  if (event.senderID !== handleReply.author) return;

  const userAnswer = parseInt(event.body.trim()) - 1;
  let reply;

  if (userAnswer === handleReply.correct) {
    reply = "✅ إجابة صحيحة 🎉";
  } else {
    reply = "❌ إجابة خاطئة 😅";
  }

  api.sendMessage(reply, event.threadID);
};

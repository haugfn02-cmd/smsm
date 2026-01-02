const fs = require("fs");
const path = require("path");
const https = require("https");

const DEV_ID = "61581906898524";
const DATA_PATH = path.join(__dirname, "autopilot_v10_data.json");

// الإعدادات الأولية
let d = {
  smartMode: true,
  lastDevActivity: Date.now(),
  timeout: 60 * 60 * 1000,
  users: {}, groups: {}, 
  isSleeping: false, sleepUntil: 0,
  lastBroadcast: Date.now(),
  lastGame: Date.now(),
  msgCount: 0, games: {}
};

// تحميل البيانات
if (fs.existsSync(DATA_PATH)) {
  try { d = JSON.parse(fs.readFileSync(DATA_PATH)); } catch (e) { console.log("خطأ في تحميل البيانات"); }
}

const save = () => fs.writeFileSync(DATA_PATH, JSON.stringify(d, null, 2));

// دالة جلب رد الذكاء الاصطناعي
async function getAIResponse(text) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.simsimi.net',
      path: `/v2/?text=${encodeURIComponent(text)}&lc=ar`,
      method: 'GET'
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data).success); } catch (e) { resolve("أنا معك، كيف أساعدك؟"); }
      });
    });
    req.on('error', () => resolve("عذراً، النظام في حالة تحديث."));
    req.end();
  });
}

module.exports.run = async ({ api, event }) => {
  const { body, senderID: uid, threadID: tid, mentions } = event;
  const now = Date.now();

  // 1. نظام الألعاب التلقائي (كل ساعتين)
  if (now - d.lastGame > 2 * 60 * 60 * 1000) {
    d.lastGame = now;
    save();
    const questions = [
      { q: "ما هو الشيء الذي يكتب ولا يقرأ؟", a: "القلم" },
      { q: "ماهو الشيء الذي كلما زاد نقص؟", a: "العمر" },
      { q: "ما هو الكوكب الأحمر؟", a: "المريخ" },
      { q: "شيء له أسنان ولا يعض؟", a: "المشط" }
    ];
    const game = questions[Math.floor(Math.random() * questions.length)];
    d.games[tid] = game.a;
    Object.keys(d.groups).forEach(id => {
      api.sendMessage(`🎮 وقت اللعبة التلقائي (V10):\n${game.q}`, id);
    });
  }

  // التحقق من إجابة اللعبة
  if (d.games[tid] && body === d.games[tid]) {
    delete d.games[tid];
    save();
    return api.sendMessage("🎉 إجابة صحيحة! تم تسجيل نقطة ذكاء لك.", tid);
  }

  if (!body) return;

  // 2. تحديث المجموعات والإحصائيات
  if (!d.groups[tid]) d.groups[tid] = { count: 0 };
  d.groups[tid].count++;

  // 3. الرسالة الدورية (كل 3 ساعات)
  if (now - d.lastBroadcast > 3 * 60 * 60 * 1000) {
    d.lastBroadcast = now;
    save();
    Object.keys(d.groups).forEach(id => {
      api.sendMessage("📢 『𝗞𝗜𝗥𝗢 𝗕𝗢𝗧 𝗩١٠』\nالنظام مستقر، والذكاء الاصطناعي متاح للرد على استفساراتكم.", id);
    });
  }

  // 4. نظام التبريد والسكون
  if (d.isSleeping && now < d.sleepUntil) return;
  if (d.isSleeping && now >= d.sleepUntil) {
    d.isSleeping = false;
    api.sendMessage("❄️ تم تبريد النظام بنجاح، البوت عاد للعمل.", tid);
  }

  d.msgCount++;
  if (d.msgCount > 30) {
    d.isSleeping = true;
    d.sleepUntil = now + 5 * 60000;
    d.msgCount = 0;
    save();
    return api.sendMessage("🌡️ وضع السكون التلقائي مفعل (تبريد V10) لمدة 5 دقائق.", tid);
  }
  setTimeout(() => { d.msgCount = Math.max(0, d.msgCount - 1); }, 30000);

  /* 👑 أوامر المطور وقائمة التحكم */
  if (uid === DEV_ID) {
    d.lastDevActivity = now;
    if (body === "ادارة ذاتية") {
      const menu = "🏆 『𝗞𝗜𝗥𝗢 𝗜𝗠𝗣𝗘𝗥𝗜𝗔𝗟 𝗩١٠』\n" +
                   "• حالة : عرض الحرارة والضغط\n" +
                   "• احصائيات : عرض أنشط المجموعات\n" +
                   "• تنظيف : مسح سجلات السبام\n" +
                   "• الغياب <دقائق> : ضبط وقت الرد";
      return api.sendMessage(menu, tid);
    }
    if (body === "احصائيات") {
      const topGroups = Object.entries(d.groups).sort((a,b) => b[1].count - a[1].count).slice(0,3);
      let msg = "📊 أنشط المجموعات حالياً:\n";
      topGroups.forEach(([id, data], i) => msg += `${i+1}. ID: ${id} (${data.count} رسالة)\n`);
      return api.sendMessage(msg, tid);
    }
    if (body.startsWith("الغياب ")) {
      d.timeout = parseInt(body.split(" ")[1]) * 60000;
      save();
      return api.sendMessage("✅ تم ضبط فترة الغياب بنجاح.", tid);
    }
  }

  if (!d.smartMode) return;

  /* 🧠 الردود الذكية والحماية */
  // تاق المطور
  if (mentions && Object.keys(mentions).includes(DEV_ID) && (now - d.lastDevActivity > d.timeout)) {
    const aiReply = await getAIResponse(body);
    return api.sendMessage(`👤 المطور غائب حالياً.. ردي الذكي: ${aiReply}`, tid);
  }

  // رد البوت
  if (body.startsWith("بوت ")) {
    const reply = await getAIResponse(body.replace("بوت ", ""));
    return api.sendMessage(`🤖 ${reply}`, tid);
  }

  // نظام الحماية من السبام
  if (!d.users[uid]) d.users[uid] = { score: 0, last: now };
  const u = d.users[uid];
  if (now - u.last < 600) u.score += 2;
  else u.score = Math.max(0, u.score - 1);
  u.last = now;

  if (u.score > 12) {
    u.score = 0;
    api.removeUserFromGroup(uid, tid);
    return api.sendMessage("🚫 طرد: تم اكتشاف محاولة تخريب (V10 Shield).", tid);
  }

  if (d.msgCount % 15 === 0) save();
};

module.exports.config = {
  name: "autopilot",
  eventType: ["message"],
  version: "10.1.0",
  credits: "Kiro",
  description: "النسخة النهائية: ألعاب كل ساعتين، تبريد، إحصائيات، وذكاء اصطناعي"
};

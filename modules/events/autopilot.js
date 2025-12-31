const fs = require("fs");
const path = require("path");

const DEV_ID = "61581906898524";
const DATA_PATH = path.join(__dirname, "autopilot.json");

/* إنشاء ملف البيانات */
if (!fs.existsSync(DATA_PATH)) {
  fs.writeFileSync(DATA_PATH, JSON.stringify({
    smartMode: false,
    lastDevActivity: Date.now(),
    timeout: 3 * 60 * 60 * 1000,
    autoProtection: false,
    emergency: false,
    sleepUntil: 0,
    msgCount: 0,
    lastMsgReset: Date.now(),
    users: {},
    backupAdmin: null
  }, null, 2));
}

const load = () => JSON.parse(fs.readFileSync(DATA_PATH));
const save = d => fs.writeFileSync(DATA_PATH, JSON.stringify(d, null, 2));

module.exports.run = async ({ api, event }) => {
  const d = load();
  const now = Date.now();
  const body = event.body || "";
  const uid = event.senderID;
  const tid = event.threadID;

  /* =========================
     👑 أوامر المطور
  ========================= */
  if (uid === DEV_ID && body.startsWith("الوضع_الذكي")) {

    if (body.includes("تشغيل")) {
      d.smartMode = true;
      d.lastDevActivity = now;
      save(d);
      return api.sendMessage(
        "🧠 『𝗞𝗜𝗥𝗢 𝗕𝗢𝗧』\nتم تشغيل الوضع الذكي بنجاح ✅",
        tid
      );
    }

    if (body.includes("ايقاف")) {
      d.smartMode = false;
      d.autoProtection = false;
      d.emergency = false;
      d.users = {};
      save(d);
      return api.sendMessage(
        "🛑 『𝗞𝗜𝗥𝗢 𝗕𝗢𝗧』\nتم إيقاف الوضع الذكي ❌",
        tid
      );
    }

    if (body.includes("حالة")) {
      return api.sendMessage(
        "🧠 『𝗞𝗜𝗥𝗢 𝗕𝗢𝗧』\n" +
        "━━━━━━━━━━━━\n" +
        `الوضع الذكي : ${d.smartMode ? "✅ مفعل" : "❌ متوقف"}\n` +
        `الحماية     : ${d.autoProtection ? "🛡️ شغالة" : "⛔ متوقفة"}\n` +
        `الطوارئ     : ${d.emergency ? "🚨 نعم" : "❌ لا"}\n` +
        `السكون      : ${d.sleepUntil > now ? "😴 مفعل" : "❌ لا"}\n` +
        `مشرف احتياطي: ${d.backupAdmin ? "👑 معين" : "—"}\n` +
        "━━━━━━━━━━━━",
        tid
      );
    }
  }

  /* لو الوضع الذكي مطفأ → تجاهل كل شيء */
  if (!d.smartMode) return;

  /* تحديث نشاط المطور */
  if (uid === DEV_ID) {
    d.lastDevActivity = now;
    d.autoProtection = false;
    d.emergency = false;
    save(d);
    return;
  }

  /* =========================
     😴 وضع السكون
  ========================= */
  if (now - d.lastMsgReset > 60000) {
    d.msgCount = 0;
    d.lastMsgReset = now;
  }
  d.msgCount++;

  if (d.msgCount >= 25 && d.sleepUntil < now) {
    d.sleepUntil = now + 15 * 60000;
    api.sendMessage("😴 تم تفعيل وضع السكون 15 دقيقة بسبب الضغط", tid);
  }
  if (d.sleepUntil > now) return;

  /* =========================
     ⏱️ غياب المطور
  ========================= */
  if (!d.autoProtection && now - d.lastDevActivity >= d.timeout) {
    d.autoProtection = true;
    api.sendMessage("🧠 تم تفعيل الإدارة الذاتية (غياب المطور)", tid);
  }

  /* =========================
     🧠 الذكاء السلوكي
  ========================= */
  if (!d.users[uid]) {
    d.users[uid] = { score: 0, warns: 0, last: 0, lastMsg: "" };
  }
  const u = d.users[uid];

  if (now - u.last < 3000) u.score++;                 // سرعة
  if (body.length > 1000) u.score += 2;               // طول
  if (/http(s)?:\/\//i.test(body)) u.score += 2;      // روابط
  if (body && body === u.lastMsg) u.score++;          // تكرار

  u.last = now;
  u.lastMsg = body;

  /* =========================
     ⚠️ تحكم تدريجي
  ========================= */
  if (u.score >= 2 && u.warns === 0) {
    u.warns++;
    api.sendMessage("⚠️ تحذير: يرجى الالتزام بالقوانين", tid);
  }

  if (u.score >= 4 && u.warns === 1) {
    u.warns++;
    api.sendMessage("🔇 تم كتمك مؤقتًا (سلوك متكرر)", tid);
    api.muteUser(uid, tid, 2 * 60 * 1000);
  }

  if (u.score >= 6) {
    api.removeUserFromGroup(uid, tid);
    api.sendMessage("🚫 تم الطرد بسبب التخريب", tid);
    delete d.users[uid];
  }

  /* =========================
     🔒 دمج ذكي (خطر عام)
  ========================= */
  const danger = Object.values(d.users)
    .reduce((a, b) => a + b.score, 0);

  if (danger >= 8 && !d.emergency) {
    d.emergency = true;
    api.sendMessage("🚨 خطر مرتفع – تم تفعيل وضع الطوارئ", tid);
  }

  /* =========================
     👑 مشرف احتياطي
  ========================= */
  if (d.autoProtection && !d.backupAdmin) {
    d.backupAdmin = uid;
    api.changeAdminStatus(tid, uid, true);
    api.sendMessage("👑 تم تعيين مشرف احتياطي مؤقت", tid);
  }

  save(d);
};

module.exports.config = {
  name: "autopilot",
  eventType: ["message"],
  version: "4.1.0",
  credits: "Kiro Smart Auto System",
  description: "الوضع الذكي + إدارة ذاتية + ذكاء سلوكي"
};

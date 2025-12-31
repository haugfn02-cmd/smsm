const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "users.json");

// تحميل وحفظ البيانات
function loadData() {
  if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, "{}");
  return JSON.parse(fs.readFileSync(dataPath));
}
function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

// الوظائف
const jobs = {
  "توصيل": { min: 800, max: 1800 },
  "حارس": { min: 1000, max: 2200 },
  "تاجر": { min: 1200, max: 2600 },
  "سائق": { min: 900, max: 2000 },
  "مزارع": { min: 700, max: 1600 },
  "صياد": { min: 1100, max: 2400 },
  "ميكانيكي": { min: 1300, max: 2800 },
  "طبيب": { min: 2000, max: 4000 },
  "مبرمج": { min: 1800, max: 3500 },
  "ضابط": { min: 1600, max: 3200 }
};

// المتجر
const shop = {
  "هاتف": { price: 1500, desc: "📱 يزيد فرص النجاح" },
  "دراجة": { price: 3000, desc: "🚲 دخل أعلى للتوصيل" },
  "سيارة": { price: 8000, desc: "🚗 أرباح مضاعفة للسائق" },
  "عدة": { price: 2500, desc: "🔧 تقوية الميكانيكي" },
  "سلاح": { price: 6000, desc: "🔫 حماية إضافية" },
  "حقيبة": { price: 2000, desc: "🎒 حمل أدوات أكثر" },
  "كمبيوتر": { price: 5000, desc: "💻 دعم المبرمج" },
  "بطاقة": { price: 4000, desc: "💳 خصومات متجر" },
  "ملابس": { price: 1800, desc: "👕 مظهر احترافي" },
  "خريطة": { price: 3500, desc: "🗺️ فرص نادرة" },
  "مسدس": { price: 7000, desc: "🔫 قوة هجومية أكبر" },
  "رشاش": { price: 12000, desc: "💥 ضرر أعلى" },
  "خوذة": { price: 2500, desc: "🛡️ حماية إضافية" }
};

// تأثير الأدوات على الأرباح
const itemEffects = {
  "هاتف": 0.05, "دراجة": 0.10, "سيارة": 0.20,
  "عدة": 0.08, "سلاح": 0.05, "حقيبة": 0.07,
  "كمبيوتر": 0.12, "بطاقة": 0.15, "ملابس": 0.03,
  "خريطة": 0.10, "مسدس": 0.06, "رشاش": 0.12, "خوذة": 0.04
};

// المكافأة اليومية
const DAILY_MIN = 500;
const DAILY_MAX = 1500;

// المناطق العشوائية
const regions = ["الخرطوم", "أم درمان", "بحري", "كسلا", "دنقلا", "الفاشر"];

module.exports.config = {
  name: "كايروس",
  version: "5.3.0",
  hasPermssion: 0,
  credits: "محمد إدريس",
  description: "نظام كامل: وظائف + متجر + مكافآت + تنقيب + رهان + فكة + صمة + بحث",
  commandCategory: "اقتصاد",
  usages: "<سجلني/وظائف/اختيار/عمل/متجر/شراء/حقيبة/اغنياء/يومي/بحث/تنقيب/رهان/فكة/صمة>",
  cooldowns: 2
};

module.exports.run = async function({ api, event, args, Users }) {
  const userID = event.senderID;
  const userName = await Users.getNameUser(userID);
  let data = loadData();
  const sub = args[0];
  const user = data[userID];

  // 🟢 تسجيل باسم تختاره
  if (sub === "سجلني") {
    const chosenName = args.slice(1).join(" ") || userName;
    if (user) return api.sendMessage("❌ أنت مسجل بالفعل.", event.threadID);
    const region = regions[Math.floor(Math.random() * regions.length)];
    data[userID] = {
      name: chosenName,
      balance: 1000,
      job: "عاطل",
      inventory: [],
      lastWork: 0,
      lastDaily: 0,
      region,
      resources: { ذهب: 0, فضة: 0, حجر: 0 },
      lastMine: 0
    };
    saveData(data);
    return api.sendMessage(
`✅ | تم تسجيلك بنجاح!
👤 | الاسم: ${chosenName}
📍 | منطقتك: ${region}
💰 | الرصيد: 1000 جنيه
🎒 | الحقيبة: فارغة
💎 | مواردك: ${JSON.stringify(data[userID].resources)}`,
      event.threadID
    );
  }

  if (!user)
    return api.sendMessage("❌ أنت عاطل ʕ•͡-•ʔ\n💡 للتسجيل: سجلني <اسمك>", event.threadID);

  // 📋 عرض الوظائف
  if (sub === "وظائف") {
    let msg = "💼 | الوظائف المتاحة:\n\n";
    Object.keys(jobs).forEach(j => msg += `✨ ${j}\n`);
    msg += "\n📌 | لاختيار وظيفة: اختيار <اسم الوظيفة>";
    return api.sendMessage(msg, event.threadID);
  }

  // 🧾 اختيار وظيفة
  if (sub === "اختيار") {
    const jobName = args.slice(1).join(" ");
    if (!jobs[jobName])
      return api.sendMessage("❌ | هذه الوظيفة غير موجودة.", event.threadID);
    user.job = jobName;
    saveData(data);
    return api.sendMessage(`✅ | تم اختيار وظيفة: ${jobName}`, event.threadID);
  }

  // 🚧 العمل
  if (sub === "عمل") {
    if (user.job === "عاطل")
      return api.sendMessage("❌ | اختر وظيفة أولاً.", event.threadID);

    const now = Date.now();
    if (now - user.lastWork < 5 * 60 * 1000)
      return api.sendMessage("⏳ | انتظر قليلاً قبل العمل مرة أخرى.", event.threadID);

    const job = jobs[user.job];
    let baseReward = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;

    let bonusMultiplier = 1;
    if (user.inventory && user.inventory.length > 0) {
      user.inventory.forEach(item => {
        if (itemEffects[item]) bonusMultiplier += itemEffects[item];
      });
    }

    const reward = Math.floor(baseReward * bonusMultiplier);
    user.balance += reward;
    user.lastWork = now;
    saveData(data);

    return api.sendMessage(
`🚀 | عملت كـ ${user.job}
💸 | ربحك الأساسي: ${baseReward.toLocaleString()} جنيه
✨ | مكافأة الأدوات: +${(reward - baseReward).toLocaleString()} جنيه
🏦 | رصيدك الحالي: ${user.balance.toLocaleString()} جنيه
🎯 | تابع العمل لزيادة أرباحك!`,
      event.threadID
    );
  }

  // 🏪 المتجر
  if (sub === "متجر") {
    let msg = "🏪 | متجر كايروس:\n\n";
    Object.entries(shop).forEach(([k, v]) => {
      msg += `🛍️ ${k} — ${v.price.toLocaleString()} جنيه\n${v.desc}\n\n`;
    });
    msg += "🛒 | للشراء: شراء <اسم المنتج>";
    return api.sendMessage(msg, event.threadID);
  }

  // 🛒 شراء
  if (sub === "شراء") {
    const item = args.slice(1).join(" ");
    if (!shop[item])
      return api.sendMessage("❌ | هذا المنتج غير موجود.", event.threadID);
    if (user.balance < shop[item].price)
      return api.sendMessage("❌ | رصيدك غير كافي.", event.threadID);

    user.balance -= shop[item].price;
    user.inventory.push(item);
    saveData(data);

    return api.sendMessage(
`✅ | اشتريت: ${item}
💸 | السعر: ${shop[item].price.toLocaleString()}
🏦 | رصيدك الآن: ${user.balance.toLocaleString()} جنيه`,
      event.threadID
    );
  }

  // 🎒 الحقيبة
  if (sub === "حقيبة") {
    if (!user.inventory.length) return api.sendMessage("🎒 | حقيبتك فارغة.", event.threadID);
    let msg = "🎒 | حقيبتك:\n\n";
    user.inventory.forEach((i, idx) => { msg += `🔹 ${idx + 1}. ${i}\n`; });
    return api.sendMessage(msg, event.threadID);
  }

  // 🏆 أغنى 7 مستخدمين
  if (sub === "اغنياء") {
    const usersArray = Object.values(data);
    if (!usersArray.length) return api.sendMessage("❌ | لا يوجد مستخدمون مسجلون.", event.threadID);

    const top = usersArray.sort((a,b)=>b.balance-a.balance).slice(0,7);
    let msg = "👑 | قائمة أغنى 7 مستخدمين:\n＿＿＿＿＿＿＿＿＿＿\n";
    top.forEach((u,i)=>{ msg += `🏅 ${i+1}. ${u.name}: ${u.balance.toLocaleString()} جنيه\n`; });
    msg += "＿＿＿＿＿＿＿＿＿＿";
    return api.sendMessage(msg, event.threadID);
  }

  // 🎁 المكافأة اليومية
  if (sub === "يومي") {
    const now = Date.now();
    const cooldown = 24*60*60*1000;
    if (!user.lastDaily) user.lastDaily = 0;

    if (now - user.lastDaily < cooldown) {
      const remaining = cooldown - (now - user.lastDaily);
      const hours = Math.floor(remaining/(1000*60*60));
      const minutes = Math.floor((remaining%(1000*60*60))/(1000*60));
      return api.sendMessage(`⏳ | لقد استلمت مكافأتك اليومية بالفعل\n🕒 المتبقي: ${hours} ساعة و ${minutes} دقيقة`, event.threadID);
    }

    const reward = Math.floor(Math.random()*(DAILY_MAX-DAILY_MIN+1))+DAILY_MIN;
    user.balance += reward;
    user.lastDaily = now;
    saveData(data);

    return api.sendMessage(
`🎁 | مكافأة يومية!
💰 | حصلت على: +${reward.toLocaleString()} جنيه
🏦 | رصيدك الحالي: ${user.balance.toLocaleString()} جنيه
⏰ | عد غدًا لمكافأة جديدة 🔥`,
      event.threadID
    );
  }

  // 🔎 بحث عن لاعب
  if (sub === "بحث") {
    const searchName = args.slice(1).join(" ");
    const found = Object.values(data).find(u => u.name === searchName);
    if (!found) return api.sendMessage("❌ | اللاعب غير موجود.", event.threadID);
    let msg = `👤 | بيانات اللاعب ${found.name}\n`;
    msg += `💰 | الرصيد: ${found.balance.toLocaleString()} جنيه\n`;
    msg += `💼 | الوظيفة: ${found.job}\n`;
    msg += `🎒 | الحقيبة: ${found.inventory.join(", ") || "فارغة"}\n`;
    msg += `📍 | المنطقة: ${found.region}\n`;
    msg += `💎 | الموارد: ${JSON.stringify(found.resources)}`;
    return api.sendMessage(msg, event.threadID);
  }

  // ⛏️ تنقيب
  if (sub === "تنقيب") {
    const now = Date.now();
    if (now - user.lastMine < 15*60*1000)
      return api.sendMessage("⏳ | عليك الانتظار قبل التنقيب مرة أخرى.", event.threadID);

    const foundResources = {
      ذهب: Math.floor(Math.random()*5),
      فضة: Math.floor(Math.random()*10),
      حجر: Math.floor(Math.random()*15)
    };
    Object.keys(foundResources).forEach(k => user.resources[k] += foundResources[k]);
    user.lastMine = now;
    saveData(data);
    return api.sendMessage(`⛏️ | التنقيب اكتمل!\n💎 | حصلت على: ${JSON.stringify(foundResources)}`, event.threadID);
  }

  // 🎲 رهان
  if (sub === "رهان") {
    const amount = parseInt(args[1]);
    if (!amount || amount <= 0) return api.sendMessage("❌ | حدد مبلغ الرهان.", event.threadID);
    if (user.balance < amount) return api.sendMessage("❌ | رصيدك غير كافي.", event.threadID);

    const win = Math.random() < 0.5;
    if (win) {
      const winAmount = amount * 2;
      user.balance += winAmount;
      saveData(data);
      return api.sendMessage(`🎉 | فزت بالرهان!\n💰 | حصلت على: ${winAmount.toLocaleString()} جنيه\n🏦 | رصيدك الآن: ${user.balance.toLocaleString()}`, event.threadID);
    } else {
      user.balance -= amount;
      saveData(data);
      return api.sendMessage(`💔 | خسرت الرهان!\n💰 | خسرت: ${amount.toLocaleString()} جنيه\n🏦 | رصيدك الآن: ${user.balance.toLocaleString()}`, event.threadID);
    }
  }

  // 💸 فكة
  if (sub === "فكة") {
    if (user.balance < 10) return api.sendMessage("❌ | رصيدك صغير جداً للفكة.", event.threadID);
    const portion = Math.floor(Math.random() * Math.min(user.balance, 500)) + 1;
    user.balance -= portion;
    saveData(data);
    return api.sendMessage(`💸 | تم أخذ فكة: ${portion.toLocaleString()} جنيه\n🏦 | رصيدك الآن: ${user.balance.toLocaleString()}`, event.threadID);
  }

  // 🎁 صمة
  if (sub === "صمة") {
    const gift = Math.floor(Math.random() * 1000) + 50;
    user.balance += gift;
    saveData(data);
    return api.sendMessage(`🎁 | لقد حصلت على صمة!\n💰 | أضيف لك: ${gift.toLocaleString()} جنيه\n🏦 | رصيدك الآن: ${user.balance.toLocaleString()}`, event.threadID);
  }

  // ❓ مساعدة عامة
  api.sendMessage(
`📌 | أوامر النظام:
- سجلني <اسمك>
- وظائف
- اختيار <اسم الوظيفة>
- عمل
- متجر
- شراء <اسم المنتج>
- حقيبة
- اغنياء
- يومي
- بحث <اسم اللاعب>
- تنقيب
- رهان <المبلغ>
- فكة
- صمة`,
    event.threadID
  );
};

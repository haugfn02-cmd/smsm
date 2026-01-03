const fs = require("fs-extra");
const path = require("path");

const dataPath = path.join(__dirname, "rpg_master_final.json");

function loadData() {
    if (!fs.existsSync(dataPath)) {
        fs.writeJsonSync(dataPath, { users: {}, gangs: {}, market: { goldPrice: 5000 } });
    }
    return fs.readJsonSync(dataPath);
}
function saveData(data) {
    fs.writeJsonSync(dataPath, data, { spaces: 2 });
}

module.exports.config = {
    name: "كايروس_الامبراطوري",
    version: "25.0.0",
    hasPermssion: 0,
    credits: "Kiro & Gemini AI",
    description: "النظام المتكامل النهائي لـ RPG كيرو",
    commandCategory: "نظام الحياة",
    usePrefix: false,
    cooldowns: 0
};

module.exports.handleEvent = async function({ api, event, Users }) {
    const { body, senderID, threadID, messageID, mentions } = event;
    if (!body) return;

    let data = loadData();
    const args = body.split(/\s+/);
    const cmd = args[0]; 
    const user = data.users[senderID];

    // تحديث البورصة
    if (data.market) {
        data.market.goldPrice += Math.floor(Math.random() * 201) - 100;
        data.market.goldPrice = Math.max(1000, data.market.goldPrice);
    }

    // 0. أوامر المساعدة
    if (cmd === "أوامر" || cmd === "مساعدة") {
        const help = `📜 【 دَلِيلُ عَالَمِ كَايْرُوسْ الإِمْبَرَاطُورِي 】 📜
━━━━━━━━━━━━━━━━━━
🎮 سجلني [اسمك] | مستوى | تعزيز
⚔️ هجوم | أسر | تحرير | متجر اسلحة
🏴‍☠️ عصابة انشاء [اسم] | عصابة انضمام [اسم]
🌱 بذور شراء | زراعة شراء [رقم] | حصاد
⛏️ تنقيب | عمل | البورصة | فكة
🎲 رهان [مبلغ] | سوق اسود
━━━━━━━━━━━━━━━━━━`;
        return api.sendMessage(help, threadID, messageID);
    }

    // 1. التسجيل
    if (cmd === "سجلني") {
        if (user) return api.sendMessage("⚠️ مسجل بالفعل!", threadID, messageID);
        const name = args.slice(1).join(" ") || await Users.getNameUser(senderID);
        data.users[senderID] = {
            name, balance: 10000, health: 100, weapon: "قبضة", 
            resources: { ذهب: 0, مخدرات: 0 },
            farm: { isPlanted: false, crop: null, time: 0 },
            isSlave: false, masterID: null, gang: null,
            lastWork: 0, lastMine: 0, karma: 100
        };
        saveData(data);
        return api.sendMessage(`🎊 تم تسجيلك يا ${name}! استلمت 10,000 كهدية بداية.`, threadID, messageID);
    }

    if (!user) return;

    // 2. نظام العصابات (المطور)
    if (cmd === "عصابة") {
        const action = args[1];
        const gName = args.slice(2).join(" ");

        if (action === "انشاء") {
            if (user.balance < 50000) return api.sendMessage("❌ تحتاج 50,000 لإنشاء عصابة.", threadID, messageID);
            if (user.gang) return api.sendMessage("❌ أنت في عصابة بالفعل.", threadID, messageID);
            user.balance -= 50000;
            user.gang = gName;
            data.gangs[gName] = { leader: senderID, members: [senderID], bank: 0 };
            saveData(data);
            return api.sendMessage(`🏴‍☠️ تم تأسيس عصابة 【 ${gName} 】 بنجاح!`, threadID, messageID);
        }

        if (action === "انضمام") {
            if (!data.gangs[gName]) return api.sendMessage("❌ العصابة غير موجودة.", threadID, messageID);
            if (user.gang) return api.sendMessage("❌ اخرج من عصابتك أولاً.", threadID, messageID);
            user.gang = gName;
            data.gangs[gName].members.push(senderID);
            saveData(data);
            return api.sendMessage(`🤝 انضممت إلى عصابة ${gName}.`, threadID, messageID);
        }
    }

    // 3. نظام الأسر والعبودية
    if (cmd === "أسر") {
        const victimID = Object.keys(mentions)[0];
        if (!victimID) return api.sendMessage("⚠️ منشن الضحية!", threadID, messageID);
        if (Math.random() < 0.2) {
            data.users[victimID].isSlave = true;
            data.users[victimID].masterID = senderID;
            api.sendMessage(`⛓️ كبست على ${data.users[victimID].name} وأسرته! صار عبدك.`, threadID, messageID);
        } else {
            user.health -= 25;
            api.sendMessage("🛡️ الضحية هرب وأصابك بجروح!", threadID, messageID);
        }
        saveData(data);
    }

    if (cmd === "تحرير") {
        if (!user.isSlave) return api.sendMessage("⚠️ أنت حر يا وحش!", threadID, messageID);
        if (user.balance < 30000) return api.sendMessage("❌ الفدية 30,000 جنيه.", threadID, messageID);
        user.balance -= 30000;
        if (data.users[user.masterID]) data.users[user.masterID].balance += 30000;
        user.isSlave = false; user.masterID = null;
        saveData(data);
        return api.sendMessage("🕊️ حرية! تم دفع الفدية.", threadID, messageID);
    }

    // 4. العمل والزراعة
    if (cmd === "عمل") {
        let sal = Math.floor(Math.random() * 3000) + 1000;
        if (user.isSlave && data.users[user.masterID]) {
            const tax = Math.floor(sal * 0.5); sal -= tax;
            data.users[user.masterID].balance += tax;
            api.sendMessage(`⛓️ سيدك أخذ نصف تعبك (${tax})!`, threadID, messageID);
        }
        user.balance += sal; user.health -= 10;
        saveData(data);
        return api.sendMessage(`⚒️ كسبت ${sal} جنيه من العمل.`, threadID, messageID);
    }

    // 5. المزرعة
    const crops = { "1": { n: "بطيخ", p: 2000, r: 10000, t: 15 }, "2": { n: "ممنوعات", p: 10000, r: 60000, t: 40 } };
    if (body === "بذور شراء") {
        let m = "🌱 【 المتجر الزراعي 】\n";
        Object.entries(crops).forEach(([k, v]) => m += `${k} - ${v.n} (ربح: ${v.r})\n`);
        return api.sendMessage(m, threadID, messageID);
    }
    if (body.startsWith("زراعة شراء")) {
        const id = args[2];
        if (!crops[id] || user.farm.isPlanted) return api.sendMessage("❌ المزرعة مشغولة أو الرصيد ناقص.", threadID, messageID);
        user.balance -= crops[id].p;
        user.farm = { isPlanted: true, crop: crops[id], time: Date.now() };
        saveData(data);
        return api.sendMessage(`✅ تم زراعة ${crops[id].n}.`, threadID, messageID);
    }
    if (cmd === "حصاد") {
        if (!user.farm.isPlanted) return api.sendMessage("🚜 المزرعة خالية.", threadID, messageID);
        const pass = (Date.now() - user.farm.time) / 60000;
        if (pass < user.farm.crop.t) return api.sendMessage(`⏳ انتظر ${Math.ceil(user.farm.crop.t - pass)} دقيقة.`, threadID, messageID);
        user.balance += user.farm.crop.r; user.farm.isPlanted = false;
        saveData(data);
        return api.sendMessage(`🧺 حصاد ملكي! كسبت ${user.farm.crop.r} جنيه.`, threadID, messageID);
    }

    // 6. الهجوم والمستوى
    if (cmd === "هجوم") {
        const victimID = Object.keys(mentions)[0];
        if (!victimID) return;
        let win = user.weapon === "قناصة" ? 0.9 : 0.45;
        if (Math.random() < win) {
            const l = Math.floor(data.users[victimID].balance * 0.3);
            user.balance += l; data.users[victimID].balance -= l;
            api.sendMessage(`🔥 نهبت ${l} من ${data.users[victimID].name}!`, threadID, messageID);
        } else {
            user.health -= 35; api.sendMessage("🛡️ فشلت وتضررت!", threadID, messageID);
        }
        saveData(data);
    }

    if (cmd === "مستوى") {
        const m = `👤 【 ${user.name} 】\n━━━━━━━━━━━━━\n🏴‍☠️ العصابة: ${user.gang || "بلا"}\n❤️ الصحة: ${user.health}%\n💰 المال: ${user.balance.toLocaleString()}\n⚔️ السلاح: ${user.weapon}\n📜 الحالة: ${user.isSlave ? "مأسور" : "حر"}\n━━━━━━━━━━━━━`;
        return api.sendMessage(m, threadID, messageID);
    }

    saveData(data);
};

module.exports.run = () => {};

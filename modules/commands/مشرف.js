const fs = require("fs");

// 🟢 مسار ملف الإعدادات
const configPath = "./config.json";

// 🟢 التأكد من وجود ملف الإعدادات وهيكلة البيانات
if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ admins: [] }, null, 2));
}

function getConfig() {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function saveConfig(data) {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

module.exports.config = {
    name: "مشرف",
    version: "3.5.0",
    hasPermssion: 2,
    credits: "محمد إدريس + GPT-5",
    description: "إدارة مشرفي البوت المسجلين في config.json",
    commandCategory: "المطور",
    usages: "[add/remove/list/clear/check]",
    cooldowns: 2
};

// 🎨 تنسيق الرسائل (الاستايل الرفيع)
function style(msg) {
    return `┌──  🛡️ نـظـام الـمـشـرفـيـن  ──┐\n\n${msg}\n\n└───────────────┘`;
}

module.exports.run = async ({ api, event, args }) => {
    const devID = "61581906898524"; 
    const config = getConfig();
    if (!config.admins) config.admins = [];
    const admins = config.admins;

    // 🛡️ التحقق من صلاحية المطور فقط
    if (event.senderID != devID)
        return api.sendMessage("⚠️ عذراً، هذا الأمر مخصص لمطور البوت الأساسي فقط.", event.threadID);

    const cmd = args[0]?.toLowerCase();

    // 1️⃣ إضافة مشرف (add)
    if (cmd === "add") {
        let uid;
        if (event.messageReply) {
            uid = event.messageReply.senderID;
        } else if (Object.keys(event.mentions).length > 0) {
            uid = Object.keys(event.mentions)[0];
        } else if (args[1]) {
            uid = args[1];
        } else {
            return api.sendMessage(style("ℹ️ يرجى الرد على رسالة الشخص أو منشنته لإضافته كـمشرف."), event.threadID);
        }

        if (admins.includes(uid)) return api.sendMessage(style("⚠️ هذا المستخدم موجود بالفعل في قائمة المشرفين."), event.threadID);
        
        admins.push(uid);
        saveConfig(config);
        return api.sendMessage(style(`✅ تم منح الصلاحيات بنجاح!\n👤 الآيدي: ${uid}\n🛡️ الحالة: مشرف مسجل`), event.threadID);
    }

    // 2️⃣ عرض القائمة (list)
    if (cmd === "list" || cmd === "قائمة") {
        if (admins.length === 0) return api.sendMessage(style("ℹ️ قائمة المشرفين فارغة حالياً."), event.threadID);

        let msg = "📋 قـائـمـة الـمُـشـرفـيـن:\n\n";
        for (let i = 0; i < admins.length; i++) {
            const id = admins[i];
            try {
                const info = await api.getUserInfo(id);
                const name = info[id].name;
                msg += ` ├ ${i + 1}. ${name}\n └ 🆔 ${id}\n\n`;
            } catch (e) {
                msg += ` ├ ${i + 1}. مستخدم غير معروف\n └ 🆔 ${id}\n\n`;
            }
        }
        return api.sendMessage(style(msg), event.threadID);
    }

    // 3️⃣ إزالة مشرف (remove)
    if (cmd === "remove" || cmd === "حذف") {
        const index = parseInt(args[1]) - 1;
        if (isNaN(index) || index < 0 || index >= admins.length)
            return api.sendMessage(style("❌ يرجى إدخال رقم ترتيب المشرف الصحيح.\nمثال: مشرف حذف 1"), event.threadID);

        const removedID = admins.splice(index, 1)[0];
        saveConfig(config);
        return api.sendMessage(style(`🗑️ تم سحب الصلاحيات من:\n🆔 ${removedID}`), event.threadID);
    }

    // 4️⃣ مسح الكل (clear)
    if (cmd === "clear") {
        config.admins = [];
        saveConfig(config);
        return api.sendMessage(style("🧹 تم مسح جميع المشرفين من القائمة بنجاح."), event.threadID);
    }

    // 5️⃣ فحص مشرف (check)
    if (cmd === "check") {
        let uid = event.messageReply ? event.messageReply.senderID : event.senderID;
        const isAdm = admins.includes(uid);
        return api.sendMessage(style(isAdm ? `🌟 المستخدم [${uid}] مشرف.` : `❌ المستخدم [${uid}] ليس مشرفاً.`), event.threadID);
    }

    // ❓ قائمة المساعدة
    return api.sendMessage(style(
        "📝 الـأوامـر الـمُـتـاحـة:\n" +
        "• مشرف add ⤫ (رد/منشن)\n" +
        "• مشرف list ⤫ عرض القائمة\n" +
        "• مشرف remove ⤫ (الرقم)\n" +
        "• مشرف check ⤫ فحص الصلاحية\n" +
        "• مشرف clear ⤫ مسح القائمة"
    ), event.threadID);
};

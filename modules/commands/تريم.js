const { exec } = require("child_process");
const fs = require("fs");

module.exports.config = {
    name: "تريم",
    version: "5.5.0",
    hasPermssion: 2,
    credits: "Gemini",
    description: "لوحة تحكم إدارة المكتبات الاحترافية",
    commandCategory: "المطور",
    usages: "تريم",
    cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
    const developerID = "61581906898524";
    if (event.senderID != developerID) {
        return api.sendMessage("⚠️ [ACCESS DENIED]: مخصص للمطور فقط.", event.threadID, event.messageID);
    }

    const action = args[0];
    const libName = args.slice(1).join(" ");

    // لوحة المساعدة بتصميم Terminal
    if (!action) {
        const helpMenu = `
┏━━━━━━━━━━━━━━━━━━━━┓
   🖥️  NODE.JS PACKAGE MANAGER  
┗━━━━━━━━━━━━━━━━━━━━┛
[ STATUS: ACTIVE | DEV: 61581906898524 ]

┌──  COMMANDS LIST  ──┐
│
├─╼ i [lib]     : تثبيت قسري متوافق
├─╼ update [lib]: تحديث لأحدث إصدار
├─╼ uninstall   : إزالة مكتبة نهائياً
├─╼ info [lib]  : فحص بيانات المكتبة
├─╼ list        : عرض المستودع الحالي
├─╼ audit       : فحص وإصلاح الثغرات
├─╼ clean       : تنظيف ذاكرة npm
│
└─────────────────────┘
💡 مثال: تريم info axios
`.trim();
        return api.sendMessage(helpMenu, event.threadID);
    }

    // 1. عرض القائمة
    if (action === "list") {
        try {
            const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
            const deps = Object.entries(packageJson.dependencies || {});
            let msg = "╭─── [ 📦 SYSTEM REPOSITORY ] ───╮\n\n";
            deps.forEach(([name, version], i) => {
                msg += ` 🔹 [${i + 1}] ${name} » ${version.replace('^', '')}\n`;
            });
            msg += `\n╰────── [ TOTAL: ${deps.length} ] ──────╯`;
            return api.sendMessage(msg, event.threadID);
        } catch (e) { return api.sendMessage("❌ Error: Unable to read package.json", event.threadID); }
    }

    // 2. معلومات المكتبة
    if (action === "info") {
        if (!libName) return api.sendMessage("⚠️ [MISSING]: حدد اسم المكتبة.", event.threadID);
        api.sendMessage(`🔍 [SEARCHING]: جاري فحص ${libName}...`, event.threadID);
        return exec(`npm view ${libName} description version author`, (err, stdout) => {
            if (err) return api.sendMessage("❌ [NOT FOUND]: المكتبة غير موجودة.", event.threadID);
            return api.sendMessage(`╭─── [ ℹ️ INFO: ${libName} ] ───╮\n\n${stdout}\n╰──────────────────╯`, event.threadID);
        });
    }

    // 3. الفحص الأمني (Audit)
    if (action === "audit") {
        api.sendMessage("🛡️ [SECURITY]: جاري فحص الثغرات...", event.threadID);
        return exec("npm audit fix", (err, stdout) => {
            if (err) return api.sendMessage("❌ [FAILED]: فشل الفحص.", event.threadID);
            api.sendMessage(`✅ [COMPLETED]:\n${stdout.slice(0, 500)}...`, event.threadID);
        });
    }

    // 4. التحديث
    if (action === "update") {
        const target = libName || "";
        api.sendMessage(`🔄 [UPDATING]: ${target || "ALL PACKAGES"}...`, event.threadID);
        return exec(`npm update ${target}`, (err) => {
            if (err) return api.sendMessage("❌ [ERROR]: فشل التحديث.", event.threadID);
            api.sendMessage("✅ [SUCCESS]: تم التحديث! إعادة تشغيل المحرك...", event.threadID, () => process.exit(1));
        });
    }

    // 5. التثبيت القسري
    if (action === "i" || action === "install") {
        if (!libName) return api.sendMessage("⚠️ [MISSING]: اسم المكتبة مطلوب.", event.threadID);
        api.sendMessage(`🛠️ [INSTALLING]: جاري تثبيت ${libName}...`, event.threadID);
        exec(`npm install ${libName} --save --legacy-peer-deps --force`, (error) => {
            if (error) return api.sendMessage(`❌ [CRITICAL ERROR]:\n${error.message}`, event.threadID);
            api.sendMessage(`✅ [DONE]: تم التثبيت. إعادة تشغيل...`, event.threadID, () => process.exit(1));
        });
    }

    // 6. التنظيف
    if (action === "clean") {
        api.sendMessage("🧹 [CLEANING]: جاري مسح الكاش...", event.threadID);
        exec("npm cache clean --force", () => api.sendMessage("✨ [CLEAN]: تم تنظيف الذاكرة!", event.threadID));
    }

    // 7. الحذف
    if (action === "uninstall") {
        if (!libName) return api.sendMessage("⚠️ [MISSING]: حدد المكتبة للحذف.", event.threadID);
        api.sendMessage(`🗑️ [REMOVING]: جاري إزالة ${libName}...`, event.threadID);
        exec(`npm uninstall ${libName}`, () => api.sendMessage("✅ [REMOVED]: تم الحذف بنجاح!", event.threadID, () => process.exit(1)));
    }
};

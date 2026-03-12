const { exec } = require("child_process");
const fs = require("fs");

module.exports.config = {
    name: "تريم",
    version: "6.5.0",
    hasPermssion: 2,
    credits: "Gemini",
    description: "نظام إدارة واستكشاف المكتبات الاحترافية - Terminal Style",
    commandCategory: "المطور",
    usages: "تريم",
    cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
    // التحقق من هوية المطور
    const developerID = "100081948980908";
    if (event.senderID != developerID) {
        return api.sendMessage("⚠️ [ACCESS DENIED]: هذا الأمر محمي ومخصص للمطور صاحب المعرف 61581906898524 فقط.", event.threadID, event.messageID);
    }

    const action = args[0];
    const libName = args.slice(1).join(" ");

    // 1. لوحة المساعدة الرئيسية (تظهر عند كتابة 'تريم' فقط)
    if (!action) {
        const helpMenu = `
┏━━━━━━━━━━━━━━━━━━━━┓
   🖥️  TERMINAL PACKAGE ENGINE  
┗━━━━━━━━━━━━━━━━━━━━┛
[ STATUS: ONLINE | USER: DEV-6158 ]

┌──  AVAILABLE ACTIONS  ──┐
│
├─╼ i [lib]     : تثبيت قسري متوافق
├─╼ update [lib]: تحديث النسخة
├─╼ uninstall   : إزالة مكتبة نهائياً
├─╼ info [lib]  : 🔍 فحص وتحليل شامل
├─╼ list        : عرض المستودع الحالي
├─╼ audit       : فحص وإصلـاح الثغرات
├─╼ clean       : تنظيف ذاكـرة npm
│
└─────────────────────┘
💡 مثال: تريم info axios
`.trim();
        return api.sendMessage(helpMenu, event.threadID);
    }

    // 2. ميزة الاستكشاف والبحث المتقدم (Info)
    if (action === "info") {
        if (!libName) return api.sendMessage("⚠️ [MISSING]: يرجى تحديد اسم المكتبة المراد فحصها.", event.threadID);
        
        api.sendMessage(`📡 [CONNECTING]: جاري جلب البيانات من سجلات NPM...`, event.threadID);

        return exec(`npm view ${libName} --json`, (err, stdout) => {
            if (err) return api.sendMessage(`❌ [NOT FOUND]: لا يوجد سجل للمكتبة "${libName}" في NPM.`, event.threadID);

            try {
                const info = JSON.parse(stdout);
                const report = `
╭─── [ 🛠️ ANALYSIS: ${info.name.toUpperCase()} ]
│
├─╼ [📖] الوصف: ${info.description || 'لا يوجد وصف متاح'}
├─╼ [🚀] الإصدار: ${info.version} (الأخير)
├─╼ [📜] الترخيص: ${info.license || 'غير محدد'}
├─╼ [👤] المؤلف: ${info.author ? (info.author.name || info.author) : 'مجهول'}
├─╼ [⚡] الحالة: ${info.deprecated ? '⚠️ قديمة (تجنبها)' : '✅ مستقرة وآمنة'}
├─╼ [🏷️] الفئة: ${info.keywords ? info.keywords.slice(0, 3).join(", ") : 'عامة'}
│
├── [ 💡 USAGE / الاستخدام ]
│ 
│ • Install : npm i ${info.name}
│ • Require : const ${info.name.replace(/-/g, '')} = require('${info.name}');
│
╰───────────────────────────╯
[ NPM: https://www.npmjs.com/package/${info.name} ]
`.trim();
                return api.sendMessage(report, event.threadID);
            } catch (e) {
                return api.sendMessage("❌ [ERROR]: فشل في تحليل بيانات المكتبة.", event.threadID);
            }
        });
    }

    // 3. عرض قائمة المكتبات الحالية (List)
    if (action === "list") {
        try {
            const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
            const deps = Object.entries(packageJson.dependencies || {});
            let msg = "╭─── [ 📦 SYSTEM REPOSITORY ] ───╮\n\n";
            deps.forEach(([name, version], i) => {
                msg += ` 🔹 [${i + 1}] ${name} » ${version.replace(/[\^~]/g, '')}\n`;
            });
            msg += `\n╰────── [ TOTAL: ${deps.length} ] ──────╯\n💡 استعمل 'تريم info [اسم]' لمعرفة الفئة.`;
            return api.sendMessage(msg, event.threadID);
        } catch (e) {
            return api.sendMessage("❌ [ERROR]: فشل في قراءة ملف package.json", event.threadID);
        }
    }

    // 4. التثبيت القسري (Install)
    if (action === "i" || action === "install") {
        if (!libName) return api.sendMessage("⚠️ [MISSING]: حدد اسم المكتبة للتثبيت.", event.threadID);
        api.sendMessage(`🛠️ [INSTALLING]: جاري تثبيت ${libName} بوضع التوافق القسري...`, event.threadID);
        
        exec(`npm install ${libName} --save --legacy-peer-deps --force`, (error) => {
            if (error) return api.sendMessage(`❌ [CRITICAL ERROR]:\n${error.message}`, event.threadID);
            api.sendMessage(`✅ [SUCCESS]: تم التثبيت. جاري إعادة تشغيل النظام...`, event.threadID, () => process.exit(1));
        });
    }

    // 5. تحديث المكتبات (Update)
    if (action === "update") {
        const target = libName || "";
        api.sendMessage(`🔄 [UPDATING]: جاري تحديث ${target || "كافة المكتبات"}...`, event.threadID);
        exec(`npm update ${target}`, (err) => {
            if (err) return api.sendMessage("❌ [FAILED]: فشل التحديث.", event.threadID);
            api.sendMessage("✅ [DONE]: اكتمل التحديث. إعادة تشغيل...", event.threadID, () => process.exit(1));
        });
    }

    // 6. الفحص الأمني (Audit)
    if (action === "audit") {
        api.sendMessage("🛡️ [SECURITY]: جاري فحص وإصلاح ثغرات المكتبات...", event.threadID);
        exec("npm audit fix", (err, stdout) => {
            if (err) return api.sendMessage("❌ [FAILED]: فشل الفحص الأمني.", event.threadID);
            api.sendMessage(`✅ [REPORT]:\n${stdout.slice(0, 500)}...`, event.threadID);
        });
    }

    // 7. إزالة مكتبة (Uninstall)
    if (action === "uninstall") {
        if (!libName) return api.sendMessage("⚠️ [MISSING]: حدد المكتبة المراد حذفها.", event.threadID);
        api.sendMessage(`🗑️ [REMOVING]: جاري إزالة ${libName}...`, event.threadID);
        exec(`npm uninstall ${libName}`, () => {
            api.sendMessage(`✅ [REMOVED]: تم الحذف. إعادة تشغيل...`, event.threadID, () => process.exit(1));
        });
    }

    // 8. تنظيف الكاش (Clean)
    if (action === "clean") {
        api.sendMessage("🧹 [CLEANING]: جاري مسح npm cache...", event.threadID);
        exec("npm cache clean --force", () => api.sendMessage("✨ [CLEAN]: تم تنظيف الذاكرة بنجاح!", event.threadID));
    }
};

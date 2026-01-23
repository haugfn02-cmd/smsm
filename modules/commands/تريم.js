const { exec } = require("child_process");
const fs = require("fs");

module.exports.config = {
    name: "تريم",
    version: "4.0.0",
    hasPermssion: 2,
    credits: "Gemini",
    description: "الإدارة الشاملة للمكتبات (تثبيت، حذف، تحديث، توافقية)",
    commandCategory: "المطور",
    usages: "تريم [install/uninstall/list/clean] [اسم_المكتبة]",
    cooldowns: 0
};

module.exports.run = async function({ api, event, args }) {
    // التحقق من هوية المطور
    const developerID = "61581906898524";
    if (event.senderID != developerID) {
        return api.sendMessage("⚠️ وصول غير مصرح. هذا الأمر مخصص للمطور صاحب المعرف 61581906898524 فقط.", event.threadID, event.messageID);
    }

    const action = args[0];
    const libName = args.slice(1).join(" ");

    // 1. عرض قائمة المكتبات المحسنة
    if (action === "list" || !action) {
        try {
            const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
            const deps = Object.entries(packageJson.dependencies || {});
            if (deps.length === 0) return api.sendMessage("📂 لا توجد مكتبات إضافية مثبتة حالياً.", event.threadID);

            let msg = "╭─── [ 📦 مستودع النظام ] ───╮\n\n";
            deps.forEach(([name, version], i) => {
                msg += `🔹 ${i + 1}. ${name} ➪ ${version.replace('^', '')}\n`;
            });
            msg += `\n╰────── [ إجمالي: ${deps.length} ] ──────╯\n\n💡 'تريم clean' لمسح الكاش.`;
            return api.sendMessage(msg, event.threadID, event.messageID);
        } catch (e) {
            return api.sendMessage("❌ خطأ في قراءة قاعدة البيانات.", event.threadID);
        }
    }

    // 2. تنظيف الكاش وتحسين الأداء
    if (action === "clean") {
        api.sendMessage("🧹 جاري تنظيف الكاش (npm cache clean)...", event.threadID);
        return exec("npm cache clean --force", (err) => {
            if (err) return api.sendMessage("❌ فشل التنظيف.", event.threadID);
            api.sendMessage("✨ تم تنظيف الكاش بنجاح!", event.threadID);
        });
    }

    // 3. التثبيت القسري والمتوافق (الميزة الجديدة)
    if (action === "install" || action === "i" || !["uninstall", "list", "clean"].includes(action)) {
        const target = action === "install" || action === "i" ? libName : args.join(" ");
        if (!target) return api.sendMessage("⚠️ حدد اسم المكتبة.", event.threadID);

        const waitMsg = `╭─── [ ⚡ جاري التثبيت ] ───╮\n` +
            `🛠️ المكتبة: ${target}\n` +
            `⚙️ الوضع: التثبيت القسري المتوافق\n` +
            `⏳ يرجى عدم إرسال أوامر أخرى...\n` +
            `╰──────────────────╯`;

        api.sendMessage(waitMsg, event.threadID, (err, info) => {
            // استخدام --legacy-peer-deps لحل مشاكل المكتبات القديمة
            // استخدام --force لضمان التثبيت حتى مع وجود تعارض
            exec(`npm install ${target} --save --legacy-peer-deps --force`, (error, stdout, stderr) => {
                if (error) {
                    return api.sendMessage(`❌ فشل التثبيت الحرج:\n${error.message}`, event.threadID);
                }

                const successMsg = `╭─── [ ✅ اكتمل التحديث ] ───╮\n` +
                    `📦 تم تثبيت: ${target}\n` +
                    `🔧 حالة النظام: مستقر\n` +
                    `🔄 الإجراء: إعادة تشغيل المحرك...\n` +
                    `╰──────────────────╯`;

                api.sendMessage(successMsg, event.threadID, () => process.exit(1));
            });
        });
    }

    // 4. الحذف
    if (action === "uninstall") {
        if (!libName) return api.sendMessage("⚠️ ما المكتبة التي تود حذفها؟", event.threadID);
        api.sendMessage(`🗑️ جاري إزالة ${libName}...`, event.threadID);
        exec(`npm uninstall ${libName}`, (error) => {
            if (error) return api.sendMessage(`❌ فشل الحذف.`, event.threadID);
            api.sendMessage(`✅ تم الحذف. إعادة تشغيل...`, event.threadID, () => process.exit(1));
        });
    }
};

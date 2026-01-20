module.exports.config = {
    name: "كايروس",
    version: "1.0.2",
    hasPermssion: 0,
    credits: "Kiros",
    description: "الدردشة مع بوت كايروس باللغة العربية الفصحى",
    commandCategory: "الدردشة",
    usages: "[النص]",
    cooldowns: 2
};

module.exports.run = async ({ api, event, args }) => {
    const axios = require("axios");
    const { threadID, messageID } = event;

    // جلب المفتاح من ملف config.json
    const apiKey = global.config.sim.APIKEY;

    if (!args[0]) return api.sendMessage("مرحباً بك! أنا كايروس، كيف يمكنني مساعدتك اليوم؟", threadID, messageID);

    const content = encodeURIComponent(args.join(" "));

    try {
        // تم استخدام الرمز lc=ar لضمان الرد باللغة العربية
        // ملاحظة: جودة "الفصحى" تعتمد على سيرفر الـ API نفسه
        const res = await axios.get(`https://api.simsimi.net/v2/?text=${content}&lc=ar&cf=false`);
        
        if (res.data.success) {
            // إضافة لمسة بسيطة للتأكد من أن الرد يبدو رسمياً إذا أردت
            let respond = res.data.success;
            return api.sendMessage(respond, threadID, messageID);
        } else {
            return api.sendMessage("عذراً، لم أستطع صياغة رد مناسب حالياً.", threadID, messageID);
        }

    } catch (err) {
        return api.sendMessage("⚠️ حدث خطأ في الاتصال بقاعدة بيانات كايروس، يرجى المحاولة لاحقاً.", threadID, messageID);
    }
};

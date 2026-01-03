module.exports.config = {
    name: "طرد_وهمي",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Gemini AI",
    description: "مزحة الطرد",
    commandCategory: "ترفيه",
    cooldowns: 10
};

module.exports.run = async ({ api, event }) => {
    const { threadID, messageID, senderID } = event;
    api.sendMessage("جاري فحص ملفك الشخصي... 🔍", threadID);
    
    setTimeout(() => {
        api.sendMessage("⚠️ تم العثور على فيروس في حسابك! سيتم طردك لحماية المجموعة بعد 3 ثوانٍ..", threadID);
        setTimeout(() => {
            api.sendMessage("أمزح معك! 😂 تعيش وتأكل غيرها.", threadID, messageID);
        }, 3000);
    }, 2000);
};

const axios = require('axios');
const moment = require('moment-timezone');

module.exports.config = {
    name: 'طقس',
    version: '1.2.0',
    hasPermssion: 0,
    credits: 'Mohammad Akash / تعديل Gemini',
    description: 'عرض حالة الطقس التفصيلية للمدن (رياح، رطوبة، رؤية)',
    commandCategory: 'خدمات',
    usages: 'طقس [اسم المدينة بالانجليزي]',
    cooldowns: 3
};

// نصائح عشوائية
const tips = [
    "☔ لا تنسَ أخذ مظلتك إذا كان الجو غائماً!",
    "💧 اشرب الكثير من الماء لتبقى رطباً.",
    "🌸 ابدأ يومك بابتسامة وتفاؤل.",
    "😎 خذ استراحة من الشاشة كل ساعة.",
    "🧘‍♂️ ممارسة الرياضة الصباحية تزيد من نشاطك.",
    "🌞 واقي الشمس مهم جداً في الأيام المشمسة!"
];

async function getWeather(city) {
    try {
        /* شرح الرموز المستخدمة في الرابط:
           %C = الحالة (مشمس، غائم)
           %t = درجة الحرارة
           %w = سرعة الرياح
           %h = الرطوبة
           %P = الضغط الجوي
           %V = مدى الرؤية
        */
        const res = await axios.get(`https://wttr.in/${city}?format=%C|%t|%w|%h|%V&lang=ar`);
        return res.data.split('|'); 
    } catch {
        return null;
    }
}

module.exports.run = async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const cityInput = args[0];

    if (!cityInput) return api.sendMessage("❌ يرجى كتابة اسم المدينة بالإنجليزية.\nمثال: /طقس khartoum", threadID, messageID);

    const city = cityInput.toLowerCase();

    api.sendMessage("🔍 جاري فحص الرادار وجلب البيانات...", threadID, async (err, info) => {
        
        const weatherData = await getWeather(city);
        
        if (!weatherData) {
            return api.editMessage("❌ تعذر العثور على بيانات لهذه المدينة. تأكد من كتابة الاسم بالإنجليزية بشكل صحيح.", info.messageID);
        }

        const [condition, temp, wind, humidity, visibility] = weatherData;
        const tip = tips[Math.floor(Math.random() * tips.length)];
        
        // توقيت السودان
        const now = moment().tz('Africa/Khartoum');
        const dateStr = now.format('YYYY / MM / DD');
        const timeStr = now.format('hh:mm A');

        const message = 
`🌡️ 「 **نشرة أحوال الطقس** 」 🌡️
━━━━━━━━━━━━━━━━━━
🌍 **المدينة:** ${city.toUpperCase()}
🌤️ **الحالة:** ${condition}
🌡️ **درجة الحرارة:** ${temp}

🌬️ **سرعة الرياح:** ${wind}
💧 **نسبة الرطوبة:** ${humidity}
👁️ **مدى الرؤية:** ${visibility}
━━━━━━━━━━━━━━━━━━
📅 **التاريخ:** ${dateStr}
🕒 **الوقت:** ${timeStr} (السودان)
💡 **نصيحة:** ${tip}
━━━━━━━━━━━━━━━━━━
🛠️ **المطور:** @61581906898524`;

        return api.editMessage(message, info.messageID);
    }, messageID);
};

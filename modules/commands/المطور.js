/**
 * @تحسين وتطوير: ᎠᎯᏁᎢᎬᏚᎮᎯᏒᎠᎯ
 * @النسخة: V7.0.0 [ULTRA]
 * @الوصف: كود عرض معلومات المطور والبوت بتنسيق فخم
 */

export const config = {
    name: "المطور",
    version: "7.0.0",
    hasPermssion: 0,
    credits: "sakran yt ",
    description: "عرض معلومات مطور نظام ڪايࢪوس",
    commandCategory: "النظام",
    usages: "",
    cooldowns: 5
};

export async function run({ api, event, Currencies }) {
    const { threadID, messageID } = event;

    // إعداد الرسالة بتنسيق الخطوط الرفيعة الذي اخترته
    const infoMessage = 
`  ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ 
         ✧ ڪايࢪوس | KYROS ✧
  ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ ┈ 

   𓏲 نـظـام الـتـشـغـيـل
   ⊹ الإصـدار: V7.0.0 [ULTRA]
   ⊹ الـبـريـفـكـس: /
   ⊹ الـخـوادم: نشط في المجموعات

   𓏲 الـعـقـل الـمـدبـر
   ⊹ الـمـصـمم: sakran 
   ⊹ الـعـمـر: 20 عاماً
   ⊹ الـمـكـانـة: الـقـائـد الأعلى

   𓏲 الـتـواصـل الـرسـمـي
   ⊹ انـسـتـقـرام:
   https://www.instagram.com/mustafa543092?igsh=bW1tdHVleWdkeTdm
   ⊹ فـيـسـبـوك:
   https://www.facebook.com/flstyn.hrh.57955

  — — — — — — — — — — — — — — — — 
    『 ڪايࢪوس: الـسـيـادة الـمـطـلـقـة 』`;

    // إرسال الرسالة مع صورة المطور إذا أردت (يمكنك وضع رابط صورتك هنا)
    return api.sendMessage({
        body: infoMessage,
    }, threadID, messageID);
}

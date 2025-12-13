const { Jimp } = require("jimp");
const fs = require("fs");

module.exports.config = {
  name: "خروفي",
  KJ: ["sheep"],
  Auth: 0,
  Owner: "Gry KJ",
  Info: "رد على حد لتخليه خروفك 🐑",
  Class: "✧༺قائمة_ترفية༻✧"
};

module.exports.onPick = async function({ event, sh, usersData }) {
  if (!event.messageReply && Object.keys(event.mentions).length === 0) {
    sh.reply("❌ رجاءً رد على شخص أو منشنه عشان نرسم خروفك!");
  } else {
    const target = event.messageReply?.senderID || Object.keys(event.mentions)[0];

    // قراءة الخلفية والصور
    const background = await Jimp.read("https://i.ibb.co/YThmPKSR/h2-Qh6-Jd-Wqf.jpg");
    const imageSender = await Jimp.read(await usersData.getAvatarUrl(event.senderID));
    const imageTarget = await Jimp.read(await usersData.getAvatarUrl(target));

    // تعديل حجم الصور وتحويلها لدائرة
    imageSender.resize(190, 190).circle();
    imageTarget.resize(190, 190).circle();

    // دمج الصور على الخلفية
    background.composite(imageSender, 150, 200); // صورة صاحب الأمر
    background.composite(imageTarget, 170, 430); // صورة الشخص المستهدف

    // حفظ الصورة وإرسالها
    const path = __dirname + "/cache/shhp.jpg";
    await background.writeAsync(path);
    sh.reply({ attachment: fs.createReadStream(path) });
  }
};

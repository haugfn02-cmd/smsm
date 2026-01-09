module.exports.config = {
  name: "من_انا",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ᎠᎯᎢᎬ ᏚᎮᎯᏒᎠᎯ",
  description: "لعبة تخمين الشخصيات",
  commandCategory: "ترفيه",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const characters = [
    { hints: ["مخترع المصباح الكهربائي", "أمريكي الجنسية"], answer: "توماس اديسون" },
    { hints: ["لاعب أرجنتيني", "لقبه البرغوث"], answer: "ميسي" },
    { hints: ["شخصية كرتونية صفراء تحت البحر"], answer: "سبونج بوب" },
    { hints: ["مؤسس شركة مايكروسوفت"], answer: "بيل جيتس" },
    { hints: ["رسول الله وخاتم الأنبياء"], answer: "محمد" },
    { hints: ["قائد مسلم فتح الأندلس"], answer: "طارق بن زياد" },
    { hints: ["عالم فيزياء صاحب نظرية النسبية"], answer: "اينشتاين" },
    { hints: ["مكتشف الجاذبية"], answer: "نيوتن" },
    { hints: ["لاعب برتغالي لقب بـ الدون"], answer: "رونالدو" },
    { hints: ["ملاكم عالمي لقب بـ الأعظم"], answer: "محمد علي كلاي" },
    { hints: ["صاحب شركة تسلا وسبيس إكس"], answer: "ايلون ماسك" },
    { hints: ["شخصية كرتونية تحب العسل"], answer: "ويني الدبدوب" },
    { hints: ["مؤسس موقع فيسبوك"], answer: "مارك زوكربيرج" },
    { hints: ["بطل فيلم تايتانك"], answer: "ليوناردو ديكابريو" },
    { hints: ["مخترع الهاتف"], answer: "غراهام بيل" },
    { hints: ["أول رجل مشى على القمر"], answer: "نيل ارمسترونغ" },
    { hints: ["فنان رسم لوحة الموناليزا"], answer: "ديفنشي" },
    { hints: ["رئيس راحل لقب بـ أسد الصحراء"], answer: "عمر المختار" },
    { hints: ["شخصية كرتونية سريعة جدا بلون أزرق"], answer: "سونيك" },
    { hints: ["طبيب وعالم عربي لقب بـ الشيخ الرئيس"], answer: "ابن سينا" }
  ];
  
  const char = characters[Math.floor(Math.random() * characters.length)];
  const msg = `لعبة من أنا؟\n\nتلميحات:\n- ${char.hints.join("\n- ")}\n\nحزر من هي الشخصية؟`;

  api.sendMessage(msg, event.threadID, (err, info) => {
    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      answer: char.answer
    });
  });
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  if (event.body.toLowerCase().includes(handleReply.answer.toLowerCase())) {
    api.sendMessage(`صح! الشخصية هي: ${handleReply.answer}`, event.threadID, event.messageID);
  }
};

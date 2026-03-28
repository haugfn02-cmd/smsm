const fs = require("fs");
const axios = require("axios");
const speech = require("@google-cloud/speech");

const client = new speech.SpeechClient({
  keyFilename: "google-key.json"
});

const games = {};

module.exports = {
  config: {
    name: "مافيا",
    version: "5.0",
    author: "ChatGPT ULTIMATE",
    role: 0,
    category: "ألعاب"
  },

  // ===== أوامر كتابية =====
  onStart: async function ({ api, event, args }) {
    const { threadID, senderID } = event;
    let game = games[threadID];
    const cmd = args[0];

    if (cmd === "بدء") {
      if (game) return api.sendMessage("⚠️ في لعبة شغالة", threadID);

      games[threadID] = {
        players: [],
        roles: {},
        alive: [],
        phase: "waiting",
        votes: {},
        actions: {},
        used: {},
        lovers: []
      };

      return api.sendMessage("🎮 بدأت لعبة المافيا\nاكتب (مافيا دخول)", threadID);
    }

    if (cmd === "دخول") {
      if (!game) return api.sendMessage("❌ لا توجد لعبة", threadID);

      if (game.players.includes(senderID))
        return api.sendMessage("⚠️ انت داخل", threadID);

      game.players.push(senderID);
      return api.sendMessage(`✅ انضممت (${game.players.length})`, threadID);
    }

    if (cmd === "انطلاق") {
      if (!game) return api.sendMessage("❌ لا توجد لعبة", threadID);
      if (game.players.length < 6)
        return api.sendMessage("⚠️ تحتاج 6 لاعبين", threadID);

      startGame(api, threadID);
    }

    if (cmd === "تصويت") {
      if (!game || game.phase !== "day")
        return api.sendMessage("❌ ليس وقت التصويت", threadID);

      const target = Object.keys(event.mentions)[0];
      if (!target) return api.sendMessage("⚠️ منشن لاعب", threadID);

      game.votes[target] = (game.votes[target] || 0) + 1;

      api.sendMessage("🗳️ تم التصويت", threadID);
    }
  },

  // ===== شات + صوت =====
  onChat: async function ({ api, event }) {
    const { threadID, senderID, attachments, messageReply } = event;
    const game = games[threadID];
    if (!game) return;

    // ===== 🎤 قراءة الصوت =====
    if (attachments && attachments[0]?.type === "audio") {
      try {
        const filePath = __dirname + "/voice.mp3";

        const res = await axios.get(attachments[0].url, {
          responseType: "arraybuffer"
        });

        fs.writeFileSync(filePath, res.data);

        const audioBytes = fs.readFileSync(filePath).toString("base64");

        const request = {
          audio: { content: audioBytes },
          config: {
            encoding: "MP3",
            languageCode: "ar-SA"
          }
        };

        const [response] = await client.recognize(request);
        const text = response.results
          .map(r => r.alternatives[0].transcript)
          .join(" ");

        api.sendMessage(`🎤 قلت: ${text}`, threadID);

        // أوامر صوتية
        if (text.includes("تصويت")) {
          api.sendMessage("🗳️ قل مع منشن الشخص", threadID);
        }

        if (text.includes("اقتل")) {
          api.sendMessage("🔪 رد على الهدف لتنفيذ القتل", threadID);
        }

        if (text.includes("انقذ")) {
          api.sendMessage("💊 رد على الهدف للإنقاذ", threadID);
        }

      } catch (e) {
        console.log(e);
        api.sendMessage("❌ فشل الصوت", threadID);
      }
    }

    // ===== 🌙 أوامر الليل =====
    if (game.phase === "night" && !event.isGroup) {
      const role = game.roles[senderID];
      const target = messageReply?.senderID;
      if (!target) return;

      if (role === "مافيا") game.actions.kill = target;

      if (role === "زعيم") game.actions.kill = target;

      if (role === "طبيب") game.actions.save = target;

      if (role === "شرطي") {
        const r = game.roles[target] || "مجهول";
        return api.sendMessage(`🔍 ${r}`, senderID);
      }

      if (role === "قناص" && !game.used[senderID]) {
        game.actions.snipe = target;
        game.used[senderID] = true;
      }

      if (role === "عاشق" && game.lovers.length === 0) {
        game.lovers = [senderID, target];
      }

      if (role === "ساحر" && !game.used[senderID]) {
        game.actions.reverse = true;
        game.used[senderID] = true;
      }

      if (role === "حارس") game.actions.guard = target;

      if (role === "جاسوس") {
        const mafia = Object.keys(game.roles).filter(id =>
          ["مافيا", "زعيم"].includes(game.roles[id])
        );
        return api.sendMessage(`👀 المافيا: ${mafia.join(", ")}`, senderID);
      }

      api.sendMessage("✅ تم تسجيل اختيارك", senderID);
    }
  }
};

// ===== تشغيل اللعبة =====

function startGame(api, threadID) {
  const game = games[threadID];

  game.alive = [...game.players];
  game.phase = "night";

  let roles = [
    "مافيا",
    "زعيم",
    "طبيب",
    "شرطي",
    "قناص",
    "عاشق",
    "ساحر",
    "حارس",
    "جاسوس"
  ];

  while (roles.length < game.players.length) roles.push("مواطن");

  roles.sort(() => Math.random() - 0.5);

  game.players.forEach((id, i) => {
    game.roles[id] = roles[i];
    api.sendMessage(`🎭 دورك: ${roles[i]}`, id);
  });

  api.sendMessage("🌙 بدأ الليل (30 ثانية)", threadID);

  setTimeout(() => resolveNight(api, threadID), 30000);
}

function resolveNight(api, threadID) {
  const game = games[threadID];

  let dead = [];
  let kill = game.actions.kill;

  if (kill && game.actions.guard === kill) kill = null;
  if (game.actions.reverse) kill = null;

  if (kill && game.actions.save !== kill) dead.push(kill);
  if (game.actions.snipe) dead.push(game.actions.snipe);

  dead = [...new Set(dead)];

  if (game.lovers.length === 2) {
    if (dead.includes(game.lovers[0])) dead.push(game.lovers[1]);
    if (dead.includes(game.lovers[1])) dead.push(game.lovers[0]);
  }

  dead.forEach(id => {
    if (game.roles[id] === "زعيم" && !game.used[id]) {
      game.used[id] = true;
      return;
    }
    game.alive = game.alive.filter(p => p !== id);
  });

  api.sendMessage(`☠️ مات ${dead.length} لاعب`, threadID);

  game.actions = {};
  checkWin(api, threadID);
  startDay(api, threadID);
}

function startDay(api, threadID) {
  const game = games[threadID];
  game.phase = "day";
  game.votes = {};

  api.sendMessage("☀️ النهار - صوتوا", threadID);

  setTimeout(() => endDay(api, threadID), 30000);
}

function endDay(api, threadID) {
  const game = games[threadID];

  let max = 0, target = null;

  for (let id in game.votes) {
    if (game.votes[id] > max) {
      max = game.votes[id];
      target = id;
    }
  }

  if (target) {
    game.alive = game.alive.filter(id => id !== target);
    api.sendMessage("🚫 تم طرد لاعب", threadID);
  }

  checkWin(api, threadID);
  startNight(api, threadID);
}

function startNight(api, threadID) {
  const game = games[threadID];
  game.phase = "night";

  api.sendMessage("🌙 ليل جديد", threadID);

  setTimeout(() => resolveNight(api, threadID), 30000);
}

function checkWin(api, threadID) {
  const game = games[threadID];

  const mafia = game.alive.filter(id =>
    ["مافيا", "زعيم"].includes(game.roles[id])
  );
  const others = game.alive.filter(id =>
    !["مافيا", "زعيم"].includes(game.roles[id])
  );

  if (mafia.length === 0) {
    api.sendMessage("🏆 فاز الشعب!", threadID);
    delete games[threadID];
  }

  if (mafia.length >= others.length) {
    api.sendMessage("🩸 فازت المافيا!", threadID);
    delete games[threadID];
  }
}

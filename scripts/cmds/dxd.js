const axios = require("axios");

module.exports = {
  config: {
    name: "overflow",
    aliases: [],
    version: "1.0",
    author: "MaHu BB'Y 😼",
    countDown: 5,
    role: 2,
    shortDescription: "Watch Overflow episodes",
    longDescription: "Stream all episodes of the 18+ anime 'Overflow'",
    category: "18+",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ message, event, api }) {
    try {
      const res = await axios.get("https://kawai-anime-mahi.vercel.app/anime/overflow");
      const data = res.data;

      if (!data || !data.episodes || data.episodes.length === 0)
        return message.reply("❌ No episodes found.");

      const episodes = data.episodes;

      let list = "🔞 𝗢𝘃𝗲𝗿𝗳𝗹𝗼𝘄 - 𝗘𝗽𝗶𝘀𝗼𝗱𝗲 𝗟𝗶𝘀𝘁\n";
      list += `📺 Total Episodes: ${episodes.length}\n\n`;

      episodes.forEach((ep, i) => {
        list += `▶️ ${i + 1}. ${ep.title || `Episode ${i + 1}`}\n`;
      });

      list += `\n💬 Reply with episode number (1-${episodes.length}) to stream.`;

      const msg = await message.reply(list);

      // Save episodes data to use later in onReply
      global.GoatBot.onReply.set(msg.messageID, {
        commandName: "overflow",
        author: event.senderID,
        episodes
      });

    } catch (err) {
      console.error(err);
      message.reply("❌ Error fetching episodes. Please try again later.");
    }
  },

  onReply: async function ({ event, api, command }) {
    try {
      const msgID = event.messageReply?.messageID || event.messageID;
      const replyData = global.GoatBot.onReply.get(msgID);

      if (!replyData) return; // No data saved for this reply

      if (event.senderID !== replyData.author) return; // Only original user can reply

      const episodes = replyData.episodes;
      const choice = parseInt(event.body);

      if (isNaN(choice) || choice < 1 || choice > episodes.length) {
        return api.sendMessage("❌ Invalid episode number.", event.threadID);
      }

      const selected = episodes[choice - 1];

      // Unsends the episode list message to clean chat
      api.unsendMessage(msgID);

      // Send selected episode video
      api.sendMessage({
        body: `▶️ 𝗘𝗽𝗶𝘀𝗼𝗱𝗲 ${choice} - ${selected.title || "Untitled"}\n\n🎥 Enjoy the show!`,
        attachment: await global.utils.getStreamFromURL(selected.url)
      }, event.threadID);

      // Remove stored reply data after use
      global.GoatBot.onReply.delete(msgID);

    } catch (error) {
      console.error(error);
      api.sendMessage("❌ Something went wrong handling your reply.", event.threadID);
    }
  }
};

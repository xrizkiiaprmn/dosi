import fetch from "node-fetch";
import os from "os-utils";
import moment from "moment";

async function sendWebhook(enableWebhook, webhookUrl, data) {
  if (!enableWebhook) return;

  await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: "Logs Bot - xrizkiiaprmn",
      avatar_url: "https://xrizkiiaprmn.my.id/167058779236111.jpg",
      embeds: [
        {
          title: "**DOSI AUTO CHECKIN & JOIN ADVENTURE**",
          color: 9161417,
          fields: [
            {
              name: "**ACCOUNT INFORMATION**",
              value: `<:arrow:1041677730044989500> Email : **${data[0]}**\n<:arrow:1041677730044989500> Account Level : ${data[1].level}\n<:arrow:1041677730044989500> NFT Collection : ${data[1].nftCount}\n<:arrow:1041677730044989500> Balance : ${data[2].amount} ${data[2].assetType}\n<:arrow:1041677730044989500> Adventure Count : ${data[3]}`,
            },
            {
              name: "SERVER INFORMATION",
              value: `<:arrow:1041677730044989500> Platform : ${os.platform()}\n<:arrow:1041677730044989500> Total RAM : ${Math.floor(
                os.totalmem()
              )} MB\n<:arrow:1041677730044989500> Free RAM : ${Math.floor(
                os.freemem()
              )} MB`,
            },
            {
              name: "LAST ACTIVITY",
              value: `<:arrow:1041677730044989500> ${moment()
                .parseZone(Date.now())
                .utcOffset(420)
                .format("LLLL")}`,
            },
          ],
          footer: {
            text: "code by xrizkiiaprmn",
            icon_url:
              "https://avatars.githubusercontent.com/u/97785521?s=400&u=c4f0bbd083066bbc8932f839b7515c09c97f1a63&v=4",
          },
        },
      ],
    }),
  })
    .then(() => console.info("Success send information account to webhook!"))
    .catch((err) => console.info(err));
}

export default sendWebhook;

import fetch from "node-fetch";

const webhookUrl = "discord-webhookUrl-here";

async function run() {
  await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: "Logs Bot",
      content: "Logs Dosi Account",
    }),
  })
    .then(() => console.info("success"))
    .catch((err) => console.info(err));
}

await run();

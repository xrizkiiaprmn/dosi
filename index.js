import fetch from "node-fetch";
import fs from "fs";
import os from "os-utils";
import moment from "moment";

class Dosi {
  baseUrl = "https://citizen.dosi.world/api/citizen/v1/";
  keyCookie = "DOSI_SES";
  enableWebhook = false;

  async sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  getConfiguration() {
    const configuration = fs.readFileSync("configuration.json", {
      encoding: "utf8",
    });
    return JSON.parse(configuration);
  }

  async fetching(pathUrl, session, method) {
    return fetch(`${this.baseUrl}${pathUrl}`, {
      method,
      headers: {
        cookie: `${this.keyCookie}=${session}`,
      },
      body: null,
    }).then(async (res) => res.json());
  }

  async getEmail(session) {
    return await this.fetching(
      "/login/status?loginFinishUri=https://citizen.dosi.world/auth/verify&logoutFinishUri=https://citizen.dosi.world/auth/logout",
      session,
      "GET"
    ).then((result) => result.email);
  }

  async getBalance(session) {
    return await this.fetching("balance", session, "GET");
  }

  async getAdventureId(session) {
    return await this.fetching("adventures", session, "GET").then(
      (result) => result.adventureList[0].id
    );
  }

  async getCountAdventure(session) {
    const adventureId = await this.getAdventureId(session);

    return await this.fetching(
      `adventures/${adventureId}`,
      session,
      "GET"
    ).then((result) => result.participation.currentCount);
  }

  async getMembership(session) {
    const email = await dosiBot.getEmail(session);
    const memberInfo = await this.fetching(`membership`, session, "GET");
    const balanceInfo = await this.getBalance(session);
    const adventureInfo = await this.getCountAdventure(session);

    return [email, memberInfo, balanceInfo, adventureInfo];
  }

  async getEvents(session) {
    return await this.fetching(`events`, session, "GET").then(
      (result) => result.eventList[0].isJoinable
    );
  }

  async checkIn(session) {
    return await this.fetching(`events/check-in`, session, "POST");
  }

  async getSmsAgreement(session) {
    return await this.fetching("check/sms-agreement", session, "GET").then(
      (res) => res.success
    );
  }

  async joinAdventure(session) {
    const adventureId = await this.getAdventureId(session);

    return await this.fetching(
      "adventures/" + adventureId + "/participation",
      session,
      "POST"
    );
  }

  async sendWebhook(webhookUrl, messageId, data) {
    if (!this.enableWebhook) return;

    await fetch(`${webhookUrl}/messages/${messageId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [
          {
            title: "**DOSI AUTO CHECKIN & JOIN ADVENTURE**",
            color: 9161417,
            fields: [
              {
                name: "**ACCOUNT INFORMATION**",
                value: `<:arrow:1041677730044989500> Email\t\t: **${data[0]}**\n<:arrow:1041677730044989500> Account Level\t: ${data[1].level}\n<:arrow:1041677730044989500> NFT Collection\t: ${data[1].nftCount}\n<:arrow:1041677730044989500> Balance\t\t: ${data[2].amount} ${data[2].assetType}\n<:arrow:1041677730044989500> Adventure Count\t\t: ${data[3]}`,
              },
              {
                name: "SERVER INFORMATION",
                value: `<:arrow:1041677730044989500> Platform\t: ${os.platform()}\n<:arrow:1041677730044989500> Total RAM\t: ${Math.floor(
                  os.totalmem()
                )} MB\n<:arrow:1041677730044989500> Free RAM\t: ${Math.floor(
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
    });
  }
}

const dosiBot = new Dosi();
const listConfiguration = dosiBot.getConfiguration();

console.info(
  "Dosi Auto Claim DON & Join Adventure by xrizkiiaprmn.\nrepo : https://github.com/xrizkiiaprmn/dosi"
);

while (true) {
  console.info(
    `\nDate\t: ${moment().parseZone(Date.now()).utcOffset(420).format("LLLL")}`
  );
  for (let i = 0; i < listConfiguration.length; i++) {
    const membership = await dosiBot.getMembership(
      listConfiguration[i].session
    );
    console.info(
      `\nYour Email\t: ${membership[0]}\nAccount level\t: ${membership[1].level}\nNFT Collection\t: ${membership[1].nftCount}\nBalance\t\t: ${membership[2].amount} ${membership[2].assetType}\nAdventure Count\t: ${membership[3]}`
    );
    await dosiBot.sendWebhook(
      listConfiguration[i].webhookUrl,
      listConfiguration[i].messageId,
      membership
    );

    const checkinStatus = await dosiBot.getEvents(listConfiguration[i].session);
    console.info(
      `Check In Status\t: ${checkinStatus ? "Tersedia" : "Tidak Tersedia"}`
    );

    if (checkinStatus) {
      console.info("Sedang Melakukan Check In...");
      while (true) {
        try {
          const checkIn = await dosiBot.checkIn(listConfiguration[i].session);
          checkIn.success
            ? console.info("Check In berhasil!")
            : console.info("Check In gagal!");

          const balance = await dosiBot.getBalance(
            listConfiguration[i].session
          );
          console.info(
            `Current Balance\t: ${balance.amount} ${balance.assetType}`
          );
          break;
        } catch (e) {
          continue;
        }
      }
    }

    while (true) {
      console.info("Sedang mencoba join adventure...");
      const checkSmsAgreement = await dosiBot.getSmsAgreement(
        listConfiguration[i].session
      );

      if (!checkSmsAgreement) {
        console.info("Gagal join adventure, sms verification is off!");
        break;
      }

      const tryJoinAdventure = await dosiBot.joinAdventure(
        listConfiguration[i].session
      );

      if (!tryJoinAdventure.currentCount) {
        console.info("Gagal join adventure, insufficient balance!");
        break;
      } else {
        console.info(
          `Berhasil join adventure! total participations : ${tryJoinAdventure.currentCount}`
        );

        const membership = await dosiBot.getMembership(
          listConfiguration[i].session
        );
        await dosiBot.sendWebhook(
          listConfiguration[i].webhookUrl,
          listConfiguration[i].messageId,
          membership
        );
      }
    }
  }

  console.info("\n=======================================");
  console.info("  Sukses, Cooldown 24 Jam, OK bro!!!");
  await dosiBot.sleep(86400000); // Sleep 24 Hours
}

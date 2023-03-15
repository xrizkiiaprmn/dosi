import fetch from "node-fetch";
import fs from "fs";
import moment from "moment";
import sendWebhook from "./senderWebhook.js";

class Dosi {
  constructor(enableWebhook, webhookUrl) {
    this.enableWebhook = enableWebhook;
    this.webhookUrl = webhookUrl;
  }

  baseUrl = "https://citizen.dosi.world/api/citizen/v1/";
  keyCookie = "DOSI_SES";

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

  async getAdventureId(session) {
    return await this.fetching("adventures", session, "GET").then(
      (result) => result.adventureList[0].id
    );
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
}

const getConfiguration = () => {
  const configuration = fs.readFileSync("configuration.json", {
    encoding: "utf8",
  });

  return JSON.parse(configuration);
};

let configuration = getConfiguration();
const { enableWebhook, webhookUrl, sessions } = configuration;
const dosiBot = new Dosi(enableWebhook, webhookUrl);

// Start Logs Automation
console.info(
  `#############################################################
#   Dosi Auto Claim DON & Join Adventure by xrizkiiaprmn.   #
#        Repo : https://github.com/xrizkiiaprmn/dosi        #
#############################################################`
);

while (true) {
  console.info(
    `\nDate\t: ${moment().parseZone(Date.now()).utcOffset(420).format("LLLL")}`
  );
  for (let i = 0; i < sessions.length; i++) {
    const membership = await dosiBot.getMembership(sessions[i]);
    console.info(
      `\nAccount email\t: ${membership[0]}\nAccount level\t: ${membership[1].level}\nNFT collection\t: ${membership[1].nftCount}\nBalance\t\t: ${membership[2].amount} ${membership[2].assetType}\nAdventure count\t: ${membership[3]}`
    );

    const checkinStatus = await dosiBot.getEvents(sessions[i]);
    console.info(
      `Check in status\t: ${checkinStatus ? "Available" : "Not available"}`
    );

    if (checkinStatus) {
      console.info("Doing check in...");
      while (true) {
        try {
          const checkIn = await dosiBot.checkIn(sessions[i]);
          checkIn.success
            ? console.info("Check in success!")
            : console.info("Check in failed!");

          const balance = await dosiBot.getBalance(sessions[i]);
          console.info(
            `Current balance\t: ${balance.amount} ${balance.assetType}`
          );
          break;
        } catch (e) {
          continue;
        }
      }
    }

    while (true) {
      console.info("Trying to join adventure...");
      const checkSmsAgreement = await dosiBot.getSmsAgreement(sessions[i]);

      if (!checkSmsAgreement) {
        console.info("Failed join adventure, sms verification is off!");
        break;
      }

      const tryJoinAdventure = await dosiBot.joinAdventure(sessions[i]);

      if (!tryJoinAdventure.currentCount) {
        console.info("Failed join adventure, insufficient balance!");

        const membership = await dosiBot.getMembership(sessions[i]);
        await sendWebhook(
          dosiBot.enableWebhook,
          dosiBot.webhookUrl,
          membership
        );
        break;
      } else {
        console.info(
          `Success join adventure! total participations : ${tryJoinAdventure.currentCount}`
        );

        const membership = await dosiBot.getMembership(sessions[i]);
        await sendWebhook(
          dosiBot.enableWebhook,
          dosiBot.webhookUrl,
          membership
        );
      }
    }
  }

  console.info("\n=======================================");
  console.info("Success, cooldown 24 hours, ok bro!!!");
  await dosiBot.sleep(86400000); // Sleep 24 Hours
}

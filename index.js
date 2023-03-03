import fetch from "node-fetch";
import fs from "fs";
import moment from "moment";

class Dosi {
  baseUrl = "https://citizen.dosi.world/api/citizen/v1/";
  keyCookie = "DOSI_SES";

  async sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  getSession() {
    const sessions = fs.readFileSync("sessions.txt", { encoding: "utf8" });
    return sessions.split("\r\n");
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

  async getMembership(session) {
    const memberInfo = await this.fetching(`membership`, session, "GET");
    const BalanceInfo = await this.getBalance(session);

    return [memberInfo, BalanceInfo];
  }

  async getEvents(session) {
    return await this.fetching(`events`, session, "GET").then(
      (result) => result.eventList[0].isJoinable
    );
  }
  async getEmail(session) {
    return await this.fetching("/login/status?loginFinishUri=https://citizen.dosi.world/auth/verify&logoutFinishUri=https://citizen.dosi.world/auth/logout", session, "GET").then(
      (result) => result.email
    );
  }
  async checkIn(session) {
    return await this.fetching(`events/check-in`, session, "POST");
  }

  async getBalance(session) {
    return await this.fetching("balance", session, "GET");
  }

  async getSmsAgreement(session) {
    return await this.fetching("check/sms-agreement", session, "GET").then(
      (res) => res.success
    );
  }

  async joinAdventure(session) {
    const Adv = await this.fetching("adventures/", session, "GET").then(
      (result) => result.adventureList[0].id
    );
    return await this.fetching("adventures/" + Adv + "/participation>
  }

  async fragmentFetching() {}
}

const dosiBot = new Dosi();
const sessions = dosiBot.getSession();

console.info(
  "Dosi Auto Claim DON & Join Adventure by xrizkiiaprmn.\nrepo : https://github.com/xrizkiiaprmn/dosi"
);

while (true) {
  console.info(`\nDate\t: ${moment().format("DD-MM-YYYY hh:mm:ss")}`);
  for (let i = 0; i < sessions.length; i++) {
    const membership = await dosiBot.getMembership(sessions[i]);
    console.info(
      `\nAccount level\t: ${membership[0].level}\nNFT Collection\t: ${membership[0].nftCount}\nBalance\t\t: ${membership[1].amount} ${membership[1].assetType}`
    );
    const email = await dosiBot.getEmail(sessions[i]);
    console.info(`Your Email\t: ${email}`
    );
    const checkinStatus = await dosiBot.getEvents(sessions[i]);
    console.info(
      `Check In Status\t: ${checkinStatus ? "Tersedia" : "Tidak Tersedia"}`
    );

    if (checkinStatus) {
      console.info("Sedang Melakukan Check In...");
      while (true) {
        try {
          const checkIn = await dosiBot.checkIn(sessions[i]);
          checkIn.success
            ? console.info("Check In berhasil!")
            : console.info("Check In gagal!");
          break;
        } catch (e) {
          continue;
        }
      }
    }

    const balance = await dosiBot.getBalance(sessions[i]);
    console.info(`Current Balance\t: ${balance.amount} ${balance.assetType}`);

    console.info("Sedang mencoba join adventure...");
    const checkSmsAgreement = await dosiBot.getSmsAgreement(sessions[i]);
    if (!checkSmsAgreement) {
      console.info("Gagal join adventure, sms verification is off!");
      continue;
    }

    const tryJoinAdventure = await dosiBot.joinAdventure(sessions[i]);
    if (!tryJoinAdventure.currentCount) {
      console.info("Gagal join adventure, insufficient balance!");
      continue;
    }

    console.info(
      `Berhasil join adventure! total participations : ${tryJoinAdventure.currentCount}`
    );
  }
  console.info("==================================");
  console.info("Sukses, Cooldown 24 Jam, OK bro!!");
  await dosiBot.sleep(86400000); // Sleep 24 Hours
}

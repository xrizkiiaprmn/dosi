import fetch from "node-fetch";
import fs from "fs";

class Dosi {
  baseUrl = "https://citizen.dosi.world/api/citizen/v1/";
  keyCookie = "DOSI_SES";

  async sleep(ms) {
    return new Promise((resolve, reject) => {
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
    return await this.fetching("adventures/21/participation", session, "POST");
  }
}

const dosiBot = new Dosi();
const sessions = dosiBot.getSession();

while (true) {
  for (let i = 0; i < sessions.length; i++) {
    const membership = await dosiBot.getMembership(sessions[i]);
    console.info(
      `\nAccount level\t: ${membership[0].level}\nNFT Collection\t: ${membership[0].nftCount}\nBalance\t\t: ${membership[1].amount} ${membership[1].assetType}`
    );
    const checkinStatus = await dosiBot.getEvents(sessions[i]);
    console.info(
      `Check In Status\t: ${checkinStatus ? "Tersedia" : "Tidak Tersedia"}`
    );

    if (!checkinStatus) {
      continue;
    }

    console.info("\nSedang Melakukan Check In...");
    const checkIn = await dosiBot.checkIn(sessions[i]);
    if (checkIn.success) {
      console.info("Check In berhasil!");
    } else {
      console.info("Check In gagal!");
    }

    const balance = await dosiBot.getBalance(sessions[i]);
    console.info(`Current Balance\t: ${balance.amount} ${balance.assetType}\n`);

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

  await dosiBot.sleep(86405000); // Sleep 24 Jam
}

import Fs from "fs";
import {LoginException, AddException, DeleteException, InternetException, BaseException} from "./exceptions";
import Functions from "./functions";

(async () => {
  const Puppeteer = await Functions.require("puppeteer");
  const Chalk = await Functions.require("chalk");

  const log = (s) => {
    console.log(`${s}`);
  };

  const warn = (s) => {
    console.log(`-x ${Chalk.yellow(s)}`);
  };

  let s, db = {};
  const headless = true;

  try {
    log('--> Yandex.Music Migrator <--');
    log(`- Starting up`);

    await Functions.writeDb(db);

    let browser = await Puppeteer.launch({headless});
    let page = await browser.newPage();
    let s_counter = 0;

    const vp = {width: 1024, height: 500};
    await page.setViewport(vp);

    log('- Logging in Profile 1');

    await Functions.login(page, db.login1, db.password1);

    log('- Getting music list');

    const {nickname, link} = await Functions.getLink(page);

    await page.goto(link, {waitUntil: "load"});

    const pageTemp = await browser.newPage();
    const response = await pageTemp.goto("https://music.yandex.ru/handlers/library.jsx?owner=" + nickname + "&filter=tracks&likeFilter=favorite&sort=&dir=&lang=ru&external-domain=music.yandex.ru&overembed=false", {waitUntil: "load"});
    let audiosObj = await response.json();
    let audiosArr = audiosObj.contestTracksIds;
    await pageTemp.close();
    await browser.close();

    log('- Reloggging in');

    browser = await Puppeteer.launch({headless});

    page = await browser.newPage();
    await page.setViewport(vp);

    await Functions.login(page, db.login2, db.password2);

    log('- Last preparations');

    let linkPage = await browser.newPage();
    await linkPage.setViewport(vp);
    await linkPage.goto("https://music.yandex.ru/search?text=%D0%B4%D0%B5%D1%80%D0%B5%D0%B2%D0%BD%D1%8F%20%D0%B4%D1%83%D1%80%D0%B0%D0%BA%D0%BE%D0%B2", {waitUntil: "load"});

    let token = "", num = "", i=0;
    await linkPage.setRequestInterception(true);
    linkPage.on("request", request => {
      if (request.method() === "POST" && token === "") {
        let s = request.postData();

        if (s.slice(0, 32) === "from=web-search-track-track-main") {
          log("> get token");

          i = 4;
          while (s[i - 4] !== "&" || s[i - 3] !== "s" || s[i - 2] !== "i" || s[i - 1] !== "g" || s[i] !== "n") {
            i++;
          }
          i += 2;

          while (s[i] !== "%") {
            token += s[i];
            i++;
          }
          token += ":";
          i += 3;
          while (s[i] !== "&") {
            token += s[i];
            num += s[i];
            i++;
          }
        }
      }

      request.continue();
    });

    s = ".deco-track-like";
    await linkPage.click(s);

    s = ".deco-buttonish-like-icon-pale";
    await linkPage.waitFor(s);

    s = ".deco-track-like";
    await linkPage.click(s);

    await linkPage.waitFor(5000);
    await linkPage.close();

    audiosArr = audiosArr.reverse();

    log('- Inserting music');

    Functions.musicAddCycle(audiosArr, audiosObj, 0, audiosArr.length - 1, browser);
  } catch (e) {

  }

})();


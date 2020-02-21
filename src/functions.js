const Cp = require('child_process');
const Fs = require(`fs`);

const log = (s) => {
  console.log(`${s}`);
};

export default class Functions {
  static musicAddCycle = (array, obj, now, end, browser) => {

    (async () => {
      let s = "";
      const addPage = await browser.newPage();
      const vp = {width: 1920, height: 1080};
      await addPage.setViewport(vp);
      await addPage.goto("https://music.yandex.ru/search?text=%D0%B4%D0%B5%D1%80%D0%B5%D0%B2%D0%BD%D1%8F%20%D0%B4%D1%83%D1%80%D0%B0%D0%BA%D0%BE%D0%B2", {waitUntil: "load"});

      s = ".deco-track-like";
      await addPage.waitFor(s);
      await addPage.setRequestInterception(true);

      let item = array[now];
      let folderName = item.id + ":" + item.albumId;
      let addLink = "https://music.yandex.ru/api/v2.1/handlers/track/" + folderName + "/web-search-track-track-main/like/add?__t=";

      console.log("> Track " + (now + 1));

      addPage.on("request", request => {
        if (request.method() === "POST" && request.postData() !== undefined) {
          let s = request.postData();

          if (s.slice(0, 32) === "from=web-search-track-track-main") {

            request.continue({url: addLink});
            console.log("- done");
          } else
            request.continue();
        } else

          request.continue();
      });

      s = ".deco-track-like";
      await addPage.click(s);
      await addPage.close().then(() => {
        if (now < end)
          this.musicAddCycle(array, obj, now + 1, end, browser);
        else {
          (async () => {
            await browser.close();
          })()
        }
      }, function (reason) {

      });
    })();


  };

  static getLink = async (page) => {
    try {
      let s = "";

      await page.goto("https://music.yandex.ru/home", {waitUntil: "load"});
      s = ".head__user-button";
      let elem = await page.$(s);
      let link = await (await elem.getProperty("href")).jsonValue();

      log(link);

      link = link.slice(0, -9);

      let nickname = "";
      let i = link.length - 2;

      while (link[i] !== "/") {
        nickname = link[i] + nickname;
        i--;
      }
      link = link + 'tracks';
      log(link);
      return {nickname, link};
    } catch (e) {
      log(e.message);
      return null;
    }
  };

  static login = async (page, login, password) => {
    let s = "";
    await page.goto("https://passport.yandex.ru/auth/add", {waitUntil: "load"});

    s = "#passp-field-login";
    await page.type(s, login);

    s = ".passp-sign-in-button>.passp-form-button";
    await page.click(s);
    log("> login inserted");

    s = "#passp-field-passwd";
    await page.waitFor(s);
    await page.type(s, password);

    s = "button.passp-form-button";
    await page.click(s);
    log("> pw inserted");

    s = "div[data-t=\"email_skip\"]>button";
    try {
      await page.waitFor(s, {timeout: 2000}).then(() => {
        page.evaluate((selector) => document.querySelector(selector).click(), s);
      });
      log("> Found email warning");
    } catch (e) {
      log("> No email warning");
    }

    s = "div[data-t=\"phone_skip\"] > button";
    try {
      await page.waitFor(s, {timeout: 2000}).then(() => {
        page.click('div[data-t="phone_skip"] > button');
      });
      log("> Found phone warning");
    } catch (e) {
      log("> No phone warning");
    }

    s = `div[data-t="phone_secure_skip"] button`;
    try {
      await page.waitFor(s, {timeout: 2000}).then(() => {
        page.click('div[data-t="phone_secure_skip"] button');
      });
      log("> Found phone warning 2");
    } catch (e) {
      log("> No phone warning 2");
    }
    s = "#track_id";
    await page.waitFor(s);
  };

  static log = (s) => {
    console.log(s);
  };

  static read = async () => {
    const Readline = await this.require(`readline`);
    const rl = Readline.createInterface(process.stdin, process.stdout);
    return new Promise((res) => {
      rl.question(`> `, function (answer) {
        res(answer);
        rl.close();
      });

    });
  };

  static readExp = async (rexp) => {
    let num = `!`;
    const regexp = new RegExp(rexp);
    while (num.match(regexp) == null) {
      num = await this.read();
    }

    return num;
  };

  static writeDb = async (db) => {
    this.log(`--> Old profile login`);
    db.login1 = await this.read();

    this.log(`--> Old profile password`);
    db.password1 = await this.read();

    this.log(`--> New profile login`);
    db.login2 = await this.read();

    this.log(`--> New profile password`);
    db.password2 = await this.read();
  };

  static rand = () => {
    return Math.floor(100 + Math.random() * 50);
  };

  static rand8 = () => {
    let t = Math.floor(1 + Math.random() * 10);
    if (t > 8)
      t = 4;

    return t;
  };

  static wClick = async (page, s, time = -1) => {
    if (time > 0)
      await page.waitFor(time);
    else
      await page.waitFor(s);
    await page.click(s);
  };

  static require = async (module) => {
    try {
      require.resolve(module);
    } catch (e) {
      console.log(`> Could not resolve ${module}. Installing...`);
      Cp.execSync(`npm install ${module}`);
      await setImmediate(() => {});
      console.log(`> "${module}" has been installed`);
    }

    try {
      return require(module);
    } catch (e) {
      console.log(`Could not include "${module}". Restart the script`);
      process.exit(1);
    }
  }
}

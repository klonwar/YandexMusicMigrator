/*
	* Если не работает page.click, то смотри page.evaluate
	  await page.evaluate((selector) => document.querySelector(selector).click(), "button.passp-form-button");

	*
*/

const puppeteer = require('puppeteer');

//Данные
const l1 = "",
    p1 = "",
    l2 = "",
    p2 = "";

function log(s) {
    console.log(s);
}


function musicAddCycle(array, obj, now, end, browser) {

    (async () => {
        let s;
        let addPage = await browser.newPage();
        await addPage.setViewport({width: 1920, height: 1080});
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
        await addPage.close().then(function () {
            if (now < end)
                musicAddCycle(array, obj, now + 1, end, browser);
            else {
                (async () => {
                    await browser.close();
                })()
            }
        }, function (reason) {

        });
    })();


}

//Начало работы

log('--* Yandex.Music Migrator *--');
log('- 1) Login in Profile 1');

(async () => {
    let browser = await puppeteer.launch({headless: true});
    let page = await browser.newPage();
    let s;
    let s_counter = 0;

    await page.setViewport({width: 1024, height: 500});

    /* Login to first profile */

    await page.goto("https://passport.yandex.ru/auth/add", {waitUntil: "load"});

    s = "#passp-field-login";
    await page.type(s, l1);

    s = ".passp-sign-in-button>.passp-form-button";
    await page.click(s);
    log("> login inserted");

    s = "#passp-field-passwd";
    await page.waitFor(s);
    await page.type(s, p1);

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

    s = "#passp-field-phoneNumber";
    try {
        await page.waitFor(s, {timeout: 2000}).then(() => {
            page.click('div[data-t="phone_skip"] > button');
        });
        log("> Found phone warning");
    } catch (e) {
        log("> No phone warning");
    }

    s = "#track_id";
    await page.waitFor(s);


    await page.screenshot({path: "screenshots/" + (++s_counter) + ".jpg"});

    /* Music founder */

    log('\n');
    log('- 2) Get music list');

    //Get nickname and link
    await page.goto("https://music.yandex.ru/home", {waitUntil: "load"});
    log("> get nickname");

    s = ".head__user-button";
    let elem = await page.$(s);
    let link = await (await elem.getProperty("href")).jsonValue();
    link = link.slice(0, -9);

    let nickname = "";
    let i = link.length - 2;

    while (link[i] !== "/") {
        nickname = link[i] + nickname;
        i--;
    }
    link = link + 'tracks';

    await page.goto(link, {waitUntil: "load"});
    log("> get list");
    await page.screenshot({path: "screenshots/" + (++s_counter) + ".jpg"});

    //Get all audios
    const pageTemp = await browser.newPage();
    const response = await pageTemp.goto("https://music.yandex.ru/handlers/library.jsx?owner=" + nickname + "&filter=tracks&likeFilter=favorite&sort=&dir=&lang=ru&external-domain=music.yandex.ru&overembed=false", {waitUntil: "load"});
    log("> save list");
    let audiosObj = await response.json();
    let audiosArr = audiosObj.contestTracksIds;
    await pageTemp.close();

    /* Relogin */

    log('\n');

    log('- 3) Relogin');

    s = ".head__userpic";
    await page.click(s);

    s = ".multi-auth__item_gray";
    await page.waitFor(s);
    await page.click(s);

    s = ".log-in";
    await page.waitFor(s);
    log("> logout");

    await browser.close();

    browser = await puppeteer.launch({headless: true});
    page = await browser.newPage();
    await page.setViewport({width: 1920, height: 1080});

    await page.goto("https://passport.yandex.ru/auth/add", {waitUntil: "load"});
    await page.screenshot({path: "screenshots/" + (++s_counter) + ".jpg"});
    log("> login page loaded");

    s = "#passp-field-login";
    await page.type(s, l2);

    s = ".passp-sign-in-button>.passp-form-button";
    await page.click(s);
    log("> login inserted");

    s = "#passp-field-passwd";
    await page.waitFor(s);
    await page.type(s, p2);

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

    s = "#passp-field-phoneNumber";
    try {
        await page.waitFor(s, {timeout: 2000}).then(() => {
            page.click('div[data-t="phone_skip"] > button');
        });
        log("> Found phone warning");
    } catch (e) {
        log("> No phone warning");
    }

    s = "#track_id";
    await page.waitFor(s);

    await page.screenshot({path: "screenshots/" + (++s_counter) + ".jpg"});

    /* Last preparations */

    log('\n');

    log('- 4) Last preparations');

    //Get page
    log("> get nickname");
    await page.goto("https://music.yandex.ru/home", {waitUntil: "load", timeout: 90000});

    s = ".head__user-button";
    elem = await page.$(s);
    link = await (await elem.getProperty("href")).jsonValue();
    link = link.slice(0, -9);

    nickname = "";
    i = link.length - 2;
    while (link[i] !== "/") {
        nickname = link[i] + nickname;
        i--;
    }

    link = link + 'tracks';

    await page.goto(link, {waitUntil: "load"});
    log("> page loaded");
    await page.screenshot({path: "screenshots/" + (++s_counter) + ".jpg"});

    //Get Token

    let linkPage = await browser.newPage();
    await linkPage.setViewport({width: 1920, height: 1080});
    await linkPage.goto("https://music.yandex.ru/search?text=%D0%B4%D0%B5%D1%80%D0%B5%D0%B2%D0%BD%D1%8F%20%D0%B4%D1%83%D1%80%D0%B0%D0%BA%D0%BE%D0%B2", {waitUntil: "load"});
    await linkPage.screenshot({path: "screenshots/" + (++s_counter) + ".jpg"});

    let token = "", num = "";
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

    //Insert all audios

    audiosArr = audiosArr.reverse();

    /* Insert music */

    log('\n');

    log('- 5) Insert music');


    musicAddCycle(audiosArr, audiosObj, 0, audiosArr.length - 1, browser);


})();


/* Данные */

var l1 = "", //Логин 1
	p1 = "", //Пароль 1
	l2 = "", //Логин 2
	p2 = "", //Пароль 2
	phone = "";

const puppeteer = require('puppeteer');

function musicAddCycle(array, obj, now, end, browser) {
	
	(async () => {
		var addPage = await browser.newPage();
		await addPage.setViewport({width: 1920, height: 1080});
		await addPage.goto("https://music.yandex.ru/search?text=%D0%B4%D0%B5%D1%80%D0%B5%D0%B2%D0%BD%D1%8F%20%D0%B4%D1%83%D1%80%D0%B0%D0%BA%D0%BE%D0%B2", {waitUntil: "load"});
		await addPage.waitFor(".deco-track-like");
		addPage.setRequestInterception(true);
		
		var item = array[now];
		var folderName = item.id + ":" + item.albumId;
		var addLink = "https://music.yandex.ru/api/v2.1/handlers/track/" + folderName + "/web-search-track-track-main/like/add?__t=";
		
		console.log("> Track "+(now+1));
		
		addPage.on("request", request => {
			if (request.method() === "POST" && request.postData() != undefined) {
				var s = request.postData();
				
				if (s.slice(0, 32) === "from=web-search-track-track-main") {
					
					request.continue({url: addLink});
					console.log("- done");
				}
				else
					request.continue();
			}
			else
			
			request.continue();
		});
		
		
		await addPage.click(".deco-track-like");
		await addPage.close().then(function (value) {
			if (now < end)
				musicAddCycle(array, obj, now+1, end, browser);
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
console.log('\033[2J');
console.log('--* Yandex.Music Migrator *--');
console.log('- 1) Login in Profile 1');

(async () => {
	var browser = await puppeteer.launch();
	var page = await browser.newPage();
	await page.setViewport({width: 1920, height: 1080});
	
	/* Login to first profile */
	
		await page.goto("https://passport.yandex.ru/auth/add", {waitUntil: "load"});
		console.log("> login page loaded");
	
		await page.type("#passp-field-login", l1);
		await page.click("button.passp-form-button");
		console.log("> login inserted");
		
		await page.waitFor("#passp-field-passwd");
		await page.type("#passp-field-passwd", p1);
		await page.click("button.passp-form-button");
		console.log("> pw inserted");	
		
		await page.waitFor("#track_id");
		if ((await page.$(".p-control__input_name_challenge")) != null) {
			await page.type(".p-control__input_name_challenge", phone);
			await page.click(".js-challenge-submit");
			await page.waitFor("#track_id");
		}
		await page.screenshot({path: "screenshots/login_end_screenshot.jpg"});
	
	/* Music founder */
		
		console.log('\033[2J');
		console.log('--* Yandex.Music Migrator *--');
		console.log('- 2) Get music list');
		
		//Get nickname and link
		await page.goto("https://music.yandex.ru/home", {waitUntil: "load"});
		console.log("> get nickname");	
		var elem = await page.$(".head__user-button");
		var link = await(await elem.getProperty("href")).jsonValue();
		link = link.slice(0, -9);
		
		var nickname = "";
		var i = link.length-2;
		var j = 0;
		
		while (link[i] != "/") {
			nickname = link[i] + nickname;
			i--;
		}
		link = link + 'tracks';

		await page.goto(link, {waitUntil: "load"});
		console.log("> get list");	
		await page.screenshot({path: "screenshots/tracks_screenshot.jpg"});
		
		//Get all audios
		const pageTemp = await browser.newPage();
		const response = await pageTemp.goto("https://music.yandex.ru/handlers/library.jsx?owner=" + nickname +"&filter=tracks&likeFilter=favorite&sort=&dir=&lang=ru&external-domain=music.yandex.ru&overembed=false", {waitUntil: "load"});
		console.log("> save list");
		var audiosObj = await response.json();
		var audiosArr = audiosObj.contestTracksIds;		
		await pageTemp.close();
		
	/* Relogin */
	
		console.log('\033[2J');
		console.log('--* Yandex.Music Migrator *--');
		console.log('- 3) Relogin');
		
		await page.click(".head__userpic");
		await page.waitFor(".multi-auth__item_gray");
		await page.click(".multi-auth__item_gray");
		await page.waitFor(".log-in");
		console.log("> logout");
		
		await browser.close();
		browser = await puppeteer.launch();
		page = await browser.newPage();
		await page.setViewport({width: 1920, height: 1080});
		
		await page.goto("https://passport.yandex.ru/auth/add", {waitUntil: "load"});
		await page.screenshot({path: "screenshots/login2_end_screenshot.jpg"});		
		console.log("> login page loaded");
		
		await page.type("#passp-field-login", l2);
		await page.click("button.passp-form-button");
		console.log("> login inserted");
		
		await page.waitFor("#passp-field-passwd");
		await page.type("#passp-field-passwd", p2);
		await page.click("button.passp-form-button");
		console.log("> pw inserted");
		await page.waitFor("#track_id");
		if ((await page.$(".p-control__input_name_challenge")) != null) {
			await page.type(".p-control__input_name_challenge", phone);
			await page.click(".js-challenge-submit");
			await page.waitFor("#track_id");
		}
		await page.screenshot({path: "screenshots/login2_end_screenshot.jpg"});
		
	/* Last preparations */

		console.log('\033[2J');
		console.log('--* Yandex.Music Migrator *--');
		console.log('- 4) Last preparations');
		
		//Get page
		console.log("> get nickname");
		await page.goto("https://music.yandex.ru/home", {waitUntil: "load", timeout: 90000});	
		elem = await page.$(".head__user-button");
		link = await(await elem.getProperty("href")).jsonValue();
		link = link.slice(0, -9);
		
		nickname = "";
		i = link.length-2;
		while (link[i] != "/") {
			nickname = link[i] + nickname;
			i--;
		}
		
		
		link = link + 'tracks';

		await page.goto(link, {waitUntil: "load"});
		console.log("> page loaded");	
		await page.screenshot({path: "screenshots/tracks2_screenshot.jpg"});
		
		//Get Token

		var linkPage = await browser.newPage();
		await linkPage.setViewport({width: 1920, height: 1080});
		await linkPage.goto("https://music.yandex.ru/search?text=%D0%B4%D0%B5%D1%80%D0%B5%D0%B2%D0%BD%D1%8F%20%D0%B4%D1%83%D1%80%D0%B0%D0%BA%D0%BE%D0%B2", {waitUntil: "load"});
		await linkPage.screenshot({path: "screenshots/tracks3_screenshot.jpg"});
		
		var token = "", num = "";
		linkPage.setRequestInterception(true);
		linkPage.on("request", request => {
			if (request.method() == "POST" && token === "") {
				var s = request.postData();
				
				if (s.slice(0, 32) === "from=web-search-track-track-main") {
					console.log("> get token");
					
					i=4;
					while (s[i-4] != "&" || s[i-3] != "s" || s[i-2] != "i" || s[i-1] != "g" || s[i] != "n") {
						i++;
					}
					i+=2;
					
					while (s[i] != "%") {
						token += s[i];
						i++;
					}
					token+=":";
					i+=3;
					while (s[i] != "&") {
						token += s[i];
						num += s[i];
						i++;
					}
				}
			}
					
			
			request.continue();
		});
		
		await linkPage.click(".deco-track-like");
		await linkPage.waitFor(".deco-buttonish-like-icon-pale");
		await linkPage.click(".deco-track-like");
		await linkPage.waitFor(5000);
		await linkPage.close();
		
		//Insert all audios
		
		audiosArr = audiosArr.reverse();

	/* Insert music */
			
		console.log('\033[2J');
		console.log('--* Yandex.Music Migrator *--');
		console.log('- 5) Insert music');
		
		
		
		musicAddCycle(audiosArr, audiosObj, 0, audiosArr.length-1, browser);
		
		
	
	
	
})();

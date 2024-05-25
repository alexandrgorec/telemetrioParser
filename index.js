const puppeteer = require('puppeteer');
const fs = require("fs");
const PathToSaveFile = "./1.csv";
fs.writeFileSync(PathToSaveFile, ""); // Очистить файл перед запуском, если не требуется - закомментируй
let categories = [
  ["business",                      0],           
  ["blogs",                         0],
  ["home-and-architecture",         0],
  ["other",                         0],
  ["food-and-drink",                0],
  ["prohibited-content",            0],
  ["healthy-lifestyle",             0],
  ["games",                         0],
  ["art-and-design",                0],
  ["picture",                       0],
  ["career",                        0],
  ["books",                         0],
  ["beauty",                        0],
  ["cryptocurrencies",              1],
  ["linguistics",                   0],
  ["marketing-and-pr",              0],
  ["medicine",                      0],
  ["motivation-and-quotes",         0],
  ["music",                         0],
  ["real-estate",                   0],
  ["news-and-media",                0],
  ["education",                     0],
  ["politics",                      0],
  ["nature-and-animals",            0],
  ["sales",                         0],
  ["psychology",                    0],
  ["travel",                        0],
  ["religion-and-spirituality",     0],
  ["family-and-children",           0],
  ["social-network",                0],
  ["sports",                        0],
  ["bets-and-casino",               0],
  ["technology-and-applications",   0],
  ["transport",                     0],
  ["facts",                         0],
  ["movies",                        0],
  ["economy-and-finance",           0],
  ["erotic",                        0],
  ["humor-and-entertainment",       0],
  ["telegram",                      0],
];

let url = {
  language: "en",
  region: "global",
  get categories() {
    let result = categories.filter( ([,value]) => value ).map( ([key]) => key );
    if (result.length)
      return (result.join(","));
    else
      return ("all");
  },
  page: 1,
  subscribersFilter: -1 ,    // для поиска с начала значение должно быть "-1"
  get full() {
    if (this.subscribersFilter === -1)
      return `https://telemetr.io/${this.language}/catalog/${this.region}?categories=${this.categories}&page=${this.page}`;
    else
      return `https://telemetr.io/${this.language}/catalog/${this.region}?categories=${this.categories}&page=${this.page}&subscribers=0,${this.subscribersFilter}`;
  }
}

let counterTr;
let ind = 1;

let selectors = {
  get channelName() { return `tr:nth-child(${counterTr}) td a[target=_blank]` },
  get channelLink() { return `tr:nth-child(${counterTr}) .channel-name__attribute` },
  get followers() { return `tr:nth-child(${counterTr}) td:nth-child(3)>span:nth-child(1)` },
  get checkUpDownFollowers() { return `tr:nth-child(${counterTr}) td:nth-child(4) .icon-carret-up-line` },  //  if === null then "-";  if !=null then "+"
  get followersChanging() { return `tr:nth-child(${counterTr}) td:nth-child(4)>span:nth-child(1)` },
  get postLookings() { return `tr:nth-child(${counterTr}) td:nth-child(5)>span:nth-child(1)` },
  get er() { return `tr:nth-child(${counterTr}) td:nth-child(6)>span:nth-child(1)` },
  get remember7d() { return `tr:nth-child(${counterTr}) td:nth-child(7) span:nth-child(1)` },
  get geo() { return `tr:nth-child(${counterTr}) td:nth-child(8)` },
  get category() { return `tr:nth-child(${counterTr}) td:nth-child(9)` },
  haveNextPage: ".pagination__button_active + .pagination__button", // inner.Text=='' then 'end'
};



(async () => {
  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(0);
  let end = false;
  let followers = 0;
  while (!end) { // Цикл по страницам
    counterTr = 1;
    await page.goto(url.full);

    while (true) { // цикл по строкам
      if ((await page.$(selectors.channelName)) === null) break;
      let stroka = [];
      stroka.push(`${ind++};`);
      stroka.push(await page.$eval(selectors.channelName, e => `${e.innerText};`));
      stroka.push(await page.$eval(selectors.channelLink, e => `${e.innerText};`));
      followers = await page.$eval(selectors.followers, e => e.innerText);
      stroka.push(`${followers};`);
      if (await page.$(selectors.checkUpDownFollowers) === null)
        stroka.push(await page.$eval(selectors.followersChanging, e => `'-' ${e.innerText};`));
      else
        stroka.push(await page.$eval(selectors.followersChanging, e => `'+' ${e.innerText};`));
      stroka.push(await page.$eval(selectors.postLookings, e => `${e.innerText};`));
      stroka.push(await page.$eval(selectors.er, e => `${e.innerText};`));
      stroka.push(await page.$eval(selectors.remember7d, e => `${e.innerText};`));
      stroka.push(await page.$eval(selectors.geo, e => `${e.innerText};`));
      stroka.push(await page.$eval(selectors.category, e => `${e.innerText};\n`));
      fs.appendFileSync(PathToSaveFile, stroka.join(""));
      counterTr++;
    }

    if ((await page.$(selectors.haveNextPage)) != null) {
      if ((await page.$eval(selectors.haveNextPage, e => e.innerText)) != '')
        url.page++;
      else {
        url.subscribersFilter = Number(followers.split(" ").join("")) - 1;
        url.page = 1;
      }
    }
    else
      end = true;
    console.log(ind - 1);
    // if (ind > 1000)              // принудительная остановка при достижении указанного количества
    //   end = true;

  }


  await browser.close();

})();
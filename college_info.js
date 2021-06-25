const puppeteer = require("puppeteer");
let xlsx = require("xlsx");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 13,
    defaultViewport: null,
    args: ["--start-maximized"],
  });

  let name = process.argv.slice(2)[0]; // slice bolta hai ki jo index dia hai usko include krte hue saari cheezien dedega
  console.log(name);

  const page = await browser.newPage();
  await page.goto("https://www.collegesearch.in/engineering-colleges-india");
  await page.waitForSelector(".form-control.search.inputPassword");
  await page.type(".form-control.search.inputPassword", name); //,{delay:300}
  let filterBtn = await page.$('.radio.radio-cs.radio-states[visible="true"]');
  await Promise.all([page.waitForNavigation(),filterBtn.click()]);

  let intermediateData = await page.evaluate(function () {
    let allColleges = document.querySelectorAll(".media-body.clg_head a");
    let colleges = [];
    let links = [];
    for (let i = 0; i < allColleges.length; i++) {
      colleges[i] = allColleges[i].innerText.trim();
      links[i] = allColleges[i].getAttribute("href");
    }

    return { colleges, links };
  });

  let data = [];
  //intermediate.Data.colleges.length ki jagah 1 islie kiya hai taaki 20 times loop na chale
     try{
  for (let i = 0; i < 10 && i < intermediateData.colleges.length; i++) {
     console.log(intermediateData.links[i]);
     let arr = await fetchDataFromCollegePage(intermediateData.links[i]);
     data.push(arr);
     
 }
}
catch{
  let newWB = xlsx.utils.book_new();
    let newWS = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(newWB, newWS, "first");
    xlsx.writeFile(newWB, "list.xlsx");
}
 console.log(data);

  function fetchDataFromCollegePage(collegePageUrl) {
    return new Promise(async function (resolve, reject) {
      try{
      await page.goto(collegePageUrl);
      await page.waitForSelector("a[title='Courses & Fees']");
      await Promise.all([
        page.waitForNavigation(),
        page.click("a[title='Courses & Fees']"),
      ]);
      let collegeInfo = await page.evaluate(function () {
        let collegeName = document.querySelector(".college-name h1").innerText;
        let branch = document.querySelector("#bachelor-of-technology h3").innerText;
        let totalFees = document.querySelector("#bachelor-of-technology .col-md-2.fees-course.pd0").innerText;
        let ranking = document.querySelector("#bachelor-of-technology .review-rate.mg0").innerText;
        parseFloat(ranking);
        let examAccepted = document.querySelector("#bachelor-of-technology .col-md-2.first-ros").innerText;

        let arr ={collegeName , branch , totalFees, ranking, examAccepted};
        return arr;
      });
      resolve(collegeInfo);
      }
      catch{
        reject();
      }
    });
  }
})();

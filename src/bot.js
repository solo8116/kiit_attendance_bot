const { XMLParser } = require("fast-xml-parser");
const puppeteer = require("puppeteer");
require("dotenv").config();
const { JSDOM } = require("jsdom");
const HtmlTableToJson = require("html-table-to-json");

const url = process.env.URL;
var attendance;

const bot = async (user,pass) => {
  try {
    const userId = user;
    const userPassword = pass;

    const browser = await puppeteer.launch({
      args: ["--disable-setuid-sandbox", "--no-sandbox", "--single-process", "--no-zygote"],
      executablePath:
        process.env.NODE_ENV == "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
    });
    const page = await browser.newPage();
    await page.goto(url);

    console.log("went to url");

    let username = await page.waitForSelector(
      `xpath///input[@id="logonuidfield"]`
    );

    await username.type(userId);

    console.log("typed username");

    let password = await page.waitForSelector(
      `xpath///input[@id="logonpassfield"]`
    );

    await password.type(userPassword);

    console.log("typed password");

    let submit = await page.waitForSelector(
      `xpath///input[@class="urBtnStdNew"]`
    );

    await submit.click();

    console.log("clicked submit");

    let selectAboveBtn = await page.waitForSelector(
      `xpath///td[@onclick="doMouseClick(1,1);return false;"]`
    );

    await selectAboveBtn.click();

    console.log("above button clicked");

    
    await new Promise((resolve, reject) => setTimeout(resolve, 1000));
    var iframeHandler = await page.$('iframe[name="Desktop Inner Page    "]');
    const serviceFrame = await iframeHandler.contentFrame();

    const studentSelfServiceLink = await serviceFrame.waitForSelector(
      `xpath///span[@class="urTxtStd" and @ct="TV" and contains(text(), "Student Self Service")]`
    );
    await studentSelfServiceLink.click();

    console.log("student self service clicked");

    const selectStudentAttendanceDetailsLink =
      await serviceFrame.waitForSelector(
        `xpath///span[@class="urTxtStd" and @ct="TV" and contains(text(), "Student Attendance Details")]`
      );
    await selectStudentAttendanceDetailsLink.click();

    console.log("student attendance details clicked");

    await new Promise((resolve, reject) => setTimeout(resolve, 1000));

    iframeHandler = await serviceFrame.$(
      'iframe[title="Student Attendance Details"]'
    );
    const attendanceFrame = await iframeHandler.contentFrame();

    let yearInput = await attendanceFrame.waitForSelector(
      `xpath///input[@style="width:13.2ex;"]`
    );

    await yearInput.click();

    console.log("year input");

    let year = await attendanceFrame.waitForSelector(
      `xpath///div[@data-itemvalue1="2023-2024"]`
    );

    await year.click();

    let sessionInput = await attendanceFrame.waitForSelector(
      `xpath///input[@style="width:25.3ex;"]`
    );

    await sessionInput.click();

    console.log("session clicked");
    
    let session = await attendanceFrame.waitForSelector(
      `xpath///div[@data-itemvalue1="Spring"]`
    );

    await session.click();
    await page.setRequestInterception(true);

    page.on("response", async (response) => {
      if (response.url().includes("-NEW")) {
        var xml = (await response.buffer()).toString();
        await attendanceParser(xml);
      }
    });

    page.on("request", async (request) => {
      request.continue();
    });

    let attendanceSubmit = await attendanceFrame.waitForSelector(
      `xpath///div[@lsdata="{0:'Submit',2:'EMPHASIZED'}"]`
    );

    console.log("submit btn clicked");

    await attendanceSubmit.click();
    await new Promise((resolve, reject) => setTimeout(resolve, 2000));
    await browser.close();
    return attendance;
  } catch (error) {
    throw error;
  }
};

const attendanceParser = async (xml) => {
  const parser = new XMLParser();
  let jObj = parser.parse(xml);
  const dom = new JSDOM(jObj.updates["full-update"]["content-update"]);
  const document = dom.window.document;
  const elements = document.getElementsByClassName(
    "urST urST3WhlBrd urST5SelColUiGeneric"
  );

  const jsonTables = HtmlTableToJson.parse(elements[0].innerHTML);
  attendance = jsonTables.results[0]
    .filter((ele) => {
      let val = ele.Subject;
      return val ? true : false;
    })
    .map((ele) => {
      let temp = ele;
      delete temp["1"];
      return temp;
    });
  await attendance.shift();
};


module.exports = bot;

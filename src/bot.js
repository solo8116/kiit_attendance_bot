const { XMLParser } = require("fast-xml-parser");
const puppeteer = require("puppeteer");
require("dotenv").config();
const { JSDOM } = require("jsdom");
const HtmlTableToJson = require("html-table-to-json");

const url = process.env.URL;
var attendance;

const bot = async () => {
  try {
    const userId = process.env.USER_NAME;
    const userPassword = process.env.USER_PASSWORD;

    const browser = await puppeteer.launch({
      args: ["--disable-setuid-sandbox", "--no-sandbox", "--single-process", "--no-zygote"],
      executablePath:
        process.env.NODE_ENV == "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
    });
    const page = await browser.newPage();
    await page.goto(url);

    let username = await page.waitForSelector(
      `xpath///input[@id="logonuidfield"]`
    );

    await username.type(userId);

    let password = await page.waitForSelector(
      `xpath///input[@id="logonpassfield"]`
    );

    await password.type(userPassword);

    let submit = await page.waitForSelector(
      `xpath///input[@class="urBtnStdNew"]`
    );

    await submit.click();

    let selectAboveBtn = await page.waitForSelector(
      `xpath///td[@onclick="doMouseClick(1,1);return false;"]`
    );

    await selectAboveBtn.click();
    await new Promise((resolve, reject) => setTimeout(resolve, 1000));
    var iframeHandler = await page.$('iframe[name="Desktop Inner Page    "]');
    const serviceFrame = await iframeHandler.contentFrame();

    const studentSelfServiceLink = await serviceFrame.waitForSelector(
      `xpath///span[@class="urTxtStd" and @ct="TV" and contains(text(), "Student Self Service")]`
    );
    await studentSelfServiceLink.click();

    const selectStudentAttendanceDetailsLink =
      await serviceFrame.waitForSelector(
        `xpath///span[@class="urTxtStd" and @ct="TV" and contains(text(), "Student Attendance Details")]`
      );
    await selectStudentAttendanceDetailsLink.click();

    await new Promise((resolve, reject) => setTimeout(resolve, 3000));

    iframeHandler = await serviceFrame.$(
      'iframe[title="Student Attendance Details"]'
    );
    const attendanceFrame = await iframeHandler.contentFrame();

    let yearInput = await attendanceFrame.waitForSelector(
      `xpath///input[@style="width:13.2ex;"]`
    );

    await yearInput.click();

    let year = await attendanceFrame.waitForSelector(
      `xpath///div[@data-itemvalue1="2023-2024"]`
    );

    await year.click();

    let sessionInput = await attendanceFrame.waitForSelector(
      `xpath///input[@style="width:25.3ex;"]`
    );

    await sessionInput.click();

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

    await attendanceSubmit.click();
    await new Promise((resolve, reject) => setTimeout(resolve, 2000));
    await browser.close();
    console.log(attendance);
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

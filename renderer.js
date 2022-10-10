const path = require("path");
const puppeteer = require("puppeteer");
const imagemin = require("imagemin");
const imageminPngquant = require("imagemin-pngquant");

const component = require.resolve("mathjax-full/es5/mml-svg.js");
const root = path.dirname(component);

// const PACKAGES = 'base, ams, newcommand, autoload, require';

//
//  The configuration to use for MathJax
//
const config =
  "MathJax = " +
  JSON.stringify({
    loader: {
      paths: {
        mathjax: `file://${root}`,
      },
    },
    // tex: {
    //   packages: PACKAGES.replace('\*', PACKAGES).split(/\s*,\s*/)
    // },
    svg: { fontCache: "global" },
  });

module.exports = {
  renderMath: async function (mml) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    }); // launch the browser
    try {
      const page = await browser.newPage(); // and get a new page.
      await page.goto(
        "file://" + path.join(__dirname, "export-latex-math.html"),
        { waitUntil: "networkidle2" }
      );
      await page.evaluate(`document.body.style.background = 'transparent'`);
      await page.addScriptTag({ content: config }); // configure MathJax
      await page.addScriptTag({ path: component }); // load the MathJax conponent
      await page.evaluate((mml, mode) => {
        // the following is performed in the browser...
        $("#content").html(mml);
        MathJax.typeset();
      }, mml);
      const svg = await page.$("svg");
      const data = await svg.screenshot();
      const compressedData = await imagemin.buffer(data, {
        plugins: [imageminPngquant()],
      });
      return compressedData;
    } catch (e) {
      console.error(e);
    } finally {
      browser.close();
    }
  },
};

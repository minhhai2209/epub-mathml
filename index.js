const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const { renderMath } = require("./renderer");

async function updateFile(filePath) {
  const data = fs.readFileSync(filePath, { encoding: "utf-8" });
  const $ = cheerio.load(data, { xmlMode: true });
  const maths = [];
  $("math").each(function (i, math) {
    maths.push(math);
  });
  for (let math of maths) {
    const mathContent = $.html(math);
    const buffer = await renderMath(mathContent);
    const base64 = buffer.toString("base64");
    const src = `data:image/png;base64,${base64}`;
    const img = $(`<img src="${src}"/>`);
    $(math).replaceWith(img);
  }
  fs.writeFileSync(filePath, $.html());
}

(async function () {
  const dir = path.join(__dirname, "book", "OEBPS");
  const fileNames = [];
  fs.readdirSync(dir).forEach((fileName) => {
    fileNames.push(fileName);
  });

  for (let fileName of fileNames) {
    if (fileName.endsWith(".xhtml")) {
      const filePath = path.join(dir, fileName);
      await updateFile(filePath);
    }
  }
})();

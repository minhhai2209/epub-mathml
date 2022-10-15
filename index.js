const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const { exec } = require("child_process");

const { renderMath } = require("./renderer");

const inputRoot = path.join(__dirname, "Books");
const outputRoot = path.join(__dirname, "output");

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
  fs.writeFileSync(filePath, $.html(), { encoding: "utf-8" });
}

async function renderMathML(bookTitle) {
  const dir = path.join(inputRoot, bookTitle, "OEBPS");
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
}

function getBookTitles() {
  const bookTitles = [];
  fs.readdirSync(inputRoot).forEach((fileName) => {
    bookTitles.push(fileName);
  });
  return bookTitles;
}

function createEpubFile(bookTitle) {
  const cwd = path.join(inputRoot, bookTitle);
  const epubPath = path.join(outputRoot, `${bookTitle}.epub`);
  const cmd = `zip -r "${epubPath}" *`;
  exec(cmd, { cwd }, (error, stdout, stderr) => {
    if (error) {
      console.error(error.message);
      return;
    }
    if (stderr) {
      console.error(stderr);
      return;
    }
    console.log(stdout);
  });
}

(async function () {
  const bookTitles = getBookTitles();
  for (let bookTitle of bookTitles) {
    console.log(bookTitle);
    await renderMathML(bookTitle);
    createEpubFile(bookTitle);
  }
})();

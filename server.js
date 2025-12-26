const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(express.urlencoded({ extended: true }));
app.use("/assets", express.static(path.join(__dirname, "assets")));

// ================= HOME PAGE =================
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>JobLing Image Generator</title>
  <style>
    body{
      font-family: Arial, sans-serif;
      background:#f2f2f2;
      display:flex;
      justify-content:center;
      align-items:center;
      height:100vh;
    }
    .card{
      background:#fff;
      padding:25px 30px;
      width:360px;
      border-radius:10px;
      box-shadow:0 10px 25px rgba(0,0,0,0.1);
    }
    h3{text-align:center;margin-bottom:20px}
    input,select,textarea,button{
      width:100%;
      padding:10px;
      margin-bottom:12px;
      border-radius:6px;
      border:1px solid #ccc;
      font-size:14px;
    }
    button{
      background:#1f7a4d;
      color:#fff;
      font-weight:bold;
      border:none;
      cursor:pointer;
    }
    button:hover{opacity:0.9}
  </style>
</head>

<body>
  <form class="card" method="POST" action="/generate">
    <h3>Poster Generator</h3>

    <select name="TYPE">
      <option value="job">Job</option>
      <option value="admit">Admit Card</option>
      <option value="result">Result</option>
    </select>

    <input name="TOP" placeholder="Top Title">
    <input name="SUB" placeholder="Subtitle">
    <input name="HIGHLIGHT" placeholder="Highlight (e.g. Graduate Level)">
    <textarea name="DATES" placeholder="Dates / Exam Date / Result Info"></textarea>

    <button type="submit">Create Image</button>
  </form>
</body>
</html>
  `);
});

// ================= GENERATE IMAGE =================
app.post("/generate", async (req, res) => {
  try {
    let html = fs.readFileSync("template.html", "utf8");

    let BTN = "Apply Now";
    if (req.body.TYPE === "admit") BTN = "Download Now";
    if (req.body.TYPE === "result") BTN = "Check Result";

    const data = {
      TOP: req.body.TOP || "",
      SUB: req.body.SUB || "",
      HIGHLIGHT: req.body.HIGHLIGHT || "",
      DATES: req.body.DATES || "",
      BTN
    };

    for (let k in data) {
      html = html.replace(new RegExp(`{{${k}}}`, "g"), data[k]);
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote"
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 720, deviceScaleFactor: 2 });

    // 🔥 IMPORTANT: base URL for assets
    await page.setContent(html, {
      waitUntil: "networkidle0",
      url: "http://localhost:" + PORT
    });

    const poster = await page.$(".poster");
    const buffer = await poster.screenshot({
      type: "webp",
      quality: 95
    });

    await browser.close();

    res.set("Content-Type", "image/webp");
    res.send(buffer);

  } catch (err) {
    console.error(err);
    res.status(500).send("Image generation failed");
  }
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log("✅ Running on port", PORT);
});

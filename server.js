const express = require("express");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.urlencoded({ extended: true }));

// ================= CTA LOGIC =================
function getCTA(eventType) {
  if (!eventType) return "View Details";

  if (eventType.includes("latest") || eventType.includes("apply"))
    return "Apply Now";
  if (eventType.includes("correction"))
    return "Correction Link";
  if (eventType.includes("admit"))
    return "Download Admit Card";
  if (eventType.includes("answer_key"))
    return "Download Answer Key";
  if (eventType.includes("result"))
    return "Check Result";
  if (eventType.includes("score"))
    return "Download Score Card";
  if (eventType.includes("merit"))
    return "View Merit List";
  if (eventType.includes("cut_off"))
    return "View Cut Off";
  if (eventType.includes("exam"))
    return "Check Notice";

  return "View Notice";
}

// ================= SAFE SLUGIFY =================
function slugify(text) {
  if (!text) return "job-poster";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\/|]+/g, "-")
    .replace(/[^a-z0-9\-]+/g, "")
    .replace(/\-+/g, "-")
    .replace(/^\-|\-$/g, "");
}

// ================= HOME PAGE =================
app.get("/", (req, res) => {
  res.send(`
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
    </style>
  </head>

  <body>
    <form class="card" method="POST" action="/generate">
      <h3>Poster Generator</h3>

      <select name="EVENT_TYPE" required>
        <option value="">-- Select Event Type --</option>
        <option value="latest_job">Latest Job</option>
        <option value="apply_date_extend">Apply Date Extend</option>
        <option value="correction">Form Correction</option>
        <option value="exam_date">Exam Date</option>
        <option value="exam_date_extend">Exam Date Extend</option>
        <option value="exam_city">Exam City</option>
        <option value="admit_card_notice">Admit Card Notice</option>
        <option value="admit_card">Admit Card</option>
        <option value="answer_key_notice">Answer Key Notice</option>
        <option value="answer_key">Answer Key</option>
        <option value="result_notice">Result Notice</option>
        <option value="result">Result</option>
        <option value="score_card">Score Card</option>
        <option value="merit_list">Merit List</option>
        <option value="cut_off">Cut Off</option>
      </select>

      <input name="TOP" placeholder="Top Title (English preferred)">
      <input name="SUB" placeholder="Subtitle (Exam / Form Name)">
      <input name="HIGHLIGHT" placeholder="Highlight (e.g. 7994 पद)">
      <textarea name="DATES" placeholder="Dates / Event Info"></textarea>

      <button type="submit">Create Image</button>
    </form>
  </body>
  </html>
  `);
});

// ================= GENERATE IMAGE =================
app.post("/generate", async (req, res) => {
  try {
    let html = fs.readFileSync(path.join(__dirname, "template.html"), "utf8");

    const eventType = req.body.EVENT_TYPE;
    const BTN = getCTA(eventType);

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
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 720, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "networkidle0" });

    const poster = await page.$(".poster");
    const buffer = await poster.screenshot({ type: "webp", quality: 95 });

    await browser.close();

    // ===== FILE NAME FIX (TOP based) =====
    const baseName = slugify(req.body.TOP);
    const fileName = `${baseName}-${eventType}.webp`;

    res.setHeader("Content-Type", "image/webp");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${fileName}`
    );

    res.send(buffer);

  } catch (err) {
    console.error(err);
    res.status(500).send("Poster generation failed");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});

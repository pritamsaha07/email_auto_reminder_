const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const axios = require("axios");
const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.get("/extract-excel", (req, res) => {
  try {
    const filePath = path.join(__dirname, "upload", "data.xlsx");

    if (!fs.existsSync(filePath)) {
      return res.status(404).send({ error: "File not found" });
    }

    const workbook = xlsx.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);

    res.status(200).send({
      message: "File processed successfully",
      data: sheetData,
    });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).send({ error: "Failed to process the file" });
  }
});
app.post("/send-reminder", async (req, res) => {
  try {
    const { email, eventName, eventDate } = req.body;

    const zapierWebhookUrl =
      "https://hooks.zapier.com/hooks/catch/21337207/2k68jqs/";

    const response = await axios.post(zapierWebhookUrl, {
      email,
      eventName,
      eventDate,
    });

    res.status(200).send({
      message: "Reminder sent successfully to Zapier!",
      zapierResponse: response.data,
    });
  } catch (error) {
    console.error("Error sending reminder:", error);
    res.status(500).send({ error: "Failed to send reminder to Zapier" });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;

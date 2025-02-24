const express = require("express");
const fs = require("fs");
const app = express();

app.use(express.json());

app.post("/subscribe", (req, res) => {
    let email = req.body.email;
    if (!email) return res.status(400).json({ error: "Email required" });

    let data = JSON.parse(fs.readFileSync("emails.json", "utf8") || "[]");
    data.push(email);
    fs.writeFileSync("emails.json", JSON.stringify(data, null, 2));

    res.json({ message: "Email berhasil disimpan!" });
});

app.listen(3000, () => console.log("Server running on port 3000"));

const fetch = require("node-fetch");
const cors = require("cors"); // Import library CORS

const GITHUB_REPO = "NyxObscura/emails";  
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 

module.exports = async (req, res) => {
    // Enable CORS
    cors()(req, res, async () => {
        if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email is required" });

        try {
            const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/emails.json`, {
                headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } 
            });

            if (!response.ok) throw new Error("Failed to fetch emails.json");

            const data = await response.json();
            const content = Buffer.from(data.content, "base64").toString("utf-8");
            const emails = JSON.parse(content);

            emails.push(email);

            const updateResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/emails.json`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: "Update emails.json",
                    content: Buffer.from(JSON.stringify(emails, null, 2)).toString("base64"),
                    sha: data.sha 
                })
            });

            if (!updateResponse.ok) throw new Error("Failed to update emails.json");

            res.json({ message: "Email berhasil disimpan!" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    });
};

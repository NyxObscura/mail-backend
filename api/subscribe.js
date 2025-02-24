const fetch = require("node-fetch");
const cors = require("cors"); 
const GITHUB_REPO = "NyxObscura/emails";  
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const API_KEY = process.env.APIKEY_A;

// In-memory storage untuk antispam
const requestTimestamps = new Map();
const SPAM_INTERVAL = 30000; // 30 detik

module.exports = async (req, res) => {
    // Enable CORS
    cors()(req, res, async () => {
        if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

        // **Cek API Key**
        const apiKey = req.headers["x-api-key"];
        if (!apiKey || apiKey !== API_KEY) {
            return res.status(403).json({ error: "Akses ditolak! API Key tidak valid." });
        }

        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email is required" });

        // Cek format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return res.status(400).json({ error: "Invalid email format!" });

        // Antispam: Cek jika request terlalu sering dari IP yang sama
        const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
        const lastRequestTime = requestTimestamps.get(ip);

        if (lastRequestTime && Date.now() - lastRequestTime < SPAM_INTERVAL) {
            return res.status(429).json({ error: "Terlalu banyak permintaan! Coba lagi nanti." });
        }

        requestTimestamps.set(ip, Date.now());

        try {
            const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/emails.json`, {
                headers: { Authorization: `Bearer ${GITHUB_TOKEN}` } 
            });

            if (!response.ok) throw new Error("Failed to fetch emails.json");

            const data = await response.json();
            const content = Buffer.from(data.content, "base64").toString("utf-8");
            const emails = JSON.parse(content);

            // Cek apakah email sudah ada dalam database
            if (emails.includes(email)) {
                return res.status(409).json({ error: "Email sudah ada dalam database!" });
            }

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

            res.json({ message: "Email berhasil dikirim!" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    });
};

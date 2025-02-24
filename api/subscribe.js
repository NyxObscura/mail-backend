const fetch = require("node-fetch");

const GITHUB_REPO = "NyxObscura/mail-backend";  // Ganti dengan repo kamu
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Simpan sebagai secret di Vercel

module.exports = async (req, res) => {
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    try {
        // 1. Ambil `emails.json` dari GitHub
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/emails.json`, {
            headers: { Authorization: `token ${GITHUB_TOKEN}` }
        });

        const data = await response.json();
        const content = Buffer.from(data.content, "base64").toString("utf-8");
        const emails = JSON.parse(content);

        // 2. Tambahkan email baru
        emails.push(email);

        // 3. Update `emails.json` di GitHub
        await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/emails.json`, {
            method: "PUT",
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "Update emails.json",
                content: Buffer.from(JSON.stringify(emails, null, 2)).toString("base64"),
                sha: data.sha // Diperlukan untuk update file
            })
        });

        res.json({ message: "Email berhasil disimpan!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

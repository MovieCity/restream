const express = require("express");
const axios = require("axios");
const app = express();
const PORT = 3000;

const SOURCE_BASE_URL = "http://cdns.jp-primehome.com:8000/zhongying/live/";
const QUERY_STRING = "?cid=cs18&isp=4";

// To handle the stream efficiently without lag
app.get("/stream/:file", async (req, res) => {
    const file = req.params.file;
    const targetUrl = SOURCE_BASE_URL + file + QUERY_STRING;

    try {
        // Fetch stream with "streaming" response type for better performance
        const response = await axios.get(targetUrl, {
            responseType: "stream",
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

        // Enable CORS
        res.set("Access-Control-Allow-Origin", "*");

        // If it's a playlist (.m3u8), rewrite it to point to our proxy
        if (file.endsWith(".m3u8")) {
            let data = "";
            response.data.on("data", chunk => data += chunk.toString());
            response.data.on("end", () => {
                const rewritten = data.replace(/(.*\.ts)/g, (match) => `/stream/${match}`);
                res.set("Content-Type", "application/vnd.apple.mpegurl");
                res.send(rewritten);
            });
        } else {
            // For .ts segments, stream them directly without waiting for all data
            res.set(response.headers);
            response.data.pipe(res);
        }

    } catch (err) {
        console.error("Stream error:", err.message);
        res.status(500).send("Failed to fetch stream.");
    }
});

// Default endpoint redirects to the playlist
app.get("/stream", (req, res) => {
    res.redirect("/stream/playlist.m3u8");
});

app.listen(PORT, () => {
    console.log(`Stream server running at http://localhost:${PORT}/stream`);
});

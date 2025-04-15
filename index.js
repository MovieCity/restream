const express = require("express");
const axios = require("axios");
const app = express();
const PORT = 3000;

const SOURCE_BASE_URL = "http://cdns.jp-primehome.com:8000/zhongying/live/";
const QUERY_STRING = "?cid=cs18&isp=4";

app.get("/stream/:file", async (req, res) => {
    const file = req.params.file;
    const targetUrl = SOURCE_BASE_URL + file + QUERY_STRING;

    try {
        const response = await axios.get(targetUrl, {
            responseType: "stream",
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

        res.set("Access-Control-Allow-Origin", "*"); // Always allow CORS

        if (file.endsWith(".m3u8")) {
            let data = "";
            response.data.on("data", chunk => data += chunk.toString());
            response.data.on("end", () => {
                const rewritten = data.replace(/(.*\.ts)/g, (match) => `/stream/${match}`);
                res.set("Content-Type", "application/vnd.apple.mpegurl");
                res.send(rewritten);
            });
        } else {
            res.set(response.headers);
            response.data.pipe(res);
        }
    } catch (err) {
        console.error("Fetch error:", err.message);
        res.status(500).send("Failed to fetch stream.");
    }
});

app.get("/stream", (req, res) => {
    res.redirect("/stream/playlist.m3u8");
});

app.listen(PORT, () => {
    console.log(`CORS-enabled stream ready at http://localhost:${PORT}/stream`);
});
          

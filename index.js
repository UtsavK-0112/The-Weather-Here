const express = require("express");
const nedb = require("nedb");
require("dotenv").config();

const app = express();
const PORT = 3001;

const db = new nedb({ filename: "datastore.db", autoload: true });
app.listen(PORT, () =>
    console.log(
        `Server running on port ${PORT}. Access website at http://localhost:${PORT}`
    )
);

app.use(express.static("public"));
app.use(express.json({ limit: "1mb" }));

app.get("/api", (request, response) => {
    response.json(db.getAllData());
});

app.post("/api", (request, response) => {
    const data = request.body;
    const timestamp = Date.now();
    data.timestamp = timestamp;

    console.log(data);

    db.insert(data);
    response.json(data);
});

app.get("/weather", async (request, response) => {
    const { latitude, longitude } = request.query;
    const fetch_response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${process.env.OPEN_WEATHER_API_KEY}`
    );

    if (fetch_response.status !== 200) {
        response.status(500).json({ error: "Weather API error" });
        return;
    }

    const json_data = await fetch_response.json();
    console.log(json_data);
    const weatherData = {
        suburb: json_data.name,
        temperature: json_data.main.temp,
        description: json_data.weather[0].main,
    };
    response.json(weatherData);
});

app.get("/aq", async (request, response) => {
    const latitude = Number(request.query.latitude);
    const longitude = Number(request.query.longitude);

    const fetch_response = await fetch(
        `https://api.openaq.org/v2/latest?coordinates=${latitude.toFixed(
            2
        )},${longitude.toFixed(2)}&radius=100000&limit=1`
    );

    if (fetch_response.status !== 200) {
        response.status(500).json({ error: "AQ API error" });
        return;
    }
    const json_data = await fetch_response.json();

    if (json_data.results.length === 0) {
        response.status(500).json({ error: "No data availible" });
        return;
    }

    const aq_data = {
        value: json_data.results[0].measurements[0].value,
        unit: json_data.results[0].measurements[0].unit,
        timestamp: new Date(
            json_data.results[0].measurements[0].lastUpdated
        ).valueOf(),
    };

    response.json(aq_data);
});

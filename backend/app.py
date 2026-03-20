from flask import Flask, jsonify, request
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

API_KEY = "3a8847835b137291511aac7dbe1bc628"


@app.route("/simulate-event")
def simulate_event():

    mode = request.args.get("mode", "real")

    # -------- REAL WEATHER --------
    if mode == "real":

        city = "Chennai"

        url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric"

        try:
            response = requests.get(url)
            data = response.json()

            temperature = data["main"]["temp"]
            weather = data["weather"][0]["main"]

            event = "No Disruption"
            payout = 0
            value = f"{temperature}°C"

            if temperature > 40:
                event = "Extreme Heat"
                payout = 300

            elif weather.lower() == "rain":
                event = "Heavy Rain"
                value = "Rain detected"
                payout = 500

            return jsonify({
                "mode": "Real Weather",
                "event": event,
                "value": value,
                "payout": payout
            })

        except Exception as e:
            return jsonify({
                "mode": "Real Weather",
                "event": "API Failure",
                "value": "Could not fetch weather",
                "payout": 0
            })


    # -------- MANUAL MODES --------

    elif mode == "heat":
        return jsonify({
            "mode": "Manual Simulation",
            "event": "Extreme Heat",
            "value": "44°C",
            "payout": 300
        })

    elif mode == "rain":
        return jsonify({
            "mode": "Manual Simulation",
            "event": "Heavy Rain",
            "value": "Rain detected",
            "payout": 500
        })

    elif mode == "pollution":
        return jsonify({
            "mode": "Manual Simulation",
            "event": "Severe Pollution",
            "value": "AQI 420",
            "payout": 250
        })

    else:
        return jsonify({
            "mode": "Unknown",
            "event": "Invalid Mode",
            "value": "-",
            "payout": 0
        })


if __name__ == "__main__":
    app.run(debug=True)
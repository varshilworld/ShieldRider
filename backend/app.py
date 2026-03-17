from flask import Flask, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

API_KEY = "3a8847835b137291511aac7dbe1bc628"        


@app.route("/simulate-event")

def simulate_event():

    city = "Chennai"

    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric"

    response = requests.get(url)

    data = response.json()

    temperature = data["main"]["temp"]
    weather = data["weather"][0]["main"]

    event = "Normal Conditions"
    payout = 0
    value = ""

    if temperature > 40:

        event = "Extreme Heat"
        value = f"{temperature}°C"
        payout = 300

    elif weather == "Rain":

        event = "Heavy Rain"
        value = "Rain detected"
        payout = 500

    else:

        event = "No Disruption"
        value = f"{temperature}°C"
        payout = 0

    return jsonify({

        "status": "Checked Real Weather Data",
        "event": event,
        "value": value,
        "payout": payout

    })


if __name__ == "__main__":
    app.run(debug=True)
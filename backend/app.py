from flask import Flask, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

@app.route("/simulate-event")
def simulate_event():

    events = [
        {"event": "Heavy Rain", "value": "65mm", "payout": 500},
        {"event": "Extreme Heat", "value": "44°C", "payout": 300},
        {"event": "Severe Pollution", "value": "AQI 420", "payout": 250}
    ]

    event = random.choice(events)

    return jsonify({
        "status": "Trigger Activated",
        "event": event["event"],
        "value": event["value"],
        "payout": event["payout"]
    })


if __name__ == "__main__":
    app.run(debug=True)
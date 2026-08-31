from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)

# Load model and scaler
model = joblib.load("canteen.joblib")
scaler = joblib.load("scaler.joblib")


@app.route("/")
def home():
    return jsonify({
        "message": "Canteen Demand Prediction API is running!"
    })


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json

        # Create input data
        input_data = pd.DataFrame([{
            "is_weekend": data["is_weekend"],
            "is_exam": data["is_exam"],
            "is_festival": data["is_festival"],
            "temperature": data["temperature"],
            "rainfall": data["rainfall"],
            "day_of_week": data["day_of_week"],
            "month": data["month"],
            "rolling_avg": data["rolling_avg"],
            "item_Biryani": data["item_Biryani"],
            "item_Chai": data["item_Chai"],
            "item_Dosa": data["item_Dosa"],
            "item_Samosa": data["item_Samosa"],
            "item_Sandwich": data["item_Sandwich"]
        }])

        # Scale input because Linear Regression was used
        input_scaled = scaler.transform(input_data)

        # Prediction
        prediction = model.predict(input_scaled)

        return jsonify({
            "prediction": round(float(prediction[0]), 2),
            "message": "Demand predicted successfully"
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 400


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
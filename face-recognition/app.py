from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import os
from deepface import DeepFace

app = Flask(__name__)
CORS(app)

@app.route('/verify', methods=['POST'])
def verify_face():
    try:
        data = request.json
        captured_path = data.get('captured_image')
        reference_path = data.get('reference_image')

        if not captured_path or not reference_path:
            return jsonify({"error": "Missing image paths"}), 400

        # DeepFace verification
        result = DeepFace.verify(img1_path=captured_path, img2_path=reference_path, enforce_detection=False)
        
        return jsonify({
            "verified": result["verified"],
            "distance": result["distance"],
            "threshold": result["threshold"]
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)

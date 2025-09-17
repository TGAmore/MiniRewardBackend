from flask import Flask, request, jsonify
import telebot
import json
import os

BOT_TOKEN = "7975535047:AAHdThrz6OieO-CCxBQnqVYMMXqk_Ff4Rfs"
ADMIN_ID = "5584938116"
bot = telebot.TeleBot(BOT_TOKEN)

DATA_FILE = "/tmp/users.json"

app = Flask(__name__)

def load_data():
    try:
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    except:
        return {"users": {}}

def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f)

data = load_data()

@app.route("/register", methods=["POST"])
def register():
    user_id = str(request.json["user_id"])
    referrer_id = request.json.get("referrer_id")
    if user_id not in data["users"]:
        data["users"][user_id] = {"balance":0, "referrals":0, "earnings":[], "referrer_id":referrer_id}
        if referrer_id and referrer_id in data["users"]:
            data["users"][referrer_id]["balance"] += 1
            data["users"][referrer_id]["referrals"] += 1
            data["users"][referrer_id]["earnings"].append({"source": f"Referral {user_id}", "amount":1})
        save_data(data)
    return jsonify({"status":"success"})

@app.route("/balance/<user_id>", methods=["GET"])
def balance(user_id):
    user_id = str(user_id)
    bal = data["users"].get(user_id, {}).get("balance", 0)
    return jsonify({"balance": bal})

@app.route("/watch_ad", methods=["POST"])
def watch_ad():
    user_id = str(request.json["user_id"])
    if user_id in data["users"]:
        data["users"][user_id]["balance"] += 1
        data["users"][user_id]["earnings"].append({"source": "Ad", "amount":1})
        save_data(data)
        return jsonify({"status":"success", "balance": data["users"][user_id]["balance"]})
    return jsonify({"status":"error"}), 404

@app.route("/withdraw", methods=["POST"])
def withdraw():
    user_id = str(request.json["user_id"])
    if user_id in data["users"]:
        balance = data["users"][user_id]["balance"]
        if balance <= 0:
            return jsonify({"status":"error","message":"رصيد غير كافي"}),400
        bot.send_message(ADMIN_ID,f"طلب سحب من المستخدم {user_id}\nالرصيد: {balance} نقطة")
        data["users"][user_id]["balance"] = 0
        save_data(data)
        return jsonify({"status":"success"})
    return jsonify({"status":"error"}),404

@app.route("/referral/<user_id>", methods=["GET"])
def referral(user_id):
    user_id = str(user_id)
    ref_count = data["users"].get(user_id, {}).get("referrals", 0)
    ref_link = f"https://t.me/MiniRewardBot?start={user_id}"
    return jsonify({"referrals": ref_count, "ref_link": ref_link})

import express from "express";
import bodyParser from "body-parser";
import { Pool } from "pg";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

// اتصال Neon DB
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = "5584938116";

// إنشاء الجداول عند أول تشغيل
(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT PRIMARY KEY,
      username TEXT,
      points INT DEFAULT 0,
      ads_watched INT DEFAULT 0,
      invites_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS withdraw_requests (
      id SERIAL PRIMARY KEY,
      user_id BIGINT REFERENCES users(id),
      amount NUMERIC,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS referrals (
      id SERIAL PRIMARY KEY,
      inviter_id BIGINT REFERENCES users(id),
      invited_id BIGINT REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
})();

// ✅ API إعلان مكتمل
app.post("/api/ad-complete", async (req,res)=>{
  const { userId, username, done } = req.body;
  if(!done) return res.status(400).json({error:"الإعلان لم يكتمل"});
  let user = await pool.query("SELECT * FROM users WHERE id=$1",[userId]);
  if(user.rows.length===0){
    await pool.query("INSERT INTO users(id, username) VALUES($1,$2)",[userId,username]);
  }
  await pool.query("UPDATE users SET points=points+10, ads_watched=ads_watched+1 WHERE id=$1",[userId]);
  res.json({success:true});
});

// ✅ API طلب سحب
app.post("/api/withdraw", async (req,res)=>{
  const { userId, amount } = req.body;
  const user = await pool.query("SELECT * FROM users WHERE id=$1",[userId]);
  if(user.rows.length===0) return res.status(400).json({error:"المستخدم غير موجود"});
  if(user.rows[0].ads_watched < 250) return res.status(400).json({error:"لا يمكنك السحب قبل مشاهدة 250 إعلان"});
  if(user.rows[0].points < 1000) return res.status(400).json({error:"الحد الأدنى للسحب هو 1 TON (1000 نقطة)"});
  await pool.query("INSERT INTO withdraw_requests(user_id, amount) VALUES($1,$2)",[userId,amount]);
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      chat_id:ADMIN_ID,
      text:`💳 طلب سحب جديد:\n👤 ${user.rows[0].username}\n🆔 ${userId}\n💰 ${amount} TON`
    })
  });
  res.json({success:true,message:"تم إرسال طلب السحب"});
});

// ✅ API دعوة
app.post("/api/referral", async (req,res)=>{
  const { inviterId, invitedId } = req.body;
  if(inviterId===invitedId) return res.status(400).json({error:"لا يمكنك دعوة نفسك"});
  await pool.query("INSERT INTO referrals(inviter_id, invited_id) VALUES($1,$2)",[inviterId,invitedId]);
  await pool.query("UPDATE users SET invites_count=invites_count+1, points=points+50 WHERE id=$1",[inviterId]);
  res.json({success:true});
});

// ✅ API بيانات المستخدم
app.get("/api/user/:id", async (req,res)=>{
  const { id } = req.params;
  const user = await pool.query("SELECT * FROM users WHERE id=$1",[id]);
  if(user.rows.length===0) return res.status(404).json({error:"المستخدم غير موجود"});
  res.json(user.rows[0]);
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log(`🚀 Server running on port ${PORT}`));

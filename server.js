const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2; // استيراد Cloudinary
const multer = require('multer'); // استيراد Multer

// استيراد الـ Model اللي عملناه
const GreenhouseData = require('./models/GreenhouseData');

dotenv.config();

const app = express();

// إعداد Cloudinary باستخدام المفاتيح من ملف .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// إعداد Multer لاستقبال الملفات (الصور)
// ده بيخلي Multer يخزن الملفات في الذاكرة مؤقتًا قبل ما نوديها Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.json()); // لاستقبال بيانات JSON
app.use(express.urlencoded({ extended: true })); // لاستقبال بيانات من الفورم (لو هنستخدمها)

// API Endpoint بسيط للتأكد من أن السيرفر شغال
app.get('/', (req, res) => {
  res.status(200).json({ message: "Greenhouse Backend API is running!" });
});

// *** API Endpoint لاستقبال البيانات والصور من الـ ESP32-CAM ***
app.post('/api/data', upload.single('image'), async (req, res) => {
  try {
    const { deviceId, temperature, humidity } = req.body; // البيانات النصية
    let imageUrl = null;
    let plantType = "Unknown"; // قيمة مبدئية
    let pestStatus = "Not analyzed yet"; // قيمة مبدئية
    let diseaseName = "None"; // قيمة مبدئية

    if (!deviceId || !temperature || !humidity) {
      return res.status(400).json({ message: 'Missing required sensor data (deviceId, temperature, humidity).' });
    }

    // 1. استقبال الصورة ورفعها لـ Cloudinary
    if (req.file) {
      // req.file.buffer بيحتوي على بيانات الصورة الخام
      // بنستخدم 'data:image/jpeg;base64,' عشان Cloudinary يعرف إنها صورة JPEG base64
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;

      const uploadResult = await cloudinary.uploader.upload(dataURI, {
        folder: `greenhouse_images/${deviceId}` // هتتخزن في مجلد خاص بالجهاز
      });
      imageUrl = uploadResult.secure_url; // ده رابط الصورة بعد رفعها
    }

    // 2. هنا هيتم استدعاء موديل الـ AI بتاعكم
    // (ده لسه هنكتبه بالتفصيل لما نربط بـ AI حقيقي)
    // حالياً هنفترض نتائج عشان نكمل بقية الكود
    if (imageUrl) {
      console.log(`Image uploaded to Cloudinary: ${imageUrl}`);
      // مثال: هنا هتعمل استدعاء لموديل الـ AI بتاعك
      // const aiResults = await callYourAIModel(imageUrl);
      // plantType = aiResults.plantType;
      // pestStatus = aiResults.pestStatus;
      // diseaseName = aiResults.diseaseName;

      // *************************************************************
      // مؤقتاً: نتائج وهمية للـ AI عشان نكمل الاختبار
      if (Math.random() > 0.5) { // 50% فرصة لإصابة
         plantType = "Tomato"; // مثال
         pestStatus = "Mild";
         diseaseName = "Early Blight";
      } else {
         plantType = "Basil"; // مثال
         pestStatus = "No pests detected";
         diseaseName = "None";
      }
      // *************************************************************

    }

    // 3. تحديث/إنشاء بيانات الجهاز في MongoDB
    const updatedData = await GreenhouseData.findOneAndUpdate(
      { deviceId: deviceId }, // البحث عن مستند بنفس deviceId
      {
        temperature,
        humidity,
        plantType,
        pestStatus,
        diseaseName,
        imageUrl,
        timestamp: new Date() // تحديث الوقت
      },
      { upsert: true, new: true, setDefaultsOnInsert: true } // upsert: true لو مش موجود اعمله، new: true رجعلي المستند الجديد
    );

    res.status(200).json({
      message: 'Data received and processed successfully!',
      data: updatedData
    });

  } catch (error) {
    console.error('Error processing data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// تعريف الـ Port اللي السيرفر هيشتغل عليه
const PORT = process.env.PORT || 5000;

// اتصال بقاعدة بيانات MongoDB
const DB_URL = process.env.MONGO_URI;

mongoose.connect(DB_URL)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((error) => console.error('MongoDB connection error:', error));

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
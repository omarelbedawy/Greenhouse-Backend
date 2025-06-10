const mongoose = require('mongoose');

const greenhouseDataSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true // كل جهاز هيكون ليه ID فريد
  },
  temperature: {
    type: Number,
    required: true
  },
  humidity: {
    type: Number,
    required: true
  },
  plantType: {
    type: String,
    required: false // ممكن تكون مش متاحة في الأول
  },
  pestStatus: {
    type: String, // "No pests detected", "Mild", "Severe"
    required: false
  },
  diseaseName: {
    type: String, // اسم المرض لو فيه
    required: false
  },
  imageUrl: {
    type: String, // رابط الصورة من Cloudinary
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now // التاريخ والوقت اللي البيانات دي جات فيه
  }
}, { timestamps: true }); // timestamps: true هتضيف createdAt و updatedAt تلقائيًا

const GreenhouseData = mongoose.model('GreenhouseData', greenhouseDataSchema);

module.exports = GreenhouseData;
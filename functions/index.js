const { onCall } = require('firebase-functions/v2/https');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 🔥 API ANAHTARINI BURAYA YAPIŞTIR 🔥
const API_KEY = 'BURAYA_ANAHTARINI_YAPISTIR';
const genAI = new GoogleGenerativeAI(API_KEY);

exports.generateDiet = onCall(async request => {
  // Telefondan gelen verileri al
  const { calories, protein } = request.data;

  try {
    // Senin hesabında çalışan model: gemini-2.0-flash
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `
      Sen bir diyetisyensin. Hedef: ${calories} kalori, ${protein} protein.
      Türkçe diyet listesi hazırla.
      Şu JSON formatında cevap ver:
      {
        "breakfast": "...",
        "lunch": "...",
        "dinner": "...",
        "snacks": "..."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Sonucu telefona geri gönder (JSON olarak)
    return JSON.parse(text);
  } catch (error) {
    console.error('AI Hatası:', error);
    // Hata olursa telefona hatayı bildir
    throw new Error('Yapay zeka işlemi başarısız: ' + error.message);
  }
});

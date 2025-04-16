// بوت التداول للإطارات الزمنية القصيرة (دقيقة واحدة أو 5 دقائق)
class TradingBot {
  constructor(config = {}) {
    // إعدادات افتراضية
    this.config = {
      timeframe: config.timeframe || '1m', // الإطار الزمني: 1m أو 5m
      rsiPeriod: config.rsiPeriod || 14,   // فترة مؤشر RSI
      rsiOverbought: config.rsiOverbought || 70, // مستوى ذروة الشراء
      rsiOversold: config.rsiOversold || 30,     // مستوى ذروة البيع
      fastEMA: config.fastEMA || 12,       // المتوسط المتحرك السريع
      slowEMA: config.slowEMA || 26,       // المتوسط المتحرك البطيء
      signalPeriod: config.signalPeriod || 9, // فترة الإشارة للماكد
      smaLength: config.smaLength || 20,   // طول المتوسط المتحرك البسيط
    };
    
    // حالة البوت
    this.state = {
      lastSignal: null, // آخر إشارة تم توليدها (buy/sell)
      position: null,   // المركز الحالي (long/short/null)
      candleData: [],   // بيانات الشموع
    };
  }
  
  // دالة لإضافة بيانات شمعة جديدة
  addCandle(candle) {
    // إضافة شمعة جديدة للبيانات
    this.state.candleData.push(candle);
    
    // حفظ فقط آخر 100 شمعة للأداء
    if (this.state.candleData.length > 100) {
      this.state.candleData = this.state.candleData.slice(-100);
    }
    
    // توليد إشارة بناءً على البيانات الجديدة
    return this.generateSignal();
  }
  
  // حساب المتوسط المتحرك البسيط
  calculateSMA(period) {
    if (this.state.candleData.length < period) return null;
    
    const prices = this.state.candleData
      .slice(-period)
      .map(candle => candle.close);
      
    const sum = prices.reduce((total, price) => total + price, 0);
    return sum / period;
  }
  
  // حساب المتوسط المتحرك الأسي
  calculateEMA(period) {
    if (this.state.candleData.length < period) return null;
    
    const prices = this.state.candleData.map(candle => candle.close);
    const k = 2 / (period + 1);
    
    // البدء بالمتوسط البسيط كقيمة أولية
    let ema = prices.slice(0, period).reduce((total, price) => total + price, 0) / period;
    
    // حساب EMA للقيم المتبقية
    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    
    return ema;
  }
  
  // حساب مؤشر القوة النسبية RSI
  calculateRSI() {
    const period = this.config.rsiPeriod;
    if (this.state.candleData.length < period + 1) return null;
    
    const prices = this.state.candleData.map(candle => candle.close);
    let gains = 0;
    let losses = 0;
    
    // حساب المكاسب والخسائر الأولية
    for (let i = 1; i <= period; i++) {
      const change = prices[prices.length - i] - prices[prices.length - i - 1];
      if (change >= 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }
    
    // حساب متوسط المكاسب والخسائر
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    // تجنب القسمة على صفر
    if (avgLoss === 0) return 100;
    
    // حساب RS و RSI
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    return rsi;
  }
  
  // حساب مؤشر الماكد MACD
  calculateMACD() {
    const fastEMA = this.calculateEMA(this.config.fastEMA);
    const slowEMA = this.calculateEMA(this.config.slowEMA);
    
    if (fastEMA === null || slowEMA === null) return null;
    
    // حساب خط الماكد
    const macdLine = fastEMA - slowEMA;
    
    // للبساطة، نستخدم متوسط بسيط لخط الإشارة بدلاً من EMA
    // في تطبيق حقيقي، يجب استخدام EMA لخط الإشارة
    const signalPeriod = this.config.signalPeriod;
    let signalLine = null;
    
    // نحتاج إلى تخزين سلسلة MACD السابقة للحساب الدقيق
    // هذا مبسط لغرض التوضيح
    if (this.state.candleData.length >= this.config.slowEMA + signalPeriod) {
      signalLine = macdLine; // تبسيط
    }
    
    return {
      macdLine,
      signalLine,
      histogram: signalLine ? macdLine - signalLine : null
    };
  }
  
  // توليد إشارة تداول
  generateSignal() {
    // التأكد من وجود بيانات كافية
    if (this.state.candleData.length < Math.max(this.config.slowEMA, this.config.rsiPeriod, this.config.smaLength)) {
      return {
        signal: null,
        reason: "لا توجد بيانات كافية",
        indicators: {}
      };
    }
    
    // حساب المؤشرات
    const currentPrice = this.state.candleData[this.state.candleData.length - 1].close;
    const sma = this.calculateSMA(this.config.smaLength);
    const rsi = this.calculateRSI();
    const macd = this.calculateMACD();
    
    // تجميع تقييم المؤشرات
    let signalStrength = 0;
    const reasons = [];
    
    // تقييم المتوسط المتحرك
    if (sma !== null) {
      if (currentPrice > sma) {
        signalStrength += 1; // إشارة إيجابية - السعر فوق المتوسط
        reasons.push("السعر أعلى من المتوسط المتحرك البسيط");
      } else if (currentPrice < sma) {
        signalStrength -= 1; // إشارة سلبية - السعر تحت المتوسط
        reasons.push("السعر أقل من المتوسط المتحرك البسيط");
      }
    }
    
    // تقييم RSI
    if (rsi !== null) {
      if (rsi < this.config.rsiOversold) {
        signalStrength += 2; // إشارة شراء قوية - ذروة بيع
        reasons.push(`مؤشر RSI في منطقة ذروة البيع (${rsi.toFixed(2)})`);
      } else if (rsi > this.config.rsiOverbought) {
        signalStrength -= 2; // إشارة بيع قوية - ذروة شراء
        reasons.push(`مؤشر RSI في منطقة ذروة الشراء (${rsi.toFixed(2)})`);
      }
    }
    
    // تقييم MACD
    if (macd && macd.macdLine !== null && macd.signalLine !== null) {
      if (macd.macdLine > macd.signalLine) {
        signalStrength += 1.5; // إشارة إيجابية - تقاطع ماكد إيجابي
        reasons.push("تقاطع إيجابي لمؤشر MACD");
      } else if (macd.macdLine < macd.signalLine) {
        signalStrength -= 1.5; // إشارة سلبية - تقاطع ماكد سلبي
        reasons.push("تقاطع سلبي لمؤشر MACD");
      }
    }
    
    // تحديد الإشارة النهائية
    let signal = null;
    if (signalStrength >= 2) {
      signal = "شراء";
    } else if (signalStrength <= -2) {
      signal = "بيع";
    } else {
      signal = "انتظار";
    }
    
    // تحديث حالة البوت
    this.state.lastSignal = signal;
    
    // إعداد نتيجة التحليل
    return {
      timestamp: new Date().toISOString(),
      timeframe: this.config.timeframe,
      price: currentPrice,
      signal: signal,
      signalStrength: signalStrength,
      reasons: reasons,
      indicators: {
        sma: sma ? sma.toFixed(2) : null,
        rsi: rsi ? rsi.toFixed(2) : null,
        macd: macd ? {
          macdLine: macd.macdLine ? macd.macdLine.toFixed(4) : null,
          signalLine: macd.signalLine ? macd.signalLine.toFixed(4) : null,
          histogram: macd.histogram ? macd.histogram.toFixed(4) : null
        } : null
      }
    };
  }
}

// مثال على استخدام البوت مع بيانات افتراضية
function runTradingBotDemo() {
  // إنشاء بوت جديد للإطار الزمني دقيقة واحدة
  const bot = new TradingBot({
    timeframe: '1m',
    rsiPeriod: 14,
    rsiOverbought: 70,
    rsiOversold: 30
  });
  
  // بيانات شموع افتراضية للاختبار - في الواقع سيتم استلامها من API منصة التداول
  const demoCandles = [
    { time: '2025-04-16T10:01:00', open: 100, high: 102, low: 99, close: 101, volume: 1000 },
    { time: '2025-04-16T10:02:00', open: 101, high: 103, low: 100, close: 102, volume: 1200 },
    { time: '2025-04-16T10:03:00', open: 102, high: 104, low: 101, close: 103, volume: 1100 },
    { time: '2025-04-16T10:04:00', open: 103, high: 104, low: 102, close: 104, volume: 900 },
    { time: '2025-04-16T10:05:00', open: 104, high: 106, low: 103, close: 105, volume: 1500 },
    { time: '2025-04-16T10:06:00', open: 105, high: 107, low: 104, close: 106, volume: 1400 },
    { time: '2025-04-16T10:07:00', open: 106, high: 108, low: 105, close: 107, volume: 1300 },
    { time: '2025-04-16T10:08:00', open: 107, high: 109, low: 106, close: 108, volume: 1600 },
    { time: '2025-04-16T10:09:00', open: 108, high: 110, low: 107, close: 109, volume: 1800 },
    { time: '2025-04-16T10:10:00', open: 109, high: 111, low: 108, close: 110, volume: 2000 },
    { time: '2025-04-16T10:11:00', open: 110, high: 112, low: 109, close: 111, volume: 2200 },
    { time: '2025-04-16T10:12:00', open: 111, high: 113, low: 110, close: 112, volume: 2100 },
    { time: '2025-04-16T10:13:00', open: 112, high: 114, low: 111, close: 113, volume: 2300 },
    { time: '2025-04-16T10:14:00', open: 113, high: 115, low: 112, close: 114, volume: 2400 },
    { time: '2025-04-16T10:15:00', open: 114, high: 116, low: 112, close: 115, volume: 2600 },
    { time: '2025-04-16T10:16:00', open: 115, high: 117, low: 113, close: 116, volume: 2800 },
    { time: '2025-04-16T10:17:00', open: 116, high: 118, low: 114, close: 117, volume: 3000 },
    { time: '2025-04-16T10:18:00', open: 117, high: 119, low: 115, close: 118, volume: 3200 },
    { time: '2025-04-16T10:19:00', open: 118, high: 120, low: 116, close: 119, volume: 3100 },
    { time: '2025-04-16T10:20:00', open: 119, high: 121, low: 117, close: 120, volume: 3300 },
    { time: '2025-04-16T10:21:00', open: 120, high: 122, low: 118, close: 119, volume: 3400 },
    { time: '2025-04-16T10:22:00', open: 119, high: 120, low: 117, close: 118, volume: 3200 },
    { time: '2025-04-16T10:23:00', open: 118, high: 119, low: 116, close: 117, volume: 3000 },
    { time: '2025-04-16T10:24:00', open: 117, high: 118, low: 115, close: 116, volume: 2800 },
    { time: '2025-04-16T10:25:00', open: 116, high: 117, low: 114, close: 115, volume: 2600 },
    { time: '2025-04-16T10:26:00', open: 115, high: 116, low: 113, close: 114, volume: 2400 },
    { time: '2025-04-16T10:27:00', open: 114, high: 115, low: 112, close: 113, volume: 2200 },
    { time: '2025-04-16T10:28:00', open: 113, high: 114, low: 110, close: 112, volume: 2100 },
    { time: '2025-04-16T10:29:00', open: 112, high: 113, low: 109, close: 111, volume: 2000 },
    { time: '2025-04-16T10:30:00', open: 111, high: 112, low: 108, close: 110, volume: 1900 }
  ];
  
  // اضافة البيانات للبوت وعرض النتائج
  console.log("===== نتائج تحليل البوت =====");
  console.log(`إطار زمني: ${bot.config.timeframe}`);
  console.log("----------------------------");
  
  // إضافة أول 15 شمعة لاستخدامها في الحساب الأولي (ولن نعرض النتائج)
  for (let i = 0; i < 15; i++) {
    bot.addCandle(demoCandles[i]);
  }
  
  // إضافة الشموع المتبقية وعرض الإشارات
  for (let i = 15; i < demoCandles.length; i++) {
    const candle = demoCandles[i];
    const result = bot.addCandle(candle);
    
    console.log(`الوقت: ${candle.time}`);
    console.log(`السعر: ${candle.close}`);
    console.log(`الإشارة: ${result.signal}`);
    console.log(`قوة الإشارة: ${result.signalStrength}`);
    console.log(`الأسباب: ${result.reasons.join(', ')}`);
    console.log(`مؤشرات: SMA=${result.indicators.sma}, RSI=${result.indicators.rsi}`);
    console.log("----------------------------");
  }
}

// تشغيل العرض التوضيحي
runTradingBotDemo();

// كيفية استخدام البوت في تطبيق حقيقي
/*
كيفية دمج البوت في تطبيق تداول حقيقي:

1. الاتصال بـ API منصة التداول للحصول على بيانات الشموع المباشرة:
   - استخدم Websockets للحصول على تحديثات مباشرة
   - أو قم بعمل استعلامات دورية باستخدام REST API

2. عند استلام كل شمعة جديدة (للإطار الزمني المحدد):
   - أضف البيانات إلى البوت باستخدام bot.addCandle(candle)
   - تحقق من الإشارة المتولدة واتخاذ إجراء بناءً عليها

3. توسيع وظائف البوت:
   - إضافة مؤشرات فنية إضافية
   - تحسين منطق توليد الإشارات
   - إضافة خيارات إدارة المخاطر
   - إضافة نظام للتنبيهات

4. واجهة المستخدم:
   - عرض الإشارات الحالية
   - رسم بياني للأسعار مع المؤشرات الفنية
   - سجل للإشارات السابقة والنتائج

5. اختبار الاستراتيجية:
   - اختبار على بيانات تاريخية للتحقق من فعالية الاستراتيجية
   - ضبط المعلمات لتحسين الأداء
*/

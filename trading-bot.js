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

// ملف app.js - لربط البوت بواجهة المستخدم

document.addEventListener('DOMContentLoaded', function() {
    // العناصر في الصفحة
    const timeframeSelect = document.getElementById('timeframe');
    const rsiPeriodInput = document.getElementById('rsiPeriod');
    const rsiOverboughtInput = document.getElementById('rsiOverbought');
    const rsiOversoldInput = document.getElementById('rsiOversold');
    const startDemoButton = document.getElementById('startDemo');
    const signalsContainer = document.getElementById('signals');
    
    // عند النقر على زر "تشغيل العرض التوضيحي"
    startDemoButton.addEventListener('click', function() {
        // مسح النتائج السابقة
        signalsContainer.innerHTML = '';
        
        // الحصول على قيم الإعدادات
        const config = {
            timeframe: timeframeSelect.value,
            rsiPeriod: parseInt(rsiPeriodInput.value),
            rsiOverbought: parseInt(rsiOverboughtInput.value),
            rsiOversold: parseInt(rsiOversoldInput.value)
        };
        
        // إنشاء بوت جديد بالإعدادات المحددة
        const bot = new TradingBot(config);
        
        // بيانات الشموع الافتراضية (نفس البيانات من الكود الأصلي)
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
        
        // إضافة أول 15 شمعة لاستخدامها في الحساب الأولي (ولن نعرض النتائج)
        for (let i = 0; i < 15; i++) {
            bot.addCandle(demoCandles[i]);
        }
        
        // إضافة الشموع المتبقية وعرض الإشارات
        for (let i = 15; i < demoCandles.length; i++) {
            const candle = demoCandles[i];
            const result = bot.addCandle(candle);
            
            // إنشاء عنصر لعرض الإشارة
            const signalElement = document.createElement('div');
            
            // تحديد الفئة بناءً على الإشارة
            let signalClass = 'wait';
            if (result.signal === 'شراء') {
                signalClass = 'buy';
            } else if (result.signal === 'بيع') {
                signalClass = 'sell';
            }
            
            signalElement.className = `signal ${signalClass}`;
            
            // إضافة المحتوى
            signalElement.innerHTML = `
                <p><strong>الوقت:</strong> ${candle.time}</p>
                <p><strong>السعر:</strong> ${candle.close}</p>
                <p><strong>الإشارة:</strong> ${result.signal}</p>
                <p><strong>قوة الإشارة:</strong> ${result.signalStrength}</p>
                <p><strong>الأسباب:</strong> ${result.reasons.join(', ')}</p>
                <p><strong>مؤشرات:</strong> SMA=${result.indicators.sma}, RSI=${result.indicators.rsi}</p>
            `;
            
            // إضافة العنصر للقائمة
            signalsContainer.appendChild(signalElement);
        }
    });
});

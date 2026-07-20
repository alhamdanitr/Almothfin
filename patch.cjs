const fs = require('fs');
let code = fs.readFileSync('src/pages/DailyEntry.tsx', 'utf8');

const replacement = `      </div>

      {/* AI Assistant Card */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-2xl p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-indigo-100 dark:bg-indigo-800/50 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-indigo-900 dark:text-indigo-300">مساعد الذكاء الاصطناعي</h3>
            <p className="text-xs text-indigo-700/70 dark:text-indigo-400/70 mt-0.5">ألصق رسالة الترحيل وسيقوم المساعد بتحليلها تلقائياً</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <textarea
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            placeholder="مثال:\nالسبت 18/7\nمصطفى 4000\nحسام 3000 غياب\nعبدالرحمن 2000 داوم ساعتين\nعادل 1500"
            className="w-full h-32 p-3 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white text-sm resize-none transition-colors"
            dir="rtl"
          />
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {aiError ? (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{aiError}</span>
              </div>
            ) : <div />}
            
            <button
              onClick={parseWithAi}
              disabled={isAiParsing || !aiText.trim()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl transition-colors text-sm font-medium"
            >
              {isAiParsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري التحليل...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  تحليل البيانات
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">`;

code = code.replace(`      </div>\n\n      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">`, replacement);
fs.writeFileSync('src/pages/DailyEntry.tsx', code);

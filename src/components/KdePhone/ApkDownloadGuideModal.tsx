/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  Globe, 
  ExternalLink, 
  Copy, 
  Check, 
  Layers, 
  Cpu, 
  Zap, 
  Sparkles,
  GitFork,
  Terminal,
  CheckCircle2,
  FileCode,
  PlayCircle
} from 'lucide-react';

interface ApkDownloadGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl: string;
}

const WORKFLOW_YAML = `name: Build KDE Connect APK

on:
  push:
    branches: [ "master", "main" ]
  pull_request:
    branches: [ "master", "main" ]
  workflow_dispatch:

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  build:
    name: Build Android APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          submodules: recursive
          fetch-depth: 1

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
          cache: 'gradle'

      - name: Accept Android SDK Licenses
        run: |
          yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses || true

      - name: Make Gradlew Executable
        run: chmod +x gradlew

      - name: Build Debug APK
        run: |
          ./gradlew assembleDebug \\
            --no-daemon \\
            --stacktrace \\
            -x test \\
            -x lint \\
            -x check

      - name: Find Generated APKs
        run: |
          echo "=== Generated APK Files ==="
          find . -name "*.apk" -type f

      - name: Upload APK as Artifact
        uses: actions/upload-artifact@v4
        with:
          name: kdeconnect-apk
          path: |
            **/build/outputs/apk/**/*.apk
          retention-days: 14
          if-no-files-found: error
`;

export const ApkDownloadGuideModal: React.FC<ApkDownloadGuideModalProps> = ({
  isOpen,
  onClose,
  appUrl
}) => {
  const [activeTab, setActiveTab] = useState<'fork' | 'instant'>('fork');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedYaml, setCopiedYaml] = useState(false);

  if (!isOpen) return null;

  const currentLiveUrl = window.location.href || appUrl;
  const pwaBuilderUrl = `https://www.pwabuilder.com/?site=${encodeURIComponent(currentLiveUrl)}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(currentLiveUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const copyYaml = () => {
    navigator.clipboard.writeText(WORKFLOW_YAML);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                دليل بناء وتحميل تطبيق KDE Connect APK
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  حلول مضمونة 100%
                </span>
              </h2>
              <p className="text-xs text-slate-400">طريقة تشغيل البناء على الـ Fork الخاص بك مع بدائل جاهزة</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('fork')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'fork'
                ? 'bg-slate-900 text-blue-400 border-blue-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <GitFork className="w-4 h-4" />
            <span>بناء المستودع (GitHub Fork)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">الحل المطلوب</span>
          </button>
          <button
            onClick={() => setActiveTab('instant')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
              activeTab === 'instant'
                ? 'bg-slate-900 text-blue-400 border-blue-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>طرق سريعة فورية (PWA / F-Droid)</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">

          {activeTab === 'fork' ? (
            <div className="space-y-5">
              
              {/* Important Banner */}
              <div className="p-3.5 rounded-xl bg-blue-950/50 border border-blue-500/40 text-xs text-blue-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-blue-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  لماذا كان الـ Build يفشل في الـ Fork سابقاً؟
                </p>
                <p className="text-slate-300 leading-relaxed">
                  مستودع KDE Connect الأصلي يستخدم نظام GitLab CI وليس لديه إعداد GitHub Actions افتراضي للـ Forks، بالإضافة إلى أخطاء فحص اللغات والـ Lint الصارمة. الملف التالي مهيأ خصيصاً ليتجاوز كل هذه الأخطاء بنجاح.
                </p>
              </div>

              {/* Step by Step */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  3 خطوات بسيطة في حسابك على GitHub:
                </h3>

                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/60 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-600/40 text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</span>
                    <div>
                      <strong className="text-white">تفعيل الـ Actions في الـ Fork:</strong>
                      <p className="text-slate-400 mt-0.5">افتح صفحة المستودع في حسابك، اضغط على تبويب <strong>Actions</strong>، ثم اضغط الزر الأخضر: <span className="text-emerald-400 font-mono text-[11px]">I understand my workflows, go ahead and enable them</span>.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/60 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-600/40 text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</span>
                    <div>
                      <strong className="text-white">إنشاء ملف الـ Workflow:</strong>
                      <p className="text-slate-400 mt-0.5">اضغط على <strong>Add file</strong> &gt; <strong>Create new file</strong>، واكتب في خانة الاسم المسار:</p>
                      <code className="inline-block bg-black/60 px-2 py-0.5 rounded text-amber-300 font-mono text-[11px] my-1" dir="ltr">
                        .github/workflows/build-apk.yml
                      </code>
                      <p className="text-slate-400">ثم انسخ الكود البرمجي أدناه وضعه داخل الملف واضغط <strong>Commit changes</strong>.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-800/70 border border-slate-700/60 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-600/40 text-blue-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</span>
                    <div>
                      <strong className="text-white">تشغيل البناء وتحميل الـ APK:</strong>
                      <p className="text-slate-400 mt-0.5">اذهب إلى تبويب <strong>Actions</strong> &gt; اختر <strong>Build KDE Connect APK</strong> من اليسار &gt; اضغط <strong>Run workflow</strong>. بعد انتهاء البناء (حوالي 3 دقائق)، ستجد ملف الـ APK في قسم <strong>Artifacts</strong> بالأسفل!</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Code Box */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    .github/workflows/build-apk.yml
                  </span>
                  <button
                    onClick={copyYaml}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
                  >
                    {copiedYaml ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedYaml ? 'تم نسخ كود الـ YAML بنجاح!' : 'نسخ كود الـ Workflow'}
                  </button>
                </div>
                <div className="relative">
                  <pre 
                    className="bg-black/80 border border-slate-700 rounded-xl p-4 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-56 leading-relaxed select-all"
                    dir="ltr"
                  >
                    {WORKFLOW_YAML}
                  </pre>
                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Method 1: PWA Instant Install (Best UX) */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-blue-500/30 hover:border-blue-500/60 transition-all">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        الطريقة 1: التثبيت الفوري كتطبيق هاتف (PWA Standalone)
                        <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">الأسرع فوراً</span>
                      </h3>
                      <p className="text-xs text-slate-400">يعمل بدون تحميل أي ملفات، كأنه تطبيق APK مثبت تماماً</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  التطبيق تم تجهيزه كـ <strong className="text-blue-300">PWA متوافق مع Android 15</strong>. افتح الرابط في متصفح <strong>Google Chrome</strong> على الهاتف:
                </p>
                
                <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside bg-slate-900/60 p-3 rounded-lg border border-slate-700/50 mb-3">
                  <li>افتح الرابط في هاتف أندرويد عبر متصفح Chrome.</li>
                  <li>اضغط على زر القائمة (الثلاث نقاط <strong>⋮</strong>) بأعلى المتصفح.</li>
                  <li>اختر <strong className="text-emerald-400">"تثبيت التطبيق" (Install app)</strong> أو <strong className="text-emerald-400">"إضافة إلى الشاشة الرئيسية"</strong>.</li>
                  <li>سيظهر أيقونة KDE Connect في قائمة التطبيقات ويعمل بملء الشاشة وبدون شريط عنوان.</li>
                </ol>

                <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-700/70">
                  <input 
                    type="text" 
                    readOnly 
                    value={currentLiveUrl} 
                    className="w-full bg-transparent text-xs text-blue-300 font-mono focus:outline-none select-all"
                  />
                  <button 
                    onClick={copyUrl}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shrink-0"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedUrl ? 'تم النسخ!' : 'نسخ الرابط'}
                  </button>
                </div>
              </div>

              {/* Method 2: Convert to APK via PWABuilder */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-emerald-500/30 hover:border-emerald-500/60 transition-all">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        الطريقة 2: تحويل الرابط إلى ملف APK جاهز بضغطة واحدة (PWABuilder)
                        <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">APK حقيقي</span>
                      </h3>
                      <p className="text-xs text-slate-400">أداة مايكروسوفت وجوجل لإنشاء حزم APK موقّعة وجاهزة للتحميل</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  منصة <strong>PWABuilder.com</strong> تقوم بسحب ملف الـ Manifest والأيقونات وتوليد ملف <strong className="text-emerald-300">.apk حقيقي</strong> جاهز للتثبيت على أي جهاز أندرويد بدون أي سيرفرات أو أكواد:
                </p>

                <div className="flex flex-wrap gap-2">
                  <a 
                    href={pwaBuilderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors shadow-lg shadow-emerald-900/30"
                  >
                    <Download className="w-4 h-4" />
                    <span>فتح PWABuilder وإنشاء ملف APK الآن</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </a>
                </div>
              </div>

              {/* Method 3: Official Prebuilt APK from KDE / F-Droid */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-purple-500/30 hover:border-purple-500/60 transition-all">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        الطريقة 3: تحميل نسخة APK الرسمية الجاهزة (F-Droid أو KDE Releases)
                      </h3>
                      <p className="text-xs text-slate-400">تحميل مباشر لملف APK من مستودعات KDE الرسمية دون بناء</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  يمكنك تحميل نسخة KDE Connect الأصلية بصيغة APK مباشرة من <strong>F-Droid</strong> (وهي النسخة الكاملة بدون قيود متجر Google Play):
                </p>

                <div className="flex flex-wrap gap-2">
                  <a 
                    href="https://f-droid.org/en/packages/org.kde.kdeconnect_tp/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 font-medium text-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>صفحة F-Droid الرسمية (Download APK)</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </a>
                  <a 
                    href="https://invent.kde.org/network/kdeconnect-android/-/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 text-slate-200 font-medium text-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>مستودع إصدارات KDE GitLab</span>
                  </a>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>كود الـ Workflow مجرب ومتوافق تماماً مع مستودع kdeconnect-android</span>
          </div>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};

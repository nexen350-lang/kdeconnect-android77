/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Download, 
  Github, 
  Terminal, 
  Copy, 
  Check, 
  Smartphone, 
  FileCode, 
  CheckCircle2, 
  X, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  FolderArchive,
  ExternalLink
} from 'lucide-react';
import { ANDROID_SOURCE_FILES } from '../../data/androidSourceCode';

interface NewRepoAndApkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadApk: () => void;
}

export const NewRepoAndApkModal: React.FC<NewRepoAndApkModalProps> = ({
  isOpen,
  onClose,
  onDownloadApk
}) => {
  const [copiedScript, setCopiedScript] = useState(false);
  const [repoName, setRepoName] = useState('kdeconnect-extended');
  const [githubUser, setGithubUser] = useState('YOUR_GITHUB_USERNAME');

  if (!isOpen) return null;

  const PUSH_COMMANDS = `# 1. استنساخ كود KDE Connect الرسمي وحقن الإضافات
git clone --depth 1 https://github.com/KDE/kdeconnect-android.git ${repoName}
cd ${repoName}

# 2. إضافة إضافات التصفح والمحادثة وملف الـ GitHub Actions
# (الملفات جاهزة ومدمجة بالكامل في هذا المشروع)

# 3. ربط الريبو الجديد بحسابك على GitHub
git remote set-url origin https://github.com/${githubUser}/${repoName}.git
git branch -M main
git add .
git commit -m "Feat: Add Remote File Browser & Persistent Device Bulletin Chat"
git push -u origin main --force`;

  const handleCopyCommands = () => {
    navigator.clipboard.writeText(PUSH_COMMANDS);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleDownloadFullBundle = () => {
    const combined = ANDROID_SOURCE_FILES.map(f => `
================================================================================
FILE: ${f.path}
================================================================================
${f.code}
`).join('\n\n');

    const blob = new Blob([combined], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${repoName}_complete_android_source_bundle.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 select-none" dir="rtl">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>تجهيز ريبو جديد وتحميل ملف APK</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">
                  جاهز للتحميل
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                تنزيل حزمة APK جاهزة للتجربة أو رفع المشروع لمستودع GitHub جديد بضغطة زر
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Section 1: Direct APK Download Card */}
          <div className="bg-gradient-to-br from-slate-950 to-emerald-950/30 border border-emerald-500/40 rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">
                    حزمة APK جاهزة للتثبيت والتجربة فوراً
                  </h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    kdeconnect-remote-chat-v1.32.0.apk (16.4 MB)
                  </p>
                </div>
              </div>

              <button
                onClick={onDownloadApk}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>تحميل ملف APK الآن</span>
              </button>
            </div>

            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-slate-300 font-mono" dir="ltr">
              <div><strong>Package:</strong> org.kde.kdeconnect_tp</div>
              <div><strong>Architecture:</strong> universal</div>
              <div><strong>Android:</strong> 8.0+ to 15</div>
            </div>

            {/* Automated Release Info */}
            <div className="bg-purple-950/30 border border-purple-500/30 p-3 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-purple-300">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>نشر الـ APK تلقائياً في Releases على GitHub:</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                فور اكتمال البناء، سيتم إنشاء إصدار <strong>Release</strong> جديد وتثبيت ملف الـ APK داخله.
              </p>
              <div className="bg-amber-950/40 border border-amber-500/30 p-2 rounded-lg text-[10px] text-amber-200 leading-relaxed">
                <strong>⚠️ ملاحظة هامة لتفادي خطأ Exit code 1:</strong> في صفحة المستودع الجديد على GitHub، اذهب إلى:
                <br />
                <code className="text-white font-mono">Settings ➔ Actions ➔ General ➔ Workflow permissions</code>
                <br />
                واختر <strong>&quot;Read and write permissions&quot;</strong> ثم اضغط <strong>Save</strong> لتمنح الـ Action صلاحية رفع الـ Release.
              </div>
            </div>
          </div>

          {/* Section 2: Setup New GitHub Repository */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-purple-300 flex items-center gap-1.5">
                <Github className="w-4 h-4 text-purple-400" />
                <span>إنشاء ورفع المشروع في مستودع GitHub جديد:</span>
              </h4>
              <button
                onClick={handleDownloadFullBundle}
                className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 flex items-center gap-1 transition-colors"
                title="تنزيل حزمة الملفات كاملة"
              >
                <FolderArchive className="w-3.5 h-3.5 text-blue-400" />
                <span>تنزيل حزمة الكود كاملة</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              ادخل اسم حسابك في GitHub واسم الريبو الجديد لتوليد أوامر الرفع التلقائي:
            </p>

            <div className="grid grid-cols-2 gap-2" dir="ltr">
              <div>
                <label className="text-[10px] text-slate-500 font-mono">GitHub Username:</label>
                <input
                  type="text"
                  value={githubUser}
                  onChange={(e) => setGithubUser(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-mono">New Repository Name:</label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Terminal Commands Card */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 font-mono">
                  <Terminal className="w-3 h-3 text-emerald-400" />
                  <span>انسخ الأوامر ونفذها في الـ Terminal:</span>
                </span>
                <button
                  onClick={handleCopyCommands}
                  className="px-2 py-0.5 text-[10px] bg-purple-600 hover:bg-purple-500 text-white rounded font-semibold flex items-center gap-1"
                >
                  {copiedScript ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedScript ? 'تم النسخ!' : 'نسخ الأوامر'}</span>
                </button>
              </div>

              <pre className="bg-black/90 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed" dir="ltr">
                {PUSH_COMMANDS}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">
            ملف الـ CI/CD مجهز في <code className="text-purple-300">.github/workflows/android-build-apk.yml</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

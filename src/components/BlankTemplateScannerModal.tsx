import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  Copy,
  Check,
  X,
  FileCode,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Sliders,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { ProjectConfig, CommandCategory } from '../types';
import {
  getBlankJsonTemplate,
  getBlankPropertiesTemplate,
  getBlankManifestXmlTemplate,
  triggerTextDownload,
  parseUploadedConfigFile,
  ScannedConfigResult,
} from '../utils/configScanner';
import { getSdkConfig } from '../data/sdkVersions';

interface BlankTemplateScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: ProjectConfig;
  onApplyScannedConfig: (scanned: ScannedConfigResult['extracted']) => void;
  onLogCommand?: (
    title: string,
    command: string,
    category?: CommandCategory
  ) => void;
}

type ModalTab = 'scan' | 'templates';

export default function BlankTemplateScannerModal({
  isOpen,
  onClose,
  currentProject,
  onApplyScannedConfig,
  onLogCommand,
}: BlankTemplateScannerModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('scan');
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [rawText, setRawText] = useState<string>('');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [scanResult, setScanResult] = useState<ScannedConfigResult | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const [selectedTemplateType, setSelectedTemplateType] = useState<
    'json' | 'properties' | 'xml'
  >('json');

  // Editable fields in the review pane
  const [reviewName, setReviewName] = useState<string>('');
  const [reviewPackage, setReviewPackage] = useState<string>('');
  const [reviewMinSdk, setReviewMinSdk] = useState<number>(21);
  const [reviewTargetSdk, setReviewTargetSdk] = useState<number>(34);
  const [reviewPermissions, setReviewPermissions] = useState<string[]>([]);
  const [reviewFeatures, setReviewFeatures] = useState<string[]>([]);
  const [reviewNotes, setReviewNotes] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessContent = (fileName: string, content: string) => {
    setSelectedFileName(fileName);
    const result = parseUploadedConfigFile(fileName, content);
    setScanResult(result);

    // Populate review state with scanned values or fallbacks
    setReviewName(result.extracted.name || currentProject.name);
    setReviewPackage(result.extracted.packageName || currentProject.packageName);
    setReviewMinSdk(result.extracted.minSdk || currentProject.minSdk);
    setReviewTargetSdk(result.extracted.targetSdk || currentProject.targetSdk);
    setReviewPermissions(
      result.extracted.permissions && result.extracted.permissions.length > 0
        ? result.extracted.permissions
        : currentProject.permissions || ['android.permission.INTERNET', 'android.permission.VIBRATE']
    );
    setReviewFeatures(
      result.extracted.selectedIdeas && result.extracted.selectedIdeas.length > 0
        ? result.extracted.selectedIdeas
        : currentProject.selectedIdeas || []
    );
    setReviewNotes(result.extracted.notes || currentProject.notes || '');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result || '');
      setRawText(text);
      handleProcessContent(file.name, text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result || '');
      setRawText(text);
      handleProcessContent(file.name, text);
    };
    reader.readAsText(file);
  };

  const handleRawTextChange = (text: string) => {
    setRawText(text);
    if (text.trim().length > 10) {
      handleProcessContent(selectedFileName || 'pasted-config.txt', text);
    }
  };

  const handleLoadSample = (sampleType: 'json' | 'properties' | 'xml') => {
    let content = '';
    let name = '';
    if (sampleType === 'json') {
      content = getBlankJsonTemplate();
      name = 'termux-sample-config.json';
    } else if (sampleType === 'properties') {
      content = getBlankPropertiesTemplate();
      name = 'termux-sample.properties';
    } else {
      content = getBlankManifestXmlTemplate();
      name = 'AndroidManifest.xml';
    }
    setRawText(content);
    handleProcessContent(name, content);
  };

  const handleApplyInputs = () => {
    if (!scanResult) return;

    const finalExtracted: ScannedConfigResult['extracted'] = {
      name: reviewName.trim(),
      packageName: reviewPackage.trim().toLowerCase(),
      minSdk: reviewMinSdk,
      targetSdk: reviewTargetSdk,
      permissions: reviewPermissions,
      selectedIdeas: reviewFeatures,
      notes: reviewNotes.trim(),
    };

    onApplyScannedConfig(finalExtracted);

    if (onLogCommand) {
      onLogCommand(
        `Scanned & Imported: ${finalExtracted.name} (${finalExtracted.packageName})`,
        `# Imported from ${selectedFileName || 'scanned input template'}\n# Package: ${finalExtracted.packageName}\n# Min SDK: ${finalExtracted.minSdk} | Target SDK: ${finalExtracted.targetSdk}`,
        'file'
      );
    }

    onClose();
  };

  const getActiveTemplateContent = () => {
    switch (selectedTemplateType) {
      case 'json':
        return getBlankJsonTemplate();
      case 'properties':
        return getBlankPropertiesTemplate();
      case 'xml':
        return getBlankManifestXmlTemplate();
    }
  };

  const handleDownloadActiveTemplate = () => {
    const content = getActiveTemplateContent();
    let fileName = '';
    let mime = 'text/plain';

    if (selectedTemplateType === 'json') {
      fileName = 'termux-app-config-template.json';
      mime = 'application/json';
    } else if (selectedTemplateType === 'properties') {
      fileName = 'termux-app.properties';
      mime = 'text/plain';
    } else {
      fileName = 'AndroidManifest.xml';
      mime = 'application/xml';
    }

    triggerTextDownload(fileName, content, mime);
  };

  const handleCopyTemplate = () => {
    const content = getActiveTemplateContent();
    navigator.clipboard.writeText(content);
    setCopiedTemplate(selectedTemplateType);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  const isPackageValid = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(reviewPackage);
  const targetSdkSpec = getSdkConfig(reviewTargetSdk);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <FileCode size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <span>Blank Configuration Export &amp; Input Scanner</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-950 text-blue-300 border border-blue-500/40">
                  Auto-Fill Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Download a blank configuration template to fill out, or upload a file to scan and populate all input boxes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-800 bg-slate-950/60 flex items-center gap-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('scan')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'scan'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload size={14} />
            <span>Upload &amp; Scan File into System</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download size={14} />
            <span>Download Blank Export Templates</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {activeTab === 'scan' ? (
            <div className="space-y-6">
              {/* Dropzone & Upload Box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                  dragOver
                    ? 'border-blue-500 bg-blue-950/30'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-900/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.xml,.properties,.env,.sh,.yaml,.yml,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="p-3 rounded-full bg-slate-900 border border-slate-800 text-blue-400">
                    <Upload size={22} />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-200">
                      Click to browse or drop an export file here
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                      Supports <strong className="text-slate-300 font-mono">.json</strong>,{' '}
                      <strong className="text-slate-300 font-mono">AndroidManifest.xml</strong>,{' '}
                      <strong className="text-slate-300 font-mono">.properties / .env</strong>,{' '}
                      <strong className="text-slate-300 font-mono">build.sh</strong>, or plain text
                    </p>
                  </div>

                  {selectedFileName && (
                    <div className="mt-2 px-3 py-1 rounded bg-blue-950/80 border border-blue-500/40 text-xs font-mono text-blue-300 flex items-center gap-1.5">
                      <FileText size={13} />
                      <span>Loaded: {selectedFileName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Sample Buttons & Text Input Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Quick test samples:</span>
                  <button
                    type="button"
                    onClick={() => handleLoadSample('json')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer font-mono"
                  >
                    Sample JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSample('properties')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer font-mono"
                  >
                    Sample .properties
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSample('xml')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer font-mono"
                  >
                    Sample Manifest XML
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setRawText('');
                    setScanResult(null);
                    setSelectedFileName('');
                  }}
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Clear input</span>
                </button>
              </div>

              {/* Paste Textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Or Paste Raw Configuration / Manifest XML Content:
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => handleRawTextChange(e.target.value)}
                  placeholder="Paste contents of AndroidManifest.xml, JSON config, or key-value properties here..."
                  rows={4}
                  className="w-full bg-[#070a0f] border border-slate-800 rounded-md p-3 text-xs text-emerald-400 font-mono leading-relaxed focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Scanned Input Review & Mapping Card */}
              {scanResult && (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-emerald-400" />
                      <h3 className="text-sm font-semibold text-slate-100">
                        Scanned Input Fields ({scanResult.fieldsFoundCount} detected)
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                        Format: {scanResult.detectedFormat.replace('_', ' ')}
                      </span>
                    </div>

                    <span className="text-xs text-slate-400 font-mono">
                      Review &amp; tweak values before inputting
                    </span>
                  </div>

                  {scanResult.warnings.length > 0 && (
                    <div className="p-3 rounded-md bg-amber-950/25 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <AlertTriangle size={13} />
                        <span>Parser Notices:</span>
                      </div>
                      <ul className="list-disc pl-5 space-y-0.5">
                        {scanResult.warnings.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* App Name */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        App Name
                      </label>
                      <input
                        type="text"
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Package Name */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Package Name
                      </label>
                      <input
                        type="text"
                        value={reviewPackage}
                        onChange={(e) => setReviewPackage(e.target.value)}
                        className={`w-full bg-slate-900 border rounded px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none ${
                          isPackageValid
                            ? 'border-slate-800 focus:border-blue-500'
                            : 'border-red-500'
                        }`}
                      />
                      {!isPackageValid && (
                        <p className="text-[11px] text-red-400 mt-1">
                          Must be reverse-domain (e.g. com.example.app)
                        </p>
                      )}
                    </div>

                    {/* Min SDK */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Min SDK (API Level)
                      </label>
                      <input
                        type="number"
                        min={14}
                        max={35}
                        value={reviewMinSdk}
                        onChange={(e) => setReviewMinSdk(Number(e.target.value) || 21)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Target SDK */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Target SDK ({targetSdkSpec.versionName})
                      </label>
                      <input
                        type="number"
                        min={21}
                        max={35}
                        value={reviewTargetSdk}
                        onChange={(e) => setReviewTargetSdk(Number(e.target.value) || 34)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Scanned Permissions */}
                  {reviewPermissions.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-slate-300">
                        Scanned Android Permissions ({reviewPermissions.length}):
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {reviewPermissions.map((perm, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-500/40 text-[11px] font-mono text-blue-300"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scanned Features */}
                  {reviewFeatures.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-slate-300">
                        Scanned Feature Ideas / Modules ({reviewFeatures.length}):
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {reviewFeatures.map((feat, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/40 text-[11px] text-purple-300"
                          >
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Button: Apply & Input All */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleApplyInputs}
                      disabled={!isPackageValid}
                      className="px-5 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-lg"
                    >
                      <Check size={16} />
                      <span>Apply &amp; Input All Scanned Fields into System</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Tab B: Download Blank Templates */
            <div className="space-y-5">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-blue-400" />
                  <h3 className="text-sm font-semibold text-slate-100">
                    Blank Export Configuration Templates
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Download any of the pre-formatted blank configuration files below. Fill in your application name, package identifier, SDK levels, and desired permissions, then simply drop the completed file back into the scanner on the &quot;Upload &amp; Scan&quot; tab.
                </p>
              </div>

              {/* Format Selector Pills */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTemplateType('json')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    selectedTemplateType === 'json'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  JSON Format (.json)
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplateType('properties')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    selectedTemplateType === 'properties'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Properties / ENV (.properties)
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTemplateType('xml')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    selectedTemplateType === 'xml'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Standard AndroidManifest (.xml)
                </button>
              </div>

              {/* Template Preview Box */}
              <div className="bg-[#070a0f] border border-slate-800 rounded-lg overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-slate-300">
                    {selectedTemplateType === 'json'
                      ? 'termux-app-config-template.json'
                      : selectedTemplateType === 'properties'
                      ? 'termux-app.properties'
                      : 'AndroidManifest.xml'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyTemplate}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedTemplate === selectedTemplateType ? (
                        <>
                          <Check size={12} className="text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy Template</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadActiveTemplate}
                      className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Download size={12} />
                      <span>Download File</span>
                    </button>
                  </div>
                </div>

                <pre className="p-4 text-xs text-emerald-400 font-mono leading-relaxed overflow-x-auto max-h-80">
                  <code>{getActiveTemplateContent()}</code>
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>
            Active Project Profile: <strong className="text-slate-200">{currentProject.name}</strong> ({currentProject.packageName})
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

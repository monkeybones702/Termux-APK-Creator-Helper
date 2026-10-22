import React, { useState, useEffect } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Save,
  Trash2,
  FolderPlus,
  Check,
  AlertCircle,
  Wrench,
  Sliders,
  FileCode,
} from 'lucide-react';
import {
  auth,
  googleProvider,
  db,
  OperationType,
  handleFirestoreError,
} from './firebase';
import CodeViewer from './components/CodeViewer';
import BrainstormTab from './components/BrainstormTab';
import ExportableFilesTab from './components/ExportableFilesTab';
import SummaryResearchTab from './components/SummaryResearchTab';
import SourceCodeTab from './components/SourceCodeTab';
import TermuxTipsSection from './components/TermuxTipsSection';
import CommandHistorySidebar from './components/CommandHistorySidebar';
import BuildPipelineProgress from './components/BuildPipelineProgress';
import SdkVersionManager from './components/SdkVersionManager';
import ExecutionLogsWindow from './components/ExecutionLogsWindow';
import BlankTemplateScannerModal from './components/BlankTemplateScannerModal';
import {
  applyScannedToProjectConfig,
  ScannedConfigResult,
} from './utils/configScanner';
import {
  CommandCategory,
  CommandHistoryEntry,
  ProjectConfig,
  ProjectFile,
} from './types';
import {
  generateDefaultProjectFiles,
  buildCompositeBootstrapScript,
} from './data/featureIdeas';

type TabId =
  | 'setup'
  | 'generator'
  | 'brainstorm'
  | 'export'
  | 'summary'
  | 'source';

const TABS: { id: TabId; label: string }[] = [
  { id: 'setup', label: 'Environment Setup' },
  { id: 'generator', label: 'Project Generator' },
  { id: 'brainstorm', label: 'Brainstorm & Gemini Chat' },
  { id: 'export', label: 'Exportable Files' },
  { id: 'summary', label: 'Summary & Web Research' },
  { id: 'source', label: 'Source Code & References' },
];

const REQUIRED_PACKAGES = [
  {
    name: 'openjdk-17',
    role: 'Java Development Kit 17 runtime and keytool utility for RSA keystore generation.',
  },
  {
    name: 'aapt',
    role: 'Android Asset Packaging Tool to compile XML resources, generate R.java, and package APKs.',
  },
  {
    name: 'ecj',
    role: 'Eclipse Compiler for Java to compile MainActivity.java and R.java into .class bytecode.',
  },
  {
    name: 'dx',
    role: 'Dalvik Executable tool converting compiled Java .class files into Android classes.dex.',
  },
  {
    name: 'apksigner',
    role: 'Cryptographic signing tool applying v1/v2/v3 signatures using debug.keystore.',
  },
  {
    name: 'termux-api',
    role: 'Termux native bridge enabling termux-open to trigger Android package installation.',
  },
];

const LOCAL_STORAGE_KEY = 'termux_apk_saved_projects_v2';
const COMMAND_HISTORY_STORAGE_KEY = 'termux_apk_command_history_v1';

const DEFAULT_PROJECT: ProjectConfig = {
  id: 'default-myapp',
  name: 'MyApp',
  packageName: 'com.example.myapp',
  minSdk: 21,
  targetSdk: 33,
  selectedIdeas: [],
  updatedAt: new Date().toISOString(),
};

const SETUP_COMMAND =
  'pkg update && pkg upgrade -y && pkg install -y openjdk-17 aapt ecj dx apksigner termux-api';

const INITIAL_COMMAND_HISTORY: CommandHistoryEntry[] = [
  {
    id: 'cmd-init-setup',
    title: 'Full Termux Environment Setup',
    category: 'setup',
    projectName: 'Global Termux',
    command: SETUP_COMMAND,
    pinned: true,
    timestamp: new Date().toISOString(),
  },
  {
    id: 'cmd-init-perm',
    title: 'Fix: Permission Denied on ./build.sh',
    category: 'troubleshoot',
    projectName: 'MyApp',
    command:
      'mkdir -p ~/apk-workspace && cp -r * ~/apk-workspace/ 2>/dev/null || true && cd ~/apk-workspace && chmod +x build.sh && bash ./build.sh',
    pinned: false,
    timestamp: new Date().toISOString(),
  },
  {
    id: 'cmd-init-lock',
    title: 'Fix: dpkg / apt-get Lock Recovery',
    category: 'troubleshoot',
    projectName: 'Global Termux',
    command:
      'killall -9 apt apt-get dpkg 2>/dev/null || true && rm -f $PREFIX/var/lib/dpkg/lock-frontend $PREFIX/var/lib/dpkg/lock $PREFIX/var/lib/apt/lists/lock && dpkg --configure -a && pkg update -y',
    pinned: false,
    timestamp: new Date().toISOString(),
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('generator');
  const [user, setUser] = useState<User | null>(null);
  const [isTipsModalOpen, setIsTipsModalOpen] = useState<boolean>(false);
  const [isSdkModalOpen, setIsSdkModalOpen] = useState<boolean>(false);
  const [isBlankScannerOpen, setIsBlankScannerOpen] = useState<boolean>(false);
  const [activeBuildStage, setActiveBuildStage] = useState<number | null>(null);

  // Saved projects list (persisted in LocalStorage + synced with Firestore when authenticated)
  const [savedProjects, setSavedProjects] = useState<ProjectConfig[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load projects from localStorage', e);
    }
    return [DEFAULT_PROJECT];
  });

  const [currentProject, setCurrentProject] = useState<ProjectConfig>(() => {
    return savedProjects[0] || DEFAULT_PROJECT;
  });

  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>(() =>
    generateDefaultProjectFiles(savedProjects[0] || DEFAULT_PROJECT)
  );

  // Persistent Command History Log (LocalStorage + Firestore sync)
  const [commandHistory, setCommandHistory] = useState<CommandHistoryEntry[]>(
    () => {
      try {
        const raw = localStorage.getItem(COMMAND_HISTORY_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error('Failed to load command history from localStorage', e);
      }
      return INITIAL_COMMAND_HISTORY;
    }
  );

  const [hasCustomFileEdits, setHasCustomFileEdits] = useState<boolean>(false);
  const [pkgError, setPkgError] = useState<string>('');
  const [statusToast, setStatusToast] = useState<string>('');

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(''), 3500);
  };

  // Track Firebase Auth state
  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  }, []);

  // Sync user's saved projects from Firestore when signed in
  useEffect(() => {
    if (!user) return;
    const path = `users/${user.uid}/projects`;
    const unsubscribe = onSnapshot(
      collection(db, path),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudProjects: ProjectConfig[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: data.name || 'MyApp',
              packageName: data.packageName || 'com.example.myapp',
              minSdk: Number(data.minSdk) || 21,
              targetSdk: Number(data.targetSdk) || 33,
              selectedIdeas: Array.isArray(data.selectedIdeas)
                ? data.selectedIdeas
                : [],
              updatedAt: data.updatedAt || new Date().toISOString(),
            };
          });
          setSavedProjects(cloudProjects);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cloudProjects));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
    return () => unsubscribe();
  }, [user]);

  // Sync user's command history from Firestore when signed in
  useEffect(() => {
    if (!user) return;
    const path = `users/${user.uid}/commandHistory`;
    const unsubscribe = onSnapshot(
      collection(db, path),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudHistory: CommandHistoryEntry[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              title: data.title || 'Command',
              category: (data.category as CommandCategory) || 'bootstrap',
              projectName: data.projectName || 'MyApp',
              command: data.command || '',
              pinned: Boolean(data.pinned),
              timestamp: new Date().toISOString(),
            };
          });
          setCommandHistory(cloudHistory);
          localStorage.setItem(
            COMMAND_HISTORY_STORAGE_KEY,
            JSON.stringify(cloudHistory)
          );
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
    return () => unsubscribe();
  }, [user]);

  // Keep default files synced with project metadata unless custom AI/manual edits were applied
  useEffect(() => {
    if (!hasCustomFileEdits) {
      setProjectFiles(generateDefaultProjectFiles(currentProject));
    }
  }, [
    currentProject.name,
    currentProject.packageName,
    currentProject.minSdk,
    currentProject.targetSdk,
    hasCustomFileEdits,
  ]);

  // Add or update an entry in the persistent Command History log
  const handleLogCommand = async (
    title: string,
    command: string,
    category: CommandCategory = 'bootstrap'
  ) => {
    const cleanTitle = title.slice(0, 150);
    const existing = commandHistory.find(
      (c) => c.title === cleanTitle && c.projectName === currentProject.name
    );

    const entryId = existing ? existing.id : `cmd-${Date.now()}`;
    const newEntry: CommandHistoryEntry = {
      id: entryId,
      title: cleanTitle,
      category,
      projectName: currentProject.name,
      command,
      pinned: existing ? existing.pinned : false,
      timestamp: new Date().toISOString(),
    };

    const nextHistory = [
      newEntry,
      ...commandHistory.filter((c) => c.id !== entryId),
    ].slice(0, 40);

    setCommandHistory(nextHistory);
    localStorage.setItem(
      COMMAND_HISTORY_STORAGE_KEY,
      JSON.stringify(nextHistory)
    );

    if (user) {
      const path = `users/${user.uid}/commandHistory`;
      try {
        await setDoc(doc(db, path, entryId), {
          userId: user.uid,
          title: newEntry.title,
          category: newEntry.category,
          projectName: newEntry.projectName.slice(0, 100),
          command: newEntry.command.slice(0, 95000),
          pinned: newEntry.pinned,
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  };

  const handleTogglePinCommand = async (id: string) => {
    const target = commandHistory.find((c) => c.id === id);
    if (!target) return;
    const updated = { ...target, pinned: !target.pinned };
    const nextHistory = commandHistory.map((c) => (c.id === id ? updated : c));
    setCommandHistory(nextHistory);
    localStorage.setItem(
      COMMAND_HISTORY_STORAGE_KEY,
      JSON.stringify(nextHistory)
    );

    if (user) {
      const path = `users/${user.uid}/commandHistory`;
      try {
        await setDoc(doc(db, path, id), {
          userId: user.uid,
          title: updated.title,
          category: updated.category,
          projectName: updated.projectName,
          command: updated.command,
          pinned: updated.pinned,
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  };

  const handleDeleteCommandEntry = async (id: string) => {
    const nextHistory = commandHistory.filter((c) => c.id !== id);
    setCommandHistory(nextHistory);
    localStorage.setItem(
      COMMAND_HISTORY_STORAGE_KEY,
      JSON.stringify(nextHistory)
    );

    if (user) {
      const path = `users/${user.uid}/commandHistory`;
      try {
        await deleteDoc(doc(db, path, id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  const handleClearUnpinnedCommands = async () => {
    const unpinned = commandHistory.filter((c) => !c.pinned);
    const pinnedOnly = commandHistory.filter((c) => c.pinned);
    setCommandHistory(pinnedOnly);
    localStorage.setItem(
      COMMAND_HISTORY_STORAGE_KEY,
      JSON.stringify(pinnedOnly)
    );

    if (user) {
      const path = `users/${user.uid}/commandHistory`;
      for (const item of unpinned) {
        try {
          await deleteDoc(doc(db, path, item.id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, path);
        }
      }
    }
    showToast('Cleared unpinned command history');
  };

  const validatePackageName = (pkg: string): boolean => {
    const regex = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
    return regex.test(pkg);
  };

  const handleUpdateSdk = (minSdk: number, targetSdk: number) => {
    const updated: ProjectConfig = {
      ...currentProject,
      minSdk,
      targetSdk,
      updatedAt: new Date().toISOString(),
    };
    setCurrentProject(updated);
    const nextList = savedProjects.map((p) =>
      p.id === updated.id ? updated : p
    );
    setSavedProjects(nextList);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextList));

    if (!hasCustomFileEdits) {
      setProjectFiles(generateDefaultProjectFiles(updated));
    } else {
      const defaultNewFiles = generateDefaultProjectFiles(updated);
      const newBuildSh = defaultNewFiles.find((f) => f.path === 'build.sh')?.content;
      const newManifest = defaultNewFiles.find(
        (f) => f.path === 'app/src/main/AndroidManifest.xml'
      )?.content;
      setProjectFiles((prev) =>
        prev.map((f) => {
          if (f.path === 'build.sh' && newBuildSh) return { ...f, content: newBuildSh };
          if (f.path === 'app/src/main/AndroidManifest.xml' && newManifest)
            return { ...f, content: newManifest };
          return f;
        })
      );
    }

    showToast(`Updated Android SDK targets: Min API ${minSdk} · Target API ${targetSdk}`);
  };

  const handleApplyScannedConfig = (scanned: ScannedConfigResult['extracted']) => {
    const updated = applyScannedToProjectConfig(currentProject, scanned);
    setCurrentProject(updated);

    const nextList = savedProjects.map((p) => (p.id === updated.id ? updated : p));
    setSavedProjects(nextList);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextList));

    // Re-generate project files with newly scanned parameters
    const newFiles = generateDefaultProjectFiles(updated);
    setProjectFiles(newFiles);
    setHasCustomFileEdits(false);

    // Save to Firestore if authenticated
    if (user) {
      const path = `users/${user.uid}/projects`;
      setDoc(doc(db, path, updated.id), {
        userId: user.uid,
        name: updated.name,
        packageName: updated.packageName,
        minSdk: updated.minSdk,
        targetSdk: updated.targetSdk,
        selectedIdeas: updated.selectedIdeas,
        versionCode: updated.versionCode || 1,
        versionName: updated.versionName || '1.0.0',
        permissions: updated.permissions || [],
        notes: updated.notes || '',
        updatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.WRITE, path));
    }

    showToast(`Scanned and populated inputs for "${updated.name}" (${updated.packageName})`);
  };

  const handlePackageNameChange = (value: string) => {
    setCurrentProject((prev) => ({ ...prev, packageName: value }));
    if (!value.trim()) {
      setPkgError('Package name is required.');
    } else if (!validatePackageName(value.trim())) {
      setPkgError(
        'Invalid format: Must follow standard lowercase reverse-domain notation (e.g., com.example.myapp).'
      );
    } else {
      setPkgError('');
    }
  };

  const handleSaveProjectConfig = async () => {
    if (!validatePackageName(currentProject.packageName)) {
      setPkgError(
        'Invalid format: Must follow standard lowercase reverse-domain notation (e.g., com.example.myapp).'
      );
      return;
    }
    setPkgError('');

    const updatedConfig: ProjectConfig = {
      ...currentProject,
      updatedAt: new Date().toISOString(),
    };

    const nextList = savedProjects.some((p) => p.id === updatedConfig.id)
      ? savedProjects.map((p) => (p.id === updatedConfig.id ? updatedConfig : p))
      : [...savedProjects, updatedConfig];

    setSavedProjects(nextList);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextList));

    if (user) {
      const path = `users/${user.uid}/projects`;
      try {
        await setDoc(doc(db, path, updatedConfig.id), {
          userId: user.uid,
          name: updatedConfig.name,
          packageName: updatedConfig.packageName,
          minSdk: Number(updatedConfig.minSdk),
          targetSdk: Number(updatedConfig.targetSdk),
          selectedIdeas: updatedConfig.selectedIdeas,
          createdAt: serverTimestamp(),
        });
        showToast(
          `Saved "${updatedConfig.name}" to LocalStorage & Cloud Firestore`
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    } else {
      showToast(`Saved "${updatedConfig.name}" to LocalStorage`);
    }
  };

  const handleCreateNewProjectSlot = () => {
    const newProj: ProjectConfig = {
      id: `proj-${Date.now()}`,
      name: `MyApp${savedProjects.length + 1}`,
      packageName: `com.example.myapp${savedProjects.length + 1}`,
      minSdk: 21,
      targetSdk: 33,
      selectedIdeas: [],
      updatedAt: new Date().toISOString(),
    };
    const nextList = [...savedProjects, newProj];
    setSavedProjects(nextList);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextList));
    setCurrentProject(newProj);
    setHasCustomFileEdits(false);
    setPkgError('');
    showToast(`Created new project slot "${newProj.name}"`);
  };

  const handleSelectProject = (projectId: string) => {
    const found = savedProjects.find((p) => p.id === projectId);
    if (found) {
      setCurrentProject(found);
      setHasCustomFileEdits(false);
      setPkgError('');
      showToast(`Switched to project "${found.name}" (${found.packageName})`);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (savedProjects.length <= 1) return;
    const remaining = savedProjects.filter((p) => p.id !== projectId);
    setSavedProjects(remaining);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remaining));
    if (currentProject.id === projectId) {
      setCurrentProject(remaining[0]);
      setHasCustomFileEdits(false);
    }
    if (user) {
      const path = `users/${user.uid}/projects`;
      try {
        await deleteDoc(doc(db, path, projectId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
    showToast('Removed project configuration');
  };

  const handleToggleIdea = (ideaTitle: string, forceAdd?: boolean) => {
    setCurrentProject((prev) => {
      const exists = prev.selectedIdeas.includes(ideaTitle);
      let nextIdeas = prev.selectedIdeas;
      if (forceAdd) {
        if (!exists) nextIdeas = [...prev.selectedIdeas, ideaTitle];
      } else {
        nextIdeas = exists
          ? prev.selectedIdeas.filter((i) => i !== ideaTitle)
          : [...prev.selectedIdeas, ideaTitle];
      }
      const updated = { ...prev, selectedIdeas: nextIdeas };
      const nextList = savedProjects.map((p) =>
        p.id === updated.id ? updated : p
      );
      setSavedProjects(nextList);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextList));
      return updated;
    });
  };

  const handleUpdateFiles = (newFiles: ProjectFile[]) => {
    setProjectFiles(newFiles);
    setHasCustomFileEdits(true);
  };

  const handleResetFiles = () => {
    setHasCustomFileEdits(false);
    setProjectFiles(generateDefaultProjectFiles(currentProject));
    showToast('Reset project files to clean baseline templates');
  };

  const compositeBootstrap = buildCompositeBootstrapScript(projectFiles);

  const handleSnapshotCurrentBootstrap = () => {
    navigator.clipboard.writeText(compositeBootstrap);
    handleLogCommand(
      `Bootstrap: ${currentProject.name} (${currentProject.packageName})`,
      compositeBootstrap,
      'bootstrap'
    );
    showToast(
      `Copied & logged "${currentProject.name}" bootstrap script to Command History`
    );
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col">
      {/* 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800/90 bg-slate-950/90">
        {/* Zone 1: Brand Title (Single text element) */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('setup');
          }}
          className="text-base font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0"
        >
          APK Creator Helper for Termux
        </a>

        {/* Zone 2: Primary Navigation Links */}
        <nav className="hidden xl:flex items-center gap-5 text-xs font-medium text-slate-400">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-1 transition-colors whitespace-nowrap cursor-pointer border-b-2 ${
                activeTab === tab.id
                  ? 'text-white border-blue-500 font-semibold'
                  : 'border-transparent hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Project Switcher + Auth Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <select
            aria-label="Switch Active Project"
            value={currentProject.id}
            onChange={(e) => handleSelectProject(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500 max-w-[180px] truncate"
          >
            {savedProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.packageName})
              </option>
            ))}
          </select>

          {user ? (
            <button
              type="button"
              onClick={() => signOut(auth)}
              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
            >
              Sign Out
            </button>
          ) : (
            <button
              type="button"
              onClick={() => signInWithPopup(auth, googleProvider)}
              className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Mobile / Tablet Responsive Tab Strip */}
      <div className="xl:hidden flex items-center gap-1.5 px-4 py-2.5 bg-slate-950 border-b border-slate-800 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Status Toast Banner */}
      {statusToast && (
        <div className="bg-emerald-950/90 border-b border-emerald-700/60 px-6 py-2 text-xs text-emerald-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Check size={14} />
            <span>{statusToast}</span>
          </span>
          <button
            type="button"
            onClick={() => setStatusToast('')}
            className="text-emerald-400 hover:text-white text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace + Persistent Command History Sidebar */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 flex flex-col xl:flex-row gap-6 items-start">
        {/* Primary Tab Viewport */}
        <main className="flex-1 min-w-0 w-full">
          {/* TAB 1: ENVIRONMENT SETUP */}
          {activeTab === 'setup' && (
            <div className="space-y-6">
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-semibold text-slate-100">
                      Termux APK Compilation Environment Setup
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                      Install all required Android command-line build tools directly inside Termux without needing Android Studio or Gradle.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTipsModalOpen(true)}
                    className="px-3.5 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Wrench size={14} />
                    <span>Open Termux Troubleshooting Modal</span>
                  </button>
                </div>

                <div className="mt-5">
                  <CodeViewer
                    title="Full Termux Toolchain Setup Command"
                    description="Updates package repositories and installs openjdk-17, aapt, ecj, dx, apksigner, and termux-api."
                    code={SETUP_COMMAND}
                    copyPayload={SETUP_COMMAND}
                    copyLabel="Copy Full Setup Command"
                    onCopyCallback={(payload) => {
                      handleLogCommand(
                        'Full Termux Environment Setup',
                        payload,
                        'setup'
                      );
                      showToast('Copied & logged setup command to Command History');
                    }}
                  />
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6">
                <h2 className="text-base font-semibold text-slate-100 mb-4">
                  Required Packages Overview
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {REQUIRED_PACKAGES.map((pkg) => (
                    <div
                      key={pkg.name}
                      className="p-4 rounded-md bg-slate-950/80 border border-slate-800/90"
                    >
                      <div className="text-sm font-mono font-semibold text-blue-400">
                        {pkg.name}
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        {pkg.role}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collapsible Termux Tips Section */}
              <TermuxTipsSection
                onLogCommand={(title, cmd, cat) => {
                  handleLogCommand(title, cmd, cat);
                  showToast(`Copied & logged "${title}" to Command History`);
                }}
                defaultExpanded={true}
              />
            </div>
          )}

          {/* TAB 2: PROJECT GENERATOR */}
          {activeTab === 'generator' && (
            <div className="space-y-6">
              {/* SDK Version Manager Collapsible Section */}
              <SdkVersionManager
                currentMinSdk={currentProject.minSdk}
                currentTargetSdk={currentProject.targetSdk}
                onUpdateSdk={handleUpdateSdk}
                onLogCommand={(title, cmd, cat) => {
                  handleLogCommand(title, cmd, cat);
                  showToast(`Copied & logged "${title}" to Command History`);
                }}
                defaultExpanded={false}
              />

              {/* Saved Projects Switcher & Configuration Form */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <h1 className="text-lg font-semibold text-slate-100">
                      Project Configuration &amp; Saved Profiles
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure your APK parameters and switch seamlessly between saved projects in LocalStorage{' '}
                      {user ? 'and Firebase Firestore' : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsBlankScannerOpen(true)}
                      className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap border border-emerald-500/30"
                    >
                      <FileCode size={14} />
                      <span>Blank Template &amp; Scanner</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSdkModalOpen(true)}
                      className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Sliders size={14} />
                      <span>SDK Manager</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsTipsModalOpen(true)}
                      className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Wrench size={14} />
                      <span>Termux Tips</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCreateNewProjectSlot}
                      className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <FolderPlus size={14} />
                      <span>New Project Slot</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveProjectConfig}
                      className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Save size={14} />
                      <span>Save Project Configuration</span>
                    </button>
                  </div>
                </div>

                {/* Saved Project Slots Strip */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 mr-1">
                    Saved Projects:
                  </span>
                  {savedProjects.map((proj) => {
                    const isCurrent = proj.id === currentProject.id;
                    return (
                      <div
                        key={proj.id}
                        className={`flex items-center rounded-md border text-xs transition-colors ${
                          isCurrent
                            ? 'bg-blue-950/40 border-blue-500/60 text-slate-100'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectProject(proj.id)}
                          className="px-3 py-1.5 font-medium cursor-pointer"
                        >
                          <span>{proj.name}</span>
                          <span className="text-slate-500 font-mono ml-1.5">
                            ({proj.packageName})
                          </span>
                        </button>
                        {savedProjects.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(proj.id)}
                            title="Delete saved project"
                            className="pr-2.5 pl-1 py-1.5 text-slate-500 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Form Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      App Name
                    </label>
                    <input
                      type="text"
                      value={currentProject.name}
                      onChange={(e) =>
                        setCurrentProject((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="MyApp"
                      className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Package Name (Reverse-Domain)
                    </label>
                    <input
                      type="text"
                      value={currentProject.packageName}
                      onChange={(e) => handlePackageNameChange(e.target.value)}
                      placeholder="com.example.myapp"
                      className={`w-full bg-slate-950 border rounded-md px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none ${
                        pkgError
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-slate-800 focus:border-blue-500'
                      }`}
                    />
                    {pkgError && (
                      <div className="flex items-start gap-1.5 text-red-400 text-xs mt-1.5">
                        <AlertCircle size={13} className="shrink-0 mt-0.5" />
                        <span>{pkgError}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Min SDK
                    </label>
                    <input
                      type="number"
                      min={14}
                      max={34}
                      value={currentProject.minSdk}
                      onChange={(e) =>
                        setCurrentProject((prev) => ({
                          ...prev,
                          minSdk: Number(e.target.value) || 21,
                        }))
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Target SDK
                    </label>
                    <input
                      type="number"
                      min={21}
                      max={35}
                      value={currentProject.targetSdk}
                      onChange={(e) =>
                        setCurrentProject((prev) => ({
                          ...prev,
                          targetSdk: Number(e.target.value) || 33,
                        }))
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Visual Build Pipeline Progress Indicator */}
              <BuildPipelineProgress
                projectConfig={currentProject}
                projectFiles={projectFiles}
                pkgError={pkgError}
                activeStageNumber={activeBuildStage}
                onActiveStageChange={setActiveBuildStage}
                onLogCommand={(title, cmd, cat) => {
                  handleLogCommand(title, cmd, cat);
                  showToast(`Copied & logged "${title}" to Command History`);
                }}
              />

              {/* Execution Logs Output Window */}
              <ExecutionLogsWindow
                projectConfig={currentProject}
                activeStageNumber={activeBuildStage}
                isBuilding={false}
                onLogCommand={(title, cmd) =>
                  handleLogCommand(title, cmd, 'bootstrap')
                }
                onTriggerSingleStage={(num) => setActiveBuildStage(num)}
              />

              {/* Primary Action: Complete Project Bootstrap */}
              <CodeViewer
                title="Complete Project Bootstrap Script (All-in-One Heredoc)"
                description="Creates all directories and writes AndroidManifest.xml, MainActivity.java, activity_main.xml, strings.xml, and build.sh in one paste."
                code={compositeBootstrap}
                copyPayload={compositeBootstrap}
                copyLabel="Copy Complete Project Bootstrap"
                onCopyCallback={(payload) => {
                  handleLogCommand(
                    `Bootstrap: ${currentProject.name} (${currentProject.packageName})`,
                    payload,
                    'bootstrap'
                  );
                  showToast(
                    `Copied & logged "${currentProject.name}" bootstrap script to Command History`
                  );
                }}
              />

              {/* Generated Files List with Collapsible Viewers & Individual Copy File Command Buttons */}
              <div className="space-y-3">
                <h2 className="text-base font-semibold text-slate-100">
                  Generated Project Files ({projectFiles.length})
                </h2>
                {projectFiles.map((file) => {
                  const lastSlash = file.path.lastIndexOf('/');
                  const dirPrefix =
                    lastSlash > 0
                      ? `mkdir -p ${file.path.substring(0, lastSlash)} && `
                      : '';
                  const fileHeredocCommand = `${dirPrefix}cat << 'EOF' > ${file.path}\n${file.content}\nEOF`;

                  return (
                    <CodeViewer
                      key={file.path}
                      title={file.path}
                      description={file.description}
                      code={file.content}
                      copyPayload={fileHeredocCommand}
                      copyLabel="Copy File Command"
                      collapsible={true}
                      defaultCollapsed={false}
                      onCopyCallback={(payload) => {
                        handleLogCommand(
                          `File: ${file.path}`,
                          payload,
                          'file'
                        );
                        showToast(
                          `Copied & logged "${file.path}" command to Command History`
                        );
                      }}
                    />
                  );
                })}
              </div>

              {/* Collapsible Termux Troubleshooting Tips right below the pipeline */}
              <TermuxTipsSection
                onLogCommand={(title, cmd, cat) => {
                  handleLogCommand(title, cmd, cat);
                  showToast(`Copied & logged "${title}" to Command History`);
                }}
                defaultExpanded={false}
              />
            </div>
          )}

          {/* TAB 3: BRAINSTORMING & GEMINI CHAT (Idea Buttons -> Push to Chat + Create Code) */}
          {activeTab === 'brainstorm' && (
            <BrainstormTab
              projectConfig={currentProject}
              projectFiles={projectFiles}
              onUpdateFiles={handleUpdateFiles}
              onToggleIdea={handleToggleIdea}
              onNavigateToExport={() => setActiveTab('export')}
            />
          )}

          {/* TAB 4: EXPORTABLE FILES (With Extra Ideas to Add More Code or Update Files) */}
          {activeTab === 'export' && (
            <ExportableFilesTab
              projectConfig={currentProject}
              projectFiles={projectFiles}
              onUpdateFiles={handleUpdateFiles}
              onResetFiles={handleResetFiles}
              onLogCommand={(title, cmd, cat) => {
                handleLogCommand(title, cmd, cat);
                showToast(`Copied & logged "${title}" to Command History`);
              }}
              onOpenBlankScanner={() => setIsBlankScannerOpen(true)}
            />
          )}

          {/* TAB 5: SUMMARY & WEB RESEARCH (App Idea Summary + Google Search Grounding) */}
          {activeTab === 'summary' && (
            <SummaryResearchTab
              projectConfig={currentProject}
              projectFiles={projectFiles}
            />
          )}

          {/* TAB 6: SOURCE CODE & REFERENCES */}
          {activeTab === 'source' && (
            <SourceCodeTab
              projectConfig={currentProject}
              projectFiles={projectFiles}
            />
          )}
        </main>

        {/* Persistent Command History Log Sidebar */}
        <CommandHistorySidebar
          history={commandHistory}
          onCopyEntry={(entry) =>
            showToast(`Copied "${entry.title}" from Command History`)
          }
          onTogglePin={handleTogglePinCommand}
          onDeleteEntry={handleDeleteCommandEntry}
          onClearUnpinned={handleClearUnpinnedCommands}
          onSnapshotCurrentProject={handleSnapshotCurrentBootstrap}
          onOpenTipsModal={() => setIsTipsModalOpen(true)}
        />
      </div>

      {/* Termux Tips Modal */}
      {isTipsModalOpen && (
        <TermuxTipsSection
          isModal={true}
          onCloseModal={() => setIsTipsModalOpen(false)}
          onLogCommand={(title, cmd, cat) => {
            handleLogCommand(title, cmd, cat);
            showToast(`Copied & logged "${title}" to Command History`);
          }}
        />
      )}

      {/* SDK Version Manager Modal */}
      {isSdkModalOpen && (
        <SdkVersionManager
          isModal={true}
          currentMinSdk={currentProject.minSdk}
          currentTargetSdk={currentProject.targetSdk}
          onUpdateSdk={handleUpdateSdk}
          onLogCommand={(title, cmd, cat) => {
            handleLogCommand(title, cmd, cat);
            showToast(`Copied & logged "${title}" to Command History`);
          }}
          onCloseModal={() => setIsSdkModalOpen(false)}
        />
      )}

      {/* Blank Configuration Template & Scanner Modal */}
      <BlankTemplateScannerModal
        isOpen={isBlankScannerOpen}
        onClose={() => setIsBlankScannerOpen(false)}
        currentProject={currentProject}
        onApplyScannedConfig={handleApplyScannedConfig}
        onLogCommand={(title, cmd, cat) => {
          handleLogCommand(title, cmd, cat);
          showToast(`Copied & logged "${title}" to Command History`);
        }}
      />
    </div>
  );
}

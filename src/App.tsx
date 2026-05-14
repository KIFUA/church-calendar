import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  setDoc,
  deleteDoc,
  getDoc,
  writeBatch,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { 
  Plus, 
  Trash2, 
  Lock, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Clock, 
  X, 
  Save, 
  Calendar,
  ChevronDown,
  ChevronUp,
  Copy,
  Pencil,
  Music,
  Users,
  Church,
  Printer,
  Download,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Type,
  Settings,
  Minus,
  Pin,
  Bell,
  Star,
  Menu,
  Send
} from 'lucide-react';
import { PreacherAssignment } from './components/PreacherAssignment';
import domtoimage from 'dom-to-image';
import { jsPDF } from 'jspdf';

const SettingsModal = ({ appSettings, setAppSettings, setIsEditingSettings, handleSaveSettings, ColorPicker, X, initialTab = 'name' }: any) => {
  const activeTab = initialTab;

  const getModalTitle = () => {
    switch (activeTab) {
      case 'name': return 'НАЗВА ТА ЛОГОТИП';
      case 'appearance': return 'ЗОВНІШНІЙ ВИГЛЯД';
      case 'fields': return 'ПОЛЯ ШАБЛОНІВ';
      case 'access': return 'ДЕЛЕГУВАННЯ ДОСТУПУ';
      case 'telegram': return 'ТЕЛЕГРАМ БОТ';
      default: return 'НАЛАШТУВАННЯ';
    }
  };

  const ALL_FIELDS = [
    { id: 'startTime', label: 'Час початку' },
    { id: 'endTime', label: 'Час закінчення' },
    { id: 'place', label: 'Місце' },
    { id: 'department', label: 'Відділ' },
    { id: 'leads', label: 'Служителі' },
    { id: 'music', label: 'Музика' },
    { id: 'formatting', label: 'Форматування' },
    { id: 'colors', label: 'Кольори' }
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setIsEditingSettings(false)}>
      <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0 relative">
          <button 
             onClick={() => setIsEditingSettings(false)}
             className="text-white hover:text-blue-400 transition-colors p-1 flex items-center gap-1 text-[0.625rem] font-bold"
          >
            ⬅ НАЗАД
          </button>
          <h3 className="text-white font-black uppercase text-[0.625rem] tracking-widest">{getModalTitle()}</h3>
          <button onClick={() => setIsEditingSettings(false)} className="text-slate-500 hover:text-white transition-colors p-1"><X size={16}/></button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto hide-scrollbar flex-1">
          {activeTab === 'name' && (
            <>
              <div>
                <label className="text-[0.5rem] font-black text-slate-500 uppercase block mb-1">Назва додатку</label>
                <input 
                  type="text" 
                  value={appSettings.name} 
                  onChange={(e) => setAppSettings((prev: any) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs font-bold outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[0.5rem] font-black text-slate-500 uppercase block mb-1">Підзаголовок</label>
                <input 
                  type="text" 
                  value={appSettings.subtitle} 
                  onChange={(e) => setAppSettings((prev: any) => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-[0.625rem] font-bold outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </>
          )}
          {activeTab === 'appearance' && (
            <>
              <ColorPicker label="Колір фону" value={appSettings.backgroundColor} onChange={(c: string) => setAppSettings((prev: any) => ({ ...prev, backgroundColor: c }))} />
              <ColorPicker label="Колір назви" value={appSettings.titleColor} onChange={(c: string) => setAppSettings((prev: any) => ({ ...prev, titleColor: c }))} />
              <ColorPicker label="Колір підзаголовка" value={appSettings.subtitleColor} onChange={(c: string) => setAppSettings((prev: any) => ({ ...prev, subtitleColor: c }))} />
              <ColorPicker label="Колір логотипу" value={appSettings.logoColor} onChange={(c: string) => setAppSettings((prev: any) => ({ ...prev, logoColor: c }))} />
            </>
          )}
          {activeTab === 'fields' && (
            <div className="text-white text-[0.625rem] space-y-4">
              <p className="text-slate-400 text-[0.5rem] italic">Створіть шаблони з різним набором полів для різних типів подій.</p>
              {(appSettings.eventTemplates || []).map((template: any, tIdx: number) => (
                <div key={tIdx} className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={template.name} 
                      onChange={(e) => {
                        const newTemplates = [...appSettings.eventTemplates];
                        newTemplates[tIdx] = { ...newTemplates[tIdx], name: e.target.value };
                        setAppSettings((prev: any) => ({ ...prev, eventTemplates: newTemplates }));
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold outline-none focus:border-blue-500"
                      placeholder="Назва шаблону..."
                    />
                    <button 
                      onClick={() => {
                        const newTemplates = appSettings.eventTemplates.filter((_: any, i: number) => i !== tIdx);
                        setAppSettings((prev: any) => ({ ...prev, eventTemplates: newTemplates }));
                      }}
                      className="text-red-500 hover:bg-red-500/10 p-1 rounded"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {ALL_FIELDS.map(field => (
                      <label key={field.id} className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={template.fields.includes(field.id)}
                          onChange={(e) => {
                            const newTemplates = [...appSettings.eventTemplates];
                            const fields = e.target.checked 
                              ? [...template.fields, field.id]
                              : template.fields.filter((f: string) => f !== field.id);
                            newTemplates[tIdx] = { ...newTemplates[tIdx], fields };
                            setAppSettings((prev: any) => ({ ...prev, eventTemplates: newTemplates }));
                          }}
                          className="w-3 h-3 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-0 focus:ring-offset-0"
                        />
                        <span className="text-slate-400 group-hover:text-white transition-colors">{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <button 
                onClick={() => {
                  const newTemplates = [...(appSettings.eventTemplates || []), { id: Date.now().toString(), name: 'Новий шаблон', fields: ['startTime', 'place'] }];
                  setAppSettings((prev: any) => ({ ...prev, eventTemplates: newTemplates }));
                }}
                className="w-full py-2 rounded-lg text-[0.5rem] font-black uppercase tracking-widest bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all border border-slate-700"
              >
                + Додати шаблон
              </button>
            </div>
          )}
          {activeTab === 'access' && (
            <div className="text-white text-[0.625rem] space-y-3">
              <div className="grid grid-cols-3 gap-2 font-black uppercase text-slate-500 mb-2">
                <span>Рівень</span>
                <span>Пароль</span>
                <span>Опис</span>
              </div>
              {(appSettings.accessLevels || [{ level: '', password: '', description: '' }]).map((item: any, index: number) => (
                <div key={index} className="grid grid-cols-3 gap-2">
                  <input 
                    type="text" 
                    value={item.level} 
                    onChange={(e) => {
                      const newLevels = [...(appSettings.accessLevels || [])];
                      newLevels[index] = { ...newLevels[index], level: e.target.value };
                      setAppSettings((prev: any) => ({ ...prev, accessLevels: newLevels }));
                    }}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-[0.625rem] font-bold outline-none focus:border-blue-500 transition-colors"
                  />
                  <input 
                    type="text" 
                    value={item.password} 
                    onChange={(e) => {
                      const newLevels = [...(appSettings.accessLevels || [])];
                      newLevels[index] = { ...newLevels[index], password: e.target.value };
                      setAppSettings((prev: any) => ({ ...prev, accessLevels: newLevels }));
                    }}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-[0.625rem] font-bold outline-none focus:border-blue-500 transition-colors"
                  />
                  <input 
                    type="text" 
                    value={item.description} 
                    onChange={(e) => {
                      const newLevels = [...(appSettings.accessLevels || [])];
                      newLevels[index] = { ...newLevels[index], description: e.target.value };
                      setAppSettings((prev: any) => ({ ...prev, accessLevels: newLevels }));
                    }}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-[0.625rem] font-bold outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              ))}
              <button 
                onClick={() => {
                  const newLevels = [...(appSettings.accessLevels || []), { level: '', password: '', description: '' }];
                  setAppSettings((prev: any) => ({ ...prev, accessLevels: newLevels }));
                }}
                className="w-full py-2 rounded-lg text-[0.5rem] font-black uppercase tracking-widest bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
              >
                + Додати рівень
              </button>
            </div>
          )}
          {activeTab === 'telegram' && (
            <div className="space-y-4">
              <div>
                <label className="text-[0.5rem] font-black text-slate-500 uppercase block mb-1">Bot Token (Токен бота)</label>
                <input 
                  type="text" 
                  value={appSettings.telegramBotToken || ''} 
                  onChange={(e) => setAppSettings((prev: any) => ({ ...prev, telegramBotToken: e.target.value }))}
                  placeholder="напр., 8789433370:AAEB...vQeYRKYc"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-[0.625rem] outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[0.5rem] font-black text-slate-500 uppercase block mb-1">Chat ID (ID чату/групи)</label>
                <input 
                  type="text" 
                  value={appSettings.telegramChatId || ''} 
                  onChange={(e) => setAppSettings((prev: any) => ({ ...prev, telegramChatId: e.target.value }))}
                  placeholder="напр., -100... або ваш особистий ID"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-[0.625rem] outline-none focus:border-blue-500 transition-colors"
                />
                <p className="text-slate-400 text-[0.5rem] mt-1 pr-2">
                  Щоб отримати ID чату або особистий ID, оберіть потрібний чат, додайте туди свого бота (зробіть адміном у випадку групи), і відправте йому тестове повідомлення. Тепер можна отримати Chat ID через API Telegram або ботів типу <code className="bg-slate-700 px-1 text-[0.4375rem] text-white rounded">@getidsbot</code>.
                </p>
              </div>
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl mt-2">
                <p className="text-red-400 text-[0.5625rem] font-bold">⚠️ Увага: планування (затримка) відправки</p>
                <p className="text-slate-300 text-[0.5rem] mt-1 leading-relaxed">
                  Телеграм не дозволяє відкладати повідомлення прямо через Bot API. Тому відкладені повідомлення зберігаються у базі, і будуть надіслані автоматично <b>тільки якщо додаток відкритий кимось із користувачів у відповідний час</b>.
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="p-3 border-t border-slate-800 bg-slate-900/50 flex gap-2 shrink-0">
          <button 
            onClick={() => setIsEditingSettings(false)}
            className="flex-1 py-2 rounded-lg text-[0.5rem] font-black uppercase tracking-widest bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
          >
            Скасувати
          </button>
          <button 
            onClick={() => {
              handleSaveSettings(appSettings.name, appSettings.subtitle, appSettings.themeBackground, appSettings.backgroundColor, appSettings.titleColor, appSettings.subtitleColor, appSettings.logoColor, appSettings.accessLevels, appSettings.eventTemplates, appSettings.telegramBotToken, appSettings.telegramChatId);
              setIsEditingSettings(false);
            }}
            className="flex-1 py-2 rounded-lg text-[0.5rem] font-black uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-500 transition-all"
          >
            Зберегти
          </button>
        </div>
      </div>
    </div>
  );
};

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Helper to automatically reduce font size if text overflows 2 lines
const AutoFitText = ({ text, className, style, defaultSize = 11, minSize = 7 }: { text: string, className?: string, style?: React.CSSProperties, defaultSize?: number, minSize?: number }) => {
  const textRef = useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) return;

    let currentSize = defaultSize;
    el.style.fontSize = `${currentSize}px`;

    // Force reflow and check if scrollHeight > clientHeight
    while (el.scrollHeight > el.clientHeight && currentSize > minSize) {
      currentSize -= 0.5;
      el.style.fontSize = `${currentSize}px`;
    }
  }, [text, defaultSize, minSize]);

  return (
    <div
      ref={textRef}
      className={className}
      style={{
        ...style,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        lineHeight: 1.2,
      }}
    >
      {text}
    </div>
  );
};

// Helper to move focus to the next focusable element
const focusNextElement = (currentElement: HTMLElement) => {
  const focusableElements = Array.from(document.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(el => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && (el as HTMLElement).offsetWidth > 0;
  });
  const index = focusableElements.indexOf(currentElement);
  if (index > -1 && index < focusableElements.length - 1) {
    (focusableElements[index + 1] as HTMLElement).focus();
  }
};

// Initialize Firebase safely
let app;
let auth;
let db;

try {
  // Only initialize if apiKey is present to avoid immediate crash
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } else {
    console.warn("Firebase config missing. App will run in demo/offline mode or fail to load data.");
  }
} catch (e) {
  console.error("Firebase initialization error:", e);
}

const appId = import.meta.env.VITE_APP_ID || 'church-calendar-if';
const initialAuthToken = import.meta.env.VITE_INITIAL_AUTH_TOKEN;

const sortAlphabetically = (arr) => [...arr].sort((a, b) => a.localeCompare(b, 'uk'));

// --- ПОЧАТКОВІ ДАНІ ---
const INITIAL_EVENT_GROUPS = [
  { label: "ОСНОВНІ ТА СВЯТА", items: ["Загальне зібрання", "П Р И Ч А С Т Я", "ВОДНЕ ХРЕЩЕННЯ", "П А С Х А", "Д Е Н Ь  50-і", "Р І З Д В О", "ЦЕРКОВНА РАДА"] },
  { label: "СЛУЖІННЯ ТА ГРУПИ", items: ["Молитовне", "Молодіжне", "Сестринське", "Лідерська", "Домашня група для жінок ВПО", "Домашня група Євстратова О.", "Сетр. група", "Підліткова група"] },
  { label: "ДІТИ ТА ШКОЛА", items: ["Клуб SineShine", "Уроки дітей клубу \"SunShine\"", "Біблійна Школа", "Денний центр роботи з дітьми"] },
  { label: "ОБЛАСНІ ЗАХОДИ", items: ["ОБЛАСНА РАДА СЛУЖИТЕЛІВ", "ОБЛАСНА ПРЕСВІТЕРСЬКА РАДА", "ОБЛАСНА КОНФЕРЕНЦІЯ", "ОБЛАСНА МОЛОДІЖНА КОНФЕРЕНЦІЯ", "ОБЛАСНА ЖІНОЧА КОНФЕРЕНЦІЯ"] },
  { label: "ГОСПОДАРСЬКІ", items: ["Прибирання сцени", "Прибирання залу"] }
];

const INITIAL_MUSIC_GROUPS = [
  { label: "ХОРИ ТА МУЗИКА", items: ["Хор центральний", "Хор молодіжний", "Хор підлітковий", "Хор дитячий", "Команда 1", "Команда 2", "Команда 3", "група \"BlessedTime\""] }
];

const INITIAL_STAFF_GROUPS = [
  { label: "НА ВСІ ДНІ", items: ["Веремій Юрій", "Бевзюк Вячеслав", "Черняк Валентин", "Карпюк Олег", "Черняк Василь", "Бурчак Юрій", "Галюк Богдан"] },
  { label: "ТІЛЬКИ НА БУДНІ", items: ["Вовчук Н.", "Дмитраш М.", "Євстратов О.", "Ліптуга Г.", "Марунчак В.", "Мельничук В.", "Несен Ю.", "Павлишак Ю.", "Решетило Р.", "Самелюк О.", "Скіцко І.", "Скіцко П.", "Скринник М.", "Стефурак Д.", "Шегда В.", "Федеркевич М.", "Фіцик Д.", "Черняк Віт.", "Черняк М."] },
  { label: "ХТО СПІВАЄ / ГРАЄ", items: ["Веремчук Т.", "Мельничук Х.", "Бабійчук А.", "Яців Х.", "Група прославлення №1", "Група прославлення №2", "Оркестр", "Квартет", "Соло"] }
];

const INITIAL_LOCATIONS = ["ЗАЛ", "ЇДАЛЬНЯ", "ЗАЛ + ЇДАЛЬНЯ", "КОНФЕРЕНЦ ЗАЛ", "ПРОСТІР", "МАЛИЙ ЗАЛ", "РЕП.БАЗА", "КЛАСИ НШ", "ОНЛАЙН"];
const INITIAL_DEPARTMENTS = ["ДИТЯЧИЙ", "ПІДЛІТКОВИЙ", "МОЛОДІЖНИЙ", "СОЦІАЛЬНИЙ", "ЖІНОЧИЙ"];

const INITIAL_TEXT_COLORS = [
  "#0077cc", "#dc2626", "#16a34a", "#9333ea", "#1e293b", "#991b1b", "#0ea5e9"
];

const getAutoColor = (eventTitle) => {
  if (eventTitle === "П Р И Ч А С Т Я" || eventTitle === "П А С Х А") return "#dc2626";
  if (eventTitle === "ВОДНЕ ХРЕЩЕННЯ") return "#003366";
  if (eventTitle === "Р І З Д В О") return "#0ea5e9";
  if (eventTitle === "Д Е Н Ь  50-і") return "#16a34a";
  if (eventTitle === "ЦЕРКОВНА РАДА") return "#991b1b";
  if (eventTitle.includes("ОБЛАСНА")) return "#003366";
  if (eventTitle.includes("SunShine") || eventTitle.includes("SineShine")) return "#9333ea";
  return "#0077cc";
};

const WEEKDAY_COLORS = { 1: "#E8E6D1", 2: "#E0E8D1", 3: "#F0F0F0", 4: "#D8CDBF", 5: "#E8D1D1", 6: "#CDE0F5", 0: "#C1D5D8" };
const BORDER_COLORS = { 1: "#F2C057", 2: "#A8D08D", 3: "#BFBFBF", 4: "#E4A073", 5: "#FF8080", 6: "#4A90E2", 0: "#3B9CB6" };
const SHORT_WEEKDAYS = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const FULL_WEEKDAYS = ["Неділя", "Понеділок", "Вівторок", "Середа", "Четвер", "П’ятниця", "Субота"];

const darkenHex = (hex: string, percent: number) => {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.floor(r * (1 - percent));
  g = Math.floor(g * (1 - percent));
  b = Math.floor(b * (1 - percent));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const CustomSelect = ({ value, options = [], onChange, placeholder, groups = null, onEditGroup = null, onAddItem = null, className = "w-full", title, disabled = false, onAssignPreachers = null, allowAppend = false }: {
  value: any;
  options?: string[];
  onChange: (val: any) => void;
  placeholder?: string;
  groups?: { label: string; items: string[] }[] | null;
  onEditGroup?: ((group: any) => void) | null;
  onAddItem?: ((item: string, groupIndex: number, groupLabel?: string) => void) | null;
  className?: string;
  title?: string;
  disabled?: boolean;
  onAssignPreachers?: (() => void) | null;
  allowAppend?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const checkScroll = () => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.stopPropagation();
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown, true);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setActiveGroupIndex(0);
      setSearchValue(value || "");
      // Small delay to allow DOM to render
      setTimeout(checkScroll, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && groups && value) {
        const idx = groups.findIndex(g => g.items.includes(value));
        if (idx !== -1) {
            setActiveGroupIndex(idx);
            // Scroll to active tab
            if (tabsRef.current) {
                const tabWidth = tabsRef.current.clientWidth / 2;
                tabsRef.current.scrollTo({ left: idx * tabWidth, behavior: 'auto' });
                setTimeout(checkScroll, 50);
            }
        }
    }
  }, [isOpen, groups, value]);

  const currentItems = groups ? (groups[activeGroupIndex]?.items || []) : options;
  const allAvailableItems = groups ? groups.flatMap(g => g.items) : options;
  
  // Split by common separators (comma, plus, semicolon, newline, or a standalone dash) to get the last typed segment
  const parts = searchValue.split(/[,+;\n]| - /);
  let activeQuery = parts[parts.length - 1].trim();

  // If the active query exactly matches an item from ANY group (e.g., just clicked from a list),
  // reset the query so the full list is visible again to allow appending from another tab context.
  if (activeQuery && allAvailableItems.some(item => item.toLowerCase() === activeQuery.toLowerCase())) {
    activeQuery = "";
  }

  const filteredItems = activeQuery 
    ? currentItems.filter(item => item.toLowerCase().includes(activeQuery.toLowerCase()))
    : currentItems;

  const handleListItemClick = (opt: string) => {
    const match = searchValue.match(/(.*(?:[,+;\n]| - ))(.*)$/);
    if (match) {
        setSearchValue(match[1] + (match[1].endsWith(' ') ? '' : ' ') + opt);
    } else {
        setSearchValue(opt);
    }
  };

  const handleSelect = (opt: string, append: boolean = false) => {
    if (append && value) {
      onChange(`${value} + ${opt}`);
    } else {
      onChange(opt);
      setIsOpen(false);
      setTimeout(() => {
        if (triggerRef.current) focusNextElement(triggerRef.current);
      }, 50);
    }
  };

  const content = (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center px-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-150" onClick={() => setIsOpen(false)}>
      <div 
        className={`bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-in zoom-in-95 duration-150 ${(!groups || groups.length <= 1) ? 'w-auto min-w-[15rem] max-w-[20rem]' : 'w-full max-w-[20rem]'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 py-1.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
           <span className="text-[0.5625rem] font-black uppercase text-slate-400 tracking-widest">{title || "Виберіть значення"}</span>
           <div className="flex items-center gap-1">
             {onAssignPreachers && title === "СЛУЖІННЯ" && (
               <button onClick={() => { onAssignPreachers(); setIsOpen(false); }} className="px-2 py-0.5 bg-blue-600 text-white text-[0.5625rem] font-black uppercase rounded hover:bg-blue-700 transition-colors">ПРИЗНАЧЕННЯ ПРОПОВІДНИКІВ</button>
             )}
             <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><X size={14} className="text-slate-400"/></button>
           </div>
        </div>

        {/* Manual Input / Search */}
        <div className="p-2 border-b border-slate-100">
          <div className="relative flex flex-col gap-2">
            <textarea 
              autoFocus
              rows={2}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Tab') {
                  e.preventDefault();
                  if (searchValue.trim()) {
                    onChange(searchValue.trim());
                  }
                  setIsOpen(false);
                  setTimeout(() => {
                    if (triggerRef.current) focusNextElement(triggerRef.current);
                  }, 50);
                }
              }}
              placeholder="Введіть або виберіть..." 
              className="w-full bg-slate-100 border-none rounded-lg px-3 py-2 text-[0.6875rem] font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
            <div className="flex gap-2 mt-2">
              <button 
                onClick={() => handleSelect(searchValue.trim())}
                className="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-[0.5625rem] font-black uppercase tracking-widest hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all active:scale-95"
              >
                Підтвердити
              </button>
              {allowAppend && (
                <button 
                  onClick={() => handleSelect(searchValue.trim(), true)}
                  className="flex-1 bg-amber-600 text-white py-1.5 rounded-lg text-[0.5625rem] font-black uppercase tracking-widest hover:bg-amber-700 shadow-md shadow-amber-600/20 transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  <Plus size={10} /> Додати до існуючого
                </button>
              )}
              {onAddItem && (groups || options.length > 0) && (
                <button 
                  onClick={() => { 
                    if (searchValue.trim()) {
                      onAddItem(searchValue.trim(), activeGroupIndex, groups ? groups[activeGroupIndex]?.label : undefined);
                      onChange(searchValue.trim());
                      setIsOpen(false);
                    }
                  }}
                  className="flex-1 bg-emerald-600 text-white py-1.5 rounded-lg text-[0.5625rem] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  <Plus size={10} /> Додати в список
                </button>
              )}
            </div>
          </div>
        </div>
        
        {groups ? (
          <div className="flex flex-col min-h-[12.5rem]">
              {/* Tabs Header */}
              {groups.length > 1 && (
              <div className="flex items-center bg-slate-50 border-b border-slate-200 shrink-0 relative">
                  {canScrollLeft && (
                  <button 
                      onClick={() => { tabsRef.current?.scrollBy({ left: -150, behavior: 'smooth' }); setTimeout(checkScroll, 300); }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors shrink-0 absolute left-0 z-10 bg-gradient-to-r from-slate-50 to-transparent"
                  >
                      <ChevronLeft size={12} className="text-white" />
                  </button>
                  )}
                  <div ref={tabsRef} onScroll={checkScroll} className="flex-1 flex overflow-x-auto [&::-webkit-scrollbar]:hidden snap-x">
                      {groups.map((group, idx) => (
                          <div 
                              key={idx}
                              onClick={() => setActiveGroupIndex(idx)}
                              className={`w-1/2 flex-shrink-0 px-2 py-2 text-[0.5625rem] font-black uppercase tracking-wider cursor-pointer whitespace-nowrap transition-colors border-b-2 flex items-center justify-center gap-1.5 snap-start ${activeGroupIndex === idx ? 'bg-white text-blue-600 border-blue-600' : 'text-slate-500 hover:bg-slate-100 border-transparent hover:border-slate-300'}`}
                          >
                              <span className="flex flex-col items-center justify-center leading-[1.1] w-full text-center">
                                {group.label.split(' ').length > 1 ? (
                                  <>
                                    <span className="truncate w-full">{group.label.split(' ')[0]}</span>
                                    <span className="truncate w-full">{group.label.split(' ').slice(1).join(' ')}</span>
                                  </>
                                ) : (
                                  <span className="truncate max-w-[90%]">{group.label}</span>
                                )}
                              </span>
                              {onEditGroup && activeGroupIndex === idx && (
                                  <button 
                                      onClick={(e) => { e.stopPropagation(); onEditGroup(group); setIsOpen(false); }}
                                      className="p-0.5 hover:bg-blue-50 rounded text-blue-500 transition-opacity"
                                  >
                                      <Pencil size={10} />
                                  </button>
                              )}
                          </div>
                      ))}
                  </div>
                  {canScrollRight && (
                  <button 
                      onClick={() => { tabsRef.current?.scrollBy({ left: 150, behavior: 'smooth' }); setTimeout(checkScroll, 300); }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors shrink-0 absolute right-0 z-10 bg-gradient-to-l from-slate-50 to-transparent"
                  >
                      <ChevronRight size={12} className="text-white" />
                  </button>
                  )}
              </div>
              )}
              
              {/* Items List */}
              <div className="flex-1 overflow-y-auto bg-white">
                  <div className="flex flex-col">
                    {sortAlphabetically(filteredItems).map((opt) => (
                        <div
                            key={opt}
                            className={`px-2 py-0 text-[0.5rem] font-bold cursor-pointer transition-colors border-b border-slate-50 last:border-0 text-left leading-tight flex items-center justify-between group ${
                                value === opt ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <div className="flex-1 py-[1px]" onClick={() => handleListItemClick(opt)}>
                              {opt}
                            </div>
                            {allowAppend && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSearchValue(prev => prev ? `${prev} + ${opt}` : opt); }}
                                className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-amber-100 text-amber-600 rounded transition-all"
                                title="Додати до поля вводу"
                              >
                                <Plus size={8} />
                              </button>
                            )}
                        </div>
                    ))}
                    {searchValue && filteredItems.length === 0 && (
                      <div className="p-4 text-center text-slate-400 text-[0.625rem] italic">
                        Нічого не знайдено. Натисніть "ОК" вище, щоб використати введений текст.
                      </div>
                    )}
                  </div>
              </div>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[18.75rem]">
            <div className="flex flex-col">
              {sortAlphabetically(filteredItems).map((opt) => (
                <div
                  key={opt}
                  className={`px-2 py-0 text-[0.5rem] font-bold cursor-pointer transition-colors border-b border-slate-50 last:border-0 text-left leading-tight flex items-center justify-between group ${
                    value === opt ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex-1 py-[1px] truncate" onClick={() => handleListItemClick(opt)}>
                    {opt}
                  </div>
                  {allowAppend && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSearchValue(prev => prev ? `${prev} + ${opt}` : opt); }}
                      className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-amber-100 text-amber-600 rounded transition-all"
                      title="Додати до поля вводу"
                    >
                      <Plus size={8} />
                    </button>
                  )}
                </div>
              ))}
              {searchValue && filteredItems.length === 0 && (
                <div className="p-4 text-center text-slate-400 text-[0.625rem] italic">
                  Нічого не знайдено. Натисніть "ОК" вище, щоб використати введений текст.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      <button 
        type="button"
        ref={triggerRef}
        onClick={() => !disabled && setIsOpen(true)}
        className={`w-full bg-white text-[0.5625rem] px-2 py-0 border border-slate-200 font-bold text-slate-900 flex justify-between items-center cursor-pointer hover:border-blue-400 h-6 shadow-sm rounded transition-colors text-left ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="truncate">{value || placeholder}</span>
        {!disabled && <ChevronDown size={10} className="text-slate-400 shrink-0 ml-1" />}
      </button>
      {isOpen && createPortal(content, document.body)}
    </div>
  );
};

const TimeInput = ({ value, onChange, label, disabled = false }) => {
  const [hh, mm] = (value || "").split(':');
  const mmRef = useRef(null);

  const handleHHChange = (e) => {
    e.stopPropagation();
    if (disabled) return;
    let val = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (parseInt(val) > 23) val = "23";
    onChange(`${val}:${mm || "00"}`);
    if (val.length === 2) mmRef.current?.focus();
  };

  const handleMMChange = (e) => {
    e.stopPropagation();
    if (disabled) return;
    let val = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (parseInt(val) > 59) val = "59";
    onChange(`${hh || "00"}:${val}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      focusNextElement(e.target as HTMLElement);
    }
  };

  return (
    <div className="flex flex-col">
      <label className="text-[0.4375rem] font-black text-slate-500 uppercase block mb-0.5 leading-none">{label}</label>
      <div className={`flex items-center bg-white border border-slate-200 px-1 h-6 shadow-sm ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <input type="text" disabled={disabled} value={hh || ""} onChange={handleHHChange} onKeyDown={handleKeyDown} placeholder="00" className="w-4 bg-transparent text-slate-900 text-[0.625rem] text-center outline-none font-bold p-0" />
        <span className="text-slate-400 text-[0.625rem] font-bold">:</span>
        <input ref={mmRef} type="text" disabled={disabled} value={mm || ""} onChange={handleMMChange} onKeyDown={handleKeyDown} placeholder="00" className="w-4 bg-transparent text-slate-900 text-[0.625rem] text-center outline-none font-bold p-0" />
      </div>
    </div>
  );
};

const THEME_BACKGROUNDS = [
  { id: 'none', label: 'Без фону', url: null },
  { id: 'scroll1', label: 'Сувій 1', url: 'https://www.transparentpng.com/download/scroll-paper/old-scroll-paper-png-25.png' },
  { id: 'scroll2', label: 'Сувій 2', url: 'https://www.pngall.com/wp-content/uploads/2016/03/Scroll-PNG-HD.png' },
  { id: 'scroll3', label: 'Сувій 3', url: 'https://pngimg.com/uploads/scroll/scroll_PNG25.png' },
];

import { HexColorPicker } from "react-colorful";

const COLOR_PRESETS = ['#ffffff', '#f87171', '#fb923c', '#facc15', '#4ade80', '#22d3ee', '#818cf8', '#e879f9'];

const ColorPicker = ({ label, value, onChange }: { label: string, value: string, onChange: (c: string) => void }) => {
  const [showCustom, setShowCustom] = useState(false);
  return (
    <div>
      <label className="text-[0.5rem] font-black text-slate-500 uppercase block mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <button onClick={() => setShowCustom(!showCustom)} className="w-8 h-8 rounded cursor-pointer border border-slate-700" style={{ backgroundColor: value }} />
        <div className="flex flex-wrap gap-1">
          {COLOR_PRESETS.map(c => (
            <button key={c} onClick={() => onChange(c)} className="w-5 h-5 rounded-sm" style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
      {showCustom && (
        <div className="mt-2 p-2 bg-slate-800 rounded-lg">
          <HexColorPicker color={value} onChange={onChange} />
        </div>
      )}
    </div>
  );
};

const MiniCalendar = ({ selectedDate, onSelect }: { selectedDate: Date, onSelect: (d: Date) => void }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  useEffect(() => {
    setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [selectedDate]);

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  
  const days = [];
  let startDayIndex = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  for (let i = 0; i < startDayIndex; i++) {
    days.push(null);
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }

  const weekDays = ['Пн', 'Вв', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

  return (
    <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-700/50 shadow-xl backdrop-blur-sm w-full max-w-[12.1875rem] md:landscape:max-w-[18.75rem] md:portrait:max-w-[13.75rem] mx-auto">
      <div className="flex justify-between items-center mb-3">
        <button onClick={prevMonth} className="p-1 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={16} /></button>
        <div className="text-white font-bold text-[0.8125rem] uppercase tracking-wider">
          {currentMonth.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' })}
        </div>
        <button onClick={nextMonth} className="p-1 text-slate-400 hover:text-white transition-colors"><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 gap-x-1 mb-2">
        {weekDays.map((wd, i) => (
          <div key={wd} className={`text-center text-[0.75rem] font-black uppercase ${i === 5 ? 'text-blue-400' : i === 6 ? 'text-red-400' : 'text-slate-500'}`}>
            {wd}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1 gap-x-1">
        {days.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} className="h-[1.25rem] w-[1.25rem] mx-auto" />;
          const isSelected = d.toDateString() === selectedDate.toDateString();
          const isToday = d.toDateString() === new Date().toDateString();
          const dayOfWeek = d.getDay();
          const isSaturday = dayOfWeek === 6;
          const isSunday = dayOfWeek === 0;
          
          let textColor = 'text-slate-300';
          if (isSelected) textColor = 'text-white';
          else if (isSaturday) textColor = 'text-blue-300';
          else if (isSunday) textColor = 'text-red-400';

          return (
            <button
              key={i}
              onClick={() => onSelect(d)}
              className={`h-[1.25rem] w-[1.25rem] mx-auto flex items-center justify-center rounded-full text-[0.6875rem] font-bold transition-all
                ${isSelected ? 'bg-blue-600 shadow-md scale-110 z-10' : 'hover:bg-slate-800'}
                ${textColor}
              `}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const formatLeadDisplay = (lead: string) => {
  const abbrMap: Record<string, string> = {
    'ПРОПОВІДЬ': 'пропов.',
    'ВЕДУЧИЙ': 'ведуч.',
    'ВІДПОВІДАЛЬНИЙ': 'відпов.',
    'ПРИЧАСТЯ': 'Прич.',
    'ХРАЩЕННЯ': 'Хрещ.',
    'ХРЕЩЕННЯ': 'Хрещ.'
  };

  let isVeduchyi = false;
  let isVidpovidalnyi = false;
  
  let namePart = lead;
  let rolePart = '';
  let numberPart = '';

  if (lead.includes('|')) {
    const [number, shortFunc, fullFunc, name] = lead.split('|');
    numberPart = number ? `${number} ` : '';
    namePart = name;
    rolePart = fullFunc;
    isVeduchyi = fullFunc.toUpperCase() === 'ВЕДУЧИЙ';
    isVidpovidalnyi = fullFunc.toUpperCase() === 'ВІДПОВІДАЛЬНИЙ';
  } else {
    isVeduchyi = lead.toUpperCase().includes('ВЕДУЧИЙ');
    isVidpovidalnyi = lead.toUpperCase().includes('ВІДПОВІДАЛЬНИЙ');
    
    const match = lead.match(/(.*?)\((.*?)\)(.*)/);
    if (match) {
      namePart = match[1].trim() + (match[3] ? ' ' + match[3].trim() : '');
      rolePart = match[2].trim();
    } else {
      for (const role of Object.keys(abbrMap)) {
        const regex = new RegExp(`\\b${role}\\b`, 'gi');
        if (regex.test(lead)) {
          rolePart = role;
          namePart = lead.replace(regex, '').trim();
          break;
        }
      }
    }
  }

  const color = isVeduchyi ? '#16a34a' : (isVidpovidalnyi ? '#dc2626' : '#003366');
  
  if (rolePart) {
    let abbr = rolePart;
    for (const [full, a] of Object.entries(abbrMap)) {
      const regex = new RegExp(full, 'gi');
      if (regex.test(rolePart)) {
        abbr = rolePart.replace(regex, a);
        break;
      }
    }
    
    return (
      <span className="min-w-0 flex-1" style={{ color }}>
        {numberPart}{namePart} <span style={{ fontSize: '0.75em' }}>({abbr})</span>
      </span>
    );
  }

  return (
    <span className="min-w-0 flex-1" style={{ color }}>
      {lead.replace(/прич\.|причастя/gi, 'Прич.')}
    </span>
  );
};

const isEventArchived = (dateKey: string | null) => {
  if (!dateKey || dateKey.startsWith('template_')) return false;
  const t = new Date();
  const currentMonthKey = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`;
  return dateKey.substring(0, 7) < currentMonthKey;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('view');
  const [events, setEvents] = useState([]);
  const [eventTemplates, setEventTemplates] = useState<Record<number, any[]>>({});
  const [monthlyThemes, setMonthlyThemes] = useState<Record<string, any>>({});
  const [appSettings, setAppSettings] = useState({ 
    name: "КАЛЕНДАРНИЙ ПЛАН", 
    subtitle: "УЦХВЄ м. Івано-Франківська", 
    logo: null,
    themeBackground: 'none',
    themeFontSize: 16,
    backgroundColor: '#1e293b',
    titleColor: '#ffffff',
    subtitleColor: '#94a3b8',
    logoColor: '#ffffff',
    eventTemplates: [
      { id: 'full', name: 'Повний набір', fields: ['startTime', 'endTime', 'place', 'leads', 'music', 'formatting', 'colors'] },
      { id: 'short', name: 'Скорочений', fields: ['startTime', 'place', 'leads'] },
      { id: 'title', name: 'Тільки назва', fields: [] }
    ]
  });
  const [isEditingTheme, setIsEditingTheme] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'name' | 'appearance' | 'access' | 'fields'>('name');
  const [themeText, setThemeText] = useState("");
  const [themeAlign, setThemeAlign] = useState<'left'|'center'|'right'|'justify'>('center');
  const [themeWeight, setThemeWeight] = useState<'400'|'500'|'600'|'700'>('500');
  const [themeColor, setThemeColor] = useState<string>('#5c3a21');
  const [themeFontSizeLocal, setThemeFontSizeLocal] = useState<number>(13);
  const [statsStartMonth, setStatsStartMonth] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [statsEndMonth, setStatsEndMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [themeTransform, setThemeTransform] = useState<'uppercase'|'none'>('uppercase');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'preacher_manager' | 'singer_manager' | null>(null);
  const [password, setPassword] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dayViewPivotDate, setDayViewPivotDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [openNestedSubmenu, setOpenNestedSubmenu] = useState<string | null>(null);
  const [activeEditingMode, setActiveEditingMode] = useState<'full' | 'preacher' | 'music'>('full');
  const [passwordPrompt, setPasswordPrompt] = useState<{ isOpen: boolean, action: string | null, error?: string | null }>({ isOpen: false, action: null });
  const [selectedDayForEvent, setSelectedDayForEvent] = useState(null);
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [pendingAssignmentCallback, setPendingAssignmentCallback] = useState<((val: string) => void) | null>(null);
  const [reminderModalData, setReminderModalData] = useState<{
    date: Date;
    time: string;
    email: string;
    text: string;
    isOpen: boolean;
    showCalendar?: boolean;
  } | null>(null);
  const miniCalendarRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (miniCalendarRef.current) {
      miniCalendarRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (selectedDayForEvent && modalRef.current && !modalRef.current.contains(document.activeElement)) {
      modalRef.current.focus();
    }
  }, [selectedDayForEvent]);
  const [showPreacherTable, setShowPreacherTable] = useState(false);
  
  const updateThemeFontSize = async (delta: number) => {
    const newSize = Math.max(8, Math.min(48, (appSettings.themeFontSize || 16) + delta));
    setAppSettings(prev => ({ ...prev, themeFontSize: newSize }));
    if (isAdminAuthenticated && db) {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'general'), { themeFontSize: newSize }, { merge: true });
    }
  };

  // Динамічні довідники
  const [eventGroups, setEventGroups] = useState(INITIAL_EVENT_GROUPS);
  const [musicGroups, setMusicGroups] = useState(INITIAL_MUSIC_GROUPS);
  const [staffGroups, setStaffGroups] = useState(INITIAL_STAFF_GROUPS);
  const [locations, setLocations] = useState(INITIAL_LOCATIONS);
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const maxLocationLength = Math.max(...locations.map(l => l.length), 8);
  const [textColors, setTextColors] = useState(INITIAL_TEXT_COLORS);
  const [listsLoaded, setListsLoaded] = useState(false);
  const listsRef = useRef(null);
  
  const [editingGroup, setEditingGroup] = useState(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [editingEventIndex, setEditingEventIndex] = useState<number | null>(null);
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);

  useEffect(() => {
    if (viewMode === 'day') {
      setDayViewPivotDate(new Date(selectedDate));
    }
  }, [viewMode]);

  const today = new Date();
  
  useEffect(() => {
    if (selectedDayForEvent === null) {
      setEditingEventIndex(null);
    }
  }, [selectedDayForEvent]);
  
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (passwordPrompt.isOpen) setPasswordPrompt({ isOpen: false, action: null, error: null });
        else if (confirmAction) setConfirmAction(null);
        else if (isEditingSettings) setIsEditingSettings(false);
        else if (isEditingTheme) setIsEditingTheme(false);
        else if (isAssignmentModalOpen) setIsAssignmentModalOpen(false);
        else if (reminderModalData?.isOpen) setReminderModalData(null);
        else if (selectedDayForEvent) setSelectedDayForEvent(null);
        else if (isHamburgerOpen) setIsHamburgerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [passwordPrompt.isOpen, confirmAction, isEditingSettings, isEditingTheme, isAssignmentModalOpen, reminderModalData?.isOpen, selectedDayForEvent, isHamburgerOpen]);

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (initialAuthToken && initialAuthToken.split('.').length === 3) {
          try {
            await signInWithCustomToken(auth, initialAuthToken);
          } catch (e) {
            console.error("Custom token auth failed", e);
            await signInAnonymously(auth);
          }
        } else {
          if (initialAuthToken) {
            console.warn("VITE_INITIAL_AUTH_TOKEN is set but invalid, falling back to anonymous auth.");
          }
          await signInAnonymously(auth);
        }
        setAuthError(null);
      } catch (e) {
        console.error("Auth failed:", e);
        setAuthError(e.message);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'calendar_events');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error(err));

    const qThemes = collection(db, 'artifacts', appId, 'public', 'data', 'monthly_themes');
    const unsubscribeThemes = onSnapshot(qThemes, (snapshot) => {
      const themes: Record<string, string> = {};
      snapshot.docs.forEach(d => {
        themes[d.id] = d.data().theme || "";
      });
      setMonthlyThemes(themes);
    }, (err) => console.error(err));

    const qLists = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'lists');
    const unsubscribeLists = onSnapshot(qLists, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const dataStr = JSON.stringify(data);
        if (listsRef.current !== dataStr) {
          listsRef.current = dataStr;
          if (data.eventGroups) setEventGroups(data.eventGroups);
          if (data.musicGroups) setMusicGroups(data.musicGroups);
          if (data.staffGroups) setStaffGroups(data.staffGroups);
          if (data.locations) setLocations(data.locations);
          if (data.departments) setDepartments(data.departments);
          if (data.textColors) setTextColors(data.textColors);
        }
      }
      setListsLoaded(true);
    }, (err) => console.error(err));

    const unsubscribeSettings = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAppSettings(prev => ({ ...prev, ...data }));
      }
    }, (err) => console.error(err));

    const qTemplates = collection(db, 'artifacts', appId, 'public', 'data', 'event_templates');
    const unsubscribeTemplates = onSnapshot(qTemplates, (snapshot) => {
      const temps: Record<number, any[]> = {};
      snapshot.docs.forEach(d => {
        temps[parseInt(d.id)] = d.data().events || [];
      });
      setEventTemplates(temps);
    }, (err) => console.error(err));

    return () => {
      unsubscribe();
      unsubscribeThemes();
      unsubscribeLists();
      unsubscribeSettings();
      unsubscribeTemplates();
    };
  }, [db]);

  // Frontend CRON for sending reminders
  useEffect(() => {
    if (!db || !appSettings.telegramBotToken || !appSettings.telegramChatId) return;
    
    const checkReminders = async () => {
      try {
        const remindersRef = collection(db, 'artifacts', appId, 'public', 'data', 'reminders');
        const q = query(remindersRef, where('status', '==', 'pending'));
        const snap = await getDocs(q);
        const now = new Date();
        
        snap.forEach(async (docSnap) => {
          const data = docSnap.data();
          if (new Date(data.triggerAt) <= now) {
            // Attempt to send via Telegram
            if (data.type === 'telegram') {
              const text = `${data.text || ''}`;
              try {
                const res = await fetch(`https://api.telegram.org/bot${appSettings.telegramBotToken}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: appSettings.telegramChatId,
                    text: text,
                    parse_mode: 'Markdown'
                  })
                });
                
                if (res.ok) {
                  await setDoc(docSnap.ref, { status: 'sent', sentAt: new Date().toISOString() }, { merge: true });
                }
              } catch (e) {
                console.error("Failed to send telegram reminder", e);
              }
            }
          }
        });
      } catch (err) {
        console.error("Cron check failed:", err);
      }
    };
    
    // Check immediately on load, then every 60 seconds
    const timeout = setTimeout(checkReminders, 2000);
    const interval = setInterval(checkReminders, 60000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [db, appSettings?.telegramBotToken, appSettings?.telegramChatId]);

  const saveTemplate = async (weekday: number, templateEvents: any[]) => {
    if (!isAdminAuthenticated || !db) return;
    
    try {
      // 1. Save the template itself
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'event_templates', weekday.toString()), { events: templateEvents }, { merge: true });
      
      // 2. Generate events for future dates (next 12 months)
      const now = new Date();
      const lastDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const startDate = new Date(now);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 12);
      
      const batch: Promise<any>[] = [];
      let current = new Date(startDate);
      
      while (current <= endDate) {
        if (current.getDay() === weekday) {
          // Rule: Only update if date > last day of current month
          if (current > lastDayOfCurrentMonth) {
            const dateKey = formatDateKey(current);
            const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'calendar_events', dateKey);
            
            // Load existing events
            const docSnap = await getDoc(docRef);
            let existingEvents = [];
            if (docSnap.exists()) {
              existingEvents = docSnap.data().events || [];
            }
            
            // Filter out old template events
            const newGeneratedEvents = generateEventsFromTemplate(templateEvents, dateKey);
            const sourceTemplateEventIds = new Set(newGeneratedEvents.map(e => e.sourceTemplateEventId));
            const filteredEvents = existingEvents.filter(e => !sourceTemplateEventIds.has(e.sourceTemplateEventId));
            
            // Add new template events
            const finalEvents = [...filteredEvents, ...newGeneratedEvents];
            
            batch.push(setDoc(docRef, { events: finalEvents }, { merge: true }));
          }
        }
        current.setDate(current.getDate() + 1);
      }
      
      await Promise.all(batch);
      alert("Шаблон збережено! Події оновлено лише для майбутніх місяців.");
      setSelectedDayForEvent(null);
    } catch (err) {
      console.error("Error saving template:", err);
      alert("Помилка збереження шаблону: " + err.message);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAppSettings(prev => ({ ...prev, logo: result }));
        if (isAdminAuthenticated && db) {
          setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'general'), { logo: result }, { merge: true });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async (name: string, subtitle: string, themeBackground: string, backgroundColor: string, titleColor: string, subtitleColor: string, logoColor: string, accessLevels: any[], eventTemplates: any[], telegramBotToken?: string, telegramChatId?: string) => {
    setAppSettings(prev => ({ ...prev, name, subtitle, themeBackground, backgroundColor, titleColor, subtitleColor, logoColor, accessLevels, eventTemplates, telegramBotToken, telegramChatId }));
    if (isAdminAuthenticated && db) {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'general'), { name, subtitle, themeBackground, backgroundColor, titleColor, subtitleColor, logoColor, accessLevels, eventTemplates, telegramBotToken, telegramChatId }, { merge: true });
    }
  };

  useEffect(() => {
    if (!listsLoaded || !isAdminAuthenticated || !db) return;
    const currentData = { eventGroups, musicGroups, staffGroups, locations, departments, textColors };
    const currentDataStr = JSON.stringify(currentData);
    if (listsRef.current === currentDataStr) return;
    
    listsRef.current = currentDataStr;
    const saveLists = async () => {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'lists'), currentData, { merge: true });
      } catch (err) {
        console.error("Error saving lists: ", err);
      }
    };
    saveLists();
  }, [eventGroups, musicGroups, staffGroups, locations, departments, textColors, listsLoaded, isAdminAuthenticated, db]);

  const saveTheme = async (monthKey, text) => {
    // Якщо ми не в режимі адміна або база не ініціалізована - попереджаємо
    if (!isAdminAuthenticated || !db) {
      setMonthlyThemes(prev => ({ ...prev, [monthKey]: { ...prev[monthKey], theme: text || "" } }));
      setIsEditingTheme(false);
      alert("Увага: Ви не авторизовані або база не підключена. Зміни збережено лише тимчасово (до оновлення сторінки).");
      return;
    }

    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'monthly_themes', monthKey), { 
        theme: text || "",
        align: themeAlign,
        weight: themeWeight,
        size: themeFontSizeLocal,
        color: themeColor,
        transform: themeTransform
      }, { merge: true });
      setMonthlyThemes(prev => ({ ...prev, [monthKey]: { 
        theme: text || "",
        align: themeAlign,
        weight: themeWeight,
        size: themeFontSizeLocal,
        color: themeColor,
        transform: themeTransform
      } }));
      setIsEditingTheme(false);
      alert("Текст збережено успішно!");
    } catch (err) {
      console.error("Error saving theme: ", err);
      alert("Помилка збереження на сервері: " + err.message);
    }
  };

  const openThemeEditor = (monthKey: string) => {
    const data = monthlyThemes[monthKey] || {};
    setThemeText(typeof data === 'string' ? data : (data.theme || ""));
    const styleData = typeof data === 'string' ? {} : data;
    setThemeAlign(styleData.align || 'center');
    setThemeWeight(styleData.weight || '500');
    setThemeFontSizeLocal(styleData.size || appSettings.themeFontSize || 13);
    setThemeColor(styleData.color || '#5c3a21');
    setThemeTransform(styleData.transform || 'uppercase');
    setIsEditingTheme(true);
  };

  const getDayEvents = (dateKey: string, date: Date) => {
    const dayData = events.find(e => e.id === dateKey);
    return dayData?.events || [];
  };

  const moveGroup = (idx, fromType, toType) => {
    let group;
    if (fromType === 'event') {
      group = eventGroups[idx];
      setEventGroups(prev => prev.filter((_, i) => i !== idx));
    } else if (fromType === 'music') {
      group = musicGroups[idx];
      setMusicGroups(prev => prev.filter((_, i) => i !== idx));
    } else if (fromType === 'staff') {
      group = staffGroups[idx];
      setStaffGroups(prev => prev.filter((_, i) => i !== idx));
    }

    if (toType === 'event') {
      setEventGroups(prev => [...prev, group]);
    } else if (toType === 'music') {
      setMusicGroups(prev => [...prev, group]);
    } else if (toType === 'staff') {
      setStaffGroups(prev => [...prev, group]);
    }
  };

  const commitToDB = async (dateKey, dayEvents, closeAfter = true) => {
    if (!isAdminAuthenticated) {
      alert("Ви повинні увійти в режим редагування, щоб зберігати зміни.");
      return;
    }
    if (!db) {
      alert("База даних не підключена. Перевірте налаштування Firebase.");
      return;
    }
    
    if (dateKey.startsWith('template_')) return;

    try {
      const sortedEvents = [...dayEvents].sort((a, b) => {
        const aNoTimeLoc = (!a.startTime || a.startTime.trim() === '') && (!a.place || a.place.trim() === '');
        const bNoTimeLoc = (!b.startTime || b.startTime.trim() === '') && (!b.place || b.place.trim() === '');
        if (aNoTimeLoc && !bNoTimeLoc) return -1;
        if (!aNoTimeLoc && bNoTimeLoc) return 1;
        return (a.startTime || "99:99").localeCompare(b.startTime || "99:99");
      });
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'calendar_events', dateKey), { events: sortedEvents }, { merge: true });
      if (closeAfter) {
        setSelectedDayForEvent(null);
      }
      console.log("Дані збережено в Firebase");
    } catch (err) {
      console.error("Error saving document: ", err);
      alert("Помилка збереження подій: " + err.message);
    }
  };

  const updateLocalDetails = (dateKey, index, field, value) => {
    const isTemplate = dateKey.startsWith('template_');
    const weekdayIndex = isTemplate ? parseInt(dateKey.split('_')[1]) : 0;
    
    let dayEvents = [];
    if (isTemplate) {
      dayEvents = eventTemplates[weekdayIndex] || [];
    } else {
      const [year, month, day] = dateKey.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      dayEvents = getDayEvents(dateKey, date);
    }
    
    const newEvents = [...dayEvents];
    const updatedEvent = { ...newEvents[index], [field]: value };
    
    // If editing in calendar (not template), remove sourceTemplateEventId to decouple
    if (!isTemplate) {
      delete updatedEvent.sourceTemplateEventId;
    }

    if (field === 'title' && !updatedEvent.isColorManuallySet) {
      updatedEvent.textColor = getAutoColor(value);
    }
    if (field === 'textColor') {
      updatedEvent.isColorManuallySet = true;
    }
    newEvents[index] = updatedEvent;

    if (isTemplate) {
      setEventTemplates(prev => ({ ...prev, [weekdayIndex]: newEvents }));
    } else {
      setEvents(prev => {
        const existing = prev.find(d => d.id === dateKey);
        if (existing) return prev.map(d => d.id === dateKey ? { ...d, events: newEvents } : d);
        return [...prev, { id: dateKey, events: newEvents }];
      });
    }
  };

  const handleAddValueToGroup = (item: string, groupIndex: number, type: 'staff' | 'music' | 'location' | 'event' | 'department', groupLabel?: string) => {
    if (!item.trim()) return;
    const val = item.trim();

    if (type === 'staff') {
      const filteredGroups = staffGroups.filter(g => g.label !== "Хто співає / грає");
      const targetGroupLabel = groupLabel || (groupIndex < filteredGroups.length ? filteredGroups[groupIndex].label : null);
      if (!targetGroupLabel) return;
      setStaffGroups(prev => prev.map(g => {
        if (g.label === targetGroupLabel && !g.items.includes(val)) {
          return { ...g, items: [...g.items, val] };
        }
        return g;
      }));
    } else if (type === 'music') {
      const targetGroupLabel = groupLabel || (groupIndex < musicGroups.length ? musicGroups[groupIndex].label : null);
      if (!targetGroupLabel) return;
      setMusicGroups(prev => prev.map(g => {
        if (g.label === targetGroupLabel && !g.items.includes(val)) {
          return { ...g, items: [...g.items, val] };
        }
        return g;
      }));
    } else if (type === 'event') {
      const targetGroupLabel = groupLabel || (groupIndex < eventGroups.length ? eventGroups[groupIndex].label : null);
      if (!targetGroupLabel) return;
      setEventGroups(prev => prev.map(g => {
        if (g.label === targetGroupLabel && !g.items.includes(val)) {
          return { ...g, items: [...g.items, val] };
        }
        return g;
      }));
    } else if (type === 'location') {
      setLocations(prev => prev.includes(val) ? prev : [...prev, val]);
    } else if (type === 'department') {
      setDepartments(prev => prev.includes(val) ? prev : [...prev, val]);
    }
  };

  const addEventToDay = (dateKey: string) => {
    const isTemplate = dateKey.startsWith('template_');
    const weekdayIndex = isTemplate ? parseInt(dateKey.split('_')[1]) : 0;
    
    let dayEvents = [];
    if (isTemplate) {
      dayEvents = eventTemplates[weekdayIndex] || [];
    } else {
      const [year, month, day] = dateKey.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      dayEvents = getDayEvents(dateKey, date);
    }

    const defaultTemplateId = appSettings.eventTemplates?.[0]?.id || 'full';
    const newEvents = [...dayEvents, { 
      title: "", 
      startTime: "", 
      endTime: "", 
      place: "", 
      leads: [""], 
      music: "", 
      textColor: textColors[0] || "#0077cc", 
      align: "left", 
      isBold: true, 
      isItalic: false, 
      isUnderline: false, 
      isUppercase: true, 
      templateId: defaultTemplateId
    }];
    
    if (isTemplate) {
      setEventTemplates(prev => ({ ...prev, [weekdayIndex]: newEvents }));
      setEditingEventIndex(newEvents.length - 1);
    } else {
      setEvents(prev => {
        const existing = prev.find(d => d.id === dateKey);
        if (existing) return prev.map(d => d.id === dateKey ? { ...d, events: newEvents } : d);
        return [...prev, { id: dateKey, events: newEvents }];
      });
      setEditingEventIndex(newEvents.length - 1);
    }
  };

  const handleAddItemToGroup = () => {
    if (!newItemName.trim() || !editingGroup) return;
    if (editingGroup.type === 'location') {
      setLocations(prev => [...prev, newItemName.trim()]);
      setEditingGroup(prev => ({...prev, items: [...prev.items, newItemName.trim()]}));
    } else if (editingGroup.type === 'department') {
      setDepartments(prev => [...prev, newItemName.trim()]);
      setEditingGroup(prev => ({...prev, items: [...prev.items, newItemName.trim()]}));
    } else {
      const updateFn = (groups) => groups.map(g => g.label === editingGroup.label ? { ...g, items: [...g.items, newItemName.trim()] } : g);
      if (editingGroup.type === 'event') { setEventGroups(updateFn); } 
      else if (editingGroup.type === 'music') { setMusicGroups(updateFn); } 
      else if (editingGroup.type === 'staff') { setStaffGroups(updateFn); }
      setEditingGroup(prev => ({...prev, items: [...prev.items, newItemName.trim()]}));
    }
    setNewItemName("");
  };

  const activateMode = (mode: 'full' | 'preacher' | 'music') => {
    setActiveEditingMode(mode);
    if (mode === 'full') {
      setActiveTab('admin');
      setShowPreacherTable(false);
    } else if (mode === 'preacher') {
      setActiveTab('view');
      setViewMode('month');
      setShowPreacherTable(true);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      setSelectedDate(nextMonth);
    } else if (mode === 'music') {
      setActiveTab('admin');
      setShowPreacherTable(false);
    }
  };

  const handleActionClick = (mode: 'full' | 'preacher' | 'music') => {
    // If already authenticated, check if role allows this action
    if (isAdminAuthenticated) {
      let hasAccess = false;
      if (mode === 'full') hasAccess = userRole === 'admin';
      else if (mode === 'preacher') hasAccess = userRole === 'admin' || userRole === 'preacher_manager';
      else if (mode === 'music') hasAccess = userRole === 'admin' || userRole === 'singer_manager';
      
      if (hasAccess) {
        activateMode(mode);
        setIsHamburgerOpen(false);
        return;
      }
    }
    // Else, prompt for password
    setPasswordPrompt({ isOpen: true, action: mode });
    setIsHamburgerOpen(false);
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
    setUserRole(null);
    setActiveEditingMode('full');
    setShowPreacherTable(false);
    setActiveTab('view');
    setViewMode('day');
    setSelectedDate(today);
    setIsHamburgerOpen(false);
  };

  const handleStatsDownloadPdf = async () => {
    const tableElement = document.getElementById('stats-pdf-container');
    if (!tableElement) return;

    setIsGeneratingPdf(true);
    
    try {
      // Hide buttons for cleaner capture
      const buttons = document.querySelectorAll('.no-print-pdf');
      Array.from(buttons).forEach(b => (b as HTMLElement).style.display = 'none');

      // Increase delay to let browser apply styles fully
      await new Promise(resolve => setTimeout(resolve, 500));

      // Use html2pdf or similar for better quality? 
      // For now, let's fix the screen capture method to not be a screenshot but capture the HTML directly if possible.
      // Actually, since I have jsPDF and dom-to-image, I will improve text rendering by increasing scale.
      
      const imgData = await domtoimage.toPng(tableElement, {
        bgcolor: '#ffffff',
        width: tableElement.scrollWidth,
        height: tableElement.scrollHeight,
        style: {
          transform: 'scale(2)', // Keep high scale
          transformOrigin: 'top left',
          width: tableElement.scrollWidth + 'px',
          height: tableElement.scrollHeight + 'px'
        },
        filter: (node) => {
          if (node.classList && node.classList.contains('no-print-pdf')) {
            return false;
          }
          return true;
        }
      });
      
      // Calculate PDF dimensions (A4 landscape)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add title
      pdf.setFontSize(16);
      pdf.text('Архів: Залучення проповідників', pdf.internal.pageSize.getWidth() / 2, 10, { align: 'center' });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight() - 20; // Leave space for title
      
      const img = new Image();
      img.src = imgData;
      await new Promise(resolve => { img.onload = resolve; });

      // Scale to fit content properly based on content (not just width)
      // Since it's landscape, try to fit width first
      let imgWidth = pdfWidth - 20; 
      let imgHeight = (img.height * imgWidth) / img.width;
      
      if (imgHeight > pdfHeight) {
        imgHeight = pdfHeight;
        imgWidth = (img.width * imgHeight) / img.height;
      }
      
      const xOffset = (pdfWidth - imgWidth) / 2;
      pdf.addImage(imgData, 'PNG', xOffset, 15, imgWidth, imgHeight);
      
      const fileName = `ЗАЛУЧ. ПРОПОВІДНИКІВ_АРХІВ.pdf`;
      const pdfOutput = pdf.output('blob');
      const url = URL.createObjectURL(pdfOutput);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating PDF', error);
      alert('Помилка при створенні PDF');
    } finally {
      // Restore buttons
      const buttons = document.querySelectorAll('.no-print-pdf');
      Array.from(buttons).forEach(b => (b as HTMLElement).style.display = '');
      setIsGeneratingPdf(false);
    }
  };

  const [isGeneratingWeekPdf, setIsGeneratingWeekPdf] = useState(false);

  const handleExportWeekPdf = async () => {
    setIsGeneratingWeekPdf(true);
    // Ensure week view is active (switch in background) so layout matches PDF expectations
    try {
      setActiveTab('view');
      setViewMode('week');
      // Temporarily override any column layout logic to force 2 columns for PDF export
      // Find the main calendar container and force it to 2 columns
      const mainCalendarContainer = document.querySelector('.calendar-container-scaling') || document.querySelector('.calendar');
      if (mainCalendarContainer) {
        (mainCalendarContainer as HTMLElement).style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
        (mainCalendarContainer as HTMLElement).style.maxWidth = 'unset'; // Remove max-width to let it expand naturally
      }
      
      await new Promise(r => setTimeout(r, 700)); // Increased delay for more reliable render
    } catch (e) {
      console.warn('Failed to switch to week view before export', e);
    }
    try {
      const container = document.querySelector('.calendar-container-scaling') || document.querySelector('.calendar') || document.querySelector('main') || document.body;
      if (!container) {
        alert('Не знайдено контейнер календаря для експорту');
        setIsGeneratingWeekPdf(false);
        return;
      }

      const el = container as HTMLElement;
      const originalOverflow = el.style.overflow;
      const originalWidth = el.style.width;
      // Expand for full capture
      el.style.overflow = 'visible';
      el.style.width = 'auto';

      // pick background from first non-transparent element
      let bg = window.getComputedStyle(document.body).backgroundColor || '#ffffff';
      try {
        const first = document.querySelector('body > div');
        if (first) {
          const cs = window.getComputedStyle(first as Element);
          if (cs && cs.backgroundColor && cs.backgroundColor !== 'transparent' && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') bg = cs.backgroundColor;
        }
      } catch (e) {}

      // For each 3-column event grid: if third column content overflows,
      // reduce the middle column width so the third column can expand and fit text.
      // Also shrink font-size of third column if it still doesn't fit.
      try {
        const grids = Array.from(document.querySelectorAll('.grid.grid-cols-3, .grid.grid-cols-2')) as HTMLElement[];
        grids.forEach(g => {
          try {
            const el = g as HTMLElement;
            // Force 2-column layout for the week grid if it's the main calendar container
            if (el.classList.contains('w-full') && el.innerHTML.includes('day-card')) {
              el.style.display = 'grid';
              el.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr)) !important'; // Added !important
              el.style.maxWidth = 'unset !important'; // Ensure it can expand to 2 cols
            }
            
            const children = Array.from(el.children).filter(c => (c as HTMLElement).offsetParent !== null) as HTMLElement[];
            if (children.length < 3) return;
            const first = children[0];
            const second = children[1];
            const third = children[2];
            
            // Tighten line spacing but keep it safe to avoid vertical overlap
            el.style.lineHeight = '1.2';
            el.style.alignItems = 'start';
            el.style.height = 'auto';
            
            const gap = 4; // reduced gap
            const containerWidth = el.clientWidth || el.getBoundingClientRect().width;
            
            // Step 1: Adjust column widths (give 3rd column up to 75% if needed)
            const thirdScroll = third.scrollWidth;
            
            let desiredThird = Math.min(thirdScroll + 4, Math.floor(containerWidth * 0.75)); // Increased max share for third column
            let remaining = Math.max(containerWidth - desiredThird - gap*2, 50); // Reduced min remaining width
            let firstWidth = Math.max(30, Math.floor(remaining * 0.3)); // Reduced min width for first
            let secondWidth = Math.max(20, remaining - firstWidth); // Reduced min width for second
            
            el.style.gridTemplateColumns = `${firstWidth}px ${secondWidth}px ${desiredThird}px`;
            el.style.gap = `${gap}px`;

            // Step 2: If third column still overflows its 75% share, shrink its font
            let fontSize = 100; // percent
            while (third.scrollWidth > (desiredThird + 2) && fontSize > 50) { // Lowered min font size
              fontSize -= 5;
              third.style.fontSize = `${fontSize}%`;
            }

            // Final check: if after all adjustments, content still overflows vertically, try to adjust line-height for this event
            if (el.scrollHeight > el.clientHeight) {
              let currentLineHeight = parseFloat(el.style.lineHeight) || 1.2;
              while (el.scrollHeight > el.clientHeight && currentLineHeight > 0.9) {
                currentLineHeight -= 0.05;
                el.style.lineHeight = `${currentLineHeight}`;
              }
            }

          } catch (e) {}
        });
      } catch (e) {}

      await new Promise(r => setTimeout(r, 300));
      // capture at higher pixel density to improve sharpness
      const DPR = Math.min(2, window.devicePixelRatio || 1);
      const imgData = await domtoimage.toPng(el, {
        bgcolor: bg,
        width: Math.round(el.scrollWidth * DPR),
        height: Math.round(el.scrollHeight * DPR),
        style: { transform: `scale(${DPR})`, transformOrigin: 'top left' },
        filter: (node) => {
          if (node.classList && (node.classList.contains('no-print-pdf') || node.classList.contains('sticky') || node.classList.contains('fixed'))) return false;
          return true;
        }
      });

      // restore
      el.style.overflow = originalOverflow;
      el.style.width = originalWidth;

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const img = new Image(); img.src = imgData; await new Promise(r => { img.onload = r; });

      // image captured at DPR scale -> adjust dimensions accordingly
      let imgWidth = pdfWidth - 12;
      let imgHeight = (img.height * imgWidth) / img.width;
      if (DPR > 1) {
        // no-op: image dimensions already reflect pixel size, jsPDF will rasterize at higher res
      }
      if (imgHeight > pdfHeight - 12) {
        imgHeight = pdfHeight - 12;
        imgWidth = (img.width * imgHeight) / img.height;
      }
      const x = (pdfWidth - imgWidth) / 2;
      pdf.addImage(imgData, 'PNG', x, 6, imgWidth, imgHeight);
      pdf.save('week-calendar.pdf');
    } catch (e) {
      console.error(e);
      alert('Помилка при створенні PDF тижня');
    } finally {
      setIsGeneratingWeekPdf(false);
      setIsHamburgerOpen(false);
      setOpenSubmenu(null);
      setOpenNestedSubmenu(null);
    }
  };

  const handleDuplicateGroupTo = (targetType: 'event' | 'music' | 'staff') => {
    if (!editingGroup || editingGroup.type === 'location') return;
    
    const newGroup = { 
      label: editingGroup.label, 
      items: [...editingGroup.items] 
    };

    if (targetType === 'event') {
      setEventGroups(prev => {
        if (prev.some(g => g.label === newGroup.label)) return prev;
        return [...prev, newGroup];
      });
    } else if (targetType === 'music') {
      setMusicGroups(prev => {
        if (prev.some(g => g.label === newGroup.label)) return prev;
        return [...prev, newGroup];
      });
    } else if (targetType === 'staff') {
      setStaffGroups(prev => {
        if (prev.some(g => g.label === newGroup.label)) return prev;
        return [...prev, newGroup];
      });
    }
    
    setEditingGroup(null);
  };

  const isItemUsedInEvents = (item: string, type: string) => {
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    const usedInEvents = events.some(day => {
      if (day.id < currentMonthKey + "-01") return false;

      return day.events?.some(ev => {
        if (type === 'location' && ev.place === item) return true;
        if (type === 'department' && ev.department === item) return true;
        if (type === 'music' && ev.music === item) return true;
        if (type === 'staff' && ev.leads?.some((lead: string) => lead.includes(item))) return true;
        if (type === 'event' && ev.title === item) return true;
        return false;
      });
    });

    if (usedInEvents) return true;

    return Object.values(eventTemplates).some((templateEvents: any) => {
      return (templateEvents as any[]).some(ev => {
        if (type === 'location' && ev.place === item) return true;
        if (type === 'department' && ev.department === item) return true;
        if (type === 'music' && ev.music === item) return true;
        if (type === 'staff' && ev.leads?.some((lead: string) => lead.includes(item))) return true;
        if (type === 'event' && ev.title === item) return true;
        return false;
      });
    });
  };

  const handleRemoveItemFromGroup = async (itemToRemove) => {
    if (!editingGroup) return;

    if (isItemUsedInEvents(itemToRemove, editingGroup.type)) {
      const confirmDelete = window.confirm("Цей пункт із списку використовується. Вам потрібно зробити його заміну, щоб не було порожного запису в місці його попереднього використання.\n\nВидалити все одно?");
      if (!confirmDelete) return;
    }

    if (editingGroup.type === 'location') {
      setLocations(prev => prev.filter(i => i !== itemToRemove));
      setEditingGroup(prev => ({...prev, items: prev.items.filter(i => i !== itemToRemove)}));
    } else if (editingGroup.type === 'department') {
      setDepartments(prev => prev.filter(i => i !== itemToRemove));
      setEditingGroup(prev => ({...prev, items: prev.items.filter(i => i !== itemToRemove)}));
    } else {
      const updateFn = (groups) => groups.map(g => g.label === editingGroup.label ? { ...g, items: g.items.filter(item => item !== itemToRemove) } : g);
      if (editingGroup.type === 'event') { setEventGroups(updateFn); } 
      else if (editingGroup.type === 'music') { setMusicGroups(updateFn); } 
      else if (editingGroup.type === 'staff') { setStaffGroups(updateFn); }
      setEditingGroup(prev => ({...prev, items: prev.items.filter(i => i !== itemToRemove)}));
    }

    // Clear deleted item from existing events
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    const daysToUpdate = events.filter(day => {
      if (day.id < currentMonthKey + "-01") return false;
      return day.events?.some(ev => {
        if (editingGroup.type === 'location' && ev.place === itemToRemove) return true;
        if (editingGroup.type === 'department' && ev.department === itemToRemove) return true;
        if (editingGroup.type === 'music' && ev.music === itemToRemove) return true;
        if (editingGroup.type === 'staff' && ev.leads?.some((lead: string) => lead.includes(itemToRemove))) return true;
        if (editingGroup.type === 'event' && ev.title === itemToRemove) return true;
        return false;
      });
    });

    for (const day of daysToUpdate) {
      const updatedEvents = day.events?.map(ev => {
        const updatedEvent = { ...ev };
        if (editingGroup.type === 'location' && updatedEvent.place === itemToRemove) updatedEvent.place = "";
        if (editingGroup.type === 'department' && updatedEvent.department === itemToRemove) updatedEvent.department = "";
        if (editingGroup.type === 'music' && updatedEvent.music === itemToRemove) updatedEvent.music = "";
        if (editingGroup.type === 'staff' && updatedEvent.leads) {
          updatedEvent.leads = updatedEvent.leads.filter(l => !l.includes(itemToRemove));
        }
        if (editingGroup.type === 'event' && updatedEvent.title === itemToRemove) updatedEvent.title = "";
        return updatedEvent;
      });
      
      try {
        const updateData: any = {};
        if (updatedEvents) updateData.events = updatedEvents;
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'calendar_events', day.id), updateData, { merge: true });
      } catch (err) {
        console.error("Error updating events for deleted item:", err);
      }
    }

    setEvents(prev => prev.map(day => {
      return {
        ...day,
        events: day.events?.map(ev => {
          const updatedEvent = { ...ev };
          if (editingGroup.type === 'location' && updatedEvent.place === itemToRemove) updatedEvent.place = "";
          if (editingGroup.type === 'department' && updatedEvent.department === itemToRemove) updatedEvent.department = "";
          if (editingGroup.type === 'music' && updatedEvent.music === itemToRemove) updatedEvent.music = "";
          if (editingGroup.type === 'staff' && updatedEvent.leads) {
            updatedEvent.leads = updatedEvent.leads.filter(l => !l.includes(itemToRemove));
          }
          if (editingGroup.type === 'event' && updatedEvent.title === itemToRemove) updatedEvent.title = "";
          return updatedEvent;
        })
      };
    }));

    // Clear deleted item from templates
    const updatedTemplates = { ...eventTemplates };
    let templatesChanged = false;
    
    for (const [weekdayStr, templateEvents] of Object.entries(updatedTemplates)) {
      const weekday = parseInt(weekdayStr);
      let changed = false;
      
      const newTemplateEvents = (templateEvents as any[]).map(ev => {
        const updatedEvent = { ...ev };
        if (editingGroup.type === 'location' && updatedEvent.place === itemToRemove) { updatedEvent.place = ""; changed = true; }
        if (editingGroup.type === 'department' && updatedEvent.department === itemToRemove) { updatedEvent.department = ""; changed = true; }
        if (editingGroup.type === 'music' && updatedEvent.music === itemToRemove) { updatedEvent.music = ""; changed = true; }
        if (editingGroup.type === 'staff' && updatedEvent.leads) {
          const newLeads = updatedEvent.leads.filter(l => !l.includes(itemToRemove));
          if (newLeads.length !== updatedEvent.leads.length) {
            updatedEvent.leads = newLeads;
            changed = true;
          }
        }
        if (editingGroup.type === 'event' && updatedEvent.title === itemToRemove) { updatedEvent.title = ""; changed = true; }
        return updatedEvent;
      });

      if (changed) {
        updatedTemplates[weekday] = newTemplateEvents;
        templatesChanged = true;
        try {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'event_templates', weekday.toString()), { events: newTemplateEvents }, { merge: true });
        } catch (err) {
          console.error("Error updating template for deleted item:", err);
        }
      }
    }
    
    if (templatesChanged) {
      setEventTemplates(updatedTemplates);
    }
  };

  const handleRenameGroup = (oldLabel, newLabel) => {
    if (!newLabel.trim() || oldLabel === newLabel || editingGroup?.type === 'location') return;
    const updateFn = (groups) => groups.map(g => g.label === oldLabel ? { ...g, label: newLabel.trim() } : g);
    if (editingGroup.type === 'event') { setEventGroups(updateFn); } 
    else if (editingGroup.type === 'music') { setMusicGroups(updateFn); } 
    else if (editingGroup.type === 'staff') { setStaffGroups(updateFn); }
    setEditingGroup(prev => prev ? ({ ...prev, label: newLabel.trim() }) : null);
  };

  const handleRenameItemInGroup = async (oldItem, newItem) => {
    if (!newItem.trim() || oldItem === newItem || !editingGroup) return;
    
    // Update the group list
    if (editingGroup.type === 'location') {
      setLocations(prev => prev.map(i => i === oldItem ? newItem.trim() : i));
      setEditingGroup(prev => prev ? ({ ...prev, items: prev.items.map(i => i === oldItem ? newItem.trim() : i) }) : null);
    } else if (editingGroup.type === 'department') {
      setDepartments(prev => prev.map(i => i === oldItem ? newItem.trim() : i));
      setEditingGroup(prev => prev ? ({ ...prev, items: prev.items.map(i => i === oldItem ? newItem.trim() : i) }) : null);
    } else {
      const updateFn = (groups) => groups.map(g => g.label === editingGroup.label ? { ...g, items: g.items.map(i => i === oldItem ? newItem.trim() : i) } : g);
      if (editingGroup.type === 'event') { setEventGroups(updateFn); } 
      else if (editingGroup.type === 'music') { setMusicGroups(updateFn); } 
      else if (editingGroup.type === 'staff') { setStaffGroups(updateFn); }
      setEditingGroup(prev => prev ? ({ ...prev, items: prev.items.map(i => i === oldItem ? newItem.trim() : i) }) : null);
    }

    // Update existing events in Firestore for current and future months
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    const daysToUpdate = events.filter(day => {
      if (day.id < currentMonthKey + "-01") return false;

      return day.events?.some(ev => {
        if (editingGroup.type === 'location' && ev.place === oldItem) return true;
        if (editingGroup.type === 'department' && ev.department === oldItem) return true;
        if (editingGroup.type === 'music' && ev.music === oldItem) return true;
        if (editingGroup.type === 'staff' && ev.leads?.some((lead: string) => lead.includes(oldItem))) return true;
        if (editingGroup.type === 'event' && ev.title === oldItem) return true;
        return false;
      });
    });

    for (const day of daysToUpdate) {
      const updatedEvents = day.events?.map(ev => {
        const updatedEvent = { ...ev };
        if (editingGroup.type === 'location' && updatedEvent.place === oldItem) updatedEvent.place = newItem.trim();
        if (editingGroup.type === 'department' && updatedEvent.department === oldItem) updatedEvent.department = newItem.trim();
        if (editingGroup.type === 'music' && updatedEvent.music === oldItem) updatedEvent.music = newItem.trim();
        if (editingGroup.type === 'staff' && updatedEvent.leads) {
          updatedEvent.leads = updatedEvent.leads.map(l => l.includes(oldItem) ? l.replace(oldItem, newItem.trim()) : l);
        }
        if (editingGroup.type === 'event' && updatedEvent.title === oldItem) updatedEvent.title = newItem.trim();
        return updatedEvent;
      });
      
      try {
        const updateData: any = {};
        if (updatedEvents) updateData.events = updatedEvents;
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'calendar_events', day.id), updateData, { merge: true });
      } catch (err) {
        console.error("Error updating events for renamed item:", err);
      }
    }

    // Update existing events locally
    setEvents(prev => prev.map(day => {
      return {
        ...day,
        events: day.events?.map(ev => {
          const updatedEvent = { ...ev };
          if (editingGroup.type === 'location' && updatedEvent.place === oldItem) updatedEvent.place = newItem.trim();
          if (editingGroup.type === 'department' && updatedEvent.department === oldItem) updatedEvent.department = newItem.trim();
          if (editingGroup.type === 'music' && updatedEvent.music === oldItem) updatedEvent.music = newItem.trim();
          if (editingGroup.type === 'staff' && updatedEvent.leads) {
            updatedEvent.leads = updatedEvent.leads.map(l => l.includes(oldItem) ? l.replace(oldItem, newItem.trim()) : l);
          }
          if (editingGroup.type === 'event' && updatedEvent.title === oldItem) updatedEvent.title = newItem.trim();
          return updatedEvent;
        })
      };
    }));

    // Update templates in Firestore and locally
    const updatedTemplates = { ...eventTemplates };
    let templatesChanged = false;
    
    for (const [weekdayStr, templateEvents] of Object.entries(updatedTemplates)) {
      const weekday = parseInt(weekdayStr);
      let changed = false;
      
      const newTemplateEvents = (templateEvents as any[]).map(ev => {
        const updatedEvent = { ...ev };
        if (editingGroup.type === 'location' && updatedEvent.place === oldItem) { updatedEvent.place = newItem.trim(); changed = true; }
        if (editingGroup.type === 'department' && updatedEvent.department === oldItem) { updatedEvent.department = newItem.trim(); changed = true; }
        if (editingGroup.type === 'music' && updatedEvent.music === oldItem) { updatedEvent.music = newItem.trim(); changed = true; }
        if (editingGroup.type === 'staff' && updatedEvent.leads) {
          const newLeads = updatedEvent.leads.map(l => l.includes(oldItem) ? l.replace(oldItem, newItem.trim()) : l);
          if (JSON.stringify(newLeads) !== JSON.stringify(updatedEvent.leads)) {
            updatedEvent.leads = newLeads;
            changed = true;
          }
        }
        if (editingGroup.type === 'event' && updatedEvent.title === oldItem) { updatedEvent.title = newItem.trim(); changed = true; }
        return updatedEvent;
      });

      if (changed) {
        updatedTemplates[weekday] = newTemplateEvents;
        templatesChanged = true;
        try {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'event_templates', weekday.toString()), { events: newTemplateEvents }, { merge: true });
        } catch (err) {
          console.error("Error updating template for renamed item:", err);
        }
      }
    }
    
    if (templatesChanged) {
      setEventTemplates(updatedTemplates);
    }
  };

  const formatDateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  function generateEventsFromTemplate(templateEvents: any[], date: string) {
    const events: any[] = [];
    templateEvents.forEach(templateEvent => {
      const newEvent = {
        id: crypto.randomUUID(),
        ...templateEvent,
        date: date,
        sourceTemplateEventId: templateEvent.id
      };
      
      // Remove undefined values to prevent Firestore errors
      Object.keys(newEvent).forEach(key => {
        if (newEvent[key] === undefined) {
          delete newEvent[key];
        }
      });
      
      events.push(newEvent);
    });
    return events;
  }

  const visibleDays = (() => {
    const days = [];
    const checkIsToday = (d: Date) => d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();

    if (viewMode === 'day') {
      const d = new Date(selectedDate);
      days.push({
        day: d.getDate(),
        weekdayShort: SHORT_WEEKDAYS[d.getDay()],
        weekdayIndex: d.getDay(),
        monthName: d.toLocaleDateString('uk-UA', { month: 'short' }),
        dateKey: formatDateKey(d),
        isToday: checkIsToday(d)
      });
    } else if (viewMode === 'week') {
      const d = new Date(selectedDate);
      const currentRealMonth = today.getMonth();
      const currentRealYear = today.getFullYear();
      const day = d.getDay();
      const diff = d.getDate() - (day === 0 ? 6 : day - 1);
      const monday = new Date(d.setDate(diff));
      
      for (let i = 0; i < 7; i++) {
        const current = new Date(monday);
        current.setDate(monday.getDate() + i);
        days.push({
          day: current.getDate(),
          weekdayShort: SHORT_WEEKDAYS[current.getDay()],
          weekdayIndex: current.getDay(),
          monthName: current.toLocaleDateString('uk-UA', { month: 'short' }),
          dateKey: formatDateKey(current),
          isToday: checkIsToday(current),
          isOtherMonth: current.getMonth() !== currentRealMonth || current.getFullYear() !== currentRealYear
        });
      }
    } else {
      const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      let current = new Date(firstDay);
      while (current <= lastDay) {
        const d = new Date(current);
        days.push({
          day: d.getDate(),
          weekdayShort: SHORT_WEEKDAYS[d.getDay()],
          weekdayIndex: d.getDay(),
          monthName: d.toLocaleDateString('uk-UA', { month: 'short' }),
          dateKey: formatDateKey(d),
          isToday: checkIsToday(d)
        });
        current.setDate(current.getDate() + 1);
      }
    }
    
    if (showPreacherTable) {
      return days.filter(d => [3, 5, 0].includes(d.weekdayIndex));
    }
    
    return days;
  })();

  const dayViewDates = (() => {
    const dates = [];
    const pivot = viewMode === 'day' ? dayViewPivotDate : selectedDate;
    for (let i = -3; i <= 3; i++) {
      const d = new Date(pivot);
      d.setDate(pivot.getDate() + i);
      dates.push(d);
    }
    return dates;
  })();

  const weekRangeLabel = (() => {
    const d = new Date(selectedDate);
    const day = d.getDay();
    const diff = d.getDate() - (day === 0 ? 6 : day - 1);
    const start = new Date(d.setDate(diff));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const f = (d: Date) => d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: '2-digit' });
    return `${f(start)} - ${f(end)}`;
  })();

  const getFloatingDate = () => {
    if (activeTab === 'admin' && selectedDayForEvent) {
      const [year, month, day] = selectedDayForEvent.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return today;
  };

  const floatingDate = getFloatingDate();
  const isEditingTarget = !!selectedDayForEvent;
  const currentMonthKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
  const currentThemeData = monthlyThemes[currentMonthKey] || {};
  const currentThemeText = typeof currentThemeData === 'string' ? currentThemeData : (currentThemeData.theme || "");
  const currentThemeStyle = typeof currentThemeData === 'string' ? {} : currentThemeData;

  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [resetStatus, setResetStatus] = useState<'idle' | 'confirm' | 'loading' | 'success' | 'error'>('idle');
  const [resetStartMonth, setResetStartMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const handleResetFutureMonthsToTemplates = async () => {
    if (resetStatus !== 'confirm') {
      setResetStatus('confirm');
      return;
    }
    
    setResetStatus('loading');
    try {
      const [year, month] = resetStartMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(2027, 11, 31); // Dec 31, 2027
      
      let curr = new Date(startDate);
      let batch = writeBatch(db);
      let count = 0;
      
      while (curr <= endDate) {
        const dateKey = formatDateKey(curr);
        const weekdayIndex = curr.getDay(); // 0 = Sunday, 1 = Monday
        const template = eventTemplates[weekdayIndex] || [];
        
        const generatedEvents = generateEventsFromTemplate(template, dateKey);
        
        const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'calendar_events', dateKey);
        batch.set(eventRef, { events: generatedEvents });
        
        count++;
        if (count === 400) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
        curr.setDate(curr.getDate() + 1);
      }
      if (count > 0) {
        await batch.commit();
      }
      setResetStatus('success');
      setTimeout(() => setResetStatus('idle'), 3000);
    } catch (e) {
      console.error(e);
      setResetStatus('error');
      setTimeout(() => setResetStatus('idle'), 3000);
    }
  };

  const renderThemeBanner = () => {
    if (viewMode === 'year' || (selectedDepartmentFilter && activeTab === 'view')) return null;

    return (
      <div 
        className={`relative flex items-center justify-center p-4 transition-all duration-300 group ${!currentThemeText && activeTab === 'admin' ? 'cursor-pointer' : ''} w-fit max-w-[95%] lg:max-w-[62.5rem] mx-auto`}
        style={{
          backgroundColor: '#f4ebd0',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`,
          boxShadow: 'inset 0 0 40px rgba(184, 134, 11, 0.15), inset 0 0 10px rgba(139, 69, 19, 0.1), 0 4px 6px rgba(0,0,0,0.05)',
          border: '1px solid rgba(184, 134, 11, 0.2)',
          borderRadius: '2px 10px 2px 10px',
          borderLeft: '4px solid rgba(139, 69, 19, 0.3)',
          borderRight: '4px solid rgba(139, 69, 19, 0.3)',
        }}
        onClick={() => {
          if (activeTab === 'admin' && userRole === 'admin') {
            openThemeEditor(currentMonthKey);
          }
        }}
      >
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          {currentThemeText ? (
            <div className="relative group/text inline-block">
              <div 
                className="font-serif whitespace-pre-wrap font-medium"
                style={{ 
                  fontSize: `${currentThemeStyle.size || appSettings.themeFontSize || 13}px`, 
                  lineHeight: '1.25',
                  color: currentThemeStyle.color || '#5c3a21',
                  textAlign: currentThemeStyle.align || 'center',
                  fontWeight: currentThemeStyle.weight || '400',
                  fontStyle: 'normal',
                  textTransform: currentThemeStyle.transform || 'uppercase',
                  textShadow: '0 1px 1px rgba(255,255,255,0.4)',
                  fontFamily: '"Izhitsa", "Monomakh", "Ruslan Display", "Kurale", "Alice", "Cormorant Garamond", serif',
                }}
              >
                {currentThemeText.trim()}
              </div>
              {activeTab === 'admin' && userRole === 'admin' && (
                <div onClick={(e) => e.stopPropagation()} className="absolute -right-6 md:-right-8 -top-2 opacity-0 group-hover/text:opacity-100 transition-opacity flex flex-col gap-1 bg-white/90 p-1 rounded border border-amber-900/10 shadow-sm print:hidden">
                  <button onClick={() => updateThemeFontSize(1)} className="p-1 hover:bg-amber-100/50 rounded text-amber-900/60 hover:text-amber-900 transition-colors" title="Збільшити шрифт (A+)"><Plus size={10} /></button>
                  <button onClick={() => updateThemeFontSize(-1)} className="p-1 hover:bg-amber-100/50 rounded text-amber-900/60 hover:text-amber-900 transition-colors" title="Зменшити шрифт (A-)"><Minus size={10} /></button>
                  <div className="w-full h-[1px] bg-amber-900/10 my-0.5" />
                  <button onClick={() => { openThemeEditor(currentMonthKey); }} className="p-1 hover:bg-amber-100/50 rounded text-amber-900/60 hover:text-amber-900 transition-colors" title="Редагувати текст (Edit)"><Pencil size={10} /></button>
                </div>
              )}
            </div>
          ) : (
            activeTab === 'admin' && userRole === 'admin' && (
              <div className="text-amber-900/40 font-bold uppercase tracking-widest text-[0.5625rem] flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                <Plus size={10} /> ДОДАТИ ТЕКСТ МІСЯЦЯ
              </div>
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`h-screen overflow-hidden text-slate-200 p-4 font-sans text-[0.625rem] flex flex-col print:h-auto print:overflow-visible print:p-0 ${isAssignmentModalOpen ? 'print:hidden' : ''}`} style={{ backgroundColor: appSettings.backgroundColor }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body, #root, div[style*="background-color"] { 
            background-color: white !important; 
            background-image: none !important;
          }
          * { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          .sticky { position: static !important; }
          .print-no-stretch { width: auto !important; table-layout: auto !important; }
          .print-thin-border { border-width: 0.2px !important; border-color: #cbd5e1 !important; }
          .print-no-stretch, .print-no-stretch th, .print-no-stretch td, .print-no-stretch tr { border-width: 0.2px !important; border-color: #cbd5e1 !important; }
        }
      ` }} />
      {showDiagnostics && (
        <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-md p-6 flex items-center justify-center" onClick={() => setShowDiagnostics(false)}>
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-[2rem] max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-black uppercase tracking-widest mb-4">Діагностика підключення</h3>
            <div className="space-y-3 text-[0.6875rem]">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Firebase App:</span>
                <span className={app ? "text-green-400" : "text-red-400"}>{app ? "Ініціалізовано" : "Помилка"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">База даних (Firestore):</span>
                <span className={db ? "text-green-400" : "text-red-400"}>{db ? "Підключено" : "Відсутня"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Папка даних (App ID):</span>
                <span className="text-slate-300 font-mono text-xs">{appId}</span>
              </div>
              <div className="flex flex-col border-b border-slate-800 pb-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Авторизація:</span>
                  <span className={user ? "text-green-400" : "text-red-400"}>{user ? `Увійшли (ID: ${user.uid.slice(0,5)}...)` : "Не авторизовано"}</span>
                </div>
                {authError && <div className="text-[0.5625rem] text-red-500/80 mt-1 italic">Помилка: {authError}</div>}
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Режим адміна:</span>
                <span className={isAdminAuthenticated ? "text-blue-400" : "text-slate-600"}>{isAdminAuthenticated ? "УВІМКНЕНО" : "ВИМКНЕНО"}</span>
              </div>
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-[0.625rem] leading-relaxed">
                Порада: Якщо "Авторизація" червона, увімкніть <b>Anonymous Auth</b> у Firebase Console. Якщо все зелене, але не зберігає — перевірте <b>Firestore Rules</b>.
              </div>
            </div>
            <button onClick={() => setShowDiagnostics(false)} className="w-full mt-6 bg-slate-800 py-3 rounded-xl font-black uppercase tracking-widest hover:bg-slate-700 transition-colors">Закрити</button>
          </div>
        </div>
      )}
      {/* Database Connection Indicator (Fixed to top right) */}
      <div className="fixed top-1 right-1 z-50">
        <div 
          onClick={() => setShowDiagnostics(true)}
          className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-transform hover:scale-150 ${db ? 'bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} 
          title="Статус бази даних"
        ></div>
      </div>

      <div className="mx-auto w-full px-2 md:px-6 flex-1 flex flex-col overflow-hidden h-full">
        <header className={`w-full flex flex-col gap-2 mb-2 md:mb-4 shrink-0 ${isAssignmentModalOpen || showPreacherTable ? 'hidden' : ''}`}>
          {/* Top Row: Logo, View Mode, Tabs */}
          <div className="w-full flex flex-row flex-nowrap items-center justify-between gap-2">
            {/* Logo */}
            <div className="flex items-center justify-between w-full md:w-auto">
          <div 
            className="flex items-center gap-1 md:gap-2 cursor-pointer group" 
            onClick={() => {
              setActiveTab('view');
              setViewMode('month');
            }}
          >
             <div className="group-hover:scale-105 transition-transform">
               <div className="h-6 md:h-8 w-6 md:w-8 flex items-center justify-center overflow-hidden">
                 {appSettings.logo ? (
                   <img src={appSettings.logo} alt="Logo" className="w-full h-full object-contain" />
                 ) : (
                   <svg viewBox="0 0 100 100" className="w-full h-full">
                     {/* Outer Circle */}
                     <circle cx="50" cy="50" r="47" fill="none" stroke="white" strokeWidth="3" />
                     {/* Church Silhouette */}
                     <path 
                       d="
                         M50 22 L50 28
                         M47 28 L53 28 L53 30 L47 30 Z
                         M50 30 L42 48 L58 48 Z
                         M42 48 L42 68 L58 68 L58 48 Z
                         M42 68 L28 78 L28 97 L72 97 L72 78 L58 68 Z
                       " 
                       fill="white" 
                     />
                     {/* Arched Doorway */}
                     <path d="M44 97 A6 6 0 0 1 56 97 L56 97 L44 97 Z" fill="#1e293b" />
                     {/* Round Window */}
                     <circle cx="50" cy="78" r="4.5" fill="#1e293b" />
                     {/* Cross */}
                     <path d="M50 12 L50 24 M46 16 L54 16" stroke={appSettings.logoColor} strokeWidth="2" strokeLinecap="round" />
                   </svg>
                 )}
               </div>
             </div>
             <div className="flex flex-col justify-center gap-0 mt-0.5">
               <h1 className="text-[0.625rem] sm:text-xs md:text-xl lg:text-2xl font-black uppercase leading-none tracking-tight group-hover:text-blue-400 transition-colors" style={{ color: appSettings.titleColor }}>
                 {appSettings.name}
               </h1>
               <span className="text-[0.25rem] sm:text-[0.375rem] md:text-[0.5rem] lg:text-[0.625rem] font-bold tracking-[0.05em] md:tracking-[0.2em] uppercase" style={{ color: appSettings.subtitleColor }}>{appSettings.subtitle}</span>
             </div>
          </div>
          
          {/* Mobile Diagnostics */}
          <div className="hidden">
            <div 
              onClick={() => setShowDiagnostics(true)}
              className={`w-2 h-2 rounded-full cursor-pointer transition-transform hover:scale-150 ${db ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} 
            ></div>
          </div>
        </div>

        {/* View Mode Buttons */}
        {activeTab !== 'lists' && activeTab !== 'preachers' && activeTab !== 'templates' && !selectedDepartmentFilter && (
          <div className="flex items-center justify-center gap-0.5 xl:gap-1 bg-slate-800 p-0.5 xl:p-1 rounded-lg border border-slate-700 mx-auto shrink-0">
            <button onClick={() => setViewMode('day')} className={`px-1 py-0.5 xl:px-3 xl:py-1.5 rounded-md text-[0.25rem] xl:text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'day' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>День</button>
            <button onClick={() => setViewMode('week')} className={`px-1 py-0.5 xl:px-3 xl:py-1.5 rounded-md text-[0.25rem] xl:text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'week' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Тиждень</button>
            <button onClick={() => setViewMode('month')} className={`px-1 py-0.5 xl:px-3 xl:py-1.5 rounded-md text-[0.25rem] xl:text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'month' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Місяць</button>
            <button onClick={() => setViewMode('year')} className={`px-1 py-0.5 xl:px-3 xl:py-1.5 rounded-md text-[0.25rem] xl:text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'year' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>Рік</button>
          </div>
        )}

        {/* Right: Tabs and Settings */}
        <div className="flex flex-col items-end gap-1 relative">
          <button 
             onClick={() => setIsHamburgerOpen(!isHamburgerOpen)} 
             className="text-white hover:text-blue-400 p-0.5 md:p-2"
          >
            <Menu className="w-4 h-4 md:w-6 md:h-6" />
          </button>
          {selectedDepartmentFilter && (
            <button 
              onClick={() => {
                setSelectedDepartmentFilter(null);
                setViewMode('month');
                setIsHamburgerOpen(false);
                setOpenSubmenu(null);
              }}
              className="px-1.5 py-0.5 rounded text-[0.3125rem] md:text-[0.5rem] font-black uppercase tracking-wider bg-slate-700 text-white hover:bg-slate-600 transition-all flex items-center gap-0.5"
            >
              ⬅ НАЗАД
            </button>
          )}

          {isHamburgerOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 rounded-lg shadow-xl border border-slate-700 z-[1100] p-2 flex flex-col gap-1 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="p-2 border-b border-slate-700 text-[0.625rem] font-bold text-slate-400 uppercase">Меню</div>
              <div 
                className="px-3 py-2 text-[0.625rem] font-bold text-slate-400 uppercase border-b border-slate-700 cursor-pointer hover:text-white flex justify-between items-center"
                onClick={() => setOpenSubmenu(prev => prev === 'editor' ? null : 'editor')}
              >
                РЕДАКТОР
                <span>{openSubmenu === 'editor' ? '▲' : '▼'}</span>
              </div>
              {openSubmenu === 'editor' && (
                <>
                  <button 
                    onClick={() => handleActionClick('full')}
                    className="text-left w-full px-6 py-1 text-[0.6875rem] text-slate-300 hover:bg-slate-700 rounded"
                  >
                    ДОДАТИ/ЗМІНИТИ ПОДІЮ
                  </button>
                  <button 
                    onClick={() => handleActionClick('music')}
                    className="text-left w-full px-6 py-1 text-[0.6875rem] text-slate-300 hover:bg-slate-700 rounded"
                  >
                    ПРИЗНАЧИТИ ЛЕВИТІВ
                  </button>
                  <div 
                    className="px-6 py-1 text-[0.6875rem] text-slate-300 cursor-pointer hover:bg-slate-700 rounded flex justify-between items-center w-full"
                    onClick={() => setOpenNestedSubmenu(prev => prev === 'preachers_menu' ? null : 'preachers_menu')}
                  >
                    ПРОПОВІДНИКИ
                    <span>{openNestedSubmenu === 'preachers_menu' ? '▲' : '▼'}</span>
                  </div>
                  {openNestedSubmenu === 'preachers_menu' && (
                    <div className="pl-4 flex flex-col w-full">
                      <button 
                        onClick={() => handleActionClick('preacher')}
                        className="text-left w-full px-6 py-1 text-[0.6875rem] text-slate-400 hover:bg-slate-700 rounded"
                      >
                        ПРИЗНАЧИТИ ПРОПОВІДНИКІВ
                      </button>
                      <button 
                        onClick={() => {
                          if (isAdminAuthenticated && (userRole === 'admin' || userRole === 'preacher_manager')) {
                            setActiveTab('statistics');
                            setIsHamburgerOpen(false);
                            setOpenSubmenu(null);
                          } else {
                            setPasswordPrompt({ isOpen: true, action: 'statistics' });
                            setIsHamburgerOpen(false);
                          }
                        }}
                        className="text-left w-full px-6 py-1 text-[0.6875rem] text-slate-400 hover:bg-slate-700 rounded"
                      >
                        ЗАЛУЧЕННЯ ПРОПОВІДНИКІВ
                      </button>
                    </div>
                  )}
                  <div 
                    className="px-6 py-1 text-[0.6875rem] text-slate-300 cursor-pointer hover:bg-slate-700 rounded flex justify-between items-center w-full"
                    onClick={() => setOpenNestedSubmenu(prev => prev === 'mailings_menu' ? null : 'mailings_menu')}
                  >
                    РОЗСИЛКИ
                    <span>{openNestedSubmenu === 'mailings_menu' ? '▲' : '▼'}</span>
                  </div>
                  {openNestedSubmenu === 'mailings_menu' && (
                    <div className="pl-4 flex flex-col w-full">
                      <button 
                        onClick={() => { handleExportWeekPdf(); }}
                        className="text-left w-full px-6 py-1 text-[0.6875rem] text-slate-400 hover:bg-slate-700 rounded"
                      >
                        ТИЖДЕНЬ
                      </button>
                    </div>
                  )}
                  {isAdminAuthenticated && (
                    <button 
                      onClick={handleLogout}
                      className="text-left w-full px-6 py-1 text-[0.6875rem] text-red-400 hover:bg-slate-700 rounded mt-1"
                    >
                      ЗАВЕРШИТИ РЕДАГУВАННЯ
                    </button>
                  )}
                </>
              )}
              {/* КАЛЕНДАРІ ВІДДІЛІВ */}
              <div 
                className="px-3 py-2 text-[0.625rem] font-bold text-slate-400 uppercase border-b border-slate-700 cursor-pointer hover:text-white flex justify-between items-center"
                onClick={() => setOpenSubmenu(prev => prev === 'dpt' ? null : 'dpt')}
              >
                КАЛЕНДАРІ ВІДДІЛІВ
                <span>{openSubmenu === 'dpt' ? '▲' : '▼'}</span>
              </div>
              {openSubmenu === 'dpt' && [
                <button 
                  key="all-depts" 
                  onClick={() => {
                    setSelectedDepartmentFilter(null);
                    activateMode('full');
                    setActiveTab('view');
                    setIsHamburgerOpen(false);
                  }}
                  className={`text-left w-full px-6 py-1 text-[0.6875rem] hover:bg-slate-700 rounded ${selectedDepartmentFilter === null ? 'text-blue-400 font-bold' : 'text-slate-300'}`}
                >
                  ЗАГАЛЬНИЙ (УСІ ПОДІЇ)
                </button>,
                ...departments.map(dept => (
                <button 
                  key={dept} 
                  onClick={() => {
                    setSelectedDepartmentFilter(dept);
                    activateMode('full');
                    setActiveTab('view');
                    setIsHamburgerOpen(false);
                    setViewMode(dept === 'ЛЕВИТИ' ? 'month' : 'year');
                  }}
                  className={`text-left w-full px-6 py-1 text-[0.6875rem] hover:bg-slate-700 rounded ${selectedDepartmentFilter === dept ? 'text-blue-400 font-bold' : 'text-slate-300'}`}
                >
                  {dept}
                </button>
              ))]}
              {/* НАЛАШТУВАННЯ */}
              <div 
                className="px-3 py-2 text-[0.625rem] font-bold text-slate-400 uppercase border-b border-slate-700 cursor-pointer hover:text-white flex justify-between items-center"
                onClick={() => setOpenSubmenu(prev => prev === 'set' ? null : 'set')}
              >
                НАЛАШТУВАННЯ
                <span>{openSubmenu === 'set' ? '▲' : '▼'}</span>
              </div>
              {openSubmenu === 'set' && ['СПИСКИ', 'ШАБЛОНИ', 'НАЗВА', 'ВИГЛЯД', 'ПОЛЯ', 'ДОСТУП', 'ТЕЛЕГРАМ'].map(item => (
                <button 
                  key={item} 
                  className="text-left w-full px-6 py-1 text-[0.6875rem] text-slate-300 hover:bg-slate-700 rounded"
                  onClick={() => {
                    const actionItem = () => {
                      if (item === 'СПИСКИ') {
                        activateMode('full'); // lists require editing mode state logic, but activeTab controls view
                        setActiveTab('lists');
                      } else if (item === 'ШАБЛОНИ') {
                        activateMode('full');
                        setActiveTab('templates');
                      } else if (item === 'НАЗВА') {
                        setSettingsInitialTab('name');
                        setIsEditingSettings(true);
                      } else if (item === 'ВИГЛЯД') {
                        setSettingsInitialTab('appearance');
                        setIsEditingSettings(true);
                      } else if (item === 'ПОЛЯ') {
                        setSettingsInitialTab('fields');
                        setIsEditingSettings(true);
                      } else if (item === 'ДОСТУП') {
                        setSettingsInitialTab('access');
                        setIsEditingSettings(true);
                      } else if (item === 'ТЕЛЕГРАМ') {
                        setSettingsInitialTab('telegram');
                        setIsEditingSettings(true);
                      }
                      setIsHamburgerOpen(false);
                      setOpenSubmenu(null);
                    };

                    // For settings or metadata, usually requires admin privileges.
                    // If already admin, proceed
                    if (isAdminAuthenticated && userRole === 'admin') {
                      actionItem();
                    } else {
                      // Request admin access for these items
                      setPasswordPrompt({ isOpen: true, action: `settings_${item}` as any });
                      setIsHamburgerOpen(false);
                      setOpenSubmenu(null);
                    }
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
          
{/* Password removed */}
        </div>

        {/* Dynamic Navigation Row */}
        {activeTab !== 'lists' && (activeTab === 'preachers' || viewMode === 'week' || viewMode === 'year' || viewMode === 'month') && (
          <div className="w-full flex flex-col items-center gap-2">
            {activeTab === 'preachers' && (
              <div className="w-full py-2 flex items-center justify-center">
                <span 
                  className="text-xl font-black uppercase tracking-widest"
                  style={{ 
                    color: parseInt(appSettings.backgroundColor.replace('#', ''), 16) > 0xffffff / 2 ? '#000000' : '#ffffff' 
                  }}
                >
                  ПРИЗНАЧЕННЯ ПРОПОВІДНИКІВ
                </span>
              </div>
            )}


          {viewMode === 'week' && (
            <div className="flex items-center justify-center gap-6 w-full max-w-md">
              <button 
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() - 7);
                  setSelectedDate(d);
                }}
                className="p-1 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} className="text-white"/>
              </button>
              <div className="text-[0.6875rem] font-black text-white tracking-widest uppercase">
                {weekRangeLabel}
              </div>
              <button 
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() + 7);
                  setSelectedDate(d);
                }}
                className="p-1 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
              >
                <ChevronRight size={20} className="text-white"/>
              </button>
            </div>
          )}

          {viewMode === 'year' && (
            <div className="flex items-center justify-center gap-2 w-full">
              <div className="flex items-center bg-slate-800/50 px-4 py-1.5 rounded-xl border border-slate-700/50 backdrop-blur-sm gap-0">
                <button 
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setFullYear(d.getFullYear() - 1);
                    setSelectedDate(d);
                  }}
                  className="text-blue-500 hover:text-blue-400 transition-colors"
                >
                  <ChevronLeft size={20} className="text-white"/>
                </button>
                <span className="text-[0.6875rem] font-black uppercase text-white tracking-wider min-w-[8.75rem] text-center">
                  {selectedDepartmentFilter ? `${selectedDepartmentFilter} ${selectedDate.getFullYear()} РІК` : `${selectedDate.getFullYear()} РІК`}
                </span>
                <button 
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setFullYear(d.getFullYear() + 1);
                    setSelectedDate(d);
                  }}
                  className="text-blue-500 hover:text-blue-400 transition-colors"
                >
                  <ChevronRight size={20} className="text-white"/>
                </button>
              </div>
            </div>
          )}

          {viewMode === 'month' && (
            <div className="flex items-center justify-center gap-2 w-full">
              <div className="flex items-center px-4 py-1.5 gap-0">
                <button 
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setMonth(d.getMonth() - 1);
                    setSelectedDate(d);
                  }}
                  className="text-blue-500 hover:text-blue-400 transition-colors"
                >
                  <ChevronLeft size={20} className="text-white"/>
                </button>
                <span className="text-[0.6875rem] font-black uppercase text-white tracking-wider min-w-[8.75rem] text-center">
                  {selectedDepartmentFilter 
                    ? (selectedDepartmentFilter === 'ЛЕВИТИ' 
                        ? `${selectedDepartmentFilter} ${selectedDate.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' })}` 
                        : `${selectedDepartmentFilter.toUpperCase()} ${selectedDate.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' })}`)
                    : `${selectedDate.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' })}`}
                </span>
                <button 
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setMonth(d.getMonth() + 1);
                    setSelectedDate(d);
                  }}
                  className="text-blue-500 hover:text-blue-400 transition-colors"
                >
                  <ChevronRight size={20} className="text-white"/>
                </button>
              </div>
            </div>
          )}
        </div>
        )}
      </header>

        <main className="w-full flex-1 flex flex-col overflow-y-auto lg:[scrollbar-width:none] lg:[-ms-overflow-style:none] lg:[&::-webkit-scrollbar]:hidden print:max-w-none print:mx-0">
        {activeTab === 'templates' && isAdminAuthenticated && (
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <h2 className="text-white text-lg font-black uppercase">Шаблони подій</h2>
                <div className="flex items-center gap-2">
                  <input 
                    type="month" 
                    value={resetStartMonth}
                    onChange={(e) => { setResetStartMonth(e.target.value); setResetStatus('idle'); }}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold outline-none focus:border-blue-500"
                    min="2026-01"
                    max="2027-12"
                  />
                  <button 
                    onClick={handleResetFutureMonthsToTemplates}
                    disabled={resetStatus === 'loading' || resetStatus === 'success'}
                    className={`px-4 py-2 border rounded-xl text-xs font-bold uppercase transition-all ${
                      resetStatus === 'idle' ? 'bg-red-600/20 hover:bg-red-600/40 text-red-500 hover:text-red-400 border-red-600/30' :
                      resetStatus === 'confirm' ? 'bg-red-600 text-white border-red-500 animate-pulse' :
                      resetStatus === 'loading' ? 'bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed' :
                      resetStatus === 'success' ? 'bg-green-600/20 text-green-500 border-green-600/30' :
                      'bg-red-900/50 text-red-400 border-red-800'
                    }`}
                  >
                    {resetStatus === 'idle' && 'Оновити з вибраного місяця'}
                    {resetStatus === 'confirm' && 'Натисніть ще раз для підтвердження'}
                    {resetStatus === 'loading' && 'Оновлення...'}
                    {resetStatus === 'success' && 'Успішно оновлено!'}
                    {resetStatus === 'error' && 'Помилка!'}
                  </button>
                </div>
              </div>
              <p className="text-slate-400 text-xs mb-6">Налаштуйте стандартні події для кожного дня тижня. При збереженні шаблону, ці події будуть автоматично створені для всіх майбутніх відповідних днів у календарі.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П’ятниця', 'Субота', 'Неділя'].map((dayName, idx) => {
                  const weekdayIndex = (idx + 1) % 7; // Convert to 0-6 (Sun-Sat)
                  const template = eventTemplates[weekdayIndex] || [];
                  
                  return (
                    <div key={weekdayIndex} className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-blue-400 font-black text-sm uppercase tracking-wider">{dayName}</h3>
                        <button 
                          onClick={() => setSelectedDayForEvent(`template_${weekdayIndex}`)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[0.625rem] font-black uppercase rounded-lg transition-all"
                        >
                          Змінити
                        </button>
                      </div>
                      
                      <div className="flex flex-col gap-1.5 min-h-[3.75rem]">
                        {template.length > 0 ? template.map((ev, i) => (
                          <div key={i} className="text-[0.5625rem] text-slate-300 flex items-center gap-2 bg-slate-900/50 p-1.5 rounded border border-slate-700/50">
                            <span className="text-blue-500 font-bold">{ev.startTime}</span>
                            <span className="truncate font-medium">{ev.title}</span>
                          </div>
                        )) : (
                          <div className="text-[0.5625rem] text-slate-500 italic p-4 text-center">Немає шаблону</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'statistics' && (
          <div className="max-w-6xl mx-auto flex flex-col gap-6 w-full print:max-w-none print:w-auto print:p-0 print:m-0 print:block">
            <div className="bg-slate-200/90 rounded-2xl p-6 shadow-md border border-slate-300 print:bg-slate-100 print:rounded-none print:p-4 print:shadow-none print:w-auto print:block">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 print:hidden gap-4">
                 <div className="flex items-center gap-4">
                   <button 
                     onClick={() => setActiveTab('view')}
                     className="px-2 py-1 rounded-md bg-transparent text-slate-600 hover:bg-slate-50 transition-all text-[0.625rem] font-black uppercase tracking-widest flex items-center gap-1 border border-slate-400"
                   >
                     ⬅ НАЗАД
                   </button>
                   <h2 className="text-slate-800 text-lg font-black uppercase tracking-wider">Архів: Залучення проповідників</h2>
                 </div>
                 <div className="flex flex-wrap items-center gap-3">
                   <div className="flex items-center gap-2 bg-slate-300/50 p-1.5 rounded-lg border border-slate-300 shadow-inner">
                     <span className="text-xs font-bold text-slate-500 uppercase px-1">Від:</span>
                     <input 
                       type="month" 
                       value={statsStartMonth} 
                       onChange={e => setStatsStartMonth(e.target.value)}
                       className="bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded px-2 py-1 outline-none focus:border-blue-500 shadow-sm"
                     />
                     <span className="text-xs font-bold text-slate-500 uppercase px-1">До:</span>
                     <input 
                       type="month" 
                       value={statsEndMonth} 
                       onChange={e => setStatsEndMonth(e.target.value)}
                       className="bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded px-2 py-1 outline-none focus:border-blue-500 shadow-sm"
                     />
                     {(statsStartMonth || statsEndMonth) && (
                       <button 
                         onClick={() => { setStatsStartMonth(""); setStatsEndMonth(""); }}
                         className="text-slate-500 hover:text-red-600 px-1 hover:bg-slate-200 rounded p-0.5 transition-colors"
                         title="Очистити період"
                       >
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                       </button>
                     )}
                   </div>
                   <button onClick={handleStatsDownloadPdf} disabled={isGeneratingPdf} className={`no-print-pdf px-4 py-2 bg-blue-600 text-white rounded-lg text-[0.625rem] font-bold shadow hover:bg-blue-500 uppercase flex items-center gap-2 ${isGeneratingPdf ? 'opacity-50' : ''}`}><span>PDF / Друк</span></button>
                 </div>
               </div>
               
               <div className="hidden print:block mb-4">
                 <h2 className="text-black text-xl font-black uppercase text-center">Архів: Залучення проповідників</h2>
               </div>
 
               <div id="stats-pdf-container" className="overflow-x-auto print:overflow-visible custom-scrollbar border border-slate-400 print:border-none shadow-sm print:shadow-none rounded-lg bg-white">
                 <table className="w-[max-content] print:w-auto text-left text-[0.6875rem] text-slate-700 print:text-black border-collapse print-no-stretch">
                   <thead className="bg-slate-300 print:bg-slate-200 text-slate-800">
                     {(() => {
                         const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
                         const archiveYearsSet = new Set<string>();
                         events.forEach(dayInfo => {
                           if (!dayInfo || !dayInfo.id || dayInfo.id.length < 7 || dayInfo.id.startsWith('template')) return;
                           const mKey = dayInfo.id.substring(0, 7);
                           if (statsStartMonth && mKey < statsStartMonth) return;
                           if (statsEndMonth && mKey > statsEndMonth) return;
                           if (mKey <= currentMonthKey) {
                             archiveYearsSet.add(mKey.split('-')[0]);
                           }
                         });
                         if (archiveYearsSet.size === 0) archiveYearsSet.add(today.getFullYear().toString());
                         const archiveYears = Array.from(archiveYearsSet).sort();
                         const ALL_MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
                         const activeMonthsByYear: any = {};
                         archiveYears.forEach(year => {
                           activeMonthsByYear[year] = ALL_MONTHS.filter(mo => {
                             const mKey = year + '-' + mo;
                             if (statsStartMonth && mKey < statsStartMonth) return false;
                             if (statsEndMonth && mKey > statsEndMonth) return false;
                             if (mKey > currentMonthKey) return false;
                             return true;
                           });
                         });
                         const filteredArchiveYears = archiveYears.filter(year => activeMonthsByYear[year].length > 0);
                          const getMonthName = (mo: any) => {
                            const d = new Date(2000, parseInt(mo) - 1, 1);
                            return d.toLocaleDateString('uk-UA', { month: 'short' }).replace('.', '');
                          };
                          return (
                            <>
                              <tr className="border-b border-slate-700 print:border-black print:bg-zinc-300">
                                <th rowSpan={2} className="py-1 px-1 font-bold text-center border-r border-slate-300 print:border-black print:print-thin-border text-[0.625rem] w-6 bg-zinc-300 print:bg-zinc-300">№</th>
                                <th rowSpan={2} className="py-1 px-2.5 font-bold uppercase whitespace-nowrap sticky left-0 print:relative bg-zinc-300 print:bg-zinc-300 z-10 border-r border-slate-300 print:border-black print:print-thin-border text-[0.625rem] align-bottom text-center w-auto text-slate-700 print:text-black">Проповідник</th>
                                {filteredArchiveYears.length > 0 ? filteredArchiveYears.map(year => (
                                  <th key={'year-' + year} colSpan={activeMonthsByYear[year].length + 1} className="py-0.5 px-1 font-bold text-center text-[0.625rem] border-r last:border-r-0 border-b border-slate-300 print:border-black print:print-thin-border bg-zinc-300 print:bg-zinc-300 text-slate-700 print:text-black">
                                    {year}
                                  </th>
                                )) : (
                                  <th className="py-0.5 px-1 font-bold text-center text-[0.625rem] border-r last:border-r-0 border-b border-slate-300 print:border-black print:print-thin-border bg-zinc-300 print:bg-zinc-300 text-slate-700 print:text-black">
                                    -
                                  </th>
                                )}
                              </tr>
                              <tr className="border-b border-slate-300 print:border-black bg-zinc-300 print:bg-zinc-300">
                                {filteredArchiveYears.length > 0 ? filteredArchiveYears.flatMap(year => {
                                  const cols = activeMonthsByYear[year].map(mo => (
                                    <th key={year + '-' + mo} className="py-0.5 px-1 align-middle border-r border-slate-300 print:border-black w-6 print:min-w-[1.25rem] print:w-[1.25rem]">
                                      <div className="flex justify-center h-16">
                                        <span className="font-semibold text-[0.5625rem] uppercase tracking-wider text-slate-600" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                          {getMonthName(mo)}
                                        </span>
                                      </div>
                                    </th>
                                  ));
                                  cols.push(
                                    <th key={'total-' + year} className="py-0.5 px-1 font-bold text-center text-slate-800 print:text-black uppercase text-[0.625rem] align-bottom border-r border-slate-300 print:border-black last:border-r-0 w-8 bg-zinc-400/50 print:bg-zinc-300">
                                      <div className="flex justify-center items-end h-16 pb-2">
                                        <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Разом</span>
                                      </div>
                                    </th>
                                  );
                                  return cols;
                                }) : (
                                  <th className="p-1 font-bold text-center text-[0.625rem] border-r border-slate-200 print:border-black w-8">
                                    -
                                  </th>
                               )}
                             </tr>
                           </>
                         );
                     })()}
                   </thead>

                   <tbody>
                     {(() => {
                         const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
                         const archiveYearsSet = new Set<string>();
                         const stats: Record<string, Record<string, number>> = {};
                         
                         const preachersOnly = staffGroups
                           .filter((g: any) => g.label === "НА ВСІ ДНІ" || g.label.includes("БУДНІ"))
                           .map((g: any) => ({
                             ...g,
                             items: [...(g.items || [])].sort((a: any, b: any) => a.localeCompare(b))
                           }))
                           .filter((g: any) => g.items.length > 0);

                         const preachersList = Array.from(new Set(
                           preachersOnly.flatMap((g: any) => g.items)
                         ));
                         
                         events.forEach(dayInfo => {
                           if (!dayInfo || !dayInfo.id || dayInfo.id.length < 7 || dayInfo.id.startsWith('template')) return;
                           const mKey = dayInfo.id.substring(0, 7);
                           if (statsStartMonth && mKey < statsStartMonth) return;
                           if (statsEndMonth && mKey > statsEndMonth) return;
                           if (mKey <= currentMonthKey) {
                             archiveYearsSet.add(mKey.split('-')[0]);
                             dayInfo.leads?.forEach((lead: string) => {
                               const preacherName = lead.includes('|') ? lead.split('|')[3] : lead;
                               if (preacherName && preachersList.includes(preacherName)) {
                                 if (!stats[preacherName]) stats[preacherName] = {};
                                 stats[preacherName][mKey] = (stats[preacherName][mKey] || 0) + 1;
                               }
                             });

                           }
                         });
                         
                         if (archiveYearsSet.size === 0) archiveYearsSet.add(today.getFullYear().toString());
                         const archiveYears = Array.from(archiveYearsSet).sort();
                         const ALL_MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
                         
                         const activeMonthsByYear: Record<string, string[]> = {};
                         archiveYears.forEach(year => {
                           activeMonthsByYear[year] = ALL_MONTHS.filter(mo => {
                             const mKey = `${year}-${mo}`;
                             if (statsStartMonth && mKey < statsStartMonth) return false;
                             if (statsEndMonth && mKey > statsEndMonth) return false;
                             if (mKey > currentMonthKey) return false;
                             return true;
                           });
                         });
                         const filteredArchiveYears = archiveYears.filter(year => activeMonthsByYear[year].length > 0);

                         if (preachersOnly.length === 0 || preachersList.length === 0) {
                           return (
                             <tr>
                               <td colSpan={filteredArchiveYears.length ? filteredArchiveYears.reduce((sum, year) => sum + activeMonthsByYear[year].length + 1, 2) : 3} className="p-4 text-center text-slate-500 italic border-t border-slate-300 print:border-black">Список проповідників порожній.</td>
                             </tr>
                           );
                         }

                         let globalIdx = 0;
                         return preachersOnly.map((group: any) => (
                           <React.Fragment key={group.label}>
                             <tr>
                               <td 
                                 colSpan={filteredArchiveYears.length ? filteredArchiveYears.reduce((sum, year) => sum + activeMonthsByYear[year].length + 1, 2) : 3} 
                                 className="bg-zinc-200 print:bg-zinc-200 font-bold py-1 px-2 border-b border-t border-slate-300 print:border-black print:print-thin-border text-black z-[20] shadow-sm text-[0.6875rem] sticky left-0"
                               >
                                 {group.label}
                               </td>
                             </tr>
                             {group.items.map((preacher: string, idx: number) => {
                               const pStats = stats[preacher] || {};
                               const isEven = idx % 2 === 0;
                               const rowBgClass = isEven ? 'bg-slate-200 print:bg-gray-200' : 'bg-white print:bg-white';
                               
                               return (
                                 <tr key={preacher} className={`border-b border-slate-200 print:border-black print:print-thin-border hover:bg-slate-100 transition-colors ${rowBgClass}`}>
                                    <td className="py-1 px-1 text-center font-mono text-[0.625rem] border-r border-slate-300 print:border-black print:print-thin-border text-slate-500 print:text-black">{++globalIdx}</td>
                                    <td className={`py-1 px-2.5 font-medium whitespace-nowrap sticky left-0 print:static z-10 border-r border-slate-300 print:border-black print:print-thin-border w-auto text-slate-700 print:text-black ${rowBgClass}`}>{preacher}</td>
                                    {filteredArchiveYears.length > 0 ? filteredArchiveYears.flatMap(year => {
                                      let yearTotal = 0;
                                      const cols = activeMonthsByYear[year].map(mo => {
                                        const mKey = `${year}-${mo}`;
                                        const count = pStats[mKey] || 0;
                                        yearTotal += count;
                                        return (
                                          <td key={mKey} className="py-0.5 px-1 text-center text-slate-500 print:text-black font-mono border-r border-slate-200 print:border-black print:print-thin-border w-6 print:min-w-[1.5rem] print:w-[1.5rem]">
                                            {count > 0 ? count : <span className="opacity-20 print:opacity-30">-</span>}
                                          </td>
                                        );
                                      });
                                      cols.push(
                                        <td key={`total-${year}`} className="py-0.5 px-1 text-center text-slate-800 print:text-black font-bold font-mono bg-slate-100 print:bg-slate-100 border-r last:border-r-0 border-slate-300 print:border-black print:print-thin-border w-8 print:min-w-[2rem]">
                                          {Object.keys(pStats).filter(m => m.startsWith(year)).reduce((sum, m) => sum + (pStats[m] || 0), 0) > 0 ? Object.keys(pStats).filter(m => m.startsWith(year)).reduce((sum, m) => sum + (pStats[m] || 0), 0) : <span className="opacity-20 print:opacity-30">-</span>}
                                        </td>
                                      );
                                      return cols;
                                    }) : (
                                       <td className="p-1 text-center text-slate-500 print:text-black font-mono border-r border-slate-200 print:border-black w-8">
                                         -
                                       </td>
                                    )}
                                 </tr>
                               );
                             })}
                           </React.Fragment>
                         ));
                     })()}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'lists' && (
          isAdminAuthenticated ? (
            <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <h2 className="text-white text-lg font-black uppercase mb-2">Кольори подій</h2>
              <p className="text-slate-400 text-xs mb-4">Палітра кольорів для виділення подій.</p>
              <div className="flex flex-wrap gap-2 items-center">
                {textColors.map((c, idx) => (
                  <div key={idx} className="relative group">
                    <div className="w-6 h-6 rounded-full border border-slate-600" style={{ backgroundColor: c }} />
                    <button onClick={() => setTextColors(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10}/></button>
                  </div>
                ))}
                <label className="w-6 h-6 rounded-full border border-dashed border-slate-500 flex items-center justify-center cursor-pointer hover:border-white transition-colors">
                  <Plus size={12} className="text-slate-400" />
                  <input type="color" className="opacity-0 absolute w-0 h-0" onChange={(e) => setTextColors(prev => [...prev, e.target.value])} />
                </label>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-white text-lg font-black uppercase mb-1">Поле "Подія"</h2>
                  <p className="text-slate-400 text-xs">Ці списки використовуються для вибору назви події.</p>
                </div>
                <button 
                  onClick={() => setEventGroups(prev => [...prev, { label: "НОВА КАТЕГОРІЯ", items: [] }])}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[0.625rem] font-black uppercase rounded-lg transition-all"
                >
                  <Plus size={14} /> Категорія
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {eventGroups.map((g, idx) => (
                  <div key={idx} className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-col">
                    <div className="flex flex-col items-start mb-3 gap-2">
                      <h3 className="text-blue-400 font-bold text-sm uppercase leading-tight w-full">{g.label}</h3>
                      <div className="flex items-center gap-1 w-full justify-start bg-slate-900/50 p-1.5 rounded-lg border border-slate-700/50">
                        <button onClick={() => setEventGroups(prev => { const arr = [...prev]; if (idx > 0) [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]]; return arr; })} disabled={idx === 0} className="text-slate-500 hover:text-white disabled:opacity-30 p-1"><ChevronUp size={14}/></button>
                        <button onClick={() => setEventGroups(prev => { const arr = [...prev]; if (idx < arr.length - 1) [arr[idx+1], arr[idx]] = [arr[idx], arr[idx+1]]; return arr; })} disabled={idx === eventGroups.length - 1} className="text-slate-500 hover:text-white disabled:opacity-30 p-1"><ChevronDown size={14}/></button>
                        <div className="h-4 w-[1px] bg-slate-700 mx-1" />
                        <button onClick={() => moveGroup(idx, 'event', 'music')} className="text-slate-500 hover:text-blue-400 p-1" title="Перемістити в Музику"><Music size={12}/></button>
                        <button onClick={() => moveGroup(idx, 'event', 'staff')} className="text-slate-500 hover:text-blue-400 p-1" title="Перемістити в Служителі"><Users size={12}/></button>
                        <div className="h-4 w-[1px] bg-slate-700 mx-1" />
                        {g.label.toUpperCase() === "РЕПЕТИЦІЇ" && (
                          <button 
                            onClick={() => {
                              const sourceItems: string[] = [];
                              [...musicGroups, ...staffGroups].forEach(group => {
                                if (group.label.toUpperCase() === "МУЗ. ГРУПИ" || group.label.toUpperCase() === "ХОРИ") {
                                  sourceItems.push(...group.items);
                                }
                              });
                              
                              if (sourceItems.length === 0) {
                                alert("Не знайдено категорій 'МУЗ. ГРУПИ' або 'ХОРИ' в інших полях.");
                                return;
                              }
                              
                              const newItems = Array.from(new Set([...g.items, ...sourceItems]));
                              setEventGroups(prev => prev.map((gr, i) => i === idx ? { ...gr, items: newItems } : gr));
                            }}
                            className="text-slate-500 hover:text-green-400 p-1" 
                            title="Копіювати з МУЗ. ГРУПИ та ХОРИ"
                          >
                            <Copy size={12}/>
                          </button>
                        )}
                        <button onClick={() => setEditingGroup({...g, type: 'event'})} className="text-slate-500 hover:text-white ml-1 p-1"><Pencil size={14}/></button>
                        <button 
                          onClick={() => {
                            const isAnyItemUsed = g.items.some(item => isItemUsedInEvents(item, 'event'));
                            if (isAnyItemUsed) {
                              alert("Один або кілька пунктів з цієї групи використовуються в календарі. Вам потрібно зробити їх заміну або видалити з подій перед видаленням групи.");
                              return;
                            }
                            setConfirmAction({
                              title: "Видалення категорії",
                              message: `Ви впевнені, що хочете видалити категорію "${g.label}"?`,
                              onConfirm: () => {
                                setEventGroups(prev => prev.filter((_, i) => i !== idx));
                                setConfirmAction(null);
                              }
                            });
                          }} 
                          className="text-slate-500 hover:text-red-500 ml-auto p-1"
                        >
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {sortAlphabetically(g.items).map(item => (
                        <span key={item} className="bg-slate-900 text-slate-300 text-[0.5625rem] px-2 py-1 rounded border border-slate-700">{item}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-white text-lg font-black uppercase mb-1">Поле "Музика"</h2>
                  <p className="text-slate-400 text-xs">Ці списки використовуються для вибору музичного супроводу.</p>
                </div>
                <button 
                  onClick={() => setMusicGroups(prev => [...prev, { label: "НОВА КАТЕГОРІЯ", items: [] }])}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[0.625rem] font-black uppercase rounded-lg transition-all"
                >
                  <Plus size={14} /> Категорія
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {musicGroups.map((g, idx) => (
                  <div key={idx} className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-col">
                    <div className="flex flex-col items-start mb-3 gap-2">
                      <h3 className="text-blue-400 font-bold text-sm uppercase leading-tight w-full">{g.label}</h3>
                      <div className="flex items-center gap-1 w-full justify-start bg-slate-900/50 p-1.5 rounded-lg border border-slate-700/50">
                        <button onClick={() => setMusicGroups(prev => { const arr = [...prev]; if (idx > 0) [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]]; return arr; })} disabled={idx === 0} className="text-slate-500 hover:text-white disabled:opacity-30 p-1"><ChevronUp size={14}/></button>
                        <button onClick={() => setMusicGroups(prev => { const arr = [...prev]; if (idx < arr.length - 1) [arr[idx+1], arr[idx]] = [arr[idx], arr[idx+1]]; return arr; })} disabled={idx === musicGroups.length - 1} className="text-slate-500 hover:text-white disabled:opacity-30 p-1"><ChevronDown size={14}/></button>
                        <div className="h-4 w-[1px] bg-slate-700 mx-1" />
                        <button onClick={() => moveGroup(idx, 'music', 'event')} className="text-slate-500 hover:text-blue-400 p-1" title="Перемістити в Події"><Calendar size={12}/></button>
                        <button onClick={() => moveGroup(idx, 'music', 'staff')} className="text-slate-500 hover:text-blue-400 p-1" title="Перемістити в Служителі"><Users size={12}/></button>
                        <div className="h-4 w-[1px] bg-slate-700 mx-1" />
                        <button onClick={() => setEditingGroup({...g, type: 'music'})} className="text-slate-500 hover:text-white ml-1 p-1"><Pencil size={14}/></button>
                        <button 
                          onClick={() => {
                            const isAnyItemUsed = g.items.some(item => isItemUsedInEvents(item, 'music'));
                            if (isAnyItemUsed) {
                              alert("Один або кілька пунктів з цієї групи використовуються в календарі. Вам потрібно зробити їх заміну або видалити з подій перед видаленням групи.");
                              return;
                            }
                            setConfirmAction({
                              title: "Видалення категорії",
                              message: `Ви впевнені, що хочете видалити категорію "${g.label}"?`,
                              onConfirm: () => {
                                setMusicGroups(prev => prev.filter((_, i) => i !== idx));
                                setConfirmAction(null);
                              }
                            });
                          }} 
                          className="text-slate-500 hover:text-red-500 ml-auto p-1"
                        >
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {sortAlphabetically(g.items).map(item => (
                        <span key={item} className="bg-slate-900 text-slate-300 text-[0.5625rem] px-2 py-1 rounded border border-slate-700">{item}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-white text-lg font-black uppercase mb-1">Поле "Служителі (Хто)"</h2>
                  <p className="text-slate-400 text-xs">Ці списки використовуються для призначення відповідальних осіб та служителів.</p>
                </div>
                <button 
                  onClick={() => setStaffGroups(prev => [...prev, { label: "НОВА КАТЕГОРІЯ", items: [] }])}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[0.625rem] font-black uppercase rounded-lg transition-all"
                >
                  <Plus size={14} /> Категорія
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staffGroups.map((g, idx) => (
                  <div key={idx} className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-col">
                    <div className="flex flex-col items-start mb-3 gap-2">
                      <h3 className="text-blue-400 font-bold text-sm uppercase leading-tight w-full">{g.label}</h3>
                      <div className="flex items-center gap-1 w-full justify-start bg-slate-900/50 p-1.5 rounded-lg border border-slate-700/50">
                        <button onClick={() => setStaffGroups(prev => { const arr = [...prev]; if (idx > 0) [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]]; return arr; })} disabled={idx === 0} className="text-slate-500 hover:text-white disabled:opacity-30 p-1"><ChevronUp size={14}/></button>
                        <button onClick={() => setStaffGroups(prev => { const arr = [...prev]; if (idx < arr.length - 1) [arr[idx+1], arr[idx]] = [arr[idx], arr[idx+1]]; return arr; })} disabled={idx === staffGroups.length - 1} className="text-slate-500 hover:text-white disabled:opacity-30 p-1"><ChevronDown size={14}/></button>
                        <div className="h-4 w-[1px] bg-slate-700 mx-1" />
                        <button onClick={() => moveGroup(idx, 'staff', 'event')} className="text-slate-500 hover:text-blue-400 p-1" title="Перемістити в Події"><Calendar size={12}/></button>
                        <button onClick={() => moveGroup(idx, 'staff', 'music')} className="text-slate-500 hover:text-blue-400 p-1" title="Перемістити в Музику"><Music size={12}/></button>
                        <div className="h-4 w-[1px] bg-slate-700 mx-1" />
                        <button onClick={() => setEditingGroup({...g, type: 'staff'})} className="text-slate-500 hover:text-white ml-1 p-1"><Pencil size={14}/></button>
                        <button 
                          onClick={() => {
                            const isAnyItemUsed = g.items.some(item => isItemUsedInEvents(item, 'staff'));
                            if (isAnyItemUsed) {
                              alert("Один або кілька пунктів з цієї групи використовуються в календарі. Вам потрібно зробити їх заміну або видалити з подій перед видаленням групи.");
                              return;
                            }
                            setConfirmAction({
                              title: "Видалення категорії",
                              message: `Ви впевнені, що хочете видалити категорію "${g.label}"?`,
                              onConfirm: () => {
                                setStaffGroups(prev => prev.filter((_, i) => i !== idx));
                                setConfirmAction(null);
                              }
                            });
                          }} 
                          className="text-slate-500 hover:text-red-500 ml-auto p-1"
                        >
                          <Trash2 size={14}/>
                         </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {sortAlphabetically(g.items).map(item => (
                        <span key={item} className="bg-slate-900 text-slate-300 text-[0.5625rem] px-2 py-1 rounded border border-slate-700">{item}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-blue-400 font-bold text-sm uppercase leading-tight">Локації</h3>
                  <button onClick={() => setEditingGroup({ label: 'ЛОКАЦІЇ', items: locations, type: 'location' })} className="text-slate-500 hover:text-white"><Pencil size={14}/></button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sortAlphabetically(locations).map(item => (
                    <span key={item} className="bg-slate-900 text-slate-300 text-[0.5625rem] px-2 py-1 rounded border border-slate-700">{item}</span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-blue-400 font-bold text-sm uppercase leading-tight">Відділи</h3>
                  <button onClick={() => setEditingGroup({ label: 'ВІДДІЛИ', items: departments, type: 'department' })} className="text-slate-500 hover:text-white"><Pencil size={14}/></button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sortAlphabetically(departments).map(item => (
                    <span key={item} className="bg-slate-900 text-slate-300 text-[0.5625rem] px-2 py-1 rounded border border-slate-700">{item}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          ) : (
            <div className="max-w-4xl mx-auto text-center py-12 text-slate-500 font-bold text-xs uppercase tracking-widest">
              Введіть пароль у правому верхньому куті для доступу
            </div>
          )
        )}

        {(activeTab === 'view' || activeTab === 'admin') && (
          <div className={showPreacherTable ? "flex-1 flex flex-row gap-4 p-4 items-stretch h-[calc(100vh-7.5rem)] overflow-hidden" : "flex flex-col gap-4"}>
            <div className={showPreacherTable ? "w-[16.25rem] shrink-0 relative overflow-hidden hidden md:block 2xl:w-[17.5rem] 2xl:flex 2xl:flex-col 2xl:static 2xl:overflow-y-auto 2xl:pr-2 2xl:custom-scrollbar" : "flex flex-col gap-4 w-full xl:max-w-[90rem] 2xl:max-w-[110rem] xl:mx-auto"}>
              <div className={showPreacherTable ? "absolute top-0 left-0 w-[200%] h-[200%] scale-50 origin-top-left overflow-y-auto pr-2 custom-scrollbar 2xl:relative 2xl:w-full 2xl:h-auto 2xl:scale-100" : "flex flex-col gap-4"}>
              
              {/* Банер Текст Місяця */}
              {renderThemeBanner()}

          <div className={`
            calendar-container-scaling
            ${viewMode === 'month' ? (showPreacherTable ? 'flex flex-col gap-3 lg:gap-2' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-1.5 w-full print:grid-cols-1 print:gap-0 /* ЦЕЙ РЯДОК НІКОЛИ НЕ ЗМІНЮВАТИ - НАЛАШТУВАННЯ СІТКИ МІСЯЦЬ ЯК ТИЖДЕНЬ */') : ''}
            ${viewMode === 'week' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-1.5 w-full /* ЦЕЙ РЯДОК НІКОЛИ НЕ ЗМІНЮВАТИ - НАЛАШТУВАННЯ СІТКИ ТИЖДЕНЬ */' : ''}
            ${viewMode === 'day' ? `flex flex-col [@media(orientation:landscape)]:flex-row md:flex-row items-start justify-center gap-6 lg:gap-8 w-full ${showPreacherTable ? '' : 'mx-auto max-w-[59.375rem]'}` : ''}
            ${viewMode === 'year' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 print:grid-cols-1 print:gap-0' : ''}
          `}>
            {viewMode === 'year' ? (
              Array.from({ length: 12 }).map((_, monthIdx) => {
                const monthDate = new Date(selectedDate.getFullYear(), monthIdx, 1);
                const firstDay = new Date(selectedDate.getFullYear(), monthIdx, 1);
                const lastDay = new Date(selectedDate.getFullYear(), monthIdx + 1, 0);
                const monthDays = [];
                let curr = new Date(firstDay);
                while (curr <= lastDay) {
                  monthDays.push(new Date(curr));
                  curr.setDate(curr.getDate() + 1);
                }

                const monthKey = `${selectedDate.getFullYear()}-${String(monthIdx + 1).padStart(2, '0')}`;
                
                // Show only months with events if department filter is active
                if (selectedDepartmentFilter && activeTab === 'view') {
                  const hasEvents = monthDays.some(d => {
                    const dateKey = formatDateKey(d);
                    const dayEvents = getDayEvents(dateKey, d).filter(ev => ev.isYearly && (selectedDepartmentFilter === 'ЛЕВИТИ' ? ((ev.music && ev.music.trim() !== '') || musicGroups.some(g => g.items.includes(ev.title || ''))) : ev.department === selectedDepartmentFilter));
                    return dayEvents.length > 0;
                  });
                  if (!hasEvents) return null;
                }

                const monthTheme = monthlyThemes[monthKey];

                let seasonBg = '';
                let seasonBorder = '';
                let seasonText = '';
                
                if (monthIdx === 11 || monthIdx === 0 || monthIdx === 1) {
                  // Зима
                  seasonBg = 'bg-[#e0f2fe] print:bg-[#e0f2fe]'; 
                  seasonBorder = 'border-[#bae6fd]';
                  seasonText = 'text-[#0369a1]';
                } else if (monthIdx >= 2 && monthIdx <= 4) {
                  // Весна
                  seasonBg = 'bg-[#ecfccb] print:bg-[#ecfccb]';
                  seasonBorder = 'border-[#d9f99d]';
                  seasonText = 'text-[#4d7c0f]';
                } else if (monthIdx >= 5 && monthIdx <= 7) {
                  // Літо
                  seasonBg = 'bg-[#fef9c3] print:bg-[#fef9c3]';
                  seasonBorder = 'border-[#fef08a]';
                  seasonText = 'text-[#a16207]';
                } else {
                  // Осінь (дубовий)
                  seasonBg = 'bg-[#ffedd5] print:bg-[#ffedd5]';
                  seasonBorder = 'border-[#fed7aa]';
                  seasonText = 'text-[#c2410c]';
                }

                return (
                  <div key={monthIdx} className={`${seasonBg} rounded-xl p-2.5 border ${seasonBorder} print:border-none print:p-2 ${monthIdx === 6 ? 'print:page-break-before' : ''} md:min-w-[20rem] shadow-sm`}>
                    <div className={`flex justify-between items-center border-b ${seasonBorder} pb-1 mb-1.5`}>
                      <h3 className={`${seasonText} font-black uppercase text-[0.625rem] tracking-widest leading-none m-0`}>
                        {monthDate.toLocaleDateString('uk-UA', { month: 'long' })}
                      </h3>
                      {activeTab === 'admin' && userRole === 'admin' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(new Date(selectedDate.getFullYear(), monthIdx, 1));
                            openThemeEditor(monthKey);
                          }}
                          className="p-1 text-slate-500 hover:text-blue-400 transition-colors -my-1"
                        >
                          <Pencil size={10} />
                        </button>
                      )}
                    </div>
                    
                    {/* Тема місяця не виводиться в річному плані згідно побажань */}

                    <div className="flex flex-col gap-1">
                      {monthDays.map((d) => {
                        const dateKey = formatDateKey(d);
                        let dayEvents = getDayEvents(dateKey, d).filter(ev => ev.isYearly);
                        if (selectedDepartmentFilter && activeTab === 'view') {
                          dayEvents = dayEvents.filter(ev => selectedDepartmentFilter === 'ЛЕВИТИ' ? ((ev.music && ev.music.trim() !== '') || musicGroups.some(g => g.items.includes(ev.title || ''))) : ev.department === selectedDepartmentFilter);
                        }
                        if (dayEvents.length === 0) return null;
                        
                        return (
                          <div key={dateKey} className="flex gap-1.5 items-start mt-0.5">
                            <div className={`w-[2.8125rem] shrink-0 pt-0.5 flex items-baseline gap-0.5 ${seasonText}`}>
                              <span className="text-[0.8125rem] font-black leading-none">{String(d.getDate()).padStart(2, '0')}</span>
                              <span className="text-[0.5313rem] uppercase font-bold opacity-70">/ {SHORT_WEEKDAYS[d.getDay()]}</span>
                            </div>
                            <div className="flex-1 flex flex-col gap-1">
                              {dayEvents.map((ev, i) => {
                                const isCleaning = ev.title?.toUpperCase().includes('ПРИБИРАННЯ');
                                const safeTextColor = ev.textColor === '#ffffff' ? '#1e293b' : (ev.textColor || '#1e293b');
                                const validLeads = (ev.leads || []).filter((l: string) => l && l.trim());
                                
                                return (
                                  <div key={i} className={`flex flex-col gap-0.5 p-1.5 rounded-lg border ${seasonBorder} ${isCleaning ? 'bg-white/40' : 'bg-white/80'} shadow-sm relative overflow-hidden`}>
                                    {!isCleaning && <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: safeTextColor, opacity: 0.3 }}></div>}
                                    {isCleaning && <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-300"></div>}
                                    
                                    <div className="pl-1.5 flex flex-col gap-0.5">
                                      {(ev.startTime || ev.place) && !ev.hideTimeInYear && !ev.hidePlaceInYear ? (
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0 mb-0 text-[0.5rem] font-bold text-slate-500 tracking-wide uppercase leading-none">
                                          {ev.startTime && !ev.hideTimeInYear && (
                                            <div className="flex items-center gap-0.5">
                                              <Clock size={8} className="text-blue-500" />
                                              <span>{ev.startTime}</span>
                                            </div>
                                          )}
                                          {ev.place && !ev.hidePlaceInYear && (
                                            <div className="flex items-center gap-0.5">
                                              <MapPin size={8} className="text-red-400" />
                                              <span className="truncate max-w-[7.5rem] pb-[1px]">{ev.place}</span>
                                            </div>
                                          )}
                                        </div>
                                      ) : null}
                                      
                                      {!ev.hideTitleInYear && (
                                        <div className={`text-[0.625rem] leading-tight break-words ${ev.isBold !== false ? 'font-black' : 'font-semibold'} ${ev.isItalic === true ? 'italic' : ''} ${ev.isUnderline === true ? 'underline' : ''} ${ev.isUppercase !== false ? 'uppercase' : ''}`} style={{ color: safeTextColor }}>
                                          {ev.title}
                                        </div>
                                      )}
                                      {!ev.hideTitleInYear && ev.subTitle && (
                                        <div className="text-[0.5rem] leading-[1.1] font-normal text-slate-700 mt-[1px] break-words">
                                          {ev.subTitle}
                                        </div>
                                      )}

                                      {validLeads.length > 0 && !ev.hideLeadsInYear && (
                                        <div className="flex items-start gap-1 mt-0 pt-[2px] border-t border-slate-300/40">
                                          <Users size={9} className="text-slate-400 mt-[1px] shrink-0" />
                                          <div className="text-[0.5313rem] leading-tight font-bold text-slate-600 flex flex-wrap gap-x-1">
                                            {validLeads.map((l: string, idx: number) => (
                                              <span key={idx} className="flex leading-tight">
                                                {formatLeadDisplay(l)}
                                                {idx < validLeads.length - 1 && <span>, </span>}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : visibleDays.filter(d => {
              if (selectedDepartmentFilter && activeTab === 'view') {
                let dayEvents = [...getDayEvents(d.dateKey, new Date(d.dateKey))];
                dayEvents = dayEvents.filter(ev => selectedDepartmentFilter === 'ЛЕВИТИ' ? ((ev.music && ev.music.trim() !== '') || musicGroups.some(g => g.items.includes(ev.title || ''))) : ev.department === selectedDepartmentFilter);
                return dayEvents.length > 0;
              }
              return true;
            }).map((d, index) => {
              let dayEvents = [...getDayEvents(d.dateKey, new Date(d.dateKey))].sort((a, b) => {
                const aNoTimeLoc = (!a.startTime || a.startTime.trim() === '') && (!a.place || a.place.trim() === '');
                const bNoTimeLoc = (!b.startTime || b.startTime.trim() === '') && (!b.place || b.place.trim() === '');
                if (aNoTimeLoc && !bNoTimeLoc) return -1;
                if (!aNoTimeLoc && bNoTimeLoc) return 1;
                return (a.startTime || "99:99").localeCompare(b.startTime || "99:99");
              });
              
              if (selectedDepartmentFilter && activeTab === 'view') {
                dayEvents = dayEvents.filter(ev => selectedDepartmentFilter === 'ЛЕВИТИ' ? ((ev.music && ev.music.trim() !== '') || musicGroups.some(g => g.items.includes(ev.title || ''))) : ev.department === selectedDepartmentFilter);
              }

              const cardContent = (
                <div 
                  key={d.dateKey} 
                  onTouchStart={(e) => {
                    (e.currentTarget as any).touchStartX = e.touches[0].clientX;
                    (e.currentTarget as any).touchStartY = e.touches[0].clientY;
                  }}
                  onTouchMove={(e) => {
                    const startX = (e.currentTarget as any).touchStartX;
                    const startY = (e.currentTarget as any).touchStartY;
                    if (startX === undefined || startY === undefined) return;
                    
                    const diffX = Math.abs(startX - e.touches[0].clientX);
                    const diffY = Math.abs(startY - e.touches[0].clientY);
                    
                    // Якщо горизонтальний рух більший за вертикальний, запобігаємо прокрутці
                    if (diffX > diffY && diffX > 10) {
                      e.preventDefault();
                    }
                  }}
                  onTouchEnd={(e) => {
                    const startX = (e.currentTarget as any).touchStartX;
                    if (startX === undefined) return;
                    const endX = e.changedTouches[0].clientX;
                    const diff = startX - endX;
                    if (Math.abs(diff) > 50) {
                      const dateObj = new Date(d.dateKey);
                      if (diff > 0) dateObj.setDate(dateObj.getDate() + 1);
                      else dateObj.setDate(dateObj.getDate() - 1);
                      setSelectedDate(dateObj);
                      if (viewMode === 'day') setDayViewPivotDate(dateObj);
                    }
                    (e.currentTarget as any).touchStartX = undefined;
                    (e.currentTarget as any).touchStartY = undefined;
                  }}
                  onClick={() => {
                    const dateObj = new Date(d.dateKey);
                    setSelectedDate(dateObj);
                    if (viewMode === 'day') setDayViewPivotDate(dateObj);
                  }}
                  onDoubleClick={() => {
                    if (showPreacherTable) {
                      const dateObj = new Date(d.dateKey);
                      setSelectedDate(dateObj);
                      setSelectedDayForEvent(d.dateKey);
                    }
                  }}
                  className={`relative flex flex-row overflow-hidden ${showPreacherTable ? 'border-l-[0.25rem]' : 'border-l-[0.375rem]'} shadow-md transition-all cursor-pointer ${showPreacherTable ? 'min-h-[5rem]' : 'min-h-[6.25rem] lg:min-h-[8.125rem]'} ${showPreacherTable ? 'rounded-2xl' : 'rounded-3xl lg:rounded-[2rem]'} w-full ${viewMode === 'week' && !showPreacherTable ? 'max-w-[95%] md:max-w-[100%] lg:max-w-full mx-auto /* НІКОЛИ НЕ ЗМІНЮВАТИ ЦІ КЛАСИ МАСШТАБУВАННЯ ДЛЯ ТИЖНЯ */' : ''} ${viewMode === 'month' && !showPreacherTable ? 'max-w-[95%] md:max-w-[100%] lg:max-w-full mx-auto /* НІКОЛИ НЕ ЗМІНЮВАТИ ЦІ КЛАСИ МАСШТАБУВАННЯ ДЛЯ МІСЯЦЯ (ТАКІ САМІ ЯК ДЛЯ ТИЖНЯ) */' : ''} ${showPreacherTable || viewMode === 'year' ? 'max-w-full' : ''} hover:shadow-xl hover:-translate-y-0.5 ${d.dateKey === formatDateKey(selectedDate) ? 'ring-2 ring-blue-400/50 z-10' : ''} ${d.isOtherMonth && activeTab === 'view' ? 'opacity-60 grayscale-[0.4]' : ''} ${viewMode === 'month' && index > 0 && index % 7 === 0 ? 'print:page-break-before' : ''} ${viewMode === 'day' ? 'flex-1 w-full max-w-[37.5rem]' : ''}`} 
                  style={{ 
                    borderLeftColor: (d.isOtherMonth && activeTab === 'view') ? '#f1f5f9' : BORDER_COLORS[d.weekdayIndex],
                    backgroundColor: (d.isOtherMonth && activeTab === 'view') ? '#f8fafc' : WEEKDAY_COLORS[d.weekdayIndex]
                  }}
                >
                  {/* Left Column: Date & Day */}
                  <div className={`${showPreacherTable ? 'w-10' : (viewMode === 'month' ? 'w-8 md:w-10' : 'w-10 md:w-12')} shrink-0 flex flex-col items-center justify-center border-r border-slate-100/50 bg-white/50 gap-0.5 md:gap-1 py-1.5 md:py-2`}>
                    <span className={`${showPreacherTable ? 'text-[1rem]' : 'text-[0.875rem] md:text-[1rem]'} font-black uppercase leading-none text-slate-900`}>
                      {String(d.day).padStart(2, '0')}
                    </span>
                    <span className={`${showPreacherTable ? 'text-[0.5625rem]' : 'text-[0.4375rem] md:text-[0.5rem]'} font-black text-slate-600 uppercase leading-none tracking-tighter`}>
                      {d.monthName}
                    </span>
                    <span className={`${showPreacherTable ? 'text-[0.5625rem]' : 'text-[0.4375rem] md:text-[0.5rem]'} font-black text-slate-600 uppercase leading-none tracking-tighter`}>
                      {SHORT_WEEKDAYS[d.weekdayIndex]}
                    </span>
                  </div>

                  {activeTab === 'admin' && isAdminAuthenticated && (
                    <button 
                      onClick={() => setSelectedDayForEvent(d.dateKey)} 
                      className="absolute top-2 right-2 z-10 px-2 py-1 text-[0.4375rem] font-black uppercase transition-all shadow-sm bg-black/5 text-black/40 hover:bg-black/10 rounded-md"
                    >
                      Змінити
                    </button>
                  )}

                  {/* Right Column: Events */}
                  <div className={`flex-grow ${showPreacherTable ? 'pl-1 pr-2 py-1.5 space-y-1' : 'pl-1 pr-2 py-2 space-y-1 lg:space-y-0.5'} min-h-[3.75rem] min-w-0`}>
                    {dayEvents.length > 0 ? dayEvents.map((ev, i) => {
                      const isCleaning = ev.title?.toUpperCase().replace(/\s+/g, '').includes('ПРИБИРАННЯ');
                      const isWeddingOrEngagement = ev.title?.toUpperCase().replace(/\s+/g, '').includes('ВЕСІЛЛЯ') || ev.title?.toUpperCase().replace(/\s+/g, '').includes('ЗАРУЧИНИ');
                      const leadsCount = ev.leads?.filter(l => l).length || 0;
                      
                        return (
                          <div key={i} className={`grid ${showPreacherTable ? 'grid-cols-[auto_0.9fr_auto]' : 'grid-cols-[auto_0.9fr_auto] md:grid-cols-[auto_0.9fr_auto]'} items-stretch ${showPreacherTable ? 'gap-1' : 'gap-1'} ${showPreacherTable ? 'py-0.5 px-1.5 pl-1.5' : 'py-1 px-1'} ${showPreacherTable ? 'rounded-xl' : 'rounded-lg'} border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all relative group/event overflow-hidden ${isCleaning ? 'bg-slate-200' : 'bg-white'}`}>
                          {/* Accent line - following the curve */}
                          <div className={`absolute left-0 top-0 bottom-0 ${showPreacherTable ? 'w-[2px]' : 'w-[2px] md:w-[0.1563rem]'} opacity-90`} style={{ backgroundColor: ev.textColor }} />
                          
                          {/* Col 1: Location & Time */}
                          {(ev.place || ev.startTime || ev.endTime) ? (
                            <div className={`col-span-1 flex flex-col gap-0 border ${showPreacherTable ? 'rounded-lg' : 'rounded-lg md:rounded-xl'} ${showPreacherTable ? 'px-1 py-0.5' : 'px-1 md:px-2 py-0.5 md:py-1'} min-w-0 phone-landscape-no-wrap`} style={{ borderColor: darkenHex(WEEKDAY_COLORS[d.weekdayIndex], 0.15) }}>
                              <div className={`flex items-center gap-0 md:gap-1 text-blue-600 font-normal ${showPreacherTable ? 'text-[0.5625rem]' : 'text-[0.25rem] md:text-[0.375rem] lg:text-[0.75rem]'} uppercase tracking-tight`}>
                                <MapPin size={showPreacherTable ? 8 : 4} className="shrink-0 md:w-1.5 md:h-1.5 lg:w-1.5 lg:h-1.5" />
                                <span className="whitespace-nowrap min-w-0 flex-1">{ev.place || '—'}</span>
                              </div>
                              <div className={`flex items-center gap-0 md:gap-1 text-slate-600 font-bold ${showPreacherTable ? 'text-[0.5625rem]' : 'text-[0.25rem] md:text-[0.375rem] lg:text-[0.75rem]'}`}>
                                <Clock size={showPreacherTable ? 8 : 4} className="text-blue-500 shrink-0 md:w-1.5 md:h-1.5 lg:w-1.5 lg:h-1.5" />
                                <span className="whitespace-nowrap">{ev.startTime}{ev.endTime ? `-${ev.endTime}` : ''}</span>
                              </div>
                            </div>
                          ) : <div className="hidden" />}

                          {/* Col 2: Event & Music */}
                          <div className={`${(ev.place || ev.startTime || ev.endTime) ? 'col-span-1' : 'col-span-2'} flex flex-col gap-0.5 md:gap-1 border ${showPreacherTable ? 'rounded-lg' : 'rounded-lg md:rounded-xl'} ${showPreacherTable ? 'px-1.5 py-0.5' : 'px-1.5 md:px-2 py-1 md:py-1.5'} min-w-0 ${ev.align === 'center' ? 'text-center items-center' : ev.align === 'right' ? 'text-right items-end' : 'text-left items-start'}`} style={{ borderColor: darkenHex(WEEKDAY_COLORS[d.weekdayIndex], 0.15) }}>
                            <div 
                              className={`${showPreacherTable ? 'text-[0.75rem]' : 'text-[clamp(7px,1.5vw,14px)] lg:text-[1.125rem]'} leading-tight tracking-tight group-hover/event:scale-[1.01] transition-transform w-full whitespace-pre-wrap break-words min-w-0 ${ev.isBold !== false ? 'font-black' : 'font-medium'} ${ev.isItalic === true ? 'italic' : ''} ${ev.isUnderline === true ? 'underline' : ''} ${ev.isUppercase !== false ? 'uppercase' : ''}`}
                              style={{ color: ev.textColor }}
                            >
                              {ev.title || ''}
                            </div>
                            {ev.subTitle && (
                              <div className={`${showPreacherTable ? 'text-[0.625rem]' : 'text-[clamp(6px,1vw,10px)] lg:text-[0.75rem]'} leading-[1.1] font-normal text-slate-700 w-full whitespace-pre-wrap break-words min-w-0 mt-[1px]`}>
                                {ev.subTitle}
                              </div>
                            )}
                            {ev.music && (
                              <div className={`${showPreacherTable ? 'text-[0.5625rem]' : 'text-slate-500 italic text-[clamp(5px,1vw,10px)]'} leading-tight font-semibold flex items-center gap-0.5 md:gap-1 bg-blue-50/30 px-1 md:px-1.5 py-0.5 rounded-md md:rounded-lg w-fit max-w-full`}>
                                <Music size={showPreacherTable ? 8 : 6} className={`shrink-0 self-center ${showPreacherTable ? '' : 'text-blue-400 md:w-2 md:h-2 lg:w-2.5 lg:h-2.5'}`} />
                                <span className="break-words min-w-0 flex-1">{ev.music}</span>
                              </div>
                            )}
                          </div>

                          {/* Col 3: Ministers - Tight List */}
                          {(!isCleaning && !isWeddingOrEngagement && selectedDepartmentFilter !== 'ЛЕВИТИ') && (
                            <div className={`col-span-1 flex flex-col gap-0.5 border ${showPreacherTable ? 'rounded-lg' : 'rounded-lg md:rounded-xl lg:rounded-lg'} ${showPreacherTable ? 'px-1 pt-0.5' : 'px-1 md:px-2 lg:px-1 pt-0.5 md:pt-1 lg:pt-0.5'} min-w-0 ${showPreacherTable ? 'max-w-[7.5rem]' : 'max-w-[5rem] md:max-w-none'} phone-landscape-no-wrap text-left items-start`} style={{ borderColor: darkenHex(WEEKDAY_COLORS[d.weekdayIndex], 0.15) }}>
                              {ev.leads?.filter(l => l).map((lead, lIdx) => (
                                <div key={lIdx} className={`font-medium ${showPreacherTable ? 'text-[0.625rem]' : 'text-[0.375rem] md:text-[0.6875rem] lg:text-[0.8125rem]'} leading-none flex items-start gap-1 md:gap-1.5 py-px min-w-0 text-left whitespace-nowrap overflow-hidden`}>
                                  {formatLeadDisplay(lead)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    }) : (
                      <div className="h-full flex items-center justify-center p-6 text-[0.625rem] uppercase font-black text-black/5 tracking-[0.2em] italic">Порожньо</div>
                    )}
                  </div>
                </div>
              );

              if (viewMode === 'day') {
                return (
                  <div key={`day-wrap-${d.dateKey}`} className="flex-1 w-full max-w-[37.5rem] flex flex-col gap-3">
                    {cardContent}
                  </div>
                );
              }
              
              return cardContent;
            })}
            {viewMode === 'day' && (
              <div className="shrink-0 mt-0 mb-4 sticky top-4 z-20 md:landscape:w-[18.75rem] md:portrait:w-[13.75rem]" ref={miniCalendarRef}>
                <MiniCalendar 
                  selectedDate={selectedDate} 
                  onSelect={(d) => {
                    setSelectedDate(d);
                    setDayViewPivotDate(d);
                  }} 
                />
              </div>
            )}
          </div>
          </div>
          </div>
          {showPreacherTable && (
            <div className="flex-1 min-w-0 relative overflow-hidden hidden md:block 2xl:overflow-visible 2xl:static">
              <div className="absolute top-0 left-0 w-[200%] h-[200%] scale-50 origin-top-left flex flex-col gap-4 2xl:relative 2xl:w-full 2xl:h-full 2xl:scale-100">
              {/* Monthly Theme Input */}
              <div className="flex-1 overflow-hidden">
                <PreacherAssignment 
                  staffGroups={staffGroups} 
                  events={events} 
                  db={db} 
                  appId={appId} 
                  doc={doc} 
                  setDoc={setDoc} 
                  backgroundColor={appSettings.backgroundColor} 
                  isWaitingForTableSelection={false}
                  selectedCalendarCell={null}
                  userRole={userRole}
                  initialDate={new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)}
                  onMonthChange={(d) => setSelectedDate(d)}
                  onAddThemeText={() => openThemeEditor(currentMonthKey)}
                  onAssignmentComplete={(data) => {
                    if (data?.dateKey && data?.preacher) {
                      setEvents(prev => prev.map(e => {
                        if (e.id === data.dateKey) {
                          return {
                            ...e,
                            leads: e.leads.filter((l: string) => !l.includes(data.preacher!))
                          };
                        }
                        return e;
                      }));
                    }
                  }}
                  onBack={() => setShowPreacherTable(false)}
                />
              </div>
            </div>
            </div>
          )}
          </div>
        )}
        </main>
      </div>

      {passwordPrompt.isOpen && createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setPasswordPrompt({isOpen: false, action: null})}>
          <div className="bg-slate-900 w-full max-w-sm rounded-[2rem] border border-slate-700 p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-black uppercase text-sm">Введіть пароль</h3>
            
            {passwordPrompt.error && (
              <div className="bg-red-500/20 text-red-400 text-xs font-bold p-3 rounded-xl border border-red-500/50">
                {passwordPrompt.error}
              </div>
            )}
            
            <input 
              type="password"
              autoFocus
              className={`w-full bg-slate-800 border ${passwordPrompt.error ? 'border-red-500' : 'border-slate-700'} rounded-xl p-3 text-white outline-none focus:border-blue-500 transition-colors`}
              placeholder="Пароль..."
              onChange={() => setPasswordPrompt(prev => prev.error ? { ...prev, error: null } : prev)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const enteredPassword = e.currentTarget.value.trim();
                  
                  const handleAuthSuccess = (role: 'admin' | 'preacher_manager' | 'singer_manager') => {
                    const action = passwordPrompt.action;
                    let hasAccess = false;

                    if (typeof action === 'string' && action.startsWith('settings_')) {
                      hasAccess = role === 'admin';
                    } else if (action === 'full') {
                      hasAccess = role === 'admin';
                    } else if (action === 'preacher') {
                      hasAccess = role === 'admin' || role === 'preacher_manager';
                    } else if (action === 'music') {
                      hasAccess = role === 'admin' || role === 'singer_manager';
                    } else if (action === 'statistics') {
                      hasAccess = role === 'admin' || role === 'preacher_manager';
                    } else {
                      hasAccess = true;
                    }

                    if (!hasAccess) {
                      setPasswordPrompt(prev => ({ ...prev, error: 'Цей пароль не дає доступу до вибраного розділу' }));
                      return;
                    }

                    setIsAdminAuthenticated(true);
                    setUserRole(role);
                    
                    if (typeof action === 'string' && action.startsWith('settings_')) {
                        const item = action.replace('settings_', '');
                        if (item === 'СПИСКИ') {
                          activateMode('full');
                          setActiveTab('lists');
                        } else if (item === 'ШАБЛОНИ') {
                          activateMode('full');
                          setActiveTab('templates');
                        } else if (item === 'НАЗВА') {
                          setSettingsInitialTab('name');
                          setIsEditingSettings(true);
                        } else if (item === 'ВИГЛЯД') {
                          setSettingsInitialTab('appearance');
                          setIsEditingSettings(true);
                        } else if (item === 'ПОЛЯ') {
                          setSettingsInitialTab('fields');
                          setIsEditingSettings(true);
                        } else if (item === 'ДОСТУП') {
                          setSettingsInitialTab('access');
                          setIsEditingSettings(true);
                        } else if (item === 'ТЕЛЕГРАМ') {
                          setSettingsInitialTab('telegram');
                          setIsEditingSettings(true);
                        }
                    } else if (action === 'statistics') {
                      setActiveTab('statistics');
                    } else if (action) {
                      activateMode(action as any);
                    }
                    setPasswordPrompt({ isOpen: false, action: null });
                  };

                  // Check password
                  const adminPass = initialAuthToken || '2026';
                  if (enteredPassword === adminPass) {
                    handleAuthSuccess('admin');
                  } else {
                    const level = (appSettings.accessLevels || []).find((l: any) => (l.password || '').trim() === enteredPassword);
                    if (level) {
                      const levelName = (level.level || '').toLowerCase();
                      if (levelName.includes('проповід') || levelName.includes('пастор')) handleAuthSuccess('preacher_manager');
                      else if (levelName.includes('співа') || levelName.includes('левит')) handleAuthSuccess('singer_manager');
                      else handleAuthSuccess('admin');
                    } else {
                      setPasswordPrompt(prev => ({ ...prev, error: 'Невірний пароль' }));
                    }
                  }
                }
              }}
            />
            
            <div className="flex justify-end mt-2">
              <button 
                onClick={() => setPasswordPrompt({ isOpen: false, action: null, error: null })}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                ВІДМІНИТИ
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {isEditingSettings && createPortal(
        <SettingsModal 
          appSettings={appSettings} 
          setAppSettings={setAppSettings} 
          setIsEditingSettings={setIsEditingSettings} 
          handleSaveSettings={handleSaveSettings}
          ColorPicker={ColorPicker}
          X={X}
          initialTab={settingsInitialTab}
        />,
        document.body
      )}

      {/* Theme Editor Modal */}
      {isEditingTheme && createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setIsEditingTheme(false)}>
          <div className="bg-slate-900 w-full max-w-2xl rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div>
                <h3 className="text-white font-black uppercase text-xs tracking-widest">ТЕКСТ МІСЯЦЯ</h3>
                <p className="text-slate-500 text-[0.625rem] font-bold">{selectedDate.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' })}</p>
              </div>
              <button onClick={() => setIsEditingTheme(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400"><X size={20}/></button>
            </div>
            
            {/* Formatting Toolbar */}
            <div className="px-6 py-3 border-b border-slate-800 bg-slate-800/20 flex flex-wrap gap-4 items-center">
              <div className="flex bg-slate-800 rounded-lg p-1">
                <button onClick={() => setThemeAlign('left')} className={`p-1.5 rounded-md transition-colors ${themeAlign === 'left' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}><AlignLeft size={16} /></button>
                <button onClick={() => setThemeAlign('center')} className={`p-1.5 rounded-md transition-colors ${themeAlign === 'center' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}><AlignCenter size={16} /></button>
                <button onClick={() => setThemeAlign('right')} className={`p-1.5 rounded-md transition-colors ${themeAlign === 'right' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}><AlignRight size={16} /></button>
              </div>
              
              <div className="flex bg-slate-800 rounded-lg p-1">
                <button onClick={() => setThemeWeight(themeWeight === '700' ? '500' : '700')} className={`p-1.5 rounded-md transition-colors ${themeWeight === '700' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}><Bold size={16} /></button>
              </div>

              <div className="flex bg-slate-800 rounded-lg p-1">
                <button title="Великі/Малі літери" onClick={() => setThemeTransform(themeTransform === 'uppercase' ? 'none' : 'uppercase')} className={`p-1.5 rounded-md transition-colors ${themeTransform === 'uppercase' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'} font-serif font-black text-[0.75rem] leading-none`}>AA</button>
              </div>

              <div className="flex bg-slate-800 rounded-lg p-1 items-center gap-1 px-1">
                <button onClick={() => setThemeFontSizeLocal(Math.max(8, themeFontSizeLocal - 1))} className="p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-white transition-colors"><Minus size={14}/></button>
                <div className="w-6 flex justify-center cursor-default">
                  <span className="text-xs font-bold text-slate-300">{themeFontSizeLocal}</span>
                </div>
                <button onClick={() => setThemeFontSizeLocal(Math.min(72, themeFontSizeLocal + 1))} className="p-1 hover:bg-slate-600 rounded text-slate-400 hover:text-white transition-colors"><Plus size={14}/></button>
              </div>

              <div className="flex bg-slate-800 rounded-lg p-1.5 items-center gap-1.5">
                {['#5c3a21', '#000000', '#1e3a8a', '#166534', '#991b1b', '#8b0000'].map(c => (
                  <button 
                    key={c} 
                    onClick={() => setThemeColor(c)}
                    className={`w-4 h-4 rounded-full transition-transform ${themeColor === c ? 'scale-125 ring-2 ring-slate-400 ring-offset-1 ring-offset-slate-800' : 'hover:scale-110 opacity-80 hover:opacity-100'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <div className="w-px h-4 bg-slate-600 mx-1"></div>
                <input 
                  title="Власний колір"
                  type="color" 
                  value={themeColor} 
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
                />
              </div>
            </div>

            <div className="p-6">
              <textarea 
                autoFocus
                value={themeText} 
                onChange={(e) => setThemeText(e.target.value)}
                placeholder="Введіть текст місяця або цитату з Біблії..."
                style={{
                  textAlign: themeAlign,
                  fontWeight: themeWeight,
                  fontStyle: 'normal',
                  textTransform: themeTransform,
                  fontSize: `${themeFontSizeLocal}px`,
                  color: themeColor,
                  fontFamily: '"Izhitsa", "Monomakh", "Ruslan Display", "Kurale", "Alice", "Cormorant Garamond", serif'
                }}
                className="w-full h-48 bg-white border border-slate-300 rounded-2xl p-4 text-sm md:text-base outline-none focus:border-red-500/50 transition-colors resize-none shadow-inner font-serif"
              />
              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => setIsEditingTheme(false)}
                  className="flex-1 py-3 rounded-xl text-[0.625rem] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                >
                  Скасувати
                </button>
                <button 
                  onClick={() => saveTheme(currentMonthKey, themeText)}
                  className="flex-[2] py-3 rounded-xl text-[0.625rem] font-black uppercase tracking-widest bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-500 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={16}/> Зберегти текст
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal for editing day events */}
      {isEditingTarget && (
        <div 
          className="fixed inset-0 z-[1000] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setSelectedDayForEvent(null);
          }}
          tabIndex={-1}
          ref={modalRef}
        >
          <div className="bg-slate-800 border border-slate-700 w-full max-w-sm rounded-[1.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center bg-slate-900">
               <div className="flex flex-col">
                  <span className="text-blue-500 text-[0.5625rem] font-bold uppercase tracking-widest leading-none">
                    {selectedDayForEvent.startsWith('template_') ? 'Редагування шаблону' : 'Редагування дня'}
                  </span>
                  <h3 className="text-white text-lg font-semibold leading-tight capitalize">
                    {selectedDayForEvent.startsWith('template_') 
                      ? ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П’ятниця', 'Субота'][parseInt(selectedDayForEvent.split('_')[1])]
                      : new Date(selectedDayForEvent).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', weekday: 'short' })
                    }
                  </h3>
               </div>
               <button onClick={() => setSelectedDayForEvent(null)} className="text-slate-500 hover:text-white transition-colors p-1"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-800/50">
              {(() => {
                const isTemplate = selectedDayForEvent.startsWith('template_');
                const weekdayIndex = isTemplate ? parseInt(selectedDayForEvent.split('_')[1]) : 0;
                const dayEvents = isTemplate 
                  ? (eventTemplates[weekdayIndex] || [])
                  : getDayEvents(selectedDayForEvent, new Date(selectedDayForEvent));
                
                
                return (
                  <>
                    {dayEvents.map((ev, i) => {
                      const isEditing = editingEventIndex === i;
                      const isMainEvent = eventGroups.find(g => g.items.includes(ev.title))?.label.includes('ОСНОВНІ ТА СВЯТА');
                      const isAssignmentDisabled = isAssignmentModalOpen && !isMainEvent;
                      
                      if (!isEditing) {
                        return (
                          <div key={i} className="relative group">
                            <div 
                              className={`flex flex-col overflow-hidden border border-slate-200 shadow-md rounded-xl bg-white/90 p-2 pl-1.5 space-y-1 relative ${isAssignmentDisabled ? 'opacity-50' : ''}`}
                            >
                              {/* Accent line - following the curve */}
                              <div className="absolute left-0 top-0 bottom-0 w-[2px] opacity-90" style={{ backgroundColor: ev.textColor || '#cbd5e1' }} />
                              
                              {/* Row 1: Place + Time */}
                              <div className="flex justify-between items-center gap-2">
                                <div className="flex flex-row flex-wrap gap-1.5 items-center">
                                  {ev.place && (
                                    <div className="text-slate-500 font-bold flex items-center gap-1 bg-white/50 px-1 text-[0.4375rem] break-words">
                                      <MapPin size={7} className="shrink-0"/> <span className="break-words min-w-0 flex-1">{ev.place}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1 text-[0.4375rem] font-bold text-slate-600 bg-black/5 px-1 py-0.5">
                                    <Clock size={8} className="text-blue-500"/> {ev.startTime}{ev.endTime ? ` - ${ev.endTime}` : ''}
                                  </div>
                                </div>
                                <div className="flex gap-1 ml-auto">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingEventIndex(i);
                                      }}
                                      className={`p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors ${isAssignmentDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      disabled={isAssignmentDisabled}
                                    >
                                      <Pencil size={12}/>
                                    </button>
                                    <button 
                                      onClick={() => {
                                        const isTemplate = selectedDayForEvent.startsWith('template_');
                                        const weekdayIndex = isTemplate ? parseInt(selectedDayForEvent.split('_')[1]) : 0;
                                        const dayEvents = isTemplate 
                                          ? (eventTemplates[weekdayIndex] || [])
                                          : getDayEvents(selectedDayForEvent, new Date(selectedDayForEvent));
                                        
                                        const updated = dayEvents.filter((_, idx) => idx !== i);
                                        
                                        if (isTemplate) {
                                          setEventTemplates(prev => ({ ...prev, [weekdayIndex]: updated }));
                                        } else {
                                          setEvents(prev => {
                                            const existing = prev.find(d => d.id === selectedDayForEvent);
                                            if (existing) return prev.map(d => d.id === selectedDayForEvent ? { ...d, events: updated } : d);
                                            return [...prev, { id: selectedDayForEvent, events: updated }];
                                          });
                                          commitToDB(selectedDayForEvent, updated, false);
                                        }
                                      }}
                                      className={`p-1 text-red-600 hover:bg-red-50 rounded transition-colors ${isAssignmentDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      disabled={isAssignmentDisabled}
                                    >
                                      <Trash2 size={12}/>
                                    </button>
                                </div>
                              </div>

                              {/* Row 2: Event Title */}
                              <div className={`text-[0.5625rem] leading-tight ${ev.isBold !== false ? 'font-black' : 'font-medium'} ${ev.isItalic === true ? 'italic' : ''} ${ev.isUnderline === true ? 'underline' : ''} ${ev.isUppercase !== false ? 'uppercase' : ''}`} style={{ color: ev.textColor }}>
                                {ev.title || 'Без назви'}
                              </div>
                              {ev.subTitle && (
                                <div className="text-[0.4688rem] font-normal leading-[1.1] text-slate-400 mt-[1px]">
                                  {ev.subTitle}
                                </div>
                              )}

                              {/* Row 3: Participants */}
                              {ev.leads?.some(l => l) && (
                                <div className="text-[0.4375rem] font-medium break-words text-left">
                                  {ev.leads.filter(l => l).map((lead, idx) => (
                                    <div key={idx}>
                                      {formatLeadDisplay(lead)}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Row 4: Music */}
                              {ev.music && (
                                <div className="text-slate-400 italic text-[0.4375rem]">
                                  ♫ {ev.music}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }

                      const currentTemplate = (appSettings.eventTemplates || []).find(t => t.id === ev.templateId) || (appSettings.eventTemplates || [])[0] || { fields: ['startTime', 'endTime', 'place', 'leads', 'music', 'formatting', 'colors'] };

                      return (
                        <div key={i} className="p-3 rounded-xl border border-black/20 relative space-y-2 shadow-lg bg-[#7c8f9b]">
                          <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-white/10">
                            <div className="flex items-center gap-1.5">
                              <label className="text-[0.4375rem] font-black text-white/50 uppercase tracking-tighter">Шаблон:</label>
                              <select 
                                value={ev.templateId || ''} 
                                onChange={(e) => updateLocalDetails(selectedDayForEvent, i, 'templateId', e.target.value)}
                                className="bg-black/30 text-white text-[0.5rem] font-bold rounded-md px-1.5 py-0.5 outline-none border border-white/5 hover:bg-black/40 transition-colors"
                                
                              >
                                {(appSettings.eventTemplates || []).map((t: any) => (
                                  <option key={t.id} value={t.id} className="bg-slate-800">{t.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Reminder Button */}
                              <button
                                onClick={() => {
                                  const evDateStr = selectedDayForEvent && !selectedDayForEvent.startsWith('template_') ? selectedDayForEvent : undefined;
                                  const evDate = evDateStr ? new Date(`${evDateStr}T12:00:00`) : new Date();
                                  setReminderModalData({
                                    date: evDate,
                                    time: '',
                                    email: (appSettings as any).defaultReminderEmail || '',
                                    text: '',
                                    isOpen: true
                                  });
                                }}
                                className="bg-blue-500/80 text-white p-1 rounded-full shadow-md hover:bg-blue-500 transition-all flex items-center gap-1 px-2"
                                title="Нагадування"
                              >
                                <Bell size={9} />
                                <span className="text-[0.4375rem] font-bold uppercase">Нагадування</span>
                              </button>
                              
                              {/* Delete Button */}
                              <button 
                                onClick={async () => {
                                  const isTemplate = selectedDayForEvent.startsWith('template_');
                                  const weekdayIndex = isTemplate ? parseInt(selectedDayForEvent.split('_')[1]) : 0;
                                  const dayEvents = isTemplate 
                                    ? (eventTemplates[weekdayIndex] || [])
                                    : getDayEvents(selectedDayForEvent, new Date(selectedDayForEvent));
                                  
                                  const updated = dayEvents.filter((_, idx) => idx !== i);
                                  
                                  if (isTemplate) {
                                    setEventTemplates(prev => ({ ...prev, [weekdayIndex]: updated }));
                                  } else {
                                    setEvents(prev => {
                                      const existing = prev.find(d => d.id === selectedDayForEvent);
                                      if (existing) return prev.map(d => d.id === selectedDayForEvent ? { ...d, events: updated } : d);
                                      return [...prev, { id: selectedDayForEvent, events: updated }];
                                    });
                                  }
                                  setEditingEventIndex(null);
                                }} 
                                disabled={((userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates') || (activeTab !== 'templates' && isEventArchived(selectedDayForEvent))}
                                className={`bg-red-500/80 text-white p-1 rounded-full shadow-md hover:bg-red-500 transition-all ${((userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates') || (activeTab !== 'templates' && isEventArchived(selectedDayForEvent)) ? 'opacity-0 pointer-events-none' : ''}`}
                              >
                                <Trash2 size={9}/>
                              </button>
                            </div>
                          </div>
                          
                          {currentTemplate.fields.some(f => ['colors', 'formatting'].includes(f)) && (
                            <div className="flex flex-col gap-2 pb-1.5 border-b border-black/10">
                                 {currentTemplate.fields.includes('colors') && (
                                   <div className="flex flex-wrap gap-1 justify-center">
                                     {textColors.map(c => (
                                       <button 
                                         key={c} 
                                         onClick={() => updateLocalDetails(selectedDayForEvent, i, 'textColor', c)} 
                                         disabled={userRole === 'singer_manager' && activeTab !== 'templates'}
                                         className={`w-3 h-3 rounded-full transition-all ${ev.textColor?.toLowerCase() === c.toLowerCase() ? 'scale-125 ring-2 ring-offset-1 ring-blue-400' : 'hover:scale-110'} ${userRole === 'singer_manager' && activeTab !== 'templates' ? 'opacity-50 cursor-not-allowed' : ''}`} 
                                         style={{ backgroundColor: c }} 
                                       />
                                     ))}
                                   </div>
                                 )}
                                 {currentTemplate.fields.includes('formatting') && (
                                   <div className="flex flex-wrap gap-2 items-center justify-center">
                                     <div className="flex gap-1 bg-black/10 p-0.5 rounded-lg">
                                       {[
                                         { id: 'left', icon: AlignLeft },
                                         { id: 'center', icon: AlignCenter },
                                         { id: 'right', icon: AlignRight }
                                       ].map(a => (
                                         <button
                                           key={a.id}
                                           onClick={() => updateLocalDetails(selectedDayForEvent, i, 'align', a.id)}
                                           disabled={userRole === 'singer_manager' && activeTab !== 'templates'}
                                           className={`p-1 rounded transition-colors ${ev.align === a.id ? 'bg-white text-blue-600 shadow-sm' : 'text-white/60 hover:text-white'} ${userRole === 'singer_manager' && activeTab !== 'templates' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                         >
                                           <a.icon size={12} />
                                         </button>
                                       ))}
                                     </div>
                                     <div className="w-px h-4 bg-black/10 mx-1" />
                                     <div className="flex gap-1 bg-black/10 p-0.5 rounded-lg">
                                       <button onClick={() => updateLocalDetails(selectedDayForEvent, i, 'isBold', ev.isBold === false ? true : false)} disabled={(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates'} className={`p-1 rounded transition-colors ${ev.isBold !== false ? 'bg-white text-blue-600 shadow-sm' : 'text-white/60 hover:text-white'} ${(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates' ? 'opacity-50 cursor-not-allowed' : ''}`}><Bold size={12} /></button>
                                       <button onClick={() => updateLocalDetails(selectedDayForEvent, i, 'isItalic', ev.isItalic === true ? false : true)} disabled={(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates'} className={`p-1 rounded transition-colors ${ev.isItalic === true ? 'bg-white text-blue-600 shadow-sm' : 'text-white/60 hover:text-white'} ${(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates' ? 'opacity-50 cursor-not-allowed' : ''}`}><Italic size={12} /></button>
                                       <button onClick={() => updateLocalDetails(selectedDayForEvent, i, 'isUnderline', ev.isUnderline === true ? false : true)} disabled={(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates'} className={`p-1 rounded transition-colors ${ev.isUnderline === true ? 'bg-white text-blue-600 shadow-sm' : 'text-white/60 hover:text-white'} ${(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates' ? 'opacity-50 cursor-not-allowed' : ''}`}><Underline size={12} /></button>
                                       <button onClick={() => updateLocalDetails(selectedDayForEvent, i, 'isUppercase', ev.isUppercase === false ? true : false)} disabled={(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates'} className={`p-1 rounded transition-colors ${ev.isUppercase !== false ? 'bg-white text-blue-600 shadow-sm' : 'text-white/60 hover:text-white'} ${(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates' ? 'opacity-50 cursor-not-allowed' : ''}`}><Type size={12} /></button>
                                     </div>
                                     <div className="w-px h-4 bg-black/10 mx-1" />
                                     <div className="flex gap-1 bg-black/10 p-0.5 rounded-lg">
                                       <button 
                                         onClick={() => updateLocalDetails(selectedDayForEvent, i, 'isYearly', !ev.isYearly)} 
                                         disabled={(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates'} 
                                         className={`p-1 rounded transition-colors flex items-center gap-1 ${ev.isYearly ? 'bg-white text-blue-600 shadow-sm' : 'text-white/60 hover:text-white'} ${(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                         title="Показувати в річному плані"
                                       >
                                         <Calendar size={12} />
                                         <span className="text-[0.5rem] font-bold uppercase">Рік</span>
                                       </button>
                                     </div>
                                   </div>
                                 )}
                            </div>
                          )}

                          <div className="flex flex-col gap-2">
                             <div className="space-y-0.5">
                                <label className="text-[0.5rem] font-black text-white uppercase ml-0.5">Подія</label>
                                <div className="flex items-center gap-1">
                                  <input type="checkbox" disabled={(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates'} checked={!!ev.hideTitleInYear} onChange={() => updateLocalDetails(selectedDayForEvent, i, 'hideTitleInYear', !ev.hideTitleInYear)} className={`accent-blue-500 mr-1 ${(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates' ? 'opacity-50 cursor-not-allowed' : ''}`} title="Приховати в річному плані" />
                                  <CustomSelect 
                                    title="ПОДІЯ"
                                    value={ev.title} 
                                groups={(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates' ? eventGroups.filter(g => g.label.toUpperCase() === 'РЕПЕТИЦІЇ') : eventGroups} 
                                    onEditGroup={(g) => setEditingGroup({...g, type: 'event'})}
                                    onAddItem={(item, idx, groupLabel) => handleAddValueToGroup(item, idx, 'event', groupLabel)}
                                    onChange={(v) => updateLocalDetails(selectedDayForEvent, i, 'title', v)} 
                                    placeholder="..." 
                                    className="flex-1"
                                    disabled={(isAdminAuthenticated && (userRole === "singer_manager" || userRole === "preacher_manager" || activeEditingMode === "music") && activeTab !== "templates") || (activeTab !== "admin" && activeTab !== "templates" && userRole !== "admin") || isAssignmentModalOpen || (activeTab !== 'templates' && isEventArchived(selectedDayForEvent))}
                                    allowAppend={true}
                                  />
                                  {ev.title && <button onClick={() => updateLocalDetails(selectedDayForEvent, i, 'title', "")} className={`text-white/50 hover:text-white transition-colors ${(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates' ? 'opacity-0 pointer-events-none' : ''}`} disabled={(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates'}><X size={14}/></button>}
                                </div>
                                <div className="flex items-center gap-1 mt-0.5" style={{ paddingLeft: '21px' }}>
                                  <input 
                                    type="text" 
                                    value={ev.subTitle || ""} 
                                    onChange={(e) => updateLocalDetails(selectedDayForEvent, i, 'subTitle', e.target.value)} 
                                    placeholder="Опис / додаткові пункти події..." 
                                    className={`flex-1 bg-slate-100 border border-slate-300 rounded-lg px-2 py-1.5 text-slate-800 text-[0.5938rem] outline-none focus:border-blue-500 transition-colors font-normal placeholder-slate-400 ${(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates' ? 'opacity-50 cursor-not-allowed bg-slate-200 pointer-events-none' : ''}`}
                                    disabled={(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates'}
                                  />
                                  {ev.subTitle && <button onClick={() => updateLocalDetails(selectedDayForEvent, i, 'subTitle', "")} className={`text-white/50 hover:text-white transition-colors ${(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates' ? 'opacity-0 pointer-events-none' : ''}`} disabled={(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates'}><X size={14}/></button>}
                                </div>
                             </div>
                             {currentTemplate.fields.includes('place') && (
                               <div className="space-y-0.5">
                                  <label className="text-[0.5rem] font-black text-white uppercase ml-0.5">Місце</label>
                                  <div className="flex items-center gap-1">
                                    <input type="checkbox" disabled={(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates'} checked={!!ev.hidePlaceInYear} onChange={() => updateLocalDetails(selectedDayForEvent, i, 'hidePlaceInYear', !ev.hidePlaceInYear)} className={`accent-blue-500 mr-1 ${(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates' ? 'opacity-50 cursor-not-allowed' : ''}`} title="Приховати в річному плані" />
                                    <CustomSelect title="МІСЦЕ" value={ev.place} options={locations} onAddItem={(item) => handleAddValueToGroup(item, 0, 'location')} onChange={(v) => updateLocalDetails(selectedDayForEvent, i, 'place', v)} placeholder="..." className="flex-1" disabled={(isAdminAuthenticated && (userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates') || (activeTab !== 'admin' && activeTab !== 'templates' && userRole !== 'admin') || isAssignmentModalOpen || (activeTab !== 'templates' && isEventArchived(selectedDayForEvent))} allowAppend={true} />
                                    {ev.place && <button onClick={() => updateLocalDetails(selectedDayForEvent, i, 'place', "")} disabled={(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates'} className={`text-white/50 hover:text-white transition-colors ${(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates' ? 'opacity-0 pointer-events-none' : ''}`}><X size={14}/></button>}
                                  </div>
                               </div>
                             )}
                             {currentTemplate.fields.includes('department') && (
                               <div className="space-y-0.5">
                                  <label className="text-[0.5rem] font-black text-white uppercase ml-0.5">Відділ</label>
                                  <div className="flex items-center gap-1">
                                    <CustomSelect title="ВІДДІЛ" value={ev.department} options={departments} onAddItem={(item) => handleAddValueToGroup(item, 0, 'department')} onChange={(v) => updateLocalDetails(selectedDayForEvent, i, 'department', v)} placeholder="..." className="flex-1" disabled={(isAdminAuthenticated && (userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates') || (activeTab !== 'admin' && activeTab !== 'templates' && userRole !== 'admin') || isAssignmentModalOpen || (activeTab !== 'templates' && isEventArchived(selectedDayForEvent))} allowAppend={true} />
                                    {ev.department && <button onClick={() => updateLocalDetails(selectedDayForEvent, i, 'department', "")} disabled={(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates'} className={`text-white/50 hover:text-white transition-colors ${(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates' ? 'opacity-0 pointer-events-none' : ''}`}><X size={14}/></button>}
                                  </div>
                               </div>
                             )}
                             {(currentTemplate.fields.includes('startTime') || currentTemplate.fields.includes('endTime')) && (
                               <div className="space-y-0.5">
                                  <label className="text-[0.5rem] font-black text-white uppercase ml-0.5">Час</label>
                                  <div className="flex gap-2 w-full items-center">
                                    {currentTemplate.fields.includes('startTime') && (
                                      <div className="text-white flex-1 flex items-center gap-1">
                                        <TimeInput label="" value={ev.startTime} onChange={(v) => updateLocalDetails(selectedDayForEvent, i, 'startTime', v)} disabled={(isAdminAuthenticated && (userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates') || (activeTab !== 'admin' && activeTab !== 'templates' && userRole !== 'admin') || isAssignmentModalOpen || (activeTab !== 'templates' && isEventArchived(selectedDayForEvent))} />
                                        <button onClick={() => updateLocalDetails(selectedDayForEvent, i, 'startTime', "")} disabled={(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates'} className={`text-white/50 hover:text-white transition-colors mt-2 ${!ev.startTime ? 'invisible' : ''} ${(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates' ? 'opacity-0 pointer-events-none' : ''}`}><X size={12}/></button>
                                      </div>
                                    )}
                                    {currentTemplate.fields.includes('startTime') && currentTemplate.fields.includes('endTime') && (
                                      <span className="text-white/50 font-bold self-center mt-2">-</span>
                                    )}
                                    {currentTemplate.fields.includes('endTime') && (
                                      <div className="text-white flex-1 flex items-center gap-1">
                                        <TimeInput label="" value={ev.endTime} onChange={(v) => updateLocalDetails(selectedDayForEvent, i, 'endTime', v)} disabled={(isAdminAuthenticated && (userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates') || (activeTab !== 'admin' && activeTab !== 'templates' && userRole !== 'admin') || isAssignmentModalOpen || (activeTab !== 'templates' && isEventArchived(selectedDayForEvent))} />
                                        {ev.endTime && <button onClick={() => updateLocalDetails(selectedDayForEvent, i, 'endTime', "")} disabled={(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates'} className={`text-white/50 hover:text-white transition-colors mt-2 ${(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates' ? 'opacity-0 pointer-events-none' : ''}`}><X size={12}/></button>}
                                      </div>
                                    )}
                                  </div>
                               </div>
                             )}
                          </div>

                          {!ev.title?.toUpperCase().includes('ПРИБИРАННЯ') && (
                            <>
                              {currentTemplate.fields.includes('leads') && (
                                <div className="space-y-1 pt-1.5 border-t border-black/10">
                                   <div className='flex items-center gap-2'>
                                     <label className="text-[0.5rem] font-black text-white uppercase ml-0.5">Служителі (Хто)</label>
                                     <input type="checkbox" disabled={(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates'} checked={!!ev.hideLeadsInYear} onChange={() => updateLocalDetails(selectedDayForEvent, i, 'hideLeadsInYear', !ev.hideLeadsInYear)} className={`accent-blue-500 ${(userRole === 'singer_manager' || activeEditingMode === 'music') && activeTab !== 'templates' ? 'opacity-50 cursor-not-allowed' : ''}`} title="Приховати в річному плані" />
                                   </div>
                                   <div className="flex flex-col gap-2">
                                     {ev.leads?.map((l, lIdx) => (
                                       <div key={lIdx} className="flex gap-1 items-center w-full">
                                          <CustomSelect title="СЛУЖІННЯ" value={l} groups={(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates' ? staffGroups.filter(g => g.label.toUpperCase() === 'РЕГЕНТИ') : staffGroups.filter(g => g.label !== "Хто співає / грає")} onEditGroup={(g) => setEditingGroup({...g, type: 'staff'})} onAddItem={(item, idx, groupLabel) => handleAddValueToGroup(item, idx, 'staff', groupLabel)} onChange={(v) => { 
                                              const nL = [...ev.leads]; 
                                              if (nL[lIdx] && nL[lIdx].trim() !== "") {
                                                nL.push(v);
                                              } else {
                                                nL[lIdx] = v;
                                              }
                                              updateLocalDetails(selectedDayForEvent, i, 'leads', nL); 
                                            }} placeholder="Хто..." className="flex-1" disabled={(activeTab !== 'admin' && activeTab !== 'templates' && userRole !== 'preacher_manager' && userRole !== 'admin' && userRole !== 'singer_manager') || isAssignmentModalOpen || ((userRole === 'singer_manager' || activeEditingMode === 'music') && activeTab !== 'templates') || (activeTab !== 'templates' && isEventArchived(selectedDayForEvent))} allowAppend={true} onAssignPreachers={() => {
                                            setPendingAssignmentCallback(() => (val: string) => {
                                              const nL = [...ev.leads];
                                              nL[lIdx] = val;
                                              updateLocalDetails(selectedDayForEvent, i, 'leads', nL);
                                            });
                                            setIsAssignmentModalOpen(true);
                                          }} />
                                          {l && <button onClick={() => { const nL = [...ev.leads]; nL[lIdx] = ""; updateLocalDetails(selectedDayForEvent, i, 'leads', nL); }} className={`text-white/50 hover:text-white transition-colors ${(userRole === 'singer_manager' || activeEditingMode === 'music') && activeTab !== 'templates' ? 'opacity-0 pointer-events-none' : ''}`} disabled={(userRole === 'singer_manager' || activeEditingMode === 'music') && activeTab !== 'templates'}><X size={14}/></button>}
                                          {ev.leads.length > 1 && <button onClick={() => updateLocalDetails(selectedDayForEvent, i, 'leads', ev.leads.filter((_, idx) => idx !== lIdx))} className={`text-red-200 p-0.5 hover:text-white ${(userRole === 'singer_manager' || activeEditingMode === 'music') && activeTab !== 'templates' ? 'opacity-0 pointer-events-none' : ''}`} disabled={(userRole === 'singer_manager' || activeEditingMode === 'music') && activeTab !== 'templates'}><X size={14}/></button>}
                                       </div>
                                     ))}
                                     <button onClick={() => updateLocalDetails(selectedDayForEvent, i, 'leads', [...(ev.leads || []), ""])} className={`text-[0.5625rem] text-white/80 font-black hover:text-white ml-0.5 tracking-wide flex items-center gap-1 h-6 ${(userRole === 'singer_manager' || activeEditingMode === 'music') && activeTab !== 'templates' ? 'opacity-0 pointer-events-none' : ''}`} disabled={(userRole === 'singer_manager' || activeEditingMode === 'music') && activeTab !== 'templates'}><Plus size={10}/> Додати</button>
                                   </div>
                                </div>
                              )}

                              {currentTemplate.fields.includes('music') && (
                                <div className="space-y-0.5">
                                   <div className='flex items-center gap-2'>
                                     <label className="text-[0.5rem] font-black text-white uppercase ml-0.5">Музика</label>
                                     <input type="checkbox" disabled={(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates'} checked={!!ev.hideMusicInYear} onChange={() => updateLocalDetails(selectedDayForEvent, i, 'hideMusicInYear', !ev.hideMusicInYear)} className={`accent-blue-500 ${(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates' ? 'opacity-50 cursor-not-allowed' : ''}`} title="Приховати в річному плані" />
                                   </div>
                                   <div className="flex items-center gap-1">
                                     <CustomSelect title="МУЗИКА" value={ev.music} groups={(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates' ? musicGroups.filter(g => g.label.toUpperCase() === 'МУЗ. ГРУПИ' || g.label.toUpperCase() === 'ХОРИ') : musicGroups} onEditGroup={(g) => setEditingGroup({...g, type: 'music'})} onAddItem={(item, idx, groupLabel) => handleAddValueToGroup(item, idx, 'music', groupLabel)} onChange={(v) => updateLocalDetails(selectedDayForEvent, i, 'music', v)} placeholder="..." className="flex-1" disabled={(activeTab !== 'admin' && activeTab !== 'templates' && userRole !== 'preacher_manager' && userRole !== 'admin' && userRole !== 'singer_manager') || isAssignmentModalOpen || ((userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates') || (activeTab !== 'templates' && isEventArchived(selectedDayForEvent))} allowAppend={true} />
                                     {ev.music && <button onClick={() => updateLocalDetails(selectedDayForEvent, i, 'music', "")} className="text-white/50 hover:text-white transition-colors"><X size={14}/></button>}
                                   </div>
                                </div>
                              )}
                            </>
                          )}

                          <button 
                            onClick={() => {
                              commitToDB(selectedDayForEvent, dayEvents, false);
                              setEditingEventIndex(null);
                            }} 
                            className="w-full bg-slate-900 text-white py-1.5 text-[0.5rem] font-black uppercase flex items-center justify-center gap-1.5 mt-1 hover:bg-black transition-colors active:scale-[0.98] shadow-md"
                          >
                            <Save size={12}/> Зберегти зміни
                          </button>
                        </div>
                      );
                    })}
                  </>
                );
              })()}
              
              <button 
                onClick={() => addEventToDay(selectedDayForEvent)} 
                disabled={(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates' || (activeTab !== 'templates' && isEventArchived(selectedDayForEvent))}
                className={`w-full border-2 border-dashed border-slate-600 py-3 rounded-xl text-[0.625rem] font-black uppercase transition-all flex items-center justify-center gap-2 tracking-wider text-slate-400 hover:bg-slate-700/50 hover:text-white hover:border-slate-500 ${(userRole === 'singer_manager' || userRole === 'preacher_manager' || activeEditingMode === 'music') && activeTab !== 'templates' ? 'opacity-0 pointer-events-none' : ''}`}
              >
                <Plus size={14}/> ДОДАТИ ПОДІЮ
              </button>
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-700 flex flex-col gap-3">
               <div className="flex gap-3">
                 <button 
                   onClick={() => setSelectedDayForEvent(null)} 
                   className="flex-1 bg-slate-800 text-slate-300 py-2.5 rounded-xl text-[0.625rem] font-black uppercase hover:bg-slate-700 transition-colors"
                 >
                   Скасувати
                 </button>
                 {selectedDayForEvent.startsWith('template_') ? (
                   <button 
                     onClick={async () => {
                       const weekdayIndex = parseInt(selectedDayForEvent.split('_')[1]);
                       const templateEvents = eventTemplates[weekdayIndex] || [];
                       await saveTemplate(weekdayIndex, templateEvents);
                       setSelectedDayForEvent(null);
                     }} 
                     className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-[0.625rem] font-black uppercase flex items-center justify-center gap-2 hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20"
                   >
                     <Save size={14}/> ЗБЕРЕГТИ ШАБЛОН
                   </button>
                 ) : (
                   <button 
                     onClick={async () => {
                       const dayEvents = getDayEvents(selectedDayForEvent, new Date(selectedDayForEvent));
                       await commitToDB(selectedDayForEvent, dayEvents, false);
                       setSelectedDayForEvent(null);
                     }} 
                     className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-[0.625rem] font-black uppercase flex items-center justify-center gap-2 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
                   >
                     <Save size={14}/> ЗБЕРЕГТИ ЗМІНИ
                   </button>
                 )}
               </div>
            </div>
          </div>
        </div>
      )}

      {editingGroup && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-[21.25rem] rounded-[1.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center">
               <div className="flex flex-col w-full pr-4">
                  <span className="text-blue-500 text-[0.4375rem] font-bold uppercase tracking-widest leading-none mb-1">Редагування категорії</span>
                  <input 
                    type="text" 
                    defaultValue={editingGroup.label} 
                    onBlur={(e) => handleRenameGroup(editingGroup.label, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    className="bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 text-white text-[0.6875rem] font-black uppercase tracking-tight leading-tight outline-none w-full transition-colors"
                    spellCheck={false} autoCorrect="off" autoComplete="off" autoCapitalize="off"
                  />
               </div>
               <button onClick={() => setEditingGroup(null)} className="text-slate-500 hover:text-white transition-colors p-1 shrink-0"><X size={16}/></button>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-900/40 p-1.5">
               <div className="grid grid-cols-1 gap-0.5">
                 {sortAlphabetically(editingGroup.items).map((item) => (
                   <div key={item} className="flex items-center justify-between bg-slate-800/40 hover:bg-slate-800 px-2 py-0.5 rounded transition-all group">
                      <input 
                        type="text" 
                        defaultValue={item} 
                        onBlur={(e) => handleRenameItemInGroup(item, e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                        className="bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 text-white text-[0.5rem] font-bold truncate outline-none w-full mr-2 transition-colors"
                        spellCheck={false} autoCorrect="off" autoComplete="off" autoCapitalize="off"
                      />
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleRemoveItemFromGroup(item)} className="text-slate-600 hover:text-red-400 p-0.5 shrink-0"><Trash2 size={10} /></button>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
            <div className="p-3 bg-slate-800 border-t border-slate-700">
               <button 
                  onClick={() => setEditingGroup(null)} 
                  className="w-full flex items-center justify-center gap-2 mb-3 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-[0.625rem] font-black uppercase rounded-lg transition-all"
               >
                 ⬅ НАЗАД
               </button>
               {editingGroup.type !== 'location' && (
                 <div className="mb-3">
                   <span className="text-slate-500 text-[0.4375rem] font-bold uppercase tracking-widest leading-none mb-2 block">Копіювати до:</span>
                   <div className="flex gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                     {editingGroup.type !== 'event' && (
                       <button onClick={() => handleDuplicateGroupTo('event')} className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded text-[0.4375rem] font-black uppercase tracking-wider transition-colors shrink-0">
                         <Copy size={8} /> Події
                       </button>
                     )}
                     {editingGroup.type !== 'music' && (
                       <button onClick={() => handleDuplicateGroupTo('music')} className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded text-[0.4375rem] font-black uppercase tracking-wider transition-colors shrink-0">
                         <Copy size={8} /> Музика
                       </button>
                     )}
                     {editingGroup.type !== 'staff' && (
                       <button onClick={() => handleDuplicateGroupTo('staff')} className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded text-[0.4375rem] font-black uppercase tracking-wider transition-colors shrink-0">
                         <Copy size={8} /> Служіння
                       </button>
                     )}
                   </div>
                 </div>
               )}
               <div className="flex gap-2 mb-3">
                 <input autoFocus type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddItemToGroup()} placeholder="Новий запис..." className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-white text-[0.5625rem] font-bold outline-none focus:border-blue-500 transition-all" spellCheck={false} autoCorrect="off" autoComplete="off" autoCapitalize="off" />
                 <button onClick={handleAddItemToGroup} className="bg-blue-600 text-white px-3 rounded-md text-[0.5rem] font-black uppercase"><Plus size={12}/></button>
               </div>
               <button onClick={() => setEditingGroup(null)} className="w-full bg-slate-700/50 text-slate-300 py-1.5 rounded-lg text-[0.5rem] font-black uppercase tracking-widest hover:bg-slate-700 transition-colors">Закрити</button>
            </div>
          </div>
        </div>
      )}
      {isAssignmentModalOpen && createPortal(
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md print:absolute print:inset-0 print:bg-white print:p-0 print:block">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col print:h-auto print:max-h-none print:border-none print:shadow-none print:rounded-none print:bg-white print:p-0">
            <div className="flex justify-between items-center mb-4 shrink-0 print:hidden">
              <h3 className="text-white font-black uppercase text-sm">Призначення проповідників</h3>
              <button onClick={() => setIsAssignmentModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            
            <div className="flex-1 overflow-auto pr-2 print:overflow-visible print:pr-0">
              <PreacherAssignment 
                staffGroups={staffGroups} 
                events={events} 
                db={db} 
                appId={appId} 
                doc={doc} 
                setDoc={setDoc} 
                backgroundColor={appSettings.backgroundColor} 
                isWaitingForTableSelection={true}
                selectedCalendarCell={{ dateKey: selectedDayForEvent }}
                userRole={userRole}
                initialDate={new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)}
                onMonthChange={(d) => setSelectedDate(d)}
                onAssignmentComplete={(data) => {
                  if (pendingAssignmentCallback && data?.assignment) {
                    pendingAssignmentCallback(data.assignment);
                    setPendingAssignmentCallback(null);
                    setIsAssignmentModalOpen(false); // Close modal only after callback is executed
                  }
                }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {reminderModalData && reminderModalData.isOpen && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-sm rounded-[1.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-4 py-3 border-b border-slate-700 flex justify-between items-center bg-slate-900 shrink-0">
               <div className="flex flex-col">
                  <span className="text-blue-500 text-[0.5625rem] font-bold uppercase tracking-widest leading-none">
                    Нагадування
                  </span>
                  <h3 className="text-white text-lg font-semibold leading-tight capitalize">
                    Налаштування
                  </h3>
               </div>
               <button onClick={() => setReminderModalData(null)} className="text-slate-500 hover:text-white transition-colors p-1"><X size={20}/></button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
               <div className="flex gap-3">
                 {/* Minimal Calendar display */}
                 <div className="relative flex-1">
                   <label className="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Дата</label>
                   <button 
                     type="button"
                     onClick={() => setReminderModalData({...reminderModalData, showCalendar: !reminderModalData.showCalendar})}
                     className="w-full flex justify-center items-center bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 hover:bg-slate-800 transition-colors gap-2"
                   >
                     <Calendar size={14} className="text-blue-500"/>
                     <span className="font-medium text-slate-200">
                       {reminderModalData.date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                     </span>
                   </button>
                   
                   {reminderModalData.showCalendar && (
                     <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700 mt-2 absolute z-20 w-[15rem] shadow-2xl top-full left-0 origin-top-left">
                       <div className="flex justify-between items-center mb-3">
                         <button 
                           onClick={() => {
                             const nd = new Date(reminderModalData.date);
                             nd.setMonth(nd.getMonth() - 1);
                             setReminderModalData({...reminderModalData, date: nd});
                           }}
                           className="text-slate-400 hover:text-white p-1"
                         >
                           <ChevronLeft size={16} />
                         </button>
                         <div className="text-center font-black text-white uppercase text-[0.625rem] tracking-widest">
                           {reminderModalData.date.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' })}
                         </div>
                         <button 
                           onClick={() => {
                             const nd = new Date(reminderModalData.date);
                             nd.setMonth(nd.getMonth() + 1);
                             setReminderModalData({...reminderModalData, date: nd});
                           }}
                           className="text-slate-400 hover:text-white p-1"
                         >
                           <ChevronRight size={16} />
                         </button>
                       </div>
                       
                       <div className="grid grid-cols-7 gap-1">
                         {['Пн', 'Вв', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(d => (
                           <div key={d} className="text-center text-[0.5625rem] font-black text-slate-500 mb-1">{d}</div>
                         ))}
                         {(() => {
                           const year = reminderModalData.date.getFullYear();
                           const month = reminderModalData.date.getMonth();
                           const daysInMonth = new Date(year, month + 1, 0).getDate();
                           const firstDay = new Date(year, month, 1).getDay();
                           const emptyDays = firstDay === 0 ? 6 : firstDay - 1;
                           
                           const cells = [];
                           for (let i = 0; i < emptyDays; i++) cells.push(<div key={`empty-${i}`} />);
                           for (let i = 1; i <= daysInMonth; i++) {
                             const isSelected = i === reminderModalData.date.getDate();
                             cells.push(
                               <button 
                                 key={i} 
                                 onClick={() => {
                                   const newDate = new Date(year, month, i);
                                   setReminderModalData({...reminderModalData, date: newDate, showCalendar: false});
                                 }}
                                 className={`flex items-center justify-center text-[0.625rem] rounded-full aspect-square transition-all hover:bg-slate-700 ${isSelected ? 'border-[2px] border-blue-500 text-white font-black' : 'text-slate-300 font-medium'}`}
                               >
                                 {i}
                               </button>
                             );
                           }
                           return cells;
                         })()}
                       </div>
                     </div>
                   )}
                 </div>
  
                 <div className="flex-1">
                   <label className="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Час</label>
                   <input 
                     type="time" 
                     value={reminderModalData.time} 
                     onChange={e => setReminderModalData({...reminderModalData, time: e.target.value})}
                     className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                   />
                 </div>
               </div>

               <div className="relative">
                 <div className="flex justify-between items-end mb-1.5">
                   <label className="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest block">Google Акаунт (Email)</label>
                   <button 
                     type="button"
                     onClick={() => {
                        const newSettings = { ...appSettings, defaultReminderEmail: reminderModalData.email };
                        setAppSettings(newSettings);
                        if (isAdminAuthenticated && db) {
                          setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'general'), { defaultReminderEmail: reminderModalData.email }, { merge: true });
                        }
                     }}
                     className={`flex items-center gap-1 text-[0.5625rem] font-bold p-1 rounded transition-colors ${(appSettings as any).defaultReminderEmail === reminderModalData.email && reminderModalData.email ? 'text-yellow-400 bg-yellow-400/10' : 'text-slate-500 hover:text-slate-300'}`}
                     title="Зробити за замовчуванням"
                   >
                     <Star size={10} fill={(appSettings as any).defaultReminderEmail === reminderModalData.email && reminderModalData.email ? "currentColor" : "none"} />
                     За замовчуванням
                   </button>
                 </div>
                 <input 
                   type="email" 
                   list="saved-emails"
                   value={reminderModalData.email} 
                   onChange={e => setReminderModalData({...reminderModalData, email: e.target.value})}
                   placeholder="example@gmail.com"
                   className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                 />
                 <datalist id="saved-emails">
                   {((appSettings as any).reminderEmails || []).map((email: string) => (
                     <option key={email} value={email} />
                   ))}
                 </datalist>
               </div>

               <div>
                 <label className="text-[0.625rem] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Текст нагадування</label>
                 <textarea 
                   rows={3}
                   value={reminderModalData.text} 
                   onChange={e => setReminderModalData({...reminderModalData, text: e.target.value})}
                   className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                 />
                 <div className="text-[0.5625rem] text-slate-500 mt-1.5 leading-tight">
                   💡 <span className="font-bold text-slate-400">Підказка:</span> Щоб відкласти повідомлення у Telegram або зберегти його, після переходу натисніть правою кнопкою миші (або затисніть на телефоні) кнопку відправлення та оберіть <b>«Відкласти відправлення»</b>.
                 </div>
               </div>
            </div>

            <div className="p-4 border-t border-slate-700 flex flex-wrap gap-2">
               <button 
                 onClick={() => setReminderModalData(null)}
                 className="px-4 py-2 bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-slate-600 transition-colors"
               >
                 Скасувати
               </button>
               {appSettings?.telegramBotToken && appSettings?.telegramChatId && (
                 <button 
                   onClick={async () => {
                     const startObj = new Date(reminderModalData.date);
                     const [h, m] = (reminderModalData.time || '09:00').split(':');
                     startObj.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
                     const reminderId = Date.now().toString();
                     
                     if (startObj > new Date()) {
                       // Schedule
                       await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'reminders', reminderId), {
                           text: reminderModalData.text,
                           triggerAt: startObj.toISOString(),
                           type: 'telegram',
                           status: 'pending',
                           createdAt: new Date().toISOString()
                       });
                       setReminderModalData({...reminderModalData, text: '✓ Відкладено (через бота)'});
                     } else {
                       // Send now
                       try {
                         await fetch(`https://api.telegram.org/bot${appSettings.telegramBotToken}/sendMessage`, {
                             method: 'POST',
                             headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify({
                               chat_id: appSettings.telegramChatId,
                               text: `${reminderModalData.text || ''}`,
                               parse_mode: 'Markdown'
                             })
                         });
                         setReminderModalData({...reminderModalData, text: '✓ Відправлено!'});
                       } catch(e) {
                         setReminderModalData({...reminderModalData, text: '❌ Помилка відправки'});
                       }
                     }
                     setTimeout(() => setReminderModalData(null), 1500);
                   }}
                   className="flex-1 px-3 py-2 bg-[#7064d4] text-white font-bold rounded-xl text-[0.625rem] sm:text-xs uppercase tracking-widest hover:bg-[#5b4fbf] transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                   disabled={!reminderModalData.time}
                   title="Автоматично надіслати чи запланувати через бота"
                 >
                   <Send size={14} />
                   Бот
                 </button>
               )}
               <button 
                 onClick={() => {
                   const telegramUrl = new URL('https://t.me/share/url');
                   const text = reminderModalData.text || '';
                   telegramUrl.searchParams.append('url', '');
                   telegramUrl.searchParams.append('text', text);
                   window.open(telegramUrl.toString(), '_blank');
                   
                   setReminderModalData({...reminderModalData, text: '✓ Відкрито в Telegram!'});
                   setTimeout(() => setReminderModalData(null), 1500);
                 }}
                 className="flex-1 px-3 py-2 bg-[#0088cc] text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-[#0077b3] transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                 disabled={!reminderModalData.time}
                 title="Надіслати в Telegram"
               >
                 <Send size={14} />
                 Telegram
               </button>
               <button 
                 onClick={async () => {
                   // Save email to DB if it's new
                   const emailsStr = reminderModalData.email.trim();
                   if (emailsStr) {
                       const currentEmails = (appSettings as any).reminderEmails || [];
                       if (!currentEmails.includes(emailsStr)) {
                           const updatedSettings = { ...appSettings, reminderEmails: [...currentEmails, emailsStr] };
                           setAppSettings(updatedSettings);
                           if (isAdminAuthenticated && db) {
                             await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'general'), { reminderEmails: updatedSettings.reminderEmails }, { merge: true });
                           }
                       }
                   }

                   // Auto-Send / Save to DB for a backend worker to process
                   if (isAdminAuthenticated && db && emailsStr) {
                     const reminderId = Date.now().toString() + Math.random().toString(36).substring(7);
                     
                     // Формуємо дату і час
                     const startObj = new Date(reminderModalData.date);
                     const [h, m] = (reminderModalData.time || '09:00').split(':');
                     startObj.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);

                     await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'reminders', reminderId), {
                       targetEmail: emailsStr, // we'll just save the raw string
                       triggerAt: startObj.toISOString(),
                       text: reminderModalData.text,
                       status: 'pending',
                       createdAt: new Date().toISOString()
                     });
                   }

                   // Create Google Calendar URL for immediate addition
                   const startObj = new Date(reminderModalData.date);
                   const [h, m] = (reminderModalData.time || '09:00').split(':');
                   startObj.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
                   const pad = (n: number) => n < 10 ? '0' + n : String(n);
                   const formatGCalDate = (date: Date) => {
                     return String(date.getUTCFullYear()) + 
                            pad(date.getUTCMonth() + 1) + 
                            pad(date.getUTCDate()) + 'T' + 
                            pad(date.getUTCHours()) + 
                            pad(date.getUTCMinutes()) + 
                            pad(date.getUTCSeconds()) + 'Z';
                   };
                   
                   const endObj = new Date(startObj.getTime() + 60 * 60 * 1000); // 1 hour duration
                   const gCalUrl = new URL('https://calendar.google.com/calendar/render');
                   gCalUrl.searchParams.append('action', 'TEMPLATE');
                   gCalUrl.searchParams.append('dates', `${formatGCalDate(startObj)}/${formatGCalDate(endObj)}`);
                   gCalUrl.searchParams.append('text', reminderModalData.text ? reminderModalData.text.substring(0, 50) : '');
                   if (reminderModalData.text) {
                     gCalUrl.searchParams.append('details', reminderModalData.text);
                   }
                   if (emailsStr) {
                     const emailList = emailsStr.split(/[,;]/).map((e: string) => e.trim()).filter(Boolean);
                     if (emailList.length > 0) {
                       gCalUrl.searchParams.append('add', emailList.join(','));
                     }
                   }
                   
                   window.open(gCalUrl.toString(), '_blank');
                   
                   // UI Feedback
                   setReminderModalData({...reminderModalData, text: '✓ Відкрито в Google Calendar!'});
                   setTimeout(() => setReminderModalData(null), 1500);
                 }}
                 className="flex-1 px-3 py-2 bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-blue-500 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                 disabled={!reminderModalData.time}
                 title="Додати в Google Календар"
               >
                 <Bell size={14} />
                 Google Cal
               </button>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-[20rem] rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 text-center">
              <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-white font-black uppercase text-xs mb-2 tracking-widest">{confirmAction.title}</h3>
              <p className="text-slate-400 text-[0.625rem] font-medium leading-relaxed">{confirmAction.message}</p>
            </div>
            <div className="flex border-t border-slate-700">
              <button 
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-3 text-slate-400 text-[0.5625rem] font-black uppercase tracking-widest hover:bg-slate-700/50 transition-colors border-r border-slate-700"
              >
                Скасувати
              </button>
              <button 
                onClick={confirmAction.onConfirm}
                className="flex-1 px-4 py-3 text-red-500 text-[0.5625rem] font-black uppercase tracking-widest hover:bg-red-500/10 transition-colors"
              >
                Видалити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

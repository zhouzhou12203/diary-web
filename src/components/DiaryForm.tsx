import React, { Suspense, lazy, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import type { DiaryEntry, MoodType, WeatherType, LocationInfo } from '../types/index.ts';
import { ModalHeader } from './ModalHeader';
import { ModalShell } from './ModalShell';
import { useThemeContext } from './ThemeProvider';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useIsMobile } from '../hooks/useIsMobile';
import type { ThemeConfig } from '../hooks/useTheme';

const MarkdownEditor = lazy(() =>
  import('./MarkdownEditor').then((module) => ({ default: module.MarkdownEditor }))
);
const ImageUpload = lazy(() =>
  import('./ImageUpload').then((module) => ({ default: module.ImageUpload }))
);
const LocationPicker = lazy(() =>
  import('./LocationPicker').then((module) => ({ default: module.LocationPicker }))
);

interface DiaryFormProps {
  entry?: DiaryEntry;
  onSave: (entry: Omit<DiaryEntry, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
}

type DiaryFormOption<T extends string> = {
  value: T;
  label: string;
  emoji?: string;
};

type DiaryFormConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  ariaLabel: string;
  title: string;
  description: ReactNode;
  cancelLabel: string;
  confirmLabel: string;
  onConfirm: () => void;
  confirmTone: 'primary' | 'accent';
  theme: ThemeConfig;
};

type DiaryFormSelectWithCustomFieldProps = {
  label: string;
  value: string;
  options: DiaryFormOption<string>[];
  customOptionLabel: string;
  showCustom: boolean;
  customValue: string;
  customPlaceholder: string;
  onSelectChange: (value: string) => void;
  onCustomChange: (value: string) => void;
  theme: ThemeConfig;
  isMobile: boolean;
};

const moods: DiaryFormOption<MoodType>[] = [
  { value: 'happy', label: '开心', emoji: '😊' },
  { value: 'sad', label: '难过', emoji: '😢' },
  { value: 'neutral', label: '平静', emoji: '😐' },
  { value: 'excited', label: '兴奋', emoji: '🤩' },
  { value: 'anxious', label: '焦虑', emoji: '😰' },
  { value: 'peaceful', label: '平和', emoji: '😌' },
  { value: 'calm', label: '冷静', emoji: '😌' },
  { value: 'angry', label: '愤怒', emoji: '😠' },
  { value: 'grateful', label: '感恩', emoji: '🙏' },
  { value: 'loved', label: '被爱', emoji: '🥰' },
];

const weathers: DiaryFormOption<WeatherType>[] = [
  { value: 'sunny', label: '晴天' },
  { value: 'cloudy', label: '多云' },
  { value: 'rainy', label: '雨天' },
  { value: 'snowy', label: '雪天' },
  { value: 'unknown', label: '未知' },
];

const DIARY_FORM_DRAFT_KEY = 'diary_form_draft';

type DiaryFormSnapshot = {
  title: string;
  content: string;
  contentType: 'markdown' | 'plain';
  mood: string;
  weather: string;
  customMood: string;
  customWeather: string;
  images: string[];
  location: LocationInfo | null;
  tags: string[];
};

type DiaryFormDraft = DiaryFormSnapshot & {
  updatedAt: string;
};

function createEmptySnapshot(): DiaryFormSnapshot {
  return {
    title: '',
    content: '',
    contentType: 'markdown',
    mood: 'neutral',
    weather: 'unknown',
    customMood: '',
    customWeather: '',
    images: [],
    location: null,
    tags: [],
  };
}

function formatDraftTime(value: string) {
  return new Date(value).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getFormControlStyle(theme: ThemeConfig): CSSProperties {
  return {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    '--tw-ring-color': theme.colors.primary,
  } as CSSProperties;
}

function getSecondaryButtonStyle(theme: ThemeConfig): CSSProperties {
  return {
    color: theme.colors.textSecondary,
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.surface,
  };
}

function getStatusPillStyle(theme: ThemeConfig, tone: 'saving' | 'dirty' | 'saved'): CSSProperties {
  if (tone === 'dirty') {
    return {
      backgroundColor: 'rgba(245, 158, 11, 0.12)',
      border: '1px solid rgba(245, 158, 11, 0.28)',
      color: '#b45309',
    };
  }

  if (tone === 'saving') {
    return {
      backgroundColor: `${theme.colors.primary}16`,
      border: `1px solid ${theme.colors.primary}33`,
      color: theme.colors.primary,
    };
  }

  return {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.28)',
    color: '#047857',
  };
}

function buildSnapshot(input: DiaryFormSnapshot) {
  return JSON.stringify({
    ...input,
    title: input.title.trim(),
    content: input.content.trim(),
    customMood: input.customMood.trim(),
    customWeather: input.customWeather.trim(),
    images: [...input.images],
    tags: [...input.tags],
  });
}

function hasMeaningfulDraft(input: DiaryFormSnapshot) {
  return Boolean(
    input.title.trim() ||
    input.content.trim() ||
    input.customMood.trim() ||
    input.customWeather.trim() ||
    input.images.length > 0 ||
    input.location ||
    input.tags.length > 0
  );
}

function shouldShowAdvancedOptions(snapshot: DiaryFormSnapshot) {
  return (
    snapshot.images.length > 0 ||
    snapshot.tags.length > 0 ||
    Boolean(snapshot.location) ||
    snapshot.mood === 'custom' ||
    snapshot.weather === 'custom'
  );
}

function isPresetOption(options: DiaryFormOption<string>[], value: string) {
  return options.some((option) => option.value === value);
}

function resolveSelectableField(options: DiaryFormOption<string>[], value: string, fallbackValue: string) {
  const normalizedValue = value || fallbackValue;

  if (isPresetOption(options, normalizedValue)) {
    return {
      value: normalizedValue,
      customValue: '',
    };
  }

  return {
    value: 'custom',
    customValue: normalizedValue,
  };
}

function createSnapshotFromEntry(entry: DiaryEntry): DiaryFormSnapshot {
  const moodState = resolveSelectableField(moods, entry.mood || 'neutral', 'neutral');
  const weatherState = resolveSelectableField(weathers, entry.weather || 'unknown', 'unknown');

  return {
    title: entry.title,
    content: entry.content,
    contentType: (entry.content_type as 'markdown' | 'plain') || 'markdown',
    mood: moodState.value,
    weather: weatherState.value,
    customMood: moodState.customValue,
    customWeather: weatherState.customValue,
    images: entry.images || [],
    location: entry.location || null,
    tags: entry.tags || [],
  };
}

function resolveSubmittedValue(value: string, customValue: string) {
  return value === 'custom' ? customValue.trim() : value;
}

function readStoredDraft(): DiaryFormDraft | null {
  try {
    const raw = localStorage.getItem(DIARY_FORM_DRAFT_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<DiaryFormDraft>;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const normalizedDraft: DiaryFormDraft = {
      title: typeof parsed.title === 'string' ? parsed.title : '',
      content: typeof parsed.content === 'string' ? parsed.content : '',
      contentType: parsed.contentType === 'plain' ? 'plain' : 'markdown',
      mood: typeof parsed.mood === 'string' ? parsed.mood : 'neutral',
      weather: typeof parsed.weather === 'string' ? parsed.weather : 'unknown',
      customMood: typeof parsed.customMood === 'string' ? parsed.customMood : '',
      customWeather: typeof parsed.customWeather === 'string' ? parsed.customWeather : '',
      images: Array.isArray(parsed.images) ? parsed.images.filter((item): item is string => typeof item === 'string') : [],
      location: parsed.location && typeof parsed.location === 'object' ? parsed.location as LocationInfo : null,
      tags: Array.isArray(parsed.tags) ? parsed.tags.filter((item): item is string => typeof item === 'string') : [],
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };

    return normalizedDraft;
  } catch {
    return null;
  }
}

function DiaryFormConfirmDialog({
  isOpen,
  onClose,
  ariaLabel,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onConfirm,
  confirmTone,
  theme,
}: DiaryFormConfirmDialogProps) {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={ariaLabel}
      zIndex={60}
      panelClassName="w-full max-w-md rounded-xl"
      panelStyle={{
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
      }}
      backdropStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
    >
      <div className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: theme.colors.text }}>
            {title}
          </h3>
          <div className="mt-2 text-sm leading-6" style={{ color: theme.colors.textSecondary }}>
            {description}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 transition-colors"
            style={getSecondaryButtonStyle(theme)}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg px-4 py-2 font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: confirmTone === 'accent' ? theme.colors.accent : theme.colors.primary }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function DiaryFormSelectWithCustomField({
  label,
  value,
  options,
  customOptionLabel,
  showCustom,
  customValue,
  customPlaceholder,
  onSelectChange,
  onCustomChange,
  theme,
  isMobile,
}: DiaryFormSelectWithCustomFieldProps) {
  const controlStyle = getFormControlStyle(theme);

  return (
    <div>
      <label
        className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium mb-2`}
        style={{ color: theme.colors.text }}
      >
        {label}
      </label>
      <div className="space-y-2">
        <select
          value={value}
          onChange={(event) => onSelectChange(event.target.value)}
          className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 transition-all duration-200"
          style={controlStyle}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.emoji ? `${option.emoji} ` : ''}
              {option.label}
            </option>
          ))}
          <option value="custom">{customOptionLabel}</option>
        </select>

        {showCustom && (
          <input
            type="text"
            value={customValue}
            autoComplete="off"
            onChange={(event) => onCustomChange(event.target.value)}
            placeholder={customPlaceholder}
            className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 transition-all duration-200"
            style={controlStyle}
          />
        )}
      </div>
    </div>
  );
}

export function DiaryForm({ entry, onSave, onCancel, isOpen }: DiaryFormProps) {
  const { theme } = useThemeContext();
  const titleInputRef = React.useRef<HTMLInputElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState<'markdown' | 'plain'>('markdown');
  const [mood, setMood] = useState<string>('neutral');
  const [weather, setWeather] = useState<string>('unknown');
  const [customMood, setCustomMood] = useState('');
  const [customWeather, setCustomWeather] = useState('');
  const [showCustomMood, setShowCustomMood] = useState(false);
  const [showCustomWeather, setShowCustomWeather] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [draftToRestore, setDraftToRestore] = useState<DiaryFormDraft | null>(null);
  const [showRestoreDraftPrompt, setShowRestoreDraftPrompt] = useState(false);
  const [showDraftRestoredNotice, setShowDraftRestoredNotice] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const [showDraftSavedNotice, setShowDraftSavedNotice] = useState(false);
  const [showResetDraftConfirm, setShowResetDraftConfirm] = useState(false);
  const initialSnapshotRef = React.useRef<string>('');
  const lastSavedDraftSnapshotRef = React.useRef<string>('');
  const controlStyle = getFormControlStyle(theme);
  const secondaryButtonStyle = getSecondaryButtonStyle(theme);

  const clearStoredDraft = () => {
    localStorage.removeItem(DIARY_FORM_DRAFT_KEY);
  };

  const getCurrentSnapshot = (): DiaryFormSnapshot => ({
    title,
    content,
    contentType,
    mood,
    weather,
    customMood,
    customWeather,
    images,
    location,
    tags,
  });

  const applySnapshot = (snapshot: DiaryFormSnapshot) => {
    setTitle(snapshot.title);
    setContent(snapshot.content);
    setContentType(snapshot.contentType);
    setMood(snapshot.mood);
    setWeather(snapshot.weather);
    setCustomMood(snapshot.customMood);
    setCustomWeather(snapshot.customWeather);
    setShowCustomMood(snapshot.mood === 'custom');
    setShowCustomWeather(snapshot.weather === 'custom');
    setImages(snapshot.images);
    setLocation(snapshot.location);
    setTags(snapshot.tags);
    setShowAdvanced(shouldShowAdvancedOptions(snapshot));
  };

  // 根据当前条目重置表单状态
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const nextFormSnapshot = entry ? createSnapshotFromEntry(entry) : createEmptySnapshot();
    applySnapshot(nextFormSnapshot);

    setTagInput('');
    setShowDiscardConfirm(false);
    setShowRestoreDraftPrompt(false);
    setDraftToRestore(null);
    setShowDraftRestoredNotice(false);
    setShowDraftSavedNotice(false);
    setShowResetDraftConfirm(false);
    setLastDraftSavedAt(null);
    initialSnapshotRef.current = buildSnapshot(nextFormSnapshot);
    lastSavedDraftSnapshotRef.current = '';

    if (!entry) {
      const storedDraft = readStoredDraft();
      if (storedDraft && hasMeaningfulDraft(storedDraft)) {
        setDraftToRestore(storedDraft);
        setLastDraftSavedAt(storedDraft.updatedAt);
        lastSavedDraftSnapshotRef.current = buildSnapshot(storedDraft);
        setShowRestoreDraftPrompt(true);
      }
    }
  }, [entry, isOpen]);

  useBodyScrollLock(isOpen);

  const hasUnsavedChanges = initialSnapshotRef.current !== buildSnapshot(getCurrentSnapshot());
  const formStatus = loading
    ? { label: '正在保存...', tone: 'saving' as const }
    : hasUnsavedChanges
      ? { label: '有未保存改动', tone: 'dirty' as const }
      : !entry && lastDraftSavedAt
        ? { label: `本地草稿已于 ${formatDraftTime(lastDraftSavedAt)} 保存`, tone: 'saved' as const }
        : null;

  useEffect(() => {
    if (!isOpen || !hasUnsavedChanges || loading) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, isOpen, loading]);

  useEffect(() => {
    if (!isOpen || entry || loading || showRestoreDraftPrompt) {
      return;
    }

    const snapshot = getCurrentSnapshot();
    if (!hasMeaningfulDraft(snapshot)) {
      clearStoredDraft();
      setLastDraftSavedAt(null);
      lastSavedDraftSnapshotRef.current = '';
      return;
    }

    const currentSnapshot = buildSnapshot(snapshot);
    if (currentSnapshot === lastSavedDraftSnapshotRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const draft: DiaryFormDraft = {
        ...snapshot,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(DIARY_FORM_DRAFT_KEY, JSON.stringify(draft));
      lastSavedDraftSnapshotRef.current = currentSnapshot;
      setLastDraftSavedAt(draft.updatedAt);
      setShowDraftSavedNotice(true);
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [content, contentType, customMood, customWeather, entry, images, isOpen, loading, location, mood, showRestoreDraftPrompt, tags, title, weather]);

  const requestClose = () => {
    if (loading) {
      return;
    }

    if (hasUnsavedChanges) {
      setShowDiscardConfirm(true);
      return;
    }

    onCancel();
  };

  const handleDiscardChanges = () => {
    setShowDiscardConfirm(false);
    if (!entry) {
      clearStoredDraft();
    }
    onCancel();
  };

  const handleRestoreDraft = () => {
    if (!draftToRestore) {
      return;
    }

    applySnapshot(draftToRestore);
    initialSnapshotRef.current = buildSnapshot(draftToRestore);
    lastSavedDraftSnapshotRef.current = buildSnapshot(draftToRestore);
    setShowRestoreDraftPrompt(false);
    setShowDraftRestoredNotice(true);
    setLastDraftSavedAt(draftToRestore.updatedAt);
  };

  const handleDiscardStoredDraft = () => {
    clearStoredDraft();
    setDraftToRestore(null);
    setShowRestoreDraftPrompt(false);
    setLastDraftSavedAt(null);
    lastSavedDraftSnapshotRef.current = '';
  };

  const handleResetDraft = () => {
    const emptySnapshot = createEmptySnapshot();
    clearStoredDraft();
    applySnapshot(emptySnapshot);
    setTagInput('');
    setDraftToRestore(null);
    setShowRestoreDraftPrompt(false);
    setShowDraftRestoredNotice(false);
    setShowDraftSavedNotice(false);
    setLastDraftSavedAt(null);
    initialSnapshotRef.current = buildSnapshot(emptySnapshot);
    lastSavedDraftSnapshotRef.current = '';
  };

  const requestResetDraft = () => {
    setShowResetDraftConfirm(true);
  };

  useEffect(() => {
    if (!showDraftRestoredNotice) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowDraftRestoredNotice(false);
    }, 2600);

    return () => window.clearTimeout(timeoutId);
  }, [showDraftRestoredNotice]);

  useEffect(() => {
    if (!showDraftSavedNotice) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowDraftSavedNotice(false);
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [showDraftSavedNotice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      await onSave({
        title: title.trim() || '无标题',
        content: content.trim(),
        content_type: contentType,
        mood: resolveSubmittedValue(mood, customMood),
        weather: resolveSubmittedValue(weather, customWeather),
        images,
        location,
        tags,
      });

      if (!entry) {
        clearStoredDraft();
        setLastDraftSavedAt(null);
        lastSavedDraftSnapshotRef.current = '';
      }
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleMoodChange = (value: string) => {
    setMood(value);
    const isCustomValue = value === 'custom';
    setShowCustomMood(isCustomValue);
    if (!isCustomValue) {
      setCustomMood('');
    }
  };

  const handleWeatherChange = (value: string) => {
    setWeather(value);
    const isCustomValue = value === 'custom';
    setShowCustomWeather(isCustomValue);
    if (!isCustomValue) {
      setCustomWeather('');
    }
  };

  const focusContentInput = () => {
    const tryFocus = (attempt = 0) => {
      const contentInput = formRef.current?.querySelector<HTMLTextAreaElement>('textarea[data-diary-content-input="true"]');

      if (contentInput) {
        contentInput.focus();
        const cursorPosition = contentInput.value.length;
        contentInput.setSelectionRange(cursorPosition, cursorPosition);
        return;
      }

      if (attempt < 4) {
        window.setTimeout(() => tryFocus(attempt + 1), 60);
      }
    };

    window.requestAnimationFrame(() => {
      tryFocus();
    });
  };



  if (!isOpen) return null;

  const sectionFallback = (
    <div
      className="rounded-lg border px-4 py-3 text-sm"
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        color: theme.colors.textSecondary,
      }}
    >
      正在加载编辑模块...
    </div>
  );

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={requestClose}
      ariaLabelledby="diary-form-title"
      initialFocusRef={titleInputRef}
      zIndex={50}
      padding={isMobile ? '8px' : '16px'}
      backdropStyle={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        overscrollBehavior: 'contain'
      }}
      panelClassName={`${isMobile ? 'max-w-full rounded-lg' : 'max-w-4xl rounded-xl'} ${theme.effects.blur} w-full overflow-hidden shadow-2xl`}
      panelStyle={{
        backgroundColor: theme.colors.background,
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        display: 'flex',
        flexDirection: 'column',
        height: isMobile ? 'calc(var(--app-height, 100vh) - 16px)' : 'auto',
        maxHeight: isMobile ? 'calc(var(--app-height, 100vh) - 16px)' : '90vh',
      } as CSSProperties}
    >
      <ModalHeader
        titleId="diary-form-title"
        title={entry ? '编辑日记' : '写新日记'}
        onClose={requestClose}
        padded={isMobile ? 'sm' : 'lg'}
      />

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={`${isMobile ? 'space-y-4 p-4 pb-6' : 'space-y-6 p-6'} flex-1 overflow-y-auto`}
      >
          {(showDraftRestoredNotice || (showDraftSavedNotice && lastDraftSavedAt)) && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{
                backgroundColor: `${theme.colors.primary}14`,
                border: `1px solid ${theme.colors.primary}33`,
                color: theme.colors.primary,
              }}
            >
              <div>
                {showDraftRestoredNotice
                  ? '已恢复上次未提交的本地草稿，可以继续编辑或直接保存。'
                  : '内容已自动保存到本地草稿。'}
              </div>
              {lastDraftSavedAt && (
                <div className="mt-1 text-xs opacity-80">
                  最近保存时间：{new Date(lastDraftSavedAt).toLocaleString('zh-CN')}
                </div>
              )}
              {!entry && lastDraftSavedAt && (
                <button
                  type="button"
                  onClick={requestResetDraft}
                  className="mt-3 text-xs font-medium transition-opacity hover:opacity-80"
                  style={{ color: theme.colors.accent }}
                >
                  清空本地草稿并重置表单
                </button>
              )}
            </div>
          )}

          {/* Title - Optional */}
          <div>
            <label
              className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium mb-2`}
              style={{ color: theme.colors.text }}
            >
              标题 <span className="text-xs opacity-60">(可选)</span>
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              autoComplete="off"
              enterKeyHint="next"
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') {
                  return;
                }

                event.preventDefault();
                focusContentInput();
              }}
              className={`w-full ${isMobile ? 'px-3 py-2' : 'px-4 py-3'} rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200`}
              style={controlStyle}
              placeholder="为这篇日记起个标题吧..."
            />
          </div>

          {/* Content Type Toggle */}
          <div>
            <label
              className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium mb-2`}
              style={{ color: theme.colors.text }}
            >
              内容格式
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setContentType('markdown')}
                className={`${isMobile ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'} rounded-lg transition-all duration-200 ${
                  contentType === 'markdown' ? 'font-medium' : ''
                }`}
                style={{
                  backgroundColor: contentType === 'markdown' ? theme.colors.primary : theme.colors.surface,
                  color: contentType === 'markdown' ? 'white' : theme.colors.textSecondary,
                  border: `1px solid ${theme.colors.border}`
                }}
              >
                Markdown
              </button>
              <button
                type="button"
                onClick={() => setContentType('plain')}
                className={`${isMobile ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'} rounded-lg transition-all duration-200 ${
                  contentType === 'plain' ? 'font-medium' : ''
                }`}
                style={{
                  backgroundColor: contentType === 'plain' ? theme.colors.primary : theme.colors.surface,
                  color: contentType === 'plain' ? 'white' : theme.colors.textSecondary,
                  border: `1px solid ${theme.colors.border}`
                }}
              >
                纯文本
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <label
              className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium mb-2`}
              style={{ color: theme.colors.text }}
            >
              内容
            </label>
            {contentType === 'markdown' ? (
              <Suspense fallback={sectionFallback}>
                <MarkdownEditor
                  key={`markdown-editor-${entry?.id || 'new'}`}
                  value={content}
                  onChange={setContent}
                  placeholder={isMobile ? '使用 Markdown 记录想法...' : '使用 Markdown 语法记录你的想法和感受...'}
                />
              </Suspense>
            ) : (
              <textarea
                data-diary-content-input="true"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                enterKeyHint={isMobile ? 'done' : undefined}
                rows={isMobile ? 16 : 12}
                className={`w-full ${isMobile ? 'px-3 py-2' : 'px-4 py-3'} rounded-lg border resize-none focus:outline-none focus:ring-2 transition-all duration-200`}
                style={{
                  ...controlStyle,
                  minHeight: isMobile ? '300px' : 'auto',
                }}
                placeholder={isMobile ? "记录你的想法和感受..." : "详细记录你的想法和感受..."}
                required
              />
            )}
          </div>

          {/* 移动端高级选项切换 */}
          {isMobile && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="px-4 py-2 rounded-lg text-sm transition-all duration-200"
                style={{
                  ...secondaryButtonStyle,
                  color: theme.colors.primary,
                }}
              >
                {showAdvanced ? '收起高级选项' : '展开高级选项'} ({showAdvanced ? '▲' : '▼'})
              </button>
            </div>
          )}

          {/* 高级选项区域 */}
          {(showAdvanced || !isMobile) && (
            <>
              {/* Images */}
              <div>
                <label
                  className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium mb-2`}
                  style={{ color: theme.colors.text }}
                >
                  🖼️ 图片
                </label>
                <Suspense fallback={sectionFallback}>
                  <ImageUpload
                    images={images}
                    onImagesChange={setImages}
                    maxImages={5}
                  />
                </Suspense>
              </div>

              {/* Mood and Weather */}
              <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'md:grid-cols-2 gap-4'}`}>
                <DiaryFormSelectWithCustomField
                  label="心情"
                  value={mood}
                  options={moods}
                  customOptionLabel="✨ 自定义心情"
                  showCustom={showCustomMood}
                  customValue={customMood}
                  customPlaceholder="输入自定义心情..."
                  onSelectChange={handleMoodChange}
                  onCustomChange={setCustomMood}
                  theme={theme}
                  isMobile={isMobile}
                />

                <DiaryFormSelectWithCustomField
                  label="天气"
                  value={weather}
                  options={weathers}
                  customOptionLabel="🌈 自定义天气"
                  showCustom={showCustomWeather}
                  customValue={customWeather}
                  customPlaceholder="输入自定义天气..."
                  onSelectChange={handleWeatherChange}
                  onCustomChange={setCustomWeather}
                  theme={theme}
                  isMobile={isMobile}
                />
              </div>

              {/* Tags */}
              <div>
                <label
                  className={`block ${isMobile ? 'text-xs' : 'text-sm'} font-medium mb-2`}
                  style={{ color: theme.colors.text }}
                >
                  标签
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    autoComplete="off"
                    enterKeyHint="done"
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className={`flex-1 ${isMobile ? 'px-3 py-2' : 'px-3 py-2'} border rounded-md focus:outline-none focus:ring-2 transition-all duration-200`}
                    style={controlStyle}
                    placeholder="添加标签..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className={`${isMobile ? 'px-3 py-2' : 'px-4 py-2'} rounded-md transition-colors`}
                    style={{
                      backgroundColor: theme.colors.primary,
                      color: 'white'
                    }}
                  >
                    {isMobile ? '+' : '添加'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-2 py-1 ${isMobile ? 'text-xs' : 'text-sm'} rounded-full flex items-center gap-1`}
                      style={{
                        backgroundColor: `${theme.colors.primary}20`,
                        color: theme.colors.primary,
                        border: `1px solid ${theme.colors.primary}40`
                      }}
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:opacity-80 transition-opacity"
                        style={{ color: theme.colors.primary }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

            </>
          )}

          {/* Location - 始终显示，不在高级选项中 */}
          <Suspense fallback={sectionFallback}>
            <LocationPicker
              location={location}
              onLocationChange={setLocation}
              disabled={loading}
            />
          </Suspense>

          {/* Actions */}
          <div
            className={`flex ${isMobile ? 'sticky bottom-0 -mx-4 flex-col gap-2 px-4 pb-[calc(0.75rem+var(--safe-area-bottom,0px))] pt-3' : 'justify-end gap-3 pt-4'}`}
            style={{
              borderTop: `1px solid ${theme.colors.border}`,
              backgroundColor: isMobile ? theme.colors.background : 'transparent',
            }}
          >
            {formStatus && (
              <div
                className={`${isMobile ? 'order-first w-full' : 'mr-auto'} inline-flex items-center rounded-full px-3 py-2 text-sm`}
                style={getStatusPillStyle(theme, formStatus.tone)}
              >
                {formStatus.label}
              </div>
            )}
            <button
              type="button"
              onClick={requestClose}
              className={`${isMobile ? 'w-full py-3' : 'px-4 py-2'} rounded-md transition-colors`}
              style={secondaryButtonStyle}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className={`${isMobile ? 'w-full py-3' : 'px-6 py-3'} rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 ${!isMobile ? 'hover:scale-105' : ''}`}
              style={{
                backgroundColor: theme.colors.primary,
                color: 'white'
              }}
            >
              {loading ? '保存中...' : '保存日记'}
            </button>
          </div>
      </form>

      <DiaryFormConfirmDialog
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        ariaLabel="放弃未保存改动确认"
        title="放弃未保存改动？"
        description="你刚刚修改的内容还没有保存，关闭后这些改动会丢失。"
        cancelLabel="继续编辑"
        confirmLabel="放弃改动"
        onConfirm={handleDiscardChanges}
        confirmTone="accent"
        theme={theme}
      />

      <DiaryFormConfirmDialog
        isOpen={showRestoreDraftPrompt && Boolean(draftToRestore)}
        onClose={handleDiscardStoredDraft}
        ariaLabel="恢复本地草稿确认"
        title="恢复上次未完成的草稿？"
        description={
          draftToRestore
            ? `检测到一份未提交的本地草稿，保存时间为 ${new Date(draftToRestore.updatedAt).toLocaleString('zh-CN')}。`
            : ''
        }
        cancelLabel="新建空白"
        confirmLabel="恢复草稿"
        onConfirm={handleRestoreDraft}
        confirmTone="primary"
        theme={theme}
      />

      <DiaryFormConfirmDialog
        isOpen={showResetDraftConfirm}
        onClose={() => setShowResetDraftConfirm(false)}
        ariaLabel="清空本地草稿确认"
        title="清空本地草稿？"
        description="这会删除当前本地草稿，并将表单恢复为空白状态。这个操作不能撤销。"
        cancelLabel="取消"
        confirmLabel="确认清空"
        onConfirm={() => {
          setShowResetDraftConfirm(false);
          handleResetDraft();
        }}
        confirmTone="accent"
        theme={theme}
      />
    </ModalShell>
  );
}

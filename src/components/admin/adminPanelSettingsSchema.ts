import type { AdminInterfaceSettings, InterfaceFeatureKey } from './adminPanelTypes';

type InterfaceFeatureSettingKey = 'quick_filters_enabled' | 'export_enabled' | 'archive_view_enabled';

type InterfaceFeatureSchema = {
  apiKey: InterfaceFeatureSettingKey;
  title: string;
  successLabel: string;
  enabledDescription: string;
  disabledDescription: string;
};

export const interfaceFeatureSchema: Record<InterfaceFeatureKey, InterfaceFeatureSchema> = {
  quickFilters: {
    apiKey: 'quick_filters_enabled',
    title: '快速筛选',
    successLabel: '快速筛选功能',
    enabledDescription: '隐藏快速筛选功能',
    disabledDescription: '显示快速筛选功能',
  },
  export: {
    apiKey: 'export_enabled',
    title: '导出功能',
    successLabel: '导出功能',
    enabledDescription: '隐藏导出功能按钮',
    disabledDescription: '显示导出功能按钮',
  },
  archiveView: {
    apiKey: 'archive_view_enabled',
    title: '归纳视图',
    successLabel: '归纳视图',
    enabledDescription: '隐藏归纳显示模式',
    disabledDescription: '显示归纳显示模式',
  },
};

export function createDefaultInterfaceSettings(): AdminInterfaceSettings {
  return {
    quickFilters: { enabled: true },
    export: { enabled: true },
    archiveView: { enabled: true },
  };
}

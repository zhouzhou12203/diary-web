import type { ReactElement } from 'react';
import { Cloud, CloudRain, Snowflake, Sun } from 'lucide-react';
import type { MoodType, WeatherType } from '../../types/index.ts';

const moodEmojis: Record<MoodType, string> = {
  happy: '😊',
  sad: '😢',
  excited: '🤩',
  calm: '😌',
  angry: '😠',
  neutral: '😐',
  peaceful: '🕊️',
  grateful: '🙏',
  anxious: '😰',
  loved: '🥰',
};

const moodLabels: Record<MoodType, string> = {
  happy: '开心',
  sad: '难过',
  neutral: '平静',
  excited: '兴奋',
  anxious: '焦虑',
  peaceful: '宁静',
  calm: '冷静',
  angry: '愤怒',
  grateful: '感恩',
  loved: '被爱',
};

const weatherLabels: Record<WeatherType, string> = {
  sunny: '晴天',
  cloudy: '多云',
  rainy: '雨天',
  snowy: '雪天',
  unknown: '未知',
};

const weatherIcons: Record<WeatherType, ReactElement> = {
  sunny: <Sun className="h-4 w-4 text-amber-500" />,
  cloudy: <Cloud className="h-4 w-4 text-slate-400" />,
  rainy: <CloudRain className="h-4 w-4 text-sky-500" />,
  snowy: <Snowflake className="h-4 w-4 text-cyan-300" />,
  unknown: <Cloud className="h-4 w-4 text-slate-400" />,
};

export function getEntryMoodEmoji(mood: string) {
  return moodEmojis[mood as MoodType] || '💭';
}

export function getEntryMoodLabel(mood: string) {
  return moodLabels[mood as MoodType] || mood;
}

export function getEntryWeatherLabel(weather: string) {
  return weatherLabels[weather as WeatherType] || weather;
}

export function getEntryWeatherIcon(weather: string) {
  return weatherIcons[weather as WeatherType] || <Cloud className="h-4 w-4 text-slate-400" />;
}

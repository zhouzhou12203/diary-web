import { normalizeTimeString } from '../../utils/timeUtils.ts';

const archiveMoodEmojis: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  neutral: '😐',
  excited: '🤩',
  anxious: '😰',
  peaceful: '😌',
};

const archiveWeatherEmojis: Record<string, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  snowy: '❄️',
};

function formatArchiveEntryDate(dateString: string) {
  const date = new Date(normalizeTimeString(dateString));
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatArchiveEntryTime(dateString: string) {
  const date = new Date(normalizeTimeString(dateString));
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function getArchiveMoodDisplay(mood?: string) {
  return archiveMoodEmojis[mood || 'neutral'] || '😐';
}

function getArchiveWeatherDisplay(weather?: string) {
  return archiveWeatherEmojis[weather || 'unknown'] || '';
}

export function getArchiveEntryTimestamp(dateString: string) {
  return {
    dateLabel: formatArchiveEntryDate(dateString),
    timeLabel: formatArchiveEntryTime(dateString),
  };
}

export function getArchiveEntryIndicators(mood?: string, weather?: string) {
  return {
    moodDisplay: mood && mood !== 'neutral' ? getArchiveMoodDisplay(mood) : null,
    weatherDisplay: weather && weather !== 'unknown' ? getArchiveWeatherDisplay(weather) : null,
  };
}

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date for display
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

// Format time for display
export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
}

// Format duration
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

// Format SUI amount
export function formatSui(amount: number): string {
  return `${amount.toFixed(2)} SUI`;
}

// Generate random avatar (for blurred therapist avatars)
export function generateAvatar(seed: string): string {
  const colors = ['blue', 'green', 'purple', 'pink', 'orange', 'teal'];
  const hash = seed.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const colorIndex = Math.abs(hash) % colors.length;
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=${colors[colorIndex]}`;
}

// Create blurred avatar for privacy
export function createBlurredAvatar(seed: string): string {
  return generateAvatar(seed) + '&blur=5';
}

// Truncate address for display
export function truncateAddress(address: string, length: number = 6): string {
  if (address.length <= length * 2 + 3) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

// Get vibe tag color
export function getVibeTagColor(category: string): string {
  const colors = {
    style: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    specialty: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    approach: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  };
  return colors[category as keyof typeof colors] || colors.style;
}

// Calculate time until session
export function getTimeUntilSession(scheduledTime: string): {
  timeLeft: string;
  isToday: boolean;
  isUpcoming: boolean;
} {
  const now = new Date();
  const sessionTime = new Date(scheduledTime);
  const diffMs = sessionTime.getTime() - now.getTime();
  
  const isUpcoming = diffMs > 0;
  const isToday = sessionTime.toDateString() === now.toDateString();
  
  if (diffMs <= 0) {
    return { timeLeft: 'Session has passed', isToday: false, isUpcoming: false };
  }
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours < 1) {
    return { timeLeft: `${diffMinutes}m`, isToday, isUpcoming };
  } else if (diffHours < 24) {
    return { timeLeft: `${diffHours}h ${diffMinutes}m`, isToday, isUpcoming };
  } else {
    const diffDays = Math.floor(diffHours / 24);
    return { timeLeft: `${diffDays}d ${diffHours % 24}h`, isToday: false, isUpcoming };
  }
}
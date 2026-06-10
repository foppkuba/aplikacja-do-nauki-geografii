export interface LevelInfo {
  level: number;
  title: string;
  minXp: number;
  maxXp: number;
}

export const LEVELS: LevelInfo[] = [
  { level: 1, title: "Młody Podróżnik 🎒", minXp: 0, maxXp: 100 },
  { level: 2, title: "Adept Kartografii 🗺️", minXp: 100, maxXp: 300 },
  { level: 3, title: "Wędrowiec 🚶", minXp: 300, maxXp: 600 },
  { level: 4, title: "Odkrywca 🔍", minXp: 600, maxXp: 1000 },
  { level: 5, title: "Poszukiwacz Przygód 🧭", minXp: 1000, maxXp: 1500 },
  { level: 6, title: "Geograf 📚", minXp: 1500, maxXp: 2100 },
  { level: 7, title: "Znawca Świata 🌎", minXp: 2100, maxXp: 2800 },
  { level: 8, title: "Ekspert Europy 🇪🇺", minXp: 2800, maxXp: 3600 },
  { level: 9, title: "Władca Globusa 🌐", minXp: 3600, maxXp: 4500 },
  { level: 10, title: "Mistrz Świata 🌍", minXp: 4500, maxXp: 9999999 }
];

export function getLevelInfo(xp: number) {
  for (let i = 0; i < LEVELS.length; i++) {
    const lvl = LEVELS[i];
    if (xp >= lvl.minXp && xp < lvl.maxXp) {
      return {
        level: lvl.level,
        title: lvl.title,
        xp,
        minXp: lvl.minXp,
        maxXp: lvl.maxXp,
        nextXp: lvl.maxXp,
        progress: lvl.level === 10 ? 100 : ((xp - lvl.minXp) / (lvl.maxXp - lvl.minXp)) * 100
      };
    }
  }
  return {
    level: 10,
    title: "Mistrz Świata 🌍",
    xp,
    minXp: 4500,
    maxXp: 9999999,
    nextXp: 9999999,
    progress: 100
  };
}

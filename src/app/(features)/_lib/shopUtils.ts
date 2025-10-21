import { BusinessHours } from "./types";

interface BusinessStatus {
  status: string;
  displayTime: string;
  color: string;
}

export const getTodayBusinessHoursStatus = (
  weeklyHours: BusinessHours[] | null | undefined
): BusinessStatus => {
  console.log("DEBUG: weeklyHours received:", weeklyHours);
  const defaultStatus: BusinessStatus = {
    status: "不明",
    displayTime: "営業時間不明",
    color: "text-muted-foreground",
  };

  if (!weeklyHours || weeklyHours.length === 0) {
    console.log("DEBUG: No weeklyHours or empty, returning default.");
    return defaultStatus;
  }

  const now = new Date();
  const currentDayIndex = now.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  console.log("DEBUG: currentDayIndex:", currentDayIndex, "currentMinutes:", currentMinutes);

  const daysFull = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];
  const daysShort = ["日", "月", "火", "水", "木", "金", "土"];

  const getMinutes = (timeStr: string) => {
    const cleanedTimeStr = timeStr.replace("時", ":").replace("分", "");
    const [hour, minute] = cleanedTimeStr.split(":").map(Number);
    return hour * 60 + minute;
  };

  // Find today's hours by matching the full day name
  const todayHoursEntry = weeklyHours.find(
    (item) => item.day.startsWith(daysFull[currentDayIndex])
  );
  console.log("DEBUG: todayHoursEntry found:", todayHoursEntry);

  if (todayHoursEntry) {
    const timeString = todayHoursEntry.time;

    if (!timeString) {
      console.log("DEBUG: No time string found for today.");
      return defaultStatus;
    }

    console.log("DEBUG: timeString for 24h check:", timeString);
    const cleanedTimeString = timeString.replace(/\s/g, '');
    if (cleanedTimeString.includes("24時間営業")) {
      console.log("DEBUG: 24時間営業 detected.");
      return {
        status: "営業中",
        displayTime: "24時間営業",
        color: "text-green-500",
      };
    }

    // Process time ranges for today
    const timeRanges = timeString.split(", ");
    console.log("DEBUG: timeRanges:", timeRanges);
    const openRanges: { start: number; end: number }[] = [];

    for (const range of timeRanges) {
      const [startStr, endStr] = range.split("～");
      if (startStr && endStr) {
        const start = getMinutes(startStr);
        const end = getMinutes(endStr);

        if (end < start) {
          // Overnight handling
          openRanges.push({ start: start, end: 24 * 60 }); // Until midnight
          openRanges.push({ start: 0, end: end }); // From midnight
        } else {
          openRanges.push({ start, end });
        }
      }
    }
    console.log("DEBUG: openRanges:", openRanges);

    // 1. Check if currently open
    for (const range of openRanges) {
      if (currentMinutes >= range.start && currentMinutes < range.end) {
        const closingTime = `${Math.floor(range.end / 60).toString().padStart(2, '0')}:${(range.end % 60).toString().padStart(2, '0')}`;
        console.log("DEBUG: Currently open, closing at:", closingTime);
        return {
          status: "営業中",
          displayTime: `営業中（営業終了 ${closingTime}）`,
          color: "text-green-500",
        };
      }
    }

    // 2. If not open, find the next opening today
    let nextOpeningToday = null;
    for (const range of openRanges) {
      if (currentMinutes < range.start) {
        nextOpeningToday = range;
        break;
      }
    }

    if (nextOpeningToday) {
      const openingTime = `${Math.floor(nextOpeningToday.start / 60).toString().padStart(2, '0')}:${(nextOpeningToday.start % 60).toString().padStart(2, '0')}`;
      console.log("DEBUG: Closed, next opening today at:", openingTime);
      return {
        status: "営業時間外",
        displayTime: `営業時間外（営業開始 ${openingTime}）`,
        color: "text-red-500",
      };
    }

    // 3. If closed for the rest of today, or today is a holiday, find next opening day
    console.log("DEBUG: Closed for rest of today, looking for next open day.");
    if (timeString === "休業日") {
      console.log("DEBUG: Today is a 休業日, looking for next open day.");
    }

    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (currentDayIndex + i) % 7;
      const nextDayEntry = weeklyHours.find(
        (item) => item.day.startsWith(daysFull[nextDayIndex])
      );

      if (nextDayEntry) {
        const nextDayParts = nextDayEntry.day.split(': ');
        const nextDayTimeString = nextDayParts[1];

        if (nextDayTimeString && nextDayTimeString !== "休業日") {
          if (nextDayTimeString === "24時間営業") {
            const nextOpenDayPrefix = `${daysShort[nextDayIndex]} `;
            return {
              status: "営業時間外",
              displayTime: `営業時間外（${nextOpenDayPrefix}24時間営業）`,
              color: "text-red-500",
            };
          }
          const firstOpenTime = nextDayTimeString.split(", ")[0].split("～")[0];
          const nextOpenDayPrefix = `${daysShort[nextDayIndex]} `;
          console.log("DEBUG: Next open day found:", nextOpenDayPrefix, firstOpenTime);
          return {
            status: "営業時間外",
            displayTime: `営業時間外（営業開始: ${nextOpenDayPrefix}${firstOpenTime}）`,
            color: "text-red-500",
          };
        }
      }
    }
  }

  console.log("DEBUG: Reached end of function, returning default.");
  return defaultStatus;
};

export function getMonthRange(anchorDate) {
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();

  return {
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 0, 23, 59, 59, 999)
  };
}

export function getWeekRange(anchorDate) {
  const current = new Date(anchorDate);
  const day = current.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(current.getFullYear(), current.getMonth(), current.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function getMonthGrid(anchorDate) {
  const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const monthEnd = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0);
  const startOffset = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1;
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - startOffset);

  const cells = [];

  for (let index = 0; index < 42; index += 1) {
    const current = new Date(gridStart);
    current.setDate(gridStart.getDate() + index);

    cells.push({
      date: current,
      isCurrentMonth: current.getMonth() === anchorDate.getMonth(),
      isToday: isSameDay(current, new Date()),
      isPast: current < new Date(new Date().setHours(0, 0, 0, 0))
    });
  }

  return {
    monthStart,
    monthEnd,
    cells
  };
}

export function getWeekDays(anchorDate) {
  const { start } = getWeekRange(anchorDate);
  return Array.from({ length: 7 }).map((_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);

    return {
      date: current,
      isToday: isSameDay(current, new Date())
    };
  });
}

export function isSameDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function groupEventsByDay(events) {
  return events.reduce((accumulator, event) => {
    const dateKey = new Date(event.date).toISOString().slice(0, 10);
    accumulator[dateKey] = accumulator[dateKey] || [];
    accumulator[dateKey].push(event);
    return accumulator;
  }, {});
}

export function formatCalendarPeriod(view, date) {
  return new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
    ...(view === "week" ? { day: "2-digit" } : {})
  }).format(date);
}

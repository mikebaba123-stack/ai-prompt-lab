import { useEffect, useMemo, useState } from "react";
import { useApp } from "./store.js";

export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}
/** data filtered to the viewer's chosen year (0 = every year) */
export function useData() {
  const data = useApp(s => s.data), year = useApp(s => s.profile.year);
  return useMemo(() => {
    const f = a => (year ? a.filter(x => (x.years || []).includes(year)) : a);
    return { courses: f(data.courses), exams: f(data.exams), assignments: f(data.assignments), announcements: f(data.announcements), events: f(data.events), all: data, year };
  }, [data, year]);
}

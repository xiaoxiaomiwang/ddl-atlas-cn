"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import rawData from "./conferences.json";
import builtInMeta from "./data-meta.json";
import autoSupplementsRaw from "./auto-supplements.json";
import { arrCycles, officialSupplements, type SupplementalEvent } from "./supplemental";

type DataMeta = { upstreamSha: string | null; upstreamTime: string | null; generatedAt: string | null; recordCount: number };
type Milestone = { date: string; abstractDate: string; comment: string };
type Conference = {
  id: string; title: string; description: string; category: string; rank: string;
  year: number; link: string; timezone: string; conferenceDate: string; conferenceStart: string; place: string;
  timeline: Milestone[];
  supplementalEvents?: SupplementalEvent[]; commitVenues?: string[]; isARR?: boolean;
};

// 自动抓取的官网评审日程（CI 从会议官网解析，未经人工核验，人工核验数据优先）
type AutoSupplements = { conferences?: Record<string, { source: string; events: SupplementalEvent[] }> };
const autoSupplements = (autoSupplementsRaw as AutoSupplements).conferences || {};

function enrichConferenceData(records: Conference[]) {
  const sourceData = records.map((conf) => {
    const key = `${conf.title}-${conf.year}`;
    const official = officialSupplements[key];
    const auto = official ? [] : (autoSupplements[key]?.events || []).map((event) => ({ ...event, autoFetched: true as const, source: event.source || autoSupplements[key].source }));
    return { ...conf, supplementalEvents: (official || auto) as SupplementalEvent[] };
  });
  const visionProjections = [
    { title: "CVPR", sourceYear: 2026, targetYear: 2027, shift: 1 },
    { title: "ICCV", sourceYear: 2025, targetYear: 2027, shift: 2 },
  ].flatMap((spec) => {
    const source = sourceData.find((conf) => conf.title === spec.title && conf.year === spec.sourceYear);
    if (!source) return [];
    const shiftDate = (date: string) => date && date !== "TBD" ? `${Number(date.slice(0, 4)) + spec.shift}${date.slice(4)}` : date;
    return [{ ...source, id: `${source.id}-projection-${spec.targetYear}`, year: spec.targetYear, conferenceDate: `* 参考 ${spec.sourceYear} 届次顺延`, conferenceStart: shiftDate(source.conferenceStart), place: "地点待官方公布", timeline: source.timeline.map((item) => ({ ...item, date: shiftDate(item.date), abstractDate: shiftDate(item.abstractDate) })), supplementalEvents: (source.supplementalEvents || []).map((event) => ({ ...event, date: shiftDate(event.date), label: `* 下一届预计 · ${event.label}`, detail: `依据 ${spec.title} ${spec.sourceYear} 官方日程顺延 ${spec.shift} 年；${spec.targetYear} 届官网日期公布后将替换。`, inferred: true })) }];
  });
  return [...sourceData, ...visionProjections, ...arrCycles] as Conference[];
}
const builtInData = enrichConferenceData(rawData as Conference[]);
const categories: Record<string, string> = {
  ALL: "全部领域", AI: "人工智能", DB: "数据库 · 数据挖掘", SC: "网络与信息安全",
  SE: "软件工程 · 系统软件", NW: "计算机网络", DS: "体系结构 · 并行 · 存储",
  CT: "计算机科学理论", CG: "图形学 · 多媒体", HI: "人机交互", MX: "交叉 · 新兴",
};
const months = ["1 月", "2 月", "3 月", "4 月", "5 月", "6 月", "7 月", "8 月", "9 月", "10 月", "11 月", "12 月"];
const rankColors: Record<string, string> = { A: "rank-a", B: "rank-b", C: "rank-c", N: "rank-n" };

// 以运行当天为准动态计算"今天"与年份，避免硬编码随时间过期
const TODAY = (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
})();
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

// 记住用户上次选择的筛选条件（年份/等级/领域/ARR 模式），下次访问自动恢复
const FILTER_STORAGE_KEY = "ddl-atlas-filters";
type SavedFilters = { year?: number; rank?: string; categories?: string[]; arrMode?: "include" | "exclude" | "only" };
function loadSavedFilters(): SavedFilters {
  try { return JSON.parse(localStorage.getItem(FILTER_STORAGE_KEY) || "{}") as SavedFilters; } catch { return {}; }
}

function formatMetaTime(iso: string | null | undefined) {
  if (!iso) return "";
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return "";
  return value.toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

// 距指定日期还剩几天（0 = 今天，负数 = 已过去）
function diffDaysFromToday(date: string): number {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${TODAY}T00:00:00Z`)) / 86400000);
}

// 该会议下一个未过期的投稿类节点（摘要/全文/Commit；含官网核验与自动抓取数据，排除推测日期）
function nextDeadlineInfo(conf: Conference): { date: string; days: number } | null {
  const candidates = [
    ...conf.timeline.flatMap((item) => [item.abstractDate, item.date]),
    ...(conf.supplementalEvents || [])
      .filter((event) => !event.inferred && ["abstract", "submission", "commit"].includes(event.type))
      .map((event) => event.date),
  ].filter((date) => date && date !== "TBD" && date >= TODAY).sort();
  const earliest = candidates[0];
  if (!earliest) return null;
  const days = diffDaysFromToday(earliest);
  return days >= 0 ? { date: earliest, days } : null;
}

function dayPosition(date: string, year: number) {
  const start = Date.UTC(year, 0, 1);
  const end = Date.UTC(year + 2, 0, 1);
  const time = Date.parse(`${date}T00:00:00Z`);
  return Math.min(100, Math.max(0, ((time - start) / (end - start)) * 100));
}

function monthPosition(month: number, year: number) {
  const targetYear = year + Math.floor(month / 12);
  return dayPosition(`${targetYear}-${String((month % 12) + 1).padStart(2, "0")}-01`, year);
}

function inTwoYearWindow(date: string, year: number) {
  return date >= `${year}-01-01` && date < `${year + 2}-01-01`;
}

function classify(comment: string, isAbstract = false) {
  if (isAbstract || /abstract|registration/i.test(comment)) return "abstract";
  if (/rebuttal|revision|response/i.test(comment)) return "rebuttal";
  if (/notification|result|decision|accept/i.test(comment)) return "result";
  return "submission";
}

function markerLabel(comment: string, index: number, isAbstract = false) {
  if (isAbstract) return "摘要截止";
  if (/round\s*1|first|1st/i.test(comment)) return "一轮投稿";
  if (/round\s*2|second|2nd/i.test(comment)) return "二轮投稿";
  if (/round\s*3|third|3rd/i.test(comment)) return "三轮投稿";
  if (/round\s*4|fourth|4th/i.test(comment)) return "四轮投稿";
  if (/rebuttal|revision|response/i.test(comment)) return "Rebuttal / 修订";
  if (/notification|result|decision|accept/i.test(comment)) return "最终结果";
  return index === 0 ? "投稿截止" : `投稿截止 ${index + 1}`;
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function addOneYear(date: string) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCFullYear(value.getUTCFullYear() + 1);
  return value.toISOString().slice(0, 10);
}

function inferredReviewEvents(conf: Conference, year: number): SupplementalEvent[] {
  if (conf.isARR) return [];
  const official = conf.supplementalEvents || [];
  if (official.some((event) => ["rebuttal", "result", "camera"].includes(event.type))) return [];
  const historicalProfiles: Record<string, {
    edition: string; submission: string; source: string;
    events: Array<{ date: string; label: string; type: "rebuttal" | "result" | "camera" }>;
  }> = {
    "ICSE": {
      edition: "ICSE 2025 Research Track 第二周期",
      submission: "2024-08-02",
      source: "https://conf.researchr.org/track/icse-2025/icse-2025-research-track",
      events: [
        { date: "2024-10-07", label: "Author Response", type: "rebuttal" },
        { date: "2024-11-01", label: "录用通知", type: "result" },
        { date: "2024-12-13", label: "Camera-ready", type: "camera" },
      ],
    },
  };
  const profile = historicalProfiles[conf.title];
  if (!profile) return [];
  const submissions = conf.timeline.map((item) => item.date).filter((date) => date && date !== "TBD").sort();
  const base = submissions[submissions.length - 1];
  if (!base) return [];
  const historicalSubmission = Date.parse(`${profile.submission}T00:00:00Z`);
  return profile.events.map((historicalEvent) => {
    const intervalDays = Math.round((Date.parse(`${historicalEvent.date}T00:00:00Z`) - historicalSubmission) / 86400000);
    const date = addDays(base, intervalDays);
    const detail = `依据 ${profile.edition} 官网：投稿 ${profile.submission}，${historicalEvent.label} ${historicalEvent.date}（间隔 ${intervalDays} 天）；按相同间隔从本届最后投稿日 ${base} 平移。该日期不是本届主办方正式公布。`;
    return { date, label: `* 往届 ${historicalEvent.label}`, type: historicalEvent.type, detail, source: profile.source, inferred: true } as SupplementalEvent;
  }).filter((event) => event.date.startsWith(`${year}-`));
}

export default function Home() {
  const [data, setData] = useState<Conference[]>(builtInData);
  const [meta, setMeta] = useState<DataMeta>(builtInMeta as DataMeta);
  const [syncFailed, setSyncFailed] = useState(false);
  const [savedFilters] = useState(loadSavedFilters);
  const savedCategories = (Array.isArray(savedFilters.categories) ? savedFilters.categories : []).filter((key) => key in categories && key !== "ALL");
  const [year, setYear] = useState(YEAR_OPTIONS.includes(Number(savedFilters.year)) ? Number(savedFilters.year) : CURRENT_YEAR);
  const [rank, setRank] = useState(["ALL", "A", "B", "C"].includes(String(savedFilters.rank)) ? String(savedFilters.rank) : "A");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(savedCategories);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(32);
  const [arrMode, setArrMode] = useState<"include" | "exclude" | "only">(
    savedFilters.arrMode === "exclude" || savedFilters.arrMode === "only" ? savedFilters.arrMode : "include",
  );
  const [selectedEvent, setSelectedEvent] = useState<{ conf: Conference; event: SupplementalEvent } | null>(null);
  const [transferPoint, setTransferPoint] = useState<{ conf: Conference; event: SupplementalEvent } | null>(null);
  const [plannerCategories, setPlannerCategories] = useState<string[]>([]);
  const [plannerRanks, setPlannerRanks] = useState<string[]>(["A", "B", "C"]);
  const [plannerDays, setPlannerDays] = useState(365);
  const [plannerSameOnly, setPlannerSameOnly] = useState(false);
  const [plannerTarget, setPlannerTarget] = useState<"all" | "submission" | "commit">("all");
  const [plannerSort, setPlannerSort] = useState<"recommended" | "soonest" | "rank">("recommended");

  useEffect(() => {
    const controller = new AbortController();
    const fetchJson = (name: string) => {
      const url = new URL(name, window.location.href);
      url.searchParams.set("refresh", Date.now().toString());
      return fetch(url, { cache: "no-store", signal: controller.signal })
        .then((response) => { if (!response.ok) throw new Error(String(response.status)); return response.json(); });
    };
    // 拉取数据源元信息（上游 CCFDDL 提交时间 / 本站构建时间），用于展示真实数据新鲜度
    fetchJson("data-meta.json")
      .then((fresh: unknown) => { if (fresh && typeof fresh === "object") setMeta(fresh as DataMeta); })
      .catch(() => {});
    fetchJson("conferences.json")
      .then((records: Conference[]) => {
        if (!Array.isArray(records) || records.length === 0) throw new Error("empty data");
        setData(enrichConferenceData(records));
      })
      .catch((error) => { if (error.name !== "AbortError") setSyncFailed(true); });
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const candidates = data.filter((conf) => {
    const hasYearEvent = conf.timeline.some((m) => inTwoYearWindow(m.date, year) || inTwoYearWindow(m.abstractDate, year));
    const hasConference = conf.year === year;
    const hasSupplement = conf.supplementalEvents?.some((event) => inTwoYearWindow(event.date, year));
    return (hasYearEvent || hasConference || hasSupplement)
      && (arrMode === "include" || (arrMode === "exclude" ? !conf.isARR : conf.isARR))
      && (conf.isARR || rank === "ALL" || conf.rank === rank)
      && (conf.isARR || selectedCategories.length === 0 || selectedCategories.includes(conf.category))
      && (`${conf.title} ${conf.description} ${conf.place}`.toLowerCase().includes(query.toLowerCase()));
    }).sort((a, b) => {
    const ad = [...a.timeline.map((m) => m.date), ...(a.supplementalEvents || []).map((m) => m.date)].filter((date) => date.startsWith(`${year}-`)).sort()[0] || `${year}-12-31`;
    const bd = [...b.timeline.map((m) => m.date), ...(b.supplementalEvents || []).map((m) => m.date)].filter((date) => date.startsWith(`${year}-`)).sort()[0] || `${year}-12-31`;
      return ad.localeCompare(bd) || a.title.localeCompare(b.title);
    });
    const unique = new Map<string, Conference>();
    for (const conf of candidates) {
      const current = unique.get(conf.title);
      const hasSubmissionThisYear = conf.timeline.some((item) => item.date.startsWith(`${year}-`) || item.abstractDate.startsWith(`${year}-`));
      const currentHasSubmission = current?.timeline.some((item) => item.date.startsWith(`${year}-`) || item.abstractDate.startsWith(`${year}-`));
      if (!current || (hasSubmissionThisYear && !currentHasSubmission) || (hasSubmissionThisYear === currentHasSubmission && conf.year > current.year)) unique.set(conf.title, conf);
    }
    return [...unique.values()].sort((a, b) => {
      const baseline = year === CURRENT_YEAR ? TODAY : `${year}-01-01`;
      // 与倒计时同源：以"下一个可投稿节点"（摘要/全文/Commit，含官网抓取、排除推测）排序
      const nextDeadline = (conf: Conference) => [
        ...conf.timeline.flatMap((item) => [item.abstractDate, item.date]),
        ...(conf.supplementalEvents || []).filter((event) => !event.inferred && ["submission", "commit", "abstract"].includes(event.type)).map((event) => event.date),
      ].filter((date) => date && date !== "TBD" && date >= baseline && inTwoYearWindow(date, year)).sort()[0] || `${year + 2}-12-31`;
      const ad = nextDeadline(a);
      const bd = nextDeadline(b);
      return ad.localeCompare(bd) || a.title.localeCompare(b.title);
    });
  }, [year, rank, selectedCategories, query, arrMode]);

  const visible = filtered.slice(0, limit);
  const ganttViewportRef = useRef<HTMLDivElement>(null);

  // 筛选条件持久化：变化时写入 localStorage
  useEffect(() => {
    try { localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({ year, rank, categories: selectedCategories, arrMode })); } catch { /* 忽略存储异常（如隐私模式） */ }
  }, [year, rank, selectedCategories, arrMode]);

  // 每个领域的会议数量（按会议名去重，用于领域按钮徽章）
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const seen = new Set<string>();
    for (const conf of data) {
      const key = `${conf.category}:${conf.title}`;
      if (conf.isARR || seen.has(key)) continue;
      seen.add(key);
      counts[conf.category] = (counts[conf.category] || 0) + 1;
    }
    return counts;
  }, [data]);
  const todayInWindow = inTwoYearWindow(TODAY, year);
  const todayPosition = todayInWindow ? dayPosition(TODAY, year) : null;
  const axisMonths = Array.from({ length: 24 }, (_, index) => ({ label: months[index % 12], year: year + Math.floor(index / 12), index }));
  useEffect(() => {
    const viewport = ganttViewportRef.current;
    if (!viewport) return;
    const anchor = inTwoYearWindow(TODAY, year) ? dayPosition(TODAY, year) / 100 : 0;
    viewport.scrollTop = Math.max(0, anchor * viewport.scrollHeight - 110);
    viewport.scrollLeft = 0;
  }, [year, rank, selectedCategories, query, arrMode]);
  const toggleCategory = (value: string) => {
    setSelectedCategories((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
    setLimit(32);
  };

  const transferCandidates = useMemo(() => {
    if (!transferPoint) return [];
    const pivot = Date.parse(`${transferPoint.event.date}T00:00:00Z`);
    const candidates = data.flatMap((conf) => {
      if (conf.id === transferPoint.conf.id) return [];
      if (plannerCategories.length > 0 && !conf.isARR && !plannerCategories.includes(conf.category)) return [];
      if (!conf.isARR && plannerRanks.length > 0 && !plannerRanks.includes(conf.rank)) return [];
      const sameField = conf.category === transferPoint.conf.category || (transferPoint.conf.isARR && conf.category === "AI");
      if (plannerSameOnly && !sameField) return [];
      const targets: SupplementalEvent[] = [
        ...conf.timeline.filter((item) => item.date && item.date !== "TBD").map((item, index) => ({ date: item.date, label: markerLabel(item.comment, index), type: "submission" as const, source: conf.link })),
        ...(conf.supplementalEvents || []).filter((item) => item.type === "submission" || item.type === "commit"),
      ];
      const actualFuture = targets.filter((event) => Date.parse(`${event.date}T00:00:00Z`) > pivot);
      const projected = conf.isARR || actualFuture.length > 0 ? [] : targets.map((event) => ({
        ...event,
        date: addOneYear(event.date),
        label: `* 下一届预计 · ${event.label}`,
        detail: `下一届官网尚未公布；依据 ${conf.title} 本届 ${event.date} 的同类投稿日顺延一年，仅用于规划。`,
        inferred: true,
      }));
      return [...actualFuture, ...projected].map((event) => {
        const days = Math.round((Date.parse(`${event.date}T00:00:00Z`) - pivot) / 86400000);
        if (days <= 0 || days > plannerDays) return null;
        if (plannerTarget !== "all" && event.type !== plannerTarget) return null;
        const urgency = days <= 30 ? 38 : days <= 60 ? 30 : days <= 120 ? 20 : 8;
        const rankScore = conf.rank === "A" ? 16 : conf.rank === "B" ? 10 : conf.rank === "C" ? 5 : 0;
        const score = urgency + rankScore + (sameField ? 28 : 0) + (event.type === "commit" ? 12 : 0) - (event.inferred ? 6 : 0);
        return { conf, event, days, score, sameField };
      }).filter(Boolean);
    }).filter(Boolean) as Array<{ conf: Conference; event: SupplementalEvent; days: number; score: number; sameField: boolean }>;
    // 排序方式：recommended=综合推荐评分；soonest=距截止天数升序；rank=CCF 等级优先（同级按天数）
    const rankWeight = (rank: string) => (rank === "A" ? 2 : rank === "B" ? 1 : 0);
    if (plannerSort === "soonest") candidates.sort((a, b) => a.days - b.days);
    else if (plannerSort === "rank") candidates.sort((a, b) => rankWeight(b.conf.rank) - rankWeight(a.conf.rank) || a.days - b.days);
    else candidates.sort((a, b) => b.score - a.score || a.days - b.days);
    const bestPerConference = new Map<string, typeof candidates[number]>();
    for (const candidate of candidates) {
      if (!bestPerConference.has(candidate.conf.title)) bestPerConference.set(candidate.conf.title, candidate);
    }
    return [...bestPerConference.values()].slice(0, 12);
  }, [transferPoint, plannerCategories, plannerRanks, plannerDays, plannerSameOnly, plannerTarget, plannerSort]);

  const startTransferPlanning = (conf: Conference, event: SupplementalEvent) => {
    setTransferPoint({ conf, event });
    setPlannerCategories(selectedCategories);
    setPlannerRanks(rank === "ALL" ? ["A", "B", "C"] : [rank]);
    setSelectedEvent(null);
  };

  const syncStatusText = syncFailed
    ? `线上更新失败 · 正在使用内置数据${builtInMeta.generatedAt ? `（生成于 ${formatMetaTime(builtInMeta.generatedAt)}）` : ""}`
    : meta.upstreamTime
      ? `数据更新于 ${formatMetaTime(meta.upstreamTime)} · 来源 CCFDDL`
      : meta.generatedAt
        ? `数据生成于 ${formatMetaTime(meta.generatedAt)}`
        : "正在检查数据更新…";

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="DDL Atlas 首页"><span>DDL</span> ATLAS<sup>CN</sup></a>
        <nav><a href="#timeline">投稿时间线</a><a href="https://ccfddl.com/" target="_blank">数据源 ↗</a><a href="https://github.com/ccfddl/ccf-deadlines" target="_blank">GitHub ↗</a></nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-stat"><strong>{filtered.length}</strong><span>场会议 / 当前筛选</span><small>{syncStatusText}</small></div>
      </section>

      <section className="filters" aria-label="会议筛选">
        <div className="filter-group wide"><label htmlFor="search">搜索会议</label><div className="search-wrap"><span>⌕</span><input id="search" value={query} onChange={(e) => { setQuery(e.target.value); setLimit(32); }} placeholder="SIGMOD、NeurIPS、Shanghai…"/></div></div>
        <div className="filter-group"><label>年份</label><div className="segmented">{YEAR_OPTIONS.map((y) => <button key={y} className={year === y ? "active" : ""} onClick={() => { setYear(y); setLimit(32); }}>{y}</button>)}</div></div>
        <div className="filter-group"><label>CCF 等级</label><div className="segmented">{["ALL", "A", "B", "C"].map((r) => <button key={r} className={rank === r ? "active" : ""} onClick={() => { setRank(r); setLimit(32); }}>{r === "ALL" ? "全部" : r}</button>)}</div></div>
        <div className="filter-group arr-filter"><label>ARR 时间线</label><div className="arr-modes"><button className={arrMode === "include" ? "active" : ""} onClick={() => { setArrMode("include"); setLimit(32); }}>含 ARR</button><button className={arrMode === "exclude" ? "active" : ""} onClick={() => { setArrMode("exclude"); setLimit(32); }}>不含</button><button className={arrMode === "only" ? "active" : ""} onClick={() => { setArrMode("only"); setLimit(32); }}>仅 ARR</button></div></div>
        <div className="filter-group category-group"><label>研究领域 · 可多选</label><div className="category-buttons"><button className={selectedCategories.length === 0 ? "active" : ""} onClick={() => { setSelectedCategories([]); setLimit(32); }}>全部领域</button>{Object.entries(categories).filter(([key]) => key !== "ALL").map(([key, value]) => <button key={key} className={selectedCategories.includes(key) ? "active" : ""} aria-pressed={selectedCategories.includes(key)} onClick={() => toggleCategory(key)}>{value}<small>{categoryCounts[key] || 0}</small></button>)}</div></div>
      </section>

      <section className="timeline-section" id="timeline">
        <div className="section-heading"><div><p className="eyebrow">ANNUAL SUBMISSION GANTT</p><h2>{arrMode === "only" ? `${year} ARR 时间线` : `${year} 投稿甘特图`}</h2></div><div className="legend"><span><i className="abstract"/>摘要</span><span><i className="submission"/>投稿</span><span><i className="reject"/>拒稿</span><span><i className="rebuttal"/>Rebuttal</span><span><i className="result"/>出分/录用</span><span><i className="commit"/>Commit</span><span><i className="event"/>开会</span><span className="estimate-key">* 往届官网节奏平移</span></div></div>
        <p className="drag-hint">↔ 左右拖动浏览会议　↕ 上下拖动浏览全年日期　·　单击看详情，双击日期节点生成转投路线</p>
        <div className="gantt-viewport" ref={ganttViewportRef}>
          {visible.length === 0 && <div className="empty"><b>没有匹配的会议</b><span>换一个等级、领域或搜索词试试。</span></div>}
          {visible.length > 0 && <div className="vertical-gantt" style={{ "--column-count": visible.length } as React.CSSProperties}>
            <div className="sticky-gantt-head"><div className="corner"><b>{year}</b><span>时间 / 日期</span></div><div className="conference-heads">{visible.map((conf, index) => { const supplementalAll = conf.supplementalEvents || []; const officialReview = supplementalAll.some((event) => !event.autoFetched && !event.inferred && ["rebuttal", "result", "camera", "reject"].includes(event.type)); const autoReview = supplementalAll.some((event) => event.autoFetched && ["rebuttal", "result", "camera", "reject"].includes(event.type)); const hasReviewSchedule = officialReview || autoReview || inferredReviewEvents(conf, year).length > 0; const scheduleBadge = officialReview ? <span className="schedule-ok">✓ 评审日程已核验</span> : autoReview ? <span className="schedule-auto">≈ 官网日程自动抓取</span> : hasReviewSchedule ? <span className="schedule-ok">✓ 评审日程已核验</span> : <span className="schedule-pending">! 评审日程待核验</span>; const nextDeadline = nextDeadlineInfo(conf); const countdownLevel = nextDeadline ? (nextDeadline.days === 0 ? "countdown-today" : nextDeadline.days <= 7 ? "countdown-soon" : nextDeadline.days <= 30 ? "countdown-mid" : "countdown-later") : ""; return <div className="conference-head" key={`head-${conf.id}-${conf.year}`}><div className="column-number">{String(index + 1).padStart(2, "0")}</div><div className="venue-top"><h3 title={`${conf.title} ${conf.year}`}>{conf.title} <small>{conf.year}</small></h3><span className={`rank ${rankColors[conf.rank] || "rank-n"}`}>{conf.isARR ? "ARR" : conf.rank === "N" || !conf.rank ? "—" : `CCF ${conf.rank}`}</span></div><p title={conf.description}>{conf.description}</p><div className="meta">{nextDeadline && <span className={`countdown ${countdownLevel}`} title={`下一个投稿节点：${nextDeadline.date}`}>{nextDeadline.days === 0 ? "⚠ 今天截止" : `⏳ 剩 ${nextDeadline.days} 天`}</span>}<span>⌖ {conf.place || "地点待定"}</span><span>◷ {conf.conferenceDate || "时间待定"}</span>{conf.rank === "A" && scheduleBadge}{conf.commitVenues?.map((venue) => <span className="commit-venue" key={venue}>→ {venue}</span>)}</div><a href={conf.link} target="_blank" rel="noreferrer">会议官网 ↗</a></div>})}</div></div>
            <div className="gantt-body"><div className="date-axis">{axisMonths.map((month) => <div className="axis-month" key={`${month.year}-${month.index}`} style={{ top: `${monthPosition(month.index, year)}%` }}><b>{month.label}</b><span>{month.year}/{String((month.index % 12) + 1).padStart(2, "0")}/01</span></div>)}{todayPosition !== null && <div className="axis-today" style={{ top: `${todayPosition}%` }}>今天 · {TODAY.replace(/-/g, "/")}</div>}</div>
            <div className="conference-columns">
          {transferPoint && inTwoYearWindow(transferPoint.event.date, year) && <div className="transfer-line" style={{ top: `${dayPosition(transferPoint.event.date, year)}%` }}><span>转投基准 · {transferPoint.event.date} · {transferPoint.conf.title}</span></div>}
          {visible.map((conf) => {
            const milestones = conf.timeline.flatMap((item, index) => {
              const nodes = [];
              if (inTwoYearWindow(item.abstractDate, year)) nodes.push({ date: item.abstractDate, label: markerLabel(item.comment, index, true), type: classify(item.comment, true) });
              if (inTwoYearWindow(item.date, year)) nodes.push({ date: item.date, label: markerLabel(item.comment, index), type: classify(item.comment) });
              return nodes;
            });
            const event = inTwoYearWindow(conf.conferenceStart, year) ? { date: conf.conferenceStart, label: "开会", type: "event" } : null;
            const supplemental = [...(conf.supplementalEvents || []).filter((item) => inTwoYearWindow(item.date, year)), ...inferredReviewEvents(conf, year)];
            return <article className="conference-column" key={`${conf.id}-${conf.year}`}>
              {axisMonths.map((month) => <i className="month-line" key={`${month.year}-${month.index}`} style={{ top: `${monthPosition(month.index, year)}%` }}/>) }
              {todayPosition !== null && <i className="today-line" style={{ top: `${todayPosition}%` }}/>} 
              {[...milestones, ...supplemental, ...(event ? [event] : [])].map((m, i) => {
                const normalized = { ...m, source: "source" in m ? m.source : conf.link } as SupplementalEvent;
                return <button className={`vertical-marker ${m.type} ${"inferred" in m && m.inferred ? "inferred" : ""} lane-${i % 2}`} key={`${m.date}-${m.label}-${i}`} style={{ top: `${dayPosition(m.date, year)}%` }} title={`${conf.title} · ${m.label} · ${m.date}`} onClick={() => setSelectedEvent({ conf, event: normalized })} onDoubleClick={() => startTransferPlanning(conf, normalized)}><i/><span><b>{m.date.slice(5).replace("-", "/")}</b>{m.label}</span></button>;
              })}
            </article>;
          })}
            </div>
            </div>
          </div>}
        </div>
        {limit < filtered.length && <button className="load-more" onClick={() => setLimit((n) => n + 32)}>加载更多会议 <span>{visible.length} / {filtered.length}</span></button>}
      </section>

      {selectedEvent && <div className="event-popover" role="dialog" aria-modal="true" aria-label="日期节点详情"><button className="popover-close" onClick={() => setSelectedEvent(null)} aria-label="关闭">×</button><p>{selectedEvent.conf.title} · {selectedEvent.conf.year} {selectedEvent.event.inferred ? "· 往届官网节奏平移 *" : selectedEvent.event.autoFetched ? "· 官网自动抓取（未核验）" : "· 官方核验"}</p><h3>{selectedEvent.event.label}</h3><time>{selectedEvent.event.date} · {selectedEvent.conf.timezone || "以官网为准"} · {(() => { const relDays = diffDaysFromToday(selectedEvent.event.date); return relDays === 0 ? "就是今天" : relDays > 0 ? `还有 ${relDays} 天` : `已过去 ${-relDays} 天`; })()}</time>{selectedEvent.event.detail && <div>{selectedEvent.event.detail}</div>}{selectedEvent.event.autoFetched && <div>该节点由程序从会议官网自动解析，未经人工核验，请以官网为准。</div>}<a href={selectedEvent.event.source} target="_blank" rel="noreferrer">{selectedEvent.event.inferred ? "查看所依据的往届官网 ↗" : "查看官方来源 ↗"}</a></div>}

      {transferPoint && <aside className="transfer-panel" aria-label="转投候选会议">
        <div className="transfer-panel-head"><div><p>TRANSFER PLANNER</p><h3>从 {transferPoint.event.date.slice(5).replace("-", "/")} 之后转投</h3><span>{transferPoint.conf.title} · {transferPoint.event.label}</span></div><button onClick={() => setTransferPoint(null)} aria-label="关闭转投规划">×</button></div>
        <div className="planner-controls">
          <label>候选领域 · 可多选</label><div className="mini-buttons"><button className={plannerCategories.length === 0 ? "active" : ""} onClick={() => setPlannerCategories([])}>全部</button>{Object.entries(categories).filter(([key]) => key !== "ALL").map(([key, value]) => <button key={key} title={value} className={plannerCategories.includes(key) ? "active" : ""} onClick={() => setPlannerCategories((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])}>{key}</button>)}</div>
          <label>CCF 等级 · 可多选</label><div className="mini-buttons">{["A", "B", "C"].map((item) => <button key={item} className={plannerRanks.includes(item) ? "active" : ""} onClick={() => setPlannerRanks((current) => current.includes(item) ? current.filter((rankItem) => rankItem !== item) : [...current, item])}>{item}</button>)}</div>
          <div className="planner-selects"><label>最长等待<select value={plannerDays} onChange={(e) => setPlannerDays(Number(e.target.value))}><option value={30}>30 天</option><option value={60}>60 天</option><option value={120}>120 天</option><option value={240}>240 天</option><option value={365}>365 天</option><option value={540}>18 个月</option><option value={730}>2 年</option></select></label><label>目标类型<select value={plannerTarget} onChange={(e) => setPlannerTarget(e.target.value as "all" | "submission" | "commit")}><option value="all">投稿 + Commit</option><option value="submission">仅普通投稿</option><option value="commit">仅 ARR Commit</option></select></label></div>
          <label>排序方式</label><div className="mini-buttons"><button title="综合评分：截止临近度 + CCF 等级 + 同领域 + 节点类型" className={plannerSort === "recommended" ? "active" : ""} onClick={() => setPlannerSort("recommended")}>推荐</button><button title="按距截止的天数升序，最快可投的排最前" className={plannerSort === "soonest" ? "active" : ""} onClick={() => setPlannerSort("soonest")}>最近截止</button><button title="CCF 等级从高到低，同级按截止临近排序" className={plannerSort === "rank" ? "active" : ""} onClick={() => setPlannerSort("rank")}>等级优先</button></div>
          <label className="same-toggle"><input type="checkbox" checked={plannerSameOnly} onChange={(e) => setPlannerSameOnly(e.target.checked)}/> 只看同领域</label><small>候选结果实时按当前条件重新计算</small>
        </div>
        <div className="candidate-list">{transferCandidates.length === 0 && <p className="no-candidate">当前条件下没有可用投稿节点，可放宽领域、等级或最长等待时间。</p>}{transferCandidates.map(({ conf, event, days, sameField }, index) => <a href={conf.link} target="_blank" rel="noreferrer" className={`candidate ${event.inferred ? "projected" : ""}`} key={`${conf.id}-${event.date}-${event.label}`}><b>{String(index + 1).padStart(2, "0")}</b><div><h4>{conf.title} <em>{conf.isARR ? "ARR" : conf.rank ? `CCF ${conf.rank}` : ""}</em></h4><p>{event.date} · {event.label}</p><small>{event.inferred ? "* 根据本届日期顺延一年 · " : "官网已公布 · "}{sameField ? "同领域 · " : ""}{conf.place || conf.description}</small></div><strong>+{days} 天</strong></a>)}</div>
      </aside>}

      <footer><div><b>DDL ATLAS<sup>CN</sup></b><p>让研究计划，更早一点清晰。</p></div><p>会议与截止信息来自社区维护的 <a href="https://github.com/ccfddl/ccf-deadlines">CCFDDL</a>。Rebuttal 与最终结果仅在上游数据明确提供时显示，请以会议官网为准。</p></footer>
    </main>
  );
}

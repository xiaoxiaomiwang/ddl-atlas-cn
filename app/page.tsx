"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import rawData from "./conferences.json";
import builtInMeta from "./data-meta.json";
import autoSupplementsRaw from "./auto-supplements.json";
import { arrCycles, officialSupplements, type SupplementalEvent } from "./supplemental";
import arrCyclesAutoRaw from "./arr-cycles.json";
import { placeZh } from "./place-names";

type DataMeta = { upstreamSha: string | null; upstreamTime: string | null; generatedAt: string | null; recordCount: number };
type Milestone = { date: string; abstractDate: string; comment: string };
type AcceptRate = { year: number; rate: number; submitted: number; accepted: number };
type Conference = {
  id: string; title: string; description: string; category: string; rank: string;
  year: number; link: string; timezone: string; conferenceDate: string; conferenceStart: string; place: string;
  timeline: Milestone[];
  acceptRates?: AcceptRate[];
  supplementalEvents?: SupplementalEvent[]; commitVenues?: string[]; isARR?: boolean;
  /** 预测届：上游尚未公布的年份按最近一届平移生成；上游收录真实届次后自动替换 */
  projected?: boolean;
  projectedFrom?: number;
};

// 以运行当天为准动态计算"今天"与年份，避免硬编码随时间过期（定义需在 enrich 之前，外推 ARR 周期依赖）
const TODAY = (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
})();
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

// 日期平移 N 年（预测届与评审日程回退用）
function shiftYears(date: string, years: number) {
  if (!date) return date;
  const value = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  value.setUTCFullYear(value.getUTCFullYear() + years);
  return value.toISOString().slice(0, 10);
}

// 自动抓取的官网评审日程（CI 从会议官网解析，未经人工核验，人工核验数据优先）
type AutoSupplements = { conferences?: Record<string, { source: string; events: SupplementalEvent[] }> };
const autoSupplements = (autoSupplementsRaw as AutoSupplements).conferences || {};

// ARR 周期：官网自动抓取（live）与人工维护静态合并，live 优先、静态补充 commit 节点；
// 官网只公布未来两三个周期，其余按双月节奏外推（标 * 预测），保证拓扑每一层都有 ARR 保底通道
const ARR_MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
type ArrCycle = typeof arrCycles[number];
function mergedArrCycles(): Conference[] {
  const liveAll = (arrCyclesAutoRaw as ArrCycle[]).length > 0 ? (arrCyclesAutoRaw as ArrCycle[]) : arrCycles;
  const liveIds = new Set(liveAll.map((cycle) => cycle.id));
  const merged: Conference[] = liveAll.map((cycle) => {
    const staticCycle = arrCycles.find((item) => item.id === cycle.id);
    const events = [...(cycle.supplementalEvents || [])];
    for (const event of staticCycle?.supplementalEvents || []) {
      // live 抓取不解析 commitment 列，静态核验的 commit 节点补进去
      if (event.type === "commit" && !events.some((item) => item.type === "commit" && item.date === event.date)) events.push(event);
    }
    return { ...cycle, commitVenues: staticCycle?.commitVenues ?? cycle.commitVenues, supplementalEvents: events } as Conference;
  });
  for (const cycle of arrCycles) {
    if (!liveIds.has(cycle.id)) merged.push({ ...cycle } as Conference); // live 覆盖逻辑曾把静态独有周期整个丢掉，这里找回
  }
  const submissionDate = (conf: Conference) => (conf.supplementalEvents || []).find((event) => event.type === "submission")?.date || "";
  merged.sort((a, b) => (submissionDate(a) || "9999").localeCompare(submissionDate(b) || "9999"));
  const last = merged[merged.length - 1];
  if (last) {
    const lastSub = submissionDate(last);
    const prevSub = merged.length > 1 ? submissionDate(merged[merged.length - 2]) : "";
    const stepDays = lastSub && prevSub
      ? Math.max(40, Math.min(90, Math.round((Date.parse(`${lastSub}T00:00:00Z`) - Date.parse(`${prevSub}T00:00:00Z`)) / 86400000)))
      : 70;
    for (let index = 1; index <= 9; index += 1) {
      const nextSub = addDays(lastSub, stepDays * index);
      if (nextSub > addDays(TODAY, 540)) break;
      const monthName = ARR_MONTH_NAMES[Number(nextSub.slice(5, 7)) - 1] || "CYC";
      merged.push({
        ...last,
        id: `arr-proj-${index}`,
        title: `ARR ${monthName}`,
        description: `ACL Rolling Review · ${nextSub.slice(0, 4)} 年 ${monthName} 周期（按节奏预测）`,
        year: Number(nextSub.slice(0, 4)),
        conferenceDate: `预计投稿 ${nextSub}（双月节奏外推）`,
        commitVenues: ["官方尚未公布对应 venue"],
        projected: true,
        supplementalEvents: (last.supplementalEvents || []).map((event) => ({
          ...event,
          date: addDays(event.date, stepDays * index),
          label: event.type === "commit" ? event.label : `* 预计 · ${event.label}`,
          detail: "按 ARR 双月周期的历史节奏外推，官网公布后自动更新。",
          inferred: true,
          projected: true,
        })).filter((event) => event.date && event.date !== "TBD"),
      });
    }
  }
  return merged;
}

function enrichConferenceData(records: Conference[]) {
  const sourceData = records.map((conf) => {
    const key = `${conf.title}-${conf.year}`;
    const official = officialSupplements[key];
    const auto = official ? [] : (autoSupplements[key]?.events || []).map((event) => ({ ...event, autoFetched: true as const, source: event.source || autoSupplements[key].source }));
    return { ...conf, supplementalEvents: (official || auto) as SupplementalEvent[] };
  });
  // 预测届：评审日程（rebuttal/结果等）按来源届平移补全（标 * 推测，不参与结果推算——结果日仍走 +100 天保守估计）
  const byKey = new Map(sourceData.map((conf) => [`${conf.title}-${conf.year}`, conf]));
  for (const conf of sourceData) {
    if (!conf.projected || (conf.supplementalEvents || []).length > 0) continue;
    const fromYear = conf.projectedFrom ?? conf.year;
    const source = byKey.get(`${conf.title}-${fromYear}`);
    if (!source || fromYear === conf.year) continue;
    const shift = conf.year - fromYear;
    conf.supplementalEvents = (source.supplementalEvents || [])
      .filter((event) => !event.inferred && event.date && event.date !== "TBD")
      .map((event) => ({
        ...event,
        date: shiftYears(event.date, shift),
        label: `* 预计 · ${event.label}`,
        detail: `依据 ${conf.title} ${conf.projectedFrom} 届官方日程顺延 ${shift} 年推测；官网公布 ${conf.year} 届真实时间后自动替换为准确日期。`,
        inferred: true,
      }))
      .filter((event) => event.date && event.date !== "TBD") as SupplementalEvent[];
  }
  return [...sourceData, ...mergedArrCycles()] as Conference[];
}
const builtInData = enrichConferenceData(rawData as Conference[]);
const categories: Record<string, string> = {
  ALL: "全部领域", AI: "人工智能", DB: "数据库 · 数据挖掘", SC: "网络与信息安全",
  SE: "软件工程 · 系统软件", NW: "计算机网络", DS: "体系结构 · 并行 · 存储",
  CT: "计算机科学理论", CG: "图形学 · 多媒体", HI: "人机交互", MX: "交叉 · 新兴",
};
const months = ["1 月", "2 月", "3 月", "4 月", "5 月", "6 月", "7 月", "8 月", "9 月", "10 月", "11 月", "12 月"];
const rankColors: Record<string, string> = { A: "rank-a", B: "rank-b", C: "rank-c", N: "rank-n" };

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

// 数据的已知投稿排期视野边界（全数据最晚的投稿截止日）
function maxKnownDeadline(pool: Conference[]): string {
  let max = "";
  for (const conf of pool) for (const item of conf.timeline) if (item.date && item.date !== "TBD" && item.date > max) max = item.date;
  return max;
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

// ---- 投稿拓扑（Submission Topology）----
// 每一跳 = 一投；边 = "被拒后转投"。结果日来自人工核验/官网抓取，缺失按投稿后 100 天推测（标 *）。
type TopologyHop = {
  conf: Conference;
  entryDate: string;           // 投稿入口日期（摘要/全文/Commit 节点）
  entryLabel: string;          // 入口节点名
  resultDate: string;          // 预计最终结果日（主线按最坏情况延伸）
  earlyDate: string | null;    // 早反馈日（Phase1/早拒，可提前回退）
  inferredResult: boolean;     // 结果日是否为推测
};

type TopologyFilters = { ranks: string[]; categories: string[]; sameOnly: boolean; breadth: number };

// 推断某会议某轮投稿的出结果时间（早反馈 + 最终结果）
function inferResultDates(conf: Conference, entryDate: string): { result: string; early: string | null; inferred: boolean } {
  const results = (conf.supplementalEvents || [])
    .filter((event) => (!event.inferred || event.projected) && (event.type === "result" || event.type === "reject"))
    .map((event) => event.date)
    .filter((date) => date > entryDate)
    .sort();
  if (results.length > 0) return { result: results[results.length - 1], early: results[0], inferred: false };
  return { result: addDays(entryDate, 100), early: null, inferred: true };
}

// 从 fromDate（上一投的结果日）出发，生成下一投候选（Top-N，评分排序，路径去重，7 天缓冲）。
// rootConf 为领域参照会议（自由日期模式下第一层无参照，传 null）。
function topologyCandidates(fromDate: string, rootConf: Conference | null, usedTitles: Set<string>, filters: TopologyFilters, pool: Conference[]): TopologyHop[] {
  const minEntry = addDays(fromDate, fromDate === TODAY ? 0 : 7); // 转投缓冲
  const entries: Array<{ conf: Conference; date: string; label: string }> = [];
  for (const conf of pool) {
    if (usedTitles.has(conf.title)) continue; // 路径去重：同一条线不重复投同一会议
    // ARR 周期不受 CCF 等级过滤（rank=N）；普通会议按等级过滤
    if (!conf.isARR && filters.ranks.length > 0 && !filters.ranks.includes(conf.rank)) continue;
    // ARR 是跨领域的保底转投通道，不受领域筛选限制；普通会议按领域过滤
    if (!conf.isARR && filters.categories.length > 0 && !filters.categories.includes(conf.category)) continue;
    // ARR 视作 NLP/AI 领域：锚定 AI 会议并勾选"只看同领域"时仍保留 ARR
    const sameField = rootConf ? (conf.isARR ? rootConf.category === "AI" : conf.category === rootConf.category) : false;
    if (filters.sameOnly && rootConf && !sameField) continue;
    const nodes = [
      ...conf.timeline.filter((item) => item.date && item.date !== "TBD").map((item, index) => ({ date: item.date, label: markerLabel(item.comment, index) })),
      ...(conf.supplementalEvents || []).filter((e) => (!e.inferred || e.projected) && (e.type === "submission" || e.type === "commit")).map((e) => ({ date: e.date, label: e.label })),
    ].filter((n) => n.date >= minEntry && n.date < addDays(fromDate, 550)).sort((a, b) => a.date.localeCompare(b.date));
    if (nodes.length === 0) continue;
    entries.push({ conf, date: nodes[0].date, label: nodes[0].label });
  }
  const scored = entries.map((entry) => {
    const { result, early, inferred } = inferResultDates(entry.conf, entry.date);
    const gap = Math.round((Date.parse(`${entry.date}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`)) / 86400000);
    const fit = gap >= 30 && gap <= 180 ? 24 : gap < 30 ? 8 : gap <= 300 ? 12 : 4;   // 时间衔接适中度
    const rank = entry.conf.rank === "A" ? 16 : entry.conf.rank === "B" ? 10 : entry.conf.rank === "C" ? 5 : 0;
    const field = rootConf && entry.conf.category === rootConf.category ? 20 : 0;
    const rate = entry.conf.acceptRates && entry.conf.acceptRates.length > 0 ? Math.min(10, entry.conf.acceptRates[0].rate / 4) : 0;
    // 评审周期惩罚：出结果越晚，越早把规划推到数据视野之外；短周期奖励（快速拿到反馈再转投）
    const cycle = Math.round((Date.parse(`${result}T00:00:00Z`) - Date.parse(`${entry.date}T00:00:00Z`)) / 86400000);
    const cyclePenalty = cycle > 210 ? -14 : cycle > 150 ? -7 : cycle > 120 ? -3 : 0;
    const cycleBonus = cycle <= 90 ? 10 : cycle <= 120 ? 5 : 0;
    const arrBonus = entry.conf.isARR ? 12 : 0; // ARR 滚动投稿 + 可 Commit 多个会议的灵活性
    const projectedPenalty = entry.conf.projected ? -3 : 0; // 预测届日期为平移推测，同级让位于真实数据
    return { hop: { conf: entry.conf, entryDate: entry.date, entryLabel: entry.label, resultDate: result, earlyDate: early, inferredResult: inferred } as TopologyHop, score: fit + rank + field + rate + cyclePenalty + cycleBonus + arrBonus + projectedPenalty - (inferred ? 6 : 0) };
  });
  scored.sort((a, b) => b.score - a.score || a.hop.entryDate.localeCompare(b.hop.entryDate));
  const bestPerConf = new Map<string, typeof scored[number]>();
  for (const item of scored) if (!bestPerConf.has(item.hop.conf.title)) bestPerConf.set(item.hop.conf.title, item);
  return [...bestPerConf.values()].slice(0, filters.breadth).map((item) => item.hop);
}

// ---- 组合验证：给定一组心仪会议（≤6），寻找可行的串行投稿顺序 ----
// 可行 = 每一投的截止日 ≥ 上一投结果日 + 7 天缓冲；不可行则给出断点与最长可行前缀
// allowPast（复盘模式）：允许纳入已截止的最近轮次，用于复盘"当年怎么投才是可行路线"
type VerifyResult =
  | { ok: true; sequence: TopologyHop[] }
  | { ok: false; reason: string; bestPrefix: TopologyHop[]; suggestion?: TopologyHop[] };

function verifyTopology(selection: Conference[], allowPast = false): VerifyResult {
  if (selection.length === 0) return { ok: false, reason: "请先添加至少一场会议。", bestPrefix: [] };
  if (selection.length > 6) return { ok: false, reason: "最多支持 6 场会议组合验证。", bestPrefix: [] };
  // 每场会议保留最多 8 个未来投稿轮次（滚动投稿会议的深轮次参与衔接）；复盘模式再附最近的 2 个已截止轮次
  const optionsPerConf = selection.map((conf) => {
    const all = [
      ...conf.timeline.filter((item) => item.date && item.date !== "TBD").map((item) => item.date),
      ...(conf.supplementalEvents || []).filter((e) => (!e.inferred || e.projected) && (e.type === "submission" || e.type === "commit")).map((e) => e.date),
    ].sort();
    const future = all.filter((d) => d >= TODAY).slice(0, 8);
    const past = allowPast ? all.filter((d) => d < TODAY).slice(-2) : [];
    const nodes = [...past, ...future];
    if (nodes.length === 0) return null;
    return nodes.map((node) => {
      const { result, early, inferred } = inferResultDates(conf, node);
      return { conf, entryDate: node, entryLabel: "投稿", resultDate: result, earlyDate: early, inferredResult: inferred } as TopologyHop;
    });
  });
  const missing = selection.filter((_, index) => optionsPerConf[index] === null);
  if (missing.length > 0) return { ok: false, reason: `${missing.map((c) => c.title).join("、")} ${allowPast ? "在数据里没有任何投稿轮次" : "已无未来投稿节点（已截稿或未公布），可勾选复盘模式纳入已截止轮次"}，无法纳入组合。`, bestPrefix: [] };
  const valid = optionsPerConf as TopologyHop[][];
  // DFS：对每场会议选择一个轮次，寻找满足"结果日 + 7 天缓冲后可投下一场"的排列
  let answer: TopologyHop[] | null = null;
  let bestPrefix: TopologyHop[] = [];
  let steps = 0;
  const search = (current: TopologyHop[], remaining: TopologyHop[][]) => {
    if (answer || steps > 20000) return;
    steps += 1;
    if (current.length > bestPrefix.length) bestPrefix = [...current];
    if (remaining.length === 0) { answer = [...current]; return; }
    const ordered = [...remaining].sort((a, b) => a[0].entryDate.localeCompare(b[0].entryDate));
    for (const options of ordered) {
      for (const hop of options) {
        const feasible = current.length === 0 ? allowPast || hop.entryDate >= TODAY : hop.entryDate >= addDays(current[current.length - 1].resultDate, 7);
        if (!feasible) continue;
        search([...current, hop], remaining.filter((x) => x !== options));
        if (answer) return;
      }
    }
  };
  search([], valid);
  if (answer) return { ok: true, sequence: answer };
  const last = bestPrefix[bestPrefix.length - 1];
  const reason = bestPrefix.length === 0
    ? "这些会议的投稿节点互相衔接不上，无法构成可行顺序（滚动投稿会议也无可衔接的更晚轮次）。"
    : `断点：${last!.conf.title}（投稿 ${last!.entryDate}）的结果日为 ${last!.resultDate}，其后 7 天内没有剩余会议的可投轮次。可尝试替换其中一场，或在拓扑规划中查看该时点的替代路线。`;
  return { ok: false, reason, bestPrefix };
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
  const [plannerSort, setPlannerSort] = useState<"recommended" | "soonest" | "rank">("soonest");

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
      && (`${conf.title} ${conf.description} ${conf.place} ${placeZh(conf.place)}`.toLowerCase().includes(query.toLowerCase()));
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

  // Esc 关闭节点详情弹层、转投面板与投稿拓扑
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setSelectedEvent(null); setTransferPoint(null); setTopologyRoot(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

  // ---- 投稿拓扑状态 ----
  type TopologyRoot = { mode: "conf"; conf: Conference; event: SupplementalEvent } | { mode: "date"; freeDate: string };
  const [topologyRoot, setTopologyRoot] = useState<TopologyRoot | null>(null);
  const [topologyView, setTopologyView] = useState<"plan" | "verify">("plan"); // plan=智能拓扑规划, verify=会议组合验证
  const [freeDate, setFreeDate] = useState<string>(addDays(TODAY, 7));
  const [verifySelection, setVerifySelection] = useState<Conference[]>([]);
  const [verifyQuery, setVerifyQuery] = useState("");
  const [verifyAllowPast, setVerifyAllowPast] = useState(false); // 复盘模式：允许已截止轮次参与组合验证
  const [topologyPath, setTopologyPath] = useState<TopologyHop[]>([]);
  const [topoDepth, setTopoDepth] = useState(3);
  const [topoBreadth, setTopoBreadth] = useState(4);
  const [topoRanks, setTopoRanks] = useState<string[]>(["A", "B"]);
  const [topoCategories, setTopoCategories] = useState<string[]>([]);
  const [topoSameOnly, setTopoSameOnly] = useState(false);
  const [topoExpanded, setTopoExpanded] = useState<number[]>([]); // 展开显示全部候选的层序号

  const openFreeTopology = () => {
    setTopologyRoot({ mode: "date", freeDate });
    setTopologyView("plan");
    setTopologyPath([]);
    setVerifySelection([]);
    setSelectedEvent(null);
    setTransferPoint(null);
  };

  const startTopology = (conf: Conference, event: SupplementalEvent) => {
    setTopologyRoot({ mode: "conf", conf, event });
    setTopologyView("plan");
    setTopologyPath([]);
    setTopoRanks(rank === "ALL" ? ["A", "B"] : [rank]);
    setTopoCategories([]);
    setTopoSameOnly(false); // 默认宽松：候选不足的 bug 修复
    setTransferPoint(null);
    setSelectedEvent(null);
  };

  const verifyResult = useMemo(() => (topologyView === "verify" ? verifyTopology(verifySelection, verifyAllowPast) : null), [topologyView, verifySelection, verifyAllowPast]);
  const dataHorizon = useMemo(() => maxKnownDeadline(data), [data]);
  const verifySearchResults = useMemo(() => {
    if (topologyView !== "verify" || !verifyQuery.trim()) return [];
    const q = verifyQuery.trim().toLowerCase();
    return data.filter((conf) => !verifySelection.some((c) => c.title === conf.title) && `${conf.title} ${conf.description} ${conf.place}`.toLowerCase().includes(q)).slice(0, 8);
  }, [topologyView, verifyQuery, verifySelection, data]);

  // 各层候选：根节点之后的每跳由"上一跳结果日"驱动
  const topologyColumns = useMemo(() => {
    if (!topologyRoot) return [];
    const filters: TopologyFilters = { ranks: topoRanks, categories: topoCategories, sameOnly: topoSameOnly, breadth: Math.max(topoBreadth, 12) };
    const columns: TopologyHop[][] = [];
    const fromDate = topologyRoot.mode === "conf" ? topologyRoot.event.date : (topologyRoot.freeDate || TODAY);
    // anchor 仅为领域参照（评分用），绝不参与路径排除——排除集 used 只由真实路径构成
    const anchor = topologyRoot.mode === "conf" ? topologyRoot.conf : (topologyPath[0]?.conf ?? null);
    const used = new Set<string>(topologyRoot.mode === "conf" ? [topologyRoot.conf.title] : []);
    let cursor = fromDate;
    for (let depth = 0; depth < topoDepth; depth += 1) {
      const candidates = topologyCandidates(cursor, anchor, used, filters, data);
      // ARR 周期作为"保底中转"始终追加在候选尾部（随时可投、周期短、可 Commit 多个会议）
      const arrPool = data.filter((conf) => conf.isARR);
      const arrPick = topologyCandidates(cursor, anchor, used, { ...filters, ranks: [], breadth: 1 }, arrPool);
      if (arrPick.length > 0 && !candidates.some((hop) => hop.conf.isARR)) candidates.push(arrPick[0]);
      columns.push(candidates);
      const selected = topologyPath[depth];
      if (!selected || !candidates.some((hop) => hop.conf.id === selected.conf.id)) break;
      used.add(selected.conf.title);
      cursor = selected.resultDate;
    }
    return columns;
  }, [topologyRoot, topologyPath, topoDepth, topoBreadth, topoRanks, topoCategories, topoSameOnly, data]);

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
        <nav><a href="#timeline">投稿时间线</a><button className="nav-topo" onClick={openFreeTopology}>投稿拓扑</button><a href="https://ccfddl.com/" target="_blank">数据源 ↗</a><a href="https://github.com/ccfddl/ccf-deadlines" target="_blank">GitHub ↗</a></nav>
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
        <div className="section-heading"><div><p className="eyebrow">ANNUAL SUBMISSION GANTT</p><h2>{arrMode === "only" ? `${year} ARR 时间线` : `${year} 投稿甘特图`}</h2></div><div className="legend"><span><i className="abstract"/>摘要</span><span><i className="submission"/>投稿</span><span><i className="reject"/>拒稿</span><span><i className="rebuttal"/>Rebuttal</span><span><i className="result"/>出分/录用</span><span><i className="commit"/>Commit</span><span><i className="event"/>开会</span><span className="estimate-key">* 预测 / 往届节奏平移</span></div></div>
        <p className="drag-hint">↔ 左右拖动浏览会议　↕ 上下拖动浏览全年日期　·　单击看详情，双击日期节点生成转投路线</p>
        <div className="gantt-viewport" ref={ganttViewportRef}>
          {visible.length === 0 && <div className="empty"><b>没有匹配的会议</b><span>换一个等级、领域或搜索词试试。</span></div>}
          {visible.length > 0 && <div className="vertical-gantt" style={{ "--column-count": visible.length } as React.CSSProperties}>
            <div className="sticky-gantt-head"><div className="corner"><b>{year}</b><span>时间 / 日期</span></div><div className="conference-heads">{visible.map((conf, index) => { const nextDeadline = nextDeadlineInfo(conf); const countdownLevel = nextDeadline ? (nextDeadline.days === 0 ? "countdown-today" : nextDeadline.days <= 7 ? "countdown-soon" : nextDeadline.days <= 30 ? "countdown-mid" : "countdown-later") : ""; return <div className="conference-head" key={`head-${conf.id}-${conf.year}`}><div className="column-number">{String(index + 1).padStart(2, "0")}</div><div className="venue-top"><h3 title={`${conf.title} ${conf.year}${conf.projected ? " · 预测届（按上届顺延，官网公布后自动替换）" : ""}`}>{conf.title} <small className={conf.projected ? "proj-year" : ""}>{conf.year}{conf.projected ? "*" : ""}</small></h3><span className={`rank ${rankColors[conf.rank] || "rank-n"}`}>{conf.isARR ? "ARR" : conf.rank === "N" || !conf.rank ? "—" : `CCF ${conf.rank}`}</span></div><p title={conf.description}>{conf.description}</p><div className="meta">{nextDeadline && <span className={`countdown ${countdownLevel}`} title={`下一个投稿节点：${nextDeadline.date}`}>{nextDeadline.days === 0 ? "⚠ 今天截止" : `⏳ 剩 ${nextDeadline.days} 天`}</span>}{conf.projected && <span className="projected-tag" title={`预测届 · 依据 ${conf.projectedFrom} 届官方时间顺延；官网公布后自动替换`}>◷ 预测届</span>}<span title={conf.place || undefined}>⌖ {conf.place || "地点待定"}{conf.place && placeZh(conf.place)}</span><span>◷ {conf.conferenceDate || "时间待定"}</span>{conf.acceptRates && conf.acceptRates.length > 0 && <span className="accept-rate" title={`历届录用率：${conf.acceptRates.map((r) => `${r.year} 届 ${(r.rate).toFixed(1)}%（${r.accepted}/${r.submitted}）`).join("；")}`}>✦ {conf.acceptRates[0].rate.toFixed(1)}% 录取（{conf.acceptRates[0].year} 届）</span>}{conf.commitVenues?.map((venue) => <span className="commit-venue" key={venue}>→ {venue}</span>)}</div><a href={conf.link} target="_blank" rel="noreferrer">{conf.projected ? "参考上届官网 ↗" : "会议官网 ↗"}</a></div>})}</div></div>
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

      {selectedEvent && <div className="event-popover" role="dialog" aria-modal="true" aria-label="日期节点详情"><button className="popover-close" onClick={() => setSelectedEvent(null)} aria-label="关闭">×</button><p>{selectedEvent.conf.title} · {selectedEvent.conf.year} {selectedEvent.event.inferred ? "· 往届官网节奏平移 *" : selectedEvent.event.autoFetched ? "· 官网自动抓取（未核验）" : "· 官方核验"}</p><h3>{selectedEvent.event.label}</h3><time>{selectedEvent.event.date} · {selectedEvent.conf.timezone || "以官网为准"} · {(() => { const relDays = diffDaysFromToday(selectedEvent.event.date); return relDays === 0 ? "就是今天" : relDays > 0 ? `还有 ${relDays} 天` : `已过去 ${-relDays} 天`; })()}</time>{selectedEvent.event.detail && <div>{selectedEvent.event.detail}</div>}{selectedEvent.conf.projected && <div>该届为<b>预测排期</b>：依据 {selectedEvent.conf.projectedFrom} 届官方时间顺延推测，非主办方公布；官网公布真实时间后将自动替换为准确日期。</div>}{selectedEvent.event.autoFetched && <div>该节点由程序从会议官网自动解析，未经人工核验，请以官网为准。</div>}{selectedEvent.conf.acceptRates && selectedEvent.conf.acceptRates.length > 0 && <div className="popover-rates"><b>历届录用率</b>{selectedEvent.conf.acceptRates.map((r) => <span key={r.year}>{r.year} 届：<b>{r.rate.toFixed(1)}%</b>（{r.accepted}/{r.submitted}）</span>)}</div>}<a href={selectedEvent.event.source} target="_blank" rel="noreferrer">{selectedEvent.event.inferred ? "查看所依据的往届官网 ↗" : "查看官方来源 ↗"}</a></div>}

      {transferPoint && <aside className="transfer-panel" aria-label="转投候选会议">
        <div className="transfer-panel-head"><div><p>TRANSFER PLANNER</p><h3>从 {transferPoint.event.date.slice(5).replace("-", "/")} 之后转投</h3><span>{transferPoint.conf.title} · {transferPoint.event.label}</span></div><div className="transfer-head-actions"><button className="topology-entry" onClick={() => startTopology(transferPoint.conf, transferPoint.event)}>投稿拓扑 ↗</button><button onClick={() => setTransferPoint(null)} aria-label="关闭转投规划">×</button></div></div>
        <div className="planner-controls">
          <label>候选领域 · 可多选</label><div className="mini-buttons"><button className={plannerCategories.length === 0 ? "active" : ""} onClick={() => setPlannerCategories([])}>全部</button>{Object.entries(categories).filter(([key]) => key !== "ALL").map(([key, value]) => <button key={key} title={value} className={plannerCategories.includes(key) ? "active" : ""} onClick={() => setPlannerCategories((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])}>{key}</button>)}</div>
          <label>CCF 等级 · 可多选</label><div className="mini-buttons">{["A", "B", "C"].map((item) => <button key={item} className={plannerRanks.includes(item) ? "active" : ""} onClick={() => setPlannerRanks((current) => current.includes(item) ? current.filter((rankItem) => rankItem !== item) : [...current, item])}>{item}</button>)}</div>
          <div className="planner-selects"><label>最长等待<select value={plannerDays} onChange={(e) => setPlannerDays(Number(e.target.value))}><option value={30}>30 天</option><option value={60}>60 天</option><option value={120}>120 天</option><option value={240}>240 天</option><option value={365}>365 天</option><option value={540}>18 个月</option><option value={730}>2 年</option></select></label><label>目标类型<select value={plannerTarget} onChange={(e) => setPlannerTarget(e.target.value as "all" | "submission" | "commit")}><option value="all">直接投稿 + ARR Commit</option><option value="submission">仅直接投稿（新论文）</option><option value="commit">仅 ARR Commit（评审中转投）</option></select></label></div>
          <label>排序方式</label><div className="mini-buttons"><button title="按距截止的天数升序，最快可投的排最前" className={plannerSort === "soonest" ? "active" : ""} onClick={() => setPlannerSort("soonest")}>最近截止</button><button title="CCF 等级从高到低，同级按截止临近排序" className={plannerSort === "rank" ? "active" : ""} onClick={() => setPlannerSort("rank")}>等级优先</button><button title="综合评分：截止临近度 + CCF 等级 + 同领域 + 节点类型" className={plannerSort === "recommended" ? "active" : ""} onClick={() => setPlannerSort("recommended")}>综合推荐</button></div>
          <label className="same-toggle"><input type="checkbox" checked={plannerSameOnly} onChange={(e) => setPlannerSameOnly(e.target.checked)}/> 只看同领域</label><small>候选结果实时按当前条件重新计算</small>
        </div>
        <div className="candidate-list">{transferCandidates.length === 0 && <p className="no-candidate">{transferPoint.event.date < TODAY ? "该基准日已过去，未来无更多投稿节点。可点上方「投稿拓扑」查看从该时点起的完整路线（含已截止节点，供复盘）。" : "当前条件下没有可用投稿节点，可放宽领域、等级或最长等待时间。"}</p>}{transferCandidates.map(({ conf, event, days, sameField }, index) => <a href={conf.link} target="_blank" rel="noreferrer" className={`candidate ${event.inferred ? "projected" : ""}`} key={`${conf.id}-${event.date}-${event.label}`}><b>{String(index + 1).padStart(2, "0")}</b><div><h4>{conf.title} <em>{conf.isARR ? "ARR" : conf.rank ? `CCF ${conf.rank}` : ""}</em></h4><p>{event.date} · {event.label}</p><small>{event.inferred ? "* 根据本届日期顺延一年 · " : "官网已公布 · "}{sameField ? "同领域 · " : ""}{conf.place || conf.description}</small></div><strong>+{days} 天</strong></a>)}</div>
      </aside>}

      {topologyRoot && <div className="topology-overlay" role="dialog" aria-modal="true" aria-label="投稿拓扑规划" onClick={() => setTopologyRoot(null)}>
        <div className="topology-panel" onClick={(e) => e.stopPropagation()}>
        <div className="topology-head">
          <div><p>SUBMISSION TOPOLOGY</p>
            {topologyRoot.mode === "conf" && <h3>锚定 {topologyRoot.conf.title} · 从 {topologyRoot.event.date.slice(5).replace("-", "/")} 起，最坏情况的投稿路线</h3>}
            {topologyRoot.mode === "date" && <h3>论文完成日 {topologyRoot.freeDate.slice(5).replace("-", "/")} 起 · 最坏情况的投稿路线</h3>}
            <span>{topologyRoot.mode === "conf" ? topologyRoot.conf.title : topologyRoot.freeDate} → {topologyPath.map((hop) => hop.conf.title).join(" → ")}</span></div>
          <div className="topology-controls">
            <div className="topology-tabs"><button className={topologyView === "plan" ? "active" : ""} onClick={() => setTopologyView("plan")}>拓扑规划</button><button className={topologyView === "verify" ? "active" : ""} onClick={() => setTopologyView("verify")}>组合验证</button></div>
            {topologyRoot.mode === "date" && <div className="topology-datepicker"><label>论文完成日 · 可选过去日期复盘</label><input type="date" value={freeDate} onChange={(e) => { const value = e.target.value || TODAY; setFreeDate(value); setTopologyRoot({ mode: "date", freeDate: value }); setTopologyPath([]); }}/></div>}
            <label>领域类型 · 换领域即换整套拓扑</label><div className="mini-buttons"><button className={topoCategories.length === 0 ? "active" : ""} title="不限领域" onClick={() => setTopoCategories([])}>全部</button>{Object.entries(categories).filter(([key]) => key !== "ALL").map(([key, value]) => <button key={key} title={value} className={topoCategories.includes(key) ? "active" : ""} onClick={() => { setTopoCategories((cur) => cur.includes(key) ? cur.filter((x) => x !== key) : [...cur, key]); setTopoExpanded([]); }}>{key}</button>)}</div>
            <label>CCF 等级</label><div className="mini-buttons">{["A", "B", "C"].map((r) => <button key={r} className={topoRanks.includes(r) ? "active" : ""} onClick={() => { setTopoRanks((cur) => cur.includes(r) ? cur.filter((x) => x !== r) : [...cur, r]); setTopoExpanded([]); }}>{r}</button>)}</div>
            <label>深度 {topoDepth} 投</label><div className="mini-buttons">{[2, 3, 4].map((d) => <button key={d} className={topoDepth === d ? "active" : ""} onClick={() => { setTopoDepth(d); setTopologyPath(topologyPath.slice(0, d)); }}>{d}</button>)}</div>
            <label>每层显示 {topoBreadth} 选</label><div className="mini-buttons">{[3, 4, 5].map((b) => <button key={b} className={topoBreadth === b ? "active" : ""} onClick={() => { setTopoBreadth(b); setTopoExpanded([]); }}>{b}</button>)}</div>
            <label className="same-toggle"><input type="checkbox" checked={topoSameOnly} onChange={(e) => { setTopoSameOnly(e.target.checked); setTopoExpanded([]); }}/> 只看同领域</label>
            <button className="topology-close" onClick={() => setTopologyRoot(null)} aria-label="关闭投稿拓扑">×</button>
          </div>
        </div>
        <div className="topology-body">
          {topologyView === "verify" && <div className="verify-panel">
            <div className="verify-picker">
              <label>搜索并添加心仪会议（≤6）</label>
              <input type="text" value={verifyQuery} onChange={(e) => setVerifyQuery(e.target.value)} placeholder="SIGMOD、NeurIPS、www…"/>
              {verifySearchResults.length > 0 && <div className="verify-search-list">{verifySearchResults.map((conf) => <button key={conf.id} onClick={() => { setVerifySelection((cur) => cur.length >= 6 ? cur : [...cur, conf]); setVerifyQuery(""); }}>＋ {conf.title} {conf.year}{conf.projected ? "*" : ""} <em>{conf.isARR ? "ARR" : `CCF ${conf.rank}`}</em></button>)}</div>}
              <div className="verify-selected">{verifySelection.length === 0 && <span className="verify-empty">尚未添加会议，搜索后点击加入。</span>}{verifySelection.map((conf) => <button key={conf.id} className="verify-chip" onClick={() => setVerifySelection((cur) => cur.filter((c) => c !== conf))}>{conf.title} {conf.year}{conf.projected ? "*" : ""} ✕</button>)}</div>
              <label className="same-toggle"><input type="checkbox" checked={verifyAllowPast} onChange={(e) => setVerifyAllowPast(e.target.checked)}/> 允许已截止轮次（复盘过去的路线）</label>
            </div>
            {verifyResult && (verifyResult.ok
              ? <div className="verify-result ok"><p>✓ 这组会议可以构成可行的串行投稿线（间隔均 ≥ 7 天缓冲）：</p>
                  <div className="verify-sequence">{verifyResult.sequence.map((hop, index) => <div className={`topology-card ${hop.conf.projected ? "projected" : ""}`} key={hop.conf.id}><span className="verify-order">第 {index + 1} 投</span><div className="topology-card-top"><h4>{hop.conf.title} <small>{hop.conf.year}{hop.conf.projected ? "*" : ""}</small></h4><span className={`rank ${rankColors[hop.conf.rank] || "rank-n"}`}>{hop.conf.isARR ? "ARR" : `CCF ${hop.conf.rank}`}</span></div><div className="topology-dates"><span>■ 投稿 {hop.entryDate.slice(5)}{hop.entryDate < TODAY ? "（已截止）" : ""}</span><span>· {hop.inferredResult ? "* 约" : ""}结果 {hop.resultDate.slice(5)}</span></div><a href={hop.conf.link} target="_blank" rel="noreferrer">{hop.conf.projected ? "参考上届官网 ↗" : "会议官网 ↗"}</a></div>)}</div>
                  <p className="verify-tip">提示：该顺序按"每一投的结果日 + 7 天缓冲后可投下一场"验证。切换到"拓扑规划"可查看更完整的多级分支。</p></div>
              : <div className="verify-result bad"><p>✕ {verifyResult.reason}</p>
                  {verifyResult.bestPrefix.length > 0 && <p className="verify-tip">最长可行前缀：{verifyResult.bestPrefix.map((hop) => hop.conf.title).join(" → ")}；断点之后的会议无法衔接，可尝试替换其中一场或调整顺序。</p>}
                  {verifyResult.bestPrefix.length > 0 && <button className="topology-entry" onClick={() => { setVerifySelection([]); setTopologyView("plan"); }}>回到拓扑规划看替代路线</button>}</div>)}
          </div>}
          {topologyView === "plan" && <div className="topology-columns">
            {topologyColumns.map((candidates, depth) => {
              const isExpanded = topoExpanded.includes(depth);
              let visibleCandidates = candidates.slice(0, isExpanded ? 12 : topoBreadth);
              const activeHop = topologyPath[depth];
              if (activeHop && !visibleCandidates.some((hop) => hop.conf.id === activeHop.conf.id) && candidates.some((hop) => hop.conf.id === activeHop.conf.id)) {
                visibleCandidates = [...visibleCandidates, activeHop]; // 已选中的会议即使超出显示数也保持可见
              }
              return (
              <div className="topology-column" key={`col-${depth}`}>
                <div className="topology-column-label">第 {depth + 1} 投候选{depth > 0 ? ` · 前一投结果日 ${topologyPath[depth - 1]?.resultDate || ""} 之后` : ""}<span className="topology-hint">点击卡片选中，再点可取消</span></div>
                {candidates.length === 0 && <p className="no-candidate">{(depth === 0 ? (topologyRoot!.mode === "conf" ? topologyRoot.event.date : topologyRoot.freeDate) : topologyPath[depth - 1].resultDate) > dataHorizon ? `规划已推进到已知排期之外（上游仅公布到 ${dataHorizon}）——建议回退一层，改选结果日更早的会议（评审周期短），让后续投递落在已知排期内。` : "当前条件下此层没有可投会议，可放宽等级/领域筛选，或回退一层改选其他会议。"}</p>}
                {visibleCandidates.map((hop) => {
                  const active = topologyPath[depth]?.conf.id === hop.conf.id;
                  const gapFromPrev = Math.round((Date.parse(`${hop.entryDate}T00:00:00Z`) - Date.parse(`${(depth === 0 ? (topologyRoot!.mode === "conf" ? topologyRoot.event.date : topologyRoot.freeDate) : topologyPath[depth - 1].resultDate)}T00:00:00Z`)) / 86400000);
                  return <div className={`topology-card ${active ? "active" : ""} ${hop.conf.projected ? "projected" : ""}`} key={hop.conf.id} onClick={() => setTopologyPath((cur) => {
                    if (cur[depth]?.conf.id === hop.conf.id) return cur.slice(0, depth); // 点已选卡片 = 取消该层及更深选择
                    return [...cur.slice(0, depth), hop];
                  })}>
                    <div className="topology-card-top"><h4>{hop.conf.title} <small>{hop.conf.year}{hop.conf.projected ? "*" : ""}</small></h4><span className={`rank ${rankColors[hop.conf.rank] || "rank-n"}`}>{hop.conf.isARR ? "ARR" : `CCF ${hop.conf.rank}`}</span></div>
                    <p>{hop.conf.isARR ? `${hop.conf.description}${hop.conf.commitVenues?.length ? ` · 可 Commit：${hop.conf.commitVenues.join("、")}` : ""}` : `${hop.conf.place || hop.conf.description}${hop.conf.place ? placeZh(hop.conf.place) : ""}`}</p>
                    <div className="topology-dates">
                      <span>■ {hop.conf.isARR ? "ARR 投稿" : "投稿"} {hop.entryDate.slice(5)}{hop.entryDate < TODAY ? "（已截止）" : ""}</span>
                      {hop.earlyDate && <span>· 早反馈 {hop.earlyDate.slice(5)}</span>}
                      <span>· {hop.inferredResult ? "* 约" : ""}结果 {hop.resultDate.slice(5)}</span>
                    </div>
                    <div className="topology-meta">
                      <span>距上一投 +{gapFromPrev} 天</span>
                      {hop.conf.projected && <span>· 预测届（按 {hop.conf.projectedFrom} 届顺延）</span>}
                      {hop.conf.acceptRates && hop.conf.acceptRates.length > 0 && <span>· ✦ {hop.conf.acceptRates[0].rate.toFixed(1)}%（{hop.conf.acceptRates[0].year} 届）</span>}
                    </div>
                    <a href={hop.conf.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>{hop.conf.projected ? "参考上届官网 ↗" : "会议官网 ↗"}</a>
                  </div>;
                })}
                {candidates.length > visibleCandidates.length && <button className="topology-more" onClick={() => setTopoExpanded((cur) => [...cur, depth])}>＋ 展开全部 {candidates.length} 个候选</button>}
                {isExpanded && candidates.length > topoBreadth && <button className="topology-more" onClick={() => setTopoExpanded((cur) => cur.filter((d) => d !== depth))}>收起</button>}
              </div>
              );
            })}
          </div>}
        </div>
        </div>
      </div>}

      <footer><div><b>DDL ATLAS<sup>CN</sup></b><p>让研究计划，更早一点清晰。</p></div><p>会议与截止信息来自社区维护的 <a href="https://github.com/ccfddl/ccf-deadlines">CCFDDL</a>。Rebuttal 与最终结果仅在上游数据明确提供时显示，请以会议官网为准。</p></footer>
    </main>
  );
}

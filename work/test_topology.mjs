// 端到端验证拓扑三功能的核心算法（与线上 page.tsx 同源逻辑 + 真实数据）
import { readFileSync } from "fs";

const TODAY = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })();
const addDays = (date, days) => { const v = new Date(`${date}T00:00:00Z`); v.setUTCDate(v.getUTCDate() + days); return v.toISOString().slice(0, 10); };
const markerLabel = (comment, index, isAbstract = false) => {
  if (isAbstract) return "摘要截止";
  if (/round\s*1|first|1st/i.test(comment)) return "一轮投稿";
  if (/rebuttal|revision|response/i.test(comment)) return "Rebuttal / 修订";
  if (/notification|result|decision|accept/i.test(comment)) return "最终结果";
  return index === 0 ? "投稿截止" : `投稿截止 ${index + 1}`;
};

// 载入真实数据并复刻 enrich（supplemental + auto 合并）
const raw = JSON.parse(readFileSync("app/conferences.json", "utf8"));
const auto = JSON.parse(readFileSync("app/auto-supplements.json", "utf8")).conferences || {};
// supplemental official 按 ts 源码近似：把几个关键会议的补充事件并入（用 auto 数据已含绝大多数）
const data = raw.map((conf) => {
  const key = `${conf.title}-${conf.year}`;
  const events = auto[key]?.events?.map((e) => ({ ...e, autoFetched: true, source: e.source || auto[key].source })) || [];
  return { ...conf, supplementalEvents: events };
});

// ===== 与线上同源的算法 =====
const inferResultDates = (conf, entryDate) => {
  const results = (conf.supplementalEvents || [])
    .filter((e) => !e.inferred && (e.type === "result" || e.type === "reject"))
    .map((e) => e.date).filter((d) => d > entryDate).sort();
  if (results.length > 0) return { result: results[results.length - 1], early: results[0], inferred: false };
  return { result: addDays(entryDate, 100), early: null, inferred: true };
};

const topologyCandidates = (fromDate, rootConf, usedTitles, filters, pool) => {
  const minEntry = addDays(fromDate, fromDate === TODAY ? 0 : 7);
  const entries = [];
  for (const conf of pool) {
    if (conf.isARR) continue;
    if (usedTitles.has(conf.title)) continue;
    if (filters.ranks.length > 0 && !filters.ranks.includes(conf.rank)) continue;
    const sameField = rootConf ? conf.category === rootConf.category : false;
    if (filters.sameOnly && rootConf && !sameField) continue;
    if (filters.categories.length > 0 && !filters.categories.includes(conf.category)) continue;
    const nodes = [
      ...conf.timeline.filter((i) => i.date && i.date !== "TBD").map((i, idx) => ({ date: i.date, label: markerLabel(i.comment, idx) })),
      ...(conf.supplementalEvents || []).filter((e) => !e.inferred && (e.type === "submission" || e.type === "commit")).map((e) => ({ date: e.date, label: e.label })),
    ].filter((n) => n.date >= minEntry && n.date < addDays(fromDate, 550)).sort((a, b) => a.date.localeCompare(b.date));
    if (nodes.length === 0) continue;
    entries.push({ conf, date: nodes[0].date, label: nodes[0].label });
  }
  const scored = entries.map((entry) => {
    const { result, early, inferred } = inferResultDates(entry.conf, entry.date);
    const gap = Math.round((Date.parse(`${entry.date}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`)) / 86400000);
    const fit = gap >= 30 && gap <= 180 ? 24 : gap < 30 ? 8 : gap <= 300 ? 12 : 4;
    const rank = entry.conf.rank === "A" ? 16 : entry.conf.rank === "B" ? 10 : 5;
    const field = rootConf && entry.conf.category === rootConf.category ? 20 : 0;
    const rate = entry.conf.acceptRates?.length ? Math.min(10, entry.conf.acceptRates[0].rate / 4) : 0;
    const cycle = Math.round((Date.parse(`${result}T00:00:00Z`) - Date.parse(`${entry.date}T00:00:00Z`)) / 86400000);
    const cyclePenalty = cycle > 210 ? -14 : cycle > 150 ? -7 : cycle > 120 ? -3 : 0;
    return { hop: { conf: entry.conf, entryDate: entry.date, entryLabel: entry.label, resultDate: result, earlyDate: early, inferredResult: inferred }, score: fit + rank + field + rate + cyclePenalty - (inferred ? 6 : 0) };
  });
  scored.sort((a, b) => b.score - a.score || a.hop.entryDate.localeCompare(b.hop.entryDate));
  const best = new Map();
  for (const item of scored) if (!best.has(item.hop.conf.title)) best.set(item.hop.conf.title, item);
  return [...best.values()].slice(0, filters.breadth).map((i) => i.hop);
};

const verifyTopology = (selection) => {
  if (selection.length === 0) return { ok: false, reason: "空" };
  const optionsPerConf = selection.map((conf) => {
    const nodes = [
      ...conf.timeline.filter((i) => i.date && i.date !== "TBD").map((i) => i.date),
      ...(conf.supplementalEvents || []).filter((e) => !e.inferred && (e.type === "submission" || e.type === "commit")).map((e) => e.date),
    ].filter((d) => d >= TODAY).sort().slice(0, 8);
    if (nodes.length === 0) return null;
    return nodes.map((node) => { const { result, early, inferred } = inferResultDates(conf, node); return { conf, entryDate: node, entryLabel: "投稿", resultDate: result, earlyDate: early, inferredResult: inferred }; });
  });
  const missing = selection.filter((_, i) => optionsPerConf[i] === null);
  if (missing.length > 0) return { ok: false, reason: `${missing.map((c) => c.title).join("、")} 无未来投稿节点` };
  let answer = null; let bestPrefix = [];
  const search = (current, remaining) => {
    if (answer) return;
    if (current.length > bestPrefix.length) bestPrefix = [...current];
    if (remaining.length === 0) { answer = [...current]; return; }
    for (const options of [...remaining].sort((a, b) => a[0].entryDate.localeCompare(b[0].entryDate))) {
      for (const hop of options) {
        const feasible = current.length === 0 ? hop.entryDate >= TODAY : hop.entryDate >= addDays(current[current.length - 1].resultDate, 7);
        if (!feasible) continue;
        search([...current, hop], remaining.filter((x) => x !== options));
        if (answer) return;
      }
    }
  };
  search([], optionsPerConf);
  return answer ? { ok: true, sequence: answer } : { ok: false, reason: "不可行", bestPrefix };
};

const filters = { ranks: ["A", "B"], categories: [], sameOnly: false, breadth: 12 };
const hopLine = (h) => `${h.conf.title}-${h.conf.year} 投 ${h.entryDate} → ${h.inferredResult ? "*约" : ""}结果 ${h.resultDate}`;

// ===== 测试 1：自由日期入口（修复的断链 bug 场景）=====
console.log("===== 测试 1：自由日期模式点选三层链路 =====");
const freeDate = addDays(TODAY, 7);
const col1 = topologyCandidates(freeDate, null, new Set(), filters, data);
console.log(`第一层候选数: ${col1.length}（前5）`); col1.slice(0, 5).forEach((h) => console.log("  ", hopLine(h)));
const used = new Set();
const pick1 = col1[0]; used.add(pick1.conf.title);
const col2 = topologyCandidates(pick1.resultDate, pick1.conf, used, filters, data);
console.log(`选择第一投: ${pick1.conf.title}（结果日 ${pick1.resultDate}）`);
console.log(`第二层候选数: ${col2.length}（前5）`); col2.slice(0, 5).forEach((h) => console.log("  ", hopLine(h)));
const pick2 = col2[0]; used.add(pick2.conf.title);
const col3 = topologyCandidates(pick2.resultDate, pick2.conf, used, filters, data);
console.log(`选择第二投: ${pick2 ? pick2.conf.title : "无"}（结果日 ${pick2 ? pick2.resultDate : "-"}）`);
console.log(`第三层候选数: ${col3.length}`); col3.slice(0, 3).forEach((h) => console.log("  ", hopLine(h)));
if (col2.length === 0) {
  console.log("⚠ 第二层为空：改选第一层周期更短的会议重试（模拟用户回退）");
  const shortCycle1 = col1.filter((h) => h.resultDate <= addDays(h.entryDate, 150))[0];
  if (shortCycle1) {
    used.clear(); used.add(shortCycle1.conf.title);
    const col2b = topologyCandidates(shortCycle1.resultDate, shortCycle1.conf, used, filters, data);
    console.log(`  回退选 ${shortCycle1.conf.title}（${shortCycle1.entryDate} → ${shortCycle1.resultDate}）后第二层候选数: ${col2b.length}`);
    if (col2b.length > 0) { const p2 = col2b[0]; used.add(p2.conf.title);
      const col3b = topologyCandidates(p2.resultDate, p2.conf, used, filters, data);
      console.log(`  第三层候选数: ${col3b.length}`); col3b.slice(0, 3).forEach((h) => console.log("   ", hopLine(h))); }
  }
}

// ===== 测试 2：组合验证（滚动轮次场景）=====
console.log("\\n===== 测试 2：组合验证 SIGMOD+VLDB+ICDE 2027 =====");
const sel = ["SIGMOD", "VLDB", "ICDE"].map((t) => data.filter((c) => c.title === t && c.year === 2027)[0]).filter(Boolean);
const vr = verifyTopology(sel);
if (vr.ok) { console.log("✓ 可行，顺序："); vr.sequence.forEach((h, i) => console.log(`  第${i+1}投 ${h.conf.title} 投 ${h.entryDate} → 结果 ${h.resultDate}${h.inferredResult ? "（估算）" : ""}`)); }
else { console.log("✕ 不可行：", vr.reason); console.log("  最长前缀:", vr.bestPrefix.map((h) => h.conf.title).join(" → ")); }

// ===== 测试 3：锚定会议模式（WWW 2027 投稿起）=====
console.log("\\n===== 测试 3：锚定 WWW-2027（投稿 2026-10-25 起）=====");
const anchorConf = data.filter((c) => c.title === "WWW" && c.year === 2027)[0];
const colA = topologyCandidates("2026-10-25", anchorConf, new Set([anchorConf.title]), filters, data);
console.log(`第一层候选数: ${colA.length}（前5）`); colA.slice(0, 5).forEach((h) => console.log("  ", hopLine(h)));
const pickA = colA[0];
const colB = topologyCandidates(pickA.resultDate, anchorConf, new Set([anchorConf.title, pickA.conf.title]), filters, data);
console.log(`选 ${pickA.conf.title} 后第二层候选数: ${colB.length}`); colB.slice(0, 3).forEach((h) => console.log("  ", hopLine(h)));
console.log("测试3结果:", colA.length >= 3 && colB.length >= 1 ? "✓ 通过" : "✗ 失败");
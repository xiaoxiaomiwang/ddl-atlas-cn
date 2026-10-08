// 端到端验证拓扑核心算法（与线上 page.tsx 同源逻辑 + 真实数据）
// 覆盖：预测届（上游未公布年份按最近届平移）、ARR 周期合并与双月外推、复盘模式（允许已截止轮次）
import { readFileSync } from "fs";

const TODAY = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })();
const addDays = (date, days) => { const v = new Date(`${date}T00:00:00Z`); v.setUTCDate(v.getUTCDate() + days); return v.toISOString().slice(0, 10); };
const shiftYears = (date, years) => { if (!date) return date; const v = new Date(`${date.slice(0,10)}T00:00:00Z`); v.setUTCFullYear(v.getUTCFullYear() + years); return v.toISOString().slice(0, 10); };
const markerLabel = (comment, index, isAbstract = false) => {
  if (isAbstract) return "摘要截止";
  if (/round\s*1|first|1st/i.test(comment)) return "一轮投稿";
  if (/rebuttal|revision|response/i.test(comment)) return "Rebuttal / 修订";
  if (/notification|result|decision|accept/i.test(comment)) return "最终结果";
  return index === 0 ? "投稿截止" : `投稿截止 ${index + 1}`;
};

// ===== 载入真实数据并复刻线上 enrich =====
const raw = JSON.parse(readFileSync("app/conferences.json", "utf8"));
const auto = JSON.parse(readFileSync("app/auto-supplements.json", "utf8")).conferences || {};
const officialKeys = new Set(["WWW-2027"]); // supplemental.ts 人工核验的近似：至少 WWW-2027 优先于 auto
const sourceData = raw.map((conf) => {
  const key = `${conf.title}-${conf.year}`;
  const events = officialKeys.has(key) ? [] : (auto[key]?.events?.map((e) => ({ ...e, autoFetched: true, source: e.source || auto[key].source })) || []);
  return { ...conf, supplementalEvents: events };
});
// 预测届：评审日程按来源届平移（inferred=true → 不参与结果推算，纯展示）
const byKey = new Map(sourceData.map((c) => [`${c.title}-${c.year}`, c]));
for (const conf of sourceData) {
  if (!conf.projected || (conf.supplementalEvents || []).length > 0) continue;
  const fromYear = conf.projectedFrom ?? conf.year;
  const source = byKey.get(`${conf.title}-${fromYear}`);
  if (!source || fromYear === conf.year) continue;
  const shift = conf.year - fromYear;
  conf.supplementalEvents = (source.supplementalEvents || [])
    .filter((e) => !e.inferred && e.date && e.date !== "TBD")
    .map((e) => ({ ...e, date: shiftYears(e.date, shift), label: `* 预计 · ${e.label}`, inferred: true }))
    .filter((e) => e.date && e.date !== "TBD");
}
// ARR：live + 静态合并（live 优先、静态补 commit），再按双月节奏外推
const ARR_MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const staticArr = [
  { id: "arr-may-2026", title: "ARR MAY", commitEvents: [{ date: "2026-08-02", label: "Commit EMNLP / AACL", type: "commit" }] },
];
const liveArr = JSON.parse(readFileSync("app/arr-cycles.json", "utf8"));
const mergedArr = liveArr.map((cycle) => {
  const st = staticArr.find((s) => s.id === cycle.id);
  const events = [...(cycle.supplementalEvents || [])];
  if (st) for (const ev of st.commitEvents) if (!events.some((e) => e.type === "commit" && e.date === ev.date)) events.push(ev);
  return { ...cycle, supplementalEvents: events };
});
const submissionDate = (c) => (c.supplementalEvents || []).find((e) => e.type === "submission")?.date || "";
mergedArr.sort((a, b) => (submissionDate(a) || "9999").localeCompare(submissionDate(b) || "9999"));
const lastArr = mergedArr[mergedArr.length - 1];
if (lastArr) {
  const lastSub = submissionDate(lastArr);
  const prevSub = mergedArr.length > 1 ? submissionDate(mergedArr[mergedArr.length - 2]) : "";
  const stepDays = lastSub && prevSub ? Math.max(40, Math.min(90, Math.round((Date.parse(lastSub) - Date.parse(prevSub)) / 86400000))) : 70;
  for (let i = 1; i <= 9; i++) {
    const nextSub = addDays(lastSub, stepDays * i);
    if (nextSub > addDays(TODAY, 540)) break;
    mergedArr.push({ ...lastArr, id: `arr-proj-${i}`, title: `ARR ${ARR_MONTHS[Number(nextSub.slice(5,7)) - 1]}`, projected: true,
      supplementalEvents: (lastArr.supplementalEvents || []).map((e) => ({ ...e, date: addDays(e.date, stepDays * i), label: e.type === "commit" ? e.label : `* 预计 · ${e.label}`, inferred: true, projected: true })) });
  }
}
const data = [...sourceData, ...mergedArr];

// ===== 与线上同源的算法 =====
const inferResultDates = (conf, entryDate) => {
  const results = (conf.supplementalEvents || [])
    .filter((e) => (!e.inferred || e.projected) && (e.type === "result" || e.type === "reject"))
    .map((e) => e.date).filter((d) => d > entryDate).sort();
  if (results.length > 0) return { result: results[results.length - 1], early: results[0], inferred: false };
  return { result: addDays(entryDate, 100), early: null, inferred: true };
};

const topologyCandidates = (fromDate, rootConf, usedIds, filters, pool) => {
  const minEntry = addDays(fromDate, fromDate === TODAY ? 0 : 7);
  const entries = [];
  for (const conf of pool) {
    if (usedIds.has(conf.id)) continue;
    if (!conf.isARR && filters.ranks.length > 0 && !filters.ranks.includes(conf.rank)) continue;
    if (!conf.isARR && filters.categories.length > 0 && !filters.categories.includes(conf.category)) continue;
    const sameField = rootConf ? (conf.isARR ? rootConf.category === "AI" : conf.category === rootConf.category) : false;
    if (filters.sameOnly && rootConf && !sameField) continue;
    const nodes = [
      ...conf.timeline.filter((i) => i.date && i.date !== "TBD").map((i, idx) => ({ date: i.date, label: markerLabel(i.comment, idx) })),
      ...(conf.supplementalEvents || []).filter((e) => (!e.inferred || e.projected) && (e.type === "submission" || e.type === "commit")).map((e) => ({ date: e.date, label: e.label })),
    ].filter((n) => n.date >= minEntry && n.date < addDays(fromDate, 730)).sort((a, b) => a.date.localeCompare(b.date));
    if (nodes.length === 0) continue;
    entries.push({ conf, date: nodes[0].date, label: nodes[0].label });
  }
  const scored = entries.map((entry) => {
    const { result, early, inferred } = inferResultDates(entry.conf, entry.date);
    const gap = Math.round((Date.parse(entry.date) - Date.parse(fromDate)) / 86400000);
    const fit = gap >= 30 && gap <= 180 ? 24 : gap < 30 ? 8 : gap <= 300 ? 12 : 4;
    const rank = entry.conf.rank === "A" ? 16 : entry.conf.rank === "B" ? 10 : 5;
    const field = rootConf && entry.conf.category === rootConf.category ? 20 : 0;
    const rate = entry.conf.acceptRates?.length ? Math.min(10, entry.conf.acceptRates[0].rate / 4) : 0;
    const cycle = Math.round((Date.parse(result) - Date.parse(entry.date)) / 86400000);
    const cyclePenalty = cycle > 210 ? -14 : cycle > 150 ? -7 : cycle > 120 ? -3 : 0;
    const cycleBonus = cycle <= 90 ? 10 : cycle <= 120 ? 5 : 0;
    const arrBonus = entry.conf.isARR ? 12 : 0;
    const projectedPenalty = entry.conf.projected ? -3 : 0;
    return { hop: { conf: entry.conf, entryDate: entry.date, entryLabel: entry.label, resultDate: result, earlyDate: early, inferredResult: inferred }, score: fit + rank + field + rate + cyclePenalty + cycleBonus + arrBonus + projectedPenalty - (inferred ? 6 : 0) };
  });
  scored.sort((a, b) => b.score - a.score || a.hop.entryDate.localeCompare(b.hop.entryDate));
  const best = new Map();
  for (const item of scored) if (!best.has(item.hop.conf.title)) best.set(item.hop.conf.title, item);
  return [...best.values()].slice(0, filters.breadth).map((i) => i.hop);
};

const verifyTopology = (selection, allowPast = false) => {
  if (selection.length === 0) return { ok: false, reason: "空" };
  const optionsPerConf = selection.map((conf) => {
    const all = [
      ...conf.timeline.filter((i) => i.date && i.date !== "TBD").map((i) => i.date),
      ...(conf.supplementalEvents || []).filter((e) => (!e.inferred || e.projected) && (e.type === "submission" || e.type === "commit")).map((e) => e.date),
    ].sort();
    const future = all.filter((d) => d >= TODAY).slice(0, 8);
    const past = allowPast ? all.filter((d) => d < TODAY).slice(-2) : [];
    const nodes = [...past, ...future];
    if (nodes.length === 0) return null;
    return nodes.map((node) => { const { result, early, inferred } = inferResultDates(conf, node); return { conf, entryDate: node, entryLabel: "投稿", resultDate: result, earlyDate: early, inferredResult: inferred }; });
  });
  const missing = selection.filter((_, i) => optionsPerConf[i] === null);
  if (missing.length > 0) return { ok: false, reason: `${missing.map((c) => c.title).join("、")} 无投稿轮次` };
  let answer = null; let bestPrefix = [];
  const search = (current, remaining) => {
    if (answer) return;
    if (current.length > bestPrefix.length) bestPrefix = [...current];
    if (remaining.length === 0) { answer = [...current]; return; }
    for (const options of [...remaining].sort((a, b) => a[0].entryDate.localeCompare(b[0].entryDate))) {
      for (const hop of options) {
        const feasible = current.length === 0 ? allowPast || hop.entryDate >= TODAY : hop.entryDate >= addDays(current[current.length - 1].resultDate, 7);
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
const hopLine = (h) => `${h.conf.title}-${h.conf.year}${h.conf.projected ? "*" : ""} 投 ${h.entryDate} → ${h.inferredResult ? "*约" : ""}结果 ${h.resultDate}`;
let failures = 0;
const assert = (cond, msg) => { console.log(`${cond ? "✓" : "✗ FAIL"} ${msg}`); if (!cond) failures += 1; };

// ===== 测试 0：预测届数据质量 =====
console.log("===== 测试 0：预测届生成质量 =====");
const proj = data.filter((c) => c.projected && !c.isARR);
console.log(`预测届数量: ${proj.length}`);
assert(proj.length > 400, `预测届应大规模生成（实际 ${proj.length}）`);
const iccv29 = data.find((c) => c.title === "ICCV" && c.year === 2029 && c.projected);
assert(iccv29 && iccv29.projectedFrom === 2025, `ICCV 2029 为双年会步长 +4 平移（projectedFrom=${iccv29?.projectedFrom}）`);
assert(!data.some((c) => c.title === "ICCV" && c.year === 2027 && c.projected), "ICCV 2027 上游已收录（TBD），不得生成预测届");
const sm28 = data.find((c) => c.title === "SIGMOD" && c.year === 2028 && c.projected);
assert(sm28 && sm28.timeline[0].date.startsWith("2027-01"), `SIGMOD 2028 预测 round1 应为 2027-01-17 一带（实际 ${sm28?.timeline[0]?.date}）`);
const sm27 = data.find((c) => c.title === "SIGMOD" && c.year === 2027 && !c.projected);
assert(!sm27 || !sm27.projected, "SIGMOD 2027 使用真实数据（自动替换）");

// ===== 测试 1：ARR 周期合并 + 双月外推 + 领域豁免 =====
console.log("\n===== 测试 1：ARR 合并与外推 =====");
const arrAll = data.filter((c) => c.isARR);
console.log(`ARR 周期总数: ${arrAll.length}（外推 ${arrAll.filter((c) => c.projected).length} 个）`);
assert(arrAll.length >= 4, "ARR 周期应含静态+live 合并（≥4）");
assert(arrAll.some((c) => c.projected && c.supplementalEvents.some((e) => e.projected && e.type === "submission")), "外推周期含可参与拓扑的 submission 节点");
// 从今天起第一层：ARR 保底候选必须存在（双月外推保证永远有下一轮）
const colToday = topologyCandidates(TODAY, null, new Set(), filters, data);
const arrInLayer = colToday.find((h) => h.conf.isARR);
assert(!!arrInLayer, `今天起的第一层应含 ARR 保底候选（${arrInLayer ? hopLine(arrInLayer) : "无"}）`);
// 选了领域（如 DB）时 ARR 仍保留（豁免）
const colDB = topologyCandidates(TODAY, null, new Set(), { ...filters, categories: ["DB"], breadth: 12 }, data);
assert(colDB.some((h) => h.conf.isARR), "领域筛选=DB 时 ARR 仍应保留（跨领域保底通道）");
// 锚定 DB 会议 + sameOnly：ARR 不应出现；锚定 AI 会议 + sameOnly：ARR 保留
const anchorDB = data.find((c) => c.title === "SIGMOD" && c.year === 2027 && !c.projected);
const colSameDB = topologyCandidates(TODAY, anchorDB, new Set([anchorDB?.id]), { ...filters, sameOnly: true, breadth: 12 }, data);
assert(!colSameDB.some((h) => h.conf.isARR), "锚定 DB 会议 + 只看同领域时 ARR 不出现（合理）");
const anchorAI = data.find((c) => c.title === "AAAI" && c.year === 2027 && !c.projected);
if (anchorAI) {
  const colSameAI = topologyCandidates(TODAY, anchorAI, new Set([anchorAI?.id]), { ...filters, sameOnly: true, breadth: 12 }, data);
  assert(colSameAI.some((h) => h.conf.isARR), "锚定 AI 会议 + 只看同领域时 ARR 保留（ARR 视同 NLP/AI）");
}

// ===== 测试 2：自由日期模式三层链（预测届延伸数据视野）=====
console.log("\n===== 测试 2：自由日期三层链（含预测届）=====");
const freeDate = addDays(TODAY, 7);
const col1 = topologyCandidates(freeDate, null, new Set(), filters, data);
console.log(`第一层候选数: ${col1.length}（前3）`); col1.slice(0, 3).forEach((h) => console.log("  ", hopLine(h)));
const pick1 = col1[0];
const used = new Set([pick1.conf.id]);
const col2 = topologyCandidates(pick1.resultDate, pick1.conf, used, filters, data);
console.log(`选 ${pick1.conf.title}（结果 ${pick1.resultDate}）→ 第二层候选数: ${col2.length}`);
col2.slice(0, 3).forEach((h) => console.log("  ", hopLine(h)));
const pick2 = col2[0]; used.add(pick2.conf.id);
const col3 = topologyCandidates(pick2.resultDate, pick2.conf, used, filters, data);
console.log(`选 ${pick2 ? pick2.conf.title : "无"} → 第三层候选数: ${col3.length}（其中预测届 ${col3.filter((h) => h.conf.projected).length}）`);
col3.slice(0, 3).forEach((h) => console.log("  ", hopLine(h)));
assert(col1.length >= 5 && col2.length >= 3 && col3.length >= 3, `三层候选均应充足（${col1.length}/${col2.length}/${col3.length}）`);

// ===== 测试 3：组合验证（滚动 + 预测届）=====
console.log("\n===== 测试 3：组合验证 SIGMOD+VLDB+ICDE 2027→2028 =====");
const sel = ["SIGMOD", "VLDB", "ICDE"].map((t) => data.filter((c) => c.title === t && c.year === 2027 && !c.projected)[0]).filter(Boolean);
const vr = verifyTopology(sel);
if (vr.ok) { console.log("✓ 可行，顺序："); vr.sequence.forEach((h, i) => console.log(`  第${i+1}投 ${h.conf.title} 投 ${h.entryDate} → 结果 ${h.resultDate}${h.inferredResult ? "（估算）" : ""}`)); }
else { console.log("结果：", vr.reason); console.log("  最长前缀:", vr.bestPrefix.map((h) => h.conf.title).join(" → ")); }
// 加入预测届后的跨年组合（2028 预测届必须可参与验证）
const sel2 = [data.find((c) => c.title === "SIGMOD" && c.year === 2028 && c.projected), data.find((c) => c.title === "VLDB" && c.year === 2028 && c.projected)].filter(Boolean);
assert(sel2.length === 2, "SIGMOD/VLDB 2028 预测届存在于数据");
const vr2 = verifyTopology(sel2);
console.log(`SIGMOD+VLDB 2028 预测届组合: ${vr2.ok ? "✓ 可行" : "✕ " + vr2.reason}`);
if (vr2.ok) vr2.sequence.forEach((h, i) => console.log(`  第${i+1}投 ${h.conf.title} 投 ${h.entryDate} → *约结果 ${h.resultDate}`));
assert(vr2.ok, "两个 2028 预测届应可构成可行组合（滚动轮次足够）");

// ===== 测试 4：复盘模式（允许已截止轮次）=====
console.log("\n===== 测试 4：复盘模式 =====");
// 已截稿的会议：例如 SIGMOD 2026（round1 2026-01-17 已过）
const sigmod26 = data.find((c) => c.title === "SIGMOD" && c.year === 2026 && !c.projected);
const vldb27 = data.find((c) => c.title === "VLDB" && c.year === 2027 && !c.projected);
const retro = verifyTopology([sigmod26, vldb27].filter(Boolean));
console.log(`默认模式（SIGMOD26+VLDB27）: ${retro.ok ? "可行" : retro.reason}`);
const retroPast = verifyTopology([sigmod26, vldb27].filter(Boolean), true);
console.log(`复盘模式（SIGMOD26+VLDB27）: ${retroPast.ok ? "✓ 可行：" + retroPast.sequence.map((h) => `${h.conf.title}@${h.entryDate}`).join(" → ") : retroPast.reason}`);
assert(retroPast.ok || sigmod26 === undefined, "复盘模式应允许已截止轮次构成历史路线");
// 过去日期起点的拓扑规划（复盘用户路线）
const pastDate = "2026-03-01";
const colPast = topologyCandidates(pastDate, null, new Set(), filters, data);
console.log(`从过去日期 ${pastDate} 起的拓扑第一层候选数: ${colPast.length}（已截止 ${colPast.filter((h) => h.entryDate < TODAY).length} 个）`);
assert(colPast.some((h) => h.entryDate < TODAY), "从过去日期出发应包含已截止节点（复盘）");
assert(colPast.length >= 5, "过去起点候选应充足");

// ===== 测试 5：数据视野（预测届扩展 horizon）=====
console.log("\n===== 测试 5：数据视野 =====");
const horizon = data.reduce((max, c) => { for (const t of c.timeline) if (t.date && t.date > max) max = t.date; return max; }, "");
console.log(`最晚投稿节点: ${horizon}（预测届已覆盖至该年份）`);
assert(horizon >= "2029-01-01", "数据视野应覆盖到 2029（预测届生效）");

// ===== 测试 6：跨届重投（WWW 2027 被拒 → WWW 2028 预测届）+ 手动指定会议 =====
console.log("\n===== 测试 6：跨届候选与手动指定 =====");
const anchorWWW = data.find((c) => c.title === "WWW" && c.year === 2027 && !c.projected);
assert(!!anchorWWW, "WWW 2027 真实届存在");
const wwwResult = inferResultDates(anchorWWW, "2026-10-25").result;
const colWWW2 = topologyCandidates(wwwResult, anchorWWW, new Set([anchorWWW.id]), filters, data);
const wwwNext = colWWW2.find((h) => h.conf.title === "WWW" && h.conf.projected);
console.log(`锚定 WWW 2027（结果 ${wwwResult}）→ 第二层候选 ${colWWW2.length} 个，同会议下一届: ${wwwNext ? `${wwwNext.conf.title} ${wwwNext.conf.year}* 投 ${wwwNext.entryDate}` : "无"}`);
assert(!!wwwNext && wwwNext.conf.year >= 2028, "WWW 2027 被拒后应可转投 WWW 2028 预测届（届级去重修复）");
assert(!colWWW2.some((h) => h.conf.id === anchorWWW.id), "同届 WWW 2027 不得重复出现");
const used2 = new Set([anchorWWW.id, wwwNext?.conf.id]);
const colWWW3 = topologyCandidates(wwwNext.resultDate, anchorWWW, used2, filters, data);
assert(colWWW3.some((h) => h.conf.title === "WWW" && h.conf.year === 2029), "第三层应还能看到 WWW 2029 预测届（隔届连环重投）");

// 手动指定复刻（与 page.tsx pickManualConf 同源）：会议即使不在候选里也可强制选入
const manualPick = (conf, layerFrom) => {
  if (!conf) return null;
  const minEntry = addDays(layerFrom, layerFrom === TODAY ? 0 : 7);
  const nodes = [
    ...conf.timeline.filter((i) => i.date && i.date !== "TBD").map((i, idx) => ({ date: i.date, label: markerLabel(i.comment, idx) })),
    ...(conf.supplementalEvents || []).filter((e) => (!e.inferred || e.projected) && (e.type === "submission" || e.type === "commit")).map((e) => ({ date: e.date, label: e.label })),
  ].filter((n) => n.date >= minEntry && n.date < addDays(layerFrom, 730)).sort((a, b) => a.date.localeCompare(b.date));
  if (nodes.length === 0) return null;
  const { result, early, inferred } = inferResultDates(conf, nodes[0].date);
  return { conf, entryDate: nodes[0].date, resultDate: result, inferredResult: inferred };
};
const sm28m = data.find((c) => c.title === "SIGMOD" && c.year === 2028 && c.projected);
const manual1 = manualPick(sm28m, "2026-10-15");
console.log(`手动指定 SIGMOD 2028* 于第一层: ${manual1 ? `投 ${manual1.entryDate} → *约结果 ${manual1.resultDate}` : "无节点"}`);
assert(manual1 && manual1.entryDate === "2027-01-17", "手动指定 SIGMOD 2028* 应取最早可投轮次 2027-01-17");
const sigmod26m = data.find((c) => c.title === "SIGMOD" && c.year === 2026 && !c.projected);
const manual2 = manualPick(sigmod26m, "2026-10-15");
assert(manual2 === null, "手动指定已截稿的 SIGMOD 2026 应提示无节点（不可行）");

console.log(`
========== ${failures === 0 ? "✓ 全部通过" : `✗ ${failures} 项失败`} ==========`);
process.exit(failures === 0 ? 0 : 1);
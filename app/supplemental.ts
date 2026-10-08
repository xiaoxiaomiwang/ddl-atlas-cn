export type SupplementalEvent = {
  date: string;
  label: string;
  type: "abstract" | "submission" | "reject" | "rebuttal" | "result" | "commit" | "camera" | "event";
  detail?: string;
  source: string;
  inferred?: boolean;
  autoFetched?: boolean;
  /** 外推/预测周期节点：UI 上按推测显示（* 标记），但参与拓扑与组合验证的排期计算 */
  projected?: boolean;
};

export type SupplementalConference = {
  id: string;
  title: string;
  description: string;
  category: string;
  rank: string;
  year: number;
  link: string;
  timezone: string;
  conferenceDate: string;
  conferenceStart: string;
  place: string;
  timeline: never[];
  supplementalEvents: SupplementalEvent[];
  commitVenues?: string[];
  isARR?: boolean;
};

export const officialSupplements: Record<string, SupplementalEvent[]> = {
  "AAAI-2027": [
    { date: "2026-07-21", label: "摘要截止", type: "abstract", source: "https://aaai.org/conference/aaai/aaai-27/" },
    { date: "2026-07-28", label: "全文截止", type: "submission", source: "https://aaai.org/conference/aaai/aaai-27/" },
    { date: "2026-07-31", label: "补充材料截止", type: "submission", source: "https://aaai.org/conference/aaai/aaai-27/" },
    { date: "2026-09-24", label: "Phase 1 拒稿结果", type: "reject", source: "https://aaai.org/conference/aaai/aaai-27/" },
    { date: "2026-10-19", label: "Author Feedback / Rebuttal 开始", type: "rebuttal", source: "https://aaai.org/conference/aaai/aaai-27/" },
    { date: "2026-10-25", label: "Author Feedback / Rebuttal 截止", type: "rebuttal", source: "https://aaai.org/conference/aaai/aaai-27/" },
    { date: "2026-11-30", label: "最终录用结果", type: "result", source: "https://aaai.org/conference/aaai/aaai-27/" },
    { date: "2026-12-14", label: "Camera-ready", type: "camera", source: "https://aaai.org/conference/aaai/aaai-27/" },
  ],
  "SIGMOD-2027": [
    { date: "2026-03-10", label: "一轮 Author Feedback 开始", type: "rebuttal", source: "https://2027.sigmod.org/calls_papers_important_dates.shtml" },
    { date: "2026-03-17", label: "一轮 Author Feedback 截止", type: "rebuttal", source: "https://2027.sigmod.org/calls_papers_important_dates.shtml" },
    { date: "2026-04-19", label: "一轮初步结果", type: "result", source: "https://2027.sigmod.org/calls_papers_important_dates.shtml" },
    { date: "2026-05-19", label: "一轮 Revision 截止", type: "rebuttal", source: "https://2027.sigmod.org/calls_papers_important_dates.shtml" },
    { date: "2026-06-12", label: "一轮最终结果", type: "result", source: "https://2027.sigmod.org/calls_papers_important_dates.shtml" },
    { date: "2026-06-10", label: "二轮 Author Feedback 开始", type: "rebuttal", source: "https://2027.sigmod.org/calls_papers_important_dates.shtml" },
    { date: "2026-06-17", label: "二轮 Author Feedback 截止", type: "rebuttal", source: "https://2027.sigmod.org/calls_papers_important_dates.shtml" },
    { date: "2026-07-19", label: "二轮初步结果", type: "result", source: "https://2027.sigmod.org/calls_papers_important_dates.shtml" },
    { date: "2026-08-19", label: "二轮 Revision 截止", type: "rebuttal", source: "https://2027.sigmod.org/calls_papers_important_dates.shtml" },
    { date: "2026-09-12", label: "二轮最终结果", type: "result", source: "https://2027.sigmod.org/calls_papers_important_dates.shtml" },
    { date: "2026-09-10", label: "三轮 Author Feedback 开始", type: "rebuttal", source: "https://2027.sigmod.org/calls_papers_important_dates.shtml" },
    { date: "2026-09-17", label: "三轮 Author Feedback 截止", type: "rebuttal", source: "https://2027.sigmod.org/calls_papers_important_dates.shtml" },
    { date: "2026-10-19", label: "三轮初步结果", type: "result", source: "https://2027.sigmod.org/calls_papers_important_dates.shtml" },
    { date: "2026-11-19", label: "三轮 Revision 截止", type: "rebuttal", source: "https://2027.sigmod.org/calls_papers_important_dates.shtml" },
    { date: "2026-12-12", label: "三轮最终结果", type: "result", source: "https://2027.sigmod.org/calls_papers_important_dates.shtml" },
    { date: "2026-12-10", label: "四轮 Author Feedback 开始", type: "rebuttal", source: "https://2027.sigmod.org/calls_papers_important_dates.shtml" },
    { date: "2026-12-17", label: "四轮 Author Feedback 截止", type: "rebuttal", source: "https://2027.sigmod.org/calls_papers_important_dates.shtml" },
    { date: "2027-01-19", label: "四轮初步结果", type: "result", source: "https://2027.sigmod.org/calls_papers_important_dates.shtml" },
    { date: "2027-02-19", label: "四轮 Revision 截止", type: "rebuttal", source: "https://2027.sigmod.org/calls_papers_important_dates.shtml" },
    { date: "2027-03-12", label: "四轮最终结果", type: "result", source: "https://2027.sigmod.org/calls_papers_important_dates.shtml" },
  ],
  "ICDE-2027": [
    { date: "2026-06-11", label: "一轮全文截止", type: "submission", source: "https://icde2027.github.io/cf-research-papers.html" },
    { date: "2026-08-08", label: "一轮 Rebuttal 开始", type: "rebuttal", source: "https://icde2027.github.io/cf-research-papers.html" },
    { date: "2026-08-15", label: "一轮 Rebuttal 截止", type: "rebuttal", source: "https://icde2027.github.io/cf-research-papers.html" },
    { date: "2026-09-10", label: "一轮最终结果", type: "result", source: "https://icde2027.github.io/cf-research-papers.html" },
    { date: "2026-10-10", label: "一轮 Camera-ready", type: "camera", source: "https://icde2027.github.io/cf-research-papers.html" },
    { date: "2026-11-11", label: "二轮全文截止", type: "submission", source: "https://icde2027.github.io/cf-research-papers.html" },
    { date: "2027-01-08", label: "二轮 Rebuttal 开始", type: "rebuttal", source: "https://icde2027.github.io/cf-research-papers.html" },
    { date: "2027-01-15", label: "二轮 Rebuttal 截止", type: "rebuttal", source: "https://icde2027.github.io/cf-research-papers.html" },
    { date: "2027-02-10", label: "二轮最终结果", type: "result", source: "https://icde2027.github.io/cf-research-papers.html" },
    { date: "2027-03-10", label: "二轮 Camera-ready", type: "camera", source: "https://icde2027.github.io/cf-research-papers.html" },
  ],
  "SIGIR-2026": [
    { date: "2026-04-02", label: "Full Paper 最终结果", type: "result", detail: "SIGIR 2026 Full Papers 官方流程未设置 Rebuttal。", source: "https://sigir2026.org/en-AU/pages/submissions/full-papers-track" },
    { date: "2026-04-29", label: "Camera-ready", type: "camera", detail: "所有论文类型的 camera-ready upload。", source: "https://sigir2026.org/en-AU/pages/attending/key-dates" },
  ],
  "VLDB-2027": [
    { date: "2026-08-15", label: "7 月投稿通知", type: "result", detail: "PVLDB 滚动投稿：每月 1 日截止，次月 15 日通知；无统一 Rebuttal 日期。", source: "https://www.vldb.org/2027/important-dates.html" },
    { date: "2026-09-15", label: "8 月投稿通知", type: "result", source: "https://www.vldb.org/2027/important-dates.html" },
    { date: "2026-10-15", label: "9 月投稿通知", type: "result", source: "https://www.vldb.org/2027/important-dates.html" },
    { date: "2026-11-15", label: "10 月投稿通知", type: "result", source: "https://www.vldb.org/2027/important-dates.html" },
    { date: "2026-12-15", label: "11 月投稿通知", type: "result", source: "https://www.vldb.org/2027/important-dates.html" },
    { date: "2027-01-15", label: "12 月投稿通知", type: "result", source: "https://www.vldb.org/2027/important-dates.html" },
    { date: "2027-02-15", label: "1 月投稿通知", type: "result", source: "https://www.vldb.org/2027/important-dates.html" },
    { date: "2027-03-15", label: "2 月投稿通知", type: "result", source: "https://www.vldb.org/2027/important-dates.html" },
    { date: "2027-04-15", label: "3 月投稿通知", type: "result", source: "https://www.vldb.org/2027/important-dates.html" },
  ],
  "SIGKDD-2027": [
    { date: "2026-07-19", label: "一轮摘要截止", type: "abstract", source: "https://kdd2027.kdd.org/research-track-call-for-papers/" },
    { date: "2026-07-26", label: "一轮全文截止", type: "submission", source: "https://kdd2027.kdd.org/research-track-call-for-papers/" },
    { date: "2026-09-29", label: "一轮 Rebuttal 开始", type: "rebuttal", detail: "KDD 2027 Research Track First Cycle 官方日程。", source: "https://kdd2027.kdd.org/research-track-call-for-papers/" },
    { date: "2026-10-13", label: "一轮 Rebuttal 截止", type: "rebuttal", source: "https://kdd2027.kdd.org/research-track-call-for-papers/" },
    { date: "2026-11-14", label: "一轮最终结果", type: "result", source: "https://kdd2027.kdd.org/research-track-call-for-papers/" },
  ],
  "USENIX Security-2027": [
    { date: "2026-10-06", label: "一轮 Early Reject", type: "reject", source: "https://www.usenix.org/conference/usenixsecurity27/call-for-papers" },
    { date: "2026-11-05", label: "一轮 Rebuttal 开始", type: "rebuttal", source: "https://www.usenix.org/conference/usenixsecurity27/call-for-papers" },
    { date: "2026-11-12", label: "一轮 Rebuttal 截止", type: "rebuttal", source: "https://www.usenix.org/conference/usenixsecurity27/call-for-papers" },
    { date: "2026-12-03", label: "一轮最终结果", type: "result", source: "https://www.usenix.org/conference/usenixsecurity27/call-for-papers" },
    { date: "2027-01-14", label: "一轮 Camera-ready", type: "camera", source: "https://www.usenix.org/conference/usenixsecurity27/call-for-papers" },
    { date: "2027-03-09", label: "二轮 Early Reject", type: "reject", source: "https://www.usenix.org/conference/usenixsecurity27/call-for-papers" },
    { date: "2027-04-08", label: "二轮 Rebuttal 开始", type: "rebuttal", source: "https://www.usenix.org/conference/usenixsecurity27/call-for-papers" },
    { date: "2027-04-15", label: "二轮 Rebuttal 截止", type: "rebuttal", source: "https://www.usenix.org/conference/usenixsecurity27/call-for-papers" },
    { date: "2027-05-06", label: "二轮最终结果", type: "result", source: "https://www.usenix.org/conference/usenixsecurity27/call-for-papers" },
    { date: "2027-06-03", label: "二轮 Camera-ready", type: "camera", source: "https://www.usenix.org/conference/usenixsecurity27/call-for-papers" },
  ],
  "CHI-2026": [
    { date: "2025-11-04", label: "Reviews 发布 / R&R 开始", type: "rebuttal", detail: "CHI 2026 Papers 官方日程；符合门槛的论文进入 Revise & Resubmit。", source: "https://chi2026.acm.org/authors/papers/" },
    { date: "2025-12-04", label: "R&R 修订稿截止", type: "rebuttal", detail: "修订论文及 Author Response 截止。", source: "https://chi2026.acm.org/authors/papers/" },
    { date: "2026-01-15", label: "最终录用结果", type: "result", detail: "CHI 2026 Decisions Notification。", source: "https://chi2026.acm.org/authors/papers/" },
  ],
  "ECCV-2026": [
    { date: "2026-05-02", label: "Reviews 发布 / Rebuttal 开始", type: "rebuttal", source: "https://eccv.ecva.net/Conferences/2026/Dates" },
    { date: "2026-05-11", label: "Rebuttal 截止", type: "rebuttal", source: "https://eccv.ecva.net/Conferences/2026/Dates" },
    { date: "2026-06-17", label: "最终录用结果", type: "result", source: "https://eccv.ecva.net/Conferences/2026/Dates" },
    { date: "2026-06-30", label: "Camera-ready", type: "camera", source: "https://eccv.ecva.net/Conferences/2026/Dates" },
  ],
  "SIGKDD-2026": [
    { date: "2026-04-04", label: "二轮 Rebuttal 开始", type: "rebuttal", detail: "KDD 2026 Research Track February Cycle。", source: "https://kdd2026.kdd.org/research-track-call-for-papers/" },
    { date: "2026-04-17", label: "二轮 Rebuttal 截止", type: "rebuttal", source: "https://kdd2026.kdd.org/research-track-call-for-papers/" },
    { date: "2026-05-16", label: "二轮最终结果", type: "result", source: "https://kdd2026.kdd.org/research-track-call-for-papers/" },
    { date: "2026-06-01", label: "二轮 Camera-ready", type: "camera", source: "https://kdd2026.kdd.org/research-track-call-for-papers/" },
  ],
  "ACM MM-2026": [
    { date: "2026-06-04", label: "Rebuttal 截止", type: "rebuttal", detail: "ACM Multimedia 2026 Main Track 官方日期。", source: "https://2026.acmmm.org/site/important-dates.html" },
    { date: "2026-07-09", label: "最终录用结果", type: "result", source: "https://2026.acmmm.org/site/important-dates.html" },
    { date: "2026-08-06", label: "Camera-ready", type: "camera", source: "https://2026.acmmm.org/site/important-dates.html" },
  ],
  "RecSys-2026": [
    { date: "2026-06-04", label: "Rebuttal 开始", type: "rebuttal", detail: "RecSys 2026 Long / Short / PPF Papers。", source: "https://recsys.acm.org/recsys26/call/" },
    { date: "2026-06-09", label: "Rebuttal 截止", type: "rebuttal", source: "https://recsys.acm.org/recsys26/call/" },
    { date: "2026-07-09", label: "最终录用结果", type: "result", source: "https://recsys.acm.org/recsys26/call/" },
    { date: "2026-07-27", label: "Camera-ready", type: "camera", source: "https://recsys.acm.org/recsys26/call/" },
  ],
  "ICMI-2026": [
    { date: "2026-06-08", label: "Rebuttal 开始", type: "rebuttal", source: "https://icmi.acm.org/2026/important-dates/" },
    { date: "2026-06-13", label: "Rebuttal 截止", type: "rebuttal", source: "https://icmi.acm.org/2026/important-dates/" },
    { date: "2026-07-01", label: "最终录用结果", type: "result", source: "https://icmi.acm.org/2026/important-dates/" },
    { date: "2026-07-23", label: "Camera-ready", type: "camera", source: "https://icmi.acm.org/2026/important-dates/" },
  ],
  "ICDAR-2026": [
    { date: "2026-04-17", label: "Reviews 发布", type: "rebuttal", source: "https://icdar2026.org/" },
    { date: "2026-04-24", label: "Rebuttal 截止", type: "rebuttal", source: "https://icdar2026.org/" },
    { date: "2026-05-15", label: "最终录用结果", type: "result", source: "https://icdar2026.org/" },
  ],
  "SIGCOMM-2026": [
    { date: "2026-04-02", label: "Early Reject", type: "reject", source: "https://conferences.sigcomm.org/sigcomm/2026/cfp/" },
    { date: "2026-04-27", label: "Rebuttal 开始", type: "rebuttal", source: "https://conferences.sigcomm.org/sigcomm/2026/cfp/" },
    { date: "2026-04-29", label: "Rebuttal 截止", type: "rebuttal", source: "https://conferences.sigcomm.org/sigcomm/2026/cfp/" },
    { date: "2026-05-11", label: "评审结果通知", type: "result", source: "https://conferences.sigcomm.org/sigcomm/2026/cfp/" },
    { date: "2026-06-19", label: "One-shot Revision 截止", type: "rebuttal", source: "https://conferences.sigcomm.org/sigcomm/2026/cfp/" },
    { date: "2026-06-29", label: "Revision 最终结果", type: "result", source: "https://conferences.sigcomm.org/sigcomm/2026/cfp/" },
    { date: "2026-07-03", label: "Camera-ready", type: "camera", source: "https://conferences.sigcomm.org/sigcomm/2026/cfp/" },
  ],
  "USENIX Security-2026": [
    { date: "2025-10-07", label: "一轮 Early Reject", type: "reject", source: "https://www.usenix.org/conference/usenixsecurity26/call-for-papers" },
    { date: "2025-11-06", label: "一轮 Rebuttal 开始", type: "rebuttal", source: "https://www.usenix.org/conference/usenixsecurity26/call-for-papers" },
    { date: "2025-11-13", label: "一轮 Rebuttal 截止", type: "rebuttal", source: "https://www.usenix.org/conference/usenixsecurity26/call-for-papers" },
    { date: "2025-12-04", label: "一轮最终结果", type: "result", source: "https://www.usenix.org/conference/usenixsecurity26/call-for-papers" },
    { date: "2026-01-15", label: "一轮 Camera-ready", type: "camera", source: "https://www.usenix.org/conference/usenixsecurity26/call-for-papers" },
    { date: "2026-03-17", label: "二轮 Early Reject", type: "reject", source: "https://www.usenix.org/conference/usenixsecurity26/call-for-papers" },
    { date: "2026-04-16", label: "二轮 Rebuttal 开始", type: "rebuttal", source: "https://www.usenix.org/conference/usenixsecurity26/call-for-papers" },
    { date: "2026-04-23", label: "二轮 Rebuttal 截止", type: "rebuttal", source: "https://www.usenix.org/conference/usenixsecurity26/call-for-papers" },
    { date: "2026-05-14", label: "二轮最终结果", type: "result", source: "https://www.usenix.org/conference/usenixsecurity26/call-for-papers" },
    { date: "2026-06-11", label: "二轮 Camera-ready", type: "camera", source: "https://www.usenix.org/conference/usenixsecurity26/call-for-papers" },
  ],
  "NDSS-2026": [
    { date: "2025-05-28", label: "夏季轮 Early Reject / Reviews", type: "reject", source: "https://www.ndss-symposium.org/ndss2026/submissions/call-for-papers/" },
    { date: "2025-06-18", label: "夏季轮 Rebuttal 开始", type: "rebuttal", source: "https://www.ndss-symposium.org/ndss2026/submissions/call-for-papers/" },
    { date: "2025-06-20", label: "夏季轮 Rebuttal 截止", type: "rebuttal", source: "https://www.ndss-symposium.org/ndss2026/submissions/call-for-papers/" },
    { date: "2025-07-02", label: "夏季轮结果", type: "result", source: "https://www.ndss-symposium.org/ndss2026/submissions/call-for-papers/" },
    { date: "2025-09-17", label: "秋季轮 Early Reject / Reviews", type: "reject", source: "https://www.ndss-symposium.org/ndss2026/submissions/call-for-papers/" },
    { date: "2025-10-08", label: "秋季轮 Rebuttal 开始", type: "rebuttal", source: "https://www.ndss-symposium.org/ndss2026/submissions/call-for-papers/" },
    { date: "2025-10-10", label: "秋季轮 Rebuttal 截止", type: "rebuttal", source: "https://www.ndss-symposium.org/ndss2026/submissions/call-for-papers/" },
    { date: "2025-10-22", label: "秋季轮结果", type: "result", source: "https://www.ndss-symposium.org/ndss2026/submissions/call-for-papers/" },
    { date: "2025-12-17", label: "Camera-ready", type: "camera", source: "https://www.ndss-symposium.org/ndss2026/submissions/call-for-papers/" },
  ],
  "PLDI-2026": [
    { date: "2026-02-17", label: "Author Response 开始", type: "rebuttal", source: "https://pldi26.sigplan.org/dates" },
    { date: "2026-02-22", label: "Author Response 截止", type: "rebuttal", source: "https://pldi26.sigplan.org/dates" },
    { date: "2026-03-05", label: "最终录用结果", type: "result", source: "https://pldi26.sigplan.org/dates" },
    { date: "2026-04-16", label: "Camera-ready", type: "camera", source: "https://pldi26.sigplan.org/dates" },
  ],
  "ASPLOS-2026": [
    { date: "2025-06-09", label: "春季轮 Author Response 开始", type: "rebuttal", source: "https://www.asplos-conference.org/asplos2026/cfp/" },
    { date: "2025-06-13", label: "春季轮 Author Response 截止", type: "rebuttal", source: "https://www.asplos-conference.org/asplos2026/cfp/" },
    { date: "2025-06-24", label: "春季轮结果", type: "result", source: "https://www.asplos-conference.org/asplos2026/cfp/" },
    { date: "2025-11-10", label: "夏季轮 Author Response 开始", type: "rebuttal", source: "https://www.asplos-conference.org/asplos2026/cfp/" },
    { date: "2025-11-14", label: "夏季轮 Author Response 截止", type: "rebuttal", source: "https://www.asplos-conference.org/asplos2026/cfp/" },
    { date: "2025-11-24", label: "夏季轮结果", type: "result", source: "https://www.asplos-conference.org/asplos2026/cfp/" },
  ],
  "EuroSys-2026": [
    { date: "2025-07-30", label: "春季轮 Reviews 发布", type: "rebuttal", source: "https://2026.eurosys.org/cfp.html" },
    { date: "2025-08-04", label: "春季轮 Author Response 截止", type: "rebuttal", source: "https://2026.eurosys.org/cfp.html" },
    { date: "2025-08-22", label: "春季轮结果", type: "result", source: "https://2026.eurosys.org/cfp.html" },
    { date: "2025-09-26", label: "春季轮 Camera-ready", type: "camera", source: "https://2026.eurosys.org/cfp.html" },
    { date: "2026-01-07", label: "秋季轮 Reviews 发布", type: "rebuttal", source: "https://2026.eurosys.org/cfp.html" },
    { date: "2026-01-09", label: "秋季轮 Author Response 截止", type: "rebuttal", source: "https://2026.eurosys.org/cfp.html" },
    { date: "2026-01-30", label: "秋季轮结果", type: "result", source: "https://2026.eurosys.org/cfp.html" },
    { date: "2026-03-06", label: "秋季轮 Camera-ready", type: "camera", source: "https://2026.eurosys.org/cfp.html" },
  ],
  "FAST-2026": [
    { date: "2025-05-20", label: "春季轮 Author Response 开始", type: "rebuttal", source: "https://www.usenix.org/conference/fast26/call-for-papers" },
    { date: "2025-05-22", label: "春季轮 Author Response 截止", type: "rebuttal", source: "https://www.usenix.org/conference/fast26/call-for-papers" },
    { date: "2025-06-05", label: "春季轮结果", type: "result", source: "https://www.usenix.org/conference/fast26/call-for-papers" },
    { date: "2025-07-29", label: "春季轮 Camera-ready", type: "camera", source: "https://www.usenix.org/conference/fast26/call-for-papers" },
    { date: "2025-11-18", label: "秋季轮 Author Response 开始", type: "rebuttal", source: "https://www.usenix.org/conference/fast26/call-for-papers" },
    { date: "2025-11-20", label: "秋季轮 Author Response 截止", type: "rebuttal", source: "https://www.usenix.org/conference/fast26/call-for-papers" },
    { date: "2025-12-08", label: "秋季轮结果", type: "result", source: "https://www.usenix.org/conference/fast26/call-for-papers" },
    { date: "2026-01-27", label: "秋季轮 Camera-ready", type: "camera", source: "https://www.usenix.org/conference/fast26/call-for-papers" },
  ],
  "NSDI-2026": [
    { date: "2025-07-24", label: "春季轮最终结果", type: "result", detail: "NSDI 2026 官方 CFP 未列出 Author Response / Rebuttal 日期。", source: "https://www.usenix.org/conference/nsdi26/call-for-papers" },
    { date: "2025-10-27", label: "春季轮 Camera-ready", type: "camera", source: "https://www.usenix.org/conference/nsdi26/call-for-papers" },
    { date: "2025-12-09", label: "秋季轮最终结果", type: "result", detail: "NSDI 2026 官方 CFP 未列出 Author Response / Rebuttal 日期。", source: "https://www.usenix.org/conference/nsdi26/call-for-papers" },
    { date: "2026-03-05", label: "秋季轮 Camera-ready", type: "camera", source: "https://www.usenix.org/conference/nsdi26/call-for-papers" },
  ],
  "MICRO-2026": [
    { date: "2026-06-03", label: "Rebuttal / Revision 开始", type: "rebuttal", source: "https://www.microarch.org/micro59/" },
    { date: "2026-06-17", label: "Rebuttal / Revision 截止", type: "rebuttal", source: "https://www.microarch.org/micro59/" },
    { date: "2026-07-07", label: "最终录用结果", type: "result", source: "https://www.microarch.org/micro59/" },
    { date: "2026-09-11", label: "Camera-ready", type: "camera", source: "https://www.microarch.org/micro59/" },
  ],
  "MobiCom-2026": [
    { date: "2026-05-21", label: "Early Reject", type: "reject", source: "https://www.sigmobile.org/mobicom/2026/" },
    { date: "2026-06-04", label: "Rebuttal 开始", type: "rebuttal", source: "https://www.sigmobile.org/mobicom/2026/" },
    { date: "2026-06-09", label: "Rebuttal 截止", type: "rebuttal", source: "https://www.sigmobile.org/mobicom/2026/" },
    { date: "2026-06-29", label: "最终录用结果", type: "result", source: "https://www.sigmobile.org/mobicom/2026/" },
  ],
  "HPCA-2026": [
    { date: "2025-10-07", label: "Revision / Rebuttal 开始", type: "rebuttal", source: "https://2026.hpca-conf.org/track/hpca-2026-main-conference" },
    { date: "2025-10-20", label: "Revision / Rebuttal 截止", type: "rebuttal", source: "https://2026.hpca-conf.org/track/hpca-2026-main-conference" },
    { date: "2025-11-07", label: "最终录用结果", type: "result", source: "https://2026.hpca-conf.org/track/hpca-2026-main-conference" },
  ],
  "ISCA-2026": [
    { date: "2026-01-08", label: "一轮 Reviews 完成", type: "result", source: "https://iscaconf.org/isca2026/submit/callforpapers.php" },
    { date: "2026-02-13", label: "二轮 Reviews 完成", type: "result", source: "https://iscaconf.org/isca2026/submit/callforpapers.php" },
    { date: "2026-02-16", label: "Rebuttal / Revision 开始", type: "rebuttal", source: "https://iscaconf.org/isca2026/submit/callforpapers.php" },
    { date: "2026-03-06", label: "Rebuttal / Revision 截止", type: "rebuttal", source: "https://iscaconf.org/isca2026/submit/callforpapers.php" },
    { date: "2026-03-27", label: "最终录用结果", type: "result", source: "https://iscaconf.org/isca2026/submit/callforpapers.php" },
  ],
  "S&P-2026": [
    { date: "2026-01-19", label: "二轮 Early Reject", type: "reject", source: "https://www.ieee-security.org/Calendar/cfps/cfp-SnP2026.html" },
    { date: "2026-02-12", label: "二轮交互 Rebuttal 开始", type: "rebuttal", source: "https://www.ieee-security.org/Calendar/cfps/cfp-SnP2026.html" },
    { date: "2026-02-17", label: "二轮 Rebuttal 文本截止", type: "rebuttal", source: "https://www.ieee-security.org/Calendar/cfps/cfp-SnP2026.html" },
    { date: "2026-02-23", label: "二轮交互 Rebuttal 结束", type: "rebuttal", source: "https://www.ieee-security.org/Calendar/cfps/cfp-SnP2026.html" },
    { date: "2026-03-09", label: "二轮最终结果", type: "result", source: "https://www.ieee-security.org/Calendar/cfps/cfp-SnP2026.html" },
    { date: "2026-04-17", label: "二轮 Camera-ready", type: "camera", source: "https://www.ieee-security.org/Calendar/cfps/cfp-SnP2026.html" },
  ],
  "FSE-2026": [
    { date: "2025-11-21", label: "Author Response 开始", type: "rebuttal", source: "https://conf.researchr.org/track/fse-2026/fse-2026-research-papers" },
    { date: "2025-11-25", label: "Author Response 截止", type: "rebuttal", source: "https://conf.researchr.org/track/fse-2026/fse-2026-research-papers" },
    { date: "2025-12-22", label: "初步结果", type: "result", source: "https://conf.researchr.org/track/fse-2026/fse-2026-research-papers" },
    { date: "2026-02-24", label: "Major Revision 截止", type: "rebuttal", source: "https://conf.researchr.org/track/fse-2026/fse-2026-research-papers" },
    { date: "2026-03-24", label: "Major Revision 最终结果", type: "result", source: "https://conf.researchr.org/track/fse-2026/fse-2026-research-papers" },
    { date: "2026-04-23", label: "Camera-ready", type: "camera", source: "https://conf.researchr.org/track/fse-2026/fse-2026-research-papers" },
  ],
  "CVPR-2026": [
    { date: "2026-01-22", label: "Reviews 发布 / Rebuttal 开始", type: "rebuttal", detail: "CVPR 2026 官方日程：Reviews released，作者回复期开始。", source: "https://cvpr.thecvf.com/Conferences/2026/Dates" },
    { date: "2026-01-29", label: "Rebuttal 截止", type: "rebuttal", detail: "CVPR 2026 官方 Author Responses Due。", source: "https://cvpr.thecvf.com/Conferences/2026/Dates" },
    { date: "2026-02-20", label: "最终录用结果", type: "result", detail: "CVPR 2026 官方 Paper Decisions Released。", source: "https://cvpr.thecvf.com/Conferences/2026/Dates" },
  ],
  "VLDB-2026": [
    { date: "2026-01-15", label: "12 月投稿结果", type: "result", detail: "PVLDB Research Track 通常在投稿截止后的次月 15 日给出 Accept / Reject / Revision。", source: "https://www.vldb.org/2026/important-dates.html" },
    { date: "2026-02-15", label: "1 月投稿结果", type: "result", detail: "对应 2026 年 1 月 1 日滚动投稿批次。", source: "https://www.vldb.org/2026/important-dates.html" },
    { date: "2026-03-15", label: "2 月投稿结果", type: "result", detail: "对应 2026 年 2 月 1 日滚动投稿批次。", source: "https://www.vldb.org/2026/important-dates.html" },
    { date: "2026-04-15", label: "3 月投稿结果", type: "result", detail: "对应 VLDB 2026 最后一个常规滚动投稿批次。Revision 论文另按实际 revision 月次月 15 日出最终结果。", source: "https://www.vldb.org/2026/important-dates.html" },
  ],
  "ACL-2026": [
    { date: "2026-03-10", label: "ARR 评审与 Meta-review 发布", type: "result", detail: "1 月 ARR 周期的 reviews 与 meta-reviews 对作者开放。", source: "https://2026.aclweb.org/" },
    { date: "2026-03-14", label: "Commit ACL 2026", type: "commit", detail: "持有有效 ARR reviews 与 meta-review 的论文可 commit 至 ACL 2026。", source: "https://2026.aclweb.org/" },
    { date: "2026-04-04", label: "ACL 最终录用结果", type: "result", detail: "ACL 2026 主会录用通知。未入选主会的论文也会自动考虑 Findings。", source: "https://2026.aclweb.org/" },
    { date: "2026-04-19", label: "Camera-ready", type: "camera", detail: "最终稿与撤稿截止日期。", source: "https://2026.aclweb.org/" },
  ],
  "CCS-2026": [
    { date: "2026-02-20", label: "一轮 Early Reject", type: "reject", detail: "第一轮早期拒稿通知。", source: "https://www.sigsac.org/ccs/CCS2026/call-for/call-for-papers.html" },
    { date: "2026-03-17", label: "一轮 Rebuttal 开始", type: "rebuttal", detail: "第一轮作者答辩期：3 月 17–20 日。", source: "https://www.sigsac.org/ccs/CCS2026/call-for/call-for-papers.html" },
    { date: "2026-03-20", label: "一轮 Rebuttal 截止", type: "rebuttal", detail: "第一轮作者答辩截止。", source: "https://www.sigsac.org/ccs/CCS2026/call-for/call-for-papers.html" },
    { date: "2026-04-09", label: "一轮最终结果", type: "result", detail: "第一轮 Accept / Minor revision / Reject 通知。", source: "https://www.sigsac.org/ccs/CCS2026/call-for/call-for-papers.html" },
    { date: "2026-06-12", label: "二轮 Early Reject", type: "reject", detail: "第二轮早期拒稿通知；官方日期经更新后为 6 月 12 日。", source: "https://www.sigsac.org/ccs/CCS2026/call-for/call-for-papers.html" },
    { date: "2026-06-29", label: "二轮 Rebuttal 开始", type: "rebuttal", detail: "第二轮作者答辩期：6 月 29 日至 7 月 1 日。", source: "https://www.sigsac.org/ccs/CCS2026/call-for/call-for-papers.html" },
    { date: "2026-07-01", label: "二轮 Rebuttal 截止", type: "rebuttal", detail: "第二轮作者答辩截止。", source: "https://www.sigsac.org/ccs/CCS2026/call-for/call-for-papers.html" },
    { date: "2026-07-17", label: "二轮最终结果", type: "result", detail: "第二轮 Accept / Minor revision / Reject 通知。", source: "https://www.sigsac.org/ccs/CCS2026/call-for/call-for-papers.html" },
    { date: "2026-09-13", label: "Camera-ready", type: "camera", detail: "CCS 2026 官方终稿截止。", source: "https://www.sigsac.org/ccs/CCS2026/call-for/call-for-papers.html" },
  ],
  "ACM SIGGRAPH-2026": [
    { date: "2026-03-05", label: "Reviews 发布 / Rebuttal 开始", type: "rebuttal", detail: "Technical Papers reviews 对作者开放，作者答辩开始。", source: "https://s2026.siggraph.org/program/technical-papers/" },
    { date: "2026-03-12", label: "Rebuttal 截止", type: "rebuttal", source: "https://s2026.siggraph.org/program/technical-papers/" },
    { date: "2026-03-30", label: "论文决定公布", type: "result", detail: "Technical Papers conditional acceptance / rejection 决定。", source: "https://s2026.siggraph.org/program/technical-papers/" },
    { date: "2026-04-29", label: "修订稿提交", type: "camera", detail: "条件录用论文提交修订版本供最终检查。", source: "https://s2026.siggraph.org/program/technical-papers/" },
    { date: "2026-05-06", label: "最终版本截止", type: "camera", source: "https://s2026.siggraph.org/program/technical-papers/" },
  ],
  "LICS-2026": [
    { date: "2026-03-26", label: "Author Response 开始", type: "rebuttal", detail: "LICS 2026 Author Response：3 月 26–29 日。", source: "https://lics.siglog.org/lics26/" },
    { date: "2026-03-29", label: "Author Response 截止", type: "rebuttal", source: "https://lics.siglog.org/lics26/" },
    { date: "2026-04-16", label: "最终录用结果", type: "result", detail: "LICS 2026 Author Notification。", source: "https://lics.siglog.org/lics26/" },
  ],
  "ICLR-2026": [
    { date: "2025-11-11", label: "Reviews 发布", type: "rebuttal", detail: "Reviews 发布后进入公开讨论与作者回复阶段。", source: "https://iclr.cc/Conferences/2026/Dates" },
    { date: "2025-12-03", label: "作者讨论阶段结束", type: "rebuttal", detail: "Author / Reviewer / AC discussion ends。", source: "https://iclr.cc/Conferences/2026/Dates" },
    { date: "2026-01-25", label: "最终录用结果", type: "result", detail: "ICLR 2026 Paper Decision Notification。", source: "https://iclr.cc/Conferences/2026/Dates" },
  ],
  "AAAI-2026": [
    { date: "2025-09-08", label: "Phase 1 拒稿结果", type: "reject", detail: "AAAI-26 Main Technical Track 第一阶段拒稿通知。", source: "https://aaai.org/conference/aaai/aaai-26/review-process/" },
    { date: "2025-10-02", label: "Author Feedback / Rebuttal 开始", type: "rebuttal", detail: "AAAI 官方称 Author Feedback，作用即作者对 Phase 1/2 reviews 的统一回复。", source: "https://aaai.org/conference/aaai/aaai-26/review-process/" },
    { date: "2025-10-08", label: "Author Feedback / Rebuttal 截止", type: "rebuttal", source: "https://aaai.org/conference/aaai/aaai-26/review-process/" },
    { date: "2025-11-03", label: "最终录用结果", type: "result", detail: "Main Technical Track final acceptance or rejection。", source: "https://aaai.org/conference/aaai/aaai-26/review-process/" },
    { date: "2025-11-13", label: "Camera-ready", type: "camera", source: "https://aaai.org/conference/aaai/aaai-26/review-process/" },
  ],
  "WWW-2026": [
    { date: "2025-11-24", label: "Rebuttal 开始", type: "rebuttal", detail: "Research & Industry Tracks rebuttal：11 月 24 日至 12 月 1 日。", source: "https://www2026.thewebconf.org/important-dates.html" },
    { date: "2025-12-01", label: "Rebuttal 截止", type: "rebuttal", source: "https://www2026.thewebconf.org/important-dates.html" },
    { date: "2026-01-13", label: "最终录用结果", type: "result", detail: "Research、Industry 和 Short Papers notification。", source: "https://www2026.thewebconf.org/important-dates.html" },
    { date: "2026-01-25", label: "Camera-ready", type: "camera", source: "https://www2026.thewebconf.org/important-dates.html" },
  ],
  "WWW-2027": [
    { date: "2026-11-09", label: "Short Papers 摘要截止", type: "abstract", source: "https://www2027.thewebconf.org/important-dates/" },
    { date: "2026-11-16", label: "Short Papers 投稿截止", type: "submission", source: "https://www2027.thewebconf.org/important-dates/" },
    { date: "2026-12-15", label: "Phase 1 结果（Result Release）", type: "result", detail: "Research Track 长文第一阶段结果发布。", source: "https://www2027.thewebconf.org/important-dates/" },
    { date: "2026-12-15", label: "Rebuttal 开始", type: "rebuttal", detail: "Research Track Rebuttal Period：12 月 15 日至 20 日。", source: "https://www2027.thewebconf.org/important-dates/" },
    { date: "2026-12-20", label: "Rebuttal 截止", type: "rebuttal", source: "https://www2027.thewebconf.org/important-dates/" },
    { date: "2027-01-04", label: "最终录用结果", type: "result", detail: "Research / Short / Demo Papers Notification。", source: "https://www2027.thewebconf.org/important-dates/" },
    { date: "2027-01-31", label: "Camera-ready", type: "camera", detail: "Final Version Deadline。", source: "https://www2027.thewebconf.org/important-dates/" },
  ],
  "ICML-2026": [
    { date: "2026-03-24", label: "Reviews / Rebuttal 开始", type: "rebuttal", detail: "Reviewer–Author discussion period starts。", source: "https://icml.cc/Conferences/2026/ReviewerInstructions" },
    { date: "2026-03-30", label: "首轮 Rebuttal 截止", type: "rebuttal", detail: "作者对正式评审的回复截止。", source: "https://icml.cc/Conferences/2026/PeerReviewFAQ" },
    { date: "2026-04-07", label: "作者讨论结束", type: "rebuttal", detail: "补充问题回复及 Author–Reviewer discussion 截止。", source: "https://icml.cc/Conferences/2026/PeerReviewFAQ" },
    { date: "2026-04-30", label: "最终录用结果", type: "result", detail: "ICML 2026 Author Notification。", source: "https://icml.cc/Conferences/2026/ReviewerInstructions" },
  ],
  "NeurIPS-2026": [
    { date: "2026-07-22", label: "Reviews 发布 / Rebuttal", type: "rebuttal", detail: "Reviews released；作者初始回复阶段开始。", source: "https://neurips.cc/Conferences/2026/Dates" },
    { date: "2026-07-27", label: "作者评审讨论开始", type: "rebuttal", detail: "Author + Reviewer + AC discussion starts。", source: "https://neurips.cc/Conferences/2026/Dates" },
    { date: "2026-08-03", label: "作者讨论结束", type: "rebuttal", detail: "随后进入 Reviewer + AC discussion。", source: "https://neurips.cc/Conferences/2026/Dates" },
    { date: "2026-09-24", label: "最终录用结果", type: "result", detail: "NeurIPS 2026 Paper Author Notifications。", source: "https://neurips.cc/Conferences/2026/Dates" },
  ],
};

const arrSource = "https://aclrollingreview.org/dates";
export const arrCycles: SupplementalConference[] = [
  {
    id: "arr-mar-2026", title: "ARR MAR", description: "ACL Rolling Review · March 2026 cycle", category: "ARR", rank: "N", year: 2026,
    link: arrSource, timezone: "AoE", conferenceDate: "Cycle ends May 24, 2026", conferenceStart: "", place: "OpenReview · Online", timeline: [], isARR: true,
    commitVenues: ["可在取得 meta-review 后选择后续开放的 ARR venue"],
    supplementalEvents: [
      { date: "2026-03-16", label: "ARR 投稿", type: "submission", source: arrSource },
      { date: "2026-04-20", label: "Reviews 截止", type: "result", source: arrSource },
      { date: "2026-04-28", label: "Author Response 开始", type: "rebuttal", detail: "Author response：4 月 28 日至 5 月 4 日。", source: arrSource },
      { date: "2026-05-04", label: "Author Response 截止", type: "rebuttal", source: arrSource },
      { date: "2026-05-21", label: "Meta-review 发布", type: "result", source: arrSource },
    ],
  },
  {
    id: "arr-may-2026", title: "ARR MAY", description: "ACL Rolling Review · May 2026 cycle", category: "ARR", rank: "N", year: 2026,
    link: arrSource, timezone: "AoE", conferenceDate: "Cycle ends August 2, 2026", conferenceStart: "", place: "OpenReview · Online", timeline: [], isARR: true,
    commitVenues: ["EMNLP 2026 · Commit 08/02", "AACL-IJCNLP 2026 · Commit 08/02"],
    supplementalEvents: [
      { date: "2026-05-25", label: "ARR 投稿", type: "submission", source: arrSource },
      { date: "2026-07-02", label: "Reviews 截止", type: "result", source: arrSource },
      { date: "2026-07-08", label: "Author Response 开始", type: "rebuttal", detail: "Author response：7 月 8–14 日。", source: arrSource },
      { date: "2026-07-14", label: "Author Response 截止", type: "rebuttal", source: arrSource },
      { date: "2026-07-30", label: "Meta-review 发布", type: "result", source: arrSource },
      { date: "2026-08-02", label: "Commit EMNLP / AACL", type: "commit", detail: "EMNLP 2026 与 AACL-IJCNLP 2026 commitment deadline。", source: arrSource },
    ],
  },
  {
    id: "arr-aug-2026", title: "ARR AUG", description: "ACL Rolling Review · August 2026 cycle", category: "ARR", rank: "N", year: 2026,
    link: arrSource, timezone: "AoE", conferenceDate: "Cycle ends October 11, 2026", conferenceStart: "", place: "OpenReview · Online", timeline: [], isARR: true,
    commitVenues: ["EACL 2027 · Commit 10/11"],
    supplementalEvents: [
      { date: "2026-08-03", label: "ARR 投稿", type: "submission", source: arrSource },
      { date: "2026-09-07", label: "Reviews 截止", type: "result", source: arrSource },
      { date: "2026-09-14", label: "Author Response 开始", type: "rebuttal", detail: "Author response：9 月 14–24 日。", source: arrSource },
      { date: "2026-09-24", label: "Author Response 截止", type: "rebuttal", source: arrSource },
      { date: "2026-10-08", label: "Meta-review 发布", type: "result", source: arrSource },
      { date: "2026-10-11", label: "Commit EACL 2027", type: "commit", source: arrSource },
    ],
  },
  {
    id: "arr-oct-2026", title: "ARR OCT", description: "ACL Rolling Review · October 2026 cycle", category: "ARR", rank: "N", year: 2026,
    link: arrSource, timezone: "AoE", conferenceDate: "Cycle ends December 20, 2026", conferenceStart: "", place: "OpenReview · Online", timeline: [], isARR: true,
    commitVenues: ["官方尚未公布对应 venue"],
    supplementalEvents: [
      { date: "2026-10-12", label: "ARR 投稿", type: "submission", source: arrSource },
      { date: "2026-12-20", label: "周期结束", type: "result", detail: "其余阶段官方当前标为 TBA。", source: arrSource },
    ],
  },
];

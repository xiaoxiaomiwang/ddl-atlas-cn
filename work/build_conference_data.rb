require "yaml"
require "json"
require "date"

ROOT = File.expand_path("ccf-deadlines/conference", __dir__)
RATES_ROOT = File.expand_path("ccf-deadlines/accept_rates", __dir__)
OUT = File.expand_path("../app/conferences.json", __dir__)
META_OUT = File.expand_path("../app/data-meta.json", __dir__)

# 年份窗口随时间滚动：当前年起的 4 个年份，无需每年手动调整
MIN_YEAR = Date.today.year
MAX_YEAR = MIN_YEAR + 3

records = []

# 全量收集（不按年份窗口过滤）：每个会议系列的历届年份 + 最新一届原始数据，
# 用于按"最近一届平移"生成上游尚未公布的预测届
all_years = Hash.new { |h, k| h[k] = [] }
# 平移源：取"有有效投稿时间的最大届"（上游有时已收录下一届但 deadline 还是 TBD，不能作为平移源）
latest = {}

def conference_start_date(label, year)
  text = label.to_s.tr("–—", "--")
  if (match = text.match(/\A\s*([A-Za-z]+)\s+(\d{1,2})/))
    Date.parse("#{match[1]} #{match[2]} #{year}").iso8601
  elsif (match = text.match(/\A\s*(\d{1,2})\s+([A-Za-z]+)/))
    Date.parse("#{match[2]} #{match[1]} #{year}").iso8601
  else
    ""
  end
rescue Date::Error
  ""
end

# 读取上游 ccf-deadlines 仓库的最近提交信息，写入数据元信息供前端展示真实数据新鲜度
def upstream_info
  repo = File.expand_path("ccf-deadlines", __dir__)
  return { sha: nil, time: nil } unless File.directory?(repo)
  sha = `git -C "#{repo}" rev-parse HEAD`.to_s.strip
  time = `git -C "#{repo}" log -1 --format=%cI`.to_s.strip
  { sha: sha.empty? ? nil : sha, time: time.empty? ? nil : time }
rescue StandardError
  { sha: nil, time: nil }
end

# 解析上游录用率数据：title → 近 4 届录用率（year 降序）
accept_rates_by_title = {}
if File.directory?(RATES_ROOT)
  Dir.glob(File.join(RATES_ROOT, "**", "*.yml")).sort.each do |path|
    begin
      entries = YAML.safe_load(File.read(path), permitted_classes: [Date, Time], aliases: true) || []
    rescue StandardError => error
      warn "Skipping rate #{path}: #{error.message}"
      next
    end
    Array(entries).each do |entry|
      next unless entry.is_a?(Hash)
      title = entry["title"].to_s
      rates = Array(entry["accept_rates"]).map do |r|
        next unless r.is_a?(Hash) && r["year"] && r["rate"]
        { year: r["year"].to_i, rate: (r["rate"].to_f * 100).round(1), submitted: r["submitted"].to_i, accepted: r["accepted"].to_i }
      end.compact.sort_by { |r| -r[:year] }.first(4)
      accept_rates_by_title[title] = rates unless rates.empty?
    end
  end
end

Dir.glob(File.join(ROOT, "**", "*.yml")).sort.each do |path|
  begin
    entries = YAML.safe_load(File.read(path), permitted_classes: [Date, Time], aliases: true) || []
  rescue StandardError => error
    warn "Skipping #{path}: #{error.message}"
    next
  end
  Array(entries).each do |entry|
    next unless entry.is_a?(Hash)
    Array(entry["confs"]).each do |conf|
      year = conf["year"].to_i
      title = entry["title"].to_s
      all_years[title] << year
      has_timeline = Array(conf["timeline"]).any? { |item| item.is_a?(Hash) && !item["deadline"].to_s.empty? && item["deadline"].to_s.upcase != "TBD" }
      if has_timeline
        current = latest[title]
        if current.nil? || year > current[:year]
          latest[title] = { year: year, conf: conf, entry: entry }
        end
      end
      next unless year >= MIN_YEAR && year <= MAX_YEAR
      timeline = Array(conf["timeline"]).map do |item|
        next unless item.is_a?(Hash)
        deadline = item["deadline"].to_s
        next if deadline.empty? || deadline.upcase == "TBD"
        {
          date: deadline[0, 10],
          abstractDate: item["abstract_deadline"].to_s[0, 10],
          comment: item["comment"].to_s
        }
      end.compact
      records << {
        id: conf["id"].to_s,
        title: entry["title"].to_s,
        description: entry["description"].to_s,
        category: entry["sub"].to_s,
        rank: entry.dig("rank", "ccf").to_s.upcase,
        year: year,
        link: conf["link"].to_s,
        timezone: conf["timezone"].to_s,
        conferenceDate: conf["date"].to_s,
        conferenceStart: conference_start_date(conf["date"], year),
        place: conf["place"].to_s,
        timeline: timeline,
        acceptRates: accept_rates_by_title[entry["title"].to_s] || []
      }
    end
  end
end

# ---- 预测届：上游 CCFDDL 只公布到某一届（多为 2026/2027）时，按"最近一届平移"生成后续届次 ----
# 每年的会议时间大致相同（如 SIGMOD 每年 1 月/4 月两轮投稿），平移即可给出可信的规划估计；
# 一旦上游收录了真实届次（all_years 含该年），预测届即不再生成 → 自动替换为准确时间。
# 两年一届的会议（ICCV/ECCV 等）按 +2 平移，避免生成不存在的届次。
projected_records = []
shift_months = lambda do |value, months|
  text = value.to_s
  return "" if text.empty? || text.upcase == "TBD"
  begin
    (Date.parse(text[0, 10]) >> months).iso8601
  rescue StandardError
    ""
  end
end
today_iso = Date.today.iso8601
latest.keys.sort.each do |title|
  info = latest[title]
  from_year = info[:year]
  next if from_year < MIN_YEAR - 3 # 最新届距今超过 3 年，视为停办/失联系列，不预测
  years = all_years[title].uniq.sort
  diffs = years.each_cons(2).map { |a, b| b - a }
  step = diffs.count(2) > diffs.count(1) ? 2 : 1
  entry = info[:entry]
  conf = info[:conf]
  base_id = conf["id"].to_s.empty? ? "#{title.downcase}-#{from_year}" : conf["id"].to_s
  (1..2).each do |k|
    target_year = from_year + step * k
    break if target_year > MAX_YEAR
    next if all_years[title].include?(target_year) # 上游已公布 → 保留真实数据
    months = 12 * step * k
    timeline = Array(conf["timeline"]).map do |item|
      next unless item.is_a?(Hash)
      deadline = item["deadline"].to_s
      next if deadline.empty? || deadline.upcase == "TBD"
      { date: shift_months.call(deadline, months), abstractDate: shift_months.call(item["abstract_deadline"].to_s, months), comment: item["comment"].to_s }
    end.compact
    next if timeline.empty? || timeline.all? { |t| t[:date].to_s.empty? || t[:date] < today_iso } # 平移后全部已过期 → 无规划价值
    projected_records << {
      id: "#{base_id}-#{target_year}p",
      title: title,
      description: entry["description"].to_s,
      category: entry["sub"].to_s,
      rank: entry.dig("rank", "ccf").to_s.upcase,
      year: target_year,
      link: conf["link"].to_s,
      timezone: conf["timezone"].to_s,
      conferenceDate: conf["date"].to_s.empty? ? "" : conf["date"].to_s.gsub(/\b(19|20)\d{2}\b/, target_year.to_s),
      conferenceStart: shift_months.call(conference_start_date(conf["date"], from_year), months),
      place: conf["place"].to_s,
      timeline: timeline,
      acceptRates: accept_rates_by_title[title] || [],
      projected: true,
      projectedFrom: from_year
    }
  end
end
records.concat(projected_records)
puts "Projected #{projected_records.length} future editions (from #{latest.keys.length} series)"

File.write(OUT, JSON.pretty_generate(records.sort_by { |r| [r[:year], r[:title]] }))
puts "Wrote #{records.length} conference editions to #{OUT} (incl. #{projected_records.length} projected)"

info = upstream_info
meta = {
  upstreamSha: info[:sha],
  upstreamTime: info[:time],
  generatedAt: Time.now.utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
  recordCount: records.length,
  projectedCount: projected_records.length
}
File.write(META_OUT, JSON.pretty_generate(meta))
puts "Wrote data meta to #{META_OUT} (upstream #{info[:sha] || 'unknown'})"

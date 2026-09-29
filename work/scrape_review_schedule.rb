#!/usr/bin/env ruby
# 自动抓取 CCF A 类会议官网的评审日程（rebuttal / 录用通知 / camera-ready 等）。
# 触发：由 CI 在 CCFDDL 上游数据更新时调用；也可本地手动运行。
# 输出：app/auto-supplements.json —— 与人工核验的 supplemental.ts 区分，
#       前端会标注"自动抓取 · 未经人工核验"。
require "json"
require "date"
require "net/http"
require "uri"
require "thread"

OUT = File.expand_path("../app/auto-supplements.json", __dir__)
CONCURRENCY = 8
FETCH_TIMEOUT = 12
MAX_PAGES_PER_CONF = 4

MONTHS = %w[january february march april may june july august september october november december]
MONTH_SHORT = MONTHS.map { |m| m[0, 3] }
DATE_RE = /(?:\d{4}-\d{2}-\d{2})|(?:#{(MONTHS + MONTH_SHORT).join('|')})\.?\s+\d{1,2}(?:\s*[-–]\s*\d{1,2})?,?\s+\d{4}|\d{1,2}\s+(?:#{(MONTHS + MONTH_SHORT).join('|')})\.?\s+\d{4}/i
RANGE_RE = /(\d{1,2})\s*[-–]\s*\d{1,2}\s+((?:#{(MONTHS + MONTH_SHORT).join('|')})\.?)\s+(\d{4})/i

# ---- HTTP（跟随重定向、限超时）----
def fetch(url_str, depth = 0)
  return nil if depth > 3
  uri = URI.parse(url_str)
  return nil unless uri.is_a?(URI::HTTP) || uri.is_a?(URI::HTTPS)
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = uri.scheme == "https"
  http.open_timeout = FETCH_TIMEOUT
  http.read_timeout = FETCH_TIMEOUT
  response = http.get(uri.request_uri, { "User-Agent" => "Mozilla/5.0 (compatible; ddl-atlas-bot/1.0; conference deadline aggregator)", "Accept" => "text/html" })
  case response.code.to_i
  when 200 then [response.body.to_s.force_encoding(Encoding::UTF_8).scrub, uri.to_s]
  when 301, 302, 303, 307, 308 then fetch(response["location"] ? URI.join(uri, response["location"]).to_s : nil, depth + 1)
  else nil
  end
rescue StandardError
  nil
end

# ---- HTML → 文本行 ----
def html_lines(html)
  cleaned = html.gsub(/<!--.*?-->/m, " ").gsub(/<(script|style|noscript)[^>]*>.*?<\/\1>/im, " ")
  text = cleaned.gsub(/<[^>]+>/, "\n")
  text.gsub(/&nbsp;|&#160;/i, " ").gsub(/&amp;/, "&").gsub(/&[a-z]+;/i, " ")
      .split("\n").map { |l| l.gsub(/\s+/, " ").strip }.reject(&:empty?)
end

# 把连续文本行合并，直到出现含日期的行（事件名常在日期前的独立标签里）。
# 同时兼容"日期在前、事件名在后"的紧凑列表：纯日期行回填到新缓冲头部，与下一个事件名配对。
def date_rows(lines)
  rows = []
  buffer = []
  lines.each do |line|
    if line =~ DATE_RE
      merged = (buffer + [line]).join(" ").strip
      rows << merged unless merged.empty?
      buffer = []
      # 若本行去掉日期后没有任何文字（纯日期行），回填到新缓冲开头
      if merged.gsub(DATE_RE, "").gsub(/[^A-Za-z\u4e00-\u9fff]/, "").strip.empty?
        buffer = [line]
      end
    else
      # 回填状态（缓冲仅有日期行）时，紧随的事件名行与其立即配对，避免与下一个日期串行
      if buffer.size == 1 && buffer[0] =~ DATE_RE
        rows << "#{buffer[0]} #{line}".strip
        buffer = []
      else
        buffer << line
      end
    end
  end
  rows
end

# ---- 日期归一化：返回 YYYY-MM-DD；支持区间（取开始日）----
def month_index(word)
  w = word.downcase.sub(/\.$/, "")
  MONTHS.index(w) || MONTHS.index { |m| m.start_with?(w[0, 3]) }
end

def parse_date(text)
  # 日期在前的区间：15-20 December 2026
  if (m = text.match(RANGE_RE))
    month = month_index(m[2])
    return nil unless month
    return format("%04d-%02d-%02d", m[3].to_i, month + 1, m[1].to_i)
  end
  # 月份在前的区间：September 23-25, 2026（取开始日）
  if (m = text.match(/((?:#{(MONTHS + MONTH_SHORT).join('|')})\.?)\s+(\d{1,2})\s*[-–]\s*\d{1,2},?\s+(\d{4})/i))
    month = month_index(m[1])
    return nil unless month
    return format("%04d-%02d-%02d", m[3].to_i, month + 1, m[2].to_i)
  end
  candidate = text.match(DATE_RE)&.[](0)
  return nil unless candidate
  Date.parse(candidate).iso8601
rescue StandardError
  nil
end

# ---- 事件分类（关键词，大小写不敏感；忽略子 track / 非评审类行）----
def classify(text)
  t = text.downcase
  return nil if t =~ /workshop|tutorial|demo|doctoral|phd\s|proposal|nomination|test of time|sponsor|registration|visa|travel|grant|ticket|townhall|town hall|career|panel|volunteer|hotel|ai ?camp/
  if t =~ /camera[- ]?ready|final version|final paper|camera-ready/ then "camera"
  elsif t =~ /rebuttal|author feedback|author response|discussion period|review discussion|reviews? released|reviews? release|author rebuttal|revision due|major revision/ then "rebuttal"
  elsif t =~ /notification|decision|result release|acceptance|phase \d (?:result|decision)|preliminary result|final result|meta-?review/ then "result"
  elsif t =~ /abstract/ then "abstract"
  elsif t =~ /submission deadline|paper submission|full paper|submit|paper due/ then "submission"
  end
end

def clean_label(row)
  # 去掉日期部分，留下事件名
  label = row.gsub(DATE_RE, " ").gsub(/\d{1,2}\s*[-–]\s*\d{1,2}/, " ")
  label = label.gsub(/\s+/, " ").strip.gsub(/[:•·|]\s*$/, "").gsub(/\A[:•·|\s]+/, "")
  label = row[0, 38] + "…" if label.empty?
  label[0, 42]
end

# ---- 站内候选页面定位（按含日期概率排序，优先 important-dates / CFP / 主 track）----
def candidate_pages(home_html, base_url)
  base = URI.parse(base_url)
  slug = base.path.split("/").reject { |s| s =~ /home|index|^$/ }.last.to_s.downcase
  links = home_html.scan(/href="([^"#]+)"/i).flatten
  uris = links.map { |l| (URI.join(base, l) rescue nil) }.compact
  scored = uris.map do |u|
    next nil if u.path.nil? || u.path.empty?  # mailto:/tel: 等非页面链接的 path 为 nil
    path = u.path.downcase
    next nil if path =~ /committee|schedule|registration|venue|sponsor|visa/
    bucket =
      if path =~ /important[-_]?date/ || path =~ /call[-_]?for[-_]?papers|\/cfp/ || path =~ %r{/(dates?|deadlines?)$} then 0
      elsif path =~ /research[-_]?track|main[-_]?track|papers?$/ then 1
      elsif path =~ /track|call|cfp|date|deadline|author|review|program|important/ then 2
      end
    next nil unless bucket
    bucket -= 1 if !slug.empty? && path.include?(slug)  # 本会议自身的链接优先一档（排除 co-located 会议干扰）
    [bucket, u]
  end.compact
  scored.sort_by { |bucket, _| bucket }.map { |_, u| u.to_s }.uniq.first(3)
rescue StandardError => e
  warn "candidate_pages error: #{e.class}: #{e.message}" if DEBUG_KEY
  []
end

# 从日期行提取评审事件（分类 + 日期解析 + 合理性过滤）
def extract_events(rows, entry)
  deadline = entry["deadline"] || ""
  conf_start = entry["conferenceStart"] || ""
  events = []
  rows.each do |row|
    next if row =~ /\bTBD\b/i  # 官网未定的日期不生成节点
    next if row.scan(DATE_RE).length >= 2  # 一行含多个日期说明是合并串行，不可靠
    type = classify(row)
    next unless type
    date = parse_date(row)
    next unless date
    year = date[0, 4].to_i
    # 合理性窗口：不早于投稿截止前 120 天，不晚于会议开始后 90 天，年份限定在当前届次前后
    next if deadline != "" && date < (Date.parse(deadline) - 120).iso8601 rescue true
    next if conf_start != "" && date > (Date.parse(conf_start) + 90).iso8601 rescue true
    next unless (entry["year"] - 1..entry["year"] + 1).cover?(year)
    # 评审链节点（rebuttal/result/camera）必须严格晚于投稿截止，早于或等于视为解析错位
    next if %w[rebuttal result camera].include?(type) && deadline != "" && date <= deadline rescue false
    events << { "date" => date, "label" => clean_label(row), "type" => type }
  end
  events.uniq! { |e| [e["date"], e["type"]] }
  # 只有包含评审链节点（rebuttal/result/camera）才算真正找到日程，纯投稿节点不算
  events.any? { |e| %w[rebuttal result camera].include?(e["type"]) } ? events : []
end

# ---- 单个会议抓取 ----
def scrape_conference(entry)
  home = fetch(entry["link"])
  return nil unless home

  pages = [home[1]] + candidate_pages(home[0], home[1])
  best_events = []
  source_url = nil
  pages.first(MAX_PAGES_PER_CONF).each do |page_url|
    body = page_url == home[1] ? home[0] : begin
      fetched = fetch(page_url)
      fetched ? fetched[0] : nil
    end
    next unless body
    rows = date_rows(html_lines(body)).select { |r| r =~ DATE_RE }
    # researchr 系站点（conf.researchr.org）页面附带的紧凑日历列表存在日期与事件名串行错位，
    # 只保留主体日程表（"事件名 : 日期" 冒号格式）的行
    if page_url =~ /researchr\.org/
      rows = rows.select { |r| r.include?(" : ") }
    end
    next if rows.empty?
    events = extract_events(rows, entry)
    next if events.empty?
    # 优先选评审链节点（rebuttal/result/camera）多的页面；平局时专门的候选页（dates/track 页）优先于首页
    review_depth = ->(list) { list.count { |e| %w[rebuttal result camera].include?(e["type"]) } }
    better = review_depth.call(events) > review_depth.call(best_events)
    if review_depth.call(events) == review_depth.call(best_events) && events.length >= best_events.length
      better = true if page_url != home[1] && source_url == home[1]
      better = true if page_url != home[1] && source_url != home[1] && events.length > best_events.length
    end
    if better
      best_events = events
      source_url = page_url
    end
  end
  return nil if best_events.empty?

  best_events = best_events.sort_by { |e| e["date"] }.first(10)
  best_events.each { |e| e["source"] = source_url }
  { "source" => source_url, "events" => best_events }
rescue StandardError
  nil
end

# ---- 主流程 ----
DEBUG_KEY = ARGV[0]
records = JSON.parse(File.read(File.expand_path("../app/conferences.json", __dir__)))
manual_keys = File.read(File.expand_path("../app/supplemental.ts", __dir__))
                        .scan(/^\s+"([^"]+-\d{4})":\s*\[/).flatten

# 目标：CCF A 类、非 ARR、缺人工核验日程、有官网链接、会议尚未完全结束
targets = []
records.each do |r|
  key = "#{r['title']}-#{r['year']}"
  next if DEBUG_KEY && !key.include?(DEBUG_KEY)
  next unless r["rank"] == "A" && r["isARR"] != true
  next if manual_keys.include?(key)
  next if targets.any? { |t| t[:key] == key }
  next unless r["link"] =~ %r{^https?://}
  conf_start = r["conferenceStart"].to_s
  next if conf_start != "" && Date.parse(conf_start) < Date.today - 120 rescue false
  targets << { key: key, entry: { "title" => r["title"], "year" => r["year"], "link" => r["link"],
                                  "deadline" => r["timeline"]&.map { |t| t["date"] }&.compact&.max,
                                  "conferenceStart" => conf_start } }
end
puts "Targets: #{targets.length} conferences (CCF A, missing manual review schedule)"

if DEBUG_KEY
  targets.each do |t|
    home = fetch(t[:entry]["link"])
    puts "home: #{home ? 'ok' : 'FAIL'}"
    if home
      puts "candidates:"
      candidate_pages(home[0], home[1]).each { |c| puts "  #{c}" }
      ([home[1]] + candidate_pages(home[0], home[1])).first(5).each do |page_url|
        body = page_url == home[1] ? home[0] : begin
          f = fetch(page_url); f ? f[0] : nil
        end
        next unless body
        rows = date_rows(html_lines(body)).select { |r| r =~ DATE_RE }
        events = extract_events(rows, t[:entry])
        puts "PAGE #{page_url} → rows=#{rows.length} events=#{events.length}"
        rows.first(ARGV[1] ? 40 : 12).each do |row|
          type = row =~ /\bTBD\b/i ? "TBD!" : classify(row)
          date = parse_date(row)
          puts "    [#{type || '-'}/#{date || '-'}] #{row[0, 90]}"
        end
      end
    end
  end
  exit
end

results = {}
mutex = Mutex.new
queue = Queue.new
targets.each { |t| queue << t }

threads = Array.new(CONCURRENCY) do
  Thread.new do
    while (t = queue.pop(true) rescue nil)
      data = scrape_conference(t[:entry])
      mutex.synchronize do
        if data
          results[t[:key]] = data
          puts "  ok   #{t[:key]} (#{data['events'].length} events)"
        else
          puts "  miss #{t[:key]}"
        end
      end
      sleep 0.3
    end
  end
end
threads.each(&:join)

meta = {
  generatedAt: Time.now.utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
  targetCount: targets.length,
  scrapedCount: results.length,
}
File.write(OUT, JSON.pretty_generate({ "meta" => meta, "conferences" => results }))
puts "Wrote #{results.length}/#{targets.length} review schedules to #{OUT}"
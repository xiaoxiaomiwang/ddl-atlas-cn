#!/usr/bin/env ruby
# 自动抓取 ACL Rolling Review (ARR) 各评审周期的关键日期。
# 数据源：https://aclrollingreview.org/dates（官方评审日程表）
# 输出：app/arr-cycles.json，前端运行时优先使用，替代 supplemental.ts 中的静态周期数据。
require "json"
require "date"
require "net/http"
require "uri"

SOURCE = "https://aclrollingreview.org/dates"
OUT = File.expand_path("../app/arr-cycles.json", __dir__)
MONTHS = %w[january february march april may june july august september october november december]
MONTH_RE = MONTHS.join("|")
TITLE_ABBR = { "january" => "JAN", "february" => "FEB", "march" => "MAR", "april" => "APR", "may" => "MAY", "june" => "JUN", "july" => "JUL", "august" => "AUG", "september" => "SEP", "october" => "OCT", "november" => "NOV", "december" => "DEC" }.freeze
MONTH_CAP = MONTHS.map(&:capitalize).freeze

def fetch(url_str, depth = 0)
  return nil if depth > 3
  uri = URI.parse(url_str)
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = uri.scheme == "https"
  http.open_timeout = 15
  http.read_timeout = 15
  response = http.get(uri.request_uri, { "User-Agent" => "Mozilla/5.0 (compatible; ddl-atlas-bot/1.0)", "Accept" => "text/html" })
  case response.code.to_i
  when 200 then response.body.to_s.force_encoding(Encoding::UTF_8).scrub
  when 301, 302, 303, 307, 308 then fetch(response["location"] ? URI.join(uri, response["location"]).to_s : nil, depth + 1)
  end
rescue StandardError
  nil
end

def html_lines(html)
  cleaned = html.gsub(/<!--.*?-->/m, " ").gsub(/<(script|style|noscript)[^>]*>.*?<\/\1>/im, " ")
  cleaned.gsub(/<[^>]+>/, "\n").gsub(/&nbsp;|&#160;/i, " ").gsub(/&amp;/, "&")
         .split("\n").map { |l| l.gsub(/\s+/, " ").strip }.reject(&:empty?)
end

# "March 16" → [同周期年]; "April 28-May 4" → [起, 止]; 跨年周期（如 11 月周期的次年 1 月）自动 +1 年
def parse_arr_dates(text, base_month, base_year)
  text.scan(/(#{MONTH_RE})\.?\s+(\d{1,2})/i).map do |mon, day|
    month_idx = MONTHS.index(mon.downcase)
    next nil unless month_idx
    year = base_year
    year += 1 if month_idx + 1 < base_month - 3
    format("%04d-%02d-%02d", year, month_idx + 1, day.to_i)
  end.compact
end

body = fetch(SOURCE)
if body.nil?
  warn "Failed to fetch #{SOURCE}; keep existing arr-cycles.json"
  exit 0
end

lines = html_lines(body)
cycles = []
i = 0
while i < lines.length
  line = lines[i]
  if (m = line.match(/\A(#{MONTH_CAP.join("|")}) (\d{4})\z/))
    base_month = MONTHS.index(m[1].downcase) + 1
    base_year = m[2].to_i
    dates = []
    j = i + 1
    # 周期行后连续收集 6 个日期项（含区间），遇到下一周期行或非日期内容停止
    while j < lines.length && dates.length < 6
      break if lines[j].match(/\A(#{MONTH_CAP.join("|")}) (\d{4})\z/)
      parsed = parse_arr_dates(lines[j], base_month, base_year)
      break if parsed.empty?
      dates << parsed
      j += 1
    end
    cycles << { month: m[1].downcase, year: base_year, dates: dates } if dates.length >= 6
    i = j
  else
    i += 1
  end
end

# 仅保留近 60 天内未结束与未来的周期
cycles = cycles.select do |c|
  cycle_end = c[:dates][5][0]
  Date.parse(cycle_end) >= Date.today - 60 rescue false
end

records = cycles.map do |c|
  submission, _reg, reviews_due, author_response, meta, cycle_end = c[:dates]
  events = [
    { "date" => submission[0], "label" => "ARR 投稿", "type" => "submission", "source" => SOURCE },
    { "date" => reviews_due[0], "label" => "Reviews 截止", "type" => "result", "source" => SOURCE },
    { "date" => author_response[0], "label" => "Author Response 开始", "type" => "rebuttal", "source" => SOURCE },
  ]
  if author_response.length > 1
    events << { "date" => author_response[1], "label" => "Author Response 截止", "type" => "rebuttal", "source" => SOURCE }
  end
  events << { "date" => meta[0], "label" => "Meta-review 发布", "type" => "result", "source" => SOURCE }
  end_label = Date.parse(cycle_end[0]).strftime("%B %-d, %Y")
  {
    id: "arr-#{c[:month][0, 3]}-#{c[:year]}",
    title: "ARR #{TITLE_ABBR[c[:month]]}",
    description: "ACL Rolling Review · #{c[:month].capitalize} #{c[:year]} cycle",
    category: "ARR", rank: "N", year: c[:year],
    link: SOURCE, timezone: "AoE",
    conferenceDate: "Cycle ends #{end_label}", conferenceStart: "",
    place: "OpenReview · Online", timeline: [], isARR: true,
    supplementalEvents: events,
  }
end

if records.empty?
  warn "Parsed 0 ARR cycles; keep existing arr-cycles.json"
  exit 0
end

File.write(OUT, JSON.pretty_generate(records))
puts "Wrote #{records.length} ARR cycles to #{OUT}"
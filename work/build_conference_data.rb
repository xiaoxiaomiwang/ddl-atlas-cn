require "yaml"
require "json"
require "date"

ROOT = File.expand_path("ccf-deadlines/conference", __dir__)
OUT = File.expand_path("../app/conferences.json", __dir__)

records = []

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
      next unless year >= 2025 && year <= 2028
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
        timeline: timeline
      }
    end
  end
end

File.write(OUT, JSON.pretty_generate(records.sort_by { |r| [r[:year], r[:title]] }))
puts "Wrote #{records.length} conference editions to #{OUT}"

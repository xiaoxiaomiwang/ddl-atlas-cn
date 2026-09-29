// 会议地点中文备注词表（小写英文 → 中文）。
// 覆盖：全部常见国家/地区 + 高频会议城市；词表外地点优雅降级（仅显示英文）。
export const PLACE_ZH: Record<string, string> = {
  // ---- 国家 / 地区 ----
  "usa": "美国", "united states": "美国", "united states of america": "美国", "u.s.a": "美国", "us": "美国",
  "uk": "英国", "united kingdom": "英国", "great britain": "英国", "england": "英国", "scotland": "苏格兰", "wales": "威尔士", "northern ireland": "北爱尔兰",
  "canada": "加拿大", "australia": "澳大利亚", "new zealand": "新西兰",
  "germany": "德国", "france": "法国", "italy": "意大利", "spain": "西班牙", "portugal": "葡萄牙",
  "netherlands": "荷兰", "the netherlands": "荷兰", "belgium": "比利时", "luxembourg": "卢森堡",
  "switzerland": "瑞士", "austria": "奥地利", "sweden": "瑞典", "norway": "挪威", "denmark": "丹麦",
  "finland": "芬兰", "iceland": "冰岛", "ireland": "爱尔兰",
  "poland": "波兰", "czech republic": "捷克", "czechia": "捷克", "hungary": "匈牙利", "slovakia": "斯洛伐克",
  "slovenia": "斯洛文尼亚", "croatia": "克罗地亚", "serbia": "塞尔维亚", "bosnia and herzegovina": "波黑",
  "romania": "罗马尼亚", "bulgaria": "保加利亚", "greece": "希腊", "turkey": "土耳其", "türkiye": "土耳其",
  "russia": "俄罗斯", "ukraine": "乌克兰", "estonia": "爱沙尼亚", "latvia": "拉脱维亚", "lithuania": "立陶宛",
  "israel": "以色列", "saudi arabia": "沙特", "qatar": "卡塔尔", "kuwait": "科威特", "bahrain": "巴林",
  "jordan": "约旦", "lebanon": "黎巴嫩", "morocco": "摩洛哥", "egypt": "埃及", "tunisia": "突尼斯",
  "south africa": "南非", "kenya": "肯尼亚", "nigeria": "尼日利亚", "ghana": "加纳", "ethiopia": "埃塞俄比亚", "tanzania": "坦桑尼亚", "rwanda": "卢旺达",
  "india": "印度", "pakistan": "巴基斯坦", "sri lanka": "斯里兰卡", "nepal": "尼泊尔", "bangladesh": "孟加拉国",
  "china": "中国", "pr china": "中国", "p.r. china": "中国", "japan": "日本", "korea": "韩国", "south korea": "韩国",
  "taiwan": "中国台湾", "hong kong": "中国香港", "hong kong sar": "中国香港", "macau": "中国澳门", "macao": "中国澳门",
  "singapore": "新加坡", "malaysia": "马来西亚", "indonesia": "印度尼西亚", "thailand": "泰国", "vietnam": "越南", "viet nam": "越南",
  "philippines": "菲律宾", "brunei": "文莱", "cambodia": "柬埔寨", "laos": "老挝", "myanmar": "缅甸", "mongolia": "蒙古",
  "uae": "阿联酋", "u.a.e": "阿联酋", "united arab emirates": "阿联酋", "oman": "阿曼",
  "brazil": "巴西", "argentina": "阿根廷", "chile": "智利", "peru": "秘鲁", "colombia": "哥伦比亚",
  "uruguay": "乌拉圭", "ecuador": "厄瓜多尔", "bolivia": "玻利维亚", "venezuela": "委内瑞拉", "costa rica": "哥斯达黎加", "panama": "巴拿马",
  "mexico": "墨西哥", "cuba": "古巴", "jamaica": "牙买加", "dominican republic": "多米尼加",
  "armenia": "亚美尼亚", "azerbaijan": "阿塞拜疆", "kazakhstan": "哈萨克斯坦", "uzbekistan": "乌兹别克斯坦",
  "cyprus": "塞浦路斯", "malta": "马耳他", "monaco": "摩纳哥", "andorra": "安道尔",
  "online": "线上", "virtual": "线上", "virtual event": "线上", "remote": "线上", "everywhere": "线上",
  // ---- 北美城市 ----
  "new york": "纽约", "new york city": "纽约", "nyc": "纽约", "san francisco": "旧金山", "los angeles": "洛杉矶",
  "chicago": "芝加哥", "boston": "波士顿", "seattle": "西雅图", "washington": "华盛顿", "washington dc": "华盛顿", "washington d.c.": "华盛顿",
  "atlanta": "亚特兰大", "houston": "休斯顿", "dallas": "达拉斯", "austin": "奥斯汀", "denver": "丹佛",
  "phoenix": "凤凰城", "salt lake city": "盐湖城", "portland": "波特兰", "san diego": "圣地亚哥", "san jose": "圣何塞",
  "palo alto": "帕洛阿尔托", "berkeley": "伯克利", "mountain view": "山景城", "menlo park": "门洛帕克",
  "pittsburgh": "匹兹堡", "philadelphia": "费城", "baltimore": "巴尔的摩", "nashville": "纳什维尔",
  "new orleans": "新奥尔良", "minneapolis": "明尼阿波利斯", "kansas city": "堪萨斯城", "st. louis": "圣路易斯", "saint louis": "圣路易斯",
  "detroit": "底特律", "cleveland": "克利夫兰", "columbus": "哥伦布", "indianapolis": "印第安纳波利斯",
  "milwaukee": "密尔沃基", "cincinnati": "辛辛那提", "buffalo": "布法罗", "providence": "普罗维登斯",
  "miami": "迈阿密", "orlando": "奥兰多", "tampa": "坦帕", "charlotte": "夏洛特", "raleigh": "罗利",
  "richmond": "里士满", "norfolk": "诺福克", "louisville": "路易斯维尔", "memphis": "孟菲斯", "oklahoma city": "俄克拉荷马城",
  "albuquerque": "阿尔伯克基", "las vegas": "拉斯维加斯", "sacramento": "萨克拉门托", "fresno": "弗雷斯诺",
  "honolulu": "檀香山", "anchorage": "安克雷奇", "princeton": "普林斯顿", "new haven": "纽黑文", "ithaca": "伊萨卡",
  "poughkeepsie": "波基普西", "cambridge": "剑桥", "cambridge ma": "剑桥", "pasadena": "帕萨迪纳", "irvine": "尔湾",
  "santa clara": "圣克拉拉", "santa fe": "圣菲", "aspen": "阿斯彭", "boulder": "博尔德", "salt lake": "盐湖城",
  "snowbird": "斯诺伯德", "park city": "帕克城", "whistler": "惠斯勒",
  "toronto": "多伦多", "montreal": "蒙特利尔", "montréal": "蒙特利尔", "vancouver": "温哥华", "ottawa": "渥太华",
  "calgary": "卡尔加里", "edmonton": "埃德蒙顿", "halifax": "哈利法克斯", "winnipeg": "温尼伯", "quebec city": "魁北克市",
  "victoria": "维多利亚", "whitby": "惠特比", "banff": "班夫", "mont-tremblant": "蒙特朗布朗",
  // ---- 欧洲城市 ----
  "london": "伦敦", "manchester": "曼彻斯特", "birmingham": "伯明翰", "liverpool": "利物浦", "leeds": "利兹",
  "glasgow": "格拉斯哥", "edinburgh": "爱丁堡", "aberdeen": "阿伯丁", "dundee": "邓迪", "newcastle": "纽卡斯尔",
  "bristol": "布里斯托", "cardiff": "加的夫", "belfast": "贝尔法斯特", "brighton": "布莱顿", "reading": "雷丁",
  "oxford": "牛津", "cambridge uk": "剑桥", "coventry": "考文垂", "nottingham": "诺丁汉", "sheffield": "谢菲尔德",
  "york": "约克", "bath": "巴斯", "exeter": "埃克塞特", "southampton": "南安普顿", "surrey": "萨里",
  "paris": "巴黎", "lyon": "里昂", "marseille": "马赛", "nice": "尼斯", "toulouse": "图卢兹", "bordeaux": "波尔多",
  "nantes": "南特", "grenoble": "格勒诺布尔", "lille": "里尔", "strasbourg": "斯特拉斯堡", "montpellier": "蒙彼利埃"
  , "sophia antipolis": "索菲亚-安提波利斯", "evian": "依云", "évian-les-bains": "依云", "villard-de-lans": "维拉尔-德朗",
  "berlin": "柏林", "munich": "慕尼黑", "münchen": "慕尼黑", "frankfurt": "法兰克福", "hamburg": "汉堡",
  "cologne": "科隆", "köln": "科隆", "stuttgart": "斯图加特", "düsseldorf": "杜塞尔多夫", "dortmund": "多特蒙德"
  , "dresden": "德累斯顿", "leipzig": "莱比锡", "hannover": "汉诺威", "nuremberg": "纽伦堡", "nürnberg": "纽伦堡"
  , "bremen": "不来梅", "bonn": "波恩", "aachen": "亚琛", "karlsruhe": "卡尔斯鲁厄", "darmstadt": "达姆施塔特"
  , "saarbrücken": "萨尔布吕肯", "saarland": "萨尔州", "düsseldorf-derendorf": "杜塞尔多夫", "kaiserslautern": "凯泽斯劳滕"
  , "heidelberg": "海德堡", "freiburg": "弗莱堡", "konstanz": "康斯坦茨", "ulm": "乌尔姆", "regensburg": "雷根斯堡"
  , "würzburg": "维尔茨堡", "paderborn": "帕德博恩", "münster": "明斯特", "osnabrück": "奥斯纳布吕克", "oldenburg": "奥尔登堡"
  , "kiel": "基尔", "lübeck": "吕贝克", "rostock": "罗斯托克", "magdeburg": "马格德堡", "halle": "哈勒", "jena": "耶拿"
  , "erfurt": "爱尔福特", "bochum": "波鸿", "essen": "埃森", "wuppertal": "伍珀塔尔", "siegen": "锡根", "passau": "帕绍"
  , "dagstuhl": "达格施图尔", "schloss dagstuhl": "达格施图尔",
  "vienna": "维也纳", "wien": "维也纳", "salzburg": "萨尔茨堡", "graz": "格拉茨", "linz": "林茨", "innsbruck": "因斯布鲁克",
  "zurich": "苏黎世", "zürich": "苏黎世", "geneva": "日内瓦", "genève": "日内瓦", "lausanne": "洛桑", "basel": "巴塞尔"
  , "bern": "伯尔尼", "interlaken": "因特拉肯", "lucerne": "卢塞恩", "lugano": "卢加诺", "st. gallen": "圣加仑"
  , "montreux": "蒙特勒", "davos": "达沃斯", "ascona": "阿斯科纳",
  "amsterdam": "阿姆斯特丹", "rotterdam": "鹿特丹", "the hague": "海牙", "utrecht": "乌得勒支", "eindhoven": "埃因霍温"
  , "delft": "代尔夫特", "leiden": "莱顿", "groningen": "格罗宁根", "twente": "特文特", "enschede": "恩斯赫德",
  "brussels": "布鲁塞尔", "bruxelles": "布鲁塞尔", "antwerp": "安特卫普", "ghent": "根特", "leuven": "鲁汶", "liège": "列日", "namur": "那慕尔",
  "luxembourg city": "卢森堡市",
  "rome": "罗马", "roma": "罗马", "milan": "米兰", "milano": "米兰", "naples": "那不勒斯", "napoli": "那不勒斯"
  , "turin": "都灵", "florence": "佛罗伦萨", "firenze": "佛罗伦萨", "venice": "威尼斯", "venezia": "威尼斯"
  , "bologna": "博洛尼亚", "padua": "帕多瓦", "padova": "帕多瓦", "genoa": "热那亚", "genova": "热那亚"
  , "palermo": "巴勒莫", "bari": "巴里", "catania": "卡塔尼亚", "trieste": "的里雅斯特", "verona": "维罗纳"
  , "sorrento": "索伦托", "amalfi": "阿马尔菲", "taormina": "陶尔米纳", "cagliari": "卡利亚里",
  "madrid": "马德里", "barcelona": "巴塞罗那", "valencia": "瓦伦西亚", "seville": "塞维利亚", "sevilla": "塞维利亚"
  , "bilbao": "毕尔巴鄂", "zaragoza": "萨拉戈萨", "malaga": "马拉加", "málaga": "马拉加", "alicante": "阿利坎特"
  , "granada": "格拉纳达", "toledo": "托莱多", "salamanca": "萨拉曼卡", "santiago de compostela": "圣地亚哥-德孔波斯特拉"
  , "tenerife": "特内里费", "palma": "帕尔马", "sitges": "锡切斯",
  "lisbon": "里斯本", "lisboa": "里斯本", "porto": "波尔图", "coimbra": "科英布拉", "braga": "布拉加", "funchal": "丰沙尔",
  "dublin": "都柏林", "cork": "科克", "galway": "戈尔韦", "limerick": "利默里克",
  "copenhagen": "哥本哈根", "københavn": "哥本哈根", "aarhus": "奥胡斯", "åarhus": "奥胡斯", "odense": "欧登塞", "aalborg": "奥尔堡",
  "stockholm": "斯德哥尔摩", "gothenburg": "哥德堡", "göteborg": "哥德堡", "malmö": "马尔默", "lund": "隆德", "uppsala": "乌普萨拉", "linköping": "林雪平", "umeå": "于默奥",
  "oslo": "奥斯陆", "bergen": "卑尔根", "trondheim": "特隆赫姆", "tromsø": "特罗姆瑟", "stavanger": "斯塔万格",
  "helsinki": "赫尔辛基", "espoo": "埃斯波", "tampere": "坦佩雷", "turku": "图尔库", "oulu": "奥卢", "rovaniemi": "罗瓦涅米",
  "reykjavik": "雷克雅未克", "reykjavík": "雷克雅未克", "akureyri": "阿克雷里",
  "warsaw": "华沙", "krakow": "克拉科夫", "kraków": "克拉科夫", "gdansk": "格但斯克", "wroclaw": "弗罗茨瓦夫", "poznan": "波兹南", "lodz": "罗兹", "katowice": "卡托维兹", "lublin": "卢布林",
  "prague": "布拉格", "praha": "布拉格", "brno": "布尔诺", "ostrava": "俄斯特拉发",
  "bratislava": "布拉迪斯拉发", "kosice": "科希策",
  "budapest": "布达佩斯", "szeged": "塞格德", "debrecen": "德布勒森",
  "ljubljana": "卢布尔雅那", "maribor": "马里博尔", "portoroz": "波尔托罗", "portorož": "波尔托罗",
  "zagreb": "萨格勒布", "split": "斯普利特", "dubrovnik": "杜布罗夫尼克", "zadar": "扎达尔",
  "belgrade": "贝尔格莱德", "novi sad": "诺维萨德", "sarajevo": "萨拉热窝", "skopje": "斯科普里", "tirana": "地拉那",
  "bucharest": "布加勒斯特", "cluj-napoca": "克卢日-纳波卡", "timisoara": "蒂米什瓦拉", "iasi": "雅西",
  "sofia": "索菲亚", "plovdiv": "普罗夫迪夫", "varna": "瓦尔纳",
  "athens": "雅典", "athina": "雅典", "thessaloniki": "塞萨洛尼基", "heraklion": "伊拉克利翁", "crete": "克里特", "rhodes": "罗德", "corfu": "科孚", "santorini": "圣托里尼", "mykonos": "米科诺斯", "volos": "沃洛斯",
  "istanbul": "伊斯坦布尔", "ankara": "安卡拉", "izmir": "伊兹密尔", "antalya": "安塔利亚", "bodrum": "博德鲁姆", "cusco": "库斯科",
  "moscow": "莫斯科", "saint petersburg": "圣彼得堡", "st. petersburg": "圣彼得堡", "novosibirsk": "新西伯利亚", "yekaterinburg": "叶卡捷琳堡", "kazan": "喀山", "nizhny novgorod": "下诺夫哥罗德",
  "kyiv": "基辅", "kiev": "基辅", "lviv": "利沃夫", "odesa": "敖德萨", "odessa": "敖德萨",
  "tallinn": "塔林", "riga": "里加", "vilnius": "维尔纽斯", "kaunas": "考纳斯",
  // ---- 亚洲城市 ----
  "beijing": "北京", "shanghai": "上海", "shenzhen": "深圳", "guangzhou": "广州", "hangzhou": "杭州", "nanjing": "南京"
  , "wuhan": "武汉", "xi'an": "西安", "xian": "西安", "chengdu": "成都", "chongqing": "重庆", "tianjin": "天津"
  , "suzhou": "苏州", "hefei": "合肥", "harbin": "哈尔滨", "changsha": "长沙", "xiamen": "厦门", "qingdao": "青岛"
  , "dalian": "大连", "shenyang": "沈阳", "kunming": "昆明", "fuzhou": "福州", "zhengzhou": "郑州", "jinan": "济南"
  , "hong kong island": "香港", "kowloon": "九龙", "sha tin": "沙田", "taikoo shing": "太古", "tsim sha tsui": "尖沙咀",
  "taipei": "台北", "hsinchu": "新竹", "tainan": "台南", "taichung": "台中", "kaohsiung": "高雄",
  "taipa": "氹仔", "cotai": "路氹",
  "tokyo": "东京", "osaka": "大阪", "kyoto": "京都", "nagoya": "名古屋", "fukuoka": "福冈", "sapporo": "札幌"
  , "sendai": "仙台", "hiroshima": "广岛", "kobe": "神户", "yokohama": "横滨", "tsukuba": "筑波", "okinawa": "冲绳", "naha": "那霸",
  "seoul": "首尔", "busan": "釜山", "daegu": "大邱", "incheon": "仁川", "daejeon": "大田", "gwangju": "光州", "jeju": "济州", "jeju island": "济州岛", "pyeongchang": "平昌",
  "singapore city": "新加坡",
  "bangkok": "曼谷", "chiang mai": "清迈", "phuket": "普吉", "pattaya": "芭提雅", "hua hin": "华欣",
  "kuala lumpur": "吉隆坡", "penang": "槟城", "george town": "乔治市", "langkawi": "兰卡威", "putrajaya": "布城", "johor bahru": "新山", "kuching": "古晋", "kotakinabalu": "哥打基纳巴卢",
  "jakarta": "雅加达", "bali": "巴厘岛", "denpasar": "登巴萨", "surabaya": "泗水", "bandung": "万隆", "yogyakarta": "日惹",
  "manila": "马尼拉", "cebu": "宿务", "quezon city": "奎松城", "davao": "达沃",
  "hanoi": "河内", "ho chi minh city": "胡志明市", "ho chi minh": "胡志明市", "da nang": "岘港", "hue": "顺化", "ha long": "下龙",
  "phnom penh": "金边", "siem reap": "暹粒", "vientiane": "万象", "yangon": "仰光", "mandalay": "曼德勒",
  "mumbai": "孟买", "new delhi": "新德里", "delhi": "德里", "bangalore": "班加罗尔", "bengaluru": "班加罗尔"
  , "hyderabad": "海得拉巴", "chennai": "金奈", "kolkata": "加尔各答", "pune": "浦那", "ahmedabad": "艾哈迈达巴德"
  , "jaipur": "斋浦尔", "kochi": "科钦", "goa": "果阿", "bhubaneswar": "布巴内斯瓦尔", "iit kharagpur": "哈拉格普尔",
  "colombo": "科伦坡", "kathmandu": "加德满都", "dhaka": "达卡", "islamabad": "伊斯兰堡", "karachi": "卡拉奇", "lahore": "拉合尔",
  "dubai": "迪拜", "dubaï": "迪拜", "abu dhabi": "阿布扎比", "sharjah": "沙迦", "doha": "多哈", "riyadh": "利雅得"
  , "jeddah": "吉达", "muscat": "马斯喀特", "manama": "麦纳麦", "amman": "安曼", "beirut": "贝鲁特", "baghdad": "巴格达",
  "tehran": "德黑兰", "baku": "巴库", "tbilisi": "第比利斯", "yerevan": "埃里温", "almaty": "阿拉木图", "astana": "阿斯塔纳", "tashkent": "塔什干",
  "jerusalem": "耶路撒冷", "tel aviv": "特拉维夫", "tel-aviv": "特拉维夫", "haifa": "海法", "herzliya": "荷兹利亚",
  // ---- 大洋洲 / 非洲 / 拉美城市 ----
  "sydney": "悉尼", "melbourne": "墨尔本", "brisbane": "布里斯班", "perth": "珀斯", "adelaide": "阿德莱德"
  , "canberra": "堪培拉", "gold coast": "黄金海岸", "cairns": "凯恩斯", "darwin": "达尔文", "hobart": "霍巴特", "geelong": "吉朗",
  "auckland": "奥克兰", "wellington": "惠灵顿", "christchurch": "基督城", "queenstown": "皇后镇", "dunedin": "达尼丁", "hamilton": "汉密尔顿", "rotorua": "罗托鲁阿",
  "cape town": "开普敦", "johannesburg": "约翰内斯堡", "pretoria": "比勒陀利亚", "durban": "德班", "stellenbosch": "斯泰伦博斯", "port elizabeth": "伊丽莎白港",
  "nairobi": "内罗毕", "cairo": "开罗", "alexandria": "亚历山大", "casablanca": "卡萨布兰卡", "rabat": "拉巴特", "marrakech": "马拉喀什", "tunis": "突尼斯市", "lagos": "拉各斯", "accra": "阿克拉", "kampala": "坎帕拉", "dar es salaam": "达累斯萨拉姆",
  "rio de janeiro": "里约热内卢", "são paulo": "圣保罗", "sao paulo": "圣保罗", "buenos aires": "布宜诺斯艾利斯"
  , "santiago": "圣地亚哥", "lima": "利马", "bogotá": "波哥大", "bogota": "波哥大", "caracas": "加拉加斯"
  , "mexico city": "墨西哥城", "ciudad de méxico": "墨西哥城", "cancún": "坎昆", "cancun": "坎昆", "guadalajara": "瓜达拉哈拉", "monterrey": "蒙特雷", "puebla": "普埃布拉",
  "montevideo": "蒙得维的亚", "asunción": "亚松森", "la paz": "拉巴斯", "quito": "基多", "san josé": "圣何塞", "havana": "哈瓦那",
  // ---- 美国州名（常见地点第二段）----
  "california": "加利福尼亚", "ca": "加州", "new york state": "纽约州", "ny": "纽约州", "texas": "得克萨斯", "tx": "得州"
  , "florida": "佛罗里达", "fl": "佛罗里达", "washington state": "华盛顿州", "wa": "华盛顿州", "oregon": "俄勒冈", "or": "俄勒冈"
  , "massachusetts": "马萨诸塞", "ma": "马萨诸塞", "illinois": "伊利诺伊", "il": "伊利诺伊", "pennsylvania": "宾夕法尼亚", "pa": "宾夕法尼亚"
  , "ohio": "俄亥俄", "oh": "俄亥俄", "michigan": "密歇根", "mi": "密歇根", "virginia": "弗吉尼亚", "va": "弗吉尼亚"
  , "maryland": "马里兰", "md": "马里兰", "georgia": "佐治亚", "ga": "佐治亚", "north carolina": "北卡罗来纳", "nc": "北卡罗来纳"
  , "south carolina": "南卡罗来纳", "sc": "南卡罗来纳", "tennessee": "田纳西", "tn": "田纳西", "kentucky": "肯塔基", "ky": "肯塔基"
  , "arizona": "亚利桑那", "az": "亚利桑那", "colorado": "科罗拉多", "co": "科罗拉多", "utah": "犹他", "ut": "犹他"
  , "nevada": "内华达", "nv": "内华达", "new mexico": "新墨西哥", "nm": "新墨西哥", "missouri": "密苏里", "mo": "密苏里"
  , "wisconsin": "威斯康星", "wi": "威斯康星", "minnesota": "明尼苏达", "mn": "明尼苏达", "indiana": "印第安纳", "in": "印第安纳"
  , "louisiana": "路易斯安那", "la": "路易斯安那", "alabama": "亚拉巴马", "al": "亚拉巴马", "mississippi": "密西西比", "ms": "密西西比"
  , "iowa": "艾奥瓦", "ia": "艾奥瓦", "kansas": "堪萨斯", "ks": "堪萨斯", "nebraska": "内布拉斯加", "ne": "内布拉斯加"
  , "oklahoma": "俄克拉何马", "ok": "俄克拉何马", "arkansas": "阿肯色", "ar": "阿肯色", "connecticut": "康涅狄格", "ct": "康涅狄格"
  , "new jersey": "新泽西", "nj": "新泽西", "rhode island": "罗得岛", "ri": "罗得岛", "new hampshire": "新罕布什尔", "nh": "新罕布什尔"
  , "vermont": "佛蒙特", "vt": "佛蒙特", "maine": "缅因", "me": "缅因", "delaware": "特拉华", "de": "特拉华"
  , "hawaii": "夏威夷", "hi": "夏威夷", "alaska": "阿拉斯加", "ak": "阿拉斯卡", "idaho": "爱达荷", "id": "爱达荷"
  , "montana": "蒙大拿", "mt": "蒙大拿", "wyoming": "怀俄明", "wy": "怀俄明", "west virginia": "西弗吉尼亚", "wv": "西弗吉尼亚",
  "british columbia": "不列颠哥伦比亚", "ontario": "安大略", "quebec": "魁北克", "québec": "魁北克", "alberta": "阿尔伯塔", "manitoba": "曼尼托巴", "nova scotia": "新斯科舍", "saskatchewan": "萨斯喀彻温",
};

// 地点 → 中文备注；匹配不到任何词表项时返回空串（优雅降级，仅显示英文）
export function placeZh(place: string | null | undefined): string {
  if (!place) return "";
  const segments = place.split(/[;·]/).map((part) =>
    part.split(",").map((seg) => seg.trim().toLowerCase().replace(/\.$/, "").replace(/\s+/g, " ")).filter(Boolean),
  );
  const groups: string[] = [];
  for (const parts of segments) {
    const translated = parts.map((seg) => PLACE_ZH[seg]).filter(Boolean);
    if (translated.length > 0) groups.push(translated.join("，"));
  }
  if (groups.length === 0) return "";
  return `（${groups.join("；")}）`;
}
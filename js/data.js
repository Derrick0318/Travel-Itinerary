/*
 * Trip data — transcribed from the Brighton Travel & Tour brochure (prepared by Amy).
 * Every user-facing string is bilingual: { zh, en }.
 * Edit this file to correct details; the UI renders everything from here.
 */
// Photos are free-licensed images from Wikimedia Commons, stored in assets/img (credit on each).
window.TRIP = {
  title: { zh: "一半烟火，一半未来", en: "Half Old Streets, Half Future" },
  subtitle: {
    zh: "跟着电影《给阿嬷的情书》走进广东潮汕",
    en: "Following the film “A Love Letter to Grandma” through Chaoshan, Guangdong",
  },
  duration: { zh: "7天6晚", en: "7 Days 6 Nights" },
  operator: { zh: "Brighton Travel & Tour · Amy 编制", en: "Brighton Travel & Tour · prepared by Amy" },
  heroImage: "assets/img/chaozhou-guangji-bridge-20191211-1280.jpg",

  // Departure date is blank in the brochure. The traveller sets it in the app (saved on the phone).
  departureDate: null,

  flights: [
    {
      day: 1, no: "ZH172", airline: { zh: "深圳航空", en: "Shenzhen Airlines" },
      from: { code: "BWN", city: { zh: "文莱", en: "Brunei" }, time: "09:55" },
      to: { code: "SZX", city: { zh: "深圳", en: "Shenzhen" }, time: "13:20" },
    },
    {
      day: 7, no: "ZH171", airline: { zh: "深圳航空", en: "Shenzhen Airlines" },
      from: { code: "SZX", city: { zh: "深圳", en: "Shenzhen" }, time: "16:30" },
      to: { code: "BWN", city: { zh: "文莱", en: "Brunei" }, time: "19:55" },
    },
  ],
  baggage: { zh: "托运 23kg + 手提 5kg", en: "23 kg checked + 5 kg cabin" },

  // Meal codes: "in" = included, "own" = on your own, "air" = on the flight, "-" = none
  days: [
    {
      n: 1,
      route: { zh: "文莱 → 深圳", en: "Brunei → Shenzhen" },
      vibe: "future",
      tagline: { zh: "未来之城：机器人为你做饭", en: "City of the future: robots cook your lunch" },
      meals: { b: "-", l: "air", d: "in" },
      image: "assets/img/night-of-civic-center-shenzhen-from-lianhua-mountain.jpg",
      imageCredit: "Sparktour, CC BY-SA 4.0",
      stops: [
        {
          name: { zh: "抵达深圳宝安国际机场", en: "Arrive Shenzhen Bao'an Airport" },
          desc: { zh: "搭乘 ZH172 13:20 抵达，与导游会合。", en: "Land at 13:20 on ZH172 and meet your guide." },
          tag: "travel", lat: 22.639, lng: 113.811,
        },
        {
          name: { zh: "莲花山公园", en: "Lianhua Mountain Park" },
          desc: { zh: "俯瞰深圳福田 CBD 天际线的最佳观景点。", en: "The best spot for a panoramic view of Shenzhen's Futian CBD skyline." },
          tag: "sight", lat: 22.553, lng: 114.059,
        },
        {
          name: { zh: "全球首个机器人 6S 店", en: "World's first Robot 6S Store" },
          desc: { zh: "在机器人餐厅用餐：机器人做菜，机器人上菜。", en: "Dine at a robot restaurant where robots cook and serve the meal." },
          tag: "food", lat: 22.54, lng: 113.95,
        },
      ],
      hotel: { zh: "深圳中兴和泰酒店或同级", en: "Shenzhen Zhongxing Hetai Hotel or similar" },
    },
    {
      n: 2,
      route: { zh: "深圳 → 汕尾 → 潮汕", en: "Shenzhen → Shanwei → Chaoshan" },
      drive: { zh: "车程约 2.5 + 2.5 小时", en: "≈ 2.5 h + 2.5 h by coach" },
      vibe: "old",
      tagline: { zh: "海岸、古桥与千年古城", en: "Coastline, an ancient bridge and a 1,600-year-old city" },
      meals: { b: "in", l: "in", d: "in" },
      image: "assets/img/chaozhou-guangji-bridge-20191211-2.jpg",
      imageCredit: "Akira CA, CC BY-SA 4.0",
      stops: [
        {
          name: { zh: "红海湾遮浪半岛", en: "Red Bay · Zhelang Peninsula" },
          desc: { zh: "汕尾的海角半岛，看海、吹海风。", en: "A wave-sheltering peninsula on the Shanwei coast." },
          tag: "sight", lat: 22.66, lng: 115.57,
          image: "assets/img/shanwei-zhelang-honghaiwan-2014-01-18-14-28-16.jpg",
          imageCredit: "Zhangzhugang, CC BY-SA 4.0",
        },
        {
          name: { zh: "湘子桥（广济桥）", en: "Xiangzi Bridge (Guangji Bridge)" },
          desc: { zh: "世界上最早的启闭式桥梁。", en: "The world's earliest opening-and-closing bridge." },
          tag: "sight", lat: 23.666, lng: 116.648,
        },
        {
          name: { zh: "潮州古城", en: "Chaozhou Ancient City" },
          desc: { zh: "距今已有 1600 多年历史，牌坊街最好逛。", en: "Over 1,600 years of history — stroll the famous Paifang (arch) Street." },
          tag: "sight", lat: 23.668, lng: 116.643,
          image: "assets/img/paifangjie-cropped.jpg",
          imageCredit: "Sgnpkd, CC BY-SA 4.0",
        },
      ],
      hotel: { zh: "潮汕戴斯酒店或同级", en: "Days Hotel Chaoshan or similar" },
    },
    {
      n: 3,
      route: { zh: "潮州 → 揭阳", en: "Chaozhou → Jieyang" },
      drive: { zh: "车程约 1 小时", en: "≈ 1 h by coach" },
      vibe: "film",
      tagline: { zh: "走进《给阿嬷的情书》取景地", en: "Walk into the film sets of “A Love Letter to Grandma”" },
      meals: { b: "in", l: "in", d: "in" },
      mealNote: { zh: "午餐：鹅肉宴（非遗美食 · 百年传承）", en: "Lunch: Goose Feast (heritage recipe, a century old)" },
      image: "assets/img/jieyang-gate-tower.jpg",
      imageCredit: "13yxzou, CC BY-SA 4.0",
      stops: [
        {
          name: { zh: "佛手果生态园", en: "Buddha's Hand Fruit Ecological Park" },
          desc: { zh: "参观潮汕特产佛手果的生态园。", en: "Visit an orchard of the local Buddha's hand citron." },
          tag: "sight", lat: 23.62, lng: 116.55,
        },
        {
          name: { zh: "鹅肉宴", en: "Goose Feast" },
          desc: { zh: "中餐：非遗美食，百年传承。", en: "Lunch of heritage-recipe Chaoshan braised goose." },
          tag: "food", lat: 23.6, lng: 116.5,
        },
        {
          name: { zh: "西淇石板桥", en: "Xiqi Stone Bridge" },
          desc: { zh: "男女主角一见钟情的石板桥，就在村口。", en: "The stone bridge at the village entrance where the two leads fall in love at first sight." },
          tag: "film", lat: 23.52, lng: 116.33,
        },
        {
          name: { zh: "揭阳古城", en: "Jieyang Ancient City" },
          desc: { zh: "电影取景地之一。", en: "One of the film's shooting locations." },
          tag: "film", lat: 23.548, lng: 116.372,
          image: "assets/img/jieyang-xuegong-2013-10-27-15-12-27.jpg",
          imageCredit: "Zhangzhugang, CC BY-SA 3.0",
        },
        {
          name: { zh: "西马路——暹罗老街", en: "Xima Road — Siam Old Street" },
          desc: { zh: "电影取景地之一。", en: "Another filming location, full of old-town character." },
          tag: "film", lat: 23.545, lng: 116.368,
        },
        {
          name: { zh: "西湖公园", en: "West Lake Park" },
          desc: { zh: "电影取景地之一，全家福拍摄地。", en: "Filming location — where the family-portrait scene was shot." },
          tag: "film", lat: 23.55, lng: 116.36,
        },
      ],
      optional: "A",
      hotel: { zh: "揭阳舒宸酒店或同级", en: "Jieyang Shuchen Hotel or similar" },
    },
    {
      n: 4,
      route: { zh: "揭阳 → 惠州 → 广州", en: "Jieyang → Huizhou → Guangzhou" },
      drive: { zh: "车程约 3 + 2.5 小时", en: "≈ 3 h + 2.5 h by coach" },
      vibe: "city",
      tagline: { zh: "骑楼老街到“小蛮腰”", en: "From arcade streets to the “Slim Waist” tower" },
      meals: { b: "in", l: "in", d: "own" },
      mealNote: { zh: "晚餐自理", en: "Dinner on your own" },
      image: "assets/img/canton-tower-20241027.jpg",
      imageCredit: "Tim Wu, CC BY-SA 4.0",
      stops: [
        {
          name: { zh: "惠州水东街", en: "Shuidong Street, Huizhou" },
          desc: { zh: "骑楼建筑，融合中西风格。", en: "Qilou arcade buildings blending Chinese and Western styles." },
          tag: "sight", lat: 23.112, lng: 114.413,
        },
        {
          name: { zh: "外观广州塔（不上塔）", en: "Canton Tower (outside view)" },
          desc: { zh: "广州地标，昵称“小蛮腰”，600 米高，屹立珠江畔。", en: "Guangzhou's 600 m landmark nicknamed “Slim Waist”. Photo stop only — not going up." },
          tag: "sight", lat: 23.106, lng: 113.324,
        },
        {
          name: { zh: "花城广场", en: "Huacheng (Flower City) Square" },
          desc: { zh: "广州的“城市客厅”，周边环绕广州塔、西塔等摩天建筑群。", en: "Guangzhou's “city living room”, ringed by skyscrapers." },
          tag: "sight", lat: 23.119, lng: 113.326,
          image: "assets/img/huacheng-square-guangzhou.jpg",
          imageCredit: "Zhou Guanhuai, CC0",
        },
        {
          name: { zh: "北京路商业步行街", en: "Beijing Road Pedestrian Street" },
          desc: { zh: "自由购物逛街，晚餐自理。", en: "Free time for shopping; dinner on your own." },
          tag: "shop", lat: 23.125, lng: 113.269,
          image: "assets/img/beijing-lu-pedestrian-mall-at-night-1.jpg",
          imageCredit: "Chinatravelsavvy, CC BY-SA 3.0",
        },
      ],
      optional: "B",
      hotel: { zh: "广州戴斯酒店或同级", en: "Days Hotel Guangzhou or similar" },
    },
    {
      n: 5,
      route: { zh: "广州 → 佛山", en: "Guangzhou → Foshan" },
      drive: { zh: "车程约 1 小时", en: "≈ 1 h by coach" },
      vibe: "old",
      tagline: { zh: "西关风情与岭南新天地", en: "Old Xiguan lanes and Lingnan Tiandi" },
      meals: { b: "in", l: "in", d: "own" },
      mealNote: { zh: "晚餐自理", en: "Dinner on your own" },
      image: "assets/img/yongqingfang.jpg",
      imageCredit: "钉钉, CC BY-SA 4.0",
      stops: [
        {
          name: { zh: "白云皮具市场", en: "Baiyun Leather Goods Market" },
          desc: { zh: "亚洲规模最大的皮具集散中心。", en: "Asia's largest leather goods distribution centre." },
          tag: "shop", lat: 23.16, lng: 113.26,
        },
        {
          name: { zh: "永庆坊", en: "Yongqingfang" },
          desc: { zh: "广州非遗街区。", en: "Guangzhou's intangible cultural heritage quarter." },
          tag: "sight", lat: 23.121, lng: 113.243,
        },
        {
          name: { zh: "佛山岭南新天地", en: "Foshan Lingnan Tiandi" },
          desc: { zh: "岭南老建筑改造的休闲街区，然后入住酒店。", en: "Restored Lingnan-style old buildings turned into a lively quarter, then check in." },
          tag: "sight", lat: 23.03, lng: 113.11,
        },
      ],
      hotel: { zh: "佛山戴斯温德姆酒店或同级", en: "Days Hotel by Wyndham Foshan or similar" },
    },
    {
      n: 6,
      route: { zh: "佛山 → 中山", en: "Foshan → Zhongshan" },
      drive: { zh: "车程约 1.5 小时", en: "≈ 1.5 h by coach" },
      vibe: "old",
      tagline: { zh: "黄飞鸿、百年饼家与顺德菜", en: "Wong Fei-hung, a century-old bakery and Shunde food" },
      meals: { b: "in", l: "in", d: "in" },
      mealNote: { zh: "晚餐：顺德特色菜 · 乳鸽宴", en: "Dinner: Shunde specialties · Young Pigeon Feast" },
      image: "assets/img/gd-zs-zhongshan-shiqi-sunwen-west-road-pedestrian-zone-night.jpg",
      imageCredit: "HHAFOL Moratim LUNG, CC0",
      stops: [
        {
          name: { zh: "黄飞鸿故居", en: "Wong Fei-hung's Former Residence" },
          desc: { zh: "一代武术宗师黄飞鸿的故居。", en: "Home of the legendary kung-fu master and folk hero." },
          tag: "sight", lat: 22.95, lng: 112.97,
        },
        {
          name: { zh: "咀香园", en: "Juxiangyuan" },
          desc: { zh: "创始于 1918 年的中华老字号，专做传统中式饼食。", en: "A time-honoured brand founded in 1918, famous for traditional Chinese pastries (try the almond cookies)." },
          tag: "shop", lat: 22.52, lng: 113.39,
        },
        {
          name: { zh: "顺德特色菜", en: "Shunde Specialties Dinner" },
          desc: { zh: "乳鸽宴。", en: "Young Pigeon Feast." },
          tag: "food", lat: 22.53, lng: 113.38,
        },
      ],
      hotel: { zh: "中山希尔顿花园酒店或同级", en: "Hilton Garden Inn Zhongshan or similar" },
    },
    {
      n: 7,
      route: { zh: "中山 → 深圳 → 文莱", en: "Zhongshan → Shenzhen → Brunei" },
      vibe: "future",
      tagline: { zh: "跨海回家，期待下次再会", en: "Across the sea link and home again" },
      meals: { b: "in", l: "in", d: "air" },
      image: "assets/img/shenzhenzhongshanbridge3.jpg",
      imageCredit: "Pulsarwind, CC BY-SA 4.0",
      stops: [
        {
          name: { zh: "孙文公园", en: "Sun Wen Park" },
          desc: { zh: "中山市纪念孙中山先生的公园。", en: "Zhongshan's park honouring Dr Sun Yat-sen." },
          tag: "sight", lat: 22.513, lng: 113.374,
        },
        {
          name: { zh: "深中通道", en: "Shenzhen–Zhongshan Link" },
          desc: { zh: "经深中通道前往深圳机场。", en: "Cross the new bridge-and-tunnel sea link to Shenzhen Airport." },
          tag: "travel", lat: 22.6, lng: 113.7,
        },
        {
          name: { zh: "搭乘 ZH171 返回文莱", en: "Fly home on ZH171" },
          desc: { zh: "16:30 起飞，19:55 抵达文莱。", en: "Departs 16:30, lands in Brunei 19:55." },
          tag: "travel", lat: 22.639, lng: 113.811,
        },
      ],
      hotel: null,
    },
  ],

  optionalTours: {
    A: {
      name: { zh: "《大潮归来——入梦潮州》表演", en: "“The Return of the Tide – Dreaming into Chaozhou” live show" },
      price: 298, currency: "RMB", day: 3,
    },
    B: {
      name: { zh: "广州珠江两岸夜景 + 船游珠江", en: "Pearl River night cruise & night view of both banks" },
      price: 300, currency: "RMB", day: 4,
    },
    note: { zh: "成人 / 小孩（身高 1.1 米以下）同价，自费自愿参加。", en: "Same price for adults and children under 1.1 m. Optional, paid separately." },
  },

  food: {
    chaoshan: [
      { zh: "姜薯甜汤", en: "Ginger Sweet Soup", emoji: "🍠" },
      { zh: "无米粿", en: "Wumi Guo (rice-free dumpling)", emoji: "🥟" },
      { zh: "鸭母捻", en: "Duck Mother Nian (glutinous rice dessert)", emoji: "🍡" },
      { zh: "冬至丸", en: "Winter Solstice Rice Balls", emoji: "⚪" },
      { zh: "潮州粿条", en: "Chaozhou Kway Teow", emoji: "🍜" },
      { zh: "牛肉火锅", en: "Chaoshan Beef Hot Pot", emoji: "🍲",
        image: "assets/img/chaoshan-beef-hot-pot-at-baheli-haiji-zgc1-20221003132726.jpg", imageCredit: "N509FZ, CC BY-SA 4.0" },
      { zh: "潮州卤水拼盘", en: "Chaozhou Braised Platter", emoji: "🍖" },
      { zh: "潮州牛肉丸", en: "Chaozhou Beef Balls", emoji: "🥩" },
      { zh: "潮州鱼丸", en: "Chaozhou Fish Balls", emoji: "🐟" },
      { zh: "潮汕蚝烙", en: "Chaoshan Oyster Omelette", emoji: "🦪" },
      { zh: "鹅肉宴", en: "Goose Feast", emoji: "🪿" },
    ],
    cantonese: [
      { zh: "白切鸡", en: "White Cut Chicken", emoji: "🐔" },
      { zh: "蜜汁叉烧", en: "Honey BBQ Pork (Char Siu)", emoji: "🍯",
        image: "assets/img/char-siu-pieces.jpg", imageCredit: "Michael, Public domain" },
      { zh: "广东烧鹅", en: "Cantonese Roast Goose", emoji: "🦢" },
      { zh: "广式早茶点心", en: "Yum Cha · Dim Sum", emoji: "🥢",
        image: "assets/img/three-dim-sum-in-steamer-basket.jpg", imageCredit: "Mshuang2, CC0" },
      { zh: "功夫茶", en: "Kung Fu Tea", emoji: "🍵" },
      { zh: "乳鸽", en: "Young Pigeon", emoji: "🕊️" },
    ],
  },

  highlights: [
    { icon: "🏨", zh: "全程入住网评五钻酒店", en: "5-diamond rated hotels (online rating) all the way" },
    { icon: "🎬", zh: "电影《给阿嬷的情书》取景地", en: "Film locations of “A Love Letter to Grandma”" },
    { icon: "🍲", zh: "潮汕美食 + 粤菜体验", en: "Chaoshan & Cantonese food experiences" },
    { icon: "🤖", zh: "机器人餐厅", en: "Robot restaurant in Shenzhen" },
  ],

  includes: [
    { icon: "✈️", zh: "深圳航空往返机票，托运 23kg + 手提 5kg", en: "Round-trip Shenzhen Airlines ticket, 23 kg checked + 5 kg cabin baggage" },
    { icon: "🏨", zh: "6 晚当地五星酒店住宿，含早餐", en: "6 nights in local 5-star hotels with breakfast" },
    { icon: "🧑‍💼", zh: "中文 / 英文导游", en: "Chinese & English speaking local guide" },
    { icon: "🎟️", zh: "行程中所列的游览、门票、餐食和接送", en: "Tours, entrances, meals and transfers as listed" },
    { icon: "💁", zh: "导游 & 司机小费", en: "Tour guide & driver tipping" },
  ],
  excludes: [
    { icon: "🛂", zh: "签证（如需）", en: "Visa, if required" },
    { icon: "🛡️", zh: "旅游保险（强烈建议）", en: "Travel insurance (highly recommended)" },
    { icon: "🎭", zh: "自费项目 A / B", en: "Optional tours A / B" },
  ],
  remarks: [
    { zh: "必进购物店 2 站：达仁堂、生活馆", en: "2 compulsory shopping stops: Darentang and Lifestyle Gallery" },
    { zh: "出发日期前两周内确认行程", en: "Tour is confirmed no later than 2 weeks before departure" },
    { zh: "团体机位由航空公司协调和分配，座位无法更改", en: "Group seats are assigned by the airline and can't be changed" },
    { zh: "特殊要求或额外服务可能收取行政费用", en: "Special requests or extra services may incur an admin fee" },
    { zh: "修改或取消可能产生修改费、取消费和行政费用", en: "Amendments or cancellations may incur fees" },
    { zh: "以上所有条款均受出入境政策限制", en: "All of the above is subject to border measures" },
    { zh: "单人入住需支付单房差", en: "Single supplement applies for single occupancy" },
    { zh: "因不可控因素，行程或航班时间可能更改", en: "Itinerary or flight times may change due to circumstances beyond control" },
    { zh: "为确保行程顺利，行程顺序可能会有所调整", en: "The order of the itinerary may be adjusted for smooth running" },
    { zh: "只有当旅行团人数达到或超过 20 人时，才会指派领队助理", en: "A tour leader assistant joins only for groups of 20 or more" },
  ],

  contacts: [
    { name: "Wilson", role: { zh: "旅行社", en: "Agency" }, phone: "+60198846186", display: "019-884 6186" },
    { name: "Amy", role: { zh: "行程编制", en: "Prepared the trip" }, phone: "+60196633399", display: "019-663 3399" },
    { name: { zh: "办公室", en: "Office" }, role: { zh: "美里总部", en: "Miri HQ" }, phone: "+6085428899", display: "085-428 899" },
  ],
  agency: {
    name: "Brighton Travel & Tour Sdn Bhd",
    address: "Unit 06, Ground Floor, Jalan Merbau, Soon Hup Tower, 98000 Miri, Sarawak",
    website: "https://www.brightontt.com",
  },

  // My own prep list (not from the brochure) — ticked items are saved on the phone.
  packing: [
    { zh: "护照（有效期 6 个月以上）", en: "Passport (6+ months validity)" },
    { zh: "确认签证 / 免签要求", en: "Check visa / visa-free entry rules" },
    { zh: "旅游保险", en: "Travel insurance" },
    { zh: "支付宝 / 微信支付绑定国际卡", en: "Alipay / WeChat Pay linked to your card" },
    { zh: "少量人民币现金", en: "Some RMB cash" },
    { zh: "转换插头（中国 A / I 型，220V）", en: "Plug adapter (China type A / I, 220 V)" },
    { zh: "充电宝（需在手提行李）", en: "Power bank (cabin bag only)" },
    { zh: "漫游 / eSIM 数据", en: "Roaming / eSIM data" },
    { zh: "好走的鞋 + 雨伞", en: "Comfy walking shoes + umbrella" },
    { zh: "自费项目预算（RMB 298 / 300）", en: "Budget for optional tours (RMB 298 / 300)" },
  ],

  // Rough lat/lng of each overnight city for the route map.
  cities: [
    { zh: "深圳", en: "Shenzhen", lat: 22.543, lng: 114.058, nights: [1] },
    { zh: "汕尾", en: "Shanwei", lat: 22.786, lng: 115.375, nights: [] },
    { zh: "潮州", en: "Chaozhou", lat: 23.657, lng: 116.622, nights: [2] },
    { zh: "揭阳", en: "Jieyang", lat: 23.549, lng: 116.373, nights: [3] },
    { zh: "惠州", en: "Huizhou", lat: 23.112, lng: 114.416, nights: [] },
    { zh: "广州", en: "Guangzhou", lat: 23.129, lng: 113.264, nights: [4] },
    { zh: "佛山", en: "Foshan", lat: 23.022, lng: 113.121, nights: [5] },
    { zh: "中山", en: "Zhongshan", lat: 22.517, lng: 113.392, nights: [6] },
  ],
  // Order the coach travels through the cities (indexes into `cities`), ending back at Shenzhen airport.
  routeOrder: [0, 1, 2, 3, 4, 5, 6, 7, 0],

  imageSource: "Photos: Wikimedia Commons (credits on each photo)",
};

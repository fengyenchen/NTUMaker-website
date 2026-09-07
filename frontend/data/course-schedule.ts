export type CourseSession = {
  id?: string;
  week: string;
  title: string;
  summary: string;
  assets: string[];
  isPublic?: boolean;
  startsAt?: string;
};

export type CourseTrack = {
  id: string;
  day: string;
  time: string;
  title: string;
  description: string;
  sessions: CourseSession[];
};

// 社博課程表的前端假資料；接上 FastAPI 後改由課程 API 提供。
export const courseInfo = {
  semester: "115-1",
  startsOn: "9 月 15 日",
  time: "19:00–21:00",
  location: "學新館 523",
  fee: "500 元",
};

export const courseTracks: CourseTrack[] = [
  {
    id: "tuesday",
    day: "星期二",
    time: courseInfo.time,
    title: "Arduino 循線車專案",
    description: "新手友善的連貫專案，從原理、電路與程式一路完成機構、競賽及成果發表。",
    sessions: [
      { week: "第 2 週", title: "迎新", summary: "認識社團、課程路線與本學期專案。", assets: ["迎新簡報"], isPublic: true },
      { week: "第 3 週", title: "學理", summary: "建立循線車會使用到的基礎觀念。", assets: ["課程講義", "上課影片"] },
      { week: "第 4–5 週", title: "電路", summary: "認識元件、接線與感測器輸入。", assets: ["課程講義", "上課影片", "接線圖"] },
      { week: "第 6–7 週", title: "程式", summary: "撰寫控制邏輯，讓循線車依感測結果行動。", assets: ["課程講義", "上課影片", "範例程式"] },
      { week: "第 9–10 週", title: "彈性", summary: "整合前半學期內容並處理各組進度。", assets: ["除錯筆記", "上課影片"] },
      { week: "第 11–12 週", title: "機構", summary: "完成車體結構、固定方式與零件配置。", assets: ["課程講義", "上課影片", "製作檔案"] },
      { week: "第 13–14 週", title: "競賽", summary: "測試、調校並完成循線車競賽。", assets: ["競賽規則", "測試紀錄"] },
      { week: "第 15 週", title: "發表會", summary: "整理作品歷程並進行成果展示。", assets: ["發表模板", "成果影片"] },
    ],
  },
  {
    id: "friday",
    day: "星期五",
    time: courseInfo.time,
    title: "主題工作坊",
    description: "每場工作坊可獨立參加，針對一項技術完成可展示的實作。",
    sessions: [
      { week: "第 4–5 週", title: "工作坊 1：水晶球燈座", summary: "製作結合燈光與造型的桌上作品。", assets: ["工作坊教材", "示範影片", "製作檔案"] },
      { week: "第 6–7 週", title: "工作坊 2：IoT Project", summary: "讓裝置連上網路並傳送或接收資料。", assets: ["工作坊教材", "示範影片", "範例程式"] },
      { week: "第 9–10 週", title: "工作坊 3：放映機", summary: "從光學與機構概念完成簡易放映裝置。", assets: ["工作坊教材", "示範影片", "製作檔案"] },
      { week: "第 13–14 週", title: "工作坊 4：無人機", summary: "認識飛行原理、控制與安全操作。", assets: ["工作坊教材", "示範影片", "安全須知"] },
    ],
  },
];

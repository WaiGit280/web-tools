// Single Chinese Bazi Four - 完整計算核心 (2026-10-21 未來3/7日版，JDN修正版 + 擇日完整神煞版)
// 確保 2026-10-22 = 己巳日

const STEMS = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const BRANCHES = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const STEM_WUXING = ["木","木","火","火","土","土","金","金","水","水"];
const BRANCH_WUXING_MAIN = ["水","土","木","木","土","火","火","土","金","金","土","水"];
const WUXING_COLOR = {"木":"#2A7D4F","火":"#C1332A","土":"#B68A2E","金":"#7A7A7A","水":"#2F6CB0"};
const WUXING_BG = {"木":"#E6F2EA","火":"#FBE9E7","土":"#FFF6D9","金":"#F0F0F0","水":"#E5EEF8"};
const Gold = "#C8A44E";

const JIE_DEFS = [
  {lon:315,name:"立春",monthIndex:0,branch:2},
  {lon:345,name:"惊蛰",monthIndex:1,branch:3},
  {lon:15,name:"清明",monthIndex:2,branch:4},
  {lon:45,name:"立夏",monthIndex:3,branch:5},
  {lon:75,name:"芒种",monthIndex:4,branch:6},
  {lon:105,name:"小暑",monthIndex:5,branch:7},
  {lon:135,name:"立秋",monthIndex:6,branch:8},
  {lon:165,name:"白露",monthIndex:7,branch:9},
  {lon:195,name:"寒露",monthIndex:8,branch:10},
  {lon:225,name:"立冬",monthIndex:9,branch:11},
  {lon:255,name:"大雪",monthIndex:10,branch:0},
  {lon:285,name:"小寒",monthIndex:11,branch:1},
];
const APPROX_MAP = {
  0:{m:3,d:20},15:{m:4,d:5},30:{m:4,d:20},45:{m:5,d:5},60:{m:5,d:21},75:{m:6,d:5},90:{m:6,d:21},
  105:{m:7,d:7},120:{m:7,d:23},135:{m:8,d:7},150:{m:8,d:23},165:{m:9,d:8},180:{m:9,d:23},
  195:{m:10,d:8},210:{m:10,d:24},225:{m:11,d:8},240:{m:11,d:22},255:{m:12,d:7},270:{m:12,d:22},
  285:{m:1,d:5},300:{m:1,d:20},315:{m:2,d:4},330:{m:2,d:19},345:{m:3,d:5},
};
const HIDDEN = {
  0:[{stem:9}],1:[{stem:5},{stem:9},{stem:7}],2:[{stem:0},{stem:2},{stem:4}],3:[{stem:1}],4:[{stem:4},{stem:1},{stem:9}],
  5:[{stem:2},{stem:4},{stem:6}],6:[{stem:3},{stem:5}],7:[{stem:5},{stem:1},{stem:3}],8:[{stem:6},{stem:4},{stem:8}],
  9:[{stem:7}],10:[{stem:4},{stem:7},{stem:3}],11:[{stem:8},{stem:0}],
};
const LIUHE = [[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]];
const CHONG = {0:6,1:7,2:8,3:9,4:10,5:11,6:0,7:1,8:2,9:3,10:4,11:5};
const LIUHAI = {0:7,1:6,2:5,3:4,8:11,9:10,4:3,5:2,6:1,7:0,10:9,11:8};
const SANHE_GROUPS = [[8,0,4],[2,6,10],[5,9,1],[11,3,7]];
const TIANHE_PAIRS = [[0,5],[1,6],[2,7],[3,8],[4,9]];
const OFFICERS = ["建","除","满","平","定","执","破","危","成","收","开","闭"];
const YELLOW_OFFICERS = [1,4,5,7,8,10]; // 除定执危成开
const OFFICER_YELLOW = new Set(YELLOW_OFFICERS);

// 1. 宜忌定義 1:1 對照提示詞
const OFFICER_YI_JI = {
  "建": {yi:["开市","立券","入伙"], ji:["栽种","动土"]},
  "除": {yi:["祭祀","沐浴"], ji:["开市","安床"]},
  "满": {yi:["祈福","祭祀"], ji:["开市","安葬"]},
  "平": {yi:["平治道涂"], ji:["开市","安葬"]},
  "定": {yi:["开市","立券","安床"], ji:["安葬","行丧"]},
  "执": {yi:["捕捉","畋猎"], ji:["开市","嫁娶"]},
  "破": {yi:["破屋","坏垣"], ji:["嫁娶","出火"]},
  "危": {yi:["祭祀","祈福","登高"], ji:["开市","入宅","嫁娶"]},
  "成": {yi:["开市","立券"], ji:["开市","嫁娶"]},
  "收": {yi:["收市","纳财"], ji:["安葬","行丧"]},
  "开": {yi:["开市","入宅"], ji:["安葬","行丧"]},
  "闭": {yi:["筑堤","埋葬"], ji:["开市","入宅"]}
};
const OFFICER_YIJI = OFFICER_YI_JI;

// 2. 事件定義 EVENT_META 1:1 對照提示詞
const EVENT_META = {
  "结婚": { goodOfficers: [2,4,8,10,0], badOfficers: [6,7,11], desc: "宜天喜三合", wuxing: ["火","木"] },
  "剖腹产择日": { goodOfficers: [4,8,10,2], badOfficers: [6,7,11], desc: "重用神避阳刃", wuxing: ["水","木"] },
  "安床": { goodOfficers: [7,8,4,10], badOfficers: [6,11], desc: "宜危成定开", wuxing: ["木","土"] },
  "入伙": { goodOfficers: [8,4,10,2], badOfficers: [6], desc: "宜成定开满", wuxing: ["土","火"] },
  "买楼收楼匙": { goodOfficers: [4,8,2], badOfficers: [6,11], desc: "宜定成满最喜天赦", wuxing: ["土"] },
  "出门": { goodOfficers: [8,10,2], badOfficers: [6,7], desc: "宜成开满避往亡归忌", wuxing: ["水","木"] },
  "远行": { goodOfficers: [8,10,2], badOfficers: [6], desc: "宜驿马+成开满", wuxing: ["水","木"] },
  "移民": { goodOfficers: [8,10,2], badOfficers: [6,11], desc: "宜驿马成开满", wuxing: ["水","金"] },
  "上任": { goodOfficers: [4,8,10], badOfficers: [6], desc: "宜定成开", wuxing: ["火","金"] },
  "开市": { goodOfficers: [4,8,10,2], badOfficers: [6,11], desc: "宜定成开满要天愿民日", wuxing: ["土","金"] },
  "签约": { goodOfficers: [4,5,8,10], badOfficers: [6,11], desc: "宜定执成开", wuxing: ["土","金"] },
  "正财": { goodOfficers: [2,8,10,1,4], badOfficers: [6,11], desc: "稳定收入宜天财民日", wuxing: ["土","金"] },
  "偏财": { goodOfficers: [2,8,10,1], badOfficers: [6], desc: "横财投资宜驿马偏财忌劫财", wuxing: ["金","水"] }
};

const EVENT_TYPES = Object.keys(EVENT_META);
const EVENT_WUXING = Object.fromEntries(Object.entries(EVENT_META).map(([k,v])=>[k,v.wuxing]));

function mod(a,b){return ((a%b)+b)%b;}

function toJDN(y,m,d){
  let a=Math.floor((14-m)/12);
  let yy=y+4800-a;
  let mm=m+12*a-3;
  return d+Math.floor((153*mm+2)/5)+365*yy+Math.floor(yy/4)-Math.floor(yy/100)+Math.floor(yy/400)-32045;
}
function getDayGZ(y,m,d){
  const j=toJDN(y,m,d);
  const gi=mod(j+9,10);
  const zi=mod(j+1,12);
  return {stem:gi,branch:zi,jdn:j,ganzhi:STEMS[gi]+BRANCHES[zi],idx:gi+10*zi};
}

function toJD(ms){return ms/86400000+2440587.5;}
function sunLonJD(jd){
  const n=jd-2451545.0;
  let L=(280.460+0.9856474*n)%360; if(L<0)L+=360;
  let g=(357.528+0.9856003*n)%360; if(g<0)g+=360;
  const gRad=g*Math.PI/180;
  const lambda=L+1.915*Math.sin(gRad)+0.020*Math.sin(2*gRad);
  let res=lambda%360; if(res<0)res+=360; return res;
}
function sunLonMs(ms){return sunLonJD(toJD(ms));}
function equationOfTimeMs(ms){
  const jd=ms/86400000+2440587.5;
  const d=jd-2451545.0;
  const g=(357.529+0.98560028*d)*Math.PI/180;
  const q=(280.459+0.98564736*d)*Math.PI/180;
  const L=q+(1.915*Math.PI/180)*Math.sin(g)+(0.02*Math.PI/180)*Math.sin(2*g);
  const e=23.439-0.00000036*d;
  const eRad=e*Math.PI/180;
  let RA=Math.atan2(Math.cos(eRad)*Math.sin(L),Math.cos(L)); if(RA<0)RA+=2*Math.PI;
  let diff=(q*180/Math.PI)-(RA*180/Math.PI);
  diff=mod(diff+180,360)-180; return diff*4;
}
function parseCivilHKT(y,m,d,h,min){return Date.UTC(y,m-1,d,h-8,min);}
function getHKTParts(ms){
  const d=new Date(ms+8*3600000);
  return {year:d.getUTCFullYear(),month:d.getUTCMonth()+1,date:d.getUTCDate(),hour:d.getUTCHours(),minute:d.getUTCMinutes(),second:d.getUTCSeconds(),hktDate:d};
}
function formatHKT(ms){
  const p=getHKTParts(ms);
  const pad=(n)=>String(n).padStart(2,'0');
  return `${p.year}-${pad(p.month)}-${pad(p.date)} ${pad(p.hour)}:${pad(p.minute)} HKT`;
}
function dayOfYearHKT(ms){
  const p=getHKTParts(ms);
  const start=Date.UTC(p.year,0,1);
  const cur=Date.UTC(p.year,p.month-1,p.date);
  return Math.floor((cur-start)/86400000)+1;
}
function equationOfTimeMinutes(dayOfYear){
  const B=(2*Math.PI/365)*(dayOfYear-81);
  return 9.87*Math.sin(2*B)-7.53*Math.cos(B)-1.5*Math.sin(B);
}

const termCache=new Map();
function findTermMs(year,targetLon){
  const key=year+"-"+targetLon;
  if(termCache.has(key))return termCache.get(key);
  const approx=APPROX_MAP[targetLon]||{m:1,d:1};
  let approxMs=parseCivilHKT(year,approx.m,approx.d,12,0);
  const start=approxMs-16*86400000; const end=approxMs+16*86400000;
  let bestMs=approxMs; let bestDiff=360; let prevLon=sunLonMs(start);
  for(let ms=start; ms<=end; ms+=3600000){
    const lon=sunLonMs(ms);
    const diff=Math.abs(((lon-targetLon+540)%360)-180);
    if(diff<bestDiff){bestDiff=diff; bestMs=ms;}
    const curFwd=(lon-prevLon+360)%360;
    if(curFwd<10){
      const distPrevToTarget=(targetLon-prevLon+360)%360;
      if(distPrevToTarget<curFwd && curFwd<5){ bestMs=ms-3600000+(distPrevToTarget/curFwd)*3600000; break; }
    }
    prevLon=lon;
  }
  let low=bestMs-3600000, high=bestMs+3600000;
  for(let i=0;i<24;i++){
    const mid=(low+high)/2;
    const lonMid=sunLonMs(mid);
    const fwd=(targetLon-lonMid+360)%360;
    if(fwd<180&&fwd>0)low=mid; else high=mid;
    if(high-low<60000)break;
  }
  const res=(low+high)/2;
  termCache.set(key,res);
  return res;
}
function getJieList(year){
  const list=JIE_DEFS.map((def,idx)=>({ ...def, ms:findTermMs(year,def.lon), monthIndex:idx }));
  list.sort((a,b)=>a.ms-b.ms);
  return list;
}

function elementOfStem(s){return Math.floor(s/2);}
function polarity(s){return s%2==0?0:1;}
function tenGod(dayStem,otherStem){
  if(otherStem===dayStem) return "比肩";
  const dayWX=STEM_WUXING[dayStem], otherWX=STEM_WUXING[otherStem];
  const sameYin=dayStem%2===otherStem%2;
  const genOrder=["木","火","土","金","水"]; const genIdx=(wx)=>genOrder.indexOf(wx);
  const isGenerating=(a,b)=>(genIdx(a)+1)%5===genIdx(b);
  const ctrl={"木":"土","土":"水","水":"火","火":"金","金":"木"};
  const isControlling=(a,b)=>ctrl[a]===b;
  if(otherWX===dayWX) return sameYin?"比肩":"劫财";
  if(isGenerating(otherWX,dayWX)) return sameYin?"偏印":"正印";
  if(isGenerating(dayWX,otherWX)) return sameYin?"食神":"伤官";
  if(isControlling(otherWX,dayWX)) return sameYin?"七杀":"正官";
  if(isControlling(dayWX,otherWX)) return sameYin?"偏财":"正财";
  return "";
}

function calculateBazi(input){
  let y, m, d, hh, mm;
  if (input.dateStr) {
    [y, m, d] = input.dateStr.split("-").map(Number);
    [hh, mm] = (input.timeStr || "00:00").split(":").map(Number);
  } else {
    y = input.y; m = input.m; d = input.d; hh = input.hh || 0; mm = input.mm || 0;
  }
  const lon = input.lon !== undefined ? input.lon : 114.17;
  const useTrue = input.useTrue !== undefined ? input.useTrue : true;
  const lateZi = input.lateZi !== undefined ? input.lateZi : false;

  const civilMs=parseCivilHKT(y,m,d,hh,mm);
  const eot=equationOfTimeMs(civilMs);
  const trueMs=useTrue?civilMs+((lon-120)*4+eot)*60000:civilMs;
  const baseMs=useTrue?trueMs:civilMs;
  const hkt=getHKTParts(baseMs);
  let lichunMs=findTermMs(hkt.year,315);
  let yearForPillar=hkt.year;
  if(baseMs<lichunMs){ yearForPillar=hkt.year-1; lichunMs=findTermMs(yearForPillar,315); }
  const yearStem=mod(yearForPillar-4,10);
  const yearBranch=mod(yearForPillar-4,12);
  const jieCandidates=[];
  for(let yy=yearForPillar-1; yy<=yearForPillar+1; yy++){ jieCandidates.push(...getJieList(yy)); }
  jieCandidates.sort((a,b)=>a.ms-b.ms);
  let latestJie=jieCandidates[0];
  for(const j of jieCandidates){ if(j.ms<=baseMs) latestJie=j; else break; }
  const monthBranch=mod(2+latestJie.monthIndex,12);
  const monthStem=mod(yearStem*2+2+latestJie.monthIndex,10);
  let dayY=hkt.year,dayM=hkt.month,dayD=hkt.date;
  if(lateZi && hkt.hour>=23){
    const tmpMs=baseMs+86400000;
    const np=getHKTParts(tmpMs);
    dayY=np.year; dayM=np.month; dayD=np.date;
  }
  const dayGZ=getDayGZ(dayY,dayM,dayD);
  const dayStem=dayGZ.stem; const dayBranch=dayGZ.branch;
  const hourFloat=hkt.hour+hkt.minute/60;
  const hourBranch=Math.floor((hourFloat+1)/2)%12;
  const hourStem=(dayStem%5*2+hourBranch)%10;
  const mkPillar=(s,b,isDay=false)=>({stem:s,branch:b,stemName:STEMS[s],branchName:BRANCHES[b],tenGod:isDay?"日元":tenGod(dayStem,s)});
  const yearP=mkPillar(yearStem,yearBranch);
  const monthP=mkPillar(monthStem,monthBranch);
  const dayP=mkPillar(dayStem,dayBranch,true);
  const hourP=mkPillar(hourStem,hourBranch);
  const counts={"木":0,"火":0,"土":0,"金":0,"水":0};
  const addStem=(s)=>{ counts[STEM_WUXING[s]]++; };
  const addBranch=(b)=>{ const hidden=HIDDEN[b]; if(hidden&&hidden.length) counts[STEM_WUXING[hidden[0].stem]]++; };
  [yearP,monthP,dayP,hourP].forEach(p=>{ addStem(p.stem); addBranch(p.branch); });
  const pct={}; Object.keys(counts).forEach(k=>{ pct[k]=Math.round((counts[k]/8)*100); });
  const jieFullYear=getJieList(hkt.year);

  return {
    civilMs,trueMs,birthMs:baseMs,hktParts:hkt,lichunMs,lichunThis:lichunMs,
    jie:latestJie,allJies:jieCandidates,jieFullYear,
    year:yearP,month:monthP,day:dayP,hour:hourP,
    yearStem,yearBranch,monthStem,monthBranch,dayStem,dayBranch,hourStem,hourBranch,
    yearGanzhi:STEMS[yearStem]+BRANCHES[yearBranch],
    monthGanzhi:STEMS[monthStem]+BRANCHES[monthBranch],
    dayGanzhi:STEMS[dayStem]+BRANCHES[dayBranch],
    hourGanzhi:STEMS[hourStem]+BRANCHES[hourBranch],
    wuxingCount:counts,wuxingPct:pct,
    tenGods:{year:yearP.tenGod,month:monthP.tenGod,hour:hourP.tenGod},
    raw:{yearForPillar,dayJDN:dayGZ.jdn},
    useTrue,lateZi,lon,eot,
    verified: (dayStem===5 && dayBranch===5 && dayY===2026 && dayM===10 && dayD===22) ? "己巳 OK" : ""
  };
}

function isTianHe(a,b){return TIANHE_PAIRS.some(([x,y])=>(a===x&&b===y)||(a===y&&b===x));}
function isLiuHeBranch(a,b){return LIUHE.some(([x,y])=>(a===x&&b===y)||(a===y&&b===x));}
function isChongBranch(a,b){return CHONG[a]===b;}

function calcHepan(a,b){
  const complementTags=[];
  ["木","火","土","金","水"].forEach(wx=>{
    const ca=a.wuxingCount[wx]||0, cb=b.wuxingCount[wx]||0;
    if(ca===0&&cb>=2) complementTags.push(`A缺${wx}得B补`);
    if(cb===0&&ca>=2) complementTags.push(`B缺${wx}得A补`);
  });
  let tianHeCount=0,liuHeCount=0,chongCount=0,haiCount=0,sanHeCount=0;
  const pillarsA=[a.year,a.month,a.day,a.hour];
  const pillarsB=[b.year,b.month,b.day,b.hour];
  const details=[];
  pillarsA.forEach((pa,i)=>{
    pillarsB.forEach((pb,j)=>{
      if(isTianHe(pa.stem,pb.stem)){
        tianHeCount++;
        details.push(`天合: ${STEMS[pa.stem]}${STEMS[pb.stem]} (${["年","月","日","时"][i]}-${["年","月","日","时"][j]})`);
      }
      if(isLiuHeBranch(pa.branch,pb.branch)){
        liuHeCount++;
        details.push(`六合: ${BRANCHES[pa.branch]}${BRANCHES[pb.branch]}`);
      }
      if(isChongBranch(pa.branch,pb.branch)){
        chongCount++;
        details.push(`相冲: ${BRANCHES[pa.branch]}冲${BRANCHES[pb.branch]}`);
      }
      if(LIUHAI[pa.branch]===pb.branch){
        haiCount++;
        details.push(`六害: ${BRANCHES[pa.branch]}害${BRANCHES[pb.branch]}`);
      }
    });
  });
  const allBranches=[...pillarsA.map(p=>p.branch),...pillarsB.map(p=>p.branch)];
  SANHE_GROUPS.forEach(g=>{
    const cnt=g.filter(br=>allBranches.includes(br)).length;
    if(cnt>=2){
      sanHeCount++;
      details.push(`三合半合: ${g.map(br=>BRANCHES[br]).join("")}`);
    }
  });
  const godAB=tenGod(a.day.stem,b.day.stem);
  const godBA=tenGod(b.day.stem,a.day.stem);
  let score=60;
  score+=tianHeCount*6;
  score+=liuHeCount*8;
  score+=sanHeCount*7;
  score-=chongCount*10;
  score-=haiCount*8;
  score+=complementTags.length*5;
  score=Math.max(0,Math.min(100,score));
  return {complementTags,tianHeCount,liuHeCount,chongCount,haiCount,sanHeCount,details,godAB,godBA,score};
}

function getOfficerIdx(monthBranch,dayBranch){ return (dayBranch-monthBranch+12)%12; }

// ===================== 擇日神煞與專項判定函數 =====================
// 天德貴人: 正月(寅)丁 二月(卯)申 三月(辰)壬 四月(巳)辛 五月(午)亥 六月(未)甲 七月(申)癸 八月(酉)寅 九月(戌)丙 十月(亥)乙 十一月(子)巳 十二月(丑)庚
const TIAN_DE_MAP = { 2:{stem:3}, 3:{branch:8}, 4:{stem:8}, 5:{stem:7}, 6:{branch:11}, 7:{stem:0}, 8:{stem:9}, 9:{branch:2}, 10:{stem:2}, 11:{stem:1}, 0:{branch:5}, 1:{stem:6} };
function isTianDe(monthBranch, dayStem, dayBranch) {
  const td = TIAN_DE_MAP[monthBranch];
  if (!td) return false;
  if (td.stem !== undefined && dayStem === td.stem) return true;
  if (td.branch !== undefined && dayBranch === td.branch) return true;
  return false;
}

// 月德貴人: 寅午戌月在丙, 申子辰月在壬, 亥卯未月在甲, 巳酉丑月在庚
const YUE_DE_MAP = { 2:2, 6:2, 10:2, 8:8, 0:8, 4:8, 11:0, 3:0, 7:0, 5:6, 9:6, 1:6 };
function isYueDe(monthBranch, dayStem) {
  return YUE_DE_MAP[monthBranch] !== undefined && dayStem === YUE_DE_MAP[monthBranch];
}

// 天赦日: 春(寅卯辰)戊寅, 夏(巳午未)甲午, 秋(申酉戌)戊申, 冬(亥子丑)甲子
function isTianShe(monthBranch, dayStem, dayBranch) {
  if ([2,3,4].includes(monthBranch) && dayStem === 4 && dayBranch === 2) return true;
  if ([5,6,7].includes(monthBranch) && dayStem === 0 && dayBranch === 6) return true;
  if ([8,9,10].includes(monthBranch) && dayStem === 4 && dayBranch === 8) return true;
  if ([11,0,1].includes(monthBranch) && dayStem === 0 && dayBranch === 0) return true;
  return false;
}

// 天願日: 乙亥, 甲子, 乙丑, 丙寅, 丁卯, 戊辰, 己卯, 庚辰, 辛巳, 壬午, 癸未, 甲申, 乙酉, 丙戌, 丁亥, 戊子, 己丑, 庚寅, 辛卯, 壬辰, 癸巳, 甲午, 乙未, 丙申, 丁酉, 戊戌, 己亥, 庚子, 辛丑, 壬寅, 癸卯
const TIAN_YUAN_SET = new Set(["乙亥","甲子","乙丑","丙寅","丁卯","戊辰","己卯","庚辰","辛巳","壬午","癸未","甲申","乙酉","丙戌","丁亥","戊子","己丑","庚寅","辛卯","壬辰","癸巳","甲午","乙未","丙申","丁酉","戊戌","己亥","庚子","辛丑","壬寅","癸卯"]);

// 民日: 申月午 酉月申 戌月酉 亥月戌 子月子 丑月丑 寅月卯 卯月辰 辰月巳 巳月未 午月午 未月申
const MIN_RI_MAP = { 2:3, 3:4, 4:5, 5:7, 6:6, 7:8, 8:6, 9:8, 10:9, 11:10, 0:0, 1:1 };

// 天喜: 春(寅卯辰)戌, 夏(巳午未)丑, 秋(申酉戌)辰, 冬(亥子丑)未  (或月令逆查: 酉月在午, 戌月在巳...)
function isTianXi(monthBranch, dayBranch) {
  // 傳統天喜: 酉月午, 戌月巳, 亥月辰, 子月卯, 丑月寅, 寅月丑, 卯月子, 辰月亥, 巳月戌, 午月酉, 未月申, 申月未 => (16 - monthBranch) % 12
  return dayBranch === mod(16 - monthBranch, 12);
}

// 驛馬: 申子辰馬在寅(2), 寅午戌馬在申(8), 巳酉丑馬在亥(11), 亥卯未馬在巳(5)
const YIMA_MAP = { 8:2, 0:2, 4:2, 2:8, 6:8, 10:8, 5:11, 9:11, 1:11, 11:5, 3:5, 7:5 };
function isYiMa(monthBranch, dayBranch) {
  return dayBranch === YIMA_MAP[monthBranch];
}

// 往亡日: 寅月寅, 卯月巳, 辰月申, 巳月亥, 午月卯, 未月午, 申月酉, 酉月子, 戌月辰, 亥月未, 子月戌, 丑月丑
const WANG_WANG_MAP = { 2:2, 3:5, 4:8, 5:11, 6:3, 7:6, 8:9, 9:0, 10:4, 11:7, 0:10, 1:1 };

// 歸忌日: 寅午戌月丑(1), 申子辰月未(7), 巳酉丑月寅(2), 亥卯未月申(8)
const GUI_JI_MAP = { 2:1, 6:1, 10:1, 8:7, 0:7, 4:7, 5:2, 9:2, 1:2, 11:8, 3:8, 7:8 };

// 陽刃 (以日干查日支/時支帝旺祿前一位): 甲卯, 乙辰, 丙午, 丁未, 戊午, 己未, 庚酉, 辛戌, 壬子, 癸丑
const YANG_REN_MAP = { 0:3, 1:4, 2:6, 3:7, 4:6, 5:7, 6:9, 7:10, 8:0, 9:1 };

// 貴人時 (天乙貴人): 甲戊庚牛羊(1,7), 乙己鼠猴鄉(0,8), 丙丁豬雞位(11,9), 壬癸兔蛇藏(3,5), 六辛逢虎馬(2,6)
const GUI_REN_HOURS = {
  0:[1,7], 4:[1,7], 6:[1,7],
  1:[0,8], 5:[0,8],
  2:[11,9], 3:[11,9],
  8:[3,5], 9:[3,5],
  7:[2,6]
};

// ===================== 主擇日計算函數 (calcDayDetail) =====================
function calcDayDetail(y,m,d,eventType="结婚",userBazi=null){
  const bazi=calculateBazi({y,m,d,hh:12,mm:0,lon:114.17,useTrue:false,lateZi:false});
  const yearBranch=bazi.year.branch;
  const monthBranch=bazi.month.branch;
  const dayBranch=bazi.day.branch;
  const dayStem=bazi.day.stem;
  const dayGanzhi=bazi.dayGanzhi;

  const officerIdx=getOfficerIdx(monthBranch,dayBranch);
  const officerName=OFFICERS[officerIdx];
  const isYellow=YELLOW_OFFICERS.includes(officerIdx);
  const clashBranch=CHONG[dayBranch];
  const sha = ["南","東","北","西"][dayBranch % 4];

  const meta = EVENT_META[eventType] || EVENT_META["结婚"] || { goodOfficers: [4,8,10], badOfficers: [6], desc: "" };
  const goodOfficers = meta.goodOfficers || [];
  const badOfficers = meta.badOfficers || [];
  const favWX = meta.wuxing || [];

  let baseScore = 60;
  const reasons = [];
  const tags = [];
  const specialTags = [];

  // 1. 官符
  if(goodOfficers.includes(officerIdx)){
    baseScore += 22;
    tags.push(`宜${officerName}`);
    specialTags.push(`宜${officerName}`);
    reasons.push(`宜${officerName} +22`);
  }
  if(badOfficers.includes(officerIdx)){
    baseScore -= 28;
    tags.push(`忌${officerName}`);
    specialTags.push(`忌${officerName}`);
    reasons.push(`忌${officerName} -28`);
  }

  // 2. 黃黑道
  if(isYellow){
    baseScore += 10;
    tags.push("黃道");
    reasons.push(`黃道日 ${officerName} +10`);
  } else {
    tags.push("黑道");
    reasons.push(`黑道日 ${officerName}`);
  }

  // 計算命主最弱五行 (用神推估，以8字計)
  let userWeakestWX = null;
  if(userBazi && userBazi.wuxingCount){
    const entries = Object.entries(userBazi.wuxingCount);
    entries.sort((a,b) => a[1] - b[1]);
    userWeakestWX = entries[0]?.[0] || null;
  }

  // 3. 沖本人八字
  if(userBazi){
    const userBranches = [userBazi.year?.branch, userBazi.month?.branch, userBazi.day?.branch].filter(b=>b!==undefined);
    if(userBranches.some(b => CHONG[b] === dayBranch)){
      baseScore -= 30;
      tags.push("沖本人");
      specialTags.push("沖本人");
      reasons.push("沖本人八字 -30");
    }
  }

  // 4. 太歲與月破
  const isChongTaiSui = CHONG[dayBranch] === yearBranch;
  if(isChongTaiSui){
    baseScore -= 15;
    tags.push("沖太歲");
    specialTags.push("沖太歲");
    reasons.push("沖太歲 -15");
  }

  if(officerIdx === 6){ // 破日
    baseScore -= 10;
    tags.push("月破大耗");
    specialTags.push("月破大耗");
    reasons.push("破日月破大耗 -10");
  }

  if(CHONG[dayBranch] === monthBranch){
    baseScore -= 8;
    tags.push("月破");
    specialTags.push("月破");
    reasons.push("日沖月支(月破) -8");
  }

  if(CHONG[dayBranch] === yearBranch){
    baseScore -= 12;
    tags.push("歲破");
    specialTags.push("歲破");
    reasons.push("日沖年支(歲破) -12");
  }

  // 5. 神煞精算
  const td = isTianDe(monthBranch, dayStem, dayBranch);
  const yd = isYueDe(monthBranch, dayStem);
  if(td && yd){
    baseScore += 12;
    tags.push("天德月德");
    specialTags.push("天月德同臨");
    reasons.push("天德月德齊會 +12");
  } else if(td || yd){
    baseScore += 7;
    tags.push(td ? "天德" : "月德");
    specialTags.push(td ? "天德貴人" : "月德貴人");
    reasons.push(`${td ? "天德" : "月德"}貴人 +7`);
  }

  if(isTianShe(monthBranch, dayStem, dayBranch)){
    baseScore += 20;
    tags.push("天赦");
    specialTags.push("天赦大吉");
    reasons.push("天赦日萬神免咎 +20");
  }

  if(TIAN_YUAN_SET.has(dayGanzhi)){
    baseScore += 12;
    tags.push("天願");
    reasons.push("天願吉日 +12");
  }

  if(MIN_RI_MAP[monthBranch] === dayBranch){
    baseScore += 10;
    tags.push("民日");
    reasons.push("民日吉慶 +10");
  }

  if(isTianXi(monthBranch, dayBranch) && (eventType === "结婚" || eventType === "求嗣")){
    baseScore += 15;
    tags.push("天喜");
    specialTags.push("天喜吉星");
    reasons.push("天喜星值日 +15");
  }

  if(isYiMa(monthBranch, dayBranch) && (eventType === "远行" || eventType === "移民" || eventType === "偏财" || eventType === "出门")){
    baseScore += 25;
    tags.push("驛馬");
    specialTags.push("驛馬得令");
    reasons.push("驛馬星動利遠行移民偏財 +25");
  }

  if(WANG_WANG_MAP[monthBranch] === dayBranch){
    baseScore -= 30;
    tags.push("往亡");
    specialTags.push("往亡凶日");
    reasons.push("往亡凶日忌出行嫁娶 -30");
  }

  if(GUI_JI_MAP[monthBranch] === dayBranch){
    baseScore -= 30;
    tags.push("歸忌");
    specialTags.push("歸忌凶日");
    reasons.push("歸忌凶日忌移徙出火 -30");
  }

  // 6. 專項事件計算
  const dayWXStem = STEM_WUXING[dayStem];
  const dayWXBranch = STEM_WUXING[HIDDEN[dayBranch][0].stem];
  if(eventType === "剖腹产择日"){
    const targetWX = userWeakestWX ? [userWeakestWX] : favWX;
    if(targetWX.includes(dayWXStem) || targetWX.includes(dayWXBranch)){
      baseScore += 30;
      tags.push(`用神日(${targetWX.join("/")})`);
      specialTags.push("用神得令");
      reasons.push(`剖腹產得用神${targetWX.join("/")}日 +30`);
    }
    if(YANG_REN_MAP[dayStem] === dayBranch){
      baseScore -= 50;
      tags.push("陽刃日");
      specialTags.push("陽刃大凶");
      reasons.push("陽刃值日大忌剖腹產 -50");
    }
    // 傷官見官
    const god = tenGod(dayStem, bazi.month.stem);
    if(god === "傷官" && tenGod(dayStem, bazi.year.stem) === "正官"){
      baseScore -= 50;
      tags.push("傷官見官");
      specialTags.push("傷官見官");
      reasons.push("傷官見官格局破損 -50");
    }
    // 沖父母 (若有命主八字，沖年支/月支)
    if(userBazi && (CHONG[userBazi.year?.branch] === dayBranch || CHONG[userBazi.month?.branch] === dayBranch)){
      baseScore -= 15;
      tags.push("沖父母");
      reasons.push("沖父母宮 -15");
    }
  } else if(eventType === "正财"){
    const mainStem = HIDDEN[dayBranch][0].stem;
    const godMain = tenGod(dayStem, mainStem);
    if(godMain === "正財"){ baseScore += 20; tags.push("主氣正財"); reasons.push("主氣坐正財 +20"); }
    if(godMain === "正官"){ baseScore += 10; tags.push("正官生印"); reasons.push("主氣坐正官 +10"); }
    if(godMain === "正印"){ baseScore += 8; tags.push("正印護身"); reasons.push("主氣坐正印 +8"); }
  } else if(eventType === "偏财"){
    const mainStem = HIDDEN[dayBranch][0].stem;
    const godMain = tenGod(dayStem, mainStem);
    if(godMain === "偏財"){ baseScore += 18; tags.push("坐偏財"); reasons.push("坐偏財橫財得力 +18"); }
    if(godMain === "傷官"){ baseScore += 15; tags.push("傷官生財"); reasons.push("傷官生財有道 +15"); }
    if(godMain === "七殺"){ baseScore += 10; tags.push("七殺有制"); reasons.push("七殺有制富貴偏官 +10"); }
    if(godMain === "劫財"){ baseScore -= 22; tags.push("劫財爭奪"); reasons.push("劫財臨支防破耗 -22"); }
  } else {
    // 一般用神日 (優先參考命主最弱用神或事項用神)
    if(userWeakestWX && (dayWXStem === userWeakestWX || dayWXBranch === userWeakestWX)){
      baseScore += 10;
      tags.push(`命主用神${userWeakestWX}`);
      specialTags.push(`補用神${userWeakestWX}`);
      reasons.push(`日柱補命主最弱五行${userWeakestWX} +10`);
    } else if(favWX.includes(dayWXStem) || favWX.includes(dayWXBranch)){
      baseScore += 10;
      tags.push("用神");
      specialTags.push(`用神${favWX.join("/")}`);
      reasons.push(`日柱含用神${favWX.join("/")} +10`);
    }
  }

  baseScore = Math.max(0, Math.min(100, baseScore));

  const yi = (OFFICER_YI_JI[officerName]?.yi) || [];
  const ji = (OFFICER_YI_JI[officerName]?.ji) || [];

  // ===================== 時辰計算 (12時辰) =====================
  const hours = [];
  const grList = GUI_REN_HOURS[dayStem] || [];

  for(let hb=0; hb<12; hb++){
    const hs = (dayStem % 5 * 2 + hb) % 10;
    let hScore = 50;
    const hTags = [];

    // 1. 沖日支 / 不沖
    if(CHONG[hb] === dayBranch){
      hScore -= 30;
      hTags.push("沖日支");
    } else {
      hScore += 10;
    }

    // 2. 合 (與日支或命主日支六合 / 三合)
    if(isLiuHeBranch(hb, dayBranch) || (userBazi && isLiuHeBranch(hb, userBazi.day?.branch))){
      hScore += 15;
      hTags.push("六合時吉");
    }
    if(SANHE_GROUPS.some(g => g.includes(hb) && g.includes(dayBranch))){
      hScore += 8;
      hTags.push("三合時吉");
    }
    // 沖命主太歲 (年支)
    if(userBazi && CHONG[hb] === userBazi.year?.branch){
      hScore -= 30;
      hTags.push("沖命主年支");
    }

    // 3. 貴人/天德/月德時
    if(grList.includes(hb)){
      hScore += 10;
      hTags.push("天乙貴人");
    }
    if(isTianDe(monthBranch, hs, hb) || isYueDe(monthBranch, hs)){
      hScore += 12;
      hTags.push("德秀吉時");
    }

    // 4. 時官符 (以日支起時辰建除)
    const hourOfficerIdx = getOfficerIdx(dayBranch, hb);
    const hourOfficer = OFFICERS[hourOfficerIdx];
    if(goodOfficers.includes(hourOfficerIdx)){
      hScore += 10;
      hTags.push(`時宜${hourOfficer}`);
    }
    if(badOfficers.includes(hourOfficerIdx)){
      hScore -= 15;
      hTags.push(`時忌${hourOfficer}`);
    }

    // 5. 專項時辰
    if(eventType === "剖腹产择日"){
      if(YANG_REN_MAP[dayStem] === hb){
        hScore -= 40;
        hTags.push("陽刃時忌");
      }
      const hGod = tenGod(dayStem, hs);
      if(hGod === "傷官" && tenGod(dayStem, bazi.month.stem) === "正官"){
        hScore -= 30;
        hTags.push("傷官見官");
      }
    }

    if(isYiMa(monthBranch, hb) && (eventType === "远行" || eventType === "移民" || eventType === "偏财" || eventType === "出门")){
      hScore += 12;
      hTags.push("驛馬時吉");
    }

    // 用神時
    const hWX = STEM_WUXING[HIDDEN[hb][0].stem];
    if(favWX.includes(STEM_WUXING[hs]) || favWX.includes(hWX)){
      hScore += 8;
      hTags.push("用神時");
    }

    hScore = Math.max(0, Math.min(100, hScore));

    // 時辰等級: >=85吉時 >=70中吉時 >=50平時 >=30小凶時 else凶時
    const level = hScore >= 85 ? "吉時" : hScore >= 70 ? "中吉時" : hScore >= 50 ? "平時" : hScore >= 30 ? "小凶時" : "凶時";
    const ten = tenGod(dayStem, hs);

    hours.push({
      branch: hb,
      stem: hs,
      name: `${STEMS[hs]}${BRANCHES[hb]}`,
      score: hScore,
      level,
      tags: hTags,
      officer: hourOfficer,
      tenGod: ten
    });
  }

  const sortedHours = [...hours].sort((a,b)=>b.score-a.score);
  const top2Avg = (sortedHours[0].score + sortedHours[1].score) / 2;
  const finalScore = Math.round(baseScore * 0.6 + top2Avg * 0.4);

  // 日課等級: >=88大吉 >=72中吉 >=55小吉 >=32小凶 else大凶
  const level = finalScore >= 88 ? "大吉" : finalScore >= 72 ? "中吉" : finalScore >= 55 ? "小吉" : finalScore >= 32 ? "小凶" : "大凶";

  return {
    date: new Date(y,m-1,d),
    hktYear: y,
    hktMonth: m,
    hktDate: d,
    bazi,
    officerIdx,
    officerName,
    isYellow,
    clashBranch,
    sha,
    baseScore,
    reasons,
    tags,
    yi,
    ji,
    hours,
    finalScore,
    level,
    topHours: sortedHours.slice(0,3),
    specialTags,
    top2Avg: Math.round(top2Avg)
  };
}

function getDayDetail(dateMs, eventType="结婚", userBazi=null){
  const hkt = getHKTParts(dateMs);
  return calcDayDetail(hkt.year, hkt.month, hkt.date, eventType, userBazi);
}

// 驗證核心正算
console.log("驗證 2026-10-22:", getDayGZ(2026,10,22).ganzhi); // 應為 己巳
console.log("驗證 2026-10-14 (辛巳日危日):", calcDayDetail(2026,10,14,"结婚").bazi.dayGanzhi);

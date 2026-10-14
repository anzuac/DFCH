/* Player-facing translations. Shared DFCH language setting; no separate preference. */
(()=>{'use strict';
const LANG=['zh_tw','zh_cn','ja','en','ko','th','vi'];
/* Key = original Traditional Chinese display phrase. Official ability and hero names also use DFCHOfficialLabels. */
const entries={
'英靈編隊':['英灵编队','英霊編成','Hero lineup','영령 편성','จัดทีมวีรชน','Đội hình anh linh'],
'清空編隊':['清空编队','編成をクリア','Clear lineup','편성 초기화','ล้างทีม','Xóa đội hình'],
'已編隊':['已编队','編成人数','Selected','편성','จัดทีมแล้ว','Đã chọn'],
'內容自動保存在這台瀏覽器':['内容自动保存在此浏览器','設定はこのブラウザーに自動保存されます','Saved automatically in this browser','이 브라우저에 자동 저장됨','บันทึกอัตโนมัติในเบราว์เซอร์นี้','Tự động lưu trong trình duyệt'],
'使用說明／注意事項':['使用说明／注意事项','使い方・注意事項','Help & notes','사용 안내 / 주의사항','วิธีใช้และข้อควรระวัง','Hướng dẫn và lưu ý'],
'神器設定':['神器设置','アーティファクト設定','Artifact settings','유물 설정','ตั้งค่าอาร์ติแฟกต์','Thiết lập bảo vật'],
'先選神器，再配置英靈；設定會自動保存':['先选神器，再配置英灵；设置自动保存','アーティファクト設定後、英霊を編成します。自動保存されます','Select artifacts first, then heroes. Changes save automatically.','유물 설정 후 영령을 편성하세요. 자동 저장됩니다.','เลือกอาร์ติแฟกต์ก่อนแล้วจัดทีม บันทึกอัตโนมัติ','Chọn bảo vật trước, rồi xếp anh linh. Tự động lưu'],
'禁斷守門人':['禁断守门人','禁断の門番','Forbidden gatekeeper','금단의 문지기','ผู้พิทักษ์ต้องห้าม','Người gác cổng cấm'],
'貪欲・額外寶箱':['贪欲・额外宝箱','強欲・追加宝箱','Greed · Bonus chests','탐욕 · 추가 상자','โลภ · หีบเพิ่มเติม','Tham lam · Rương thêm'],
'★禁斷的王冠':['★禁断的王冠','★禁断の王冠','★Forbidden Crown','★금단의 왕관','★มงกุฎต้องห้าม','★Vương miện cấm'],
'通往禁斷的媒介石':['通往禁断的媒介石','禁断への媒介石','Forbidden conduit stone','금단의 매개석','หินสื่อนำต้องห้าม','Đá môi giới cấm'],
'★介入者之咒輪':['★介入者之咒轮','★介入者の呪輪','★Intervener Ring','★개입자의 주륜','★วงแหวนผู้แทรกแซง','★Vòng nguyền can thiệp'],
'☆壞掉的回路':['☆坏掉的回路','☆壊れた回路','☆Broken Circuit','☆고장난 회로','☆วงจรชำรุด','☆Mạch hỏng'],
'★不可思議的回路':['★不可思议的回路','★不思議な回路','★Mysterious Circuit','★신비한 회로','★วงจรพิศวง','★Mạch kỳ bí'],
'★欲望之窺視鏡':['★欲望之窥视镜','★欲望の覗き鏡','★Mirror of Desire','★욕망의 거울','★กระจกแห่งความปรารถนา','★Gương dục vọng'],
'☆不祥的迴路':['☆不祥的回路','☆不吉な回路','☆Ominous Circuit','☆불길한 회로','☆วงจรอัปมงคล','☆Mạch điềm gở'],
'未持有':['未持有','未所持','Not owned','미보유','ไม่ได้ครอบครอง','Chưa sở hữu'],
'最遠距離':['最远距离','最長距離','Max distance','최대 거리','ระยะไกลสุด','Quãng đường xa nhất'],
'無法突破':['无法突破','進化不可','Cannot evolve','진화 불가','ไม่สามารถวิวัฒน์','Không tiến hóa'],
'突破':['突破','進化','Evolve','진화','วิวัฒน์','Tiến hóa'],
'關於出現率':['关于出现率','出現率について','Appearance rate','출현 확률','อัตราปรากฏตัว','Tỷ lệ xuất hiện'],
'基本出現率':['基本出现率','基本出現率','Base rate','기본 출현률','อัตราพื้นฐาน','Tỷ lệ cơ bản'],
'基礎機率':['基础概率','基本確率','Base probability','기본 확률','ความน่าจะเป็นพื้นฐาน','Xác suất cơ bản'],
'神器效果':['神器效果','神器効果','Artifact effect','유물 효과','ผลของอาร์ติแฟกต์','Hiệu ứng bảo vật'],
'能力效果':['能力效果','能力効果','Ability effect','능력 효과','ผลความสามารถ','Hiệu ứng kỹ năng'],
'活動效果':['活动效果','イベント効果','Event effect','이벤트 효과','ผลกิจกรรม','Hiệu ứng sự kiện'],
'總出現率':['总出现率','総出現率','Total appearance rate','총 출현률','อัตราปรากฏรวม','Tổng tỷ lệ xuất hiện'],
'禁斷的守門人':['禁断的守门人','禁断の門番','Forbidden Gatekeeper','금단의 문지기','ผู้พิทักษ์ต้องห้าม','Người gác cổng cấm'],
'編隊能力':['编队能力','編成能力','Lineup abilities','편성 능력','ความสามารถทีม','Kỹ năng đội hình'],
'守門人基本出現率':['守门人基本出现率','門番の基本出現率','Gatekeeper base rate','문지기 기본 출현률','อัตราพื้นฐานของผู้พิทักษ์','Tỷ lệ cơ bản người gác'],
'活動':['活动','イベント','Event','이벤트','กิจกรรม','Sự kiện'],
'貪欲・寶箱加成':['贪欲・宝箱加成','強欲・宝箱ボーナス','Greed · Chest bonus','탐욕 · 상자 보너스','โลภ · โบนัสหีบ','Tham lam · Thưởng rương'],
'英靈':['英灵','英霊','Heroes','영령','วีรชน','Anh linh'],
'神器':['神器','アーティファクト','Artifacts','유물','อาร์ติแฟกต์','Bảo vật'],
'搭配加成合計':['搭配加成合计','編成ボーナス合計','Combined bonus','합산 보너스','โบนัสรวม','Tổng thưởng kết hợp'],
'技能加成明細':['技能加成明细','能力補正の内訳','Ability breakdown','능력 상세','รายละเอียดโบนัส','Chi tiết cộng kỹ năng'],
'寶箱相關神器':['宝箱相关神器','宝箱関連の神器','Chest artifacts','상자 관련 유물','อาร์ติแฟกต์หีบ','Bảo vật rương'],
'放大檢視':['放大查看','拡大表示','Enlarge','확대 보기','ขยายดู','Phóng to'],
'儲存設定':['保存设置','設定を保存','Save lineup','설정 저장','บันทึกทีม','Lưu đội hình'],
'移除這格':['移除此格','この枠を削除','Remove slot','슬롯 삭제','ลบช่องนี้','Xóa ô này'],
'設定英靈':['设置英灵','英霊設定','Configure hero','영령 설정','ตั้งค่าวีรชน','Thiết lập anh linh'],
'技能設定':['技能设置','能力設定','Ability settings','능력 설정','ตั้งค่าทักษะ','Thiết lập kỹ năng'],
'尚未設定':['尚未设置','未設定','Not set','설정 안 됨','ยังไม่ตั้งค่า','Chưa thiết lập'],
'點擊選擇英靈':['点击选择英灵','タップして英霊を選択','Choose hero','탭하여 영령 선택','แตะเพื่อเลือกวีรชน','Chọn anh linh'],
'自訂技能配置':['自定义技能配置','カスタム能力設定','Custom abilities','사용자 지정 능력','ตั้งค่าทักษะเอง','Kỹ năng tự chọn'],
'其他（自由技能）':['其他（自由技能）','その他（自由能力）','Other (custom skills)','기타 (사용자 기술)','อื่น ๆ (ทักษะอิสระ)','Khác (kỹ năng tự chọn)'],
'其他':['其他','その他','Other','기타','อื่น ๆ','Khác'],
'選擇英靈':['选择英灵','英霊を選択','Choose hero','영령 선택','เลือกวีรชน','Chọn anh linh'],
'固定能力':['固定能力','固定能力','Fixed abilities','고정 능력','ทักษะคงที่','Kỹ năng cố định'],
'使用說明與注意事項':['使用说明与注意事项','使い方と注意事項','Usage & notes','사용 안내 및 주의사항','วิธีใช้และข้อควรระวัง','Hướng dẫn và lưu ý'],
'編隊與技能':['编队与技能','編成と能力','Lineup & abilities','편성과 능력','ทีมและทักษะ','Đội hình và kỹ năng'],
'機率與寶箱加成':['概率与宝箱加成','確率と宝箱ボーナス','Rates & chest bonuses','확률과 상자 보너스','อัตราและโบนัสหีบ','Tỷ lệ và thưởng rương'],
'儲存與圖片':['保存与图片','保存と画像','Saving & images','저장 및 이미지','การบันทึกและรูปภาพ','Lưu và hình ảnh'],
'我知道了':['我知道了','了解しました','Got it','확인','รับทราบ','Đã hiểu'],
'關閉':['关闭','閉じる','Close','닫기','ปิด','Đóng'],
'貪欲':['贪欲','強欲','Greed','탐욕','โลภ','Tham lam'],
'禁斷':['禁断','禁断','Forbidden','금단','ต้องห้าม','Cấm'],
'深淵世界的解放者':['深渊世界的解放者','深淵世界の解放者','Liberator of the Abyss','심연 세계의 해방자','ผู้ปลดปล่อยโลกห้วงลึก','Người giải phóng vực sâu'],
'弗雷雅':['弗蕾雅','フレイヤ','Freya','프레이야','เฟรยา','Freya'],
'芙麗嘉':['芙丽嘉','フリッグ','Frigg','프리그','ฟริกก์','Frigg']
};
const langs=['zh_cn','ja','en','ko','th','vi'];
function current(){try{let v=localStorage.getItem('dfch-hero-language');return LANG.includes(v)?v:'zh_tw'}catch{return 'zh_tw'}}
let language=current();const originals=new WeakMap();const originAttrs=new WeakMap();const sorted=Object.keys(entries).sort((a,b)=>b.length-a.length);let queued=false;
function gameLabels(){return window.DFCHOfficialLabels||{}}
function translate(t){if(language==='zh_tw'||!t)return t;const source=String(t);const labels=gameLabels();if(entries[source])return entries[source][langs.indexOf(language)]||source;const exact=labels[source];if(exact?.[language])return exact[language];let out='',i=0;while(i<source.length){let matched=false;for(const key of sorted){if(source.startsWith(key,i)){out+=entries[key][langs.indexOf(language)]||key;i+=key.length;matched=true;break}}if(!matched){out+=source[i++];}}return out}
function refresh(){const body=document.body;if(!body)return;const walker=document.createTreeWalker(body,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode())){if(['SCRIPT','STYLE','CODE','PRE','TEXTAREA','OPTION'].includes(node.parentElement?.tagName))continue;let source=originals.get(node);if(source===undefined){source=node.nodeValue;originals.set(node,source);}const value=translate(source);if(node.nodeValue!==value)node.nodeValue=value;}for(const el of body.querySelectorAll('[placeholder],[title],[aria-label]')){let old=originAttrs.get(el);if(!old){old={};for(const attr of ['placeholder','title','aria-label'])if(el.hasAttribute(attr))old[attr]=el.getAttribute(attr);originAttrs.set(el,old)}for(const [k,v] of Object.entries(old)){let changed=translate(v);if(el.getAttribute(k)!==changed)el.setAttribute(k,changed)}}for(const opt of body.querySelectorAll('option')){let raw=originals.get(opt.firstChild);if(opt.firstChild){if(raw===undefined){raw=opt.textContent;originals.set(opt.firstChild,raw);}const translated=translate(raw);if(opt.textContent!==translated)opt.textContent=translated}}}
function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;refresh()})}
window.addEventListener('dfch:language-change',e=>{language=LANG.includes(e.detail?.language)?e.detail.language:current();schedule()});
window.addEventListener('storage',e=>{if(e.key==='dfch-hero-language'){language=current();schedule()}});
function start(){const obs=new MutationObserver(records=>{if(records.some(x=>x.type==='childList'||(x.type==='characterData'&&!originals.has(x.target))))schedule()});obs.observe(document.body,{subtree:true,childList:true,characterData:true});schedule()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

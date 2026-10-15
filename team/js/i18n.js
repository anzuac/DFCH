/* Player-facing translations. Shared DFCH language setting; no separate preference. */
(()=>{'use strict';
const LANG=['zh_tw','zh_cn','ja','en','ko','th','vi'];
const ACTIVE_LANG=['zh_tw','ja','ko','en'];
/* Key = original Traditional Chinese display phrase. Official ability and hero names also use DFCHOfficialLabels. */
const entries={
"選擇英靈（六星角色使用固定技能，「其他」可自行配置）":["選擇英靈（六星角色使用固定技能，「其他」可自行配置）","英霊を選択（星6は固定能力。「その他」は自由設定可能）。","Choose a hero (six-star heroes use fixed abilities; Other is customizable).","영령 선택(6성은 고정 능력, 기타는 사용자 설정 가능).","選擇英靈（六星角色使用固定技能，「其他」可自行配置）","選擇英靈（六星角色使用固定技能，「其他」可自行配置）"],
"同名六星英靈不能重複編隊，不同造型也視為同名；「其他」可以配置多格。":["同名六星英靈不能重複編隊，不同造型也視為同名；「其他」可以配置多格。","同名の星6英霊は別衣装でも重複編成できません。「その他」は複数枠に配置できます。","Six-star heroes with the same name cannot be selected twice, even across variants. Other can fill multiple slots.","같은 이름의 6성 영령은 다른 버전이라도 중복 편성할 수 없습니다. 기타는 여러 칸에 배치할 수 있습니다.","同名六星英靈不能重複編隊，不同造型也視為同名；「其他」可以配置多格。","同名六星英靈不能重複編隊，不同造型也視為同名；「其他」可以配置多格。"],
"點選卡片可選擇英靈、查看固定技能並設定突破；點選儲存後回到 12 格總覽。":["點選卡片可選擇英靈、查看固定技能並設定突破；點選儲存後回到 12 格總覽。","カードをタップして英霊・固定能力・進化を設定します。保存すると12枠の編成に戻ります。","Tap a card to choose a hero, view fixed abilities, and configure evolution. Save to return to the 12-slot lineup.","카드를 눌러 영령과 고정 능력을 확인하고 진화를 설정하세요. 저장하면 12칸 편성으로 돌아갑니다.","點選卡片可選擇英靈、查看固定技能並設定突破；點選儲存後回到 12 格總覽。","點選卡片可選擇英靈、查看固定技能並設定突破；點選儲存後回到 12 格總覽。"],
"帶彩虹外框的技能代表已勾選突破；無可用突破的技能選項將停用。":["帶彩虹外框的技能代表已勾選突破；無可用突破的技能選項將停用。","虹色の枠は進化を選択した能力です。進化できない項目は選択できません。","A rainbow outline indicates an evolved ability. Unavailable evolution options are disabled.","무지개 테두리는 진화를 선택한 능력입니다. 진화할 수 없는 항목은 비활성화됩니다.","帶彩虹外框的技能代表已勾選突破；無可用突破的技能選項將停用。","帶彩虹外框的技能代表已勾選突破；無可用突破的技能選項將停用。"],
"弗雷雅（黑色女神）的「深淵世界的解放者」使用獨立圖示；芙麗嘉（白色女神）是不同角色。":["弗雷雅（黑色女神）的「深淵世界的解放者」使用獨立圖示；芙麗嘉（白色女神）是不同角色。","フレイヤ（黒の女神）の「深淵世界の解放者」には専用アイコンがあります。フリッグ（白の女神）は別の英霊です。","Freyja (Dark Goddess) has a separate icon for Liberator of the Abyss. Frigg (White Goddess) is a different hero.","프레이야(검은 여신)의 ‘심연 세계의 해방자’는 전용 아이콘을 사용합니다. 프리그(하얀 여신)는 다른 영령입니다.","弗雷雅（黑色女神）的「深淵世界的解放者」使用獨立圖示；芙麗嘉（白色女神）是不同角色。","弗雷雅（黑色女神）的「深淵世界的解放者」使用獨立圖示；芙麗嘉（白色女神）是不同角色。"],
"禁斷守門人的基礎出現率預設為 3%，可自行修改；神器、技能、活動倍率會自動重算。":["禁斷守門人的基礎出現率預設為 3%，可自行修改；神器、技能、活動倍率會自動重算。","禁断の門番の基本出現率は3%です。調整すると神器・能力・イベント効果が自動で再計算されます。","The Gatekeeper base appearance rate defaults to 3%. Adjust it for your stage; artifact, ability, and event bonuses update automatically.","금단의 문지기 기본 출현율은 3%입니다. 값을 바꾸면 유물·능력·이벤트 보너스가 자동으로 재계산됩니다.","禁斷守門人的基礎出現率預設為 3%，可自行修改；神器、技能、活動倍率會自動重算。","禁斷守門人的基礎出現率預設為 3%，可自行修改；神器、技能、活動倍率會自動重算。"],
"計算結果依現有遊戲資料與對照測試製作；特殊活動、關卡與遊戲更新可能造成差異。":["計算結果依現有遊戲資料與對照測試製作；特殊活動、關卡與遊戲更新可能造成差異。","現在のゲームデータと検証結果に基づいています。特別イベント・ステージ・更新により差異が生じる場合があります。","Results use available game data and comparison tests. Special events, stages, or game updates may change results.","현재 게임 자료와 대조 테스트를 바탕으로 합니다. 특별 이벤트, 스테이지, 업데이트에 따라 차이가 날 수 있습니다.","計算結果依現有遊戲資料與對照測試製作；特殊活動、關卡與遊戲更新可能造成差異。","計算結果依現有遊戲資料與對照測試製作；特殊活動、關卡與遊戲更新可能造成差異。"],
"編隊、神器與機率設定儲存在目前瀏覽器的本機儲存空間。清除網站資料或更換瀏覽器可能使設定消失。":["編隊、神器與機率設定儲存在目前瀏覽器的本機儲存空間。清除網站資料或更換瀏覽器可能使設定消失。","編成・神器・確率の設定はこのブラウザーに保存されます。サイトデータを削除したり別のブラウザーを使うと失われます。","Lineup, artifact, and rate settings are saved in this browser. Clearing site data or switching browsers may erase them.","편성·유물·확률 설정은 현재 브라우저에 저장됩니다. 사이트 데이터를 삭제하거나 브라우저를 변경하면 사라질 수 있습니다.","編隊、神器與機率設定儲存在目前瀏覽器的本機儲存空間。清除網站資料或更換瀏覽器可能使設定消失。","編隊、神器與機率設定儲存在目前瀏覽器的本機儲存空間。清除網站資料或更換瀏覽器可能使設定消失。"],
"角色與能力圖片使用 DFCH 官方資料，資料更新時可能有所調整。":["角色與能力圖片使用 DFCH 官方資料，資料更新時可能有所調整。","英霊と能力の画像はDFCHの公式データを使用し、更新により変更される場合があります。","Hero and ability images use official DFCH data and may change after updates.","영령 및 능력 이미지는 DFCH 공식 자료를 사용하며 업데이트 시 변경될 수 있습니다.","角色與能力圖片使用 DFCH 官方資料，資料更新時可能有所調整。","角色與能力圖片使用 DFCH 官方資料，資料更新時可能有所調整。"],
"技能預設為一般最高等級，可突破的技能勾選後會套用突破等級。":["技能預設為一般最高等級，可突破的技能勾選後會套用突破等級。","能力は通常の最高レベルが初期値です。進化できる能力を選ぶと進化後のレベルになります。","Abilities default to their normal maximum level. Enable evolution where available to use the evolved level.","능력은 일반 최대 레벨이 기본값입니다. 진화 가능한 능력을 선택하면 진화 후 레벨이 적용됩니다.","技能預設為一般最高等級，可突破的技能勾選後會套用突破等級。","技能預設為一般最高等級，可突破的技能勾選後會套用突破等級。"],
"有進化能力的技能可勾選突破。":["有進化能力的技能可勾選突破。","進化可能な能力はチェックして進化できます。","Enable evolution for abilities that support it.","진화 가능한 능력은 선택하여 진화시킬 수 있습니다.","有進化能力的技能可勾選突破。","有進化能力的技能可勾選突破。"],
"此英靈固定技能以現有資料顯示。":["此英靈固定技能以現有資料顯示。","この英霊の固定能力は現在利用できるデータで表示しています。","Fixed abilities are shown from the currently available data.","이 영령의 고정 능력은 현재 사용 가능한 자료를 기준으로 표시됩니다.","此英靈固定技能以現有資料顯示。","此英靈固定技能以現有資料顯示。"],
"此英靈的完整固定技能需要連線載入。":["此英靈的完整固定技能需要連線載入。","この英霊の固定能力をすべて表示するには接続が必要です。","Connect to load this hero's complete fixed abilities.","이 영령의 전체 고정 능력을 불러오려면 연결이 필요합니다.","此英靈的完整固定技能需要連線載入。","此英靈的完整固定技能需要連線載入。"],
"確定要清空全部 12 格編隊？":["確定要清空全部 12 格編隊？","12枠の編成をすべて消去しますか？","Clear all 12 lineup slots?","편성된 12칸을 모두 지우시겠습니까?","確定要清空全部 12 格編隊？","確定要清空全部 12 格編隊？"],
"自訂能力（可同時選多種）":["自訂能力（可同時選多種）","カスタム能力（複数選択可）","Custom abilities (multiple selections allowed)","사용자 지정 능력(여러 개 선택 가능)","自訂能力（可同時選多種）","自訂能力（可同時選多種）"],
"此技能無可核實的突破進化":["此技能無可核實的突破進化","この能力の進化情報は確認できません","No verified evolution for this ability","이 능력의 진화 정보가 확인되지 않았습니다","此技能無可核實的突破進化","此技能無可核實的突破進化"],
"無禁斷／貪欲技能":["無禁斷／貪欲技能","禁断・強欲の能力なし","No Forbidden / Greed abilities","금단/탐욕 능력 없음","無禁斷／貪欲技能","無禁斷／貪欲技能"],
"點擊設定":["點擊設定","タップして設定","Tap to configure","눌러서 설정","點擊設定","點擊設定"],
"深淵解放者":["深淵解放者","深淵の解放者","Abyss Liberator","심연의 해방자","深淵解放者","深淵解放者"],
"大海的支配者":["大海的支配者","大海の支配者","Oceanic ruler","대해의 지배자","大海的支配者","大海的支配者"],
"禁斷世界介入者":["禁斷世界介入者","禁断の世界の介入者","Forbidden world intruder","금단의 세계 개입자","禁斷世界介入者","禁斷世界介入者"],
"最高等級":["最高等級","最高レベル","Max level","최대 레벨","最高等級","最高等級"],
"（10% 上限）":["（10% 上限）","（上限10%）","(10% cap)","(최대 10%)","（10% 上限）","（10% 上限）"],
"預設 3%，可依照目前關卡調整。":["預設 3%，可依照目前關卡調整。","初期値は3%。ステージに合わせて変更できます。","Default 3%; adjust for the selected stage.","기본값은 3%이며 스테이지에 따라 조정할 수 있습니다.","預設 3%，可依照目前關卡調整。","預設 3%，可依照目前關卡調整。"],
"計算結果超過 100%，請留意遊戲內可能存在其他限制。":["計算結果超過 100%，請留意遊戲內可能存在其他限制。","計算値が100%を超えています。ゲーム内に別の制限がある場合があります。","Result exceeds 100%. The game may apply additional limits.","계산 결과가 100%를 초과했습니다. 게임 내 추가 제한이 있을 수 있습니다.","計算結果超過 100%，請留意遊戲內可能存在其他限制。","計算結果超過 100%，請留意遊戲內可能存在其他限制。"],
"尚未配置相關技能":["尚未配置相關技能","該当する能力が未設定です","No applicable abilities configured","관련 능력이 설정되지 않았습니다","尚未配置相關技能","尚未配置相關技能"],
"關閉使用說明":["關閉使用說明","説明を閉じる","Close help","도움말 닫기","關閉使用說明","關閉使用說明"],
"圖片暫時無法載入":["圖片暫時無法載入","画像を読み込めません","Image unavailable","이미지를 불러올 수 없습니다","圖片暫時無法載入","圖片暫時無法載入"],
"・禁斷的守門人的出現率，除了秘典的基本出現率外，還會受到神器和能力效果的影響":["・禁斷的守門人的出現率，除了秘典的基本出現率外，還會受到神器和能力效果的影響","禁断の門番の出現率は基本値のほか、神器と能力の効果を受けます。","Gatekeeper appearance is affected by artifacts and abilities in addition to its base rate.","금단의 문지기 출현율은 기본 확률 외에 유물과 능력 효과의 영향을 받습니다.","・禁斷的守門人的出現率，除了秘典的基本出現率外，還會受到神器和能力效果的影響","・禁斷的守門人的出現率，除了秘典的基本出現率外，還會受到神器和能力效果的影響"],
"禁斷的守門人的出現率，除了秘典的基本出現率外，還會受到神器和能力效果的影響":["禁斷的守門人的出現率，除了秘典的基本出現率外，還會受到神器和能力效果的影響","禁断の門番の出現率は基本値のほか、神器と能力の効果を受けます。","Besides the base rate, artifacts and abilities affect Gatekeeper appearance.","금단의 문지기 출현율은 기본 확률 외에 유물과 능력 효과의 영향을 받습니다.","禁斷的守門人的出現率，除了秘典的基本出現率外，還會受到神器和能力效果的影響","禁斷的守門人的出現率，除了秘典的基本出現率外，還會受到神器和能力效果的影響"],

'無活動':['无活动','イベントなし','No event','이벤트 없음','ไม่มีกิจกรรม','Không có sự kiện'],
"英靈貪欲":["英灵贪欲","英霊の強欲","Hero greed","영령 탐욕","โลภของวีรชน","Tham lam anh linh"],
"回路組":["回路组","回路グループ","Circuit group","회로 그룹","กลุ่มวงจร","Nhóm mạch"],
"欲望之鏡":["欲望之镜","欲望の鏡","Mirror of Desire","욕망의 거울","กระจกแห่งความปรารถนา","Gương dục vọng"],
"不祥迴路":["不祥回路","不吉な回路","Ominous Circuit","불길한 회로","วงจรอัปมงคล","Mạch điềm gở"],
"各組加成":["各组加成","グループ別ボーナス","Bonus by group","그룹별 보너스","โบนัสแต่ละกลุ่ม","Thưởng theo nhóm"],
"英靈貪欲與神器效果分開顯示，方便查看目前搭配。":["英灵贪欲与神器效果分开显示，方便查看当前搭配。","英霊の強欲と神器の効果を分けて表示し、現在の編成を確認できます。","Hero greed and artifact bonuses are displayed separately for easy comparison.","영령 탐욕과 유물 효과를 나누어 표시하여 현재 구성을 쉽게 확인할 수 있습니다.","แสดงโบนัสความโลภของวีรชนและอาร์ติแฟกต์แยกกันเพื่อดูการจัดทีม","Hiển thị riêng Tham lam của anh linh và bảo vật để dễ xem đội hình hiện tại."],
"「回路組」包含壞掉的回路與不可思議的回路；其他神器分別顯示。":["“回路组”包含坏掉的回路与不可思议的回路；其他神器分别显示。","「回路グループ」には壊れた回路と不思議な回路が含まれ、ほかの神器は別々に表示されます。","Circuit group includes Broken Circuit and Mysterious Circuit; other artifacts are shown separately.","회로 그룹에는 고장난 회로와 신비한 회로가 포함되며, 다른 유물은 별도로 표시됩니다.","กลุ่มวงจรประกอบด้วยวงจรชำรุดและวงจรพิศวง ส่วนอาร์ติแฟกต์อื่นจะแสดงแยกกัน","Nhóm mạch gồm Mạch hỏng và Mạch kỳ bí; các bảo vật khác được hiển thị riêng."],
"進度條僅供比較各項寶箱加成，不代表單次掉落機率。":["进度条仅供比较各项宝箱加成，不代表单次掉落概率。","バーは宝箱ボーナスの比較用であり、1回のドロップ確率ではありません。","Bars compare chest bonuses; they are not single-drop probabilities.","막대는 상자 보너스 비교용이며 한 번의 드롭 확률을 뜻하지 않습니다.","แถบนี้ใช้เปรียบเทียบโบนัสหีบ ไม่ใช่อัตราดรอปในครั้งเดียว","Thanh này dùng để so sánh thưởng rương, không phải xác suất rơi trong một lần."],
"實際掉落結果請以遊戲內為準。":["实际掉落结果请以游戏内为准。","実際のドロップ結果はゲーム内の表示を優先してください。","Actual drops are determined by the game.","실제 드롭 결과는 게임 내 결과를 기준으로 확인해 주세요.","โปรดยึดผลการดรอปจริงภายในเกมเป็นหลัก","Kết quả rơi thực tế vui lòng theo trong trò chơi."],
"先設定神器，再配置 12 格英靈編隊，即可查看禁斷守門人出現率及各項寶箱加成。":["先设置神器，再配置 12 格英灵编队，即可查看禁断守门人出现率及各项宝箱加成。","神器を設定後、12枠に英霊を編成すると門番の出現率と各宝箱ボーナスを確認できます。","Set artifacts, then arrange the 12 hero slots to view gatekeeper appearance rates and chest bonuses.","유물을 설정하고 영령 12칸을 편성하면 문지기 등장 확률과 상자 보너스를 확인할 수 있습니다.","ตั้งค่าอาร์ติแฟกต์แล้วจัดทีม 12 ช่องเพื่อดูอัตราผู้พิทักษ์และโบนัสหีบ","Thiết lập bảo vật rồi xếp 12 ô anh linh để xem tỷ lệ xuất hiện và thưởng rương."],
"寶箱加成會分組顯示；如需了解畫面內容，可展開「詳細說明」。":["宝箱加成按组显示；如需了解画面内容，可展开“详细说明”。","宝箱ボーナスはグループ別に表示されます。「詳しい説明」を開いて確認できます。","Chest bonuses are shown by group. Open Details to learn more.","상자 보너스는 그룹별로 표시됩니다. 자세한 설명을 열어 확인할 수 있습니다.","โบนัสหีบแสดงแยกกลุ่ม แตะรายละเอียดเพื่อดูข้อมูลเพิ่มเติม","Thưởng rương hiển thị theo nhóm. Mở Chi tiết để xem thêm."],
"不祥的迴路效果與所選等級、距離有關；達到上限時會以顏色提示。":["不祥的回路效果与所选等级、距离有关；达到上限时会以颜色提示。","不吉な回路の効果は設定したレベルと距離に応じて変わり、上限時は色で表示されます。","Ominous Circuit depends on the selected level and distance; color indicates its limit.","불길한 회로는 선택한 레벨과 거리에 따라 달라지며 상한은 색상으로 표시됩니다.","วงจรอัปมงคลขึ้นอยู่กับเลเวลและระยะทางที่เลือก สีจะแจ้งเมื่อถึงขีดจำกัด","Mạch điềm gở phụ thuộc cấp và khoảng cách đã chọn; màu sắc báo khi đạt giới hạn."],

"詳細說明":["详细说明","詳しい説明","Details","자세한 설명","รายละเอียด","Chi tiết"],
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
function current(){try{let v=localStorage.getItem('dfch-hero-language');return ACTIVE_LANG.includes(v)?v:'zh_tw'}catch{return 'zh_tw'}}
let language=current();const originals=new WeakMap();const originAttrs=new WeakMap();const sorted=Object.keys(entries).sort((a,b)=>b.length-a.length);let queued=false;
function gameLabels(){return window.DFCHOfficialLabels||{}}
let officialRef=null,officialStarts=new Map();
function officialTokens(labels){
 if(labels===officialRef)return officialStarts;
 officialRef=labels;officialStarts=new Map();
 for(const key of Object.keys(labels)){
  if(key.length<3||!/[㐀-鿿]/.test(key))continue;
  const first=key[0];if(!officialStarts.has(first))officialStarts.set(first,[]);
  officialStarts.get(first).push(key);
 }
 for(const items of officialStarts.values())items.sort((a,b)=>b.length-a.length);
 return officialStarts;
}
function translate(t){
 if(language==='zh_tw'||!t)return t;
 const source=String(t),labels=gameLabels();
 if(entries[source])return entries[source][langs.indexOf(language)]||source;
 if(labels[source]?.[language])return labels[source][language];
 const officialByFirst=officialTokens(labels);
 let out='',i=0;
 while(i<source.length){
  const custom=sorted.find(key=>source.startsWith(key,i));
  const official=(officialByFirst.get(source[i])||[]).find(key=>labels[key]?.[language]&&source.startsWith(key,i));
  if(official&&(!custom||official.length>custom.length)){out+=labels[official][language];i+=official.length;}
  else if(custom){out+=entries[custom][langs.indexOf(language)]||custom;i+=custom.length;}
  else out+=source[i++];
 }
 return out;
}
function refresh(){const body=document.body;if(!body)return;const walker=document.createTreeWalker(body,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode())){if(['SCRIPT','STYLE','CODE','PRE','TEXTAREA','OPTION'].includes(node.parentElement?.tagName))continue;let source=originals.get(node);if(source===undefined){source=node.nodeValue;originals.set(node,source);}const value=translate(source);if(node.nodeValue!==value)node.nodeValue=value;}for(const el of body.querySelectorAll('[placeholder],[title],[aria-label]')){let old=originAttrs.get(el);if(!old){old={};for(const attr of ['placeholder','title','aria-label'])if(el.hasAttribute(attr))old[attr]=el.getAttribute(attr);originAttrs.set(el,old)}for(const [k,v] of Object.entries(old)){let changed=translate(v);if(el.getAttribute(k)!==changed)el.setAttribute(k,changed)}}for(const opt of body.querySelectorAll('option')){let raw=originals.get(opt.firstChild);if(opt.firstChild){if(raw===undefined){raw=opt.textContent;originals.set(opt.firstChild,raw);}const translated=translate(raw);if(opt.textContent!==translated)opt.textContent=translated}}}
function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;refresh()})}
window.addEventListener('dfch:language-change',e=>{language=ACTIVE_LANG.includes(e.detail?.language)?e.detail.language:current();schedule()});
window.addEventListener('storage',e=>{if(e.key==='dfch-hero-language'){language=current();schedule()}});
function start(){const obs=new MutationObserver(records=>{if(records.some(x=>x.type==='childList'||(x.type==='characterData'&&!originals.has(x.target))))schedule()});obs.observe(document.body,{subtree:true,childList:true,characterData:true});schedule()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

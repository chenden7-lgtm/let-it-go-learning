# ❄️ Let It Go 冰雪奇緣 · 雙語歌詩與英文親子學習館

> **Frozen《Let It Go》40 句經典歌詞逐句解析 · 直譯對照 · 官方中文版 · 核心單字發音 · 親子共讀小語**

![Preview](preview.png)

---

## 🌟 核心特色 (Features)

1. **🎶 40 句完整逐句對照**
   - 英文原文（原曲經典唱詞）
   - 直譯解析（逐字精確文意，便於理解英文句構）
   - 官方中譯版（迪士尼中文翻唱版，韻律優美）
   - ❄️ 溫馨親子共讀小語（淺顯易懂的故事情境，讓小朋友身歷其境）

2. **🔊 Web Speech 自然英語發音**
   - 支援逐句點擊即時朗讀
   - 支援點擊各單字獨立清晰發音
   - 語速自由調節（0.75x 慢速伴讀、0.9x 親子教學推薦、1.0x 原速朗讀、1.2x 挑戰語速）
   - **自動連續逐句朗讀跟唱（Karaoke Mode）**：卡片自動伴隨發音光暈高亮並自動滾動

3. **🗂️ 50+ 精選單字互動閃卡庫 (Flashcards)**
   - 自動自 40 句歌詞中萃取重點單字
   - 3D 翻轉卡片效果（正面單字與發音、背面中文釋義與所在歌詞例句）

4. **⭐ 收藏與關鍵字搜尋**
   - 本地儲存（`localStorage`）標記最愛歌詞句
   - 即時模糊搜尋（中英歌詞、單字均可搜尋）

5. **🎨 冰雪玻璃擬態設計 (Glassmorphism)**
   - 深度冰藍星空背景與水晶琉光卡片
   - 輕量化 HTML5 Canvas 飄雪動態粒子特效（可一鍵開關）

---

## 🚀 如何發佈到 GitHub 並啟用免費網頁（GitHub Pages）

這個專案是純前端架構（無需 Node.js 構建即可運行），直接推送到 GitHub 即可透過 GitHub Pages 免費對外公開！

### 步驟 1：在 GitHub 建立新儲存庫
1. 前往 [github.com/new](https://github.com/new)
2. 儲存庫名稱輸入：`let-it-go-learning`
3. 勾選 **Public**（公開），點擊 **Create repository**

### 步驟 2：推送本地專案到 GitHub
在終端機執行下列指令（請將 `YOUR_USERNAME` 替換為您的 GitHub 帳號）：

```bash
cd /Users/lauren/.gemini/antigravity-ide/scratch/let-it-go-learning-hub
git init
git add .
git commit -m "feat: initial release of Let It Go learning hub"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/let-it-go-learning.git
git push -u origin main
```

### 步驟 3：開啟 GitHub Pages
1. 進入您的 GitHub 專案頁面，點選右上角 **Settings**
2. 左側選單點選 **Pages**
3. 在 **Branch** 選取 `main`，路徑保留 `/ (root)`，點擊 **Save**
4. 稍等約 1 分鐘，即可獲得公開訪問網址：
   `https://YOUR_USERNAME.github.io/let-it-go-learning/`

---

## 📂 檔案目錄結構

```text
let-it-go-learning-hub/
├── index.html       # 網頁主架構（SEO優化、語意化標籤）
├── style.css        # 冰雪奇緣主題視覺與玻璃擬態樣式
├── app.js           # 語音發音、自動卡拉OK、單字閃卡、粒子飄雪邏輯
├── data.js          # 40 句歌詞資料集 (JS格式)
├── lyrics.json      # 原始 JSON 資料集
└── README.md        # 說明文件與 GitHub Pages 部署指南
```

---

## 📄 版權與免責聲明
- 本專案僅供個人英文學習、親子共讀與教育交流用途。
- 《Let It Go》歌詞與音樂相關版權歸原創作者 Kristen Anderson-Lopez, Robert Lopez 及 The Walt Disney Company 所有。

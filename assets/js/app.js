(function(){
  const { QUESTIONS, OPTIONS, RESULTS, computeScores, rankResults, resultUrl, scoreFromQuery, renderResult, escapeHtml } = window.UYOPAYO;
  const root = document.querySelector('[data-app]');
  if(!root) return;
  let index = 0;
  let answers = Array(QUESTIONS.length).fill(null);
  const saved = localStorage.getItem('uyopayo.answers');
  if(saved && saved.length === QUESTIONS.length){ const decoded = window.UYOPAYO.decodeAnswers(saved); if(decoded) answers = decoded; }
  function answeredCount(){ return answers.filter(v => typeof v === 'number').length; }
  function answerDots(){ return `<div class="answer-map" aria-label="回答済みマップ">${answers.map(v => `<span class="answer-dot ${typeof v === 'number' ? 'done':''}"></span>`).join('')}</div>`; }
  function startQuiz(){ index = Math.max(0, answers.findIndex(v => v === null)); if(index < 0) index = 0; renderQuiz(); setTimeout(() => document.getElementById('quiz')?.scrollIntoView({behavior:'smooth', block:'start'}), 60); }
  function renderQuiz(){
    const q = QUESTIONS[index];
    const progress = Math.round(answeredCount()/QUESTIONS.length*100);
    root.innerHTML = `
      <section class="panel" id="quiz"><div class="panel-inner quiz-wrap">
        <div><h2 class="section-title">50問診断</h2><p class="lead">5段階で答えてください。極端な回答ほど思想の重心がはっきりします。中立は逃げではありませんが、連打すると診断結果も霞みます。まあ人生と同じです。</p></div>
        <div class="progress-line"><span style="width:${progress}%"></span></div>
        <div class="question-meta"><span>${answeredCount()} / ${QUESTIONS.length} 回答済み</span><span>Q${q.id}・${escapeHtml(q.topic)}</span></div>
        ${answerDots()}
        <div class="question-card">
          <h2>${escapeHtml(q.text)}</h2>
          <div class="options">${OPTIONS.map(opt => `<button class="option-btn ${answers[index]===opt.value?'active':''}" data-value="${opt.value}">${escapeHtml(opt.label)}<small>${escapeHtml(opt.short)}</small></button>`).join('')}</div>
        </div>
        <div class="quiz-actions">
          <button class="btn secondary" data-prev ${index===0?'disabled':''}>戻る</button>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn subtle" data-reset>リセット</button>
            <button class="btn secondary" data-next ${index===QUESTIONS.length-1?'disabled':''}>次へ</button>
            <button class="btn" data-finish ${answeredCount()!==QUESTIONS.length?'disabled':''}>結果を見る</button>
          </div>
        </div>
      </div></section>`;
    root.querySelectorAll('[data-value]').forEach(btn => btn.addEventListener('click', () => { answers[index] = Number(btn.dataset.value); localStorage.setItem('uyopayo.answers', window.UYOPAYO.encodeAnswers(answers)); if(index < QUESTIONS.length - 1) index++; renderQuiz(); }));
    root.querySelector('[data-prev]')?.addEventListener('click', () => { if(index>0){ index--; renderQuiz(); }});
    root.querySelector('[data-next]')?.addEventListener('click', () => { if(index<QUESTIONS.length-1){ index++; renderQuiz(); }});
    root.querySelector('[data-reset]')?.addEventListener('click', () => { answers = Array(QUESTIONS.length).fill(null); localStorage.removeItem('uyopayo.answers'); index=0; renderQuiz(); });
    root.querySelector('[data-finish]')?.addEventListener('click', finish);
  }
  function finish(){ if(answeredCount() !== QUESTIONS.length) return; const scores = computeScores(answers); const best = rankResults(scores)[0].result; window.location.href = resultUrl(best.slug, scores, answers); }
  function renderHome(){
    root.innerHTML = `
      <section class="hero">
        <div>
          <div class="kicker">ECONOMIC IDEOLOGY DIAGNOSIS</div>
          <h1>ウヨパヨ診断</h1>
          <p>左右の罵倒ラベルをほどいて、経済政策をどのレンズで見ているかを50問で可視化します。結果は24タイプ。これは勝敗判定ではなく、自分が何を重視し、何を見落としやすいかを知るための診断です。</p>
          <div class="cta-row"><button class="btn" data-start>診断を開始</button><a class="btn secondary" href="results.html">全タイプを見る</a><a class="btn secondary" href="methodology.html">設計を見る</a></div>
          <p class="notice">結果本文を厚くし、社会で建設的に使うための「得意な見方」「事故り方」「対話のコツ」を出します。派閥ごっこに飽きた人向けです。ようやく文明っぽい。</p>
        </div>
        <div class="hero-note">
          <div class="note-card"><strong>診断で分かること</strong><span>市場、政府、貨幣、制度、分配、金融、革新をどの順番で見がちかを整理します。</span></div>
          <div class="note-card"><strong>診断で分からないこと</strong><span>あなたの人格、善悪、投票先、知的優劣。そこまで決められたら、もはや診断ではなく雑な占いです。</span></div>
          <div class="note-card"><strong>読み方</strong><span>結果はレッテルではなく、議論を始めるための仮説です。近い別タイプも見てください。人間は一つの箱に入りません。段ボールでも嫌がります。</span></div>
        </div>
      </section>
      <section class="grid-3">
        <div class="card"><h3>1. 50問に回答</h3><p>5段階で政策反応を答えます。回答はブラウザ内に保存され、サーバーには送られません。</p></div>
        <div class="card"><h3>2. 8軸で採点</h3><p>市場調整、ルール志向、貨幣安定、誘因、開放経済、分析スタイル、金融不安定性、革新を数値化します。</p></div>
        <div class="card"><h3>3. 24タイプへ近似</h3><p>最も近い思想レンズを出し、強み、盲点、対話のコツ、近い別タイプを表示します。</p></div>
      </section>
      <section class="panel"><div class="panel-inner">
        <h2 class="section-title">結果タイプの一部</h2>
        <p class="lead">キャラではなく、経済政策を見るレンズとして表示します。診断結果をSNSの棍棒にするのではなく、会話の地図にする設計です。まあ棍棒にする人は何でも棍棒にしますが。</p>
        <div class="result-list">${RESULTS.slice(0,6).map(r => `<a class="result-mini" href="results/${escapeHtml(r.slug)}/"><strong>${escapeHtml(r.typeName)}</strong><span>${escapeHtml(r.school)}</span><span>${escapeHtml(r.catch)}</span></a>`).join('')}</div>
      </div></section>`;
    root.querySelector('[data-start]')?.addEventListener('click', startQuiz);
  }
  const params = new URLSearchParams(location.search);
  const qScores = scoreFromQuery(params);
  if(params.has('a') && qScores){ const best = rankResults(qScores)[0].result; renderResult(root, best, qScores, {assetPrefix:'assets/', homeHref:'index.html', resultBase:'results/'}); }
  else { renderHome(); }
})();

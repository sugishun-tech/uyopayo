(function(){
  const DATA = window.UYOPAYO_DATA;
  const AXES = DATA.axes;
  const QUESTIONS = DATA.questions;
  const RESULTS = DATA.results;
  const OPTIONS = [
    {label:'強く反対', short:'反対++', value:-2},
    {label:'やや反対', short:'反対+', value:-1},
    {label:'どちらでもない', short:'中立', value:0},
    {label:'やや賛成', short:'賛成+', value:1},
    {label:'強く賛成', short:'賛成++', value:2}
  ];
  function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
  function bySlug(slug){ return RESULTS.find(r => r.slug === slug) || RESULTS[0]; }
  function axisMaxima(){
    const max = Object.fromEntries(AXES.map(a => [a.key, 0]));
    QUESTIONS.forEach(q => Object.entries(q.weights || {}).forEach(([k,w]) => { max[k] += Math.abs(w) * 2; }));
    return max;
  }
  const MAXIMA = axisMaxima();
  function computeScores(answers){
    const raw = Object.fromEntries(AXES.map(a => [a.key, 0]));
    QUESTIONS.forEach((q, idx) => {
      const val = answers[idx];
      if (typeof val !== 'number') return;
      Object.entries(q.weights || {}).forEach(([k,w]) => { raw[k] += val * w; });
    });
    const scores = {};
    AXES.forEach(a => { scores[a.key] = MAXIMA[a.key] ? clamp(Math.round((raw[a.key] / MAXIMA[a.key]) * 100), -100, 100) : 0; });
    return scores;
  }
  function distance(scores, result){
    let sum = 0;
    AXES.forEach(a => { const d = (scores[a.key] || 0) - (result.centroid[a.key] || 0); sum += d*d; });
    return Math.sqrt(sum / AXES.length);
  }
  function rankResults(scores){
    return RESULTS.map(r => ({result:r, distance:distance(scores,r), fit:Math.max(0, Math.round(100 - distance(scores,r)/2))}))
      .sort((a,b) => a.distance - b.distance);
  }
  function encodeScores(scores){ return AXES.map(a => String(clamp(Math.round(scores[a.key] || 0), -100, 100) + 100)).join('.'); }
  function decodeScores(s){
    if(!s) return null;
    const parts = String(s).split('.').map(x => Number(x));
    if(parts.length !== AXES.length || parts.some(n => !Number.isFinite(n))) return null;
    const scores = {}; AXES.forEach((a,i) => { scores[a.key] = clamp(Math.round(parts[i]-100), -100, 100); }); return scores;
  }
  function encodeAnswers(answers){ return answers.map(v => typeof v === 'number' ? String(v+2) : 'x').join(''); }
  function decodeAnswers(s){
    if(!s || String(s).length !== QUESTIONS.length) return null;
    const arr = String(s).split('').map(ch => ch === 'x' ? null : Number(ch)-2);
    if(arr.some(v => v !== null && (!Number.isFinite(v) || v < -2 || v > 2))) return null;
    return arr;
  }
  function scoreFromQuery(params){
    const answers = decodeAnswers(params.get('a'));
    if(answers && answers.every(v => typeof v === 'number')) return computeScores(answers);
    return decodeScores(params.get('s'));
  }
  function resultUrl(slug, scores, answers){
    const qs = new URLSearchParams();
    if(scores) qs.set('s', encodeScores(scores));
    if(answers && answers.every(v => typeof v === 'number')) qs.set('a', encodeAnswers(answers));
    return `results/${slug}/` + (qs.toString() ? `?${qs.toString()}` : '');
  }
  function escapeHtml(str){ return String(str ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }
  function refMap(){ return Object.fromEntries((DATA.references || []).map(r => [r.id, r])); }
  function paraList(items){ return (items || []).map(p => `<p>${escapeHtml(p)}</p>`).join(''); }
  function bulletList(items, cls=''){ return `<ul class="${cls}">${(items || []).map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>`; }
  function scoreRows(scores){
    return AXES.map(a => {
      const v = clamp(Math.round(scores[a.key] || 0), -100, 100);
      const left = v < 0 ? 50 + v/2 : 50;
      const width = Math.abs(v)/2;
      const side = v < -10 ? a.negative : (v > 10 ? a.positive : '中間');
      return `<div class="score-row"><span>${escapeHtml(a.label)}</span><div><div class="score-track" title="${escapeHtml(a.negative)} ← ${v} → ${escapeHtml(a.positive)}"><span class="score-fill" style="left:${left}%;width:${width}%;"></span></div><div class="axis-caption">${escapeHtml(a.negative)} ← <strong>${escapeHtml(side)}</strong> → ${escapeHtml(a.positive)}</div></div><span>${v}</span></div>`;
    }).join('');
  }
  function axisInsights(scores){
    const sorted = AXES.map(a => ({axis:a, value:clamp(Math.round(scores[a.key] || 0), -100, 100), abs:Math.abs(scores[a.key] || 0)})).sort((a,b)=>b.abs-a.abs);
    return sorted.slice(0,3).map(x => {
      const label = x.value >= 0 ? x.axis.positive : x.axis.negative;
      const note = x.value >= 0 ? `あなたの回答は「${x.axis.positive}」側に寄っています。` : `あなたの回答は「${x.axis.negative}」側に寄っています。`;
      return `<div class="insight"><strong>${escapeHtml(x.axis.label)}: ${escapeHtml(label)}</strong><span>${escapeHtml(note)}${escapeHtml(x.axis.description)}</span></div>`;
    }).join('');
  }
  function renderResult(el, result, scores, opts={}){
    const usedScores = scores || result.centroid;
    const ranking = rankResults(usedScores);
    const ownRank = ranking.find(x => x.result.slug === result.slug) || ranking[0];
    const runners = ranking.filter(x => x.result.slug !== result.slug).slice(0,3);
    const refs = refMap();
    const refHtml = (result.refs || []).map(id => refs[id]).filter(Boolean).map(ref =>
      `<li><a href="${escapeHtml(ref.url)}" target="_blank" rel="noopener">${escapeHtml(ref.title)}</a><br><small>${escapeHtml(ref.note)}</small></li>`
    ).join('');
    const homeHref = opts.homeHref || 'index.html';
    const resultBase = opts.resultBase || 'results/';
    el.innerHTML = `
      <section class="panel"><div class="panel-inner result-hero">
        <div>
          <span class="school">${escapeHtml(result.school)}</span>
          <h1 class="result-title">${escapeHtml(result.typeName)}</h1>
          <div class="tag-row">${(result.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
          <p class="result-summary"><strong>${escapeHtml(result.catch)}</strong></p>
          <p class="result-summary">${escapeHtml(result.summary)}</p>
          <div class="fit-wrap"><strong>適合度</strong><div class="fit-track"><span style="width:${ownRank.fit}%"></span></div><strong>${ownRank.fit}%</strong></div>
          <p class="notice">この結果は「あなたの正体」ではなく、政策論でどこを先に見るかの傾向です。レッテルを貼る道具ではなく、相手と論点を分解する道具として使ってください。人類には難しい用途ですが、一応できます。</p>
          <div class="toc"><a href="#profile">読み解き</a><a href="#scores">スコア</a><a href="#use">社会での使い方</a><a href="#risks">事故り方</a><a href="#dialogue">対話のコツ</a><a href="#nearby">近い別タイプ</a><a href="#refs">読み筋</a></div>
          <div class="share-row"><button class="btn" data-copy-url>結果URLをコピー</button><a class="btn secondary" data-x-share target="_blank" rel="noopener">Xで共有</a><a class="btn secondary" data-line-share target="_blank" rel="noopener">LINEで送る</a><a class="btn subtle" href="${homeHref}">診断に戻る</a><span class="copy-status" data-copy-status></span></div>
        </div>
      </div></section>
      <section class="grid-2" id="profile">
        <div class="card"><h2>このレンズの読み解き</h2>${paraList(result.overview)}</div>
        <div class="card"><h2>この見方が社会で役に立つ場面</h2><p>${escapeHtml(result.publicValue)}</p><h3>得意なこと</h3>${bulletList(result.strengths)}</div>
      </section>
      <section class="grid-2" id="scores">
        <div class="card"><h2>あなたのスコア地形</h2><div class="score-list">${scoreRows(usedScores)}</div></div>
        <div class="card"><h2>強く出た3軸</h2><div class="insight-strip">${axisInsights(usedScores)}</div><p class="lead" style="margin-top:14px">同じ結果タイプでも、どの軸が強いかで読み味は変わります。タイプ名だけで殴り合うと、せっかく50問答えた意味が蒸発します。</p></div>
      </section>
      <section class="grid-2" id="use">
        <div class="card"><h2>建設的な使い方</h2>${bulletList(result.constructiveMoves, 'compact-list')}</div>
        <div class="card"><h2>会議で使える一言</h2><p>${escapeHtml(result.humor)}</p><h3>経済学的な根拠</h3>${bulletList(result.basis)}</div>
      </section>
      <section class="grid-2" id="risks">
        <div class="card"><h2>事故りやすいところ</h2>${bulletList(result.blindSpots, 'compact-list')}</div>
        <div class="card"><h2>冷水</h2><p>${escapeHtml(result.caution)}</p><h3>自分への点検質問</h3>${bulletList(result.checkQuestions)}</div>
      </section>
      <section class="grid-2" id="dialogue">
        <div class="card"><h2>違うタイプと話すコツ</h2>${bulletList(result.discussionTips, 'compact-list')}</div>
        <div class="card"><h2>この結果の近似性</h2><p>適合度は、8軸スコアと各タイプの重心の距離から計算しています。近い別タイプが複数ある場合、あなたの立場は混合型です。思想が一枚岩でないのは普通です。むしろ一枚岩の人間は、だいたい会話が岩です。</p><p class="muted">近い別タイプ: ${runners.map(x => escapeHtml(x.result.typeName)).join(' / ')}</p></div>
      </section>
      <section class="card" id="nearby" style="margin-top:22px"><h2>近い別タイプ</h2><div class="result-list">${runners.map(x => `<a class="result-mini" href="${resultBase}${escapeHtml(x.result.slug)}/"><strong>${escapeHtml(x.result.typeName)}</strong><span>${escapeHtml(x.result.school)} / 適合度 ${x.fit}%</span><span>${escapeHtml(x.result.catch)}</span></a>`).join('')}</div></section>
      <section class="card" id="refs" style="margin-top:22px"><h2>読み筋</h2><p class="lead">このタイプをもう少し真面目に読むための入口です。診断で済ませず原典へ行くと、インターネットの騒音が少しだけ遠のきます。</p><ul>${refHtml || '<li>参考文献なし</li>'}</ul></section>
    `;
    const url = window.location.href;
    const text = `ウヨパヨ診断の結果は「${result.typeName}」でした。${result.school}`;
    const copy = el.querySelector('[data-copy-url]');
    const status = el.querySelector('[data-copy-status]');
    const x = el.querySelector('[data-x-share]');
    const line = el.querySelector('[data-line-share]');
    if(x) x.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    if(line) line.href = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`;
    if(copy) copy.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(url); if(status) status.textContent = 'コピーしました'; }
      catch(e){ if(status) status.textContent = 'コピーに失敗。URL欄からどうぞ。'; }
    });
  }
  window.UYOPAYO = { DATA, AXES, QUESTIONS, RESULTS, OPTIONS, bySlug, computeScores, rankResults, encodeScores, decodeScores, encodeAnswers, decodeAnswers, scoreFromQuery, resultUrl, renderResult, escapeHtml };
})();

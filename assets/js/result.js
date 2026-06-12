(function(){
  const root = document.querySelector('[data-result-page]');
  if(!root) return;
  const slug = root.dataset.slug || window.RESULT_SLUG;
  const result = window.UYOPAYO.bySlug(slug);
  const params = new URLSearchParams(location.search);
  const scores = window.UYOPAYO.scoreFromQuery(params) || result.centroid;
  window.UYOPAYO.renderResult(root, result, scores, {assetPrefix:'../../assets/', homeHref:'../../index.html', resultBase:'../../results/'});
})();

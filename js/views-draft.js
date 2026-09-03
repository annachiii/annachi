/* 视图：正文写作（分章节编辑 + 字数统计 + 每日目标 + 导出） */
var WA = window.WA || {};
WA.views = WA.views || {};

WA.views.draft = function (container, ctx) {
  var el = WA.utils.el;
  var project = ctx.project;
  var chapters = project.outline.chapters;

  function totalWords() {
    var total = 0;
    Object.keys(project.draft).forEach(function (id) { total += WA.utils.countWords(project.draft[id]); });
    return total;
  }

  // 每日写作进度基线
  var today = WA.utils.todayKey();
  if (!project.progress.dayBaseline || project.progress.dayBaseline.date !== today) {
    project.progress.dayBaseline = { date: today, total: totalWords() };
    ctx.save();
  }
  var wordsToday = Math.max(0, totalWords() - project.progress.dayBaseline.total);

  var goalInput = el('input', {
    class: 'input goal-input', type: 'number', min: '0', value: project.progress.wordGoal,
    oninput: WA.utils.debounce(function (e) {
      project.progress.wordGoal = parseInt(e.target.value, 10) || 0;
      ctx.save();
      ctx.renderCurrentView();
    }, 300)
  });

  var progressPct = project.progress.wordGoal > 0 ? Math.min(100, Math.round(wordsToday / project.progress.wordGoal * 100)) : 0;

  var statsCard = el('div', { class: 'card' }, [
    el('div', { class: 'stats-row' }, [
      el('div', { class: 'stat' }, [el('div', { class: 'stat-num' }, [String(totalWords())]), el('div', { class: 'stat-label' }, ['全文字数'])]),
      el('div', { class: 'stat' }, [el('div', { class: 'stat-num' }, [String(wordsToday)]), el('div', { class: 'stat-label' }, ['今日已写'])]),
      el('div', { class: 'stat' }, [
        el('div', { class: 'stat-label' }, ['今日目标']),
        goalInput
      ])
    ]),
    el('div', { class: 'progress-bar' }, [el('div', { class: 'progress-fill', style: 'width:' + progressPct + '%' })]),
    el('button', {
      class: 'btn btn-ghost btn-small',
      onclick: function () {
        var lines = [project.name, ''];
        chapters.forEach(function (c) {
          lines.push('## ' + c.title);
          lines.push('');
          lines.push(project.draft[c.id] || '');
          lines.push('');
        });
        WA.utils.downloadText((project.name || 'draft') + '.txt', lines.join('\n'));
      }
    }, ['⬇ 导出全文为文本文件'])
  ]);
  container.appendChild(statsCard);

  if (chapters.length === 0) {
    container.appendChild(el('p', { class: 'muted' }, ['还没有章节。请先到"大纲"页面创建章节，再回到这里写作。']));
    return;
  }

  var activeId = ctx.draftActiveChapter && chapters.some(function (c) { return c.id === ctx.draftActiveChapter; })
    ? ctx.draftActiveChapter : chapters[0].id;

  var tabs = el('div', { class: 'chapter-tabs' }, chapters.map(function (c, idx) {
    return el('button', {
      class: 'chapter-tab' + (c.id === activeId ? ' active' : ''),
      onclick: function () { ctx.draftActiveChapter = c.id; ctx.renderCurrentView(); }
    }, [(idx + 1) + '. ' + (c.title || '未命名')]);
  }));

  var activeChapter = chapters.find(function (c) { return c.id === activeId; });
  var wordCountEl = el('span', { class: 'muted small' }, [WA.utils.countWords(project.draft[activeId]) + ' 字']);

  var textarea = el('textarea', {
    class: 'input draft-textarea',
    placeholder: activeChapter.summary ? ('大纲提示：' + activeChapter.summary) : '开始写作……',
    oninput: WA.utils.debounce(function (e) {
      project.draft[activeId] = e.target.value;
      ctx.save();
      wordCountEl.textContent = WA.utils.countWords(project.draft[activeId]) + ' 字';
      var statFirst = container.querySelector('.stat-num');
      if (statFirst) statFirst.textContent = String(totalWords());
    }, 250)
  }, [project.draft[activeId] || '']);

  container.appendChild(el('div', { class: 'card' }, [
    tabs,
    el('div', { class: 'card-head' }, [el('h4', {}, [activeChapter.title]), wordCountEl]),
    activeChapter.summary ? el('p', { class: 'muted small' }, ['大纲摘要：' + activeChapter.summary]) : null,
    textarea
  ]));
};

window.WA = WA;

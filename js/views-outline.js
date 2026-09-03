/* 视图：大纲构建（结构模板 + 章节/场景编辑） */
var WA = window.WA || {};
WA.views = WA.views || {};

WA.views.outline = function (container, ctx) {
  var el = WA.utils.el;
  var project = ctx.project;
  var outline = project.outline;

  var structureSelect = el('select', { class: 'input' },
    Object.keys(WA.data.OUTLINE_STRUCTURES).map(function (key) {
      return el('option', { value: key, selected: outline.structure === key ? 'selected' : undefined }, [WA.data.OUTLINE_STRUCTURES[key].name]);
    })
  );

  var applyBtn = el('button', {
    class: 'btn btn-primary',
    onclick: function () {
      if (outline.chapters.length > 0 && !confirm('应用模板会覆盖当前所有章节，确定继续吗？')) return;
      outline.structure = structureSelect.value;
      var tpl = WA.data.OUTLINE_STRUCTURES[outline.structure];
      outline.chapters = tpl.chapters.map(function (c) {
        return { id: WA.storage.uid(), title: c.title, summary: c.summary, scenes: [] };
      });
      ctx.save();
      ctx.renderCurrentView();
    }
  }, ['应用模板（覆盖当前章节）']);

  container.appendChild(el('div', { class: 'card' }, [
    el('h3', {}, ['大纲结构模板']),
    el('p', { class: 'muted' }, ['选择一种结构快速生成章节骨架，再逐章填充细节；也可以完全自定义。']),
    el('div', { class: 'form-row' }, [structureSelect, applyBtn])
  ]));

  function moveChapter(idx, dir) {
    var target = idx + dir;
    if (target < 0 || target >= outline.chapters.length) return;
    var tmp = outline.chapters[idx];
    outline.chapters[idx] = outline.chapters[target];
    outline.chapters[target] = tmp;
    ctx.save();
    ctx.renderCurrentView();
  }

  var addChapterBtn = el('button', {
    class: 'btn btn-primary',
    onclick: function () {
      outline.chapters.push({ id: WA.storage.uid(), title: '新章节', summary: '', scenes: [] });
      ctx.save();
      ctx.renderCurrentView();
    }
  }, ['+ 新增章节']);

  container.appendChild(el('div', { class: 'card' }, [
    el('div', { class: 'card-head' }, [el('h3', {}, ['章节大纲 (' + outline.chapters.length + ')']), addChapterBtn])
  ]));

  outline.chapters.forEach(function (chapter, idx) {
    var titleInput = el('input', {
      class: 'input', type: 'text', value: chapter.title,
      oninput: WA.utils.debounce(function (e) { chapter.title = e.target.value; ctx.save(); }, 300)
    });
    var summaryArea = el('textarea', {
      class: 'input textarea-small', placeholder: '本章大致内容与目的……',
      oninput: WA.utils.debounce(function (e) { chapter.summary = e.target.value; ctx.save(); }, 300)
    }, [chapter.summary]);

    var scenesWrap = el('div', { class: 'scene-list' });
    (chapter.scenes || []).forEach(function (scene, sIdx) {
      var sTitle = el('input', {
        class: 'input', type: 'text', placeholder: '场景标题', value: scene.title,
        oninput: WA.utils.debounce(function (e) { scene.title = e.target.value; ctx.save(); }, 300)
      });
      var sDesc = el('input', {
        class: 'input', type: 'text', placeholder: '场景内容 / 目的', value: scene.desc,
        oninput: WA.utils.debounce(function (e) { scene.desc = e.target.value; ctx.save(); }, 300)
      });
      scenesWrap.appendChild(el('div', { class: 'scene-row' }, [
        el('span', { class: 'muted small' }, ['场景 ' + (sIdx + 1)]),
        sTitle, sDesc,
        el('button', {
          class: 'btn btn-tiny btn-danger-ghost',
          onclick: function () {
            chapter.scenes = chapter.scenes.filter(function (x) { return x.id !== scene.id; });
            ctx.save();
            ctx.renderCurrentView();
          }
        }, ['删除'])
      ]));
    });

    var addSceneBtn = el('button', {
      class: 'btn btn-ghost btn-small',
      onclick: function () {
        chapter.scenes = chapter.scenes || [];
        chapter.scenes.push({ id: WA.storage.uid(), title: '', desc: '' });
        ctx.save();
        ctx.renderCurrentView();
      }
    }, ['+ 添加场景']);

    container.appendChild(el('div', { class: 'card chapter-card' }, [
      el('div', { class: 'card-head' }, [
        el('span', { class: 'tag' }, ['第 ' + (idx + 1) + ' 章']),
        el('div', {}, [
          el('button', { class: 'btn btn-tiny', onclick: function () { moveChapter(idx, -1); } }, ['↑']),
          el('button', { class: 'btn btn-tiny', onclick: function () { moveChapter(idx, 1); } }, ['↓']),
          el('button', {
            class: 'btn btn-tiny btn-danger-ghost',
            onclick: function () {
              if (confirm('删除该章节？（正文写作中对应的草稿内容不会被删除）')) {
                outline.chapters = outline.chapters.filter(function (x) { return x.id !== chapter.id; });
                ctx.save();
                ctx.renderCurrentView();
              }
            }
          }, ['删除'])
        ])
      ]),
      el('div', { class: 'field' }, [el('label', {}, ['标题']), titleInput]),
      el('div', { class: 'field' }, [el('label', {}, ['摘要']), summaryArea]),
      el('div', { class: 'field' }, [el('label', {}, ['场景（可选，适合剧本/长篇细化）']), scenesWrap, addSceneBtn])
    ]));
  });

  if (outline.chapters.length === 0) {
    container.appendChild(el('p', { class: 'muted' }, ['还没有章节，选择上方模板快速生成，或点击"新增章节"手动添加。']));
  }
};

window.WA = WA;

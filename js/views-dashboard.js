/* 视图：项目仪表盘（新建/打开/删除项目） */
var WA = window.WA || {};
WA.views = WA.views || {};

WA.views.dashboard = function (container, ctx) {
  var el = WA.utils.el;
  var projects = WA.storage.list();

  var typeSelect = el('select', { class: 'input' },
    WA.data.TEXT_TYPES.map(function (t) { return el('option', { value: t.id }, [t.name]); })
  );
  var nameInput = el('input', { class: 'input', type: 'text', placeholder: '给作品起个名字，比如《雾隐镇的秘密》' });

  var createBtn = el('button', {
    class: 'btn btn-primary',
    onclick: function () {
      var name = nameInput.value.trim() || '未命名作品';
      var project = WA.storage.create(name, typeSelect.value);
      ctx.openProject(project.id);
    }
  }, ['+ 新建作品']);

  var createCard = el('div', { class: 'card' }, [
    el('h3', {}, ['开始一部新作品']),
    el('div', { class: 'form-row' }, [nameInput]),
    el('div', { class: 'form-row' }, [typeSelect, createBtn])
  ]);

  var listCard = el('div', { class: 'card' }, [
    el('h3', {}, ['我的作品 (' + projects.length + ')']),
    projects.length === 0
      ? el('p', { class: 'muted' }, ['还没有作品，先在上面创建一个吧～'])
      : el('div', { class: 'project-list' }, projects.map(function (p) {
        return el('div', { class: 'project-item' }, [
          el('div', { class: 'project-info' }, [
            el('div', { class: 'project-name' }, [p.name]),
            el('div', { class: 'muted small' }, [WA.utils.textTypeName(p.textType) + ' · 更新于 ' + WA.utils.formatDate(p.updatedAt)])
          ]),
          el('div', { class: 'project-actions' }, [
            el('button', { class: 'btn btn-ghost', onclick: function () { ctx.openProject(p.id); } }, ['打开']),
            el('button', {
              class: 'btn btn-danger-ghost',
              onclick: function () {
                if (confirm('确定要删除《' + p.name + '》吗？此操作无法撤销。')) {
                  WA.storage.remove(p.id);
                  ctx.renderCurrentView();
                }
              }
            }, ['删除'])
          ])
        ]);
      }))
  ]);

  var introCard = el('div', { class: 'card intro-card' }, [
    el('h3', {}, ['这个写作助手能帮你做什么？']),
    el('ul', { class: 'intro-list' }, [
      '选择文本类型（短篇/长篇/剧本/散文/诗歌/网文/童话），获得对应的引导流程',
      '设定文笔偏好：人称、语气、节奏、句式，让建议更贴合你的风格',
      '灵感启发：主题、冲突、开篇金句、"如果……会怎样"、氛围意象，一键换一批',
      '设定规划：世界观、人物档案、情节时间线、大纲（可套用三幕式/英雄之旅/起承转合模板）',
      '正文写作：分章节写作，实时字数统计，每日写作目标追踪',
      '修订检查清单：按文本类型定制的自查清单',
      '角色/地名生成器，一键导出全文为文本文件'
    ].map(function (t) { return el('li', {}, [t]); }))
  ]);

  container.appendChild(createCard);
  container.appendChild(listCard);
  container.appendChild(introCard);
};

window.WA = WA;

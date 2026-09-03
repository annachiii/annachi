/* 视图：文本类型选择 + 文笔偏好设置 */
var WA = window.WA || {};
WA.views = WA.views || {};

WA.views.texttype = function (container, ctx) {
  var el = WA.utils.el;
  var project = ctx.project;

  var grid = el('div', { class: 'type-grid' }, WA.data.TEXT_TYPES.map(function (t) {
    var active = project.textType === t.id;
    return el('div', {
      class: 'type-card' + (active ? ' active' : ''),
      onclick: function () {
        project.textType = t.id;
        ctx.save();
        ctx.renderCurrentView();
      }
    }, [
      el('div', { class: 'type-name' }, [t.name]),
      el('div', { class: 'type-desc' }, [t.desc])
    ]);
  }));

  container.appendChild(el('div', { class: 'card' }, [
    el('h3', {}, ['选择你想写的文本类型']),
    el('p', { class: 'muted' }, ['不同类型会影响后续大纲模板与修订清单，随时可以切换。']),
    grid
  ]));
};

WA.views.style = function (container, ctx) {
  var el = WA.utils.el;
  var project = ctx.project;
  var s = project.style;

  function labeledSelect(label, key, options) {
    var select = el('select', {
      class: 'input',
      onchange: function (e) { s[key] = e.target.value; ctx.save(); }
    }, [el('option', { value: '' }, ['-- 请选择 --'])].concat(
      options.map(function (opt) { return el('option', { value: opt, selected: s[key] === opt ? 'selected' : undefined }, [opt]); })
    ));
    return el('div', { class: 'field' }, [el('label', {}, [label]), select]);
  }

  function labeledText(label, key, placeholder) {
    var input = el('input', {
      class: 'input', type: 'text', placeholder: placeholder || '', value: s[key] || '',
      oninput: WA.utils.debounce(function (e) { s[key] = e.target.value; ctx.save(); }, 300)
    });
    return el('div', { class: 'field' }, [el('label', {}, [label]), input]);
  }

  container.appendChild(el('div', { class: 'card' }, [
    el('h3', {}, ['文笔偏好设置']),
    el('p', { class: 'muted' }, ['告诉助手你偏好的写作风格，后续的建议会更贴合你的口味。']),
    el('div', { class: 'field-grid' }, [
      labeledSelect('叙述人称', 'person', WA.data.STYLE_OPTIONS.person),
      labeledSelect('整体语气基调', 'tone', WA.data.STYLE_OPTIONS.tone),
      labeledSelect('节奏偏好', 'pace', WA.data.STYLE_OPTIONS.pace),
      labeledSelect('句式偏好', 'sentence', WA.data.STYLE_OPTIONS.sentence),
      labeledText('喜欢/参考的作家或作品', 'refs', '例如：钱钟书、村上春树、《百年孤独》'),
      labeledText('目标读者', 'audience', '例如：青年读者、类型小说爱好者'),
      labeledText('篇幅目标（字数）', 'lengthGoal', '例如：短篇 5000 字 / 长篇 15 万字')
    ])
  ]));
};

window.WA = WA;

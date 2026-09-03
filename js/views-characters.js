/* 视图：人物档案 */
var WA = window.WA || {};
WA.views = WA.views || {};

WA.views.characters = function (container, ctx) {
  var el = WA.utils.el;
  var project = ctx.project;

  var fieldDefs = [
    { key: 'name', label: '姓名', type: 'text' },
    { key: 'alias', label: '别名 / 称号', type: 'text' },
    { key: 'age', label: '年龄 / 身份', type: 'text' },
    { key: 'appearance', label: '外貌特征', type: 'area' },
    { key: 'personality', label: '性格（优点与缺点）', type: 'area' },
    { key: 'goal', label: '目标 / 动机', type: 'area' },
    { key: 'fear', label: '恐惧 / 弱点', type: 'area' },
    { key: 'backstory', label: '背景故事', type: 'area' },
    { key: 'arc', label: '人物弧光（开头 → 结尾的变化）', type: 'area' },
    { key: 'relationships', label: '人物关系', type: 'area' }
  ];

  var addBtn = el('button', {
    class: 'btn btn-primary',
    onclick: function () {
      project.characters.push({
        id: WA.storage.uid(), name: '新角色', alias: '', age: '', appearance: '',
        personality: '', goal: '', fear: '', backstory: '', arc: '', relationships: '', collapsed: false
      });
      ctx.save();
      ctx.renderCurrentView();
    }
  }, ['+ 新建人物']);

  container.appendChild(el('div', { class: 'card' }, [
    el('div', { class: 'card-head' }, [el('h3', {}, ['人物档案 (' + project.characters.length + ')']), addBtn])
  ]));

  project.characters.forEach(function (c) {
    var titleEl = el('h4', {}, [(c.collapsed ? '▶ ' : '▼ ') + (c.name || '未命名角色')]);
    var body = el('div', { class: 'field-grid' });
    if (!c.collapsed) {
      fieldDefs.forEach(function (f) {
        var input;
        if (f.type === 'text') {
          input = el('input', {
            class: 'input', type: 'text', value: c[f.key] || '',
            oninput: WA.utils.debounce(function (e) {
              c[f.key] = e.target.value;
              ctx.save();
              if (f.key === 'name') titleEl.textContent = (c.collapsed ? '▶ ' : '▼ ') + (c.name || '未命名角色');
            }, 300)
          });
        } else {
          input = el('textarea', {
            class: 'input textarea-mid',
            oninput: WA.utils.debounce(function (e) { c[f.key] = e.target.value; ctx.save(); }, 300)
          }, [c[f.key] || '']);
        }
        body.appendChild(el('div', { class: 'field' }, [el('label', {}, [f.label]), input]));
      });
    }

    var header = el('div', { class: 'card-head clickable', onclick: function () { c.collapsed = !c.collapsed; ctx.save(); ctx.renderCurrentView(); } }, [
      titleEl,
      el('button', {
        class: 'btn btn-tiny btn-danger-ghost',
        onclick: function (e) {
          e.stopPropagation();
          if (confirm('删除角色"' + c.name + '"？')) {
            project.characters = project.characters.filter(function (x) { return x.id !== c.id; });
            ctx.save();
            ctx.renderCurrentView();
          }
        }
      }, ['删除'])
    ]);

    container.appendChild(el('div', { class: 'card character-card' }, [header, body]));
  });

  if (project.characters.length === 0) {
    container.appendChild(el('p', { class: 'muted' }, ['还没有人物，点击"新建人物"开始建档吧。']));
  }
};

window.WA = WA;

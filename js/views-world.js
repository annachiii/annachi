/* 视图：世界观设定 */
var WA = window.WA || {};
WA.views = WA.views || {};

WA.views.world = function (container, ctx) {
  var el = WA.utils.el;
  var project = ctx.project;
  var w = project.world;

  var fields = [
    { key: 'era', label: '时代 / 背景', placeholder: '故事发生的时间、时代氛围、科技或魔法水平……' },
    { key: 'locations', label: '主要地点', placeholder: '关键场景、地理环境、城市/乡野特征……' },
    { key: 'systemRules', label: '规则体系', placeholder: '魔法体系、科技原理、社会制度及其限制与代价……' },
    { key: 'factions', label: '阵营 / 势力', placeholder: '主要势力及其目标、彼此关系……' },
    { key: 'history', label: '历史大事记', placeholder: '影响当下故事的关键历史事件……' },
    { key: 'constraints', label: '设定边界与禁忌', placeholder: '写下"绝对不能违反"的规则，避免后续出现设定漏洞……' }
  ];

  var card = el('div', { class: 'card' }, [
    el('h3', {}, ['世界观设定']),
    el('p', { class: 'muted' }, ['把这里当作你世界的"圣经"，写作时随时回来查阅，保持前后一致。'])
  ]);

  fields.forEach(function (f) {
    var textarea = el('textarea', {
      class: 'input textarea-mid',
      placeholder: f.placeholder,
      oninput: WA.utils.debounce(function (e) { w[f.key] = e.target.value; ctx.save(); }, 400)
    }, [w[f.key] || '']);
    card.appendChild(el('div', { class: 'field' }, [el('label', {}, [f.label]), textarea]));
  });

  container.appendChild(card);
};

window.WA = WA;

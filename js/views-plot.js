/* 视图：情节 / 事件时间线 */
var WA = window.WA || {};
WA.views = WA.views || {};

WA.views.plot = function (container, ctx) {
  var el = WA.utils.el;
  var project = ctx.project;

  function moveEvent(idx, dir) {
    var target = idx + dir;
    if (target < 0 || target >= project.events.length) return;
    var tmp = project.events[idx];
    project.events[idx] = project.events[target];
    project.events[target] = tmp;
    ctx.save();
    ctx.renderCurrentView();
  }

  var addBtn = el('button', {
    class: 'btn btn-primary',
    onclick: function () {
      project.events.push({ id: WA.storage.uid(), time: '', desc: '', people: '', impact: '' });
      ctx.save();
      ctx.renderCurrentView();
    }
  }, ['+ 新增事件']);

  container.appendChild(el('div', { class: 'card' }, [
    el('div', { class: 'card-head' }, [el('h3', {}, ['情节 / 事件时间线']), addBtn]),
    el('p', { class: 'muted' }, ['按时间顺序梳理关键事件，理清因果链，方便后续搭建大纲。'])
  ]));

  project.events.forEach(function (ev, idx) {
    var timeInput = el('input', {
      class: 'input', type: 'text', placeholder: '时间点，如"第三天""多年前"', value: ev.time,
      oninput: WA.utils.debounce(function (e) { ev.time = e.target.value; ctx.save(); }, 300)
    });
    var descInput = el('textarea', {
      class: 'input textarea-small', placeholder: '事件描述',
      oninput: WA.utils.debounce(function (e) { ev.desc = e.target.value; ctx.save(); }, 300)
    }, [ev.desc]);
    var peopleInput = el('input', {
      class: 'input', type: 'text', placeholder: '涉及人物', value: ev.people,
      oninput: WA.utils.debounce(function (e) { ev.people = e.target.value; ctx.save(); }, 300)
    });
    var impactInput = el('input', {
      class: 'input', type: 'text', placeholder: '影响 / 后果', value: ev.impact,
      oninput: WA.utils.debounce(function (e) { ev.impact = e.target.value; ctx.save(); }, 300)
    });

    container.appendChild(el('div', { class: 'card event-card' }, [
      el('div', { class: 'card-head' }, [
        el('span', { class: 'tag' }, ['事件 ' + (idx + 1)]),
        el('div', {}, [
          el('button', { class: 'btn btn-tiny', onclick: function () { moveEvent(idx, -1); } }, ['↑']),
          el('button', { class: 'btn btn-tiny', onclick: function () { moveEvent(idx, 1); } }, ['↓']),
          el('button', {
            class: 'btn btn-tiny btn-danger-ghost',
            onclick: function () {
              project.events = project.events.filter(function (x) { return x.id !== ev.id; });
              ctx.save();
              ctx.renderCurrentView();
            }
          }, ['删除'])
        ])
      ]),
      el('div', { class: 'field-grid' }, [
        el('div', { class: 'field' }, [el('label', {}, ['时间点']), timeInput]),
        el('div', { class: 'field' }, [el('label', {}, ['涉及人物']), peopleInput]),
        el('div', { class: 'field span-2' }, [el('label', {}, ['事件描述']), descInput]),
        el('div', { class: 'field span-2' }, [el('label', {}, ['影响 / 后果']), impactInput])
      ])
    ]));
  });

  if (project.events.length === 0) {
    container.appendChild(el('p', { class: 'muted' }, ['还没有事件，点击"新增事件"开始梳理情节吧。']));
  }
};

window.WA = WA;

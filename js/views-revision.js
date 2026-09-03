/* 视图：修订检查清单 */
var WA = window.WA || {};
WA.views = WA.views || {};

WA.views.revision = function (container, ctx) {
  var el = WA.utils.el;
  var project = ctx.project;
  var items = WA.data.REVISION_CHECKLISTS[project.textType] || WA.data.REVISION_CHECKLISTS.other;
  var checked = project.revision.checkedItems;

  var doneCount = items.filter(function (item) { return checked[item]; }).length;
  var pct = Math.round(doneCount / items.length * 100);

  var list = el('div', { class: 'checklist' }, items.map(function (item) {
    var id = 'chk_' + item.length + '_' + item.slice(0, 4);
    var checkbox = el('input', {
      type: 'checkbox', checked: checked[item] ? 'checked' : undefined,
      onchange: function (e) {
        checked[item] = e.target.checked;
        ctx.save();
        ctx.renderCurrentView();
      }
    });
    return el('label', { class: 'checklist-item' + (checked[item] ? ' done' : '') }, [checkbox, el('span', {}, [item])]);
  }));

  container.appendChild(el('div', { class: 'card' }, [
    el('h3', {}, ['修订检查清单 · ' + WA.utils.textTypeName(project.textType)]),
    el('div', { class: 'progress-bar' }, [el('div', { class: 'progress-fill', style: 'width:' + pct + '%' })]),
    el('p', { class: 'muted small' }, ['已完成 ' + doneCount + ' / ' + items.length]),
    list
  ]));
};

window.WA = WA;

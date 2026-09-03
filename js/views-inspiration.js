/* 视图：灵感启发（主题/冲突/开篇/如果.../意象 随机生成 + 收藏 + 名字生成器 + 灵感手记） */
var WA = window.WA || {};
WA.views = WA.views || {};

WA.views.inspiration = function (container, ctx) {
  var el = WA.utils.el;
  var project = ctx.project;
  var pick = WA.utils.pickRandom;

  function saveInspiration(text, category) {
    project.inspiration.saved.push({ id: WA.storage.uid(), text: text, category: category });
    ctx.save();
    ctx.renderCurrentView();
  }

  function removeInspiration(id) {
    project.inspiration.saved = project.inspiration.saved.filter(function (x) { return x.id !== id; });
    ctx.save();
    ctx.renderCurrentView();
  }

  function promptSection(title, bankKey, category) {
    var currentPicks = pick(WA.data.INSPIRATION_BANKS[bankKey], 3);
    var listEl = el('div', { class: 'prompt-list' });
    function render(picks) {
      listEl.innerHTML = '';
      picks.forEach(function (text) {
        listEl.appendChild(el('div', { class: 'prompt-item' }, [
          el('span', {}, [text]),
          el('button', { class: 'btn btn-tiny', onclick: function () { saveInspiration(text, category); } }, ['★ 收藏'])
        ]));
      });
    }
    render(currentPicks);
    var reroll = el('button', {
      class: 'btn btn-ghost btn-small',
      onclick: function () { render(pick(WA.data.INSPIRATION_BANKS[bankKey], 3)); }
    }, ['🔀 换一批']);
    return el('div', { class: 'card' }, [
      el('div', { class: 'card-head' }, [el('h3', {}, [title]), reroll]),
      listEl
    ]);
  }

  var savedList = el('div', { class: 'card' }, [
    el('h3', {}, ['已收藏的灵感 (' + project.inspiration.saved.length + ')']),
    project.inspiration.saved.length === 0
      ? el('p', { class: 'muted' }, ['点击上面的"★ 收藏"把喜欢的灵感存到这里。'])
      : el('div', { class: 'saved-list' }, project.inspiration.saved.map(function (item) {
        return el('div', { class: 'saved-item' }, [
          el('span', { class: 'tag' }, [item.category]),
          el('span', {}, [item.text]),
          el('button', { class: 'btn btn-tiny btn-danger-ghost', onclick: function () { removeInspiration(item.id); } }, ['移除'])
        ]);
      }))
  ]);

  var notesArea = el('textarea', {
    class: 'input textarea-notes',
    placeholder: '随手记录任何灵感碎片、句子、意象……',
    oninput: WA.utils.debounce(function (e) {
      project.inspiration.notes = e.target.value;
      ctx.save();
    }, 400)
  }, [project.inspiration.notes || '']);
  var notesCard = el('div', { class: 'card' }, [el('h3', {}, ['灵感手记']), notesArea]);

  // 名字生成器
  var nameStyleSelect = el('select', { class: 'input' }, [
    el('option', { value: 'cn_m' }, ['中文名（男）']),
    el('option', { value: 'cn_f' }, ['中文名（女）']),
    el('option', { value: 'western' }, ['西式姓名']),
    el('option', { value: 'place' }, ['地名/地点'])
  ]);
  var nameResultEl = el('div', { class: 'prompt-list' });
  function generateNames() {
    var d = WA.data.NAME_DATA;
    var results = [];
    var style = nameStyleSelect.value;
    for (var i = 0; i < 6; i++) {
      if (style === 'cn_m') results.push(pick(d.chineseSurnames, 1)[0] + pick(d.chineseGivenMale, 1)[0]);
      else if (style === 'cn_f') results.push(pick(d.chineseSurnames, 1)[0] + pick(d.chineseGivenFemale, 1)[0]);
      else if (style === 'western') results.push(pick(d.westernFirst, 1)[0] + ' ' + pick(d.westernLast, 1)[0]);
      else results.push(pick(d.places, 1)[0]);
    }
    nameResultEl.innerHTML = '';
    results.forEach(function (name) {
      nameResultEl.appendChild(el('div', { class: 'prompt-item' }, [
        el('span', {}, [name]),
        el('button', { class: 'btn btn-tiny', onclick: function () { saveInspiration(name, '命名') } }, ['★ 收藏'])
      ]));
    });
  }
  var nameCard = el('div', { class: 'card' }, [
    el('div', { class: 'card-head' }, [
      el('h3', {}, ['角色 / 地名生成器']),
      el('div', { class: 'form-row-inline' }, [nameStyleSelect, el('button', { class: 'btn btn-ghost btn-small', onclick: generateNames }, ['🎲 生成'])])
    ]),
    nameResultEl
  ]);
  generateNames();

  container.appendChild(promptSection('主题灵感', 'themes', '主题'));
  container.appendChild(promptSection('冲突设置', 'conflicts', '冲突'));
  container.appendChild(promptSection('开篇金句', 'openings', '开篇'));
  container.appendChild(promptSection('如果……会怎样', 'whatIfs', '设问'));
  container.appendChild(promptSection('氛围与意象', 'moods', '意象'));
  container.appendChild(nameCard);
  container.appendChild(notesCard);
  container.appendChild(savedList);
};

window.WA = WA;

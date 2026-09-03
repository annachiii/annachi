/* 写作助手 - 主控制器：布局、路由、状态管理 */
var WA = window.WA || {};

(function () {
  var el = WA.utils.el;
  var root = document.getElementById('app-root');

  var state = {
    project: null,
    view: 'dashboard',
    draftActiveChapter: null
  };

  function makeCtx() {
    var ctx = {
      project: state.project,
      save: function () { WA.storage.save(state.project); },
      renderCurrentView: render,
      openProject: openProject
    };
    Object.defineProperty(ctx, 'draftActiveChapter', {
      get: function () { return state.draftActiveChapter; },
      set: function (v) { state.draftActiveChapter = v; }
    });
    return ctx;
  }

  function openProject(id) {
    state.project = WA.storage.load(id);
    WA.storage.setActiveId(id);
    state.view = 'texttype';
    state.draftActiveChapter = null;
    render();
  }

  function backToDashboard() {
    state.project = null;
    state.view = 'dashboard';
    render();
  }

  function renderSidebar() {
    var nav = el('nav', { class: 'sidebar' });
    WA.data.STEPS.forEach(function (step) {
      if (step.id === 'dashboard') return;
      nav.appendChild(el('button', {
        class: 'nav-item' + (state.view === step.id ? ' active' : ''),
        onclick: function () { state.view = step.id; render(); }
      }, [el('span', { class: 'nav-icon' }, [step.icon]), el('span', {}, [step.name])]));
    });
    return nav;
  }

  function renderTopbar() {
    var project = state.project;
    var nameInput = el('input', {
      class: 'project-title-input', type: 'text', value: project.name,
      oninput: WA.utils.debounce(function (e) {
        project.name = e.target.value || '未命名作品';
        WA.storage.save(project);
      }, 300)
    });
    return el('div', { class: 'topbar' }, [
      el('button', { class: 'btn btn-ghost btn-small', onclick: backToDashboard }, ['← 我的作品']),
      nameInput,
      el('span', { class: 'tag' }, [WA.utils.textTypeName(project.textType)]),
      el('button', {
        class: 'btn btn-danger-ghost btn-small',
        onclick: function () {
          if (confirm('确定要删除《' + project.name + '》吗？此操作无法撤销。')) {
            WA.storage.remove(project.id);
            backToDashboard();
          }
        }
      }, ['删除此作品'])
    ]);
  }

  function render() {
    root.innerHTML = '';

    if (!state.project) {
      var shellNoProject = el('div', { class: 'app-shell no-project' }, [
        el('main', { class: 'main' }, [el('h1', { class: 'brand' }, ['✍️ 写作助手']), el('div', { class: 'main-inner', id: 'main-inner' })])
      ]);
      root.appendChild(shellNoProject);
      var container = document.getElementById('main-inner');
      WA.views.dashboard(container, makeCtx());
      return;
    }

    var shell = el('div', { class: 'app-shell' }, [
      renderSidebar(),
      el('main', { class: 'main' }, [
        renderTopbar(),
        el('div', { class: 'main-inner', id: 'main-inner' })
      ])
    ]);
    root.appendChild(shell);

    var mainInner = document.getElementById('main-inner');
    var ctx = makeCtx();

    var view = WA.views[state.view] || WA.views.dashboard;
    view(mainInner, ctx);
  }

  function init() {
    var activeId = WA.storage.getActiveId();
    if (activeId && WA.storage.load(activeId)) {
      openProject(activeId);
    } else {
      render();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();

window.WA = WA;

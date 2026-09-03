/* 写作助手 - 本地存储：项目的增删改查，全部数据保存在浏览器 localStorage 中 */
var WA = window.WA || {};
WA.storage = {};

(function () {
  var INDEX_KEY = 'wa_project_index';
  var PROJECT_KEY_PREFIX = 'wa_project_';
  var ACTIVE_KEY = 'wa_active_project';

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function readIndex() {
    try {
      return JSON.parse(localStorage.getItem(INDEX_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function writeIndex(list) {
    localStorage.setItem(INDEX_KEY, JSON.stringify(list));
  }

  function blankProject(name, textType) {
    var now = new Date().toISOString();
    return {
      id: uid(),
      name: name || '未命名作品',
      textType: textType || 'short_story',
      createdAt: now,
      updatedAt: now,
      style: { person: '', tone: '', pace: '', sentence: '', refs: '', audience: '', lengthGoal: '' },
      inspiration: { saved: [], notes: '' },
      world: { era: '', locations: '', systemRules: '', history: '', factions: '', constraints: '' },
      characters: [],
      events: [],
      outline: { structure: 'three_act', chapters: [] },
      draft: {},
      progress: { wordGoal: 500, dailyLog: {} },
      revision: { checkedItems: {} }
    };
  }

  WA.storage.list = function () {
    return readIndex().sort(function (a, b) { return b.updatedAt.localeCompare(a.updatedAt); });
  };

  WA.storage.create = function (name, textType) {
    var project = blankProject(name, textType);
    localStorage.setItem(PROJECT_KEY_PREFIX + project.id, JSON.stringify(project));
    var idx = readIndex();
    idx.push({ id: project.id, name: project.name, textType: project.textType, updatedAt: project.updatedAt });
    writeIndex(idx);
    WA.storage.setActiveId(project.id);
    return project;
  };

  WA.storage.load = function (id) {
    try {
      return JSON.parse(localStorage.getItem(PROJECT_KEY_PREFIX + id));
    } catch (e) {
      return null;
    }
  };

  WA.storage.save = function (project) {
    project.updatedAt = new Date().toISOString();
    localStorage.setItem(PROJECT_KEY_PREFIX + project.id, JSON.stringify(project));
    var idx = readIndex();
    var found = false;
    for (var i = 0; i < idx.length; i++) {
      if (idx[i].id === project.id) {
        idx[i].name = project.name;
        idx[i].textType = project.textType;
        idx[i].updatedAt = project.updatedAt;
        found = true;
        break;
      }
    }
    if (!found) idx.push({ id: project.id, name: project.name, textType: project.textType, updatedAt: project.updatedAt });
    writeIndex(idx);
  };

  WA.storage.remove = function (id) {
    localStorage.removeItem(PROJECT_KEY_PREFIX + id);
    var idx = readIndex().filter(function (p) { return p.id !== id; });
    writeIndex(idx);
    if (WA.storage.getActiveId() === id) {
      localStorage.removeItem(ACTIVE_KEY);
    }
  };

  WA.storage.setActiveId = function (id) {
    localStorage.setItem(ACTIVE_KEY, id);
  };

  WA.storage.getActiveId = function () {
    return localStorage.getItem(ACTIVE_KEY);
  };

  WA.storage.uid = uid;
})();

window.WA = WA;

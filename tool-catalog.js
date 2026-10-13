/* One presentation catalog for the sidebar and fullscreen tool chooser. */
(function (global) {
  'use strict';
  global.FZI = global.FZI || {};
  global.FZI.MathIllustration = global.FZI.MathIllustration || {};
  const MI = global.FZI.MathIllustration;

  const freeze = value => {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  };

  function create(definition) {
    if (!definition || !Array.isArray(definition.categories) || !Array.isArray(definition.splits)) throw new TypeError('Ongeldige gereedschapscatalogus.');
    const categories = definition.categories.map(category => {
      if (!category || typeof category.id !== 'string' || !category.id || typeof category.label !== 'string' || !category.label || !Array.isArray(category.entries)) throw new TypeError('Ongeldige gereedschapscategorie.');
      const entries = category.entries.map(entry => {
        if (!entry || !['implemented', 'planned'].includes(entry.status) || typeof entry.label !== 'string' || !entry.label) throw new TypeError('Ongeldig gereedschap.');
        if (entry.status === 'implemented') {
          if (typeof entry.id !== 'string' || !entry.id || typeof entry.commandToolId !== 'string' || !entry.commandToolId) throw new TypeError('Een werkend gereedschap vereist stabiele tool- en command-ID’s.');
          return { ...entry };
        }
        if ('id' in entry || 'commandToolId' in entry || 'splitGroup' in entry) throw new TypeError('Een geplande tool mag niet interactief zijn.');
        return { label: entry.label, status: 'planned', markup: entry.markup || '' };
      });
      return { id: category.id, label: category.label, entries };
    });
    const categoryIds = categories.map(category => category.id);
    if (new Set(categoryIds).size !== categoryIds.length) throw new TypeError('Dubbele categorie-ID.');
    const implemented = categories.flatMap(category => category.entries.filter(entry => entry.status === 'implemented'));
    const ids = implemented.map(entry => entry.id);
    if (new Set(ids).size !== ids.length) throw new TypeError('Dubbele tool-ID.');
    const splits = definition.splits.map(split => {
      if (!split || typeof split.id !== 'string' || !split.id || !Array.isArray(split.toolIds) || !split.toolIds.length || split.toolIds.some(id => !ids.includes(id)) || new Set(split.toolIds).size !== split.toolIds.length) throw new TypeError('Ongeldige splitgroep.');
      if (typeof split.mainId !== 'string' || !split.mainId || typeof split.toggleId !== 'string' || !split.toggleId || typeof split.menuId !== 'string' || !split.menuId) throw new TypeError('Een splitgroep vereist gekoppelde bedieningselementen.');
      return { storageKey: split.id, ...split, toolIds: split.toolIds.slice() };
    });
    const splitIds = splits.map(split => split.id);
    if (new Set(splitIds).size !== splitIds.length) throw new TypeError('Dubbele splitgroep-ID.');
    const entriesById = new Map(implemented.map(entry => [entry.id, entry]));
    for (const split of splits) for (const id of split.toolIds) {
      const entry = entriesById.get(id);
      if (entry.splitGroup && entry.splitGroup !== split.id) throw new TypeError('Een tool hoort bij meerdere splitgroepen.');
      entry.splitGroup = split.id;
    }
    const frozenCategories = freeze(categories);
    const frozenSplits = freeze(splits);
    const splitById = new Map(frozenSplits.map(split => [split.id, split]));
    const splitByTool = new Map(frozenSplits.flatMap(split => split.toolIds.map(id => [id, split])));
    return Object.freeze({
      list(surface) {
        if (!['sidebar', 'fullscreen'].includes(surface)) throw new TypeError('Onbekend gereedschapsoppervlak.');
        return frozenCategories;
      },
      splits: frozenSplits,
      getSplit(id) { return splitById.get(id) || null; },
      getSplitForTool(id) { return splitByTool.get(id) || null; },
      getTool(id) { return entriesById.get(id) || null; },
    });
  }

  function build(root) {
    if (!root || typeof root.querySelectorAll !== 'function') throw new TypeError('Gereedschapspaneel ontbreekt.');
    const categories = Array.from(root.querySelectorAll(':scope > [data-tool-category]')).map(category => {
      const summary = category.querySelector(':scope > summary');
      const label = summary?.firstChild?.textContent?.trim() || summary?.textContent?.trim();
      const entries = Array.from(category.querySelectorAll('[data-tool], .tool-placeholder')).map(element => {
        if (element.classList.contains('tool-placeholder')) return { label: element.textContent.trim(), status: 'planned', markup: element.innerHTML };
        const id = element.dataset.tool;
        return { id, label: element.textContent.trim(), status: 'implemented', commandToolId: id.startsWith('construct:') ? id : 'create:' + id, markup: element.innerHTML };
      });
      return { id: category.dataset.toolCategory, label, entries };
    });
    const splits = Array.from(root.querySelectorAll('[data-tool-split]')).map(group => {
      const id = group.dataset.toolSplit;
      const main = group.querySelector('[data-split-main]'), toggle = group.querySelector('[data-split-toggle]'), menu = group.querySelector('[data-split-menu]');
      if (!main || !toggle || !menu || main.dataset.splitMain !== id || toggle.dataset.splitToggle !== id || menu.dataset.splitMenu !== id) throw new TypeError('Splitgroep heeft niet-gekoppelde bedieningselementen: ' + id);
      return {
        id,
        mainId: main.id,
        toggleId: toggle.id,
        menuId: menu.id,
        storageKey: group.dataset.storageKey || id,
        menuMaxHeight: Number(group.dataset.menuMaxHeight) || null,
        toolIds: Array.from(menu.querySelectorAll('[data-tool]')).map(item => item.dataset.tool),
      };
    });
    const catalog = create({ categories, splits });
    // Verify that every split menu is represented once and that its items also
    // occur exactly once in the catalog used by both surfaces.
    const splitItems = splits.flatMap(split => split.toolIds);
    for (const id of splitItems) if (!catalog.getTool(id)) throw new TypeError('Splitmenu verwijst naar een onbekende tool: ' + id);
    return catalog;
  }

  MI.ToolCatalog = Object.freeze({ build, create });
})(window);

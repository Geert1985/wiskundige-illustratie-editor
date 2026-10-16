/* UI-LEFT-1: sidebar-only disclosure and live tool search.
 * Every tool is a standalone button under a collapsible category or subgroup.
 */
(function (global) {
  'use strict';
  const doc = global.document;
  const root = doc?.getElementById('toolGrid');
  const search = doc?.getElementById('toolSearch');
  const feedback = doc?.getElementById('toolSearchFeedback');
  if (!root || !search || !feedback) return;

  const categories = Array.from(root.querySelectorAll(':scope > [data-tool-category]'));
  const subgroups = Array.from(root.querySelectorAll('[data-tool-subgroup]'));
  let beforeSearch = null;
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('nl').trim();
  const matching = (value, query) => normalize(value).includes(query);
  const setHidden = (element, hidden) => {
    if (hidden) element.dataset.searchHidden = 'true';
    else delete element.dataset.searchHidden;
  };
  const controls = subgroup => ({
    toggle: subgroup.querySelector(':scope > .tool-subgroup-toggle'),
    label: subgroup.querySelector(':scope > .tool-subgroup-label'),
    panel: subgroup.querySelector(':scope > .tool-grid')
  });
  function setExpanded(subgroup, expanded) {
    const {toggle, panel} = controls(subgroup);
    if (!toggle || !panel) return;
    toggle.setAttribute('aria-expanded', String(expanded));
    panel.hidden = !expanded;
  }
  for (const subgroup of subgroups) {
    const {toggle, label, panel} = controls(subgroup);
    if (toggle && (!panel || toggle.getAttribute('aria-controls') !== panel.id)) throw Error('Ongeldige gereedschapssubgroep.');
    if (!toggle && (!label || panel || subgroup.querySelector('.tool-grid, .tool-placeholder'))) throw Error('Ongeldige lege gereedschapssubcategorie.');
    if (toggle) setExpanded(subgroup, false);
  }

  root.addEventListener('click', event => {
    const toggle = event.target.closest?.('.tool-subgroup-toggle');
    if (!toggle || !root.contains(toggle)) return;
    const subgroup = toggle.closest('[data-tool-subgroup]');
    setExpanded(subgroup, toggle.getAttribute('aria-expanded') !== 'true');
  });

  const categoryLabel = category => category.querySelector(':scope > summary')?.firstChild?.textContent || '';
  function filter() {
    const query = normalize(search.value);
    if (!query) {
      for (const element of root.querySelectorAll('[data-search-hidden]')) setHidden(element, false);
      if (beforeSearch) {
        for (const [category, opened] of beforeSearch.categories) category.open = opened;
        for (const [subgroup, opened] of beforeSearch.subgroups) setExpanded(subgroup, opened);
      }
      beforeSearch = null;
      feedback.textContent = '';
      feedback.hidden = true;
      return;
    }
    if (!beforeSearch) {
      beforeSearch = {
        categories: categories.map(category => [category, category.open]),
        subgroups: subgroups.map(subgroup => [subgroup, controls(subgroup).toggle?.getAttribute('aria-expanded') === 'true'])
      };
    }
    let matches = 0;
    for (const category of categories) {
      const allCategory = matching(categoryLabel(category), query);
      const entries = Array.from(category.querySelectorAll('.tool-grid > .tool'));
      const placeholders = Array.from(category.querySelectorAll('.tool-placeholder'));
      for (const entry of entries) {
        const subgroup = entry.closest('[data-tool-subgroup]');
        const allSubgroup = subgroup && matching(controls(subgroup).toggle?.textContent || controls(subgroup).label?.textContent, query);
        const visible = allCategory || allSubgroup || matching(entry.dataset.tool + ' ' + entry.textContent, query);
        setHidden(entry, !visible);
        if (visible) matches += 1;
      }
      for (const placeholder of placeholders) {
        const subgroup = placeholder.closest('[data-tool-subgroup]');
        const allSubgroup = subgroup && matching(controls(subgroup).toggle?.textContent || controls(subgroup).label?.textContent, query);
        const visible = allCategory || allSubgroup || matching(placeholder.textContent, query);
        setHidden(placeholder, !visible);
        if (visible) matches += 1;
      }
      for (const subgroup of category.querySelectorAll('[data-tool-subgroup]')) {
        const {toggle, label} = controls(subgroup);
        const visible = Array.from(subgroup.querySelectorAll('.tool-grid > .tool, .tool-placeholder')).some(entry => entry.dataset.searchHidden !== 'true') || (!toggle && (allCategory || matching(label.textContent, query)));
        setHidden(subgroup, !visible);
        if (toggle) setExpanded(subgroup, visible);
        else if (matching(label.textContent, query)) matches += 1;
      }
      for (const planned of category.querySelectorAll('.planned-tools')) {
        const visible = Array.from(planned.querySelectorAll('.tool-placeholder')).some(entry => entry.dataset.searchHidden !== 'true');
        setHidden(planned, !visible);
      }
      const visible = entries.some(entry => entry.dataset.searchHidden !== 'true') || placeholders.some(entry => entry.dataset.searchHidden !== 'true') || Array.from(category.querySelectorAll('.tool-subgroup-empty')).some(entry => entry.dataset.searchHidden !== 'true');
      setHidden(category, !visible);
      category.open = visible;
    }
    feedback.hidden = false;
    feedback.textContent = matches === 0 ? 'Geen gereedschap gevonden.' : matches === 1 ? '1 gereedschap gevonden.' : matches + ' gereedschappen gevonden.';
  }

  search.addEventListener('input', filter);
  search.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !search.value) return;
    event.preventDefault();
    event.stopPropagation();
    search.value = '';
    filter();
  });
  filter();
})(window);

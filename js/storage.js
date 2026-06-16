const Storage = {
  PREFIX: 'decoration_',

  get(key) {
    try {
      const item = localStorage.getItem(this.PREFIX + key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Storage get error:', e);
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(this.PREFIX + key);
      return true;
    } catch (e) {
      console.error('Storage remove error:', e);
      return false;
    }
  },

  getProjectList() {
    return this.get('projectsList') || [];
  },

  setProjectList(list) {
    return this.set('projectsList', list);
  },

  addProjectToList(project) {
    const list = this.getProjectList();
    const exists = list.find(p => p.id === project.id);
    if (!exists) {
      list.push({
        id: project.id,
        name: project.name,
        area: project.area,
        houseType: project.houseType,
        ownerName: project.ownerName,
        startDate: project.startDate,
        createdAt: project.createdAt
      });
    }
    return this.setProjectList(list);
  },

  removeProjectFromList(projectId) {
    const list = this.getProjectList().filter(p => p.id !== projectId);
    return this.setProjectList(list);
  },

  getCurrentProjectId() {
    return this.get('currentProjectId');
  },

  setCurrentProjectId(projectId) {
    return this.set('currentProjectId', projectId);
  },

  getProject() {
    const id = this.getCurrentProjectId();
    if (!id) return this.get('currentProject');
    return this.getProjectById(id);
  },

  setProject(project) {
    this.addProjectToList(project);
    this.setCurrentProjectId(project.id);
    return this.set(`project_${project.id}_meta`, project);
  },

  getProjectById(projectId) {
    return this.get(`project_${projectId}_meta`);
  },

  cloneProject(sourceProjectId, newName) {
    const sourceMeta = this.getProjectById(sourceProjectId);
    if (!sourceMeta) return null;

    const newId = this.generateId('proj');
    const newMeta = {
      ...sourceMeta,
      id: newId,
      name: newName,
      createdAt: new Date().toISOString()
    };

    this.set(`project_${newId}_meta`, newMeta);
    this.addProjectToList(newMeta);

    const sourceUsages = this.getMaterialUsagesById(sourceProjectId);
    this.setMaterialUsagesById(newId, sourceUsages.map(u => ({
      ...u,
      id: this.generateId('usage'),
      projectId: newId
    })));

    const sourceCustom = this.getCustomItemsById(sourceProjectId);
    this.setCustomItemsById(newId, sourceCustom.map(c => ({
      ...c,
      id: this.generateId('custom'),
      projectId: newId
    })));

    const sourceProgress = this.getProgressById(sourceProjectId);
    this.setProgressById(newId, sourceProgress.map(p => ({ ...p, photos: [...(p.photos || [])] })));

    const sourceSuppliers = this.getSuppliersById(sourceProjectId);
    this.setSuppliersById(newId, sourceSuppliers.map(s => ({ ...s })));

    return newMeta;
  },

  deleteProject(projectId) {
    this.removeProjectFromList(projectId);
    this.remove(`project_${projectId}_meta`);
    this.remove(`project_${projectId}_usages`);
    this.remove(`project_${projectId}_custom`);
    this.remove(`project_${projectId}_progress`);
    this.remove(`project_${projectId}_suppliers`);
    this.remove(`project_${projectId}_history`);

    const currentId = this.getCurrentProjectId();
    if (currentId === projectId) {
      const list = this.getProjectList();
      if (list.length > 0) {
        this.setCurrentProjectId(list[0].id);
      } else {
        this.remove('currentProjectId');
        this.remove('currentProject');
      }
    }
    return true;
  },

  _getProjectPrefix() {
    const id = this.getCurrentProjectId();
    return id ? `project_${id}_` : '';
  },

  getMaterialUsages() {
    const prefix = this._getProjectPrefix();
    if (prefix) return this.getMaterialUsagesById(this.getCurrentProjectId());
    return this.get('materialUsages') || [];
  },

  getMaterialUsagesById(projectId) {
    return this.get(`project_${projectId}_usages`) || [];
  },

  setMaterialUsages(usages) {
    const prefix = this._getProjectPrefix();
    if (prefix) return this.setMaterialUsagesById(this.getCurrentProjectId(), usages);
    return this.set('materialUsages', usages);
  },

  setMaterialUsagesById(projectId, usages) {
    return this.set(`project_${projectId}_usages`, usages);
  },

  addMaterialUsage(usage) {
    const usages = this.getMaterialUsages();
    usages.push(usage);
    this.pushHistory('usages', { type: 'add', data: usage });
    return this.setMaterialUsages(usages);
  },

  removeMaterialUsage(id) {
    const usages = this.getMaterialUsages();
    const removed = usages.find(u => u.id === id);
    const filtered = usages.filter(u => u.id !== id);
    if (removed) {
      this.pushHistory('usages', { type: 'remove', data: removed });
    }
    return this.setMaterialUsages(filtered);
  },

  updateMaterialUsage(id, updates) {
    const usages = this.getMaterialUsages();
    const index = usages.findIndex(u => u.id === id);
    if (index !== -1) {
      const oldData = { ...usages[index] };
      usages[index] = { ...usages[index], ...updates };
      this.pushHistory('usages', { type: 'update', oldData, newData: { ...usages[index] } });
      return this.setMaterialUsages(usages);
    }
    return false;
  },

  getCustomItems() {
    const prefix = this._getProjectPrefix();
    if (prefix) return this.getCustomItemsById(this.getCurrentProjectId());
    return this.get('customItems') || [];
  },

  getCustomItemsById(projectId) {
    return this.get(`project_${projectId}_custom`) || [];
  },

  setCustomItems(items) {
    const prefix = this._getProjectPrefix();
    if (prefix) return this.setCustomItemsById(this.getCurrentProjectId(), items);
    return this.set('customItems', items);
  },

  setCustomItemsById(projectId, items) {
    return this.set(`project_${projectId}_custom`, items);
  },

  addCustomItem(item) {
    const items = this.getCustomItems();
    items.push(item);
    this.pushHistory('custom', { type: 'add', data: item });
    return this.setCustomItems(items);
  },

  removeCustomItem(id) {
    const items = this.getCustomItems();
    const removed = items.find(i => i.id === id);
    const filtered = items.filter(i => i.id !== id);
    if (removed) {
      this.pushHistory('custom', { type: 'remove', data: removed });
    }
    return this.setCustomItems(filtered);
  },

  updateCustomItem(id, updates) {
    const items = this.getCustomItems();
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      const oldData = { ...items[index] };
      items[index] = { ...items[index], ...updates };
      this.pushHistory('custom', { type: 'update', oldData, newData: { ...items[index] } });
      return this.setCustomItems(items);
    }
    return false;
  },

  getProgress() {
    const prefix = this._getProjectPrefix();
    if (prefix) return this.getProgressById(this.getCurrentProjectId());
    return this.get('stageProgress') || [];
  },

  getProgressById(projectId) {
    return this.get(`project_${projectId}_progress`) || [];
  },

  setProgress(progress) {
    const prefix = this._getProjectPrefix();
    if (prefix) return this.setProgressById(this.getCurrentProjectId(), progress);
    return this.set('stageProgress', progress);
  },

  setProgressById(projectId, progress) {
    return this.set(`project_${projectId}_progress`, progress);
  },

  updateProgress(stageId, updates) {
    const progress = this.getProgress();
    const index = progress.findIndex(p => p.stageId === stageId);
    if (index !== -1) {
      progress[index] = { ...progress[index], ...updates };
      return this.setProgress(progress);
    }
    return false;
  },

  getSuppliers() {
    const prefix = this._getProjectPrefix();
    if (prefix) return this.getSuppliersById(this.getCurrentProjectId());
    return this.get('suppliers') || [];
  },

  getSuppliersById(projectId) {
    return this.get(`project_${projectId}_suppliers`) || [];
  },

  setSuppliers(suppliers) {
    const prefix = this._getProjectPrefix();
    if (prefix) return this.setSuppliersById(this.getCurrentProjectId(), suppliers);
    return this.set('suppliers', suppliers);
  },

  setSuppliersById(projectId, suppliers) {
    return this.set(`project_${projectId}_suppliers`, suppliers);
  },

  addSupplier(supplier) {
    const suppliers = this.getSuppliers();
    suppliers.push(supplier);
    return this.setSuppliers(suppliers);
  },

  removeSupplier(id) {
    const suppliers = this.getSuppliers().filter(s => s.id !== id);
    return this.setSuppliers(suppliers);
  },

  updateSupplier(id, updates) {
    const suppliers = this.getSuppliers();
    const index = suppliers.findIndex(s => s.id === id);
    if (index !== -1) {
      suppliers[index] = { ...suppliers[index], ...updates };
      return this.setSuppliers(suppliers);
    }
    return false;
  },

  initProgress(stages) {
    const existing = this.getProgress();
    if (existing.length > 0) return existing;

    const progress = stages.map(stage => ({
      id: 'prog_' + stage.id,
      stageId: stage.id,
      stageName: stage.name,
      plannedDays: stage.plannedDays,
      actualStartDate: '',
      actualEndDate: '',
      completionPercent: 0,
      photos: [],
      status: 'pending'
    }));
    this.setProgress(progress);
    return progress;
  },

  initSuppliers(materials) {
    const existing = this.getSuppliers();
    if (existing.length > 0) return existing;

    const suppliers = materials.map(material => ({
      id: 'sup_' + material.id,
      materialId: material.id,
      materialName: material.name,
      name: '',
      contact: '',
      phone: '',
      address: '',
      remark: ''
    }));
    this.setSuppliers(suppliers);
    return suppliers;
  },

  pushHistory(module, record) {
    const key = this._getProjectPrefix() + 'history';
    const fullKey = this.PREFIX + key;
    try {
      const raw = localStorage.getItem(fullKey);
      const history = raw ? JSON.parse(raw) : { usages: [], custom: [] };
      const arr = history[module] || [];
      arr.push({ ...record, timestamp: Date.now() });
      if (arr.length > 50) arr.shift();
      history[module] = arr;
      localStorage.setItem(fullKey, JSON.stringify(history));
    } catch (e) {
      console.error('History push error:', e);
    }
  },

  popHistory(module) {
    const key = this._getProjectPrefix() + 'history';
    const fullKey = this.PREFIX + key;
    try {
      const raw = localStorage.getItem(fullKey);
      if (!raw) return null;
      const history = JSON.parse(raw);
      const arr = history[module] || [];
      if (arr.length === 0) return null;
      const record = arr.pop();
      localStorage.setItem(fullKey, JSON.stringify(history));
      return record;
    } catch (e) {
      console.error('History pop error:', e);
      return null;
    }
  },

  undoLastAction(module) {
    const record = this.popHistory(module);
    if (!record) return { success: false, message: '没有可撤销的操作' };

    if (module === 'usages') {
      const usages = this.getMaterialUsages();
      if (record.type === 'add') {
        const filtered = usages.filter(u => u.id !== record.data.id);
        this.setMaterialUsages(filtered);
        return { success: true, message: '已撤销添加' };
      } else if (record.type === 'remove') {
        usages.push(record.data);
        this.setMaterialUsages(usages);
        return { success: true, message: '已恢复删除项' };
      } else if (record.type === 'update') {
        const idx = usages.findIndex(u => u.id === record.oldData.id);
        if (idx !== -1) {
          usages[idx] = record.oldData;
          this.setMaterialUsages(usages);
          return { success: true, message: '已撤销修改' };
        }
      }
    } else if (module === 'custom') {
      const items = this.getCustomItems();
      if (record.type === 'add') {
        const filtered = items.filter(i => i.id !== record.data.id);
        this.setCustomItems(filtered);
        return { success: true, message: '已撤销添加' };
      } else if (record.type === 'remove') {
        items.push(record.data);
        this.setCustomItems(items);
        return { success: true, message: '已恢复删除项' };
      } else if (record.type === 'update') {
        const idx = items.findIndex(i => i.id === record.oldData.id);
        if (idx !== -1) {
          items[idx] = record.oldData;
          this.setCustomItems(items);
          return { success: true, message: '已撤销修改' };
        }
      }
    }
    return { success: false, message: '撤销失败' };
  },

  clearAll() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  },

  generateId(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
};

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

  getProject() {
    return this.get('currentProject');
  },

  setProject(project) {
    return this.set('currentProject', project);
  },

  getMaterialUsages() {
    return this.get('materialUsages') || [];
  },

  setMaterialUsages(usages) {
    return this.set('materialUsages', usages);
  },

  addMaterialUsage(usage) {
    const usages = this.getMaterialUsages();
    usages.push(usage);
    return this.setMaterialUsages(usages);
  },

  removeMaterialUsage(id) {
    const usages = this.getMaterialUsages().filter(u => u.id !== id);
    return this.setMaterialUsages(usages);
  },

  updateMaterialUsage(id, updates) {
    const usages = this.getMaterialUsages();
    const index = usages.findIndex(u => u.id === id);
    if (index !== -1) {
      usages[index] = { ...usages[index], ...updates };
      return this.setMaterialUsages(usages);
    }
    return false;
  },

  getCustomItems() {
    return this.get('customItems') || [];
  },

  setCustomItems(items) {
    return this.set('customItems', items);
  },

  addCustomItem(item) {
    const items = this.getCustomItems();
    items.push(item);
    return this.setCustomItems(items);
  },

  removeCustomItem(id) {
    const items = this.getCustomItems().filter(i => i.id !== id);
    return this.setCustomItems(items);
  },

  updateCustomItem(id, updates) {
    const items = this.getCustomItems();
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      return this.setCustomItems(items);
    }
    return false;
  },

  getProgress() {
    return this.get('stageProgress') || [];
  },

  setProgress(progress) {
    return this.set('stageProgress', progress);
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
    return this.get('suppliers') || [];
  },

  setSuppliers(suppliers) {
    return this.set('suppliers', suppliers);
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

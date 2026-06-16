const App = {
  state: {
    selectedHouseType: null,
    currentProject: null,
    currentHouse: null,
    currentPage: 'project',
    tempMaterial: null,
    tempAreaId: null,
    tempStage: null,
    tempPhotos: [],
    tempSupplier: null
  },

  init() {
    this.renderHouseTypes();
    this.setupEventListeners();
    this.checkExistingProject();
    DragManager.init();
    DragManager.onDrop((areaId, material) => this.handleMaterialDrop(areaId, material));
  },

  setupEventListeners() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => this.navigateTo(item.dataset.page));
    });

    document.getElementById('create-project-btn').addEventListener('click', () => this.createProject());
    document.getElementById('clear-data-btn').addEventListener('click', () => this.clearAllData());

    document.getElementById('modal-quantity').addEventListener('input', (e) => this.updateModalBudget());
    document.getElementById('modal-confirm-btn').addEventListener('click', () => this.confirmMaterialAdd());
    document.getElementById('add-custom-item-btn').addEventListener('click', () => this.openCustomItemModal());
    document.getElementById('custom-item-confirm-btn').addEventListener('click', () => this.confirmCustomItem());
    document.getElementById('stage-completion').addEventListener('input', (e) => {
      document.getElementById('completion-value').textContent = e.target.value;
    });
    document.getElementById('stage-confirm-btn').addEventListener('click', () => this.confirmStageEdit());
    document.getElementById('supplier-confirm-btn').addEventListener('click', () => this.confirmSupplierEdit());

    document.getElementById('export-excel-btn').addEventListener('click', () => this.exportExcel());
    document.getElementById('export-progress-btn').addEventListener('click', () => this.exportProgress());

    document.getElementById('photo-input').addEventListener('change', (e) => this.handlePhotoUpload(e));

    document.getElementById('image-modal').addEventListener('click', () => {
      document.getElementById('image-modal').style.display = 'none';
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
          modal.classList.remove('active');
        });
        document.getElementById('image-modal').style.display = 'none';
      }
    });
  },

  navigateTo(page) {
    this.state.currentPage = page;

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    document.querySelectorAll('.page').forEach(p => {
      p.classList.toggle('active', p.id === `page-${page}`);
    });

    const titles = {
      project: '项目管理',
      budget: '材料预算',
      progress: '施工进度',
      comparison: '对比分析',
      supplier: '供应商管理',
      export: '导出中心'
    };
    document.getElementById('page-title').textContent = titles[page] || '';

    if (page === 'budget') {
      this.renderMaterialLibrary();
      this.renderBudgetPanel();
      this.renderCustomItems();
    } else if (page === 'progress') {
      this.renderProgressSummary();
      this.renderStagesTimeline();
    } else if (page === 'comparison') {
      this.renderComparisonSummary();
      this.renderComparisonTable();
    } else if (page === 'supplier') {
      this.renderSuppliers();
    }
  },

  renderHouseTypes() {
    const container = document.getElementById('house-types');
    container.innerHTML = PRESET_DATA.houseTypes.map(house => `
      <div class="house-type-card ${this.state.selectedHouseType === house.id ? 'selected' : ''}"
           data-house-id="${house.id}">
        <div class="house-icon">🏠</div>
        <div class="house-name">${house.name}</div>
        <div class="house-area">${house.area} ㎡</div>
        <div class="house-rooms">
          ${house.rooms.map(room => `<span class="room-tag">${room.name}</span>`).join('')}
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.house-type-card').forEach(card => {
      card.addEventListener('click', () => {
        this.state.selectedHouseType = card.dataset.houseId;
        this.renderHouseTypes();
        this.renderFloorPlan();
      });
    });
  },

  renderFloorPlan() {
    const house = PRESET_DATA.houseTypes.find(h => h.id === this.state.selectedHouseType);
    if (!house) return;

    this.state.currentHouse = house;
    const card = document.getElementById('floor-plan-card');
    card.style.display = 'block';

    const svg = document.getElementById('floor-plan-svg');
    const maxX = Math.max(...house.rooms.map(r => r.x + r.width)) + 20;
    const maxY = Math.max(...house.rooms.map(r => r.y + r.height)) + 20;
    svg.setAttribute('viewBox', `0 0 ${maxX} ${maxY}`);

    const usages = Storage.getMaterialUsages();

    svg.innerHTML = house.rooms.map(room => {
      const color = PRESET_DATA.roomColorMap[room.type] || '#f0f0f0';
      const roomUsages = usages.filter(u => u.areaId === room.id);
      const materialNames = roomUsages.map(u => {
        const material = PRESET_DATA.materials.find(m => m.id === u.materialId);
        return material ? material.name : '';
      }).filter(Boolean).join(', ');

      const centerX = room.x + room.width / 2;
      const centerY = room.y + room.height / 2;

      return `
        <rect class="room-area drop-target"
              data-area-id="${room.id}"
              x="${room.x}" y="${room.y}"
              width="${room.width}" height="${room.height}"
              fill="${color}" />
        <text class="room-label" x="${centerX}" y="${centerY - 5}" text-anchor="middle">${room.name}</text>
        ${materialNames ? `<text class="room-material-tag" x="${centerX}" y="${centerY + 12}" text-anchor="middle">${materialNames}</text>` : ''}
      `;
    }).join('');
  },

  createProject() {
    if (!this.state.selectedHouseType) {
      alert('请先选择户型');
      return;
    }

    const name = document.getElementById('project-name').value.trim();
    const ownerName = document.getElementById('owner-name').value.trim();
    const ownerPhone = document.getElementById('owner-phone').value.trim();
    const startDate = document.getElementById('start-date').value;

    if (!name) {
      alert('请输入项目名称');
      return;
    }

    const house = PRESET_DATA.houseTypes.find(h => h.id === this.state.selectedHouseType);
    const project = {
      id: Storage.generateId('proj'),
      name,
      ownerName,
      ownerPhone,
      area: house.area,
      houseType: this.state.selectedHouseType,
      startDate: startDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    Storage.setProject(project);
    this.state.currentProject = project;

    Storage.initProgress(PRESET_DATA.stages);
    Storage.initSuppliers(PRESET_DATA.materials);

    this.updateProjectInfoBar();
    this.renderFloorPlan();
    alert('项目创建成功！');
    this.navigateTo('budget');
  },

  checkExistingProject() {
    const project = Storage.getProject();
    if (project) {
      this.state.currentProject = project;
      this.state.selectedHouseType = project.houseType;
      this.state.currentHouse = PRESET_DATA.houseTypes.find(h => h.id === project.houseType);

      document.getElementById('project-name').value = project.name;
      document.getElementById('owner-name').value = project.ownerName || '';
      document.getElementById('owner-phone').value = project.ownerPhone || '';
      document.getElementById('start-date').value = project.startDate || '';

      this.renderHouseTypes();
      this.renderFloorPlan();
      this.updateProjectInfoBar();
    }
  },

  updateProjectInfoBar() {
    const bar = document.getElementById('project-info-bar');
    if (this.state.currentProject) {
      bar.style.display = 'flex';
      document.getElementById('topbar-project-name').textContent = this.state.currentProject.name;
      document.getElementById('topbar-project-area').textContent = this.state.currentProject.area + ' ㎡';
    } else {
      bar.style.display = 'none';
    }
  },

  clearAllData() {
    if (confirm('确定要清空所有数据吗？此操作不可恢复。')) {
      Storage.clearAll();
      this.state.currentProject = null;
      this.state.selectedHouseType = null;
      this.state.currentHouse = null;
      location.reload();
    }
  },

  renderMaterialLibrary() {
    const container = document.getElementById('material-categories');
    container.innerHTML = PRESET_DATA.materialCategories.map(category => {
      const materials = PRESET_DATA.materials.filter(m => m.categoryId === category.id);
      return `
        <div class="category-section">
          <div class="category-header" data-category="${category.id}">
            <span class="icon">${category.icon}</span>
            <span>${category.name}</span>
            <span class="toggle">▼</span>
          </div>
          <div class="materials-grid" data-category-grid="${category.id}">
            ${materials.map(material => `
              <div class="material-card" data-material-id="${material.id}">
                <div class="material-color" style="background-color: ${material.color}"></div>
                <div class="material-name">${material.name}</div>
                <div class="material-spec">${material.spec}</div>
                <div class="material-price">¥${material.unitPrice}/${material.unit}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.category-header').forEach(header => {
      header.addEventListener('click', () => {
        const categoryId = header.dataset.category;
        const grid = container.querySelector(`[data-category-grid="${categoryId}"]`);
        header.classList.toggle('collapsed');
        grid.classList.toggle('collapsed');
      });
    });
  },

  handleMaterialDrop(areaId, material) {
    if (!this.state.currentProject) {
      alert('请先创建项目');
      return;
    }

    const room = this.state.currentHouse.rooms.find(r => r.id === areaId);
    if (!room) return;

    this.state.tempMaterial = material;
    this.state.tempAreaId = areaId;

    document.getElementById('modal-material-name').value = material.name;
    document.getElementById('modal-area-name').value = room.name;
    document.getElementById('modal-unit-price').value = '¥' + material.unitPrice + '/' + material.unit;
    document.getElementById('modal-unit').value = material.unit;
    document.getElementById('modal-quantity').value = 1;
    document.getElementById('modal-actual-cost').value = '';
    this.updateModalBudget();

    this.openModal('material-modal');
  },

  updateModalBudget() {
    const quantity = parseFloat(document.getElementById('modal-quantity').value) || 0;
    const price = this.state.tempMaterial ? this.state.tempMaterial.unitPrice : 0;
    const budget = quantity * price;
    document.getElementById('modal-budget-cost').value = Calculator.formatCurrency(budget);
  },

  confirmMaterialAdd() {
    const quantity = parseFloat(document.getElementById('modal-quantity').value);
    if (!quantity || quantity <= 0) {
      alert('请输入有效的数量');
      return;
    }

    const actualCostInput = document.getElementById('modal-actual-cost').value;
    const budgetCost = quantity * this.state.tempMaterial.unitPrice;
    const actualCost = actualCostInput ? parseFloat(actualCostInput) : budgetCost;

    const usage = {
      id: Storage.generateId('usage'),
      projectId: this.state.currentProject.id,
      materialId: this.state.tempMaterial.id,
      areaId: this.state.tempAreaId,
      quantity,
      actualCost
    };

    Storage.addMaterialUsage(usage);
    this.closeModal('material-modal');
    this.renderBudgetPanel();
    this.renderFloorPlan();

    this.state.tempMaterial = null;
    this.state.tempAreaId = null;
  },

  renderBudgetPanel() {
    const project = this.state.currentProject;
    const usages = Storage.getMaterialUsages();
    const customItems = Storage.getCustomItems();
    const materials = PRESET_DATA.materials;
    const laborPrice = PRESET_DATA.laborPrice;

    const breakdown = Calculator.calculateBudgetBreakdown(
      project, usages, customItems, materials, laborPrice
    );

    document.getElementById('budget-material').textContent = Calculator.formatCurrency(breakdown.material.budget);
    document.getElementById('budget-labor').textContent = Calculator.formatCurrency(breakdown.labor.budget);
    document.getElementById('budget-custom').textContent = Calculator.formatCurrency(breakdown.custom.budget);
    document.getElementById('budget-total').textContent = Calculator.formatCurrency(breakdown.total.budget);

    const listContainer = document.getElementById('materials-list');
    if (usages.length === 0) {
      listContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 12px; text-align: center; padding: 20px;">暂无材料，从左侧拖拽材料到平面图区域</div>';
    } else {
      const usageDetails = Calculator.getMaterialUsageDetails(usages, materials, this.state.currentHouse.rooms);
      listContainer.innerHTML = `
        <div class="materials-list-title">已选材料 (${usages.length})</div>
        ${usageDetails.map(u => `
          <div class="usage-item">
            <div class="usage-info">
              <div class="usage-name">${u.materialName}</div>
              <div class="usage-detail">${u.roomName} · ${u.quantity}${u.unit} · ${Calculator.formatCurrency(u.budgetCost)}</div>
            </div>
            <button class="usage-remove" data-usage-id="${u.id}" title="删除">×</button>
          </div>
        `).join('')}
      `;

      listContainer.querySelectorAll('.usage-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          if (confirm('确定删除此材料？')) {
            Storage.removeMaterialUsage(btn.dataset.usageId);
            this.renderBudgetPanel();
            this.renderFloorPlan();
          }
        });
      });
    }
  },

  openCustomItemModal() {
    if (!this.state.currentProject) {
      alert('请先创建项目');
      return;
    }

    document.getElementById('custom-item-name').value = '';
    document.getElementById('custom-item-budget').value = '';
    document.getElementById('custom-item-actual').value = '';
    document.getElementById('custom-item-remark').value = '';
    this.openModal('custom-item-modal');
  },

  confirmCustomItem() {
    const name = document.getElementById('custom-item-name').value.trim();
    const budgetCost = parseFloat(document.getElementById('custom-item-budget').value);
    const actualCostInput = document.getElementById('custom-item-actual').value;
    const remark = document.getElementById('custom-item-remark').value.trim();

    if (!name) {
      alert('请输入项目名称');
      return;
    }
    if (!budgetCost || budgetCost < 0) {
      alert('请输入有效的预算金额');
      return;
    }

    const actualCost = actualCostInput ? parseFloat(actualCostInput) : budgetCost;

    const item = {
      id: Storage.generateId('custom'),
      projectId: this.state.currentProject.id,
      name,
      budgetCost,
      actualCost,
      remark
    };

    Storage.addCustomItem(item);
    this.closeModal('custom-item-modal');
    this.renderBudgetPanel();
    this.renderCustomItems();
  },

  renderCustomItems() {
    const container = document.getElementById('custom-items-list');
    const items = Storage.getCustomItems();

    if (items.length === 0) {
      container.innerHTML = '<div style="color: var(--text-muted); font-size: 12px; text-align: center; padding: 20px;">暂无自定义项目</div>';
      return;
    }

    container.innerHTML = items.map(item => `
      <div class="usage-item">
        <div class="usage-info">
          <div class="usage-name">${item.name}</div>
          <div class="usage-detail">预算: ${Calculator.formatCurrency(item.budgetCost)} · 实际: ${Calculator.formatCurrency(item.actualCost || item.budgetCost)}</div>
          ${item.remark ? `<div class="usage-detail" style="color: var(--text-muted);">${item.remark}</div>` : ''}
        </div>
        <button class="usage-remove" data-custom-id="${item.id}" title="删除">×</button>
      </div>
    `).join('');

    container.querySelectorAll('.usage-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('确定删除此自定义项目？')) {
          Storage.removeCustomItem(btn.dataset.customId);
          this.renderBudgetPanel();
          this.renderCustomItems();
        }
      });
    });
  },

  renderProgressSummary() {
    const progress = Storage.getProgress();
    const totalPlanned = PRESET_DATA.stages.reduce((sum, s) => sum + s.plannedDays, 0);
    const totalActual = progress.reduce((sum, p) => sum + Calculator.calculateStageDuration(p.actualStartDate, p.actualEndDate), 0);
    const overallPercent = progress.length > 0
      ? Math.round(progress.reduce((sum, p) => sum + p.completionPercent, 0) / progress.length)
      : 0;
    const completed = progress.filter(p => p.completionPercent === 100).length;
    const overdue = progress.filter(p => Calculator.isOverdue(p)).length;

    document.getElementById('progress-summary').innerHTML = `
      <div class="summary-card">
        <div class="number">${totalPlanned}</div>
        <div class="label">计划总工期(天)</div>
      </div>
      <div class="summary-card accent">
        <div class="number">${totalActual}</div>
        <div class="label">实际工期(天)</div>
      </div>
      <div class="summary-card success">
        <div class="number">${overallPercent}%</div>
        <div class="label">总体完成度</div>
      </div>
      <div class="summary-card">
        <div class="number">${completed}/${progress.length}</div>
        <div class="label">已完成阶段</div>
      </div>
      ${overdue > 0 ? `
      <div class="summary-card danger">
        <div class="number">${overdue}</div>
        <div class="label">延期阶段</div>
      </div>` : ''}
    `;
  },

  renderStagesTimeline() {
    const container = document.getElementById('stages-timeline');
    const progress = Storage.getProgress();

    container.innerHTML = PRESET_DATA.stages.map(stage => {
      const p = progress.find(pr => pr.stageId === stage.id) || {};
      const isOverdue = Calculator.isOverdue(p);
      const overdueDays = Calculator.getOverdueDays(p);
      const actualDays = Calculator.calculateStageDuration(p.actualStartDate, p.actualEndDate);

      let statusClass = 'pending';
      let statusText = '未开始';
      if (isOverdue) {
        statusClass = 'overdue';
        statusText = '延期';
      } else if (p.completionPercent === 100) {
        statusClass = 'completed';
        statusText = '已完成';
      } else if (p.completionPercent > 0) {
        statusClass = 'in-progress';
        statusText = '进行中';
      }

      return `
        <div class="stage-card ${statusClass}">
          <div class="stage-header">
            <span class="stage-icon">${stage.icon}</span>
            <div class="stage-title">
              <h3>${stage.name}</h3>
              <div class="stage-days">计划工期: ${stage.plannedDays} 天</div>
            </div>
            <span class="status-badge ${statusClass}">${statusText}</span>
          </div>
          <div class="stage-details">
            <div class="stage-detail">
              <label>实际开始</label>
              <div class="value">${p.actualStartDate || '未开始'}</div>
            </div>
            <div class="stage-detail">
              <label>实际结束</label>
              <div class="value">${p.actualEndDate || '未结束'}</div>
            </div>
            <div class="stage-detail">
              <label>实际工期</label>
              <div class="value ${isOverdue ? 'overdue' : ''}">${actualDays > 0 ? actualDays + ' 天' : '-'}</div>
            </div>
          </div>
          ${isOverdue ? `<div class="overdue-warning">⚠️ 已延期 ${overdueDays} 天</div>` : ''}
          <div class="progress-bar-container">
            <div class="progress-bar-header">
              <span>完成进度</span>
              <span class="percent">${p.completionPercent || 0}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${p.completionPercent || 0}%"></div>
            </div>
          </div>
          ${p.photos && p.photos.length > 0 ? `
            <div class="photos-section">
              <h4>现场照片 (${p.photos.length}/3)</h4>
              <div class="photo-upload-area">
                ${p.photos.map((photo, idx) => `
                  <div class="photo-preview" data-photo="${idx}">
                    <img src="${photo}" alt="现场照片">
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          <div style="margin-top: 16px; text-align: right;">
            <button class="btn btn-outline btn-sm" data-edit-stage="${stage.id}">✏️ 编辑</button>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('[data-edit-stage]').forEach(btn => {
      btn.addEventListener('click', () => this.openStageEditModal(btn.dataset.editStage));
    });

    container.querySelectorAll('.photo-preview').forEach(preview => {
      preview.addEventListener('click', () => {
        const p = Storage.getProgress();
        const stageCard = preview.closest('.stage-card');
        const stageIdx = Array.from(container.children).indexOf(stageCard);
        const photos = p[stageIdx]?.photos || [];
        const photoIdx = parseInt(preview.dataset.photo);
        if (photos[photoIdx]) {
          document.getElementById('modal-image').src = photos[photoIdx];
          document.getElementById('image-modal').style.display = 'flex';
        }
      });
    });
  },

  openStageEditModal(stageId) {
    const progress = Storage.getProgress();
    const p = progress.find(pr => pr.stageId === stageId);
    const stage = PRESET_DATA.stages.find(s => s.id === stageId);

    if (!p || !stage) return;

    this.state.tempStage = p;
    this.state.tempPhotos = [...(p.photos || [])];

    document.getElementById('stage-modal-title').textContent = `编辑 - ${stage.name}`;
    document.getElementById('stage-start-date').value = p.actualStartDate || '';
    document.getElementById('stage-end-date').value = p.actualEndDate || '';
    document.getElementById('stage-completion').value = p.completionPercent || 0;
    document.getElementById('completion-value').textContent = p.completionPercent || 0;

    this.renderStagePhotos();
    this.openModal('stage-modal');
  },

  renderStagePhotos() {
    const container = document.getElementById('stage-photos-area');
    let html = this.state.tempPhotos.map((photo, idx) => `
      <div class="photo-preview">
        <img src="${photo}" alt="现场照片">
        <button class="photo-remove" data-remove-photo="${idx}">×</button>
      </div>
    `).join('');

    if (this.state.tempPhotos.length < 3) {
      html += `
        <div class="photo-upload-btn" id="add-photo-btn">
          <span class="icon">📷</span>
          <span>添加照片</span>
        </div>
      `;
    }

    container.innerHTML = html;

    container.querySelectorAll('[data-remove-photo]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.removePhoto);
        this.state.tempPhotos.splice(idx, 1);
        this.renderStagePhotos();
      });
    });

    const addBtn = document.getElementById('add-photo-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        document.getElementById('photo-input').click();
      });
    }
  },

  handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (this.state.tempPhotos.length >= 3) {
      alert('最多只能上传3张照片');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      this.state.tempPhotos.push(event.target.result);
      this.renderStagePhotos();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  },

  confirmStageEdit() {
    const startDate = document.getElementById('stage-start-date').value;
    const endDate = document.getElementById('stage-end-date').value;
    const completion = parseInt(document.getElementById('stage-completion').value);

    if (startDate && endDate && startDate > endDate) {
      alert('结束日期不能早于开始日期');
      return;
    }

    let status = 'pending';
    if (completion === 100) status = 'completed';
    else if (completion > 0) status = 'in-progress';

    Storage.updateProgress(this.state.tempStage.stageId, {
      actualStartDate: startDate,
      actualEndDate: endDate,
      completionPercent: completion,
      photos: this.state.tempPhotos,
      status
    });

    this.closeModal('stage-modal');
    this.renderProgressSummary();
    this.renderStagesTimeline();

    this.state.tempStage = null;
    this.state.tempPhotos = [];
  },

  renderComparisonSummary() {
    const project = this.state.currentProject;
    const usages = Storage.getMaterialUsages();
    const customItems = Storage.getCustomItems();
    const materials = PRESET_DATA.materials;
    const laborPrice = PRESET_DATA.laborPrice;

    const breakdown = Calculator.calculateBudgetBreakdown(
      project, usages, customItems, materials, laborPrice
    );

    document.getElementById('comparison-summary').innerHTML = `
      <div class="summary-card">
        <div class="number">${Calculator.formatCurrency(breakdown.total.budget)}</div>
        <div class="label">总预算</div>
      </div>
      <div class="summary-card accent">
        <div class="number">${Calculator.formatCurrency(breakdown.total.actual)}</div>
        <div class="label">实际支出</div>
      </div>
      <div class="summary-card ${breakdown.total.diff > 0 ? 'danger' : 'success'}">
        <div class="number">${breakdown.total.diff > 0 ? '+' : ''}${Calculator.formatCurrency(breakdown.total.diff)}</div>
        <div class="label">${breakdown.total.diff > 0 ? '超支金额' : '节省金额'}</div>
      </div>
    `;
  },

  renderComparisonTable() {
    const project = this.state.currentProject;
    const usages = Storage.getMaterialUsages();
    const customItems = Storage.getCustomItems();
    const materials = PRESET_DATA.materials;
    const rooms = this.state.currentHouse.rooms;
    const laborPrice = PRESET_DATA.laborPrice;

    const usageDetails = Calculator.getMaterialUsageDetails(usages, materials, rooms);
    const laborCost = project.area * laborPrice;

    let html = '';

    usageDetails.forEach(u => {
      const isOver = u.diff > 0;
      html += `
        <tr class="${isOver ? 'over-budget' : ''}">
          <td>材料</td>
          <td>${u.materialName}</td>
          <td>${u.materialSpec} / ${u.roomName}</td>
          <td>${u.quantity}</td>
          <td>${u.unit}</td>
          <td>${Calculator.formatCurrency(u.budgetCost)}</td>
          <td>${Calculator.formatCurrency(u.actualCost)}</td>
          <td class="${isOver ? 'diff-negative' : 'diff-positive'}">
            ${u.diff > 0 ? '+' : ''}${Calculator.formatCurrency(u.diff)}
          </td>
        </tr>
      `;
    });

    html += `
      <tr>
        <td>人工</td>
        <td>人工费</td>
        <td>${project.area} ㎡ × ${laborPrice}元/㎡</td>
        <td>${project.area}</td>
        <td>㎡</td>
        <td>${Calculator.formatCurrency(laborCost)}</td>
        <td>${Calculator.formatCurrency(laborCost)}</td>
        <td>¥0.00</td>
      </tr>
    `;

    customItems.forEach(item => {
      const actual = item.actualCost || item.budgetCost;
      const diff = actual - item.budgetCost;
      const isOver = diff > 0;
      html += `
        <tr class="${isOver ? 'over-budget' : ''}">
          <td>自定义</td>
          <td>${item.name}</td>
          <td>${item.remark || '-'}</td>
          <td>-</td>
          <td>-</td>
          <td>${Calculator.formatCurrency(item.budgetCost)}</td>
          <td>${Calculator.formatCurrency(actual)}</td>
          <td class="${isOver ? 'diff-negative' : 'diff-positive'}">
            ${diff > 0 ? '+' : ''}${Calculator.formatCurrency(diff)}
          </td>
        </tr>
      `;
    });

    const breakdown = Calculator.calculateBudgetBreakdown(
      project, usages, customItems, materials, laborPrice
    );
    const totalIsOver = breakdown.total.diff > 0;
    html += `
      <tr style="font-weight: 700; background: var(--primary-color); color: white;">
        <td colspan="5">总计</td>
        <td>${Calculator.formatCurrency(breakdown.total.budget)}</td>
        <td>${Calculator.formatCurrency(breakdown.total.actual)}</td>
        <td>${totalIsOver ? '+' : ''}${Calculator.formatCurrency(breakdown.total.diff)}</td>
      </tr>
    `;

    document.getElementById('comparison-table-body').innerHTML = html;
  },

  renderSuppliers() {
    const container = document.getElementById('suppliers-grid');
    const suppliers = Storage.getSuppliers();

    container.innerHTML = suppliers.map(supplier => {
      const material = PRESET_DATA.materials.find(m => m.id === supplier.materialId);
      const category = PRESET_DATA.materialCategories.find(c => c.id === material?.categoryId);

      return `
        <div class="supplier-card">
          <div class="supplier-material">${category?.icon || ''} ${category?.name || ''} - ${supplier.materialName}</div>
          <div class="supplier-name">${supplier.name || '未设置'}</div>
          <div class="supplier-info">
            <span class="icon">👤</span>
            <span>${supplier.contact || '未设置'}</span>
          </div>
          <div class="supplier-info">
            <span class="icon">📞</span>
            <span>${supplier.phone || '未设置'}</span>
          </div>
          <div class="supplier-info">
            <span class="icon">📍</span>
            <span>${supplier.address || '未设置'}</span>
          </div>
          ${supplier.remark ? `
            <div class="supplier-info" style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border-color);">
              <span style="color: var(--text-muted);">${supplier.remark}</span>
            </div>
          ` : ''}
          <div class="supplier-actions">
            <button class="btn btn-outline btn-sm" data-edit-supplier="${supplier.id}">✏️ 编辑</button>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('[data-edit-supplier]').forEach(btn => {
      btn.addEventListener('click', () => this.openSupplierEditModal(btn.dataset.editSupplier));
    });
  },

  openSupplierEditModal(supplierId) {
    const suppliers = Storage.getSuppliers();
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;

    this.state.tempSupplier = supplier;

    document.getElementById('supplier-material').value = supplier.materialName;
    document.getElementById('supplier-name').value = supplier.name || '';
    document.getElementById('supplier-contact').value = supplier.contact || '';
    document.getElementById('supplier-phone').value = supplier.phone || '';
    document.getElementById('supplier-address').value = supplier.address || '';
    document.getElementById('supplier-remark').value = supplier.remark || '';

    this.openModal('supplier-modal');
  },

  confirmSupplierEdit() {
    Storage.updateSupplier(this.state.tempSupplier.id, {
      name: document.getElementById('supplier-name').value.trim(),
      contact: document.getElementById('supplier-contact').value.trim(),
      phone: document.getElementById('supplier-phone').value.trim(),
      address: document.getElementById('supplier-address').value.trim(),
      remark: document.getElementById('supplier-remark').value.trim()
    });

    this.closeModal('supplier-modal');
    this.renderSuppliers();
    this.state.tempSupplier = null;
  },

  exportExcel() {
    if (!this.state.currentProject) {
      alert('请先创建项目');
      return;
    }

    const project = this.state.currentProject;
    const usages = Storage.getMaterialUsages();
    const customItems = Storage.getCustomItems();
    const materials = PRESET_DATA.materials;
    const rooms = this.state.currentHouse.rooms;
    const laborPrice = PRESET_DATA.laborPrice;

    const breakdown = Calculator.calculateBudgetBreakdown(
      project, usages, customItems, materials, laborPrice
    );

    ExportManager.exportToExcel(project, usages, customItems, materials, rooms, breakdown);
  },

  exportProgress() {
    if (!this.state.currentProject) {
      alert('请先创建项目');
      return;
    }

    const project = this.state.currentProject;
    const progress = Storage.getProgress();
    ExportManager.exportProgressReport(project, progress, PRESET_DATA.stages);
  },

  openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
  },

  closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());

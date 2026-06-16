const Calculator = {
  calculateMaterialCost(usages, materials) {
    return usages.reduce((total, usage) => {
      const material = materials.find(m => m.id === usage.materialId);
      if (material) {
        return total + (material.unitPrice * usage.quantity);
      }
      return total;
    }, 0);
  },

  calculateActualMaterialCost(usages) {
    return usages.reduce((total, usage) => {
      return total + (usage.actualCost || 0);
    }, 0);
  },

  calculateLaborCost(area, laborPrice) {
    return area * laborPrice;
  },

  calculateCustomItemCost(items) {
    return items.reduce((total, item) => {
      return total + (item.budgetCost || 0);
    }, 0);
  },

  calculateActualCustomItemCost(items) {
    return items.reduce((total, item) => {
      return total + (item.actualCost || 0);
    }, 0);
  },

  calculateTotalBudget(project, usages, customItems, materials, laborPrice) {
    const materialCost = this.calculateMaterialCost(usages, materials);
    const laborCost = this.calculateLaborCost((project && project.area) || 0, laborPrice);
    const customCost = this.calculateCustomItemCost(customItems);
    return materialCost + laborCost + customCost;
  },

  calculateTotalActual(usages, customItems, project, laborPrice) {
    const actualMaterialCost = this.calculateActualMaterialCost(usages);
    const laborCost = this.calculateLaborCost((project && project.area) || 0, laborPrice);
    const actualCustomCost = this.calculateActualCustomItemCost(customItems);
    return actualMaterialCost + laborCost + actualCustomCost;
  },

  calculateBudgetBreakdown(project, usages, customItems, materials, laborPrice) {
    const materialCost = this.calculateMaterialCost(usages, materials);
    const laborCost = this.calculateLaborCost((project && project.area) || 0, laborPrice);
    const customCost = this.calculateCustomItemCost(customItems);
    const totalBudget = materialCost + laborCost + customCost;

    const actualMaterialCost = this.calculateActualMaterialCost(usages);
    const actualCustomCost = this.calculateActualCustomItemCost(customItems);
    const totalActual = actualMaterialCost + laborCost + actualCustomCost;

    return {
      material: {
        budget: materialCost,
        actual: actualMaterialCost,
        diff: actualMaterialCost - materialCost
      },
      labor: {
        budget: laborCost,
        actual: laborCost,
        diff: 0
      },
      custom: {
        budget: customCost,
        actual: actualCustomCost,
        diff: actualCustomCost - customCost
      },
      total: {
        budget: totalBudget,
        actual: totalActual,
        diff: totalActual - totalBudget
      }
    };
  },

  calculateStageDuration(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  },

  isOverdue(progress) {
    if (!progress.actualStartDate) return false;
    const actualDays = this.calculateStageDuration(
      progress.actualStartDate,
      progress.actualEndDate || new Date().toISOString().split('T')[0]
    );
    return actualDays > progress.plannedDays;
  },

  getOverdueDays(progress) {
    if (!progress.actualStartDate) return 0;
    const actualDays = this.calculateStageDuration(
      progress.actualStartDate,
      progress.actualEndDate || new Date().toISOString().split('T')[0]
    );
    return Math.max(0, actualDays - progress.plannedDays);
  },

  formatCurrency(value) {
    return '¥' + Number(value).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  },

  getMaterialUsageDetails(usages, materials, rooms) {
    return usages.map(usage => {
      const material = materials.find(m => m.id === usage.materialId);
      const room = rooms.find(r => r.id === usage.areaId);
      const budgetCost = material ? material.unitPrice * usage.quantity : 0;
      const actualCost = usage.actualCost || budgetCost;
      return {
        ...usage,
        materialName: material ? material.name : '未知材料',
        materialSpec: material ? material.spec : '',
        unitPrice: material ? material.unitPrice : 0,
        unit: material ? material.unit : '',
        roomName: room ? room.name : '未知区域',
        budgetCost,
        actualCost,
        diff: actualCost - budgetCost
      };
    });
  }
};

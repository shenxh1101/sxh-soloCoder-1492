const ExportManager = {
  _generateBudgetWorkbook(project, usages, customItems, materials, rooms, breakdown) {
    const wb = XLSX.utils.book_new();
    const usageDetails = Calculator.getMaterialUsageDetails(usages, materials, rooms);

    const materialData = [
      ['材料清单'],
      ['序号', '材料名称', '规格', '使用区域', '数量', '单位', '单价(元)', '预算金额(元)', '实际金额(元)', '差额(元)'],
      ...usageDetails.map((u, i) => [
        i + 1, u.materialName, u.materialSpec, u.roomName,
        u.quantity, u.unit, u.unitPrice,
        u.budgetCost.toFixed(2), u.actualCost.toFixed(2), u.diff.toFixed(2)
      ])
    ];

    const customData = [
      ['自定义项目'],
      ['序号', '项目名称', '预算金额(元)', '实际金额(元)', '差额(元)', '备注'],
      ...customItems.map((item, i) => [
        i + 1, item.name, item.budgetCost.toFixed(2),
        (item.actualCost || item.budgetCost).toFixed(2),
        ((item.actualCost || item.budgetCost) - item.budgetCost).toFixed(2),
        item.remark || ''
      ])
    ];

    const summaryData = [
      ['预算汇总表'],
      ['项目', '预算金额(元)', '实际金额(元)', '差额(元)'],
      ['材料费', breakdown.material.budget.toFixed(2), breakdown.material.actual.toFixed(2), breakdown.material.diff.toFixed(2)],
      ['人工费', breakdown.labor.budget.toFixed(2), breakdown.labor.actual.toFixed(2), breakdown.labor.diff.toFixed(2)],
      ['自定义项目', breakdown.custom.budget.toFixed(2), breakdown.custom.actual.toFixed(2), breakdown.custom.diff.toFixed(2)],
      ['总计', breakdown.total.budget.toFixed(2), breakdown.total.actual.toFixed(2), breakdown.total.diff.toFixed(2)]
    ];

    const projectInfoData = [
      ['项目信息'],
      ['项目名称', project.name],
      ['业主姓名', project.ownerName],
      ['联系电话', project.ownerPhone],
      ['建筑面积', project.area + ' ㎡'],
      ['户型', PRESET_DATA.houseTypes.find(h => h.id === project.houseType)?.name || ''],
      ['开工日期', project.startDate]
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(projectInfoData);
    XLSX.utils.book_append_sheet(wb, ws1, '项目信息');
    const ws2 = XLSX.utils.aoa_to_sheet(materialData);
    XLSX.utils.book_append_sheet(wb, ws2, '材料清单');
    const ws3 = XLSX.utils.aoa_to_sheet(customData);
    XLSX.utils.book_append_sheet(wb, ws3, '自定义项目');
    const ws4 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws4, '预算汇总');

    return wb;
  },

  _generateSupplierWorkbook(project, suppliers, materials) {
    const wb = XLSX.utils.book_new();

    const contactData = [
      ['供应商通讯录'],
      ['序号', '分类', '对应材料', '供应商名称', '联系人', '联系电话', '地址', '备注'],
      ...suppliers.map((s, i) => {
        const material = materials.find(m => m.id === s.materialId);
        const category = PRESET_DATA.materialCategories.find(c => c.id === material?.categoryId);
        return [
          i + 1,
          category?.name || '-',
          s.materialName,
          s.name || '-',
          s.contact || '-',
          s.phone || '-',
          s.address || '-',
          s.remark || ''
        ];
      })
    ];

    const projectInfoData = [
      ['项目信息'],
      ['项目名称', project.name],
      ['业主姓名', project.ownerName],
      ['联系电话', project.ownerPhone],
      ['生成日期', new Date().toLocaleString('zh-CN')]
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(projectInfoData);
    XLSX.utils.book_append_sheet(wb, ws1, '项目信息');
    const ws2 = XLSX.utils.aoa_to_sheet(contactData);
    XLSX.utils.book_append_sheet(wb, ws2, '通讯录');

    return wb;
  },

  _generateProgressHtml(project, progress, stages) {
    const progressHtml = progress.map(p => {
      const stage = stages.find(s => s.id === p.stageId);
      const actualDays = Calculator.calculateStageDuration(p.actualStartDate, p.actualEndDate);
      const isOverdue = Calculator.isOverdue(p);
      const overdueDays = Calculator.getOverdueDays(p);
      const statusClass = isOverdue ? 'overdue' : (p.completionPercent === 100 ? 'completed' : (p.completionPercent > 0 ? 'in-progress' : 'pending'));
      const statusText = isOverdue ? '延期' : (p.completionPercent === 100 ? '已完成' : (p.completionPercent > 0 ? '进行中' : '未开始'));

      const photosHtml = p.photos && p.photos.length > 0
        ? `<div class="photos">
             <h4>现场照片</h4>
             <div class="photo-grid">
               ${p.photos.map(photo => `<img src="${photo}" alt="现场照片" />`).join('')}
             </div>
           </div>`
        : '';

      return `
        <div class="stage-card ${statusClass}">
          <div class="stage-header">
            <span class="stage-icon">${stage?.icon || '📋'}</span>
            <h3>${p.stageName}</h3>
            <span class="status-badge">${statusText}</span>
          </div>
          <div class="stage-details">
            <div class="detail-row">
              <span class="label">计划工期：</span>
              <span class="value">${p.plannedDays} 天</span>
            </div>
            <div class="detail-row">
              <span class="label">实际开始：</span>
              <span class="value">${p.actualStartDate || '未开始'}</span>
            </div>
            <div class="detail-row">
              <span class="label">实际结束：</span>
              <span class="value">${p.actualEndDate || '未结束'}</span>
            </div>
            <div class="detail-row">
              <span class="label">实际工期：</span>
              <span class="value ${isOverdue ? 'overdue-text' : ''}">${actualDays > 0 ? actualDays + ' 天' : '-'}</span>
            </div>
            ${isOverdue ? `<div class="detail-row overdue-warning">⚠️ 延期 ${overdueDays} 天</div>` : ''}
            <div class="progress-section">
              <div class="progress-header">
                <span>完成进度</span>
                <span class="progress-percent">${p.completionPercent}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${p.completionPercent}%"></div>
              </div>
            </div>
            ${photosHtml}
          </div>
        </div>
      `;
    }).join('');

    const totalPlannedDays = stages.reduce((sum, s) => sum + s.plannedDays, 0);
    const totalActualDays = progress.reduce((sum, p) => sum + Calculator.calculateStageDuration(p.actualStartDate, p.actualEndDate), 0);
    const overallPercent = progress.length > 0 ? Math.round(progress.reduce((sum, p) => sum + p.completionPercent, 0) / progress.length) : 0;

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name} - 施工进度报告</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Noto Sans SC", -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f0f4f8;
      color: #2d3748;
      padding: 40px 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
      color: white;
      padding: 40px;
    }
    .header h1 { font-size: 28px; margin-bottom: 16px; }
    .project-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 20px;
    }
    .info-item {
      background: rgba(255,255,255,0.1);
      padding: 12px 16px;
      border-radius: 8px;
    }
    .info-item .label { font-size: 12px; opacity: 0.8; }
    .info-item .value { font-size: 16px; font-weight: 600; margin-top: 4px; }
    .summary { padding: 30px 40px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
    }
    .summary-item { text-align: center; }
    .summary-item .number { font-size: 32px; font-weight: 700; color: #1e3a5f; }
    .summary-item .label { font-size: 13px; color: #718096; margin-top: 4px; }
    .content { padding: 40px; }
    .content h2 {
      font-size: 20px;
      margin-bottom: 24px;
      color: #1e3a5f;
      position: relative;
      padding-left: 12px;
    }
    .content h2::before {
      content: '';
      position: absolute;
      left: 0; top: 4px;
      height: 20px; width: 4px;
      background: #ff7b29;
      border-radius: 2px;
    }
    .stage-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      margin-bottom: 20px;
      overflow: hidden;
    }
    .stage-card.completed { border-left: 4px solid #38a169; }
    .stage-card.in-progress { border-left: 4px solid #ff7b29; }
    .stage-card.overdue { border-left: 4px solid #e53e3e; }
    .stage-card.pending { border-left: 4px solid #a0aec0; }
    .stage-header {
      background: #f8fafc;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .stage-icon { font-size: 24px; }
    .stage-header h3 { flex: 1; font-size: 16px; color: #2d3748; }
    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .stage-card.completed .status-badge { background: #c6f6d5; color: #22543d; }
    .stage-card.in-progress .status-badge { background: #feebc8; color: #744210; }
    .stage-card.overdue .status-badge { background: #fed7d7; color: #742a2a; }
    .stage-card.pending .status-badge { background: #edf2f7; color: #4a5568; }
    .stage-details { padding: 20px; }
    .detail-row { display: flex; margin-bottom: 10px; font-size: 14px; }
    .detail-row .label { color: #718096; min-width: 80px; }
    .detail-row .value { color: #2d3748; font-weight: 500; }
    .overdue-text { color: #e53e3e; font-weight: 600; }
    .overdue-warning {
      background: #fed7d7;
      color: #c53030;
      padding: 10px 14px;
      border-radius: 6px;
      font-weight: 600;
      margin-top: 8px;
    }
    .progress-section { margin-top: 16px; }
    .progress-header {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin-bottom: 8px;
      color: #4a5568;
    }
    .progress-percent { font-weight: 600; color: #1e3a5f; }
    .progress-bar {
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #1e3a5f, #ff7b29);
      border-radius: 4px;
      transition: width 0.5s ease;
    }
    .photos {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px dashed #e2e8f0;
    }
    .photos h4 { font-size: 14px; margin-bottom: 12px; color: #4a5568; }
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
    }
    .photo-grid img {
      width: 100%;
      height: 120px;
      object-fit: cover;
      border-radius: 6px;
    }
    .footer {
      text-align: center;
      padding: 24px;
      color: #a0aec0;
      font-size: 12px;
      border-top: 1px solid #e2e8f0;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏗️ ${project.name} - 施工进度报告</h1>
      <div class="project-info">
        <div class="info-item">
          <div class="label">业主姓名</div>
          <div class="value">${project.ownerName || '-'}</div>
        </div>
        <div class="info-item">
          <div class="label">联系电话</div>
          <div class="value">${project.ownerPhone || '-'}</div>
        </div>
        <div class="info-item">
          <div class="label">建筑面积</div>
          <div class="value">${project.area} ㎡</div>
        </div>
        <div class="info-item">
          <div class="label">开工日期</div>
          <div class="value">${project.startDate}</div>
        </div>
      </div>
    </div>
    <div class="summary">
      <div class="summary-grid">
        <div class="summary-item">
          <div class="number">${totalPlannedDays}</div>
          <div class="label">计划总工期(天)</div>
        </div>
        <div class="summary-item">
          <div class="number">${totalActualDays}</div>
          <div class="label">实际工期(天)</div>
        </div>
        <div class="summary-item">
          <div class="number">${overallPercent}%</div>
          <div class="label">总体完成度</div>
        </div>
        <div class="summary-item">
          <div class="number">${progress.filter(p => p.completionPercent === 100).length}/${progress.length}</div>
          <div class="label">已完成阶段</div>
        </div>
      </div>
    </div>
    <div class="content">
      <h2>施工阶段详情</h2>
      ${progressHtml}
    </div>
    <div class="footer">
      报告生成时间：${new Date().toLocaleString('zh-CN')} | 装修公司预算与施工进度看板
    </div>
  </div>
</body>
</html>`;
  },

  exportToExcel(project, usages, customItems, materials, rooms, breakdown) {
    if (typeof XLSX === 'undefined') {
      alert('Excel导出功能需要SheetJS库支持');
      return;
    }
    const wb = this._generateBudgetWorkbook(project, usages, customItems, materials, rooms, breakdown);
    const fileName = `${project.name}_预算清单_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  },

  exportProgressReport(project, progress, stages) {
    const html = this._generateProgressHtml(project, progress, stages);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}_施工进度报告_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  exportSupplierContacts(project, suppliers, materials) {
    if (typeof XLSX === 'undefined') {
      alert('Excel导出功能需要SheetJS库支持');
      return;
    }
    const wb = this._generateSupplierWorkbook(project, suppliers, materials);
    const fileName = `${project.name}_供应商通讯录_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  },

  async exportAllBundle(project, usages, customItems, materials, rooms, breakdown, progress, stages, suppliers) {
    if (typeof XLSX === 'undefined') {
      alert('Excel导出功能需要SheetJS库支持');
      return;
    }
    if (typeof JSZip === 'undefined') {
      alert('打包导出需要JSZip库支持，已降级为单独导出');
      this.exportToExcel(project, usages, customItems, materials, rooms, breakdown);
      this.exportProgressReport(project, progress, stages);
      this.exportSupplierContacts(project, suppliers, materials);
      return;
    }

    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = '📦 正在生成打包文件...';
      toast.classList.add('show');
    }

    try {
      const zip = new JSZip();
      const folderName = `${project.name}_装修资料_${new Date().toISOString().split('T')[0]}`;
      const folder = zip.folder(folderName);

      const budgetWb = this._generateBudgetWorkbook(project, usages, customItems, materials, rooms, breakdown);
      const budgetWbout = XLSX.write(budgetWb, { bookType: 'xlsx', type: 'array' });
      folder.file(`${project.name}_预算清单.xlsx`, budgetWbout);

      const supplierWb = this._generateSupplierWorkbook(project, suppliers, materials);
      const supplierWbout = XLSX.write(supplierWb, { bookType: 'xlsx', type: 'array' });
      folder.file(`${project.name}_供应商通讯录.xlsx`, supplierWbout);

      const progressHtml = this._generateProgressHtml(project, progress, stages);
      folder.file(`${project.name}_施工进度报告.html`, progressHtml);

      const summaryMd = `# ${project.name} - 装修项目资料汇总\n\n` +
        `**生成时间：** ${new Date().toLocaleString('zh-CN')}\n\n` +
        `## 项目基本信息\n\n` +
        `- **项目名称：** ${project.name}\n` +
        `- **业主姓名：** ${project.ownerName || '-'}\n` +
        `- **联系电话：** ${project.ownerPhone || '-'}\n` +
        `- **建筑面积：** ${project.area} ㎡\n` +
        `- **户型：** ${PRESET_DATA.houseTypes.find(h => h.id === project.houseType)?.name || '-'}\n` +
        `- **开工日期：** ${project.startDate}\n\n` +
        `## 预算汇总\n\n` +
        `| 项目 | 预算金额 | 实际支出 | 差额 |\n` +
        `| --- | ---: | ---: | ---: |\n` +
        `| 材料费 | ${Calculator.formatCurrency(breakdown.material.budget)} | ${Calculator.formatCurrency(breakdown.material.actual)} | ${Calculator.formatCurrency(breakdown.material.diff)} |\n` +
        `| 人工费 | ${Calculator.formatCurrency(breakdown.labor.budget)} | ${Calculator.formatCurrency(breakdown.labor.actual)} | ${Calculator.formatCurrency(breakdown.labor.diff)} |\n` +
        `| 自定义项目 | ${Calculator.formatCurrency(breakdown.custom.budget)} | ${Calculator.formatCurrency(breakdown.custom.actual)} | ${Calculator.formatCurrency(breakdown.custom.diff)} |\n` +
        `| **总计** | **${Calculator.formatCurrency(breakdown.total.budget)}** | **${Calculator.formatCurrency(breakdown.total.actual)}** | **${Calculator.formatCurrency(breakdown.total.diff)}** |\n\n` +
        `## 文件清单\n\n` +
        `1. \`${project.name}_预算清单.xlsx\` - Excel格式预算清单\n` +
        `2. \`${project.name}_供应商通讯录.xlsx\` - Excel格式供应商联系方式\n` +
        `3. \`${project.name}_施工进度报告.html\` - HTML格式施工进度报告\n` +
        `4. \`README.md\` - 本说明文件\n`;
      folder.file('README.md', summaryMd);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (toast) {
        toast.textContent = '✅ 打包导出完成！';
        setTimeout(() => toast.classList.remove('show'), 2500);
      }
    } catch (err) {
      console.error('Bundle export error:', err);
      if (toast) {
        toast.textContent = '❌ 打包导出失败：' + err.message;
        setTimeout(() => toast.classList.remove('show'), 3000);
      } else {
        alert('打包导出失败：' + err.message);
      }
    }
  }
};

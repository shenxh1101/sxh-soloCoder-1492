const PRESET_DATA = {
  houseTypes: [
    {
      id: 'studio',
      name: '一居室',
      area: 50,
      rooms: [
        { id: 'living', name: '客厅', type: 'living', x: 10, y: 10, width: 180, height: 140 },
        { id: 'bedroom', name: '卧室', type: 'bedroom', x: 200, y: 10, width: 180, height: 140 },
        { id: 'kitchen', name: '厨房', type: 'kitchen', x: 10, y: 160, width: 120, height: 100 },
        { id: 'bathroom', name: '卫生间', type: 'bathroom', x: 140, y: 160, width: 80, height: 100 }
      ]
    },
    {
      id: 'two-bedroom',
      name: '两居室',
      area: 80,
      rooms: [
        { id: 'living', name: '客厅', type: 'living', x: 10, y: 10, width: 220, height: 160 },
        { id: 'master', name: '主卧', type: 'bedroom', x: 240, y: 10, width: 160, height: 140 },
        { id: 'second', name: '次卧', type: 'bedroom', x: 240, y: 160, width: 160, height: 110 },
        { id: 'kitchen', name: '厨房', type: 'kitchen', x: 10, y: 180, width: 140, height: 90 },
        { id: 'bathroom', name: '卫生间', type: 'bathroom', x: 160, y: 180, width: 70, height: 90 }
      ]
    },
    {
      id: 'three-bedroom',
      name: '三居室',
      area: 120,
      rooms: [
        { id: 'living', name: '客厅', type: 'living', x: 10, y: 10, width: 260, height: 180 },
        { id: 'master', name: '主卧', type: 'bedroom', x: 280, y: 10, width: 180, height: 150 },
        { id: 'second', name: '次卧', type: 'bedroom', x: 280, y: 170, width: 120, height: 120 },
        { id: 'study', name: '书房', type: 'study', x: 410, y: 170, width: 100, height: 120 },
        { id: 'kitchen', name: '厨房', type: 'kitchen', x: 10, y: 200, width: 160, height: 90 },
        { id: 'bathroom1', name: '卫生间1', type: 'bathroom', x: 180, y: 200, width: 70, height: 90 },
        { id: 'bathroom2', name: '卫生间2', type: 'bathroom', x: 410, y: 10, width: 100, height: 80 }
      ]
    }
  ],

  materialCategories: [
    { id: 'floor', name: '地板', icon: '🪵' },
    { id: 'tile', name: '瓷砖', icon: '🔲' },
    { id: 'paint', name: '油漆', icon: '🎨' },
    { id: 'bathroom', name: '卫浴', icon: '🚿' },
    { id: 'cabinet', name: '橱柜', icon: '🗄️' }
  ],

  materials: [
    { id: 'floor-1', categoryId: 'floor', name: '实木地板', spec: '910×125×18mm', unitPrice: 380, unit: '㎡', color: '#8B4513' },
    { id: 'floor-2', categoryId: 'floor', name: '复合地板', spec: '1215×195×12mm', unitPrice: 180, unit: '㎡', color: '#D2691E' },
    { id: 'floor-3', categoryId: 'floor', name: '强化地板', spec: '1215×195×8mm', unitPrice: 95, unit: '㎡', color: '#DEB887' },

    { id: 'tile-1', categoryId: 'tile', name: '抛光砖', spec: '800×800mm', unitPrice: 120, unit: '㎡', color: '#F5F5DC' },
    { id: 'tile-2', categoryId: 'tile', name: '仿古砖', spec: '600×600mm', unitPrice: 150, unit: '㎡', color: '#D2B48C' },
    { id: 'tile-3', categoryId: 'tile', name: '马赛克', spec: '300×300mm', unitPrice: 280, unit: '㎡', color: '#4682B4' },
    { id: 'tile-4', categoryId: 'tile', name: '瓷片', spec: '300×600mm', unitPrice: 85, unit: '㎡', color: '#FFFAF0' },

    { id: 'paint-1', categoryId: 'paint', name: '乳胶漆', spec: '5L/桶', unitPrice: 35, unit: '㎡', color: '#FFFFFF' },
    { id: 'paint-2', categoryId: 'paint', name: '木器漆', spec: '5L/桶', unitPrice: 65, unit: '㎡', color: '#F5DEB3' },
    { id: 'paint-3', categoryId: 'paint', name: '防水涂料', spec: '20kg/桶', unitPrice: 80, unit: '㎡', color: '#708090' },

    { id: 'bath-1', categoryId: 'bathroom', name: '马桶', spec: '虹吸式', unitPrice: 2800, unit: '套', color: '#FFFAFA' },
    { id: 'bath-2', categoryId: 'bathroom', name: '洗手盆', spec: '陶瓷台盆', unitPrice: 1200, unit: '套', color: '#FFFAFA' },
    { id: 'bath-3', categoryId: 'bathroom', name: '淋浴花洒', spec: '铜质镀铬', unitPrice: 1500, unit: '套', color: '#C0C0C0' },
    { id: 'bath-4', categoryId: 'bathroom', name: '浴缸', spec: '亚克力1.7m', unitPrice: 4500, unit: '套', color: '#FFFAFA' },
    { id: 'bath-5', categoryId: 'bathroom', name: '浴霸', spec: '风暖五合一', unitPrice: 800, unit: '套', color: '#FFFFFF' },

    { id: 'cab-1', categoryId: 'cabinet', name: '整体橱柜', spec: '地柜+吊柜', unitPrice: 4500, unit: '延米', color: '#F5F5DC' },
    { id: 'cab-2', categoryId: 'cabinet', name: '吊柜', spec: '300×700mm', unitPrice: 1200, unit: '延米', color: '#FAEBD7' },
    { id: 'cab-3', categoryId: 'cabinet', name: '地柜', spec: '600×850mm', unitPrice: 1800, unit: '延米', color: '#FAEBD7' }
  ],

  stages: [
    { id: 'stage-1', name: '水电阶段', plannedDays: 15, icon: '⚡' },
    { id: 'stage-2', name: '泥瓦阶段', plannedDays: 20, icon: '🧱' },
    { id: 'stage-3', name: '木工阶段', plannedDays: 25, icon: '🪚' },
    { id: 'stage-4', name: '油漆阶段', plannedDays: 15, icon: '🖌️' },
    { id: 'stage-5', name: '安装阶段', plannedDays: 10, icon: '🔧' }
  ],

  laborPrice: 300,

  roomColorMap: {
    living: '#E8F4FD',
    bedroom: '#FFF3E0',
    kitchen: '#E8F5E9',
    bathroom: '#E0F7FA',
    study: '#F3E5F5'
  }
};

const DragManager = {
  draggedElement: null,
  draggedMaterial: null,

  init() {
    this.setupDragSources();
    this.setupDropTargets();
    this.setupTouchSupport();
  },

  setupDragSources() {
    document.addEventListener('mousedown', (e) => {
      const materialCard = e.target.closest('.material-card');
      if (materialCard) {
        materialCard.setAttribute('draggable', 'true');
      }
    });

    document.addEventListener('dragstart', (e) => {
      const materialCard = e.target.closest('.material-card');
      if (materialCard) {
        this.draggedElement = materialCard;
        const materialId = materialCard.dataset.materialId;
        this.draggedMaterial = PRESET_DATA.materials.find(m => m.id === materialId);
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', materialId);
        materialCard.classList.add('dragging');
      }
    });

    document.addEventListener('dragend', (e) => {
      const materialCard = e.target.closest('.material-card');
      if (materialCard) {
        materialCard.classList.remove('dragging');
        materialCard.removeAttribute('draggable');
      }
      this.draggedElement = null;
      this.draggedMaterial = null;
      document.querySelectorAll('.drop-target').forEach(el => {
        el.classList.remove('drag-over');
      });
    });
  },

  setupDropTargets() {
    document.addEventListener('dragover', (e) => {
      const dropTarget = e.target.closest('.drop-target');
      if (dropTarget) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        dropTarget.classList.add('drag-over');
      }
    });

    document.addEventListener('dragleave', (e) => {
      const dropTarget = e.target.closest('.drop-target');
      if (dropTarget && !dropTarget.contains(e.relatedTarget)) {
        dropTarget.classList.remove('drag-over');
      }
    });

    document.addEventListener('drop', (e) => {
      const dropTarget = e.target.closest('.drop-target');
      if (dropTarget && this.draggedMaterial) {
        e.preventDefault();
        dropTarget.classList.remove('drag-over');
        this.handleDrop(dropTarget, this.draggedMaterial);
      }
    });
  },

  setupTouchSupport() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchElement = null;
    let touchMaterial = null;
    let ghost = null;

    document.addEventListener('touchstart', (e) => {
      const materialCard = e.target.closest('.material-card');
      if (materialCard && e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchElement = materialCard;
        const materialId = materialCard.dataset.materialId;
        touchMaterial = PRESET_DATA.materials.find(m => m.id === materialId);

        setTimeout(() => {
          if (touchElement) {
            ghost = materialCard.cloneNode(true);
            ghost.style.position = 'fixed';
            ghost.style.pointerEvents = 'none';
            ghost.style.opacity = '0.8';
            ghost.style.zIndex = '10000';
            ghost.style.transform = 'scale(1.05)';
            document.body.appendChild(ghost);
            materialCard.classList.add('dragging');
          }
        }, 200);
      }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
      if (ghost && touchMaterial) {
        const touch = e.touches[0];
        ghost.style.left = (touch.clientX - 50) + 'px';
        ghost.style.top = (touch.clientY - 50) + 'px';

        document.querySelectorAll('.drop-target').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
              touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
            el.classList.add('drag-over');
          } else {
            el.classList.remove('drag-over');
          }
        });
      }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (ghost && touchMaterial) {
        const touch = e.changedTouches[0];
        let dropped = false;

        document.querySelectorAll('.drop-target').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
              touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
            this.handleDrop(el, touchMaterial);
            el.classList.remove('drag-over');
            dropped = true;
          }
        });

        if (ghost.parentNode) {
          ghost.parentNode.removeChild(ghost);
        }
        ghost = null;
        if (touchElement) {
          touchElement.classList.remove('dragging');
        }
        touchElement = null;
        touchMaterial = null;
      }
    });
  },

  handleDrop(dropTarget, material) {
    const areaId = dropTarget.dataset.areaId;
    if (!areaId || !material) return;

    if (this.onDropCallback) {
      this.onDropCallback(areaId, material);
    }

    dropTarget.classList.add('drop-success');
    setTimeout(() => {
      dropTarget.classList.remove('drop-success');
    }, 500);
  },

  onDrop(callback) {
    this.onDropCallback = callback;
  }
};

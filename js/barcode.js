let barcodeCount = 0;
const maxBarcodes = 50;

function generateBarcode(value, type, container) {
    try {
        let options = {
            width: 2,
            height: 100,
            displayValue: true,
            fontSize: 20,
            textMargin: 10,
            margin: 10
        };

        // Add specific options for different barcode types
        switch(type) {
            case 'EAN':
                options.format = 'EAN13';
                options.flat = true;
                break;
            case 'EAN8':
                options.format = 'EAN8';
                options.flat = true;
                break;
            case 'UPC':
                options.format = 'UPC';
                options.flat = true;
                break;
            case 'CODE39':
                options.flat = true;
                break;
            case 'ITF14':
            case 'ITF':
                options.flat = true;
                break;
            case 'MSI':
            case 'MSI10':
            case 'MSI11':
            case 'MSI1010':
            case 'MSI1110':
                break;
            case 'Pharmacode':
                break;
        }

        JsBarcode(container, value, options);
    } catch (error) {
        document.getElementById('error').textContent = `Error: ${error.message}`;
    }
}

function addBarcode() {
    const type = document.getElementById('barcodeType').value;
    let value = document.getElementById('barcodeValue').value;
    const errorDiv = document.getElementById('error');
    const barcodeInput = document.getElementById('barcodeValue');
    
    if (!value) {
        errorDiv.textContent = '바코드 값을 입력해주세요';
        return;
    }

    // Validate barcode format
    if (type === 'EAN' || type === 'EAN8') {
        const numericValue = value.replace(/\D/g, '');
        if (type === 'EAN' && (numericValue.length !== 12 && numericValue.length !== 13)) {
            errorDiv.textContent = 'EAN 바코드는 12자리 또는 13자리 숫자여야 합니다';
            return;
        }
        if (type === 'EAN8' && (numericValue.length !== 7 && numericValue.length !== 8)) {
            errorDiv.textContent = 'EAN-8 바코드는 7자리 또는 8자리 숫자여야 합니다';
            return;
        }
        value = numericValue;
    } else if (type === 'UPC') {
        const numericValue = value.replace(/\D/g, '');
        if (numericValue.length !== 11 && numericValue.length !== 12) {
            errorDiv.textContent = 'UPC 바코드는 11자리 또는 12자리 숫자여야 합니다';
            return;
        }
        value = numericValue;
    }

    if (barcodeCount >= maxBarcodes) {
        errorDiv.textContent = `최대 바코드 개수 (${maxBarcodes}개)에 도달했습니다`;
        return;
    }

    errorDiv.textContent = '';
    barcodeCount++;

    const grid = document.getElementById('barcodeGrid');
    const barcodeItem = document.createElement('div');
    barcodeItem.className = 'barcode-item';
    barcodeItem.draggable = true;
    barcodeItem.dataset.index = barcodeCount - 1;
    
    // Add drag event listeners
    barcodeItem.addEventListener('dragstart', handleDragStart);
    barcodeItem.addEventListener('dragend', handleDragEnd);
    barcodeItem.addEventListener('dragover', handleDragOver);
    barcodeItem.addEventListener('dragleave', handleDragLeave);
    barcodeItem.addEventListener('drop', handleDrop);
    
    const barcodeNumber = document.createElement('div');
    barcodeNumber.className = 'barcode-number';
    barcodeNumber.textContent = barcodeCount;
    
    const removeButton = document.createElement('button');
    removeButton.className = 'remove-barcode';
    removeButton.setAttribute('aria-label', '바코드 삭제');
    removeButton.onclick = function() {
        barcodeItem.remove();
        barcodeCount--;
        updateBarcodeNumbers();
    };
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const barcodeValue = document.createElement('div');
    barcodeValue.className = 'barcode-value';
    barcodeValue.textContent = '';

    barcodeItem.appendChild(barcodeNumber);
    barcodeItem.appendChild(removeButton);
    barcodeItem.appendChild(svg);
    barcodeItem.appendChild(barcodeValue);
    grid.appendChild(barcodeItem);

    generateBarcode(value, type, svg);
    barcodeInput.value = '';
    barcodeInput.focus();
}

// Drag and Drop functions
function handleDragStart(e) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.getAttribute('data-index'));
    this.classList.add('dragging');
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.barcode-item').forEach(item => {
        item.classList.remove('drag-over');
        item.classList.remove('dragging');
    });
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
    return false;
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    this.classList.remove('drag-over');
    
    const draggedItemIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const dropTargetIndex = parseInt(this.getAttribute('data-index'));
    
    if (draggedItemIndex === dropTargetIndex) {
        return;
    }
    
    // Remove any lingering drag classes
    document.querySelectorAll('.barcode-item').forEach(item => {
        item.classList.remove('drag-over');
        item.classList.remove('dragging');
    });
    
    // Get all barcode items
    const barcodeItems = Array.from(document.querySelectorAll('.barcode-item'));
    const draggedItem = barcodeItems.find(item => parseInt(item.getAttribute('data-index')) === draggedItemIndex);
    const dropTarget = barcodeItems.find(item => parseInt(item.getAttribute('data-index')) === dropTargetIndex);
    
    if (!draggedItem || !dropTarget) {
        return;
    }
    
    // Get the parent element
    const grid = document.getElementById('barcodeGrid');
    
    // Clone the grid to avoid reference issues
    const gridClone = grid.cloneNode(false);
    
    // Create new ordered array with swapped positions
    const newOrder = [...barcodeItems];
    const draggedItemPosition = newOrder.indexOf(draggedItem);
    const dropTargetPosition = newOrder.indexOf(dropTarget);
    
    // Swap positions in the array
    [newOrder[draggedItemPosition], newOrder[dropTargetPosition]] = 
    [newOrder[dropTargetPosition], newOrder[draggedItemPosition]];
    
    // Append items in the new order
    newOrder.forEach((item, index) => {
        const clonedItem = item.cloneNode(true);
        clonedItem.setAttribute('data-index', index);
        
        // Remove any drag classes from cloned item
        clonedItem.classList.remove('drag-over');
        clonedItem.classList.remove('dragging');
        
        // Re-add event listeners to the cloned item
        clonedItem.addEventListener('dragstart', handleDragStart);
        clonedItem.addEventListener('dragend', handleDragEnd);
        clonedItem.addEventListener('dragover', handleDragOver);
        clonedItem.addEventListener('dragleave', handleDragLeave);
        clonedItem.addEventListener('drop', handleDrop);
        
        // Re-add remove button functionality
        const removeButton = clonedItem.querySelector('.remove-barcode');
        if (removeButton) {
            removeButton.onclick = function() {
                clonedItem.remove();
                barcodeCount--;
                updateBarcodeNumbers();
            };
        }
        
        gridClone.appendChild(clonedItem);
    });
    
    // Replace the old grid with the new one
    grid.parentNode.replaceChild(gridClone, grid);
    
    // Update barcode numbers
    updateBarcodeNumbers();
    return false;
}

function clearAll() {
    document.getElementById('barcodeGrid').innerHTML = '';
    barcodeCount = 0;
    document.getElementById('error').textContent = '';
}

function updateBarcodeNumbers() {
    const items = document.querySelectorAll('.barcode-item');
    items.forEach((item, index) => {
        item.querySelector('.barcode-number').textContent = index + 1;
        item.dataset.index = index;
    });
}

function generateFromExcel() {
    const excelData = document.getElementById('excelData').value;
    const type = document.getElementById('barcodeType').value;
    const errorDiv = document.getElementById('error');
    
    if (!excelData) {
        errorDiv.textContent = '엑셀 데이터를 입력해주세요';
        return;
    }
    
    errorDiv.textContent = '';
    
    // Split by newlines
    const lines = excelData.split(/\r?\n/).filter(line => line.trim() !== '');
    
    if (lines.length + barcodeCount > maxBarcodes) {
        errorDiv.textContent = `최대 바코드 개수를 초과합니다. 현재 ${barcodeCount}개, 추가 ${lines.length}개, 최대 ${maxBarcodes}개`;
        return;
    }
    
    let errorCount = 0;
    let successCount = 0;
    
    lines.forEach(line => {
        let value = line.trim();
        
        // Validate barcode format based on type
        if (type === 'EAN' || type === 'EAN8') {
            const numericValue = value.replace(/\D/g, '');
            
            if (type === 'EAN' && (numericValue.length !== 12 && numericValue.length !== 13)) {
                errorCount++;
                return;
            }
            
            if (type === 'EAN8' && (numericValue.length !== 7 && numericValue.length !== 8)) {
                errorCount++;
                return;
            }
            
            value = numericValue;
        } else if (type === 'UPC') {
            const numericValue = value.replace(/\D/g, '');
            
            if (numericValue.length !== 11 && numericValue.length !== 12) {
                errorCount++;
                return;
            }
            
            value = numericValue;
        }
        
        barcodeCount++;
        successCount++;
        
        const grid = document.getElementById('barcodeGrid');
        const barcodeItem = document.createElement('div');
        barcodeItem.className = 'barcode-item';
        barcodeItem.draggable = true;
        barcodeItem.dataset.index = barcodeCount - 1;
        
        // Add drag event listeners
        barcodeItem.addEventListener('dragstart', handleDragStart);
        barcodeItem.addEventListener('dragend', handleDragEnd);
        barcodeItem.addEventListener('dragover', handleDragOver);
        barcodeItem.addEventListener('dragleave', handleDragLeave);
        barcodeItem.addEventListener('drop', handleDrop);
        
        const barcodeNumber = document.createElement('div');
        barcodeNumber.className = 'barcode-number';
        barcodeNumber.textContent = barcodeCount;
        
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-barcode';
        removeButton.setAttribute('aria-label', '바코드 삭제');
        removeButton.onclick = function() {
            barcodeItem.remove();
            barcodeCount--;
            updateBarcodeNumbers();
        };
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const barcodeValue = document.createElement('div');
        barcodeValue.className = 'barcode-value';
        barcodeValue.textContent = '';
        
        barcodeItem.appendChild(barcodeNumber);
        barcodeItem.appendChild(removeButton);
        barcodeItem.appendChild(svg);
        barcodeItem.appendChild(barcodeValue);
        grid.appendChild(barcodeItem);
        
        generateBarcode(value, type, svg);
    });
    
    if (errorCount > 0) {
        errorDiv.textContent = `${successCount}개 바코드 생성, ${errorCount}개 오류 (유효하지 않은 형식)`;
    } else {
        errorDiv.textContent = `${successCount}개 바코드 생성 완료`;
    }
    
    document.getElementById('excelData').value = '';
}

function printBarcodes() {
    window.print();
} 
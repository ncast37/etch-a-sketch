const sketchArea = document.querySelector('.sketch');
const sketchAreaWidth = sketchArea.offsetWidth;
const sketchAreaHeight = sketchArea.offsetHeight;
const inputValue = document.querySelector('#inputValue');
const subBtn = document.querySelector('#sub-btn');
const colorPicker = document.getElementById("color-picker");
const resetBtn = document.getElementById('reset-btn');
const gravitySensor = document.getElementById('gravity-option');
const gravityBtn = document.getElementById('gravity-btn');

let coloredCellsArray = [];
let sortedColoredCells = [];

// Default Values
const initGridSize = 16; 
const maxGridSize = 100;
const fallSpeed = 10000;
let rgbArray = [0, 0, 0]; 
let gridSize;
let cellHeight;
let cellWidth;
let isButtonDown = false; 
let sketchCells = null;



/* EVENT LISTENERS BELOW */

//Event listener detect and set color changes 
colorPicker.addEventListener("input", function() {
    hexToRGB(this.value);
})


inputValue.defaultValue = initGridSize;

    // Event listeners to build grids on load and resets
document.addEventListener("load", buildGrid());
subBtn.addEventListener('click', () => {
    buildGrid(inputValue.value);
    coloredCellsArray = [];
    isButtonDown = false;
});

resetBtn.addEventListener('click', reset);


    // Event listeners to track state of mouse button
sketchArea.addEventListener('mousedown', (e) => {
    isButtonDown = true;
    e.preventDefault();
})

document.addEventListener('mouseup', () => {
    isButtonDown = false;
})


    // Triggers sorting function for colored cells array
    // This anticipates the user's action on the "gravity mode" button
    // By pre-sorting, the array is ready when the user clicks the button
gravitySensor.addEventListener('mouseenter', () => {
    sortedColoredCells = mergeSort(coloredCellsArray);
})

gravityBtn.addEventListener('click', () => {
    gravityMode(sortedColoredCells);
})

/* 
Function Declarations BELOW
*/ 


function buildGrid (size = initGridSize) {
    
    size = Math.min(Math.max(size, 1), maxGridSize);

    removeGrids(sketchCells);
    calculateCellDimension(size);

    for (let i = 1; i <= gridSize; i++) {
        for (let j = 1; j <= gridSize; j++) {
            const sketchCell = document.createElement('div');
            sketchCell.classList.add('sketchCell');
            sketchCell.style.height = cellHeight + '%';
            sketchCell.style.width = cellWidth + '%';
            sketchCell.style.backgroundColor;

            //Adding row and column properties to track cell location
            sketchCell.dataset.row = i;
            sketchCell.dataset.col = j;
            sketchCell.dataset.colored = false;

            sketchArea.appendChild(sketchCell);
        }
    } 

    sketchCells =  document.querySelectorAll('.sketchCell')
    addShadingEventListener(sketchCells);
    return;
}


function calculateCellDimension(size) {
    gridSize = size;
    cellWidth = ((sketchAreaWidth / gridSize) / sketchAreaWidth) * 100;
    cellHeight = ((sketchAreaHeight / gridSize) / sketchAreaHeight) * 100;
} 



function removeGrids(cellArray) {
    if (cellArray === null) return;
    cellArray.forEach(cell => cell.remove());
}

function addShadingEventListener(cellArray) {
    const throttledShadeCell = throttle(shadeCell,1);

    cellArray.forEach(cell => {
        cell.addEventListener('mousemove', () => {
            if (isButtonDown === true) {
                throttledShadeCell(cell);
            }
        })
    })
}

function shadeCell (element) {
    element.style.backgroundColor = `rgb(${rgbArray[0]}, ${rgbArray[1]}, ${rgbArray[2]})`;
    element.dataset.colored = true;

    /*check if cell exists in colorCells array to 
      prevent duplication within the array */
    if(!coloredCellsArray.includes(element)) {
        coloredCellsArray.push(element);
    }
}


function throttle(callback, delay) {
    let previousCall = new Date().getTime();
    return function() {
        const time = new Date().getTime();
        if (time - previousCall >= delay) {
            previousCall = time; 
            callback.apply(null, arguments);
        }
    };
}


function hexToRGB(hex) {
    let hexString = hex.slice(1);
    const bigint = parseInt(hexString,16);

    const r = (bigint >> 16) & 255; 
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    // Sets global rgbArray after conversion to rgb; 
    rgbArray = [r, g, b];
}

function reset() {
        buildGrid();
        isButtonDown = false;
        rgbArray = [0 , 0, 0];
        colorPicker.value = "#000000";
        inputValue.value = initGridSize;
        coloredCellsArray = [];
}


function mergeSort(array) {
    if (array.length <= 1) {
        return array;
    }

    const middle = Math.floor(array.length / 2);
    const left = array.slice(0, middle);
    const right = array.slice(middle);

    return merge(mergeSort(left), mergeSort(right));
}

function merge(left, right) {
    let result = [];
    let leftIndex = 0;
    let rightIndex = 0;

    while(leftIndex < left.length && rightIndex < right.length) {

        //Prioritize highest row index then lowest col index if rows are equal 
        const rowComparison = parseInt(right[rightIndex].dataset.row) - parseInt(left[leftIndex].dataset.row)

        if (rowComparison < 0 || rowComparison === 0 && parseInt(left[leftIndex].dataset.col) < parseInt(right[rightIndex].dataset.col)){
            result.push(left[leftIndex]);
            leftIndex ++; 
        } else {
            result.push(right[rightIndex]);
            rightIndex ++;
        }
    }
    return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));

}

function gravityMode(array){
    let i = 1; 
    let delay = fallSpeed/gridSize;

    while(i !== 0){
        i = 0;

        for (let j = 0; j < array.length; j++) {
            let cell = array[j];
            const currentRow = parseInt(cell.dataset.row);
            let lowerCell = getSketchCell(currentRow + 1, cell.dataset.col);

            if(currentRow === gridSize || lowerCell.dataset.colored === 'true') {
                continue; 
            }
            swapCellPropertiesWithDelay(cell, lowerCell, delay);
            lowerCell.dataset.colored = true; 
            replaceElementAt(array, j, lowerCell);
            i++;
        }
    }    
};


function getSketchCell(row, col) {
    return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

function replaceElementAt(array, indexToReplace, replacementElement) {
    if (indexToReplace >= 0 && indexToReplace < array.length) {
        array[indexToReplace] = replacementElement;
    }
}

function swapCellProperties (arrayObject, replacementObject) {
    // Swap Background Colors
    const color = arrayObject.style.backgroundColor;
    replacementObject.style.backgroundColor = color;
    arrayObject.style.backgroundColor = 'transparent';

    // Swap Colored Status
    arrayObject.dataset.colored = false;
    replacementObject.dataset.colored = true; 
}

function swapCellPropertiesWithDelay(arrayObject, replacementObject, delay) {
    setTimeout(() => {
        // Swap Background Colors
        const color = arrayObject.style.backgroundColor;
        replacementObject.style.backgroundColor = color;
        arrayObject.style.backgroundColor = 'transparent';

        // Swap Colored Status
        arrayObject.dataset.colored = false;
        replacementObject.dataset.colored = true;
    }, delay);
}


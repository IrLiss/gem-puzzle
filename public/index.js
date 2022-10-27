let movesCount = 0;
let time = 0;
let startTime = true;
let countCells;
let typeGame = '4';
let itemNodes;
let matrix;
let sizeCell;
let playGame = false;
let playAudio = true;
let resultArray = [];

/*===================================================
      Create and render elements currently page
====================================================*/
const header = document.createElement('header');
header.className = 'header';
document.body.append(header);

const h1 = document.createElement('h1');
header.className = 'header';
h1.innerHTML = 'Gem Puzzle';

const ctrlPanel = document.createElement('div');
ctrlPanel.className = 'ctrl-panel';

header.append(h1, ctrlPanel);

const buttonStartShuffle = document.createElement('button');
buttonStartShuffle.innerHTML = 'Shuffle and start';
buttonStartShuffle.className = 'shuffle';

const buttonSave = document.createElement('button');
buttonSave.innerHTML = 'Save';

const buttonLoad = document.createElement('button');
buttonLoad.innerHTML = 'Load';

const buttonSound = document.createElement('button');
buttonSound.innerHTML = 'Sound';

const buttonResult = document.createElement('button');
buttonResult.innerHTML = 'Result';

ctrlPanel.append(buttonStartShuffle, buttonSave, buttonLoad, buttonSound, buttonResult);

const main = document.createElement('main');
main.className = 'main';
header.after(main);

const scoreContainer = document.createElement('div');
scoreContainer.className = 'score-container';
main.append(scoreContainer);

const movesContainer = document.createElement('span');
movesContainer.className = 'moves';
movesContainer.innerHTML = 'Moves: 0';

const timeContainer = document.createElement('span');
timeContainer.className = 'time';
timeContainer.innerHTML = 'Time: 00:00';

scoreContainer.append(timeContainer, movesContainer);

const pageNode = document.createElement('div');
pageNode.className = 'page';
main.append(pageNode);

const containerNodeDiv = document.createElement('div');
containerNodeDiv.className = 'fifteen';
pageNode.append(containerNodeDiv);

const footer = document.createElement('footer');
footer.className = 'footer';
main.after(footer);

const fieldSizeContainer = document.createElement('div');
fieldSizeContainer.className = 'field-size__container';
footer.append(fieldSizeContainer);


for (let i = 3; i <= 8; i++) {
    const fieldSize = document.createElement('button');
    fieldSize.className = 'field-size';
    fieldSize.id = `${i}`;
    fieldSize.innerHTML = `${i} x ${i}`;
    fieldSizeContainer.append(fieldSize);

    if (i === 4) {
        fieldSize.classList.add('active');
    }
}

function addFieldSizeClickHandler() {
    document.querySelector('.field-size__container').addEventListener('click', (event) => {
        if (event.target.classList.contains('field-size')) {
            document.querySelectorAll('.field-size').forEach(item => {
                item.classList.remove('active');
            });
            event.target.classList.add('active');
            showMovesAndTime();
        }
    })
}

addFieldSizeClickHandler();

/*==================
      Position
===================*/
const containerNode = document.querySelector('.fifteen');
const fieldSize = document.querySelectorAll('.field-size');

fieldSize.forEach((item) => {
    item.addEventListener('click', () => {
        typeGame = item.id;
        addItemNodes(typeGame);

    })
})

function addItemNodes(typeGame) {
    containerNodeDiv.innerHTML = "";

    sizeCell = typeGame;
    countCells = typeGame * typeGame;

    let startArray = [...Array(countCells).keys()];

    startArray.forEach((index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';
        itemDiv.innerHTML = `${index + 1}`;
        itemDiv.id = `${index + 1}`;
        containerNodeDiv.append(itemDiv)

        itemDiv.style.width = `${100 / sizeCell}%`;
        itemDiv.style.height = `${100 / sizeCell}%`;

        itemDiv.draggable = !0;
        itemDiv.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData('id', event.target.id);
        })
    });

    itemNodes = Array.from(containerNodeDiv.querySelectorAll('.item'));

    matrix = getMatrix(
        itemNodes.map((item) => Number(item.id))
    )

    itemNodes[countCells - 1].style.display = 'none';

    shuffleCells();

    if (playGame) {
        matrix = JSON.parse(localStorage.getItem("matrix"));
        typeGame = Number(localStorage.getItem('typeGame'));

        playAudio = !playAudio;
        if (!!!playAudio) {
            buttonSound.innerHTML = 'Silence!';
        } else {
            buttonSound.innerHTML = 'Sound';
        }

        const fieldSizeSave = document.querySelectorAll('.field-size');

        fieldSizeSave.forEach((value, index) => {
            value.classList.remove('active');

            if (index + 3 === typeGame) {
                value.classList.add('active');
            }
        })
    }
}

addItemNodes(typeGame);

/*==================
      Shuffle
===================*/
buttonStartShuffle.addEventListener('click', () => {
    shuffleCells();
    showMovesAndTime();
})

function shuffleCells() {
    const flatMatrix = matrix.flat();
    let shuffleArray = shuffle(flatMatrix);

    while (!searchDecideArray(shuffleArray)) {
        shuffleArray = shuffle(flatMatrix);
    }

    matrix = getMatrix(shuffleArray);

    setPositionCells(matrix);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function searchDecideArray(array) {
    let countInversions = 0;
    let newArray = array.slice();
    let blankRowPosition = Math.ceil((newArray.indexOf(countCells) + 1) / Math.sqrt(countCells)) - 1;
    newArray.splice(newArray.indexOf(countCells), 1);

    for (let i = 0; i < newArray.length; i++) {
        for (let j = i; j < newArray.length; j++) {
            if (newArray[i] > newArray[j]) {
                countInversions++;
            }
        }
    }

    if (!(countCells % 2 === 0) && (countInversions % 2 === 0)) {
        return true;
    } else return !((countInversions + blankRowPosition) % 2 === 0) && (countCells % 2 === 0);
}

/*====================================
       Change position by click
=====================================*/
containerNode.addEventListener('click', (event) => {

    const buttonNode = event.target.closest('.item');

    if (!buttonNode) {
        return;
    }

    const buttonNumber = Number(buttonNode.id)
    const buttonCoords = findCoordinatesByNumber(buttonNumber, matrix);
    const blankCoords = findCoordinatesByNumber(countCells, matrix);
    const isValid = isValidForSwap(buttonCoords, blankCoords);

    if (isValid) {
        changeAudio(playAudio);

        swap(blankCoords, buttonCoords, matrix);
        setPositionCells(matrix);
    }
})

/*======================================================
           Change position drag and drop
=======================================================*/
containerNode.addEventListener('dragover', (event) => {
    event.preventDefault();
})

containerNode.addEventListener('drop', (event) => {
    const buttonNode = document.getElementById(event.dataTransfer.getData('id'));

    if (!buttonNode) {
        return;
    }

    const buttonNumber = Number(buttonNode.id)
    const buttonCoords = findCoordinatesByNumber(buttonNumber, matrix);
    const blankCoords = findCoordinatesByNumber(countCells, matrix);
    const isValid = isValidForSwap(buttonCoords, blankCoords);

    if (isValid) {
        changeAudio(playAudio);

        swap(blankCoords, buttonCoords, matrix);
        setPositionCells(matrix);
    }
})

/*====================================
      Change position by arrows
=====================================*/
window.addEventListener('keydown', (event) => {

    if (!event.key.includes('Arrow')) {
        return;
    }

    const blankCoords = findCoordinatesByNumber(countCells, matrix)
    const buttonCoords = {
        x: blankCoords.x,
        y: blankCoords.y,
    }

    const direction = event.key;
    const maxIndexMatrix = matrix.length;
    switch (direction) {
        case 'ArrowUp':
            buttonCoords.y += 1;
            break;
        case 'ArrowDown':
            buttonCoords.y -= 1;
            break;
        case 'ArrowLeft':
            buttonCoords.x += 1;
            break;
        case 'ArrowRight':
            buttonCoords.x -= 1;
            break;
    }

    if (buttonCoords.y >= maxIndexMatrix || buttonCoords.y < 0 ||
        buttonCoords.x >= maxIndexMatrix || buttonCoords.x < 0) {
        return;
    }

    changeAudio(playAudio);

    swap(blankCoords, buttonCoords, matrix);
    setPositionCells(matrix);
})

/*====================================
           Timer and moves
=====================================*/
function formatDate(time) {
    const date = new Date(2022, 0, 1);
    date.setSeconds(time);
    return date.toTimeString().replace(/.*(\d{2}:\d{2}).*/, '$1');
}

function startTimer() {
    setInterval(() => {
        startTime && time++;
        document.querySelector('.time').innerHTML = `Time: ${formatDate(time)}`
    }, 1000)
}

function changeMoves() {
    movesCount++;
    document.querySelector('.moves').innerHTML = `Moves: ${movesCount}`;
}

startTimer();

function showMovesAndTime() {
    time = 0;
    timeContainer.innerHTML = 'Time: 00:00';
    startTime = true;

    movesCount = 0;
    document.querySelector('.moves').innerHTML = `Moves: ${movesCount}`;
}

/*==================
       Sound
===================*/
buttonSound.addEventListener('click', () => {
    playAudio = !playAudio;

    if (playAudio) {
        buttonSound.innerHTML = 'Sound!';
    } else {
        buttonSound.innerHTML = 'Silence';
    }
});


function changeAudio(playAudio) {
    const audio = new Audio();
    audio.src = './assets/slide.mp3';
    audio.autoplay = playAudio;
}

/*==================
     Message Win
===================*/
function createWinModal() {
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-shadow';
    document.body.append(modalContainer);

    const modal = document.createElement('div');
    modal.className = 'modal';
    modalContainer.append(modal);

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modal.append(modalContent);

    const modalTitle = document.createElement('h2');
    modalTitle.className = 'win-message';
    modalTitle.innerHTML = `Hooray! You have solved the puzzle in ${formatDate(time)} and ${movesCount} moves!`;
    modalContent.append(modalTitle);

    const audioWin = new Audio();
    audioWin.src = './assets/win.mp3';
    audioWin.autoplay = playAudio;
}

const shadowWin = document.createElement('div');
shadowWin.className = 'shadow';
main.append(shadowWin);

function removeModal() {
    const modalShadow = document.querySelector('.modal-shadow');

    if (document.querySelector('h2.win-message') !== null) {
        document.querySelector('.shadow').classList.add('shadow-active');
    }

    modalShadow.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal-shadow')) {
            modalShadow.remove();
            }
    });

    document.querySelector('button.shuffle').addEventListener('click', (event) => {
        document.querySelector('.shadow').classList.remove('shadow-active');
    });
}

/*==================
     Different
===================*/
function getMatrix(arr) {
    const matrix = [];

    for (let i = 0; i < sizeCell; i++) {
        matrix.push([]);
    }

    let x = 0;
    let y = 0;

    for (let i = 0; i < arr.length; i++) {
        if (x >= sizeCell) {
            y++;
            x = 0;
        }
        matrix[y][x] = arr[i];
        x++;
    }
    return matrix;
}

function setPositionCells(matrix) {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            const value = matrix[y][x];
            const node = itemNodes[value - 1];
            setNodeStyles(node, x, y);
        }
    }
}

function setNodeStyles(node, x, y) {
    const shiftPs = 100;
    node.style.transform = `translate3D(${x * shiftPs}%,${y * shiftPs}%,0)`;
}

function findCoordinatesByNumber(number, matrix) {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            if (matrix[y][x] === number) {
                return { x, y }
            }
        }
    }
    return null;
}

function isValidForSwap(coords1, coords2) {
    const diffX = Math.abs(coords1.x - coords2.x);
    const diffY = Math.abs(coords1.y - coords2.y);

    return (diffX === 1 || diffY === 1) &&
        (coords1.x === coords2.x || coords1.y === coords2.y)
}

function swap(coords1, coords2, matrix) {
    const coords1Number = matrix[coords1.y][coords1.x];
    matrix[coords1.y][coords1.x] = matrix[coords2.y][coords2.x];
    matrix[coords2.y][coords2.x] = coords1Number;

    changeMoves();

    if (checkWin(matrix)) {
        createWinModal();
        removeModal();
        startTime = false;

        addWinDate()
    }
}

function checkWin(matrix) {
    const winFlatArr = new Array(countCells).fill(0).map((_item, i) => i + 1);

    const flatMatrix = matrix.flat();
    for (let i = 0; i < winFlatArr.length; i++) {
        if (flatMatrix[i] !== winFlatArr[i]) {
            return false;
        }
    }
    return true;
}

function addWinDate() {
    resultArray.push({
        'typeGame': typeGame,
        'time': formatDate(time),
        'moves': movesCount
    })

    resultArray.sort((a, b) => {
        return a.moves - b.moves;
    });

    if (resultArray.length > 10) {
        resultArray.length = 10
    }

    setLocalStorage();
}

/*====================================
           Message Result
=====================================*/
function createResultModal() {
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-shadow';
    document.body.append(modalContainer);

    const modal = document.createElement('div');
    modal.className = 'modal';
    modalContainer.append(modal);

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modal.append(modalContent);

    const modalTitle = document.createElement('h2');
    modalTitle.innerHTML = `Your result`;
    modalContent.append(modalTitle);
}

buttonResult.addEventListener('click', () => {

    createResultModal();
    removeModal();

    if (localStorage.getItem('resultArray')) {
        resultArray = JSON.parse(localStorage.getItem('resultArray'))

        resultArray.forEach((value, index) => {
            const modalContent = document.querySelector('.modal-content')
            const modalResult = document.createElement('p');

            modalResult.innerHTML = `${index + 1}. Type: ${value.typeGame} x ${value.typeGame}, Time: ${value.time}, Moves: ${value.moves}`;
            modalContent.append(modalResult);
        })
    }
})

function setLocalStorage() {
    localStorage.setItem('resultArray', JSON.stringify(resultArray));

}

function getLocalStorage() {
    if (localStorage.getItem('resultArray')) {
        resultArray = JSON.parse(localStorage.getItem('resultArray'))
    }
}

window.addEventListener('load', getLocalStorage)


buttonSave.addEventListener('click', () => {
    localStorage.setItem('matrix', JSON.stringify(matrix));
    localStorage.setItem('typeGame', typeGame);
    localStorage.setItem('moves', movesCount);
    localStorage.setItem('time', time);
    localStorage.setItem('audio', playAudio);
})

buttonLoad.addEventListener('click', () => {
    if (localStorage.getItem('matrix')) {
        playGame = true;
        matrix = JSON.parse(localStorage.getItem('matrix'));
        typeGame = localStorage.getItem('typeGame');
        movesCount = localStorage.getItem('moves');
        time = localStorage.getItem('time');
        playAudio = localStorage.getItem('audio');

        addItemNodes(typeGame);
        setPositionCells(matrix);
        document.querySelector('.moves').innerHTML = `Moves: ${movesCount}`;
    }
    playGame = false;
})

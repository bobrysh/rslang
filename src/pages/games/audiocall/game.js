import { constants } from 'js/constants';
import { store } from 'store/index';
import { getRandomInt } from 'utils/index';
import { WordService } from 'scripts/service/Word.Service';
import { backgroundColorsHandler, createStartScreen } from 'pages/games/audiocall';
import { createLevelsBlock, timer } from 'pages/games/audiocall/render';
import { createGameStatistics, sendStatistics } from 'pages/games/audiocall/statistics';

const { audiocallGame } = store;

export async function playAudiocallGame() {
  const { body } = constants.DOM;
  const { audioCallGameSection } = constants.DOM;
  setCurrentWord();
  body.className = 'audiocall-game play-mode';
  audioCallGameSection.innerHTML = '';
  audioCallGameSection.insertAdjacentHTML(
    'afterbegin',
    `
        ${createLevelsBlock()}
        <div class="audiocall-game-top">
            ${renderContent()}
        </div>   
        <div class="audiocall-game-bottom">
            <button type="button" class="btn btn-outline-light audiocall-button button-not-know">Не знаю</button>
        </div>
        `
  );

  audioButtonHandler();
  playAudio();
  levelsBlockHandler();

  const audiocallButton = audioCallGameSection.querySelector('.audiocall-button');
  audiocallButton.addEventListener('click', gameButtonHandler);
  listenClick();
  listenKeyUp();
}

function renderContent() {
  const { currentGame, wordsArray: allWords } = store.audiocallGame;
  const guessWord = audiocallGame.wordsArray[currentGame.currentWord];
  const answers = (() => {
    const answersMap = { [guessWord.word]: guessWord };
    let needAnswers = currentGame.variants - 1;
    while (needAnswers > 0) {
      const randomIndex = getRandomInt(allWords.length);
      const randomWord = allWords[randomIndex];
      if (!(randomWord.word in answersMap)) {
        answersMap[randomWord.word] = randomWord;
        needAnswers--;
      }
    }

    return randomSort({ arr: Object.values(answersMap) });

    function randomSort({ arr }) {
      const result = [];
      const resultMap = {};
      do {
        const currentItem = arr[getRandomInt(arr.length)];
        if (!(currentItem.word in resultMap)) {
          resultMap[currentItem.word] = true;
          result.push(currentItem);
        }
      } while (result.length !== arr.length);
      return result;
    }
  })();

  return `
            <div class="card-preview inactive">
              <img class="card-img" src='https://raw.githubusercontent.com/MariannaV/rslang-data/master/${
                guessWord.image
              }' />
              <div class="word-description">
                <img class="sound-img" src=${require('assets/img/icons/sound.svg').default} />
                <p class="hidden-word">${guessWord.word}</p>
             </div>
           </div>
           <div class="block-with-words">
            ${answers
              .map(
                ({ word, wordTranslate }, index) =>
                  `<p class="answer-word" data-key= ${index + 1} data-id=${word}><span>${
                    index + 1
                  }</span>${wordTranslate}</p>`
              )
              .join('')}
           </div>
          `;
}

function updateContent() {
  const { audioCallGameSection } = constants.DOM;
  const content = audioCallGameSection.querySelector('.audiocall-game-top');
  content.innerHTML = '';
  content.insertAdjacentHTML('afterbegin', renderContent());
  playAudio();
  audioButtonHandler();
  listenClick();
}

async function playAudio() {
  const { currentGame, wordsArray: allWords } = store.audiocallGame;
  const guessWord = allWords[currentGame.currentWord];
  const audioWord = new Audio(`https://raw.githubusercontent.com/MariannaV/rslang-data/master/${guessWord.audio}`);
  await audioWord.play();
}

function audioButtonHandler() {
  document.querySelector('.sound-img').addEventListener('click', playAudio);
}

function gameButtonHandler() {
  const { audioCallGameSection } = constants.DOM;
  const { currentGame, wordsArray: allWords } = store.audiocallGame;

  const { errors } = currentGame.statistics;
  const audiocallButton = audioCallGameSection.querySelector('.audiocall-button');
  const isNotKnow = audiocallButton.classList.contains('button-not-know');
  const isNext = audiocallButton.classList.contains('button-next');

  if (isNext) {
    setCurrentWord();
    updateContent();
    backgroundColorsHandler();
  } else if (isNotKnow) {
    const correctAnswer = document.querySelector(`.answer-word[data-id=${allWords[currentGame.currentWord].word}]`);
    correctAnswer.classList.add('is-right');
    audioCallGameSection.querySelector('.card-preview').classList.remove('inactive');
    errors.set(allWords[currentGame.currentWord].word, {
      wordTranslate: allWords[currentGame.currentWord].wordTranslate,
    });
    markRestAnswersAsIncorrect();
    WordService.writeMistake(allWords[currentGame.currentWord].wordId);
  }
  audiocallButton.classList.toggle('button-not-know');
  audiocallButton.classList.toggle('button-next');
}

function answersHandler(event) {
  const { audioCallGameSection } = constants.DOM;
  const { errors, learned } = audiocallGame.currentGame.statistics;
  const audiocallButton = audioCallGameSection.querySelector('.audiocall-button');
  const optionsBlock = audioCallGameSection.querySelector('.block-with-words');
  const { currentGame, wordsArray: allWords } = store.audiocallGame;
  const guessWord = allWords[currentGame.currentWord];
  let answerButton = null;

  switch (event.type) {
    case 'keyup': {
      const { key } = event;
      answerButton = optionsBlock.querySelector(`[data-key='${key}']`);
      break;
    }
    case 'click': {
      answerButton = event.target;
      break;
    }
    default:
      return;
  }

  if (!answerButton) return;

  const isRightAnswer = answerButton.dataset.id === guessWord.word;
  answerButton.classList.add(isRightAnswer ? 'is-right' : 'is-wrong');

  if (isRightAnswer) {
    audiocallButton.classList.remove('button-not-know');
    audiocallButton.classList.add('button-next');
    audioCallGameSection.querySelector('.card-preview').classList.remove('inactive');
    markRestAnswersAsIncorrect();
    if (!audiocallGame.currentGame.answeredWrong)
      learned.set(guessWord.word, {
        wordTranslate: guessWord.wordTranslate,
        audio: guessWord.audioCallGameSection,
      });
    audiocallGame.currentGame.answeredWrong = false;
  } else if (!errors.has(guessWord.word)) {
    audiocallGame.currentGame.answeredWrong = true;
    errors.set(guessWord.word, {
      wordTranslate: guessWord.wordTranslate,
      audio: guessWord.audioCallGameSection,
    });
    WordService.writeMistake(guessWord.wordId);
  }
}

function levelsBlockHandler() {
  const levelsBlock = document.querySelector('.levels-block');
  levelsBlock.addEventListener('click', async (event) => {
    const container = event.currentTarget;
    const gameLevelBlock = event.target;
    const currentLevel = gameLevelBlock.dataset.level;
    if (gameLevelBlock.tagName !== 'INPUT') return;
    if (container.dataset.level !== currentLevel) {
      container.dataset.level = currentLevel;
      localStorage.setItem('levelAudiocallGame', currentLevel);
      await audiocallGame.getWords();
      createStartScreen();
      backgroundColorsHandler({ needReset: true });
      timer();
    }
  });
}

function markRestAnswersAsIncorrect() {
  const { audioCallGameSection } = constants.DOM;
  const optionsBlock = audioCallGameSection.querySelector('.block-with-words');
  optionsBlock.children.forEach((answer) => answer.classList.contains('is-right') || answer.classList.add('is-wrong'));
}

function setCurrentWord() {
  const { statistics, maxWordsLength } = audiocallGame.currentGame;
  const isEndGame = statistics.learned.size + statistics.errors.size >= maxWordsLength;
  if (isEndGame) {
    sendStatistics();
    createGameStatistics();
    return;
  }

  let newWordIndex;
  let newWord;

  do {
    newWordIndex = getRandomInt(audiocallGame.wordsArray.length);
    newWord = audiocallGame.wordsArray[newWordIndex].word;
  } while (statistics.learned.has(newWord) || statistics.errors.has(newWord));

  audiocallGame.currentGame.currentWord = newWordIndex;
}

export function gameReset() {
  backgroundColorsHandler({ needReset: true });
  store.audiocallGame.currentGame.statistics = {
    learned: new Map(),
    errors: new Map(),
  };
}

function listenKeyUp() {
  document.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') return gameButtonHandler(event);
    answersHandler(event);
  });
}

function listenClick() {
  const { audioCallGameSection } = constants.DOM;
  const optionsBlock = audioCallGameSection.querySelector('.block-with-words');
  optionsBlock.addEventListener('click', answersHandler);
}

(function () {
  'use strict';

  const levels = [
    { name: 'All Up', pattern: [1, 2, 3, 4], repetitions: 2, limit: 20000 },
    { name: 'Ten-Tap', pattern: [1], repetitions: 10, limit: 5000 },
    { name: 'Thumb-up', pattern: [1, 2, 1, 3, 1, 4, 1, 3], repetitions: 1, limit: 10000 },
    { name: 'Split-Tap', pattern: [1, 2], repetitions: 1, limit: 250 },
    { name: 'All Up 2', pattern: [1, 2, 3, 4], repetitions: 8, limit: 10000 },
    { name: 'Ten-Tap 2', pattern: [1], repetitions: 10, limit: 5000 },
    { name: 'Thumb-up 2', pattern: [1, 2, 1, 3, 1, 4, 1, 3], repetitions: 4, limit: 8000 },
    { name: 'Split-Tap 2', pattern: [1, 2], repetitions: 2, limit: 200 },
    { name: 'All Up 3', pattern: [1, 2, 3, 4], repetitions: 8, limit: 8000 },
    { name: 'Ten-Tap 3', pattern: [1], repetitions: 10, limit: 5000 },
    { name: 'Thumb-up 3', pattern: [1, 2, 1, 3, 1, 4, 1, 3], repetitions: 8, limit: 12000 },
    { name: 'Split-Tap 3', pattern: [1, 2], repetitions: 2, limit: 150 }
  ];

  const NEW_BEST = 'new-best';

  // singleton that gets game state from storage
  // keeps track of completed levels and stores them
  class State {
    constructor () {
      this.deserialize();
      this.id = (Math.random() + '').slice(3);
      this.preferredKeys = [];
    }

    winLevel ({ index, time }) {
      if (index === this.completedLevels.length) {
        this.completedLevels.push({ time });
      } else {
        if (time < this.completedLevels[index].time) {
          this.completedLevels[index].time = time;
          return NEW_BEST
        }
      }

      this.serialize();
    }

    addChallenge (challengeData) {
      this.challenges.push(challengeData);
      this.serialize();
      // return the index of the challenge created
      return this.challenges.length - 1
    }

    winChallenge ({ index, time }) {
      if (this.challenges[index].completed && time < this.challenges[index].time) {
        this.challenges[index].time = time;
        return NEW_BEST
      } else {
        this.challenges[index].completed = true;
        this.challenges[index].time = time;
      }

      this.serialize();
    }

    serialize () {
      // write to storage
      console.log('serializing', JSON.stringify({
        completedLevels: this.completedLevels,
        challenges: this.challenges
      }));
    }

    deserialize () {
      // read from storage
      this.completedLevels = [];
      this.challenges = [];
    }
  }

  var State$1 = { instance: new State() };

  const validKeys = 'abcdefghijklmnopqrstuvwxyz0123456789,./-='.split('');

  const gebi = (id) => document.getElementById(id);

  const modalElement$1 = gebi('popup');
  const modalButtons = gebi('popup-buttons');

  const makeDiv = (className) => {
    const div = document.createElement('div');
    div.className = className;
    return div
  };

  const removeChildElements = (element) => {
    Array.from(element.children).forEach((el) => el.remove());
  };

  const showModal = (title, subtext = '', buttons = []) => {
    removeChildElements(modalButtons);
    modalElement$1.children[0].innerText = title;
    modalElement$1.children[1].innerHTML = subtext;
    showElement(modalElement$1);

    buttons.forEach(({ label, callback }) => {
      const button = document.createElement('button');
      button.innerText = label;
      button.onclick = () => {
        hideElement(modalElement$1);
        callback();
      };
      modalButtons.appendChild(button);
    });
  };

  const timeToDisplay = (time) =>
    (time / 1000).toFixed(3).split('.').join('\'<small>') + '"</small>';

  const sleep = (time) => new Promise((resolve, reject) => setTimeout(resolve, time));

  const showElement = (element) => {
    element.style.visibility = 'visible';
    element.style.opacity = 1;
  };

  const hideElement = async (element) => {
    element.style.opacity = 0;
    await sleep(125);
    element.style.visibility = 'hidden';
  };

  const OPTIONS = 4;
  const TAP = 'tap';
  const HIT_NOTE = 'hit-note';
  const MISS_NOTE = 'miss-note';
  const scrollBox = gebi('scroll-box');

  const createElements = (items) => {
    scrollBox.appendChild(makeDiv('clear-scroll'));

    for (let i = items.length - 1; i >= 0; i--) {
      const itemRow = makeDiv('item-row');

      for (let j = 1; j <= OPTIONS; j++) {
        const item = makeDiv(j === items[i] ? 'item highlight' : 'item');
        itemRow.appendChild(item);
      }

      scrollBox.appendChild(itemRow);
    }
  };

  const createTimer = () => {
    const timer = document.createElement('h2');
    timer.id = 'timer';
    scrollBox.appendChild(timer);
    return timer
  };

  const createDialog = () => {
    const dialog = document.createElement('h2');
    dialog.id = 'dialog';
    scrollBox.appendChild(dialog);
    return dialog
  };

  class Game {
    constructor ({ name, pattern, repetitions, limit }, levelIndex, win, lose, isChallenge = false) {
      let items = [];
      for (let i = 0; i < repetitions; i++) {
        items = [...items, ...pattern];
      }

      this.id = (Math.random() + '').slice(2);

      removeChildElements(gebi('scroll-box'));
      createElements(items);
      this.tapButtons = Array.from(document.querySelectorAll('.tap-button'));
      this.hitElements = Array.from(document.querySelectorAll('.item-row'));
      this.scrollBox = gebi('scroll-box');
      this.timerElement = createTimer();
      this.dialogElement = createDialog();

      const preferredKeys = State$1.instance.preferredKeys;
      if (preferredKeys === TAP || preferredKeys.length) {
        // keep keys if stored in state
        this.keys = preferredKeys;
        if (preferredKeys !== TAP) {
          this.tapButtons.forEach((b, i) => { b.innerText = this.keys[i].toUpperCase(); });
        }
        this.setBound();
      } else {
        this.keys = [];
        this.dialogElement.innerText = 'Bind keys or tap buttons';
        this.bound = false;
      }

      this.scrollPos = this.scrollBox.scrollTop = this.scrollBox.scrollHeight;

      this.name = name;
      this.pattern = pattern;
      this.repetitions = repetitions;
      this.items = items;
      this.limit = limit;
      this.levelIndex = levelIndex;
      this.isChallenge = isChallenge;
      this.startTime = null;
      this.endTime = null;
      this.gameOver = false;
      this.nearEnd = false;
      this.results = [];

      this.winCallback = win;
      this.loseCallback = lose;

      this.tapButtons.forEach(b => {
        b.classList.remove('pressed');
        b.classList.remove('missed');
      });

      // for mobile
      window.scrollTo(0, document.body.scrollHeight);
      this.update();
    }

    update () {
      const currentTime = Date.now() - this.startTime;

      if (!this.gameOver && this.startTime && currentTime > this.limit) {
        this.lose(currentTime);
      }

      const scrollDist = this.scrollBox.scrollTop - this.scrollPos;
      if (scrollDist < 2) {
        this.scrollBox.scrollTop = this.scrollPos;
      } else {
        this.scrollBox.scrollTop -= scrollDist / 2;
      }

      if (!this.startTime) {
        this.timerElement.innerHTML = timeToDisplay(0);
      } else if (!this.gameOver) {
        this.timerElement.innerHTML = timeToDisplay(currentTime);
      } else {
        this.timerElement.innerHTML = timeToDisplay(this.endTime > this.limit ? this.limit : this.endTime);
      }

      if (!this.nearEnd && this.startTime && currentTime / this.limit > 0.8) {
        this.timerElement.classList.add('soft-red');
        this.nearEnd = true;
      }

      if (!this.gameOver) {
        requestAnimationFrame(this.update.bind(this));
      }
    }

    handlePressed (key) {
      if (this.gameOver) return

      const currentTime = Date.now() - this.startTime;

      const item = this.items.shift();
      if (item !== key) {
        this.lose(currentTime);
        return MISS_NOTE
      } else {
        if (!this.startTime) {
          this.startTime = Date.now();
        }

        this.results.push(currentTime);

        const challengeData = {
          name: this.name,
          pattern: this.pattern,
          repetitions: this.repetitions,
          limit: this.limit
        };

        // if no items left _and_ the off chance we are over the limit
        // but we have not hit the update frame to catch us
        if (!this.items.length && currentTime <= this.limit) {
          this.endTime = currentTime;
          this.scrollPos = 0;
          this.gameOver = true;
          let newBest;
          if (this.isChallenge) {
            if (this.levelIndex === -1) {
              this.levelIndex = State$1.instance.addChallenge(challengeData);
            }
            newBest = State$1.instance.winChallenge({ index: this.levelIndex, time: currentTime });
          } else {
            newBest = State$1.instance.winLevel({ index: this.levelIndex, time: currentTime });
          }

          this.winCallback(
            currentTime,
            this.levelIndex,
            newBest
          );
        } else {
          // set the scroll to the next elements top + plus its height (to get it's bottom) and then subtract that by view height
          this.scrollPos = this.hitElements[this.items.length - 1].offsetTop + this.hitElements[this.items.length - 1].clientHeight - this.scrollBox.offsetHeight;
        }

        return HIT_NOTE
      }
    }

    async setBound () {
      State$1.instance.preferredKeys = this.keys;
      this.bound = true;
      this.dialogElement.innerText = 'Ready!';
      await sleep(500);
      this.dialogElement.innerText = '';
    }

    bindKey (key) {
      if (!this.keyMap(key) && validKeys.includes(key)) {
        this.tapButtons[this.keys.length].innerText = key.toUpperCase();
        this.keys.push(key);

        if (this.keys.length === 4) {
          this.setBound();
        }
      }
    }

    keyMap (key) {
      return this.keys !== TAP && this.keys.indexOf(key) + 1
    }

    pressed (index) {
      const pressResult = this.handlePressed(index);
      if (pressResult === HIT_NOTE) {
        // shift one for element
        this.tapButtons[index - 1].classList.add('pressed');
      } else if (pressResult === MISS_NOTE) {
        this.tapButtons[index - 1].classList.add('missed');
        Array.from(this.hitElements[this.items.length].children)[index - 1].classList.add('missed');
      }
    }

    keyPressed (key) {
      if (key === 'Escape') {
        this.lose(0);
      }

      if (!this.bound) {
        this.bindKey(key);
        return
      }

      const keyPressed = this.keyMap(key);
      if (keyPressed && !this.gameOver) {
        this.pressed(keyPressed);
      }
    }

    keyReleased (key) {
      const keyReleased = this.keyMap(key);
      if (keyReleased && !this.gameOver) {
        this.tapButtons[keyReleased - 1].classList.remove('pressed');
      }
    }

    touchPressed (index) {
      if (this.gameOver) return
      // bound by tapping
      if (!this.bound && !this.keys.length) {
        State$1.instance.preferredKeys = TAP;
        this.keys = TAP;
        this.setBound();
        return
      }
      this.pressed(index);
    }

    touchReleased (index) {
      if (this.gameOver) return
      this.tapButtons[index - 1].classList.remove('pressed');
    }

    lose (time) {
      this.gameOver = true;
      this.endTime = time;
      this.loseCallback(
        this.levelIndex,
        {
          name: this.name,
          pattern: this.pattern,
          repetitions: this.repetitions,
          limit: this.limit
        }
      );
    }

    destroy () {
      this.tapButtons.forEach(b => { b.innerText = ''; });
    }
  }

  const menu = gebi('menu');
  const challengeMenu = gebi('challenge-menu');

  const createMenu = (callback, returnCallback) => {
    // reset preferred keys
    State$1.instance.preferredKeys = [];

    const backButton = makeDiv('back-button');
    backButton.onclick = returnCallback;
    // for now, focused item is at 0
    backButton.classList.add('menu-item-focused');
    const backText = document.createElement('h1');
    backText.innerText = 'Back';
    backButton.appendChild(backText);
    menu.appendChild(backButton);

    menu.style.opacity = 1;
    menu.style.visibility = 'visible';
    levels.forEach((level, i) => {
      const complete = i <= State$1.instance.completedLevels.length - 1;
      const playable = i <= State$1.instance.completedLevels.length;

      const div = makeDiv('menu-item');
      if (!playable) {
        div.classList.add('non-playable');
      }

      const leftDiv = makeDiv('menu-item-left');
      const rightDiv = makeDiv('menu-item-right');

      const title = document.createElement('h2');
      const limit = document.createElement('h3');
      const best = document.createElement('h3');
      const completed = document.createElement('h4');

      title.innerText = level.name;
      limit.innerText = `${level.limit / 1000}s`;
      best.innerHTML = complete
        ? `Best: ${timeToDisplay(State$1.instance.completedLevels[i].time)}`
        : '&nbsp';
      completed.innerText = complete ? 'COMPLETED' : '';

      div.appendChild(leftDiv);
      div.appendChild(rightDiv);

      leftDiv.appendChild(title);
      leftDiv.appendChild(best);
      rightDiv.appendChild(limit);
      rightDiv.appendChild(completed);

      menu.appendChild(div);

      div.onclick = () => playable ? callback(i) : () => {};
    });
  };

  const hideMenu = async () => {
    menu.style.opacity = 0;
    await sleep(125);
    menu.style.visibility = 'hidden';
    removeChildElements(menu);
  };

  const createChallengeMenu = (callback, createChallengeCallback, returnCallback) => {
    // reset preferred keys
    State$1.instance.preferredKeys = [];

    const backButton = makeDiv('back-button');
    backButton.onclick = returnCallback;
    backButton.classList.add('menu-item-focused');
    const backText = document.createElement('h1');
    backText.innerText = 'Back';
    backButton.appendChild(backText);
    challengeMenu.appendChild(backButton);

    const createChallengeButton = makeDiv('create-challenge');
    createChallengeButton.onclick = createChallengeCallback;
    const ccText = document.createElement('h2');
    ccText.innerText = 'Create Challenge';
    createChallengeButton.appendChild(ccText);
    challengeMenu.appendChild(createChallengeButton);

    challengeMenu.style.opacity = 1;
    challengeMenu.style.visibility = 'visible';
    State$1.instance.challenges.forEach((challenge, i) => {
      const div = makeDiv('menu-item');
      const leftDiv = makeDiv('menu-item-left');
      const rightDiv = makeDiv('menu-item-right');

      const title = document.createElement('h2');
      const limit = document.createElement('h3');
      const best = document.createElement('h3');
      const completed = document.createElement('h4');

      title.innerText = challenge.name;
      limit.innerText = `${challenge.limit / 1000}s`;
      best.innerHTML = challenge.completed
        ? `Best: ${timeToDisplay(challenge.time)}`
        : '&nbsp';
      completed.innerText = challenge.completed ? 'COMPLETED' : '';

      div.appendChild(leftDiv);
      div.appendChild(rightDiv);

      leftDiv.appendChild(title);
      leftDiv.appendChild(best);
      rightDiv.appendChild(limit);
      rightDiv.appendChild(completed);

      challengeMenu.appendChild(div);

      div.onclick = () => callback(i);
    });
  };

  const hideChallengeMenu = async () => {
    challengeMenu.style.opacity = 0;
    await sleep(125);
    challengeMenu.style.visibility = 'hidden';
    removeChildElements(challengeMenu);
  };

  const startButton = gebi('start');
  const challengesButton = gebi('challenges');
  const startMenu = gebi('intro');
  const modalElement = gebi('popup');
  const menuElement = gebi('menu');
  const mainElement = gebi('main');
  const challengesElement = gebi('challenge-menu');
  const createChallengeElement = gebi('create-challenge');
  const challengeBackButton = gebi('create-challenge-back');
  const challengeForm = gebi('challenge-form');
  const errorTextElement = gebi('challenge-error');

  let game, keyListener;
  let menuItemSelected = null;

  const destroyGame = () => {
    hideElement(mainElement);
    game.destroy();
    game = null;
  };

  const gotoMainMenu = async () => {
    try {
      destroyGame();
    } catch (e) {}
    showElement(startMenu);
    // HACK: hide all sub menus
    await Promise.all([hideElement(menuElement), hideElement(challengesElement)]);
    removeChildElements(menuElement);
    removeChildElements(challengesElement);
    menuItemSelected = null;
  };

  const removeListener = () => {
    document.removeEventListener('keydown', keyListener);
  };

  const keydownListener = (restartCallback, escapeCallback, nextCallback) => (event) => {
    switch (event.key) {
      case 'Enter':
        if (nextCallback) {
          nextCallback();
        } else {
          restartCallback();
        }
        break
      case 'n':
        if (nextCallback) {
          nextCallback();
        }
        break
      case 'r':
        restartCallback();
        break
      case 'q':
      case 'Escape':
        escapeCallback();
        break
    }
  };

  const win = async (time, levelIndex, newBest = false) => {
    await sleep(500);

    const nextCallback = () => {
      startLevel(levelIndex + 1);
      hideElement(modalElement);
      removeListener();
    };

    const restartCallback = () => {
      startLevel(levelIndex);
      hideElement(modalElement);
      removeListener();
    };

    const escapeCallback = () => {
      createMenu(startLevel, gotoMainMenu);
      menuItemSelected = 0;
      hideElement(modalElement);
      removeListener();
    };

    keyListener = keydownListener(restartCallback, escapeCallback, nextCallback);
    document.addEventListener('keydown', keyListener);

    const displayTime = `${newBest ? 'New Best: ' : ''}${timeToDisplay(time)}`;

    showModal('Win!', displayTime, [
      { label: '[N]ext', callback: nextCallback },
      { label: 'Level Select', callback: escapeCallback }
    ]);

    destroyGame();
  };

  const lose = async (levelIndex) => {
    await sleep(500);

    const restartCallback = () => {
      startLevel(levelIndex);
      hideElement(modalElement);
      removeListener();
    };

    const escapeCallback = () => {
      createMenu(startLevel, gotoMainMenu);
      menuItemSelected = 0;
      hideElement(modalElement);
      removeListener();
    };

    keyListener = keydownListener(restartCallback, escapeCallback);
    document.addEventListener('keydown', keyListener);

    showModal('Lose...', undefined, [
      { label: '[R]estart', callback: restartCallback },
      { label: 'Level Select', callback: escapeCallback }
    ]);

    destroyGame();
  };

  const winChallenge = async (time, levelIndex, newBest = false) => {
    const isNewlyCompleted = levelIndex === -1;
    await sleep(500);

    const restartCallback = () => {
      startChallenge(levelIndex);
      hideElement(modalElement);
      removeListener();
    };

    const escapeCallback = () => {
      createChallengeMenu(startChallenge, createChallenge, gotoMainMenu);
      menuItemSelected = 0;
      hideElement(modalElement);
      removeListener();
    };

    keyListener = keydownListener(isNewlyCompleted ? () => {} : restartCallback, escapeCallback);
    document.addEventListener('keydown', keyListener);

    const displayTime = `${newBest ? 'New Best: ' : ''}${timeToDisplay(time)}`;

    showModal(isNewlyCompleted ? 'Challenge created!' : 'Win!', displayTime, [
      { label: 'Challenge Select', callback: escapeCallback }
    ]);

    destroyGame();
  };

  const loseChallenge = async (levelIndex, challengeData) => {

    await sleep(500);

    const restartCallback = () => {
      startChallenge(levelIndex, challengeData);
      hideElement(modalElement);
      removeListener();
    };

    const escapeCallback = () => {
      createChallengeMenu(startChallenge, createChallenge, gotoMainMenu);
      menuItemSelected = 0;
      hideElement(modalElement);
      removeListener();
    };

    keyListener = keydownListener(restartCallback, escapeCallback);
    document.addEventListener('keydown', keyListener);

    showModal('Lose...', undefined, [
      { label: '[R]estart', callback: restartCallback },
      { label: 'Challenge Select', callback: escapeCallback }
    ]);

    destroyGame();
  };

  const startLevel = (index) => {
    // HACK: should not be needed
    if (!game) {
      showElement(mainElement);
      game = new Game(levels[index], index, win, lose);
      startMenu.style.opacity = 0;
      hideMenu();
      menuItemSelected = null;
    } else {
      console.warn(
        'Trying to start a game with an existing instance.\n' +
        'Not all listeners are cleaned up.'
      );
    }
  };

  const startChallenge = (index, challengeData) => {
    if (!game) {
      showElement(mainElement);
      game = new Game(
        index === -1 ? challengeData : State$1.instance.challenges[index],
        index,
        winChallenge,
        loseChallenge,
        true
      );
      startMenu.style.opacity = 0;
      hideChallengeMenu();
      menuItemSelected = null;
    } else {
      console.warn(
        'Trying to start a game with an existing instance.\n' +
        'Not all listeners are cleaned up.'
      );
    }
  };

  const createChallenge = () => {
    hideChallengeMenu();
    showElement(createChallengeElement);
  };

  const createPattern = (pattern) =>
    pattern.split('')
      .map((item) => {
        const value = parseInt(item);
        if (typeof value !== 'number' || isNaN(value) || value < 1 || value > 4) {
          throw new Error('Non 1-4 number in pattern')
        }
        return value
      });

  // HACK: disable double tap to zoom on touch events for tap-buttons only
  const touchEventHandlers = (event) => {
    if (event.target.className.split(' ')[0] === 'tap-button') {
      event.preventDefault();
    }
  };

  const run = () => {
    document.addEventListener('keydown', (event) => {
      const key = event.key;

      if (menuItemSelected !== null && ['Escape', 'ArrowUp', 'ArrowDown', 'Enter'].includes(key)) {
        const menuType = menuElement.style.visibility === 'visible' ? 'main' : 'challenge';
        const numLevels = menuType === 'main'
          ? State$1.instance.completedLevels.length
          : State$1.instance.challenges.length + 1;
        const menuItems = menuType === 'main'
          ? Array.from(menuElement.children)
          : Array.from(challengesElement.children);
        menuItems.forEach(item => { item.classList.remove('menu-item-focused');});

        if (key === 'ArrowUp') {
          menuItemSelected--;
          if (menuItemSelected < 0) {
            // includes back button
            menuItemSelected = numLevels + 1;
          }
        }

        if (key === 'ArrowDown') {
          menuItemSelected++;
          if (menuItemSelected > numLevels + 1) {
            menuItemSelected = 0;
          }
        }

        menuItems[menuItemSelected].classList.add('menu-item-focused');
        menuItems[menuItemSelected].scrollIntoView();

        if (key === 'Enter') {
          menuItems[menuItemSelected].click();
        }

        if (key === 'Escape') {
          menuItems[0].click();
        }
      }

      if (event.repeat) return

      try {
        game.keyPressed(key);
      } catch (e) {}
    });

    document.addEventListener('keyup', (event) => {
      try {
        game.keyReleased(event.key);
      } catch (e) {}
    });

    document.addEventListener('touchstart', (event) => touchEventHandlers(event));
    document.addEventListener('touchend', (event) => touchEventHandlers(event));

    Array.from(document.querySelectorAll('.tap-button')).forEach((button, i) => {
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        try {
          game.touchPressed(i + 1);
        } catch (e) {}
      });

      button.addEventListener('pointerup', (event) => {
        event.preventDefault();
        try {
          game.touchReleased(i + 1);
        } catch (e) {}
      });
    });

    startButton.onclick = () => {
      if (!game) {
        createMenu(startLevel, gotoMainMenu);
        menuItemSelected = 0;
      }

      hideElement(startMenu);
    };

    challengesButton.onclick = () => {
      if (!game) {
        createChallengeMenu(startChallenge, createChallenge, gotoMainMenu);
        menuItemSelected = 0;
      }

      hideElement(startMenu);
    };

    challengeForm.onsubmit = (event) => {
      event.preventDefault();
      try {
        const name = gebi('challenge-name').value;
        const pattern = createPattern(gebi('challenge-pattern').value);
        const repetitions = parseInt(gebi('challenge-repetitions').value);
        const limit = parseInt(gebi('challenge-limit').value);
        const errorTextElement = gebi('challenge-error');
        if (!name || !pattern || !repetitions || isNaN(repetitions) || !limit || isNaN(limit)) {
          throw new Error('Bad Input.')
        }

        startChallenge(-1, { name, pattern, repetitions, limit });
        hideElement(createChallengeElement);
        errorTextElement.innerText = '';
        gebi('challenge-name').value = '';
        gebi('challenge-pattern').value = '';
        gebi('challenge-repetitions').value = '';
        gebi('challenge-limit').value = '';
      } catch (e) {
        errorTextElement.innerText = 'Error, please try again.';
        return
      }
    };

    challengeBackButton.onclick = () => {
      hideElement(createChallengeElement);
      menuItemSelected = 0;
      createChallengeMenu(startChallenge, createChallenge, gotoMainMenu);
    };
  };

  run();

})();

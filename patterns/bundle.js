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

    winChallenge ({ index, time }) {
      if (index === this.completedLevels.length) {
        this.completedLevels.push({ time });
      } else {
        if (time < this.completedLevels[index].time) {
          return NEW_BEST
        }
      }
    }

    serialize () {
      // write to json
      // write to storage
    }

    deserialize () {
      // read from storage
      this.completedLevels = [];
    }
  }

  var State$1 = { instance: new State() };

  const validKeys = 'abcdefghijklmnopqrstuvwxyz0123456789,./-='.split('');

  const modalElement$1 = document.getElementById('popup');
  const modalButtons = document.getElementById('popup-buttons');

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
  const scrollBox = document.getElementById('scroll-box');

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

  const HIT_NOTE = 'hit-note';
  const MISS_NOTE = 'miss-note';

  class Game {
    constructor ({ pattern, repetitions, limit }, levelIndex, win, lose) {
      let items = [];
      for (let i = 0; i < repetitions; i++) {
        items = [...items, ...pattern];
      }

      removeChildElements(document.getElementById('scroll-box'));
      createElements(items);
      this.tapButtons = Array.from(document.querySelectorAll('.tap-button'));
      this.hitElements = Array.from(document.querySelectorAll('.item-row'));
      this.scrollBox = document.getElementById('scroll-box');
      this.timerElement = createTimer();
      this.dialogElement = createDialog();

      if (State$1.instance.preferredKeys.length) {
        // keep keys if stored in state
        this.keys = State$1.instance.preferredKeys;
        this.tapButtons.forEach((b, i) => { b.innerText = this.keys[i].toUpperCase(); });
        this.setBound();
      } else {
        this.keys = [];
        this.dialogElement.innerText = 'Bind keys or tap buttons';
        this.bound = false;
      }

      this.scrollPos = this.scrollBox.scrollTop = this.scrollBox.scrollHeight;

      this.items = items;
      this.limit = limit;
      this.levelIndex = levelIndex;
      this.startTime = null;
      this.endTime = null;
      this.gameOver = false;
      this.results = [];

      this.winCallback = win;
      this.loseCallback = lose;

      this.tapButtons.forEach(b => {
        b.classList.remove('pressed');
        b.classList.remove('missed');
      });

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

        if (!this.items.length) {
          this.endTime = currentTime;
          this.scrollPos = 0;
          this.gameOver = true;
          State$1.instance.winChallenge({ index: this.levelIndex, time: currentTime });
          this.winCallback(currentTime, this.levelIndex);
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
      return this.keys.indexOf(key) + 1
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
      this.loseCallback(this.levelIndex);
    }

    destroy () {
      this.tapButtons.forEach(b => { b.innerText = ''; });
    }
  }

  const menu = document.getElementById('menu');

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
    levels.forEach((challenge, i) => {
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

      title.innerText = challenge.name;
      limit.innerText = `${challenge.limit / 1000}s`;
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

  const startButton = document.getElementById('start');
  const startMenu = document.getElementById('intro');
  const modalElement = document.getElementById('popup');
  const menuElement = document.getElementById('menu');

  let game, keyListener;
  let menuItemSelected = null;

  const gotoMainMenu = async () => {
    try {
      game.destroy();
      game = null;
    } catch (e) {}
    showElement(startMenu);
    await hideElement(menuElement);
    removeChildElements(menuElement);
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
        removeListener();
        break
      case 'n':
        if (nextCallback) {
          nextCallback();
          removeListener();
        }
        break
      case 'r':
        restartCallback();
        removeListener();
        break
      case 'q':
      case 'Escape':
        escapeCallback();
        removeListener();
        break
    }
  };

  const win = async (time, levelIndex) => {
    await sleep(500);

    const nextCallback = () => {
      startLevel(levelIndex + 1);
      hideElement(modalElement);
    };

    const restartCallback = () => {
      startLevel(levelIndex);
      hideElement(modalElement);
    };

    const escapeCallback = () => {
      createMenu(startLevel, gotoMainMenu);
      menuItemSelected = 0;
      hideElement(modalElement);
    };

    keyListener = keydownListener(restartCallback, escapeCallback, nextCallback);
    document.addEventListener('keydown', keyListener);

    showModal('Win!', timeToDisplay(time), [
      { label: '[N]ext', callback: nextCallback },
      { label: 'Level Select', callback: escapeCallback }
    ]);

    game.destroy();
    game = null;
  };

  const lose = async (levelIndex) => {
    await sleep(500);

    const restartCallback = () => {
      startLevel(levelIndex);
      hideElement(modalElement);
    };

    const escapeCallback = () => {
      createMenu(startLevel, gotoMainMenu);
      menuItemSelected = 0;
      hideElement(modalElement);
    };

    keyListener = keydownListener(restartCallback, escapeCallback);
    document.addEventListener('keydown', keyListener);

    showModal('Lose...', undefined, [
      { label: '[R]estart', callback: restartCallback },
      { label: 'Level Select', callback: escapeCallback }
    ]);

    game.destroy();
    game = null;
  };

  const startLevel = (index) => {
    game = new Game(levels[index], index, win, lose);
    startMenu.style.opacity = 0;
    hideMenu();
    menuItemSelected = null;
  };

  const run = () => {
    document.addEventListener('keydown', (event) => {
      const key = event.key;
      if (menuItemSelected !== null && ['ArrowUp', 'ArrowDown', 'Enter'].includes(key)) {
        const numLevels = State$1.instance.completedLevels.length;
        const menuItems = Array.from(menuElement.children);
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

    Array.from(document.querySelectorAll('.tap-button')).forEach((button, i) => {
      button.addEventListener('pointerdown', () => {
        try {
          game.touchPressed(i + 1);
        } catch (e) {}
      });

      button.addEventListener('pointerup', () => {
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
  };

  // TODO: remove run function if we don't need anything async
  run();

})();
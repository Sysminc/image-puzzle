var timerFunction;
var touchStartX, touchStartY, touchEndX, touchEndY;
var lastTouchX, lastTouchY;
var animating = false;

var imagePuzzle = {
  stepCount: 0,
  startTime: new Date().getTime(),
  gameOver: false,
  startGame: function (images, gridSize) {
    this.setImage(images, gridSize);
    helper.doc('playPanel').style.display = 'block';
    helper.shuffle('sortable');
    this.stepCount = 0;
    this.startTime = new Date().getTime();
    this.gameOver = false;
    this.tick();
  },
  tick: function () {
    var now = new Date().getTime();
    var elapsedTime = parseInt((now - this.startTime) / 1000, 10);
    helper.doc('timerPanel').textContent = this.formatTime(elapsedTime);
    timerFunction = setTimeout(this.tick.bind(this), 1000);
  },
  setImage: function (images, gridSize = 4) {
    var percentage = 100 / (gridSize - 1);
    var image = images[Math.floor(Math.random() * images.length)];
    helper.doc('imgTitle').innerHTML = image.title;
    helper.doc('actualImage').setAttribute('src', image.src);
    helper.doc('sortable').innerHTML = '';
    for (var i = 0; i < gridSize * gridSize; i++) {
      var xpos = (percentage * (i % gridSize)) + '%';
      var ypos = (percentage * Math.floor(i / gridSize)) + '%';

      let li = document.createElement('li');
      li.id = i;
      li.setAttribute('data-value', i);
      li.style.backgroundImage = 'url(' + image.src + ')';
      li.style.backgroundSize = (gridSize * 100) + '%';
      li.style.backgroundPosition = xpos + ' ' + ypos;
      li.style.width = 600 / gridSize + 'px'; //
      li.style.height = 600 / gridSize + 'px';

      li.setAttribute('draggable', 'true');
      li.addEventListener('dragstart', function (event) {
        event.dataTransfer.setData('data', event.target.id);
      });
      li.addEventListener('touchstart', function (event) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        lastTouchX = touchStartX;
        lastTouchY = touchStartY;
      });
      li.addEventListener('touchmove', function (event) {
        touchEndX = event.touches[0].clientX;
        touchEndY = event.touches[0].clientY;
        imagePuzzle.handleSwipe(event.target);
        lastTouchX = touchEndX;
        lastTouchY = touchEndY;
      });
      li.addEventListener('dragover', function (event) {
        event.preventDefault();
      });
      li.addEventListener('drop', function (event) {
        if (imagePuzzle.gameOver) return; // Game over, tidak dapat melakukan swap

        let origin = helper.doc(event.dataTransfer.getData('data'));
        let dest = helper.doc(event.target.id);
        let p = dest.parentNode;

        if (origin && dest && p) {
          let temp = dest.nextSibling;
          p.insertBefore(dest, origin);
          p.insertBefore(origin, temp);

          let vals = Array.from(helper.doc('sortable').children).map(x => x.id);
          var now = new Date().getTime();
          imagePuzzle.stepCount++;
          document.querySelector('.stepCount').textContent = imagePuzzle.stepCount;
          document.querySelector('.timeCount').textContent = imagePuzzle.formatTime(parseInt((now - imagePuzzle.startTime) / 1000, 10));

          if (isSorted(vals)) {
            imagePuzzle.gameOver = true;
            clearTimeout(timerFunction);
            helper.doc('actualImageBox').innerHTML = helper.doc('gameOver').innerHTML;
            helper.doc('gameOverStepCount').textContent = imagePuzzle.stepCount;
          }
        }
      });

      helper.doc('sortable').appendChild(li);
    }
    helper.shuffle('sortable');
  },
  formatTime: function (seconds) {
    var minutes = Math.floor(seconds / 60);
    var remainingSeconds = seconds % 60;
    return minutes.toString().padStart(2, '0') + ':' + remainingSeconds.toString().padStart(2, '0');
  },
  handleSwipe: function (target) {
    if (animating || this.gameOver) return;

    var xDiff = touchEndX - lastTouchX;
    var yDiff = touchEndY - lastTouchY;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      if (xDiff > 0) {
        // Swipe ke kanan
        var nextElement = target.nextElementSibling;
        if (nextElement) {
          this.animateSwap(target, nextElement, 'right');
          this.stepCount++;
          document.querySelector('.stepCount').textContent = this.stepCount;
        }
      } else {
        // Swipe ke kiri
        var previousElement = target.previousElementSibling;
        if (previousElement) {
          this.animateSwap(target, previousElement, 'left');
          this.stepCount++;
          document.querySelector('.stepCount').textContent = this.stepCount;
        }
      }
    } else {
      if (yDiff > 0) {
        // Swipe ke atas
        var row = target.parentElement;
        var rowIndex = Array.from(row.children).indexOf(target);
        var aboveRow = row.previousElementSibling;
        if (aboveRow) {
          var aboveElement = aboveRow.children[rowIndex];
          if (aboveElement) {
            this.animateSwap(target, aboveElement, 'up');
            this.stepCount++;
            document.querySelector('.stepCount').textContent = this.stepCount;
          }
        }
      } else {
        // Swipe ke bawah
        var row = target.parentElement;
        var rowIndex = Array.from(row.children).indexOf(target);
        var belowRow = row.nextElementSibling;
        if (belowRow) {
          var belowElement = belowRow.children[rowIndex];
          if (belowElement) {
            this.animateSwap(target, belowElement, 'down');
            this.stepCount++;
            document.querySelector('.stepCount').textContent = this.stepCount;
          }
        }
      }
    }
  },
  animateSwap: function (element1, element2) {
    animating = true;

    var rect1 = element1.getBoundingClientRect();
    var rect2 = element2.getBoundingClientRect();

    var distanceX = rect1.left - rect2.left;
    var distanceY = rect1.top - rect2.top;

    element1.style.transition = 'transform 0.3s ease';
    element1.style.transform = `translate(${-distanceX}px, ${-distanceY}px)`;

    element2.style.transition = 'transform 0.3s ease';
    element2.style.transform = `translate(${distanceX}px, ${distanceY}px)`;

    setTimeout(function () {
      element1.style.transition = '';
      element1.style.transform = '';

      element2.style.transition = '';
      element2.style.transform = '';

      var temp = document.createElement("div");
      element1.parentNode.insertBefore(temp, element1);
      element2.parentNode.insertBefore(element1, element2);
      temp.parentNode.insertBefore(element2, temp);
      temp.parentNode.removeChild(temp);

      animating = false;

      // Periksa apakah puzzle sudah diurutkan (sorted)
      let vals = Array.from(helper.doc('sortable').children).map(x => x.id);
      if (isSorted(vals)) {
        imagePuzzle.gameOver = true;
        clearTimeout(timerFunction);
        helper.doc('actualImageBox').innerHTML = helper.doc('gameOver').innerHTML;
        helper.doc('gameOverStepCount').textContent = imagePuzzle.stepCount;
      }
    }, 300);
  }
};

var isSorted = (arr) => arr.every((elem, index) => elem == index);

//test

var helper = {
  doc: function (id) {
    return document.getElementById(id) || document.createElement("div");
  },

  shuffle: function (id) {
    var ul = document.getElementById(id);
    for (var i = ul.children.length; i >= 0; i--) {
      ul.appendChild(ul.children[Math.random() * i | 0]);
    }
  }
};

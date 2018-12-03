'use strict';

function isValidVector(vector, message) {
  if (!(vector instanceof Vector)) {
    throw new Error(message);
  }
}

function isValidActor(actor, message) {
  if (!(actor && actor instanceof Actor)) {
    throw new Error(message);
  }
}

// Класс Vector позволит контролировать расположение объектов в двумерном пространстве и управлять их размером и перемещением.
class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    isValidVector(vector, 'Можно прибавлять к вектору только вектор типа Vector');
    const x = this.x + vector.x;
    const y = this.y + vector.y;
    return new Vector(x, y);
  }

  times(factor) {
    const x = this.x * factor;
    const y = this.y * factor;
    return new Vector(x, y);
  }
}

class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    const message = 'Передавать в конструктор Actor можно только объект типа Vector';
    isValidVector(pos, message);
    isValidVector(size, message);
    isValidVector(speed, message);
    this.pos = pos;
    this.size = size;
    this.speed = speed;
  }

  get type() {
    return 'actor';
  }

  get left() {
    return this.pos.x;
  }
  get top() {
    return this.pos.y;
  }
  get right() {
    return this.pos.x + this.size.x;
  }
  get bottom() {
    return this.pos.y + this.size.y;
  }

  act() { }

  // Метод проверяет, пересекается ли текущий объект с переданным объектом
  isIntersect(actor) {
    isValidActor(actor, 'неверный тип или отсутвие объекта, объект должен типа Actor');
    if (actor === this) {
      return false;
    } else if (actor.top < this.bottom && actor.bottom > this.top && actor.left < this.right && actor.right > this.left) {
      return true;
    } else {
      return false;
    }
  }
}

// Объекты класса Level реализуют схему игрового поля конкретного уровня, контролируют все движущиеся объекты на нём и реализуют логику игры.
class Level {
  constructor(grid = [], actors = []) {

    this.grid = grid;
    this.actors = actors;
    this.status = null;
    this.finishDelay = 1;
    this.height = grid.length;
  }

  get width() {
    let length = 0;
    for (let el of this.grid) {
      if (el.length > length) {
        length = el.length;
      }
    }
    return length;
  }

   get player() {
    for(let actor of this.actors) {
      if(actor.type === 'player') {
        return actor;
        break;
      }
    }
  }

  isFinished() {
    if (this.stutus !== null && this.finishDelay < 0) {
      return true;
    }
    return false;
  }

  // Метод Определяет, расположен ли какой-то другой движущийся объект в переданной позиции, и если да, вернёт этот объект.
  actorAt(actor) {
    isValidActor(actor, 'неверный тип или отсутвие объекта, объект должен типа Actor');
    for (let el of this.actors) {
      if(el instanceof Actor && el.isIntersect(actor)) {
        return el;
      }
    }
  }

  // Аналогично методу actorAt определяет, нет ли препятствия в указанном месте. Также этот метод контролирует выход объекта за границы игрового поля.
  obstacleAt(pos, size) {
    const message = 'Метод obstacleAt: неверный тип переданного объекта, объект должен типа Vector';
    isValidVector(pos, message);
    isValidVector(size, message);
    let actor = new Actor(pos, size);
    if(actor.left < 0 || actor.top < 0 || actor.right > this.width) {
      return 'wall';
    } else if(actor.bottom > this.height) {
      return 'lava';
    }
    for(let y = Math.floor(actor.top); y < Math.ceil(actor.bottom); y++){
      for(let x = Math.floor(actor.left); x < Math.ceil(actor.right); x++){
        let obstacle = this.grid[y][x];
        if(obstacle) {
          return obstacle;
        }
      }
    }
  }

  removeActor(actor) {
    this.actors.splice(this.actors.indexOf(actor), 1);
  }

  noMoreActors(type) {
    if(this.actors.length === 0) {
      return true;
    }
    for(let actor of this.actors) {
      if(actor.type === type) {
        return false;
      } else {
        return true;
      }
    }
  }
  // Один из ключевых методов, определяющий логику игры. Меняет состояние игрового поля при касании игроком каких-либо объектов или препятствий.
  playerTouched(type, actor) {
    if(this.status !== null) {
      return;
    }

    if(type === 'lava' || type === 'fireball') {
      this.status = 'lost';
    } else if(type === 'coin') {
      this.removeActor(actor);
      if(this.noMoreActors(type)) {
        this.status = 'won';
      }
    }
  }
}

class LevelParser {
  constructor(glossary = {}) {
    this.glossary = glossary;

  }
  actorFromSymbol(symbol) {
    if(symbol && this.glossary[symbol]) {
      return this.glossary[symbol];
    }
  }

  obstacleFromSymbol(symbol) {
    const symbols = { 'x': 'wall',
                      '!': 'lava'
                    };
    return symbols[symbol];
  }

  createGrid(strings) {
    const grid = [];
    for(let y = 0; y < strings.length; y++) {
      const string = strings[y];
      grid[y] = [];
      for(let x = 0; x < string.length; x++) {
        const symbol = string.charAt(x);
          grid[y].push(this.obstacleFromSymbol(symbol));
      }
    }
    return grid;

  }

  createActors(strings) {
    const actors = [];

    let i = 0;
    for(let y = 0; y < strings.length; y++) {
      const string = strings[y];
      for(let x = 0; x < string.length; x++) {
        const symbol = string.charAt(x);
        const actorFn = this.actorFromSymbol(symbol);
        if(typeof(actorFn) === 'function') {
          const actor = new actorFn(new Vector(x, y));
          if(actor instanceof Actor) {
            actors.push(actor);
            i++;
          }
        }
      }
    }
    return actors;
  }

  parse(strings) {
    return new Level(this.createGrid(strings), this.createActors(strings));
  }
}


class Fireball extends Actor {
  constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
    super(pos, new Vector(1, 1), speed)
  }

  get type() {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }

  handleObstacle() {
    this.speed = this.speed.times(-1);
  }

  act(time, level) {
    const newPos = this.getNextPosition(time);
    if (level.obstacleAt(newPos, this.size)) {
      return this.handleObstacle();
    }
    this.pos = newPos;
  }
}


// const grid = [
//   new Array(3),
//   ['wall', 'wall', 'lava']
// ];
// const level = new Level(grid);
// runLevel(level, DOMDisplay);


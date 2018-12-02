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
    Object.defineProperty(this, 'type', {
      value: 'actor'
    });
  }

  act() { }

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
    this.actors.find((el, i, arr) => {
      if (el.type === 'player') {
        return el;
      }
    });
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

  actorAt(actor) {
    isValidActor(actor, 'неверный тип или отсутвие объекта, объект должен типа Actor');
    for (let el of this.actors) {
      if(el instanceof Actor && el.isIntersect(actor)) {
        return el;
      }
    }
  }

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
        return true;
      } else {
        return false;
      }
    }
  }

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

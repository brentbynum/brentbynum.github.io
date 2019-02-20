class Point {
    get x() {
        return this._x;
    }
    set x(value) {
        this._x = value;
    }
    
    get y() {
        return this._y;
    }

    set y(value) {
        this._y = value;
    }

    constructor(x, y) {
        this._x = x;
        this._y = y;
    }
}

class Size {
    get width() {
        return this.w;
    }
    set width(value) {
        this.w = value;
    }
    
    get height() {
        return this.h;
    }

    set height(value) {
        this.h = value;
    }

    constructor(w, h) {
        this.w = w;
        this.h = h;
    }
}

class Roller {

    between(min, max) {
        const range = max - min;
        const val = (Math.random() * range) + min;
        return this.maybeDo(0.5, ()=> -val, () => val);
    }

    // Execute the given function randomly based on the odds
    maybeDo(odds, fn, elseFn) {
        if (Math.random() < odds) {
            return fn();
        } else if (elseFn) {
            return elseFn();
        }
    }

    randomDirection() {
        return new Point(this.between(200, 320), this.between(20, 40));
    }
}

class Paddle {
    // Creates a paddle
    constructor(screenSize, side) {
        this.friction = 0.975;
        this.pos = new Point(0, 0);
        this.velocity = new Point(0, 0);
        this.accel = new Point(0, 0);
        this.side = side;
        this.resize(screenSize);
        this.screenSize = screenSize;

        this.upButton = document.getElementById(side + 'UpButton');
        this.downButton = document.getElementById(side + 'DownButton');

        this.upButton.addEventListener('mousedown', this.accelUp.bind(this));
        this.downButton.addEventListener('mousedown', this.accelDown.bind(this));

        this.upButton.addEventListener('mouseup', this.accelRelease.bind(this));
        this.downButton.addEventListener('mouseup', this.accelRelease.bind(this));

        this.upButton.addEventListener('touchstart', this.accelUp.bind(this));
        this.downButton.addEventListener('touchstart', this.accelDown.bind(this));

        this.upButton.addEventListener('touchend', this.accelRelease.bind(this));
        this.downButton.addEventListener('touchend', this.accelRelease.bind(this));
    }

    update(delta) {
        const factor = delta/1000;
        
        if (this.accel.y) {
            this.velocity.x += this.accel.x * factor;
            this.velocity.y += this.accel.y * factor;
        } else {
            this.velocity.x *= this.friction;
            this.velocity.y *= this.friction;
        }
        this.pos.x += (this.velocity.x * factor);
        this.pos.y += (this.velocity.y * factor);

        if (this.pos.y < 0) {
            this.pos.y = 0;
            this.velocity.y *= -1;
        }

        if (this.pos.y > this.screenSize.height) {
            this.pos.y = this.screenSize.height;
            this.velocity.y *= -1;
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#FFF';
        ctx.fillRect(this.pos.x - 10, this.pos.y - 40, 20, 80);
    }

    resize(screenSize) {
        if (this.side === 'left') {
            this.pos.x = 20;
        } else {
            this.pos.x = screenSize.width - 20;
        }
        this.pos.y = screenSize.height / 2;
        this.screenSize = screenSize;
    }

    reset() {
        this.pos.y = this.screenSize.height / 2;
        this.velocity.y = 0;
    }

    accelUp() {
        this.accel.y -= 180;
    }

    accelRelease() {
        this.accel.y = 0;
    }

    accelDown() {
        this.accel.y += 180;
    }
}

class Ball {
    constructor(screenSize, leftPaddle, rightPaddle) {
        this.roller = new Roller();
        this.screenSize = screenSize;
        this.leftPaddle = leftPaddle;
        this.rightPaddle = rightPaddle;
        this.pos = new Point(screenSize.width / 2, screenSize.height/2);
        this.velocity = this.roller.randomDirection();
    }

    update(delta) {
        const factor = delta/1000;
        this.pos.x += (this.velocity.x * factor);
        this.pos.y += (this.velocity.y * factor);

        // bounce off the top
        if (this.pos.y < 0 && this.velocity.y < 0) {
            this.velocity.y = -(this.velocity.y * 1.5);
        }
        // bounce off the bottom
        if (this.pos.y > this.screenSize.height && this.velocity.y > 0) {
            this.velocity.y = -(this.velocity.y * 1.5);
        }

        // bounce off the left paddle
        if (this.pos.x < this.leftPaddle.pos.x && (this.pos.y > this.leftPaddle.pos.y - 40 && this.pos.y < this.leftPaddle.pos.y + 40)) {
            this.velocity.x = -(this.velocity.x * 1.5);
        }

        // bounce off the right paddle
        if (this.pos.x > this.rightPaddle.pos.x && (this.pos.y > this.rightPaddle.pos.y - 40 && this.pos.y < this.rightPaddle.pos.y + 40)) {
            this.velocity.x = -(this.velocity.x * 1.5);
        }

        // Check for scoring condition on the left side 
        if (this.pos.x < 0) {
            // One point for right
            this.pos = new Point(this.screenSize.width / 2, this.screenSize.height/2);
            this.velocity = this.roller.randomDirection();
            this.leftPaddle.reset();
            this.rightPaddle.reset();
        }

        // Check for scoring condition on the right side 
        if (this.pos.x > this.screenSize.width) {
            // one point for left
            this.pos = new Point(this.screenSize.width / 2, this.screenSize.height/2);
            this.velocity = this.roller.randomDirection();
            this.leftPaddle.reset();
            this.rightPaddle.reset();
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 20, 0, Math.PI * 2, true);
        ctx.fill();
    }

    resize(size) {
        this.screenSize = size;
    }
}

class App {
    constructor(){
        this.lastTick = Date.now();
        this.display = document.getElementById('display');
        this.ctx = this.display.getContext('2d');
        this.size = new Size(0, 0);
        window.addEventListener('resize', () => this.resize());

        this.resize();

        this.leftPaddle = new Paddle(this.size, 'left');
        this.rightPaddle = new Paddle(this.size, 'right');
        this.ball = new Ball(this.size, this.leftPaddle, this.rightPaddle);
        this.loop();
    }

    loop() {
        const delta = Date.now() - this.lastTick;
        this.update(delta);
        this.draw(delta);
        this.lastTick = Date.now();
        window.requestAnimationFrame(this.loop.bind(this));
    }

    update(delta) {
        this.leftPaddle.update(delta);
        this.rightPaddle.update(delta);
        this.ball.update(delta);
    }

    draw() {
        this.ctx.fillStyle = '#000040';
        this.ctx.fillRect(0, 0, this.size.width, this.size.height);

        this.ctx.strokeStyle= '#FFF';
        this.ctx.beginPath();
        this.ctx.moveTo(this.size.width / 2, 0);
        this.ctx.lineTo(this.size.width / 2, this.size.height);
        this.ctx.stroke();

        this.leftPaddle.draw(this.ctx);
        this.rightPaddle.draw(this.ctx);
        this.ball.draw(this.ctx);
    }

    resize() {
        this.size.width = window.innerWidth - 200;
        this.size.height = window.innerHeight;
        this.display.setAttribute('width', this.size.width);
        this.display.setAttribute('height', this.size.height);
        if (this.leftPaddle && this.rightPaddle) {
            this.leftPaddle.resize(this.size);
            this.rightPaddle.resize(this.size);
        }
        if (this.ball) {
            this.ball.resize(this.size);
        }
    }
}

const app = new App();
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 20;
const BRICKS_WIDTH = 60;
const BRICKS_HEIGHT = 30;
const BALL_RADIUS = 8;
const FULL_X_SPEED = 7;
let stage;
let paddle;
let ball;
let bricks = [];
let score = 0;
let lives = 3;
let scoreText;
let gameStarted = false;
const KEYCODE_LEFT = 37;
const KEYCODE_RIGHT = 39;
const SPACEBAR = 32;
let keyboardMoveLeft = false;
let keyboardMoveRight = false;
let highScore = 0;

const play = () => {
    if (typeof (Storage) !== "undefined") {
        if (localStorage.highScore == undefined) {
            localStorage.highScore = 0;
        }
        highScore = localStorage.highScore;
    } else {
        highScore = 0;
    }

    stage = new createjs.Stage("myCanvas");
    createjs.Touch.enable(stage);
    createPaddle();
    createBall();
    createBrickGrid('#FFF');
    createScoreText();
    stage.canvas.height = window.innerHeight;
    createjs.Ticker.setFPS(60);
    createjs.Ticker.addEventListener("tick", tick); //Changed to tick from stage

    stage.on("stagemousedown", function (event) {
        startLevel();
    });

    stage.on("stagemousemove", function (event) {
        paddle.x = stage.mouseX;
    });

    //keyboard handlers
    window.onkeyup = keyUpHandler;
    window.onkeydown = keyDownHandler;
}

const startLevel = () => {
    if (!gameStarted) {
        console.log("Start Game");
        gameStarted = true;
        ball.xSpeed = 5;
        ball.ySpeed = 5;
        ball.up = true;
        ball.right = (Math.Random <= 0.50 ? true : false);
    }
}

const keyDownHandler = (e) => {
    switch (e.keyCode) {
        case KEYCODE_LEFT: keyboardMoveLeft = true; break;
        case KEYCODE_RIGHT: keyboardMoveRight = true; break;
        case SPACEBAR: startLevel(); break;
    }
}

const keyUpHandler = (e) => {
    switch (e.keyCode) {
        case KEYCODE_LEFT: keyboardMoveLeft = false; break;
        case KEYCODE_RIGHT: keyboardMoveRight = false; break;
    }
}

const addToScore = (points) => {
    score += points;
    updateStatusLine();
}

const createScoreText = () => {
    scoreText = new createjs.Text("Score: 0", "16px Arial", "#000000");
    addToScore(0);
    scoreText.y = stage.canvas.height - 16;
    //scoreText.y = 16;
    stage.addChild(scoreText);
}

const updateStatusLine = () => {
    scoreText.text = "Score: " + score + " / Lives: " + lives + " / High Score: " + highScore;
}

const loseLife = () => {
    console.log("Lose A Life");
    lives--;
    ball.xSpeed = 0;
    ball.ySpeed = 0;
    ball.x = paddle.x;
    ball.y = paddle.y - PADDLE_HEIGHT / 2 - BALL_RADIUS;
    gameStarted = false;

    if (lives == 0) {

        if (highScore < score) {
            highScore = score;
            localStorage.highScore = score;
            alert('Well done! New High Score: ' + score + ' points');
        }
        else {
            alert('Well done! You scored: ' + score + ' points, try to beat your high score');
        }

        lives = 3;
        score = 0;
    }
    updateStatusLine();
}

const tick = (event) => {
    if (keyboardMoveLeft) {
        console.log("Keyboard - Left");
        paddle.x -= 5;
    }
    if (keyboardMoveRight) {
        console.log("Keyboard - Right");
        paddle.x += 5;
    }

    if (paddle.x + PADDLE_WIDTH / 2 > stage.canvas.width) {
        paddle.x = stage.canvas.width - PADDLE_WIDTH / 2;
    }
    if (paddle.x - PADDLE_WIDTH / 2 < 0) {
        paddle.x = PADDLE_WIDTH / 2;
    }


    if (!gameStarted) {
        ball.x = paddle.x;
        ball.y = paddle.y - PADDLE_HEIGHT / 2 - BALL_RADIUS;
        stage.update();
        return;
    }

    if (ball.up) {
        ball.y -= ball.ySpeed;
    }
    else {
        ball.y += ball.ySpeed;
    }

    if (ball.right) {
        ball.x += ball.xSpeed;
    }
    else {
        ball.x -= ball.xSpeed;
    }

    for (let i = 0; i < bricks.length; i++) {
        if (checkCollision(ball, bricks[i])) {
            addToScore(100 * lives);
            console.log("Brick Hit / New Score: " + score);
            destroyBrick(bricks[i]);
            bricks.splice(i, 1);
            i--;
            if (bricks.length == 0) {
                var str = '#F00';
                createBrickGrid(str);
                lives += 1;
            }
        }
    }

    if (checkCollision(ball, paddle)) {
        newBallXSpeedAfterCollision(ball, paddle);
    }

    //Check if we've reached the walls
    if (ball.x + BALL_RADIUS >= stage.canvas.width) {
        ball.x = stage.canvas.width - BALL_RADIUS;
        ball.right = false;
    }

    if (ball.x - BALL_RADIUS <= 0) {
        ball.x = BALL_RADIUS;
        ball.right = true;
    }

    if (ball.y - BALL_RADIUS <= 0) {
        ball.y = BALL_RADIUS;
        ball.up = false;
    }

    if (ball.y + BALL_RADIUS >= stage.canvas.height) {
        loseLife();
    }

    ball.lastX = ball.x;
    ball.lastY = ball.y;
    stage.update();
}

const checkCollision = (ballElement, hitElement) => {
    let leftBorder = (hitElement.x - hitElement.getBounds().width / 2);
    let rightBorder = (hitElement.x + hitElement.getBounds().width / 2);
    let topBorder = (hitElement.y - hitElement.getBounds().height / 2);
    let bottomBorder = (hitElement.y + hitElement.getBounds().height / 2);
    let previousBallLeftBorder = ballElement.lastX - BALL_RADIUS;
    let previousBallRightBorder = ballElement.lastX + BALL_RADIUS;
    let previousBallTopBorder = ballElement.lastY - BALL_RADIUS;
    let previousBallBottomBorder = ballElement.lastY + BALL_RADIUS;
    let ballLeftBorder = ballElement.x - BALL_RADIUS;
    let ballRightBorder = ballElement.x + BALL_RADIUS;
    let ballTopBorder = ballElement.y - BALL_RADIUS;
    let ballBottomBorder = ballElement.y + BALL_RADIUS;


    if ((ballLeftBorder <= rightBorder) && (ballRightBorder >= leftBorder) && (ballTopBorder <= bottomBorder) && (ballBottomBorder >= topBorder)) {

        if ((ballTopBorder <= bottomBorder) && (previousBallTopBorder > bottomBorder)) {
            //Hit from the bottom
            ballElement.up = false;
            ballElement.y = bottomBorder + BALL_RADIUS;
        }

        if ((ballBottomBorder >= topBorder) && (previousBallBottomBorder < topBorder)) {
            //Hit from the top
            ballElement.up = true;
            ballElement.y = topBorder - BALL_RADIUS;
        }
        if ((ballLeftBorder <= rightBorder) && (previousBallLeftBorder > rightBorder)) {
            //Hit from the right
            ballElement.right = true;
            ballElement.x = rightBorder + BALL_RADIUS;
        }

        if ((ballRightBorder >= leftBorder) && (previousBallRightBorder < leftBorder)) {
            //Hit from the left
            ballElement.right = false;
            ballElement.x = leftBorder - BALL_RADIUS;
        }

        ballElement.lastX = ballElement.x;
        ballElement.lastY = ballElement.y;
        return true;
    }
    return false;
}

const newBallXSpeedAfterCollision = (ballElement, hitElement) => {
    let startPoint = hitElement.x - hitElement.getBounds().width / 2;
    let midPoint = hitElement.x;
    let endPoint = hitElement.x + hitElement.getBounds().width / 2;

    if (ballElement.x < midPoint) {
        ball.right = false;
        ball.xSpeed = FULL_X_SPEED - ((ballElement.x - startPoint) / (midPoint - startPoint)) * FULL_X_SPEED
    }
    else {
        ball.xSpeed = FULL_X_SPEED - ((endPoint - ballElement.x) / (endPoint - midPoint)) * FULL_X_SPEED
        ball.right = true;
    }
}


const createBrickGrid = (c) => {
    for (let i = 0; i < 10; i++)
        for (let j = 0; j < 4; j++) {
            createBrick(i * (BRICKS_WIDTH + 10) + 40, j * (BRICKS_HEIGHT + 5) + 20, c);
        }
}

const createBrick = (x, y, c) => {
    let brick = new createjs.Shape();
    brick.graphics.beginFill(c).beginStroke("#000077");
    brick.graphics.drawRect(0, 0, BRICKS_WIDTH, BRICKS_HEIGHT);
    brick.graphics.endFill();

    brick.regX = BRICKS_WIDTH / 2;
    brick.regY = BRICKS_HEIGHT / 2;
    brick.x = x;
    brick.y = y;
    brick.setBounds(brick.regX, brick.regY, BRICKS_WIDTH, BRICKS_HEIGHT);
    stage.addChild(brick);
    bricks.push(brick);
}

const destroyBrick = (brick) => {
    createjs.Tween.get(brick, {}).to({ scaleX: 0, scaleY: 0 }, 500)
    setTimeout(removeBrickFromScreen, 500, brick)
}

const removeBrickFromScreen = (brick) => {
    stage.removeChild(brick)
}

const createBall = () => {
    ball = new createjs.Shape();
    ball.graphics.beginFill("Red").drawCircle(0, 0, BALL_RADIUS);
    ball.x = paddle.x;
    ball.y = paddle.y - PADDLE_HEIGHT / 2 - BALL_RADIUS;
    stage.addChild(ball);
    ball.up = true;
    ball.right = true;
    ball.xSpeed = 0;
    ball.ySpeed = 0;
    ball.lastX = 0;
    ball.lastY = 0;
}

const createPaddle = () => {
    paddle = new createjs.Shape();
    paddle.width = PADDLE_WIDTH;
    paddle.height = PADDLE_HEIGHT;
    paddle.graphics.beginFill('#AAAAFF').beginStroke("#0000CC").drawRect(0, 0, paddle.width, paddle.height);
    paddle.x = stage.canvas.width / 2 - PADDLE_WIDTH / 2;
    paddle.y = stage.canvas.height * 0.9;
    paddle.regX = PADDLE_WIDTH / 2;
    paddle.regY = PADDLE_HEIGHT / 2;
    paddle.setBounds(paddle.regX, paddle.regY, PADDLE_WIDTH, PADDLE_HEIGHT);
    stage.addChild(paddle);
}


const displayName=()=> {
    $('#welcomemsg').hide();
    $('#displayName').show('slow');
    let username = $("#username").val();
    $('#welcometext').text(`Welcome ${username} and good luck!`);
    $('#welcomemsg').hide();
}
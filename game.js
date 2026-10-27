// game.js — bucle de juego de Arkanoid

const canvas = document.getElementById( 'game' );
const ctx = canvas.getContext( '2d' );

const HIGH_SCORE_KEY = 'arkanoid:highscore:v1';

const BLOCK_POINTS = { gray: 10, red: 20, yellow: 30, cyan: 40, magenta: 50, hotpink: 60, green: 70 };
const BLOCK_ROWS = [ 'gray', 'red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green' ];
const BLOCK_WIDTH = 48;
const BLOCK_HEIGHT = 20;
const BLOCK_COLS = 10;
const BLOCK_TOP = 40;

const state = {
  screen: 'playing', // 'start' | 'playing' | 'paused' | 'gameover' | 'win'
  score: 0,
  lives: 3,
  highScore: Number( localStorage.getItem( HIGH_SCORE_KEY ) ) || 0,
  paddle: { x: 200, y: 600, width: 80, height: 16, speed: 6 },
  ball: { x: 240, y: 300, radius: 8, dx: 3, dy: -3 },
  blocks: createBlocks(),
};

function createBlocks() {
  const blocks = [];
  BLOCK_ROWS.forEach( ( color, row ) => {
    for ( let col = 0; col < BLOCK_COLS; col++ ) {
      blocks.push( {
        x: col * BLOCK_WIDTH,
        y: BLOCK_TOP + row * BLOCK_HEIGHT,
        width: BLOCK_WIDTH,
        height: BLOCK_HEIGHT,
        color,
        alive: true,
      } );
    }
  } );
  return blocks;
}

const keys = { left: false, right: false };

window.addEventListener( 'keydown', ( e ) => {
  if ( e.key === 'ArrowLeft' ) keys.left = true;
  if ( e.key === 'ArrowRight' ) keys.right = true;
} );

window.addEventListener( 'keyup', ( e ) => {
  if ( e.key === 'ArrowLeft' ) keys.left = false;
  if ( e.key === 'ArrowRight' ) keys.right = false;
} );

window.addEventListener( 'keydown', ( e ) => {
  if ( ( state.screen === 'gameover' || state.screen === 'win' ) && e.key.toLowerCase() === 'r' ) {
    restartGame();
  }

  if ( e.key === 'Escape' || e.key.toLowerCase() === 'p' ) {
    togglePause();
  }
} );

function togglePause() {
  if ( state.screen === 'playing' ) {
    state.screen = 'paused';
  } else if ( state.screen === 'paused' ) {
    state.screen = 'playing';
  }
}

function restartGame() {
  state.score = 0;
  state.lives = 3;
  state.blocks = createBlocks();
  resetBallAndPaddle();
  state.screen = 'playing';
}

function update() {
  if ( state.screen !== 'playing' ) return;

  const paddle = state.paddle;
  if ( keys.left ) paddle.x -= paddle.speed;
  if ( keys.right ) paddle.x += paddle.speed;
  paddle.x = Math.max( 0, Math.min( canvas.width - paddle.width, paddle.x ) );

  updateBall();
}

function updateBall() {
  const ball = state.ball;
  ball.x += ball.dx;
  ball.y += ball.dy;

  if ( ball.x - ball.radius < 0 ) {
    ball.x = ball.radius;
    ball.dx = -ball.dx;
  } else if ( ball.x + ball.radius > canvas.width ) {
    ball.x = canvas.width - ball.radius;
    ball.dx = -ball.dx;
  }

  if ( ball.y - ball.radius < 0 ) {
    ball.y = ball.radius;
    ball.dy = -ball.dy;
  }

  bounceOffPaddle();
  bounceOffBlocks();

  if ( ball.y - ball.radius > canvas.height ) {
    loseLife();
  }
}

function loseLife() {
  state.lives -= 1;
  if ( state.lives > 0 ) {
    resetBallAndPaddle();
  } else {
    state.screen = 'gameover';
    saveHighScore();
  }
}

function saveHighScore() {
  if ( state.score > state.highScore ) {
    state.highScore = state.score;
    localStorage.setItem( HIGH_SCORE_KEY, String( state.highScore ) );
  }
}

function resetBallAndPaddle() {
  state.paddle.x = 200;
  state.ball.x = 240;
  state.ball.y = 300;
  state.ball.dx = 3;
  state.ball.dy = -3;
}

function bounceOffBlocks() {
  const ball = state.ball;

  for ( const block of state.blocks ) {
    if ( !block.alive ) continue;

    const hits = ball.x + ball.radius >= block.x &&
      ball.x - ball.radius <= block.x + block.width &&
      ball.y + ball.radius >= block.y &&
      ball.y - ball.radius <= block.y + block.height;

    if ( !hits ) continue;

    block.alive = false;
    state.score += BLOCK_POINTS[ block.color ];

    if ( state.blocks.every( ( b ) => !b.alive ) ) {
      state.screen = 'win';
      saveHighScore();
    }

    const overlapLeft = ( ball.x + ball.radius ) - block.x;
    const overlapRight = ( block.x + block.width ) - ( ball.x - ball.radius );
    const overlapTop = ( ball.y + ball.radius ) - block.y;
    const overlapBottom = ( block.y + block.height ) - ( ball.y - ball.radius );
    const minOverlapX = Math.min( overlapLeft, overlapRight );
    const minOverlapY = Math.min( overlapTop, overlapBottom );

    if ( minOverlapX < minOverlapY ) {
      ball.dx = -ball.dx;
    } else {
      ball.dy = -ball.dy;
    }

    break;
  }
}

function bounceOffPaddle() {
  const ball = state.ball;
  const paddle = state.paddle;

  const hitsPaddle = ball.dy > 0 &&
    ball.y + ball.radius >= paddle.y &&
    ball.y + ball.radius <= paddle.y + paddle.height &&
    ball.x + ball.radius >= paddle.x &&
    ball.x - ball.radius <= paddle.x + paddle.width;

  if ( !hitsPaddle ) return;

  ball.y = paddle.y - ball.radius;
  ball.dy = -ball.dy;

  const hitPoint = ( ball.x - ( paddle.x + paddle.width / 2 ) ) / ( paddle.width / 2 );
  const speed = Math.hypot( ball.dx, ball.dy );
  const maxAngle = Math.PI / 3;
  const angle = hitPoint * maxAngle;
  ball.dx = speed * Math.sin( angle );
  ball.dy = -speed * Math.cos( angle );
}

function draw() {
  ctx.clearRect( 0, 0, canvas.width, canvas.height );

  drawSprite( ctx, 'paddle', state.paddle.x, state.paddle.y, state.paddle.width, state.paddle.height );
  drawSprite( ctx, 'ball', state.ball.x - state.ball.radius, state.ball.y - state.ball.radius, state.ball.radius * 2, state.ball.radius * 2 );

  state.blocks.forEach( ( block ) => {
    if ( !block.alive ) return;
    drawSprite( ctx, `block_${ block.color }`, block.x, block.y, block.width, block.height );
  } );

  ctx.fillStyle = 'white';
  ctx.font = '16px sans-serif';
  ctx.fillText( `Score: ${ state.score }`, 10, 20 );
  ctx.fillText( `High: ${ state.highScore }`, canvas.width / 2 - 30, 20 );
  drawLives();

  if ( state.screen === 'gameover' ) {
    drawOverlay( 'GAME OVER', 'Pulsa R para reiniciar' );
  } else if ( state.screen === 'win' ) {
    drawOverlay( '¡VICTORIA!', 'Pulsa R para reiniciar' );
  } else if ( state.screen === 'paused' ) {
    drawOverlay( 'Pausado', 'Pulsa Esc o P para continuar' );
  }
}

function drawLives() {
  const size = 16;
  const gap = 6;
  const startX = canvas.width - 10 - state.lives * ( size + gap ) + gap;
  for ( let i = 0; i < state.lives; i++ ) {
    drawSprite( ctx, 'ball', startX + i * ( size + gap ), 6, size, size );
  }
}

function drawOverlay( title, subtitle ) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );

  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.font = '32px sans-serif';
  ctx.fillText( title, canvas.width / 2, canvas.height / 2 - 10 );
  ctx.font = '16px sans-serif';
  ctx.fillText( subtitle, canvas.width / 2, canvas.height / 2 + 20 );
  ctx.textAlign = 'left';
}

function loop() {
  update();
  draw();
  requestAnimationFrame( loop );
}

loadSpritesheet( loop );

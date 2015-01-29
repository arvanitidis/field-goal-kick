var game = new Phaser.Game(320, 480, Phaser.CANVAS, 'football-test', { preload: preload, create: create, update: update, render: render });

function preload() {

    game.load.image('background','assets/background.jpg');
    game.load.spritesheet('football_animation','assets/football_sprite.png', 58, 85, 7);
    game.load.image('shadow', 'assets/football_shadow.png');
    game.load.image('arrow', 'assets/longarrow2.png');
    game.load.image('analog','assets/fusia.png');
    game.load.image('grass','assets/grass.png');
    game.load.image('uprights','assets/uprights.png');
    game.load.image('endScreen', 'assets/end_screen.png');
    
}

// SET UP GLOBAL VARIABLES
var shadow;
var kicksMade = 0;
var keepScore;
var football;
var grass;
var grass2;
var uprights;
var rightUprights;
var leftUprights;
var cursors;
var arrow;
var ender;
var catchFlag = false;
var launched = false;
var kickFail = false;
var scoreBoolean = false;
var keepGoing = false;
var startTime = false;
var launchVelocity = 0;
var tween;
var directions;
var scored;
var failed;
var style = {font: "15px Arial", fill: "#FFFFFF", align: "center" };
var myCountdownSeconds = 30;
var timer;

function create() {
    
    game.physics.startSystem(Phaser.Physics.ARCADE);
    
    game.world.setBounds(0, 0, 320, 1000);
    game.add.tileSprite(0, 0, 320, 1000, 'background');
    
    game.camera.y = 0;
    
    analog = game.add.sprite(200, 450, 'analog');
    arrow = game.add.sprite(200, 450, 'arrow');
    shadow = game.add.sprite(132, 845, 'shadow');
    uprights = game.add.sprite(90, 180, 'uprights');
    leftUprights = game.add.sprite(90, 180, 'uprights');
    rightUprights = game.add.sprite(90, 180, 'uprights');
    grass = game.add.sprite(0, 390, 'grass');
    grass2 = game.add.sprite(0, 530, 'grass');
    ender = game.add.sprite(0, 0, 'endScreen');
    football = game.add.sprite(160, 820, 'football_animation');
    
    football.animations.add('topple');
        
    // Adding some grass for fun, and to help out with collision detection and stopping the ball
    game.physics.enable([football, leftUprights, rightUprights, grass, grass2], Phaser.Physics.ARCADE);
    grass.body.immovable = true;
    grass.body.setSize(3000, 10, -1000, 10);
    grass2.body.immovable = true;
    grass2.body.setSize(320, 10, 0, 10);
    grass2.alpha = 0;
    
    // Let's use two different instances of the uprights to have two separate hit boxes on the left and right
    leftUprights.alpha = 0;
    leftUprights.body.setSize(1, 155, 0, 0);
    rightUprights.alpha = 0;
    rightUprights.body.setSize(1, 155, 131, 0);
    
    football.anchor.set(0.5);
    football.body.collideWorldBounds = false;
    football.body.bounce.set(0.5);
    football.checkWorldBounds = true;
    football.body.allowRotation = true;
    
    // Enable input.
    football.inputEnabled = true;
    football.input.start(0, true);
    football.events.onInputDown.add(set);
    football.events.onInputUp.add(launch);
    football.body.allowRotation = true;
    
    //Camera will follow the football wherever it shall go
    //game.camera.follow(football, Phaser.Camera.FOLLOW_TOPDOWN);
    
    //Initiate the static text boxes
    directions = game.add.text(game.world.centerX, 930, "Drag the football and\naim for the field goal", style);
    directions.anchor.setTo(0.5, 0.5);
    
    scored = game.add.text(game.world.centerX, 250, "THE KICK \nIS GOOD!", style);
    scored.anchor.setTo(0.5, 0.5);
        
    failed = game.add.text(game.world.centerX, 250, "YOU MISSED!", style);
    failed.anchor.setTo(0.5, 0.5);
    
    // Fire off the next function to start the game
    init();
}

// This function is to be reused and reset all the items to their original spots for the next kick
function init() {
    // Static ext boxes will stay invisible until kick is off, except for the directions
    scored.visible = false;
    failed.visible = false;
    directions.visible = true;
    ender.anchor.setTo(0.5, 0.65);
    
    ender.inputEnabled = true;
    ender.visible = false;
    
    //Need some booleans set for the reset not to kick in
    scoreBoolean = false;
    keepGoing = false;
    kickFail = false;
    
    // Football needs to be brought to top in case we are reset, as it gets dropped below uprights in display list. Also need to stop and reset spritesheet
    football.bringToTop();
    football.inputEnabled = true;
    football.animations.stop('topple', true);
    
    //The purple of the football dragger
    analog.width = 8;
    analog.rotation = 220;
    analog.alpha = 0;
    analog.anchor.setTo(0.5, 0.0);
    
    //The arrow showing direction of kick
    arrow.anchor.setTo(0.1, 0.5);
    arrow.alpha = 0;
    
    //Shrink the football hitbox while moving it way off screen to avoid uprights initially and give it zero gravity to keep still
    football.body.drag.set(20, 20);
    football.body.setSize(10, 10, 0, -1200)
    football.body.gravity.set(0, 0);
    
    // The football's shadow
    shadow.x = 132
    shadow.y = 845;
    shadow.alpha = 1;
    
    // Setting up those uprights
    leftUprights.x = 90;
    leftUprights.y = 180;
    rightUprights.x = 90;
    rightUprights.y = 180;
    
    // Setting launch velocity to zero in case we are in reset state
    launchVelocity = 0;
    
    // Enable input.
    football.inputEnabled = true;
    football.x = 160;
    football.y = 820;
    football.rotation = 0;
    football.width = 56;
    football.height = 90;
    football.body.setSize(10, 10, 0, -1200)
    football.body.velocity.setTo(0,0);
}

function set(football,pointer) {
    // Boolean checking if we are holding the football or not, pre-launch
    catchFlag = true;
    game.camera.follow(null); // Lets not follow the football around while we kick
    
    // Ok, we know what we are doing now, so hide the directions
    directions.visible = false;
    
    // Allow the football to move around, but do not give it any speed yet and have the arrow + purple follow the football
    football.body.moves = true;
    football.body.velocity.setTo(0, 0);
    arrow.reset(football.x, football.y);
    analog.reset(football.x, football.y);
}

function launch() {
    // Set boolean false to show no longer holding the ball, do not allow football to be dragged and have the camera follow the football now
    catchFlag = false;
    football.inputEnabled = false;
    game.camera.follow(football, Phaser.Camera.FOLLOW_TOPDOWN);
    
    // Play the spritesheet to animate the ball moving with momentum
    football.animations.play('topple', 5, true);
    
    // Hide the arrow and purple strength meter
    arrow.alpha = 0;
    analog.alpha = 0;
    
    // Use some math to determine the speed
    Xvector = (arrow.x - football.x) * 3;
    Yvector = (arrow.y - football.y) * 3;
    
    // Launch the football with the velocities from above
    football.body.velocity.setTo(Xvector, Yvector);
    game.add.tween(shadow).to({alpha: 0}, 0, null, true)
    
    // Boolean to make sure the ball doesn't start dropping from gravity before kick
    launched = true;
    
    // Checking the launch velocity to see if it will actually make it or not
    if (launchVelocity < 120) {
       football.body.velocity.setTo(Xvector, Yvector);
       football.body.gravity.set(0, 100);
       kickFail = true;
       tween = game.add.tween(football.scale).to({x: football.y/2000, y: football.y/2000}, 0, Phaser.Easing.Linear.None, true, 0);
    } else {
        tween = game.add.tween(football.scale).to({x: football.y/3500, y: football.y/3500}, 0, Phaser.Easing.Linear.None, true, 0);
    }
    
    // Check the time variable to see if it's at the beginning or not, if so.. let's start
    if (myCountdownSeconds == 30) {
        countDownTimer();
    }
      
}

function update() {
    // Pan the camera down to show the ball as long as we are at the start of the game;
    if (myCountdownSeconds == 30){
        game.camera.y += 4;
        
        // Once we reach the bottom, lets follow the football
        if (game.camera.y == 1000) {
            game.camera.follow(football, Phaser.Camera.FOLLOW_TOPDOWN);
        }
    }
    
    // Arrow rotation follows the football, thank you physics
    arrow.rotation = game.physics.arcade.angleBetween(arrow, football);
    
    // Set up the collisions between the football and other objects it will interact with
    game.physics.arcade.collide(football, grass); // Grass just below the field goal to stop the football from falling
    game.physics.arcade.collide(football, grass2); // Grass that follows the football to stop it if the kick is too weak
    game.physics.arcade.collide(football, leftUprights);
    game.physics.arcade.collide(football, rightUprights);
    
    // Add a listener to check if the football ever flies off screen
    football.events.onOutOfBounds.add(reallyFailed);
    
    // The meat and the potatoes going on here, first we check to see if the football made it far enough
    if (football.y <= 250) {
        // Kill off the gravity boolean check, crank up the gravity to pull the ball down, scale it for a fake perception, and bring the hitbox back to the bottom of the ball
        launched = false;
        football.body.gravity.set(0, 1000);
        //game.add.tween(football.scale).to({x: .2, y: .2}, 0, Phaser.Easing.Linear.None, true, 0);
        football.body.setSize(10, 70, 0, 0)
        
        // Ok, so it made it far enough the y axis, let's check to see if it is between the uprights or not
        if (football.x > 100 && football.x < 218 && football.body.velocity.y > 300 && scoreBoolean == false && myCountdownSeconds > 0) {
            // They scored, bring up the textbox, make uprights appear in front so ball drops behind them as well as the grass and update score
            scoreBoolean = true;
            scored.visible = true;
            uprights.bringToTop();
            grass.bringToTop();
            updateScore();
        } else if ((football.x < 100 || football.x > 217) && football.body.velocity.y > 300 ){
            // Checks to see if the ball is still on screen, but missed the field goal target zone, so let's tell them that they failed miserably
            failed.visible = true;
        }
        
    }
    
    // Checking to see if the ball was kicked well enough, otherwise it's going to plop down
    if (football.y <= 1000 && kickFail == true) {
        football.body.setSize(50, 10, 0, 8)
        grass2.y = football.y;
        football.body.gravity.set(0, 100);
        kickFail = false;
        failed.y = football.y;
        failed.visible = true;
    }
    
    // This occurs while the football is being dragged for kickoff
    if (catchFlag == true)
    {
        //  Track the ball sprite to the mouse  
        football.x = game.input.activePointer.worldX; 
        football.y = game.input.activePointer.worldY;
        
        // Shadow will follow the ball as well
        shadow.x = football.x - 30;
        shadow.y = football.y + 25;
        
        // Bring in the arrow and purple power meter, then set the launch velocity according to height of purple power sprite
        arrow.alpha = 1;    
        analog.alpha = 0.5;
        analog.rotation = arrow.rotation - 3.14 / 2;
        analog.height = game.physics.arcade.distanceBetween(arrow, football);    
        launchVelocity = analog.height;
    }
     
    // Lets check to see if the ball has been kicked off and add some cheap/fake perspective
    if (launched == true) {
        // Scale the ball and rotate it for perspective as it goes further away, shadow follows ball but slowly fades out
        //tween = game.add.tween(football.scale).to({x: football.y/1800, y: football.y/1800}, 0, Phaser.Easing.Linear.None, true, 0);
        shadow.x = football.x - 30;
        shadow.y = football.y + 100;
    }
    
    // Condition to test if the end of time has ocurred, or if ball has stopped and can be reset
    if (failed.visible == true || scored.visible == true) {
       // We need this keepGoing boolean or else a bug occurs and messes with the arrow next round for the first few seconds.
        if (keepGoing == false && myCountdownSeconds != 0) {
           setTimeout(init, 2000);
           keepGoing = true;
       }
    }
}

//Function checking if ball went out of bounds
function reallyFailed() {
    if (failed.visible != true) {
        failed.y = football.y + 50;
        failed.visible = true;
    }
}

// Function that updates the scoreboard
function updateScore() {
    kicksMade++;   
}

// Function to initialize the timer
function countDownTimer() {        
    //  Create the Timer
    timer = game.time.create(false);

    //  Set a TimerEvent to occur after 1 second
    timer.loop(1000, updateCounter, this);

    //  Start the timer 
    timer.start();
}

// Function updating the timer and checking if we have reached the end or not
function updateCounter() {
    // Condition checking to make sure time is not up
    if ((myCountdownSeconds <= 30 && myCountdownSeconds > 0)){
        myCountdownSeconds--   
    } else {
        // THIS IS THE END OF THE GAME, TIME IS UP, FOOTBALL CANNOT BE DRAGGED SO BRING IN THE END SCREEN HERE
        game.camera.unfollow();
        myCountdownSeconds = 0;
        football.inputEnabled = false;
        ender.x = game.world.centerX - 2;
        ender.y = game.camera.view.centerY + 60;
        ender.visible = true;
        ender.bringToTop();
        ender.events.onInputDown.add(clickThru, this);
    }
}

function clickThru() {
    window.open("http://ford.com", "_blank");   
}

function render() {
    //game.debug.text("Drag the sprite and release to launch", 32, 32, 'rgb(0,255,0)');
    //game.debug.cameraInfo(game.camera, 32, 64);
    //game.debug.spriteCoords(football, 0, 32);
    //game.debug.text(football.body.velocity, 0, 32, 'rgb(0,255,0)');
    //game.debug.text("Launch Velocity: " + parseInt(launchVelocity), 0, 100, 'rgb(0,255,0)');
    //game.debug.body(grass);
    //game.debug.body(football);
    //game.debug.body(leftUprights);
    //game.debug.body(rightUprights);
    
    game.debug.text('TIME: ' + Math.round(myCountdownSeconds), 230, 465, 'rgb(255,255,255)');
    game.debug.text('FIELD GOALS MADE: ' + kicksMade, 8, 465, 'rgb(255,255,255)');
}
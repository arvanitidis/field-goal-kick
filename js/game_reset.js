var game = new Phaser.Game(320, 480, Phaser.CANVAS, 'football-test', { preload: preload, create: create, update: update, render: render });

function preload() {

    game.load.image('background','assets/background.jpg');
    game.load.image('football','assets/football.png');
    game.load.image('shadow', 'assets/football_shadow.png');
    game.load.image('arrow', 'assets/longarrow2.png');
    game.load.image('analog','assets/fusia.png');
    game.load.image('grass','assets/grass.png');
    game.load.image('uprights','assets/uprights.png');
    
}

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
var catchFlag = false;
var launched = false;
var kickFail = false;
var scoreBoolean = false;
var launchVelocity = 0;
var tween;
var directions;
var scored;
var failed;
var style = {font: "15px Arial", fill: "#FFFFFF", align: "center" };

function create() {
    
    game.physics.startSystem(Phaser.Physics.ARCADE);
    
    game.world.setBounds(0, 0, 320, 1000);
    game.add.tileSprite(0, 0, 320, 1000, 'background');
    
    analog = game.add.sprite(200, 450, 'analog');
    arrow = game.add.sprite(200, 450, 'arrow');
    shadow = game.add.sprite(132, 845, 'shadow');
    uprights = game.add.sprite(90, 180, 'uprights');
    leftUprights = game.add.sprite(90, 180, 'uprights');
    rightUprights = game.add.sprite(90, 180, 'uprights');
    grass = game.add.sprite(0, 390, 'grass');
    grass2 = game.add.sprite(0, 530, 'grass');
    football = game.add.sprite(160, 820, 'football');
    
    game.physics.enable([football, leftUprights, rightUprights, grass, grass2], Phaser.Physics.ARCADE);
    grass.body.immovable = true;
    grass.body.setSize(3000, 10, -1000, 10);
    grass2.body.immovable = true;
    grass2.body.setSize(320, 10, 0, 10);
    grass2.alpha = 0;
    
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
    
    game.camera.follow(football, Phaser.Camera.FOLLOW_TOPDOWN);
    
    directions = game.add.text(game.world.centerX, 900, "Drag the football and\naim for the field goal", style);
    directions.anchor.setTo(0.5, 0.5);
    
    scored = game.add.text(game.world.centerX, 250, "THE KICK \nIS GOOD!", style);
    scored.anchor.setTo(0.5, 0.5);
        
    failed = game.add.text(game.world.centerX, 250, "YOU MISSED!", style);
    failed.anchor.setTo(0.5, 0.5);
    
    init();
}

function init() {
    scored.visible = false;
    failed.visible = false;
    directions.visible = true;
    
    scoreBoolean = false;
    
    football.bringToTop();
    football.inputEnabled = true;
    
    analog.width = 8;
    analog.rotation = 220;
    analog.alpha = 0;
    analog.anchor.setTo(0.5, 0.0);
    
    arrow.anchor.setTo(0.1, 0.5);
    arrow.alpha = 0;
    
    football.body.drag.set(20, 20);
    football.body.setSize(10, 10, 0, -1200)
    football.body.gravity.set(0, 0);
            
    shadow.x = 132
    shadow.y = 845;
    
    leftUprights.x = 90;
    leftUprights.y = 180;
    rightUprights.x = 90;
    rightUprights.y = 180;
    
    analog.rotation = 220;
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

    catchFlag = true;
    game.camera.follow(null);
    
    directions.visible = false;
    
    football.body.moves = true;
    football.body.velocity.setTo(0, 0);
    arrow.reset(football.x, football.y);
    analog.reset(football.x, football.y);

}

function launch() {
    
    catchFlag = false;
    football.inputEnabled = false;
    game.camera.follow(football, Phaser.Camera.FOLLOW_TOPDOWN);
    
    arrow.alpha = 0;
    analog.alpha = 0;

    Xvector = (arrow.x - football.x) * 3;
    Yvector = (arrow.y - football.y) * 3;

    football.body.velocity.setTo(Xvector, Yvector);
    
    launched = true;
    
    if (launchVelocity < 120) {
       //game.add.tween(football).to({y: 530}, 0, Phaser.Easing.Linear.Out, true, 0);
       football.body.velocity.setTo(Xvector, Yvector);
       football.body.gravity.set(0, 100);
       football.bringToTop();
       kickFail = true;
    }
        
}

function update() {

    arrow.rotation = game.physics.arcade.angleBetween(arrow, football);
    game.physics.arcade.collide(football, grass);
    game.physics.arcade.collide(football, grass2);
    game.physics.arcade.collide(football, leftUprights);
    game.physics.arcade.collide(football, rightUprights);
    
    // Add a listener to check if the football ever flies off screen
    football.events.onOutOfBounds.add(reallyFailed);
            
    if (football.y <= 250) {
        launched = false;
        football.body.gravity.set(0, 1000);
        game.add.tween(football.scale).to({x: .2, y: .2}, 0, Phaser.Easing.Linear.None, true, 0);
        football.body.setSize(10, 70, 0, 0)
        
        if (football.x > 100 && football.x < 218 && football.body.velocity.y > 300 && scoreBoolean == false) {
            scoreBoolean = true;
            scored.visible = true;
            uprights.bringToTop();
            grass.bringToTop();
            updateScore();
        } else if ((game.world.x < 100 || game.world.x > 217) && football.body.velocity.y > 300 && scoreBoolean == false){
            failed.visible = true; 
        }
        
    }
        
    if (football.withinGame == false)
    {
       failed.visible = true; 
    }
    
    if (football.y <= 1000 && kickFail == true) {
        football.body.setSize(50, 10, 0, 8)
        grass2.y = football.y;
        football.body.gravity.set(0, 100);
        kickFail = false;
    }
        
    if (catchFlag == true)
    {
        //  Track the ball sprite to the mouse  
        football.x = game.input.activePointer.worldX; 
        football.y = game.input.activePointer.worldY;
        
        shadow.x = football.x - 30;
        shadow.y = football.y + 25;
        
        arrow.alpha = 1;    
        analog.alpha = 0.5;
        analog.rotation = arrow.rotation - 3.14 / 2;
        analog.height = game.physics.arcade.distanceBetween(arrow, football);    
        launchVelocity = analog.height;
    }
            
    if (launched == true) {
        tween = game.add.tween(football.scale).to({x: football.y/1500, y: football.y/1500}, 0, Phaser.Easing.Linear.None, true, 0);
        shadow.x = football.x - 30;
        shadow.y = football.y + 100;
        game.add.tween(shadow).to({alpha: 0}, 300, null, true)
        game.add.tween(football).to({rotation: 3}, 0, Phaser.Easing.Sinusoidal.Out, true, 0);
    }
    
    if (failed.visible == true || scored.visible == true) {
       setTimeout(init, 3000); 
    }
    
    function reallyFailed() {
        if (failed.visible != true) {
            failed.y = football.y
            failed.visible = true; 
        }
    }
}

function updateScore() {
    kicksMade++;   
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
    
    game.debug.text('FIELD GOALS MADE: ' + kicksMade, 8, 465, 'rgb(255,255,255)');
}
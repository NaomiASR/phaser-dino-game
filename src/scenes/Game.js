import { Scene } from 'phaser';

const WIDTH = 1024;
const HEIGHT = 768;


let player;
let ground;
let clouds;

export class Game extends Scene {
    constructor() {
        super('Game');
        this.player = null;
    }
    

    preload() {
        //load and assign spritesheet to 'dino', load and assign images to 'cloud' and 'ground'
        this.load.spritesheet("dino", "public/assets/dino-run.png", {frameWidth:88, frameHeight:94});
        this.load.image("ground","public/assets/ground.png") 
        this.load.image("cloud","public/assets/cloud.png")
        this.load.image("dino-hurt", "public/assets/dino-hurt.png");
        this.load.image("game-over","public/assets/game-over.png");
        this.load.image("restart","public/assets/restart.png");

        for(let i = 0; i<6;i++) {
            const catcusNum = i + 1;
            this.load.image(`obstacle-${catcusNum}`,`assets/cactuses_${catcusNum}.png`);
        }
        //Audio
        this.load.audio("jump","public/assets/jump.m4a");
        this.load.audio("hit","public/assets/hit.m4a");
    }

    create() {
        //setOrigin centers the sprite image
        this.isGameRunning = true;
        this.player = this.physics.add.sprite(200,200,"dino").setDepth(1).setOrigin(0,1)
        .setGravityY(5000).setCollideWorldBounds(true).setBodySize(44,92);

        this.ground = this.add.tileSprite(0,350,1000,30,"ground").setOrigin(0,1);
        
        this.clouds = this.add.group();
        this.clouds = this.clouds.addMultiple([
            this.add.image(200,100,"cloud").setOrigin(0),
            this.add.image(300,130,"cloud").setOrigin(0),
            this.add.image(450,90,"cloud").setOrigin(0),
            this.add.image(550,150,"cloud").setOrigin(0),
        ])

        this.gameSpeed = 6;
        this.groundCollider = this.physics.add.staticSprite(0,350,'ground').setOrigin(0,1);
        this.groundCollider.body.setSize(1000,30);
        this.physics.add.collider(this.player,this.groundCollider);
        this.groundCollider.setVisible(false);

        this.obstacles = this.physics.add.group({
            allowGravity: false
        })
        this.timer = 0;
        this.cursors = this.input.keyboard.createCursorKeys();
        this.physics.add.collider(this.obstacles,this.player, this.gameOver,null,this);

        this.gameOverText = this.add.image(0,0,"game-over");
        this.restartText = this.add.image(0,80,"restart").setInteractive();

        //container groups the above two in together
        this.gameOverContainer = this.add.container(400,(300/2)-50)
        .add([this.gameOverText,this.restartText]).setAlpha(0);

        // Score / High Score / Lives - moved to top-right
        this.scoreText = this.add.text(800, 30,'00000',{
            fontSize: 30,
            fontFamily: 'Arial',
            color: '#535353',
            resolution: 5,
        }).setOrigin(1,0);
        this.score = 0;
        this.frameCounter = 0;
        
        this.highScore = 0;
        //display high score (below score)
        this.highScoreText = this.add.text(700, 0, "High: 00000", {
            fontSize: 26,
            fontFamily: "Arial",
            color: "#535353",
            resolution: 5
        }).setOrigin(1, 0).setAlpha(1);

        // Lives (below high score)
        this.lives = 3;
        this.livesText = this.add.text(800, 0, `Lives: ${this.lives}`, {
            fontSize: 26,
            fontFamily: "Arial",
            color: "#535353",
            resolution: 5
        }).setOrigin(1, 0);

        this.anims.create({
        key: "dino-run",
        frames: this.anims.generateFrameNames("dino", {start: 2, end: 3}),
        frameRate: 10,
        repeat: -1
    });
        
    }

    update(time, delta) {
        if(!this.isGameRunning) {return;}
        this.ground.tilePositionX += this.gameSpeed;
        this.timer += delta;
        console.log(this.timer);
        if (this.timer > 1000) {
            this.obstacleNum = Math.floor(Math.random()*6)+1;
            this.obstacles.create(760,265,`obstacle-${this.obstacleNum}`).setOrigin(0);
            this.timer -= 1000; 
        }
        
        Phaser.Actions.IncX(this.obstacles.getChildren(),-this.gameSpeed);
        this.obstacles.getChildren().forEach(obstacle => {
            if (obstacle.getBounds().right < 0) {
                this.obstacles.remove(obstacle);
                obstacle.destroy();
            }
        })
        const{space,up} = this.cursors;
        if((Phaser.Input.Keyboard.JustDown(space) || Phaser.Input.Keyboard.JustDown(up)) && this.player.body.onFloor()) {
            this.player.setVelocityY(-1600);
            this.sound.play("jump");
        }
        this.restartText.on('pointerdown',()=> {
            this.physics.resume();
            this.player.setVelocityY(0);
            this.obstacles.clear(true,true);
            this.gameOverContainer.setAlpha(0);
            this.isGameRunning = true;
            this.frameCounter = 0;
            this.score = 0;
            this.lives = 3;
            this.livesText.setText(`Lives: ${this.lives}`);
            this.player.setVisible(true);
            const formattedScore = String(Math.floor(this.score)).padStart(5, "0");
            this.scoreText.setText(formattedScore);
            this.anims.resumeAll();
        }
        )
        this.frameCounter++;
        if (this.frameCounter > 100) { 
            this.score += 100;
            const formattedScore = String(Math.floor(this.score)).padStart(5,   "0");
            this.scoreText.setText(formattedScore);
            this.frameCounter -= 100;
    }
    
    if (this.player.body.deltaAbsY() > 4) {
        //temporarily stop the running animation
        this.player.anims.stop();
        //set texture to the first frame (index 0) in the spritesheet
        this.player.setTexture("dino", 0);
    }
    else {
        //otherwise play the dino-run animation
        this.player.play("dino-run", true);
    }
    }

    gameOver() {
        // decrement lives on collision
        this.lives -= 1;
        // update lives display
        this.livesText.setText(`Lives: ${this.lives}`);
        this.sound.play("hit");

        // set hurt texture and ensure visible
        this.player.setTexture("dino-hurt");
        this.player.setVisible(true);

        // if still have lives left, give a short pause then resume play with flicker effect
        if (this.lives > 0) {
            this.physics.pause();
            this.timer = 0;
            this.isGameRunning = false;

            // flicker the dino sprite while paused to indicate hit (keep dino-hurt texture)
            // repeat:3 => 4 callbacks -> visible toggles 4 times -> two full flickers (off/on, off/on)
            const flicker = this.time.addEvent({
                delay: 120,
                callback: () => {
                    this.player.visible = !this.player.visible;
                },
                repeat: 3
            });

            // short delay to show hit/flicker state, then reset obstacles and resume
            this.time.delayedCall(1000, () => {
                // stop flicker and ensure dino is visible and still using hurt texture
                if (flicker && !flicker.hasDispatched) {
                    flicker.remove(false);
                }
                this.player.setVisible(true);
                this.player.setTexture("dino-hurt");

                this.physics.resume();
                this.obstacles.clear(true,true);
                this.player.setVelocityY(0);

                // restore running animation/texture after resume
                this.player.setTexture("dino");
                this.anims.resumeAll();
                this.isGameRunning = true;
            }, [], this);

            return;
        }

        // no lives left -> full game over
        //check to see if high score
        if (this.score > this.highScore) {

            //update high score variable
            this.highScore = this.score;

            //update high score text
            this.highScoreText.setText("High: " + String(this.highScore).padStart(5, "0"));
        }
        this.physics.pause();
        this.timer = 0;
        this.isGameRunning = false;
        this.gameOverContainer.setAlpha(1);
        this.anims.pauseAll();
        this.player.setTexture("dino-hurt");
        this.player.setVisible(true);
    }

}
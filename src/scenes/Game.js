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
        this.load.spritesheet("dino", "assets/dino-run.png", {frameWidth:88, frameHeight:94});
        this.load.image("ground","assets/ground.png") 
        this.load.image("cloud","assets/cloud.png")

        this.load.image('game-over','assets/game-over.png');
        this.load.image('restart','assets/restart.png');

        for(let i = 0; i<6;i++) {
            const catcusNum = i + 1;
            this.load.image(`obstacle-${catcusNum}`,`assets/cactuses_${catcusNum}.png`);
        }
        //Audio
        this.load.audio("jump","assets/jump.m4a");
        this.load.audio("hit","assets:/hit.m4a");
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

        this.gameOverText = this.add.image(0,0,'game-over');
        this.restartText = this.add.image(0,80,'restart').setInteractive();

        //container groups the above two in together
        this.gameOverContainer = this.add.container(400,(300/2)-50)
        .add([this.gameOverText,this.restartText]).setAlpha(0);

        this.scoreText = this.add.text(100,20,'00000',{
            fontSize: 30,
            fontFamily: 'Arial',
            color: '#535353',
            resolution: 5,
        }).setOrigin(1,0);
        this.score = 0;
        this.frameCounter = 0;
        

        
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
        }
        )
    }
    
    gameOver() {
        this.physics.pause();
        this.timer = 0;
        this.isGameRunning = false;
        this.gameOverContainer.setAlpha(1);
        this.sound.play("hit");
    }

}
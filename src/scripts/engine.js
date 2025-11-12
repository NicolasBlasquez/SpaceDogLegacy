"use strict"

const GAME_VERSION = "Legacy 0.2.0";

const CONFIG = {
    resolution: {
        displayText: "1280x720",
        width: 1280,
        height: 720,
    },
    unlockedPets: false,
    petSkinId: 0,
    skinId: 0,
    particleCountLimit: 20,
    uiBrightnessChange: 1.5,
    showFPScounter: false,
    currentBiome: 0,
    playMode: 0,
    muteSfx: false,
    muteMusic: false,
    gravityFactor: 0.195,
    consoleMessageDuration: 5000,
    kilometersRecords: [],
}

const FPS = {
    count: 0,
    currentFPS: 0,
    lastTimestamp: 0,
    fpsTimestamp: 0,
}

class Engine {
    constructor() {
        this.canvas = document.querySelector("canvas");
        this.context = document.querySelector("canvas").getContext("2d");
        this.entities = [];
        this.objects = [];
        this.particles = [];
        this.backgrounds = [];
        this.paused = false;
        this.clicking = false;
        this.DOMElements = {
            favicon: document.querySelector("link[rel=icon]"),
        }

        this.gameStarted = false;

        this.deltaTime = 1;
        this.resolutionFactor = 1;

        this.biomes = [];

        /**
         * Current biome
         * 0: Asteroid belt
         * 1: Gas giants
         */

        this.currentBiome = 0;

        /**
         * The current view
         * 0: Playing
         * 1: Main menu
         * 2: Config menu
         */
        this.currentView = 1;
        this.update = this.update.bind(this);
    }

    update(timestamp = 0) {
        requestAnimationFrame(this.update);

        this.deltaTime = (timestamp - FPS.lastTimestamp) / 8.3;

        if (timestamp - FPS.fpsTimestamp > 1000) {
            FPS.currentFPS = FPS.count;
            FPS.count = 0;
            FPS.fpsTimestamp = timestamp;
        }

        FPS.count += 1;

        if (!this.paused) {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.context.fillStyle = this.biomes[this.currentBiome] ? this.biomes[this.currentBiome].backdrop : "black";
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

            for (let i = 0; i < this.objects.length; i++) {
                if (this.objects[i].opacity > 0 && !this.objects[i].hidden) {
                    this.objects[i].update();
                    this.objects[i].render();
                } else {
                    this.objects[i].update();
                }
            }
            this.biomes[this.currentBiome].update();
        }
        FPS.lastTimestamp = timestamp;
        console.log(timestamp);
        
    }

    start() {
        this.canvas.height = CONFIG.resolution.height;
        this.canvas.width = CONFIG.resolution.width;

        this.context.imageSmoothingEnabled = false;
        this.resolutionFactor = CONFIG.resolution.height / 720;

        for (let i = 0; i < this.entities.length; i++) {
            this.entities[i].start();
        }
        this.currentBiome = CONFIG.currentBiome;
        this.biomes[this.currentBiome].start();
    }

    sortEntities() {
        this.objects = this.objects.sort((a, b) => a.layer - b.layer);
    }

    gameOver() {
        if (this.gameStarted) {
            if (Player.spawnInmunity) return;
            if (this.currentView != 0) return;

            let configBiomeRecord;
            CONFIG.kilometersRecords.forEach(b => { if (b && b.name == this.name) { configBiomeRecord = b; } });
            if (Player.kilometersCount > BIOMES[this.currentBiome].biomeRecord.distance) { BIOMES[this.currentBiome].biomeRecord.distance = Player.kilometersCount; if (configBiomeRecord) { configBiomeRecord.distance = Player.kilometersCount } }

            Player.newRecordLine.vanishing = true;

            console.log(Player.newRecordLine);

            this.LocalDataManager.save();

            this.currentView = 1;
            this.gameStarted = false;

            ASSETS.audio.effects[0].currentTime = 0;
            ASSETS.audio.effects[0].play();

            for (let i = 0; i < 15; i++) {
                new Particle({
                    sprites: [ASSETS.sprites.particles[0], ASSETS.sprites.particles[1], ASSETS.sprites.particles[2]],
                    speed: randomBetween(1, 4, false) * SpaceDog.deltaTime * SpaceDog.resolutionFactor,
                    layer: 32,
                    start() {
                        this.currentSprite = randomBetween(0, 2);
                        this.transform.height = Player.transform.height / 4.5;
                        this.transform.width = this.transform.height * this.sprites[this.currentSprite].naturalWidth / this.sprites[this.currentSprite].naturalHeight
                        this.transform.x = Player.transform.x;
                        this.transform.y = Player.transform.y;
                        this.transform.rotation = randomBetween(-15, 15);
                        this.transform.direction = randomBetween(0, 360);
                    },
                    update() {
                        this.opacity -= 0.01 * SpaceDog.deltaTime;
                        this.transform.width += 0.1 * SpaceDog.deltaTime * SpaceDog.resolutionFactor;
                        this.transform.height += 0.1 * SpaceDog.deltaTime * SpaceDog.resolutionFactor;
                        this.transform.x += Math.cos(degToRad(this.transform.direction)) * this.speed;
                        this.transform.y += Math.sin(degToRad(this.transform.direction)) * this.speed;
                        if (this.opacity < 0) { SpaceDog.deleteParticle(this); }
                    }
                });
            }
            new Particle({
                sprites: [ASSETS.sprites.death[0]],
                layer: 32,
                start() {
                    this.transform.height = Player.transform.height;
                    this.transform.width = this.transform.height
                    this.transform.x = Player.transform.x;
                    this.transform.y = Player.transform.y;
                },
                update() {
                    this.opacity -= 0.02 * SpaceDog.deltaTime;
                    this.transform.width += 3.5 * SpaceDog.deltaTime * SpaceDog.resolutionFactor;
                    this.transform.height += 3.5 * SpaceDog.deltaTime * SpaceDog.resolutionFactor;
                    if (this.opacity < 0) { SpaceDog.deleteParticle(this); }
                }
            });

            Player.hidden = true;
        }
    }

    addParticle(particle) {
        this.objects.push(particle);
        this.particles.push(particle);
        if (this.particles.length > CONFIG.particleCountLimit) {
            let leftOutParticle = this.particles.shift();
            this.particles = this.particles.filter(p => p != leftOutParticle);
            this.objects = this.objects.filter(p => p != leftOutParticle);
        }
        particle.start();
        this.sortEntities();
    }

    deleteParticle(particle) {
        this.particles = this.particles.filter(e => e != particle);
        this.objects = this.objects.filter(e => e != particle);
        this.sortEntities();
    }

    addEntity(entity) {
        this.objects.push(entity);
        this.entities.push(entity);
        this.sortEntities();
    }

    deleteEntity(entity) {
        this.entities = this.entities.filter(e => e != entity);
        this.objects = this.objects.filter(e => e != entity);
        this.sortEntities();
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.canvas.requestFullscreen().catch((err) => { console.warn(err); });
        } else {
            document.exitFullscreen();
        }
    }

    onClick(engine) {
        for (let i = 0; i < this.entities.length; i++) {
            if (!this.entities[i].hidden && checkHitbox(engine.Cursor.transform.x, engine.Cursor.transform.y, this.entities[i].transform.x, this.entities[i].transform.y, this.entities[i].transform.width, this.entities[i].transform.height)) {
                this.entities[i].onClick();
            }
        }
    }
    onMouseMove(engine) {
        let cursor = 0;
        for (let i = 0; i < this.entities.length; i++) {
            this.entities[i].hovering = false;
            if (!this.entities[i].hidden && checkHitbox(engine.Cursor.transform.x, engine.Cursor.transform.y, this.entities[i].transform.x, this.entities[i].transform.y, this.entities[i].transform.width, this.entities[i].transform.height)) {
                this.entities[i].onMouseMove();
                this.entities[i].hovering = true;
                if (this.entities[i].cursor >= cursor) {
                    cursor = this.entities[i].cursor;
                }
            }
        }
        engine.Cursor.changeCursor(cursor);
    }
    onKeyDown(engine, e) {
        if (e.repeat) return;
        if (SpaceDog.Console.writing) {
            if (e.code == "Enter") {
                SpaceDog.Console.sendPrompt();
            } else if (e.code == "ArrowUp") {
                SpaceDog.Console.prompt = SpaceDog.Console.consoleLog[SpaceDog.Console.consoleLog.length - 1];
            } else if (e.key.length == 1) {
                SpaceDog.Console.prompt += e.key;
            }
        } else {
            if (e.code == "Space" || e.code == "ArrowUp") {
                engine.clicking = true;
                Player.jump();
            }
            if (e.code == "Escape" && SpaceDog.currentView == 0) {
                SpaceDog.paused = !SpaceDog.paused;
            }
            if (e.code == "KeyT") {
                SpaceDog.Console.startWriting();
            }

        }
    }
    onKeyUp(engine, e) {
        if (e.code == "Space" || e.code == "ArrowUp") {
            engine.clicking = false;

        }
    }
    onMouseDown(engine) {
        engine.clicking = true;
        Player.jump();

        for (let i = 0; i < this.entities.length; i++) {
            if (!this.entities[i].hidden && checkHitbox(engine.Cursor.transform.x, engine.Cursor.transform.y, this.entities[i].transform.x, this.entities[i].transform.y, this.entities[i].transform.width, this.entities[i].transform.height)) {
                this.entities[i].onMouseDown();
            }
        }

    }
    onMouseUp(engine) {
        engine.clicking = false;
        this.entities.forEach(e => {
            e.onMouseUp();
        })
    }
}

class AudioManager {
    constructor(params) {
        this.musicPlaying = false;

        this.music = ASSETS.audio.music;
        this.sfx = [...ASSETS.audio.effects, ...ASSETS.audio.select];

        Object.assign(this, params);

        this.muteMusic(CONFIG.muteMusic);
        this.muteSFX(CONFIG.muteSfx);

        ASSETS.audio.music.forEach(a => {
            a.addEventListener("ended", () => {
                this.playMusic();
            })
        });
    }
    playMusic() {
        this.music[randomBetween(0, 2)].play();
        this.musicPlaying = true;
    }
    muteMusic(boolean = true) {
        this.music.forEach(e => {
            e.muted = boolean;
        });
        this.mutedMusic = boolean;
    }
    muteSFX(boolean = true) {
        this.sfx.forEach(e => {
            e.muted = boolean;
        });
        this.mutedSfx = boolean;
    }
}

class Cursor {
    constructor() {
        this.transform = {};
        this.sprites = [
            "src/assets/sprites/cursor_default.png",
            "src/assets/sprites/cursor_pointer.png",
            "src/assets/sprites/cursor_hand.png",
            "src/assets/sprites/cursor_hold.png",
        ];
        this.globalCursor = undefined;
        this.start();
    }
    start() {
        window.addEventListener("mousemove", (e) => {
            this.setCoordinates(e.clientX, e.clientY);
        });

        window.addEventListener("touchmove", (e) => {
            if (e.changedTouches.length == 1) {
                this.setCoordinates(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
            }
        });
        window.addEventListener("touchstart", (e) => {
            if (e.changedTouches.length == 1) {
                SpaceDog.touchDevice = true;
                this.setCoordinates(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
                SpaceDog.onMouseDown(SpaceDog);
            }

        });
        window.addEventListener("touchend", (e) => {
            if (e.changedTouches.length == 1) {
                this.setCoordinates(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
                SpaceDog.onMouseUp(SpaceDog);
            }
        });
    }
    changeCursor(number) {
        if (this.globalCursor) SpaceDog.canvas.style.cursor = `url("${this.sprites[this.globalCursor]}"), auto`;
        else SpaceDog.canvas.style.cursor = `url("${this.sprites[number]}"), auto`;
    }

    setCoordinates(clientX, clientY) {
        this.transform.x = (clientX - SpaceDog.canvas.offsetLeft) * SpaceDog.canvas.width / SpaceDog.canvas.clientWidth;
        this.transform.y = (clientY - SpaceDog.canvas.offsetTop) * SpaceDog.canvas.height / SpaceDog.canvas.clientHeight;
    }
}

class LocalDataManager {
    constructor(params) {
        Object.assign(this, params);
        if (localStorage.getItem("saved_game")) {
            this.load();
        } else {
            localStorage.setItem("saved_game", true);
            this.save();
        }
        SpaceDog.DOMElements.favicon.href = ASSETS.uiElements.favicon[CONFIG.skinId].src;
    }
    save() {
        localStorage.setItem("saved_game", true);
        localStorage.setItem("config", JSON.stringify(CONFIG));
    }
    load() {
        Object.assign(CONFIG, JSON.parse(localStorage.getItem("config")));
    }
    eraseAllData() {
        for (let i = 0; i < localStorage.length; i++) { let key = localStorage.key(i); localStorage.removeItem(key); }
    }
}

const SpaceDog = new Engine();
SpaceDog.LocalDataManager = new LocalDataManager();
SpaceDog.AudioManager = new AudioManager();
SpaceDog.Cursor = new Cursor();

window.addEventListener("click", (e) => {
    SpaceDog.onClick(SpaceDog);
    if (!SpaceDog.AudioManager.musicPlaying) {
        SpaceDog.AudioManager.playMusic()
    }
});

window.addEventListener("mousemove", (e) => {
    SpaceDog.onMouseMove(SpaceDog);
});

window.addEventListener("mousedown", (e) => {
    if (!SpaceDog.touchDevice) {
        SpaceDog.onMouseDown(SpaceDog);
    }
    SpaceDog.touchDevice = false;
});

window.addEventListener("mouseup", (e) => {
    SpaceDog.onMouseUp(SpaceDog);
});

window.addEventListener("keydown", (e) => {
    SpaceDog.onKeyDown(SpaceDog, e);
});

window.addEventListener("keyup", (e) => {
    SpaceDog.onKeyUp(SpaceDog, e);
});

window.addEventListener("visibilitychange", (e) => {
    if (document.visibilityState == "visible") {
        SpaceDog.paused = false;
    } else {
        SpaceDog.paused = true;
    }
});
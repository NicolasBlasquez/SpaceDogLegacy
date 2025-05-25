"use strict"

const PROPS = {
    BackgroundProps: new Entity({
        name: "background_props",
        sprites: [...ASSETS.sprites.terrestialPlanets, ...ASSETS.sprites.gasGiants, ...ASSETS.sprites.iceGiants],
        layer: 2,
        start() {
            if (SpaceDog.currentBiome == 0) {
                this.currentSprite = randomBetween(0, 3);
            } else {
                this.currentSprite = randomBetween(4, 6);
            }
            this.randomSizeFactor = randomBetween(1, 1.6, false);
            this.transform.height = SpaceDog.canvas.height / 8 * this.randomSizeFactor;
            this.transform.width = this.transform.height * this.sprites[this.currentSprite].naturalWidth / this.sprites[this.currentSprite].naturalHeight;
            if (this.currentSprite == 0 || this.currentSprite == 4) {
                this.transform.y = SpaceDog.canvas.height - this.transform.height / 2;
            } else {
                this.transform.y = randomBetween(50 + this.transform.height, SpaceDog.canvas.height - 50);
            }
            this.transform.x = SpaceDog.canvas.width + this.transform.width + 10
        },
        update() {
            this.transform.x -= 0.5 * SpaceDog.deltaTime * SpaceDog.resolutionFactor;
            if (this.transform.x < 0 - this.transform.width - 10) { this.start(); }
        },
    }),
    Stars: new Entity({
        name: "stars",
        sprites: ASSETS.sprites.stars,
        layer: 1,
        start() {
            this.transform.height = SpaceDog.canvas.height / 2;
            this.transform.width = this.transform.height * 818 / 470;
            this.transform.x = 0;
            this.transform.y = 0;
        },
        update() {
            this.transform.x += 0.2 * SpaceDog.deltaTime * SpaceDog.resolutionFactor;
            if (this.transform.x >= this.transform.width) { this.transform.x = 0; }
        },
        render() {
            let imageX = Math.ceil(SpaceDog.canvas.width / this.transform.width) + 1;
            let imageY = Math.ceil(SpaceDog.canvas.height / this.transform.height);

            for (let i = 0; i < imageY; i++) {
                for (let j = 0; j < imageX; j++) {
                    SpaceDog.context.drawImage(this.sprites[0], j * this.transform.width - this.transform.x, i * this.transform.height, this.transform.width, this.transform.height);
                }
            }
        }
    }),
};

const Player = new Entity({
    name: "player",
    layer: 10,
    particleFrequency: 8,
    particleTimelapse: 0,
    spawnInmunity: false,
    skin: CONFIG.skinId,
    kilometersCount: 0,
    sprites: ASSETS.sprites.skins[CONFIG.skinId],
    mode: CONFIG.playMode,
    audioDelay: 0,
    aditionalSpeed: 0,
    newRecordLine: new UIelement({
        name: "new_record_line",
        sprites: ASSETS.uiElements.newRecordLine,
        vanishing: false,
        start() {
            this.transform.height = SpaceDog.canvas.height;
            this.transform.width = this.transform.height * this.sprites[0].naturalWidth / this.sprites[0].naturalHeight;
            this.transform.y = SpaceDog.canvas.height / 2;
            this.hidden = true;
        },
        set() {
            this.vanishing = false;
            this.opacity = 1;
            if (BIOMES[SpaceDog.currentBiome].biomeRecord.distance >= 1) {
                this.hidden = false;
                this.transform.x = BIOMES[SpaceDog.currentBiome].biomeRecord.distance / 0.0111 * 5 * SpaceDog.resolutionFactor + SpaceDog.canvas.width / 5;
                console.log(this.transform.x);
                this.opacity = 1;
            }
        }
    }),
    start() {
        this.transform.x = SpaceDog.canvas.width / 5;
        this.transform.width = SpaceDog.canvas.width / 12;
        this.transform.height = this.transform.width / 120 * 92;
        ASSETS.audio.effects[4].volume = 0.6;
        setInterval(() => {
            if (Player.currentSprite == 0) { Player.currentSprite = 1; } else { Player.currentSprite = 0; }
        }, 250);
    },
    update() {
        if (SpaceDog.currentView == 0) {
            this.transform.y += this.transform.speed[1] * SpaceDog.deltaTime * SpaceDog.resolutionFactor;
            if (this.mode == 0) {
                this.transform.speed[1] += CONFIG.gravityFactor * SpaceDog.deltaTime;
                this.transform.rotation /= 1 + 0.05 * SpaceDog.deltaTime;
            } else {
                this.transform.speed[1] += CONFIG.gravityFactor * 0.8 * SpaceDog.deltaTime;
                this.transform.rotation = 18 * this.transform.speed[1] / 5
            }
            this.particleTimelapse += SpaceDog.deltaTime;

            this.kilometersCount += 0.0111 * (BIOMES[SpaceDog.currentBiome].initialSpeed + Player.aditionalSpeed) / 5 * SpaceDog.deltaTime;

            this.aditionalSpeed += 0.0001 * SpaceDog.deltaTime * SpaceDog.resolutionFactor;


            if (this.transform.y > SpaceDog.canvas.height) {
                if (this.spawnInmunity) {
                    this.transform.speed[1] = this.mode == 0 ? -12 : -10;
                } else {
                    this.transform.speed[1] = 0;
                    SpaceDog.gameOver();
                }
            } else if (this.transform.y < 0) {
                if (this.spawnInmunity) {
                    this.transform.speed[1] = this.mode == 0 ? 3 : 2.5;
                } else {
                    this.transform.speed[1] = 0;
                    SpaceDog.gameOver();
                }
            }

            if (SpaceDog.clicking && this.mode == 1) {
                this.jump();
            }

            if (this.particleTimelapse >= this.particleFrequency) {
                this.particleTimelapse = 0;
                new Particle({
                    layer: 4,
                    biome: BIOMES[SpaceDog.currentBiome],
                    sprites: [ASSETS.sprites.particles[0], ASSETS.sprites.particles[1], ASSETS.sprites.particles[2]],
                    start() {
                        this.currentSprite = randomBetween(0, 2);
                        this.transform.height = Player.transform.height / 4.5;
                        this.transform.width = this.transform.height * this.sprites[this.currentSprite].naturalWidth / this.sprites[this.currentSprite].naturalHeight
                        this.transform.x = Player.transform.x - Player.transform.width / 3;
                        this.transform.y = Player.transform.y;
                        this.transform.direction = Player.transform.rotation + randomBetween(-15, 15);
                        this.transform.rotation = Player.transform.rotation + randomBetween(-15, 15);
                    },
                    update() {
                        this.opacity -= 0.02 * SpaceDog.deltaTime;
                        this.transform.width += 0.2 * SpaceDog.deltaTime;
                        this.transform.height += 0.2 * SpaceDog.deltaTime;
                        this.transform.x -= (Math.cos(degToRad(this.transform.direction)) * this.biome.initialSpeed + Player.aditionalSpeed) * SpaceDog.deltaTime * SpaceDog.resolutionFactor;
                        this.transform.y -= (Math.sin(degToRad(this.transform.direction)) * this.biome.initialSpeed + Player.aditionalSpeed) * SpaceDog.deltaTime * SpaceDog.resolutionFactor;
                        if (this.transform.x < 0 - this.transform.width) { SpaceDog.deleteParticle(this); }
                    }
                });
            }
        } else if (SpaceDog.currentView == 1) {
            this.transform.y = SpaceDog.canvas.height / 2;
            this.transform.rotation = 0;
        } else if (SpaceDog.currentView == 2) {
            this.hidden = false;
            this.transform.x = SpaceDog.canvas.width / 4;
            this.transform.y = SpaceDog.canvas.height / 2;
            this.transform.width = SpaceDog.canvas.width / 5;
            this.transform.height = this.transform.width / 120 * 92;
            if (this.hovering) {
                this.cursor = 1;
            } else { this.cursor = 0 }
        }
        if (this.newRecordLine.vanishing) {
            this.newRecordLine.opacity -= 0.01;
        }
        this.newRecordLine.transform.x -= BIOMES[SpaceDog.currentBiome].initialSpeed * SpaceDog.resolutionFactor;
    },
    jump() {
        if (SpaceDog.paused || UI_ELEMENTS.Buttons.Pause.hovering) return;
        if (SpaceDog.currentView == 0) {
            if (this.mode == 0) {
                this.transform.speed[1] = -6.5;
                this.transform.rotation = 18;
                ASSETS.audio.effects[1].currentTime = 0;
                ASSETS.audio.effects[1].play();
            } else {
                this.transform.speed[1] -= 0.3 * SpaceDog.deltaTime;
                this.audioDelay++;
                if (this.audioDelay >= 6 / SpaceDog.deltaTime) {
                    this.audioDelay = 0;
                    ASSETS.audio.effects[4].currentTime = 0;
                    ASSETS.audio.effects[4].play();
                }
            }
        }
    },
});

const Pet = new Entity({
    name: "pet",
    layer: 9,
    skin: CONFIG.petSkinId,
    sprites: ASSETS.sprites.pets[CONFIG.petSkinId],
    hidden: true,
    particleTimelapse: 0,
    particleFrequency: 10,
    spriteInterval: 30,
    spriteDelayCounter: 0,
    resize() {
        this.transform.height = SpaceDog.canvas.height / 20;
        this.transform.width = this.transform.height * (this.sprites[0].naturalWidth / this.sprites[0].naturalHeight);
    },
    start() {
        Pet.transform.x = SpaceDog.canvas.width / 8;
        this.resize();
    },
    update() {
        if (CONFIG.unlockedPets) { this.hidden = false; }
        if (this.skin != 2) {
            this.spriteDelayCounter = this.spriteDelayCounter + SpaceDog.deltaTime;
            if (this.spriteDelayCounter >= this.spriteInterval) {
                this.currentSprite = (this.currentSprite + 1) % this.sprites.length;
                this.spriteDelayCounter = 0;
            }
        } else { this.currentSprite = this.transform.speed[1] < 0 ? 1 : 0; }

        if (SpaceDog.currentView == 0 || SpaceDog.currentView == 1) {
            this.transform.y += this.transform.speed[1] * SpaceDog.deltaTime * SpaceDog.resolutionFactor;
            this.transform.rotation = 18 * this.transform.speed[1] / 3;
            if (!Player.hidden) {
                this.transform.speed[1] += 0.12 * Math.sign(Player.transform.y - this.transform.y) * SpaceDog.deltaTime
                if (this.transform.speed[1] > 5) {
                    this.transform.speed[1] = 5
                } else if (this.transform.speed[1] < -5) {
                    this.transform.speed[1] = -5
                }
            } else {
                this.transform.speed[1] += 0.1 * SpaceDog.deltaTime
            }
            if (this.skin == 1) {
                this.particleTimelapse += SpaceDog.deltaTime;
                if (this.particleTimelapse >= this.particleFrequency && !this.hidden) {
                    this.particleTimelapse = 0;
                    new Particle({
                        layer: 4,
                        biome: BIOMES[SpaceDog.currentBiome],
                        sprites: [ASSETS.sprites.particles[0], ASSETS.sprites.particles[1], ASSETS.sprites.particles[2]],
                        start() {
                            this.currentSprite = randomBetween(0, 2);
                            this.transform.height = Pet.transform.height / 3;
                            this.transform.width = this.transform.height * this.sprites[this.currentSprite].naturalWidth / this.sprites[this.currentSprite].naturalHeight
                            this.transform.x = Pet.transform.x - Pet.transform.width / 2;
                            this.transform.y = Pet.transform.y;
                            this.transform.direction = Pet.transform.rotation + randomBetween(-15, 15);
                            this.transform.rotation = Pet.transform.rotation + randomBetween(-15, 15);
                        },
                        update() {
                            this.opacity -= 0.02 * SpaceDog.deltaTime;
                            this.transform.width += 0.2 * SpaceDog.deltaTime;
                            this.transform.height += 0.2 * SpaceDog.deltaTime;
                            this.transform.x -= (Math.cos(degToRad(this.transform.direction)) * this.biome.initialSpeed + Player.aditionalSpeed) * SpaceDog.deltaTime * SpaceDog.resolutionFactor;
                            this.transform.y -= (Math.sin(degToRad(this.transform.direction)) * this.biome.initialSpeed + Player.aditionalSpeed) * SpaceDog.deltaTime * SpaceDog.resolutionFactor;
                            if (this.transform.x < 0 - this.transform.width) { SpaceDog.deleteParticle(this); }
                        }
                    });
                }
            }


        } else if (SpaceDog.currentView == 2) {
            this.transform.rotation = -12;
            this.transform.speed[1] = 8;
            this.transform.height = SpaceDog.canvas.height / 10;
            this.transform.width = this.transform.height * (this.sprites[0].naturalWidth / this.sprites[0].naturalHeight);
            this.transform.x = SpaceDog.canvas.width / 4;
            this.transform.y = SpaceDog.canvas.height / 1.3;
            if (this.hovering) {
                this.cursor = 1;
            } else { this.cursor = 0 }

            // Animación fuego faltante

            if (this.skin == 2) {
                this.currentSprite = 1;
            }
        }
    },
})

const UI_ELEMENTS = {
    Titles: {
        Main: new UIelement({
            name: "game_title",
            layer: 64,
            sprites: ASSETS.uiElements.title,
            start() {
                this.transform.x = SpaceDog.canvas.width / 2;
                this.transform.y = SpaceDog.canvas.height / 3.5;
                this.transform.width = SpaceDog.canvas.width / 2.5;
                this.transform.height = SpaceDog.canvas.width / 2.5 / 113 * 34;
            },
            update() {
                this.hidden = SpaceDog.currentView == 1 ? false : true;
            },
        }),
        Settings: new UIelement({
            name: "title_settings",
            sprites: ASSETS.uiElements.titleSettings,
            cursor: 1,
            start() {
                this.transform.height = SpaceDog.canvas.height / 18;
                this.transform.width = this.transform.height / 8 * 64;
                this.transform.x = SpaceDog.canvas.width / 2;
                this.transform.y = SpaceDog.canvas.height / 12;
            },
            update() {
                if (SpaceDog.currentView == 2) {
                    this.hidden = false;
                } else {
                    this.hidden = true;
                    this.brightness = 1;
                }

                this.cursor = CONFIG.unlockedPets ? 0 : 1;

                if (!CONFIG.unlockedPets) {
                    if (this.hovering) {
                        this.brightness = CONFIG.uiBrightnessChange;
                    } else this.brightness = 1;
                }

            },
            onClick() {
                if (!CONFIG.unlockedPets) {
                    this.brightness = 0.5;
                    CONFIG.unlockedPets = true;
                    SpaceDog.LocalDataManager.save();
                    ASSETS.audio.select[0].currentTime = 0;
                    ASSETS.audio.select[0].play();
                }
            }
        }),
    },
    Displays: {
        FPSCounter: new Entity({
            name: "fps_counter",
            layer: 64,
            start() {
                this.transform.height = SpaceDog.canvas.height / 120;
                this.transform.y = this.transform.height * 6;
                this.transform.x = SpaceDog.canvas.height / 14.4;
            },
            render() {
                if (CONFIG.showFPScounter) {
                    SpaceDog.context.save();
                    SpaceDog.context.fillStyle = "white";
                    SpaceDog.context.textAlign = "center";
                    SpaceDog.context.font = `${this.transform.height * 2}px 'pixelFont'`;
                    SpaceDog.context.fillText(`${FPS.currentFPS} FPS`, this.transform.x, this.transform.y);
                    SpaceDog.context.restore();
                }
            },
        }),
        VersionDisplay: new Entity({
            name: "version_display",
            layer: 64,
            start() {
                this.transform.height = SpaceDog.canvas.height / 120;
                this.transform.y = this.transform.height * 6
            },
            render() {
                SpaceDog.context.save();
                SpaceDog.context.fillStyle = "white";
                SpaceDog.context.textAlign = "right";
                SpaceDog.context.font = `${this.transform.height * 2}px 'pixelFont'`;
                SpaceDog.context.fillText(`${GAME_VERSION}`, SpaceDog.canvas.width - this.transform.y / 2, this.transform.y);
                SpaceDog.context.restore();
            },
        }),
        kilometersDisplay: new Entity({
            name: "kilometers_display",
            layer: 64,
            start() {
                this.transform.height = SpaceDog.canvas.height / 120;
                this.transform.y = this.transform.height * 10
            },
            render() {
                if (SpaceDog.currentView == 0) {
                    SpaceDog.context.save();
                    SpaceDog.context.fillStyle = "white";
                    SpaceDog.context.textAlign = "right";
                    SpaceDog.context.font = `${this.transform.height * 5}px 'pixelFont'`;
                    SpaceDog.context.fillText(`${Math.round(Player.kilometersCount)} KM`, SpaceDog.canvas.width / 2, this.transform.y);
                    SpaceDog.context.restore();
                }
            },
        }),
    },
    ConfigElements: {
        ToggleFPSCounter: new Toggle({
            name: "toggle_fps_counter",
            text: `Toggle FPS counter`,
            state: CONFIG.showFPScounter,
            start() {
                this.transform.height = SpaceDog.canvas.height / 18;
                this.transform.width = this.transform.height / 24 * 45;
                this.transform.x = SpaceDog.canvas.width / 2 + this.transform.width / 2;
                this.transform.y = SpaceDog.canvas.height / 2 - this.transform.height * 5;
            },
            onClick() {
                CONFIG.showFPScounter = !CONFIG.showFPScounter;
                this.setState(CONFIG.showFPScounter);

                SpaceDog.LocalDataManager.save();

                ASSETS.audio.select[0].currentTime = 0;
                ASSETS.audio.select[0].play();
            },
            update() {
                this.setState(CONFIG.showFPScounter);
                this.hidden = SpaceDog.currentView == 2 ? false : true;
            },
            setState(state) {
                this.state = state;
                UI_ELEMENTS.Buttons.Back.setPos();
                this.currentSprite = CONFIG.showFPScounter ? 1 : 0;
            }
        }),
        ToggleMusic: new Toggle({
            name: `toggle_mute_music`,
            text: `Mute music`,
            state: CONFIG.muteMusic,
            start() {
                this.transform.height = SpaceDog.canvas.height / 18;
                this.transform.width = this.transform.height / 24 * 45;
                this.transform.x = SpaceDog.canvas.width / 2 + this.transform.width / 2;
                this.transform.y = SpaceDog.canvas.height / 2 - this.transform.height * 3;
            },
            onClick() {
                CONFIG.muteMusic = !CONFIG.muteMusic;
                this.state = CONFIG.muteMusic;

                SpaceDog.AudioManager.muteMusic(CONFIG.muteMusic)

                SpaceDog.LocalDataManager.save();

                this.currentSprite = this.currentSprite == 0 ? 1 : 0;

                ASSETS.audio.select[0].currentTime = 0;
                ASSETS.audio.select[0].play();
            },
            update() {
                this.setState(CONFIG.muteMusic);
                this.hidden = SpaceDog.currentView == 2 ? false : true;
            },
            setState(state) {
                this.state = state;
                this.currentSprite = CONFIG.muteMusic ? 1 : 0;
            }
        }),
        ToggleSFX: new Toggle({
            name: `toggle_sfx`,
            text: `Mute SFX`,
            state: CONFIG.muteSfx,
            start() {
                this.transform.height = SpaceDog.canvas.height / 18;
                this.transform.width = this.transform.height / 24 * 45;
                this.transform.x = SpaceDog.canvas.width / 2 + this.transform.width / 2;
                this.transform.y = SpaceDog.canvas.height / 2 - this.transform.height;
            },
            onClick() {
                CONFIG.muteSfx = !CONFIG.muteSfx;
                this.state = CONFIG.muteSfx;

                SpaceDog.AudioManager.muteSFX(CONFIG.muteSfx);

                SpaceDog.LocalDataManager.save();

                this.currentSprite = this.currentSprite == 0 ? 1 : 0;

                ASSETS.audio.select[0].currentTime = 0;
                ASSETS.audio.select[0].play();
            },
            update() {
                this.setState(CONFIG.muteSfx);
                this.hidden = SpaceDog.currentView == 2 ? false : true;
            },
            setState(state) {
                this.state = state;
                this.currentSprite = CONFIG.muteSfx ? 1 : 0;
            }
        }),
        RangeResolution: new RangeBar({
            name: `range_resolution`,
            text: `Resolution`,
            steps: [{ displayText: "640x360", width: 640, height: 360 }, { displayText: "1280x720", width: 1280, height: 720 }, { displayText: "1920x1080", width: 1920, height: 1080 }],
            start() {
                this.transform.height = SpaceDog.canvas.height / 18;
                this.transform.width = this.transform.height / 24 * 304;
                this.transform.x = SpaceDog.canvas.width / 2 + this.transform.width / 2;
                this.transform.y = SpaceDog.canvas.height / 2 + this.transform.height * 1.5;
            },
            update() {
                this.value = CONFIG.resolution;
            },
            callback(value) {
                CONFIG.resolution = value;
                UI_ELEMENTS.Buttons.Refresh.active = true;
                SpaceDog.LocalDataManager.save();
            }
        }),
        RangeParticleLimit: new RangeBar({
            name: `range_particle_limit`,
            text: `Particle count limit`,
            value: CONFIG.particleCountLimit,
            min: 0,
            max: 30,
            start() {
                this.transform.height = SpaceDog.canvas.height / 18;
                this.transform.width = this.transform.height / 24 * 304;
                this.transform.x = SpaceDog.canvas.width / 2 + this.transform.width / 2;
                this.transform.y = SpaceDog.canvas.height / 2 + this.transform.height * 4.5;
            },
            update() {
                this.value = CONFIG.particleCountLimit;
            },
            callback(value) {
                CONFIG.particleCountLimit = value;
                while (SpaceDog.particles.length > CONFIG.particleCountLimit) {
                    delete SpaceDog.particles.shift();
                    SpaceDog.particles = SpaceDog.particles.filter(p => !!p);
                }
                SpaceDog.LocalDataManager.save();
            }
        }),
        EraseAllData: new UIelement({
            name: "button_erase_all_data",
            layer: 64,
            cursor: 1,
            sprites: ASSETS.uiElements.eraseAllData,
            confirmation: false,
            confirmationMessage: new UIelement({
                name: "erase_all_data_confirmation",
                layer: 64,
                sprites: ASSETS.uiElements.eraseAllData,
                currentSprite: 1,
                start() {
                    this.transform.height = SpaceDog.canvas.width / 30;
                    this.transform.width = this.transform.height * this.sprites[0].naturalWidth / this.sprites[0].naturalHeight;
                    this.transform.x = SpaceDog.canvas.width / 2 + this.transform.width * 1.5;
                    this.transform.y = SpaceDog.canvas.height / 2 + this.transform.height * 6.5;
                },
            }),
            start() {
                this.transform.height = SpaceDog.canvas.width / 30;
                this.transform.width = this.transform.height * this.sprites[0].naturalWidth / this.sprites[0].naturalHeight;
                this.transform.x = SpaceDog.canvas.width / 2 + this.transform.width / 2;
                this.transform.y = SpaceDog.canvas.height / 2 + this.transform.height * 6.5;
                this.confirmationMessage.hidden = true;
            },
            update() {
                if (SpaceDog.currentView == 2) {
                    this.hidden = false;
                } else {
                    this.confirmation = false;
                    this.hidden = true;
                    this.confirmationMessage.hidden = true;
                }

                if (this.hovering) {
                    this.brightness = CONFIG.uiBrightnessChange;
                } else this.brightness = 1;
            },
            onClick() {
                if (!this.confirmation && !this.deletedData) {
                    this.confirmation = true;
                    this.confirmationMessage.hidden = false;
                } else {
                    SpaceDog.LocalDataManager.eraseAllData();
                    window.location.reload();
                }
            }
        }),
    },
    Buttons: {
        Start: new UIelement({
            name: "button_start",
            layer: 64,
            brightness: 1,
            cursor: 1,
            sprites: ASSETS.uiElements.start,
            start() {
                let size = SpaceDog.canvas.width / 3.65;
                this.transform.x = SpaceDog.canvas.width / 2;
                this.transform.y = SpaceDog.canvas.height / 1.6;
                this.transform.width = size;
                this.transform.height = size / 94 * 31;
            },
            update() {
                this.hidden = SpaceDog.currentView == 1 ? false : true;
                if (!this.blinkingInterval) {
                    if (this.hovering) {
                        this.brightness = CONFIG.uiBrightnessChange;
                    } else this.brightness = 1;
                }
            },
            onClick() {
                if (!this.blinkingInterval) {
                    Player.kilometersCount = 0;
                    Player.aditionalSpeed = 0;
                    if (Player.hidden) Pet.transform.y = SpaceDog.canvas.height / 2;

                    setTimeout(() => {
                        SpaceDog.currentView = 0;

                        Player.spawnInmunity = true;
                        Player.opacity = 0.5;
                        setTimeout(() => {
                            Player.spawnInmunity = false;
                            Player.opacity = 1;
                        }, 2000);

                        Player.brightness = 1;

                        SpaceDog.Cursor.changeCursor(0);
                        clearInterval(this.blinkingInterval);
                        this.blinkingInterval = undefined;
                        SpaceDog.gameStarted = true;

                        Player.newRecordLine.set();
                    }, 500);

                    this.blinkingInterval = setInterval(() => {
                        this.brightness = this.brightness > 1500 ? 1 : 3000;
                        Player.brightness = Player.brightness > 1500 ? 1 : 3000;
                    }, 40);

                    ASSETS.audio.select[1].currentTime = 0;
                    ASSETS.audio.select[1].play();

                    Player.hidden = false;
                    Player.brightness = 1000;
                }
            },
        }),
        BiomeChange: new UIelement({
            name: "biome_change",
            layer: 64,
            brightness: 1,
            cursor: 1,
            sprites: ASSETS.uiElements.biomeChange,
            currentSprite: CONFIG.currentBiome,
            start() {
                let size = SpaceDog.canvas.width / 5;
                this.transform.width = size;
                this.transform.height = size / 66 * 21;
                this.transform.y = SpaceDog.canvas.height / 1.26;
                this.transform.x = SpaceDog.canvas.width / 2 + this.transform.width / 1.8;
            },
            update() {
                this.hidden = SpaceDog.currentView == 1 ? false : true;
                if (!this.blinkingInterval) {
                    if (this.hovering) {
                        this.brightness = CONFIG.uiBrightnessChange;
                    } else this.brightness = 1;
                }
            },
            onClick() {
                this.currentSprite = (this.currentSprite + 1) % this.sprites.length;
                SpaceDog.currentBiome = this.currentSprite;
                CONFIG.currentBiome = this.currentSprite;
                SpaceDog.biomes[SpaceDog.currentBiome].start();
                SpaceDog.LocalDataManager.save();
            },
        }),
        ModeChange: new UIelement({
            name: "mode_change",
            layer: 64,
            brightness: 1,
            cursor: 1,
            sprites: ASSETS.uiElements.modeChange,
            currentSprite: CONFIG.playMode,
            start() {
                let size = SpaceDog.canvas.width / 5;
                this.transform.width = size;
                this.transform.height = size / 66 * 21;
                this.transform.y = SpaceDog.canvas.height / 1.26;
                this.transform.x = SpaceDog.canvas.width / 2 + this.transform.width / (0 - 1.8);
            },
            update() {
                this.hidden = SpaceDog.currentView == 1 ? false : true;
                if (!this.blinkingInterval) {
                    if (this.hovering) {
                        this.brightness = CONFIG.uiBrightnessChange;
                    } else this.brightness = 1;
                }
            },
            onClick() {
                this.currentSprite = (this.currentSprite + 1) % this.sprites.length;
                CONFIG.playMode = this.currentSprite;
                Player.mode = this.currentSprite;
                SpaceDog.LocalDataManager.save();
            },
        }),
        Config: new UIelement({
            name: "button_config",
            layer: 64,
            cursor: 1,
            sprites: ASSETS.uiElements.config,
            start() {
                this.transform.width = SpaceDog.canvas.width / 15;
                this.transform.height = this.transform.width;
                this.transform.x = SpaceDog.canvas.width - this.transform.width / 1.2;
                this.transform.y = SpaceDog.canvas.height - this.transform.height / 1.2;
            },
            update() {
                this.hidden = SpaceDog.currentView == 1 ? false : true;
                if (this.hovering) {
                    this.brightness = CONFIG.uiBrightnessChange;
                } else this.brightness = 1;
            },
            onClick() {
                SpaceDog.currentView = 2;
                SpaceDog.Cursor.changeCursor(0);
                ASSETS.audio.select[0].currentTime = 0;
                ASSETS.audio.select[0].play();
            }
        }),
        Fullscreen: new UIelement({
            name: "button_fullscreen",
            layer: 65,
            cursor: 1,
            sprites: ASSETS.uiElements.fullscreen,
            start() {
                this.transform.width = SpaceDog.canvas.width / 20;
                this.transform.height = this.transform.width;
                this.transform.x = SpaceDog.canvas.width - SpaceDog.canvas.width / 18 + this.transform.width / 8;
                this.transform.y = SpaceDog.canvas.height - SpaceDog.canvas.width / 18 - this.transform.height * 1.4;
                window.addEventListener("fullscreenchange", (e) => {
                    this.currentSprite = document.fullscreenElement ? 1 : 0;
                });
            },
            update() {
                this.hidden = SpaceDog.currentView == 1 ? false : true;
                if (this.hovering) {
                    this.brightness = CONFIG.uiBrightnessChange;
                } else this.brightness = 1;
            },
            onClick() {
                SpaceDog.toggleFullscreen();
            }
        }),
        Back: new UIelement({
            name: "button_back",
            layer: 64,
            cursor: 1,
            sprites: ASSETS.uiElements.back,
            start() {
                this.transform.height = SpaceDog.canvas.height / 12;
                this.transform.width = this.transform.height;
                this.transform.x = this.transform.width / 1.2;
            },
            update() {
                this.hidden = SpaceDog.currentView == 2 ? false : true;
                if (this.hovering) {
                    this.brightness = CONFIG.uiBrightnessChange;
                } else this.brightness = 1;
            },
            onClick() {
                SpaceDog.currentView = 1;
                Player.transform.x = SpaceDog.canvas.width / 5;
                Player.transform.width = SpaceDog.canvas.width / 12;
                Player.transform.height = Player.transform.width / 120 * 92;

                Pet.resize();
                Pet.transform.x = SpaceDog.canvas.width / 8;
                Pet.transform.y = SpaceDog.canvas.height / 2;

                SpaceDog.Cursor.changeCursor(0);
                ASSETS.audio.select[0].currentTime = 0;
                ASSETS.audio.select[0].play();
            },
            setPos() {
                this.transform.y = this.transform.height + (CONFIG.showFPScounter ? UI_ELEMENTS.Displays.FPSCounter.transform.height * 3 : 0);
            }
        }),
        Refresh: new UIelement({
            name: "button_refresh",
            layer: 64,
            cursor: 1,
            sprites: ASSETS.uiElements.refresh,
            active: false,
            start() {
                let range = UI_ELEMENTS.ConfigElements.RangeResolution;
                this.transform.width = range.transform.height / 1.05;
                this.transform.height = this.transform.width;
                this.transform.x = range.transform.x + range.transform.width / 2 + this.transform.width / 1.5;
                this.transform.y = range.transform.y;
            },
            update() {
                this.hidden = SpaceDog.currentView == 2 && this.active ? false : true;
                if (this.hovering) {
                    this.brightness = CONFIG.uiBrightnessChange;
                } else this.brightness = 1;
            },
            onClick() {
                ASSETS.audio.select[0].currentTime = 0;
                ASSETS.audio.select[0].play();

                window.location.reload();
            }
        }),
        Pause: new UIelement({
            name: "button_pause",
            layer: 64,
            cursor: 1,
            sprites: ASSETS.uiElements.pause,
            start() {
                this.transform.width = SpaceDog.canvas.width / 15;
                this.transform.height = this.transform.width;
                this.transform.x = SpaceDog.canvas.width - this.transform.width / 2 - SpaceDog.canvas.height / 120 * 2.5;
                this.transform.y = SpaceDog.canvas.height / 120 * 6 + this.transform.height / 2
            },
            update() {
                this.hidden = SpaceDog.currentView == 0 ? false : true;
                if (this.hovering) {
                    this.brightness = CONFIG.uiBrightnessChange;
                } else this.brightness = 1;
            },
            onClick() {
                ASSETS.audio.select[0].currentTime = 0;
                ASSETS.audio.select[0].play();

                SpaceDog.paused = !SpaceDog.paused;
            }
        }),
        PlayerSkinChange: new UIelement({
            name: "button_player_skin_change",
            layer: 64,
            cursor: 1,
            sprites: ASSETS.uiElements.arrow,
            start() {
                this.transform.height = SpaceDog.canvas.height / 12;
                this.transform.width = this.transform.height * this.sprites[0].naturalWidth / this.sprites[0].naturalHeight;
                this.transform.x = SpaceDog.canvas.width / 2.5;
                this.transform.y = SpaceDog.canvas.height / 2;
            },
            update() {
                this.hidden = SpaceDog.currentView == 2 ? false : true;
                if (this.hovering) {
                    this.brightness = CONFIG.uiBrightnessChange;
                } else this.brightness = 1;
            },
            onClick() {
                ASSETS.audio.select[0].currentTime = 0;
                ASSETS.audio.select[0].play();
                Player.skin = (Player.skin + 1) % ASSETS.sprites.skins.length;
                Player.sprites = ASSETS.sprites.skins[Player.skin];
                CONFIG.skinId = Player.skin;
                SpaceDog.DOMElements.favicon.href = ASSETS.uiElements.favicon[CONFIG.skinId].src;
                SpaceDog.LocalDataManager.save();
            }
        }),
        PetSkinChange: new UIelement({
            name: "button_pet_skin_change",
            layer: 64,
            cursor: 1,
            sprites: ASSETS.uiElements.arrow,
            start() {
                this.transform.height = SpaceDog.canvas.height / 12;
                this.transform.width = this.transform.height * this.sprites[0].naturalWidth / this.sprites[0].naturalHeight;
                this.transform.x = SpaceDog.canvas.width / 3;
                this.transform.y = SpaceDog.canvas.height / 1.31;
            },
            update() {
                this.hidden = SpaceDog.currentView == 2 && CONFIG.unlockedPets ? false : true;
                if (this.hovering) {
                    this.brightness = CONFIG.uiBrightnessChange;
                } else this.brightness = 1;
            },
            onClick() {
                Pet.skin = (Pet.skin + 1) % ASSETS.sprites.pets.length;
                Pet.sprites = ASSETS.sprites.pets[Pet.skin];
                Pet.currentSprite = 0;
                CONFIG.petSkinId = Pet.skin;
                Pet.resize();
                SpaceDog.LocalDataManager.save();
            }
        }),
    },
};

const BIOMES = [
    new Biome({
        name: `asteroid_belt`,
        backdrop: createGradient(SpaceDog.context, SpaceDog.canvas.height, "#041542", "#020a1d"),
        monsterSpawnInterval: randomBetween(120, 550, false),
        monsterSpawnTimelapse: 0,
        asteroidSpawnInterval: randomBetween(60, 100, false),
        asteroidSpawnTimelapse: 0,
        shooting: false,
        initialSpeed: 3,
        biomeRecord: { name: `asteroid_belt`, distance: 0 },
        entitiesParams: [
            {
                name: "mostro",
                sprites: ASSETS.sprites.enemies.monsterIdle,
                currentSprite: 0,
                animationInterval: 14,
                animationTime: 0,
                layer: 4,
                start() {
                    this.transform.width = SpaceDog.canvas.height / 6;
                    this.transform.height = this.transform.width;
                    this.transform.y = randomBetween(this.transform.height / 3 + this.transform.height, SpaceDog.canvas.height - this.transform.height / 3, false);
                    this.transform.x = SpaceDog.canvas.width + this.transform.width / 2;
                },
                update() {
                    this.animationTime += SpaceDog.deltaTime;
                    if (this.animationTime >= this.animationInterval) {
                        this.animationTime = 0;
                        this.currentSprite = (this.currentSprite + 1) % this.sprites.length;
                        if (this.shooting) {

                            if (!this.proyectile && this.currentSprite == this.sprites.length - 2) {
                                let monster = this;
                                let proyectile = new Entity({
                                    name: `monster_proyectile`,
                                    layer: 3,
                                    speed: 5,
                                    animationInterval: 12,
                                    animationTime: 0,
                                    sprites: ASSETS.sprites.proyectiles.monster,
                                    start() {
                                        this.transform.x = monster.transform.x;
                                        this.transform.y = monster.transform.y;
                                        this.transform.width = monster.transform.width / 2;
                                        this.transform.height = monster.transform.height / 2;
                                        this.transform.rotation = monster.transform.rotation;

                                        ASSETS.audio.effects[3].currentTime = 0;
                                        ASSETS.audio.effects[3].play();
                                    },
                                    update() {
                                        this.animationTime += SpaceDog.deltaTime;
                                        if (this.animationTime >= this.animationInterval) {
                                            this.animationTime = 0;
                                            this.currentSprite = (this.currentSprite + 1) % this.sprites.length;
                                        }
                                        this.transform.x -= (Math.cos(degToRad(this.transform.rotation)) * this.speed + 3) * SpaceDog.deltaTime * SpaceDog.resolutionFactor;
                                        this.transform.y -= (Math.sin(degToRad(this.transform.rotation)) * this.speed) * SpaceDog.deltaTime * SpaceDog.resolutionFactor;
                                        if (this.transform.x < this.transform.width * -1) {
                                            SpaceDog.deleteEntity(this);
                                        }

                                        let distanceX = this.transform.x - Player.transform.x;
                                        let distanceY = this.transform.y - Player.transform.y;

                                        let distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
                                        if (distance < (Player.transform.height / 2 + this.transform.height / 2)) {
                                            SpaceDog.gameOver();
                                        }
                                    },
                                });
                                monster.proyectile = proyectile;
                                proyectile.start();
                            } else if (this.currentSprite == this.sprites.length - 1) {
                                this.sprites = ASSETS.sprites.enemies.monsterIdle;
                                this.currentSprite = 0;
                                this.shooting = false;
                            }
                        }

                    }

                    this.transform.x -= 3 * SpaceDog.deltaTime * SpaceDog.resolutionFactor + Player.aditionalSpeed;

                    if (!SpaceDog.gameStarted) return;

                    let distanceX = this.transform.x - Player.transform.x;
                    let distanceY = this.transform.y - Player.transform.y;

                    if (distanceX < 0) this.flipped = true;

                    if (!this.proyectile && this.transform.x < Player.transform.x + SpaceDog.canvas.width / 2) {
                        this.sprites = ASSETS.sprites.enemies.monsterShooting;
                        if (!this.shooting) {
                            ASSETS.audio.effects[2].currentTime = 0;
                            ASSETS.audio.effects[2].play();
                        }
                        this.shooting = true;
                    }

                    this.transform.rotation = radToDeg(Math.atan(distanceY / distanceX)) * (this.flipped ? -1 : 1);
                    let distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
                    if (distance < (Player.transform.height / 2 + this.transform.height / 3)) {
                        SpaceDog.gameOver();
                    }
                    if (this.transform.x < 0 - this.transform.width) { SpaceDog.deleteEntity(this); }
                },
            },
            {
                name: "asteroid",
                sprites: ASSETS.sprites.asteroids.green,
                layer: 5,
                start() {
                    this.linearSpeed = randomBetween(3, 5, false);
                    this.rotationSpeed = randomBetween(-2.5, 2.5, false);
                    this.currentSprite = randomBetween(1, 3, true) == 1 ? 1 : 0;
                    this.transform.width = SpaceDog.canvas.height / 7 * (this.sprites[this.currentSprite].naturalHeight / 20) * randomBetween(0.8, 1.2, false);
                    this.transform.height = this.transform.width * this.sprites[this.currentSprite].naturalHeight / this.sprites[this.currentSprite].naturalWidth;
                    this.transform.y = randomBetween(this.transform.height / 2 + this.transform.height, SpaceDog.canvas.height - this.transform.height / 2, false);
                    this.transform.x = SpaceDog.canvas.width + this.transform.width / 2;
                },
                update() {
                    this.transform.x -= (this.linearSpeed + Player.aditionalSpeed) * SpaceDog.deltaTime * SpaceDog.resolutionFactor;
                    this.transform.rotation -= this.rotationSpeed * SpaceDog.deltaTime;

                    let distanceX = this.transform.x - Player.transform.x;
                    let distanceY = this.transform.y - Player.transform.y;

                    let distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
                    if (distance < Player.transform.height / 2 + this.transform.height / 3) {
                        SpaceDog.gameOver();
                    }
                    if (this.transform.x < 0 - this.transform.width) { SpaceDog.deleteEntity(this); }
                },
            },
        ],
        start() {
            PROPS.BackgroundProps.start();
            let biomeRecord;
            CONFIG.kilometersRecords.forEach(b => { if (b && b.name == this.name) { biomeRecord = b; } });
            if (!biomeRecord) { CONFIG.kilometersRecords.push(this.biomeRecord); SpaceDog.LocalDataManager.save() }
            else { this.biomeRecord = biomeRecord }
        },
        update() {
            if (SpaceDog.gameStarted) {
                this.monsterSpawnTimelapse += 1 * SpaceDog.deltaTime;
                if (this.monsterSpawnTimelapse >= this.monsterSpawnInterval) {
                    this.monsterSpawnTimelapse = 0;
                    let entity = new Entity(this.entitiesParams[0]);
                    entity.start();
                    this.monsterSpawnInterval = randomBetween(120, 750, false);
                }
                this.asteroidSpawnTimelapse += 1 * SpaceDog.deltaTime;
                if (this.asteroidSpawnTimelapse >= this.asteroidSpawnInterval) {
                    this.asteroidSpawnTimelapse = 0;
                    let entity = new Entity(this.entitiesParams[1]);
                    entity.start();
                    this.asteroidSpawnInterval = randomBetween(60, 100, false);
                }
            }
        },
    }),
    new Biome({
        name: `gas_giants`,
        backdrop: createGradient(SpaceDog.context, SpaceDog.canvas.height, "#162129", "#050505"),
        monsterSpawnInterval: randomBetween(240, 1300, false),
        monsterSpawnTimelapse: 0,
        mosquitoSpawnInterval: randomBetween(240, 1200, false),
        mosquitoSpawnTimelapse: 0,
        asteroidSpawnInterval: randomBetween(20, 60, false),
        asteroidSpawnTimelapse: 0,
        shooting: false,
        initialSpeed: 5,
        biomeRecord: { name: `gas_giants`, distance: 0 },
        entitiesParams: [
            {
                name: "mostro",
                sprites: ASSETS.sprites.enemies.rockMonsterIdle,
                currentSprite: 0,
                animationInterval: 14,
                animationTime: 0,
                layer: 4,
                start() {
                    this.transform.width = SpaceDog.canvas.height / 6;
                    this.transform.height = this.transform.width;
                    this.transform.y = randomBetween(this.transform.height / 3 + this.transform.height, SpaceDog.canvas.height - this.transform.height / 3, false);
                    this.transform.x = SpaceDog.canvas.width + this.transform.width / 2;
                },
                update() {
                    this.animationTime += SpaceDog.deltaTime;
                    if (this.animationTime >= this.animationInterval) {
                        this.animationTime = 0;
                        this.currentSprite = (this.currentSprite + 1) % this.sprites.length;
                        if (this.shooting) {
                            if (!this.proyectile && this.currentSprite == this.sprites.length - 2) {
                                let monster = this;
                                let proyectile = new Entity({
                                    name: `monster_proyectile`,
                                    layer: 5,
                                    speed: 6.5,
                                    animationInterval: 12,
                                    animationTime: 0,
                                    sprites: ASSETS.sprites.proyectiles.monster,
                                    start() {
                                        this.transform.x = monster.transform.x;
                                        this.transform.y = monster.transform.y;
                                        this.transform.width = monster.transform.width / 2;
                                        this.transform.height = monster.transform.height / 2;
                                        this.transform.rotation = monster.transform.rotation;

                                        ASSETS.audio.effects[3].currentTime = 0;
                                        ASSETS.audio.effects[3].play();
                                    },
                                    update() {
                                        this.animationTime += SpaceDog.deltaTime;
                                        if (this.animationTime >= this.animationInterval) {
                                            this.animationTime = 0;
                                            this.currentSprite = (this.currentSprite + 1) % this.sprites.length;
                                        }
                                        this.transform.x -= (Math.cos(degToRad(this.transform.rotation)) * this.speed + 3) * SpaceDog.deltaTime * SpaceDog.resolutionFactor;
                                        this.transform.y -= (Math.sin(degToRad(this.transform.rotation)) * this.speed) * SpaceDog.deltaTime * SpaceDog.resolutionFactor;
                                        if (this.transform.x < this.transform.width * -1) {
                                            SpaceDog.deleteEntity(this);
                                        }

                                        let distanceX = this.transform.x - Player.transform.x;
                                        let distanceY = this.transform.y - Player.transform.y;

                                        let distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
                                        if (distance < (Player.transform.height / 3 + this.transform.height / 3)) {
                                            SpaceDog.gameOver();
                                        }
                                    },
                                });
                                monster.proyectile = proyectile;
                                proyectile.start();
                            } else if (this.currentSprite == this.sprites.length - 1) {
                                this.sprites = ASSETS.sprites.enemies.rockMonsterIdle;
                                this.currentSprite = 0;
                                this.shooting = false;
                            }
                        }

                    }

                    this.transform.x -= (5 + Player.aditionalSpeed) * SpaceDog.deltaTime * SpaceDog.resolutionFactor;;

                    if (!SpaceDog.gameStarted) return;

                    let distanceX = this.transform.x - Player.transform.x;
                    let distanceY = this.transform.y - Player.transform.y;

                    if (distanceX < 0) this.flipped = true;

                    if (!this.proyectile && this.transform.x < Player.transform.x + SpaceDog.canvas.width / 2) {
                        this.sprites = ASSETS.sprites.enemies.rockMonsterShooting;
                        if (!this.shooting) {
                            ASSETS.audio.effects[2].currentTime = 0;
                            ASSETS.audio.effects[2].play();
                        }
                        this.shooting = true;
                    }

                    this.transform.rotation = radToDeg(Math.atan(distanceY / distanceX)) * (this.flipped ? -1 : 1);
                    let distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
                    if (distance < (Player.transform.height / 2 + this.transform.height / 2)) {
                        SpaceDog.gameOver();
                    }
                    if (this.transform.x < 0 - this.transform.width) { SpaceDog.deleteEntity(this); }
                },
            },
            {
                name: "asteroid",
                sprites: ASSETS.sprites.asteroids.gray,
                layer: 5,
                start() {
                    this.linearSpeed = randomBetween(5, 8, false);
                    this.rotationSpeed = randomBetween(-2.5, 2.5, false);
                    this.currentSprite = randomBetween(1, 3, true) == 1 ? 1 : 0;
                    this.transform.width = SpaceDog.canvas.height / 7 * (this.sprites[this.currentSprite].naturalHeight / 20) * randomBetween(0.8, 1.2, false);
                    this.transform.height = this.transform.width * this.sprites[this.currentSprite].naturalHeight / this.sprites[this.currentSprite].naturalWidth;
                    this.transform.y = randomBetween(this.transform.height / 2 + this.transform.height, SpaceDog.canvas.height - this.transform.height / 2, false);
                    this.transform.x = SpaceDog.canvas.width + this.transform.width / 2;
                },
                update() {
                    this.transform.x -= (this.linearSpeed + Player.aditionalSpeed) * SpaceDog.deltaTime * SpaceDog.resolutionFactor;
                    this.transform.rotation -= this.rotationSpeed * SpaceDog.deltaTime;

                    let distanceX = this.transform.x - Player.transform.x;
                    let distanceY = this.transform.y - Player.transform.y;

                    let distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
                    if (distance < this.transform.height) {
                        SpaceDog.gameOver();
                    }
                    if (this.transform.x < 0 - this.transform.width) { SpaceDog.deleteEntity(this); }
                },
            },
            {
                name: "mosquito",
                sprites: ASSETS.sprites.enemies.mosquito,
                layer: 5,
                start() {
                    this.speed = 4;
                    this.currentSprite = 0;
                    this.transform.width = SpaceDog.canvas.height / 10 * (this.sprites[this.currentSprite].naturalHeight / 20);
                    this.transform.height = this.transform.width * this.sprites[this.currentSprite].naturalHeight / this.sprites[this.currentSprite].naturalWidth;
                    this.transform.y = randomBetween(this.transform.height / 2 + this.transform.height, SpaceDog.canvas.height - this.transform.height / 2, false);
                    this.transform.x = SpaceDog.canvas.width + this.transform.width / 2;
                },
                update() {
                    if (SpaceDog.gameStarted) {
                        let distanceX = this.transform.x - Player.transform.x;
                        let distanceY = this.transform.y - Player.transform.y;

                        if (distanceX < 0) this.flipped = true;
                        this.transform.rotation = radToDeg(Math.atan(distanceY / distanceX)) * (this.flipped ? -1 : 1);

                        this.transform.x -= (Math.cos(degToRad(this.transform.rotation)) * this.speed + 5 + Player.aditionalSpeed) * SpaceDog.deltaTime * SpaceDog.resolutionFactor;
                        this.transform.y -= (Math.sin(degToRad(this.transform.rotation)) * this.speed) * SpaceDog.deltaTime * SpaceDog.resolutionFactor;

                        let distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
                        if (distance < this.transform.height) {
                            SpaceDog.gameOver();
                        }
                    } else {
                        this.transform.x -= (7 + Player.aditionalSpeed) * SpaceDog.deltaTime * SpaceDog.resolutionFactor;
                    }
                    if (this.transform.x < 0 - this.transform.width) { SpaceDog.deleteEntity(this); }
                },
            },
        ],
        start() {
            PROPS.BackgroundProps.start();
            let biomeRecord;
            CONFIG.kilometersRecords.forEach(b => { if (b && b.name == this.name) { biomeRecord = b; } });
            if (!biomeRecord) { CONFIG.kilometersRecords.push(this.biomeRecord); SpaceDog.LocalDataManager.save() }
            else { this.biomeRecord = biomeRecord }
        },
        update() {
            if (SpaceDog.gameStarted) {
                this.monsterSpawnTimelapse += 1 * SpaceDog.deltaTime;
                if (this.monsterSpawnTimelapse >= this.monsterSpawnInterval) {
                    this.monsterSpawnTimelapse = 0;
                    let entity = new Entity(this.entitiesParams[0]);
                    entity.start();
                    this.monsterSpawnInterval = randomBetween(240, 1300, false);
                }
                this.asteroidSpawnTimelapse += 1 * SpaceDog.deltaTime;
                if (this.asteroidSpawnTimelapse >= this.asteroidSpawnInterval) {
                    this.asteroidSpawnTimelapse = 0;
                    let entity = new Entity(this.entitiesParams[1]);
                    entity.start();
                    this.asteroidSpawnInterval = randomBetween(120, 60, false);
                }
                this.mosquitoSpawnTimelapse += 1 * SpaceDog.deltaTime;
                if (this.mosquitoSpawnTimelapse >= this.mosquitoSpawnInterval) {
                    this.mosquitoSpawnTimelapse = 0;
                    let entity = new Entity(this.entitiesParams[2]);
                    entity.start();
                    this.mosquitoSpawnInterval = randomBetween(240, 1200, false);
                }
            }
        },
    }),
]



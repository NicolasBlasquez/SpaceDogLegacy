"use strict"

class Transform {
    constructor(params) {
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.rotation = 0;
        this.speed = [0, 0];
        this.angularMomentum = 0;

        Object.assign(this, params);
    }
}

class Entity {
    constructor(params) {
        this.transform = new Transform();
        this.name = "";
        this.layer = 0;
        this.flipped = false;

        this.opacity = 1;
        this.brightness = 1;

        this.sprites = [];
        this.currentSprite = 0;
        this.hidden = false;
        this.cursor = 0;

        this.type = "entity";

        this.hovering = false;

        Object.assign(this, params);

        if (this.type == "entity" || this.type == "ui_element") { SpaceDog.addEntity(this); }
    }

    // Default functions
    start() { }
    update() { }
    render() {
        let ctx = SpaceDog.context;
        if (!this.hidden) {
            try {
                ctx.save();
                ctx.globalAlpha = this.opacity < 0 ? 0 : this.opacity;
                ctx.filter = `brightness(${this.brightness * 100}%)`;
                ctx.translate(this.transform.x, this.transform.y);
                if (this.flipped) ctx.scale(-1, 1);
                ctx.rotate(degToRad(this.transform.rotation));
                ctx.translate(0 - this.transform.width / 2, 0 - this.transform.height / 2);
                ctx.drawImage(this.sprites[this.currentSprite], 0, 0, this.transform.width, this.transform.height);
                ctx.restore();
            } catch (e) {
                console.log(e);
            }
        }
    }

    // Events
    onClick() { }
    onMouseMove() { }
    onMouseDown() { }
    onMouseUp() { }
}

class Particle extends Entity {
    constructor(params) {
        super(Object.assign(params, {
            type: "particle"
        }));
        SpaceDog.addParticle(this);
    }
}

// UI elements

class UIelement extends Entity {
    constructor(params) {
        super(Object.assign(params, {
            type: "ui_element"
        }));
    }
}

class Toggle extends UIelement {
    constructor(params) {
        super(Object.assign({}, {
            layer: 64,
            cursor: 1,
            views: [2],
            text: "Sample Text",
            state: false,
            sprites: ASSETS.uiElements.toggle,
        }, params));

    }
    render() {
        if (this.views.indexOf(SpaceDog.currentView) == -1) return;
        let ctx = SpaceDog.context;
        try {
            ctx.save();
            ctx.translate(this.transform.x - this.transform.width / 2, this.transform.y - this.transform.height / 2);
            ctx.drawImage(this.sprites[this.currentSprite], 0, 0, this.transform.width, this.transform.height);
            ctx.restore();
            SpaceDog.context.fillStyle = "white";
            SpaceDog.context.font = `${this.transform.height / 2}px 'pixelFont'`;
            SpaceDog.context.fillText(this.text, this.transform.x + this.transform.width / 1.2, this.transform.y + this.transform.height / 2);

        } catch (e) {
            console.log(e);
        }

    }
}

class RangeBar extends UIelement {
    constructor(params) {
        super(Object.assign({}, {
            layer: 64,
            cursor: 0,
            views: [2],
            text: "Sample text",
            steps: undefined,
            min: 0,
            max: 100,
            value: params.steps ? params.steps[0] : 0,
            seeking: false,
            sprites: [ASSETS.uiElements.range[0]],
        }, params));

        let range = this;

        this.handle = new UIelement({
            name: `${this.name}_handle`,
            parent: range,
            layer: 65,
            cursor: 2,
            sprites: [ASSETS.uiElements.range[1]],
            seekingValue: range.value,
            checkLimits() {
                if (this.transform.x < this.parent.transform.x - this.parent.transform.width / 2 + this.transform.width / 2) {
                    this.transform.x = this.parent.transform.x - this.parent.transform.width / 2 + this.transform.width / 2
                } else if (this.transform.x > this.parent.transform.x + this.parent.transform.width / 2 - this.transform.width / 2) {
                    this.transform.x = this.parent.transform.x + this.parent.transform.width / 2 - this.transform.width / 2
                }
            },
            start() {
                this.transform.width = this.parent.transform.height;
                this.transform.height = this.parent.transform.height;
                this.transform.y = this.parent.transform.y;
            },
            onMouseDown() {
                this.parent.seeking = true;
                SpaceDog.Cursor.changeCursor(3);
                SpaceDog.Cursor.globalCursor = 3;
            },
            update() {
                this.hidden = SpaceDog.currentView == 2 ? false : true;

                if (this.parent.seeking && !this.hidden) {

                    this.coordinates = SpaceDog.Cursor.transform.x - this.parent.transform.x + this.parent.transform.width / 2;

                    if (this.coordinates < 0) {
                        this.coordinates = 0;
                    } else if (this.coordinates > this.parent.transform.width) {
                        this.coordinates = this.parent.transform.width;
                    }

                    this.transform.x = SpaceDog.Cursor.transform.x;
                    if (this.parent.steps && this.parent.steps.length > 1) {
                        let distance = this.parent.transform.width / (this.parent.steps.length - 1);
                        this.seekingValue = this.parent.steps[Math.round(this.coordinates / distance)];
                        this.transform.x = this.parent.transform.x - this.parent.transform.width / 2 + distance * Math.round(this.coordinates / distance);
                    } else {
                        this.seekingValue = Math.round(this.coordinates / this.parent.transform.width * (this.parent.max - this.parent.min) + this.parent.min);
                    }

                    this.checkLimits();
                } else {
                    if (this.parent.steps) {
                        this.transform.x = this.parent.transform.x - this.parent.transform.width / 2 + this.parent.transform.width * (this.parent.steps.indexOf(this.parent.value) / (this.parent.steps.length - 1))
                    } else {
                        this.transform.x = this.parent.transform.x - this.parent.transform.width / 2 + this.parent.transform.width * (typeof this.parent.value == "number" ? range.value : 0) / ((this.parent.max - this.parent.min) + this.parent.min)
                    }
                    this.checkLimits();
                }
            },
        });

    }
    render() {
        if (this.views.indexOf(SpaceDog.currentView) == -1) return;

        let ctx = SpaceDog.context;
        try {
            ctx.save();
            ctx.translate(this.transform.x - this.transform.width / 2, this.transform.y - this.transform.height / 2);

            SpaceDog.context.fillStyle = "white";
            SpaceDog.context.font = `${this.transform.height / 2}px 'pixelFont'`;
            SpaceDog.context.fillText(this.text, 3, 0);

            SpaceDog.context.font = `${this.transform.height / 3}px 'pixelFont'`;
            if (this.value) SpaceDog.context.fillText(this.seeking ? (this.handle.seekingValue.displayText ? this.handle.seekingValue.displayText : this.handle.seekingValue) : (this.value.displayText ? this.value.displayText : this.value), 3, this.transform.height * 1.75);


            ctx.drawImage(this.sprites[0], 0, 0, this.transform.width, this.transform.height);
            ctx.restore();
        } catch (e) {
            console.log(e);
        }

    }
    onMouseUp() {
        if (!this.seeking) return;
        this.seeking = false;
        SpaceDog.Cursor.globalCursor = undefined;
        SpaceDog.onMouseMove(SpaceDog);
        let coordinates = this.handle.coordinates;

        // Modify according to steps

        if (coordinates < 0) {
            coordinates = 0;
        } else if (coordinates > this.transform.width) {
            coordinates = this.transform.width;
        }

        if (this.steps && this.steps.length > 1) {
            let distance = this.transform.width / (this.steps.length - 1);
            this.value = this.steps[Math.round(coordinates / distance)];
        } else {
            this.value = Math.round(coordinates / this.transform.width * (this.max - this.min) + this.min);
        }

        this.callback(this.value);
    }

    get value() {
        return this._value;
    }

    set value(newValue) {
        if (this.steps) {
            this._value = this.steps.filter(r => r.width == newValue.width && r.height == newValue.height)[0];
        } else {
            this._value = newValue;
        }
    }
}

class Biome {
    constructor(params) {
        this.name = `New Biome`;
        this.backdrop = createGradient(SpaceDog.context, SpaceDog.canvas.height, "#000", "#000");
        Object.assign(this, params);
        SpaceDog.biomes.push(this);
    }
    start() {

    }
    update() {
        
    }
}

class Console {
    constructor(params) {
        Object.assign(this, params);
        this.writing = false;
        this.messages = [];
        this.consoleLog = [];
        this.blinkingInterval = 20;
        this.blinkingCounter = 0;
        this.commands = [
            {
                name: "reset",
                arguments: [],
            }
        ];
        this.prompt = "";
    }
    logMessage(message) {
        let consoleObject = this;
        this.consoleLog.push(message);
        let line = new UIelement({
            name: `console_message_${this.consoleLog.length}`,
            text: message,
            layer: 64,
            start() {
                let messageObject = this;
                this.transform.height = SpaceDog.canvas.height / 110;
                this.transform.y = SpaceDog.canvas.height - this.transform.height;

                setTimeout(() => {
                    consoleObject.messages = consoleObject.messages.filter(e => e != messageObject);
                    SpaceDog.deleteEntity(this);
                }, CONFIG.consoleMessageDuration);
                
            },
            render() {
                SpaceDog.context.save();
                SpaceDog.context.fillStyle = "white";
                SpaceDog.context.translate(20, this.transform.y);
                SpaceDog.context.font = `${this.transform.height * 2}px 'pixelFont'`;
                SpaceDog.context.fillText(`> ${this.text}`, 0, 0 - (this.transform.height * 4 * (consoleObject.messages.indexOf(this) + (consoleObject.writing ? 1 : 0))));
                SpaceDog.context.restore();
            },
        });
        consoleObject.messages = [line, ...consoleObject.messages];
        line.start();
    }
    startWriting() {
        let consoleObject = this;
        this.writing = true;
        this.promptLine = new UIelement({
            name: `console_message_${this.consoleLog.length}`,
            layer: 64,
            blinkingCounter: 0,
            blinkingInterval: 200,
            start() {
                this.transform.height = SpaceDog.canvas.height / 110;
                this.transform.y = SpaceDog.canvas.height - this.transform.height
            },
            render() {
                this.blinkingCounter = this.blinkingCounter + SpaceDog.deltaTime;
                if (this.blinkingCounter >= this.blinkingInterval) {
                    this.blinkingCounter = 0;
                }
                SpaceDog.context.save();
                SpaceDog.context.fillStyle = "white";
                SpaceDog.context.translate(20, this.transform.y);
                SpaceDog.context.font = `${this.transform.height * 2}px 'pixelFont'`;
                SpaceDog.context.fillText(`> ${consoleObject.prompt}${(this.blinkingCounter >= this.blinkingInterval / 2) ? "_" : ""}`, 0, 0);
                SpaceDog.context.restore();
            },
        });
        this.promptLine.start();
    }
    sendPrompt() {
        if (false) {
            //Procesamiento de comandos   
        }
        this.logMessage(this.prompt);
        SpaceDog.deleteEntity(this.promptLine);
        this.prompt = "";
        this.writing = false;
    }
}

SpaceDog.Console = new Console();

SpaceDog.Console.logMessage(`Assets loaded`);
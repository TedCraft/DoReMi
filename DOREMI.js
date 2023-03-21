class ServiceVariables {
    constructor(input = []) {
        this._stack = {};
        this._index = 0;
        this.output = [];
        this._input = input;
        this._inputIndex = 0;
        this.iteration = 0;
        this.returnTo = [];
        this.jumpTo = [];
        this.skip = false;
        this.skipCondition = { statement: false, elseCount: 0, count: 0 };
    }

    get index() { return this._index }
    set index(i) {
        if (i < 0) throw new RangeError(`Index cannot be under 0!`);
        this._index = i;
    }

    get stack() {
        return this._stack[this._index] || 0;
    }
    set stack(value) {
        value != 0 ? this._stack[this._index] = value : delete this._stack[this._index];
    }
    get next() {
        return this._stack[this._index + 1] || 0;
    }

    stackWithOffset(offset) {
        return this._stack[this._index + offset] || 0;
    }

    get input() {
        this._inputIndex++;
        return this._input[this._inputIndex - 1] || 0;
    }

    return() {
        if (this.returnTo[0])
            this.iteration = (this.returnTo.pop() || this.iteration) - 1;
        else this.jumpTo.shift();
    }

    jump() {
        if (this.jumpTo[0])
            this.iteration = this.jumpTo.shift();
        else this.skip = true;
    }
}

class Note {
    constructor(note, additions) {
        Note.checkFormatNote(note, additions.alteration, additions.mood, additions.octave);
        this.note = note;
        this.alteration = additions.alteration;
        this.mood = additions.mood;
        this.octave = additions.octave;
    }

    execute(serviceVariables, config = Note.defaultConfig) {
        // console.log(serviceVariables)
        if (!serviceVariables.skip && !serviceVariables.skipCondition.statement) {
            const commands = [Note.defaultCommands.notes];
            if (this.mood)
                this.mood === Note.MOODS.m.name ?
                    commands.push(Note.defaultCommands.moods) : commands.unshift(Note.defaultCommands.moods);
            if (this.alteration)
                this.alteration === Note.ALTERATIONS.b.name ?
                    commands.push(Note.defaultCommands.alterations) : commands.unshift(Note.defaultCommands.alterations);

            commands.forEach(command => command(this, serviceVariables, config, commands));
        }

        else if (serviceVariables.skipCondition.statement) {
            if (this.note === Note.NOTES.F.name) {
                switch (this.octave) {
                    case Note.OCTAVES[4].name:
                        break;

                    case Note.OCTAVES[0].name:
                    case Note.OCTAVES[8].name:
                        serviceVariables.skipCondition.statement = false;
                        serviceVariables.iteration--;
                        break;

                    default:
                        serviceVariables.skipCondition.count++;

                }
            }
            if (this.note === Note.ALTERATIONS["#"].name) {
                serviceVariables.skipCondition.count++;
            }
        }

        if (this.alteration === Note.ALTERATIONS.b.name) {
            serviceVariables.skip = false;

            if (serviceVariables.skipCondition.count > 0) serviceVariables.skipCondition.count--;
            else serviceVariables.skipCondition.statement = false;

            if (serviceVariables.skipCondition.elseCount > 0) serviceVariables.skipCondition.elseCount--;
        }
        serviceVariables.iteration++;
    }

    static defaultCommands = {
        notes: (noteClass, serviceVariables) => Note.NOTES[noteClass.note](serviceVariables, noteClass.octave),
        moods: (noteClass, serviceVariables, config) => Note.MOODS[noteClass.mood](serviceVariables, config === Note.defaultConfig ?
            Note.standartConfig(serviceVariables) : { ...Note.standartConfig(serviceVariables), ...config }),
        alterations: (noteClass, serviceVariables, _, commands) => Note.ALTERATIONS[noteClass.alteration](serviceVariables, commands, noteClass.note)
    }

    static calc(serviceVariables, octave, operation1, operation2, number) {
        if (octave) serviceVariables.stack = eval(serviceVariables.stack + operation1 + serviceVariables.stackWithOffset(parseInt(octave)));
        else serviceVariables.stack = eval(serviceVariables.stack + operation2 + number);
    }

    static NOTES = {
        C: (serviceVariables, octave) => {
            if (!serviceVariables.next
                || serviceVariables.next === 0)
                throw new EvalError(`Cannot divide by zero!`);
            this.calc(serviceVariables, octave, "/", "%", serviceVariables.next);
        },
        D: (serviceVariables, octave) => {
            this.calc(serviceVariables, octave, "-", "-", 1);
        },
        E: (serviceVariables, octave) => {
            this.calc(serviceVariables, octave, "+", "+", 1);
        },
        F: (serviceVariables, octave) => {
            if (octave) Note.OCTAVES[octave](serviceVariables);
            else Note.skipCondition(serviceVariables, serviceVariables.stack != 0);
        },
        G: (serviceVariables, octave) => {
            this.calc(serviceVariables, octave, "*", "*", 0);
        },
        A: (serviceVariables, octave) => {
            if (octave) serviceVariables.index -= parseInt(octave);
            else serviceVariables.index -= serviceVariables.stack;
        },
        B: (serviceVariables, octave) => {
            if (octave) serviceVariables.index += parseInt(octave);
            else serviceVariables.index += serviceVariables.stack;
        }
    }

    static ALTERATIONS = {
        "#": (serviceVariables, commands) => {
            serviceVariables.skipCondition.count++;
            serviceVariables.skipCondition.elseCount++;

            if (serviceVariables.stack != 0) {
                serviceVariables.returnTo.push(serviceVariables.iteration);
                serviceVariables.jumpTo.shift();
            }
            else {
                serviceVariables.jump();
                commands.splice(0, commands.length);
            }
        },
        "b": (serviceVariables) => {
            serviceVariables.jumpTo.unshift(serviceVariables.iteration);
            serviceVariables.return();
        }
    }

    static MOODS = {
        M: (serviceVariables, config) => {
            serviceVariables.stack = typeof config.inputMethod === "function" ?
                config.inputMethod(config) : config.inputMethod;
        },
        m: (_, config) => {
            typeof config.outputArgs === "function" ?
                config.outputMethod(config.outputArgs(config)) : config.outputMethod(config.outputArgs);
        }
    }

    static skipCondition(serviceVariables, condition) {
        if (!condition) {
            serviceVariables.skipCondition.statement = true;
        }
        else {
            serviceVariables.skipCondition.elseCount++;
        }
    }

    static OCTAVES = {
        0: (serviceVariables) => {

        },
        1: (serviceVariables) => {
            this.skipCondition(serviceVariables, serviceVariables.stack <= serviceVariables.next);
        },
        2: (serviceVariables) => {
            this.skipCondition(serviceVariables, serviceVariables.stack < serviceVariables.next);
        },
        3: (serviceVariables) => {
            this.skipCondition(serviceVariables, serviceVariables.stack == serviceVariables.next);
        },
        4: (serviceVariables) => {
            if (serviceVariables.skipCondition.elseCount > 0) serviceVariables.skipCondition.statement = true;
        },
        5: (serviceVariables) => {
            this.skipCondition(serviceVariables, serviceVariables.stack != serviceVariables.next);
        },
        6: (serviceVariables) => {
            this.skipCondition(serviceVariables, serviceVariables.stack > serviceVariables.next);
        },
        7: (serviceVariables) => {
            this.skipCondition(serviceVariables, serviceVariables.stack >= serviceVariables.next);
        },
        8: (serviceVariables) => {

        }
    }

    static defaultConfig = {
        outputMethod: undefined,
        outputArgs: undefined,
        inputMethod: undefined,
        inputArgs: undefined
    }

    static setConfig(config) {
        Note.standartConfig = (serviceVariables) => ({
            ...{
                outputMethod: (outputArgs) => {
                    outputArgs.output.push(outputArgs.stack);
                },
                outputArgs: (config) => config.serviceVariables,
                inputMethod: (config) => {
                    return config.serviceVariables.input;
                },
                inputArgs: undefined,
                serviceVariables: serviceVariables
            }, ...config
        });
    }

    static standartConfig(serviceVariables) {
        return {
            outputMethod: (outputArgs) => {
                outputArgs.output.push(outputArgs.stack);
            },
            outputArgs: (config) => config.serviceVariables,
            inputMethod: (config) => {
                return config.serviceVariables.input;
            },
            inputArgs: undefined,
            serviceVariables: serviceVariables
        }
    }

    static findInObject(object, string) {
        return Object.keys(object).find(elem => elem === string);
    }

    static checkFormatNote(note, alteration, mood, octave) {
        if (!note)
            throw new TypeError(`Note cannot be undefined!`);
        if (!this.NOTES.hasOwnProperty(note))
            throw new TypeError(`Note must be in ${Object.keys(this.NOTES)}`);
        if (alteration && !this.ALTERATIONS.hasOwnProperty(alteration))
            throw new TypeError(`Alteration must be ${Object.keys(this.ALTERATIONS)[0]} or ${Object.keys(this.ALTERATIONS)[1]}`);
        if (mood && !this.MOODS.hasOwnProperty(mood))
            throw new TypeError(`Mood must be ${Object.keys(this.MOODS)[0]} or ${Object.keys(this.MOODS)[1]}`);
        if (octave && !this.OCTAVES.hasOwnProperty(octave))
            throw new TypeError(`Octave must be in ${Object.keys(this.OCTAVES)}`);
    }

    static checkFormatString(noteString) {
        if (noteString.length === 0 || noteString.length > 4) throw new TypeError(`Сommand "${noteString}" have incorrect format!`);

        if (!this.NOTES.hasOwnProperty(noteString[0]))
            throw new SyntaxError(`Command "${noteString}" have incorrect syntax! First argument must be in [${Object.keys(this.NOTES)}]!`);

        if (noteString[1] && !(
            this.ALTERATIONS.hasOwnProperty(noteString[1])
            || this.MOODS.hasOwnProperty(noteString[1])
            || this.OCTAVES.hasOwnProperty(noteString[1])))
            throw new SyntaxError(`Command "${noteString}" have incorrect syntax! Second argument must be in [${Object.keys(this.ALTERATIONS)}] or [${Object.keys(this.MOODS)}] or [${Object.keys(this.OCTAVES)}]`);

        if (noteString[2]) {
            if (this.ALTERATIONS.hasOwnProperty(noteString[1])) {
                if (!(
                    this.MOODS.hasOwnProperty(noteString[2])
                    || this.OCTAVES.hasOwnProperty(noteString[2])))
                    throw new SyntaxError(`Command "${noteString}" have incorrect syntax! Third argument must be in [${Object.keys(this.MOODS)}] or [${Object.keys(this.OCTAVES)}]`);
            }
            else if (this.MOODS.hasOwnProperty(noteString[1])) {
                if (!(this.OCTAVES.hasOwnProperty(noteString[2])))
                    throw new SyntaxError(`Command "${noteString}" have incorrect syntax! Third argument must be in [${Object.keys(this.OCTAVES)}]`);
            }
            else throw new TypeError(`Сommand "${noteString}" have incorrect format!`);
        }

        if (noteString[3]) {
            if (this.MOODS.hasOwnProperty(noteString[2])) {
                if (!(this.OCTAVES.hasOwnProperty(noteString[3])))
                    throw new SyntaxError(`Command "${noteString}" have incorrect syntax! Fourth argument must be in [${Object.keys(this.OCTAVES)}]`);
            }
            else throw new TypeError(`Сommand "${noteString}" have incorrect format!`);
        }
    }

    static fromString(noteString) {
        this.checkFormatString(noteString);
        const note = noteString[0];
        const alteration = this.findInObject(this.ALTERATIONS, noteString[1]);
        const mood = this.findInObject(this.MOODS, noteString[1]) || this.findInObject(this.MOODS, noteString[2]);
        const octave = this.findInObject(this.OCTAVES, noteString[1]) || this.findInObject(this.OCTAVES, noteString[2]) || this.findInObject(this.OCTAVES, noteString[3]);
        return new Note(note, { alteration: alteration, mood: mood, octave: octave });
    }
}

class DoReMi {
    constructor(notes = [], input = [], run = true) {
        this.notes = notes;
        this.serviceVariables = new ServiceVariables(input);
        if (run) this.run();
    }

    run(iterative = false) {
        const iterArray = [];
        while (this.serviceVariables.iteration < this.notes.length) {
            if(iterative) iterArray.push(this.notes[this.serviceVariables.iteration]); 
            this.notes[this.serviceVariables.iteration].execute(this.serviceVariables)
        }
        return iterArray;
    }

    get output() {
        return this.serviceVariables.output;
    }

    static setConfig(config) {
        Note.setConfig(config);
    }

    static convertOutputToString(output) {
        return String.fromCharCode(...output);
    }

    static parse(notes = [new Note()], keep = []) {
        notes = [...notes]
        const ast = keep;
        let idx = 0;
        let del = 0;
        for (let i = 0; i < notes.length; i++) {
            const note = notes[i];

            const nToken = {
                type: "note",
                cmd: note.note,
                octave: note.octave
            };
            if (note.note === Note.NOTES.F.name) {
                if (!(note.octave === "4")) {
                    const body = DoReMi.parse(notes.slice(idx + 1));
                    nToken.true = body.ast;
                    notes.splice(idx + 1, body.idx + body.del);
                    del += body.idx + 1 + body.del;

                    if (body.else) {
                        const eBody = DoReMi.parse(notes.slice(idx + 1));
                        nToken.false = eBody.ast;
                        notes.splice(idx + 1, eBody.idx + eBody.del);
                        del += eBody.idx + 1 + eBody.del;
                    }
                }
                else {
                    return { ast: ast, idx: idx + 1, del: del, else: true };
                }
            }
            const arr = [nToken];

            if (note.mood) {
                const cmd = {
                    type: "mood",
                    cmd: note.mood
                };
                note.mood === Note.MOODS.m.name ?
                    arr.push(cmd) : arr.unshift(cmd);
            }

            if (note.alteration) {
                if (note.alteration === Note.ALTERATIONS["#"].name) {
                    const body = DoReMi.parse(notes.slice(idx + 1), arr);
                    ast.push({ type: "alt", cmd: note.alteration, prog: body.ast });
                    notes.splice(idx + 1, body.idx + body.del)
                    del += body.idx + 1 + body.del;
                    continue;
                }
                else {
                    arr.forEach(elem => ast.push(elem));
                    return { ast: ast, idx: idx + 1, del: del };
                }
            }

            arr.forEach(elem => ast.push(elem));
            idx++;
        }
        return ast;
    }

    static fromString(string, input = [], run = true) {
        const arr = string.trim().split(/\s+/);
        const notes = [];
        arr.forEach(elem => notes.push(Note.fromString(elem)));
        return new DoReMi(notes, input, run);
    }
}

// const serviceVariables = new ServiceVariables();

// const note = Note.fromString("B#m1");
// note
// const note2 = new Note("E", { alteration: 'b', mood: 'M' });
// note2
// const note3 = Note.fromString("Gm")

// // Note.setConfig({ outputMethod: console.log, outputArgs: (config) => config.serviceVariables.stack });
// //Note.setConfig({ outputMethod: console.log, outputArgs: serviceVariables.stack });

// serviceVariables
// note.execute(serviceVariables)//, {outputMethod: console.log, outputArgs: serviceVariables.stack})
// serviceVariables
// note2.execute(serviceVariables)//, { inputMethod: 5 })
// serviceVariables
// note3.execute(serviceVariables)
// serviceVariables

// const test = DoReMi.fromString(`B5 E E E A1 E1 D G1 E A1 E2 E1 A3 E3 G4 E Em B2 E1 G0 Em Em2 Am0 Em3 A1 E4 G2 E Em A1 E3 E4 D Dm Bm2 Em3 D1 E3 Em D2 Dm A1 Em Bm2`);
// console.log(test.output)
// console.log(DoReMi.convertOutputToString(test.output))

// const test2 = DoReMi.fromString(`BM0 D# Ab0 Bm0`, []);
// console.log(test2.output)

// const test3 = DoReMi.fromString(`F3 E F4 Db Bm0`);
// console.log(test3.output)
// console.log(DoReMi.convertOutputToString(test3.output))

// const test = DoReMi.fromString(`B5 E E E A1 E1 D G1 E A1 E2 E1 A3 E3 G4 E Em B2 E1 G0 Em Em2 Am0 Em3 A1 E4 G2 E Em A1 E3 E4 D Dm Bm2 Em3 D1 E3 Em D2 Dm A1 Em Bm2`);
// const test = DoReMi.fromString(`B1 AM1 E B1 A#1 G1 B1 Db Am1`);
const test = DoReMi.fromString(`B1 F3 E F4 Db B# Abm1`, [], false);

// const test = DoReMi.fromString(`F3 E F4 Db Bm0`);

console.log(DoReMi.parse(test.notes));
// console.log(DoReMi.parse(test.notes)[5].prog[3].prog);
// const test3 = DoReMi.fromString(`F3 E F4 Db Bm0`);B1 AM1 E G1 B1 D# A1 G1 Bb1 Bm0
// console.log(test3.output)

// const test3 = DoReMi.fromString(`B1 AM1 E B1 A#1 G1 B1 Db Am1`, [10]);
// console.log(test3.output)
// console.log(DoReMi.convertOutputToString(test3.output))

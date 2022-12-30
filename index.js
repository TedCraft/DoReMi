var range = document.getElementById('range');

noUiSlider.create(range, {
    start: [3, 4],
    step: 1,
    connect: true,
    range: {
        'min': 0,
        'max': 8
    },
    tooltips: true,
    format: wNumb({
        decimals: 0
    }),
});

// const synth = new Tone.Synth().toDestination();
const synth = new Tone.Sampler({
    urls: {
        A0: "A0.mp3",
        C1: "C1.mp3",
        "D#1": "Ds1.mp3",
        "F#1": "Fs1.mp3",
        A1: "A1.mp3",
        C2: "C2.mp3",
        "D#2": "Ds2.mp3",
        "F#2": "Fs2.mp3",
        A2: "A2.mp3",
        C3: "C3.mp3",
        "D#3": "Ds3.mp3",
        "F#3": "Fs3.mp3",
        A3: "A3.mp3",
        C4: "C4.mp3",
        "D#4": "Ds4.mp3",
        "F#4": "Fs4.mp3",
        A4: "A4.mp3",
        C5: "C5.mp3",
        "D#5": "Ds5.mp3",
        "F#5": "Fs5.mp3",
        A5: "A5.mp3",
        C6: "C6.mp3",
        "D#6": "Ds6.mp3",
        "F#6": "Fs6.mp3",
        A6: "A6.mp3",
        C7: "C7.mp3",
        "D#7": "Ds7.mp3",
        "F#7": "Fs7.mp3",
        A7: "A7.mp3",
        C8: "C8.mp3"
    },
    release: 1,
    baseUrl: "https://tonejs.github.io/audio/salamander/"
}).toDestination();

function run() {
    try {
        const inputArray = document.getElementById("input").value.split(" ");
        const code = DoReMi.fromString(document.getElementById("code").value, inputArray);
        if (!document.getElementById("stringOutput").checked)
            document.getElementById("output").value = code.output.join(" ")
        else
            document.getElementById("output").value = DoReMi.convertOutputToString(code.output);
    }
    catch (err) {
        alert(err)
    }
}

function toFormat(min, max, number) {
    if (number < min) number = min;
    if (number > max) number = max;
    return number;
}

function play() {
    try {
        const inputArray = document.getElementById("input").value.split(" ");
        const code = DoReMi.fromString(document.getElementById("code").value, inputArray, false);

        let now = Tone.now();
        if (!document.getElementById("iterative").checked)
            for (let note of code.notes) {
                synth.triggerAttackRelease(`${note.note}${note.alteration | ""}${note.mood | ""}${note.octave ?
                    toFormat(range.noUiSlider.get()[0], range.noUiSlider.get()[1], note.octave) : "4"}`, "4n", now);
                now += 0.20;
            }
        else {
            const notes = code.run(true);
            for (let note of notes) {
                synth.triggerAttackRelease(`${note.note}${note.alteration | ""}${note.mood | ""}${note.octave ?
                    toFormat(range.noUiSlider.get()[0], range.noUiSlider.get()[1], note.octave) : "4"}`, "4n", now);
                now += 0.20;
            }
        }

    }
    catch (err) {
        alert(err)
    }
}
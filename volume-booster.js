// volume-booster.js - Zesilovač hlasitosti pomocí Web Audio API
// Tento skript inicializuje Web Audio API, vytvoří GainNode pro řízení hlasitosti
// a exportuje funkce pro jeho ovládání.

// Globální proměnné pro Web Audio API
let audioContext = null;
let mediaSource = null;
let mainGainNode = null;
let audioPlayerElement = null; // Odkaz na původní <audio> element

/**
 * @function initWebAudio
 * @description Inicializuje Web Audio API, vytvoří audio graf
 * (MediaElementSource -> GainNode -> AudioContext.destination).
 * Měla by být volána, jakmile je DOM plně načten a audioPlayer je k dispozici.
 * @param {HTMLAudioElement} playerElement Reference na HTML audio element.
 */
window.initWebAudio = function(playerElement) {
    if (!playerElement) {
        console.error("initWebAudio: Chybí reference na HTML audio element.");
        return;
    }
    if (audioContext) {
        console.warn("initWebAudio: Web Audio API již bylo inicializováno.");
        return;
    }

    audioPlayerElement = playerElement;

    try {
        // Vytvoření AudioContextu (musí být aktivován uživatelskou interakcí)
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Vytvoření MediaElementSource z existujícího audio elementu
        mediaSource = audioContext.createMediaElementSource(audioPlayerElement);

        // Vytvoření GainNode (hlavního zesilovače)
        mainGainNode = audioContext.createGain();

        // Propojení grafu: audio element -> zesilovač -> výstup reproduktorů
        mediaSource.connect(mainGainNode);
        mainGainNode.connect(audioContext.destination);

        // Nastavení výchozí hlasitosti GainNode na základě původního audioPlayeru (pokud by měl nějakou hodnotu)
        // Všimni si, že slider volume má nyní rozsah 0-3.
        // Při inicializaci necháme gain na 1.0 (100%), dokud si ho uživatel nenastaví.
        mainGainNode.gain.value = 1.0; // Výchozí hlasitost GainNode na 100%

        // Důležité: Zastavíme původní HTML audio element v přímém ovládání hlasitosti
        // protože ji teď řídí GainNode.
        audioPlayerElement.volume = 0; // Nastavíme na 0, aby nekolidovalo s GainNode
        audioPlayerElement.muted = false; // Zajištění, že není ztlumeno (pokud bylo)
        // audioPlayerElement.controls = false; // Toto bychom mohli zakomentovat, pokud chceme ponechat vestavěné HTML ovládací prvky (i když je GainNode ovládat nebude)

        console.log("Web Audio API inicializováno a GainNode nastaven.");

    } catch (e) {
        console.error("Chyba při inicializaci Web Audio API:", e);
        window.showNotification("Chyba Web Audio API. Hlasitost nad 100% nebude dostupná.", 'error', 7000);
        // Resetujeme na původní chování, pokud Web Audio API selže
        audioContext = null;
        mediaSource = null;
        mainGainNode = null;
        if (audioPlayerElement) {
            audioPlayerElement.volume = 1; // Povolíme zpět HTML volume control
            // audioPlayerElement.controls = true; // Znovu zobrazíme, pokud byly skryté
        }
    }
};

/**
 * @function updateWebAudioVolume
 * @description Nastaví hlasitost GainNode na základě hodnoty posuvníku (0.0 až 3.0).
 * @param {number} sliderValue Hodnota z posuvníku hlasitosti (očekává 0.0 až 3.0).
 */
window.updateWebAudioVolume = function(sliderValue) {
    if (mainGainNode) {
        // Hodnota slideru (0-3) se přímo mapuje na gain.
        // GainNode 1.0 je 100%, 2.0 je 200%, 3.0 je 300%.
        mainGainNode.gain.value = parseFloat(sliderValue); // Ujistíme se, že je to číslo
        console.log(`GainNode hlasitost nastavena na: ${mainGainNode.gain.value}`);
    } else {
        // Fallback, pokud Web Audio API není aktivní nebo selhalo
        // Převedeme hodnotu slideru (0-3) na rozsah 0-1 pro HTML audio element.
        // V tomto případě je hlasitost omezena na 100% max.
        if (audioPlayerElement) {
            audioPlayerElement.volume = Math.min(1, parseFloat(sliderValue) / 3);
            console.warn(`Web Audio API není aktivní. Hlasitost HTML přehrávače nastavena na: ${audioPlayerElement.volume}`);
        }
    }
};

/**
 * @function getWebAudioMainGainNode
 * @description Vrátí referenci na hlavní GainNode. Používá se pro přímé nastavení gainu, např. pro mute.
 * @returns {GainNode|null} GainNode instance nebo null, pokud není inicializováno.
 */
window.getWebAudioMainGainNode = function() {
    return mainGainNode;
};

// Zde se Web Audio API neinicializuje hned, ale čeká se na volání `initWebAudio`
// z `audioPlayer.js`, aby se zajistilo, že `audioPlayer` element je již k dispozici.

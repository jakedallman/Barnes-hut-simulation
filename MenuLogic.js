
///gets DOM elements
const popup = document.getElementById('mode-popup');
const confirmButton = document.getElementById('confirm-mode');
const solarOptions = document.getElementById('solar-options');
const chaosOptions = document.getElementById('chaos-options');
const randomMassesCheckbox = document.getElementById('random-masses');
const randomMassOptions = document.getElementById('random-mass-options');
///Changes the menu based on the selected mode
function updateModeOptions() {
    const selectedMode = document.querySelector('input[name="mode"]:checked')?.value;
    const showSolarOptions = selectedMode === 'solar';
    const showChaosOptions = selectedMode === 'chaos';

    solarOptions?.classList.toggle('hidden', !showSolarOptions);
    chaosOptions?.classList.toggle('hidden', !showChaosOptions);

    if (!showSolarOptions) {
        randomMassesCheckbox.checked = false;
        randomMassOptions?.classList.add('hidden');
    }
}
///dismisses popup
confirmButton?.addEventListener('click', () => {
    popup?.classList.add('hidden');
});

for (const modeInput of document.querySelectorAll('input[name="mode"]')) {
    modeInput.addEventListener('change', updateModeOptions);
}
///makes min and max mass inputs visible
randomMassesCheckbox?.addEventListener('change', () => {
    randomMassOptions?.classList.toggle('hidden', !randomMassesCheckbox.checked);
});

updateModeOptions();

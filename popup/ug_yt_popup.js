if (!window.ugytapiScriptsRan) {
    browser.tabs
        .executeScript({ file: "/content_scripts/iframe_api.js" });
    browser.tabs
        .executeScript({ file: "/content_scripts/widgetapi.js" });
    window.ugytapiScriptsRan = true;
}
browser.tabs
    .executeScript({ file: "/content_scripts/ug_yt.js" })
    .then(pageSetup)
    .catch(reportExecuteScriptError);

function pageSetup() {
    // console.log('apge setup');
    function embedVideo(tabs) {
        const formData = new FormData(form);
        // console.log('fdata', formData.get('yt-id'));
        browser.tabs.sendMessage(tabs[0].id, {
            command: "embedVideo",
            videoId: formData.get('yt-id')
        })
    }

    function formSubmit(e) {
        e.preventDefault();

        browser.tabs
            .query({ active: true, currentWindow: true })
            .then(embedVideo)
            .catch(reportError)

    }

    function reportError(error) {
        console.log(`UG-YT Error: ${error}`);
    }

    const form = document.getElementById('ug-yt-form');
    form.addEventListener("submit", formSubmit);
    const input = document.getElementById('yt-id');

    const datalist = document.getElementById('yt-id-hist');

    const histDropdown = document.getElementById('yt-id-hist-dropdown');

    const getHist = browser.storage.local.get('history');
    getHist.then(hist => {
        console.log('popuphist:', hist);
        if (hist.history) {
            const history = hist.history
            for (const [ytId, ytTitle] of Object.entries(history)) {
                console.log('ytid, yttit', ytId, ytTitle);
                const datalistOption = document.createElement('option');
                datalistOption.value = ytId;
                datalistOption.textContent = `${ytId} : ${ytTitle}`;
                datalist.appendChild(datalistOption);

                // custom dd
                const histEntry = document.createElement('li');
                histEntry.id = ytId;
                histEntry.dataset.value = ytId;
                // histEntry.textContent = `${ytId} : ${ytTitle}`;
                histEntry.classList.add('entry')
                histEntry.addEventListener('click', (e) => {
                    input.value = ytId;
                })

                const histEntryText = document.createElement('a');
                histEntryText.textContent = `${ytId} : ${ytTitle}`;
                histEntry.append(histEntryText);
                histDropdown.appendChild(histEntry);

                const histEntryDel = document.createElement('a')
                histEntryDel.innerHTML = "&times;";
                histEntryDel.classList.add('entry-del')
                histEntryDel.addEventListener('click', (e) => {
                    histEntry.remove();
                    histEntryDel.remove();
                    delete history[ytId];
                    browser.storage.local.set({ history: history });
                })
                histEntry.appendChild(histEntryDel);
            }
        }
    });


    const dropdownToggle = document.getElementById('dropdown-toggle');
    let showDropdown = false;
    dropdownToggle.addEventListener('click', (e) => {
        e.preventDefault();
        if (showDropdown) {
            histDropdown.style.display = 'none';
            showDropdown = false;
        } else {
            histDropdown.style.display = 'block';
            showDropdown = true;
        }

    });
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
    console.error(`Failed to execute content script: ${error.message}`);
}
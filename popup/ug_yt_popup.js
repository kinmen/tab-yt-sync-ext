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
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  console.error(`Failed to execute content script: ${error.message}`);
}
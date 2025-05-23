const validString = (str) => {
    if (!str) throw 'Must provide a string';
    if (typeof str !== 'string') throw 'Must be a string';
    str = str.trim();
    if (str.length === 0) throw 'String cannot be empty';
    return str;
}

const validNumber = (num) => {
    if (num === undefined || num === null) throw 'Must provide a number';
    else if (typeof num === 'string') {
        const parsed = Number(num);
        if (isNaN(parsed)) throw 'Must be a number';
        if (parsed < 0) throw 'Number cannot be negative';
        if (!Number.isInteger(parsed)) throw 'Number must be an integer';
        return parsed;
    }
    else if (typeof num === 'number') {
        if (num < 0) throw 'Number cannot be negative';
        if (!Number.isInteger(num)) throw 'Number must be an integer';
        return num;
    } else {
        throw 'Must be a number';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    const loading = document.getElementById("loading");
    const button = document.getElementById("submit");
    const usernameInput = document.getElementById("username");
    const errorDisplay = document.getElementById("error");
    const checkedStatuses = document.querySelectorAll("input[name='statuses']:checked");
    const includeOps = document.getElementById("includeOps");
    const includeEds = document.getElementById("includeEds");
    const playlistName = document.getElementById("playlistName");
    const playlistDescription = document.getElementById("playlistDescription");
    errorDisplay.hidden = true;
    loading.hidden = true;

    if (form && button && usernameInput) {
        form.addEventListener("submit", (event) => {
            errorDisplay.hidden = true;
            loading.hidden=true;
            if (checkedStatuses.length === 0) {
                event.preventDefault();
                errorDisplay.textContent = "Please select at least one list to include.";
                errorDisplay.hidden = false;
                return;
            }
            if (!includeOps.checked && !includeEds.checked) {
                event.preventDefault();
                errorDisplay.textContent = "Please select at least one theme type (OP or ED).";
                errorDisplay.hidden = false;
                return;
            }
            try {
                const username = validString(usernameInput.value);
                if (playlistName.value === "") playlistName.value = "My Anime Playlist";
                if (playlistDescription.value === "") playlistDescription.value = "This was created by DJ Waifu using my watchlist!";
                loading.hidden = false;
                form.style.display = "none";
            } catch (error) {
                event.preventDefault();
                errorDisplay.textContent = "Invalid username";
                errorDisplay.hidden = true;
            }
        });
    }
});

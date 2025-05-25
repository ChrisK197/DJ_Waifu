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
    if (!form) return ;
    const loading = document.getElementById("loading");
    const errorDisplay = document.getElementById("error");
    const subtitle = document.getElementById("subtitle");

    errorDisplay.hidden = true;
    loading.style.display = "none";

    form.addEventListener("submit", (event) => {
        errorDisplay.hidden = true;
        let isValid = true;

        const checkedStatuses = document.querySelectorAll("input[name='statuses']:checked");
        const includeOps = document.getElementById("includeOps");
        const includeEds = document.getElementById("includeEds");
        const usernameInput = document.getElementById("username");
        const playlistName = document.getElementById("playlistName");
        const playlistDescription = document.getElementById("playlistDescription");
        const playlistLink = document.getElementById("playlistLink");

        if (checkedStatuses.length === 0) {
            errorDisplay.textContent = "Please select at least one list to include.";
            errorDisplay.hidden = false;
            isValid = false;
        }
        if (!includeOps.checked && !includeEds.checked) {
            errorDisplay.textContent = "Please select at least one theme type.";
            errorDisplay.hidden = false;
            isValid = false;
        }
        try {
            validString(usernameInput.value);
        } catch (error) {
            errorDisplay.textContent = "Invalid username";
            errorDisplay.hidden = false;
            isValid = false;
        } 
        if (playlistLink) {
            const match = playlistLink.value.trim().match(/playlist\/([a-zA-Z0-9]+)/);
            if (!match || !match[1]) {
                errorDisplay.textContent = "Invalid Spotify URL";
                errorDisplay.hidden = false;
                isValid = false;
            }
        }
        if (playlistName && playlistDescription) {
            if (playlistName.value.trim() === "") playlistName.value = "My Anime Playlist";
            if (playlistDescription.value.trim() === "") playlistDescription.value = "This was created by DJ Waifu using my watchlist!";
        }

        if (!isValid) {
            window.scrollTo({top: 0, behavior: "smooth"})
            event.preventDefault();
        } else {
            loading.style.display = "block";
            form.style.display = "none";
            subtitle.textContent = playlistLink ? "Updating playlist..." : "Generating playlist..."
        }
    });
});

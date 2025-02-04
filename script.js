const prefix = "https://cosmocreeper.github.io/ms/data/";
const suffix = ".json";

const searchBar = document.getElementById("searchbar");
const contents = document.getElementById("contents");
const arrowLeft = document.getElementById("left");
const arrowRight = document.getElementById("right");
const uploadButton = document.getElementById("upload-button");
const booksButton = document.getElementById("books-button");
const sortButton = document.getElementById("sort-button");
const uploadImg = document.getElementById("upload-img");
const booksImg = document.getElementById("books-img");
const sortImg = document.getElementById("sort-img");
const uploadContent = document.getElementById("upload-content");
const booksContent = document.getElementById("books-content");
const sortContent = document.getElementById("sort-content");

searchBar.value = "";

var tag = document.createElement("script");

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

uploadContent.style.height = "150px";
booksContent.style.height = "220px";
sortContent.style.height = "160px";

document.getElementById("start-date").value = "";
document.getElementById("end-date").value = "";

const checkComponent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check2" viewBox="0 0 16 16">
        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0"/>
    </svg>
`;

let page = 0;
let results = [];

let pastors = { rob: false, mark: false, greg: false, guests: false };
let books = [
    [
        ["1 Samuel", false, ""],
        ["Jeremiah", false, ""],
    ],
    [
        ["Luke", false, ""],
        ["2 Thessalonians", false, ""],
        ["Titus", false, ""],
        ["Hebrews", false, ""],
        ["Revelation", false, ""],
    ],
];
let recentSermon = false;
let pastReferences = false;

let uploadDate = false;
let sortBy = "new";

let totalLoadedContents = 0;
let prevVideoId = "";
let searchIterations = 0;

let other, specials, mark, greg, guests, live;

let currLoadedSermons = [];
let currPage = 0;
let loadedAll = true;
const loadMax = 25;

// =================================================================================================
// UTILITIES
// =================================================================================================
const getCurrSunday = () => {
    const today = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate()
    );
    return moment(
        new Date(today.setDate(today.getDate() - today.getDay()))
    ).format("YYYY-MM-DD");
};

const removeDuplicates = (originalArray) => {
    let trimmedArray = [];
    let values = [];
    let value;

    for (let i = 0; i < originalArray.length; i++) {
        value = originalArray[i]["id"];

        if (values.indexOf(value) === -1) {
            trimmedArray.push(originalArray[i]);
            values.push(value);
        }
    }

    return trimmedArray;
};

const betweenDates = (date) => {
    const startDateValue = document.getElementById("start-date").value;
    const endDateValue = document.getElementById("end-date").value;

    let startDate = null;
    let endDate = null;
    if (startDateValue !== "") startDate = new Date(startDateValue);
    if (endDateValue !== "") endDate = new Date(endDateValue);

    const isValidStartDate = startDate instanceof Date && !isNaN(startDate);
    const isValidEndDate = endDate instanceof Date && !isNaN(endDate);

    const btwStartDate = isValidStartDate ? date >= startDate : false;
    const btwEndDate = isValidEndDate ? date <= endDate : false;

    return (
        (!isValidEndDate && btwStartDate) ||
        (!isValidStartDate && btwEndDate) ||
        (btwStartDate && btwEndDate) ||
        (!isValidStartDate && !isValidEndDate)
    );
};

// =================================================================================================
// Load initial sermon data.
// =================================================================================================
(async () => {
    try {
        contents.innerHTML = `<div id="match-count">Loading sermons...</div>`;
        console.log(prefix + "live" + suffix, await fetch(prefix + "live" + suffix));
        const response = await fetch(prefix + "live" + suffix);
        live = await response.json();
        resetSearch();
    } catch (err) {
        console.error(err);
    }
})();

const fetchSermons = async (VideoID = "") => {
    try {
        console.log(await live);
        let finalResult = [];
        finalResult = finalResult.concat(await live);
        console.log(finalResult);
        if (VideoID !== "")
            finalResult = finalResult.filter((el) => el.id === VideoID);
        return finalResult;
    } catch (error) {
        console.error("Error fetching or parsing JSON:", error);
    }
};

const PAGE_SIZE = 20;
let keyword = "";
let reachedEndOfSearch = false;

const loadContents = () => {
    if (Array.isArray(results)) {
        let contentsTemp = "";
        let videoDiv = "";
        let entryCount = 0;
        let enteredCount = 0;
        let replace = false;
        let replaceID = "";
        results.forEach((el) => {
            if (
                (sortBy === "top" && enteredCount < loadMax) ||
                sortBy !== "top"
            ) {
                // Distance since date.
                const distanceDate = moment(el.date).fromNow();
                // User-friendly, readable date.
                const userDate = moment(el.date).format("MMM. Do, YYYY");

                if (prevVideoId !== el.id) {
                    if (
                        el.date !== getCurrSunday() &&
                        !pastReferences &&
                        recentSermon
                    ) {
                        if (totalLoadedContents === 0)
                            videoDiv += "No results found.";
                        pastReferences = true;
                        videoDiv += `<div id="past-references"><hr>Past references found:</div>`;
                    }
                    videoDiv += `<div class="video"><div class="video-date tooltip">${distanceDate}<span class="tooltiptext">${userDate}</span></div><div class="video-grid"><div class="instances">`;
                } else {
                    replace = true;
                    replaceID = el.id;
                }
                prevVideoId = el.id;
                el.timestamps.forEach((instance) => {
                    entryCount++;
                    if (
                        (sortBy === "top" &&
                            entryCount > totalLoadedContents &&
                            enteredCount < loadMax) ||
                        sortBy !== "top"
                    ) {
                        enteredCount++;
                        totalLoadedContents++;
                        const totalSeconds = Math.floor(instance[0]);
                        const hours = Math.floor(totalSeconds / 3600);
                        const minutes = Math.floor((totalSeconds % 3600) / 60);
                        const seconds = totalSeconds % 60;
                        const pH = String(hours).padStart(2, "0");
                        const pM = String(minutes).padStart(2, "0");
                        const pS = String(seconds).padStart(2, "0");
                        const timestamp = `${
                            pH !== "00" ? pH + ":" : ""
                        }${pM}:${pS}`;
                        const highlightedLine = instance[1]
                            .replace(/[^a-zA-Z0-9 ]/g, "")
                            .replace(
                                new RegExp(`(${keyword})`, "gi"),
                                `<span class="highlight">$1</span>`
                            );
                        videoDiv += `
                            <div class="snippet">
                                <div onclick="miniplayerLoad('${el.id}', ${
                            instance[0]
                        })" class="time" style="${
                            pH !== "00" ? "font-size: 13px;" : ""
                        }">${timestamp}</div>
                                <div class="line">
                                    ${highlightedLine}
                                </div>
                            </div>
                        `;
                    }
                });
                videoDiv += `</div><div class="bracket"></div>`;
                videoDiv += `<img onclick="miniplayerLoad('${el.id}', 0)" class="thumbnail" src="https://i.ytimg.com/vi/${el.id}/mqdefault.jpg"/>`;
                videoDiv += `</div></div>`;
                const emptyRep = `<div class="video"><div class="video-grid"><div class="instances"></div><div class="bracket"></div><img class="thumbnail" onclick="miniplayerLoad('${el.id}', 0)" src="https://i.ytimg.com/vi/${el.id}/mqdefault.jpg"/></div></div>`;
                if (videoDiv.includes(emptyRep))
                    videoDiv = videoDiv.replace(emptyRep, "");
            }
        });
        const offsetArr = contents.innerHTML.split(`.jpg" style="height: `);
        const offset = Number(offsetArr[offsetArr.length - 1].split("px")[0]);
        const regex = `</div><div class="bracket"></div><img onclick="miniplayerLoad\\('${replaceID}', 0\\)" class="thumbnail" src="https://i.ytimg.com/vi/${replaceID}/mqdefault.jpg"${
            !matchesMobile.matches ? ` style="height: ${offset}px;"` : ``
        }></div></div>$`;
        contentsTemp +=
            (page === 0 ? `<div id="match-count"></div>` : "") + videoDiv;
        if (results.length === 0 || enteredCount < loadMax) {
            contentsTemp += `<div id="no-results">No${
                totalLoadedContents !== 0 ? ` more` : ``
            } results found.</div>`;
            reachedEndOfSearch = true;
        }
        contents.innerHTML =
            (page !== 0
                ? replace
                    ? contents.innerHTML.replace(new RegExp(regex), "")
                    : contents.innerHTML
                : "") + contentsTemp;
        document.getElementById(
            "match-count"
        ).textContent = `Showing ${totalLoadedContents} result${
            totalLoadedContents === 1 ? "" : "s"
        }.`;
        document.querySelectorAll(".snippet").forEach((el) => {
            if (el.children[1].offsetHeight > 40)
                el.children[1].style.padding = "10px 0";
            el.style.height = el.children[1].offsetHeight + "px";
            if (!matchesMobile.matches)
                el.parentElement.nextElementSibling.nextElementSibling.style.height =
                    el.offsetHeight + "px";
        });
        scrollFunction();
    } else {
        contents.innerHTML = results;
    }
};

const loadSermons = () => {
    let sermonDiv = currPage !== 0 ? contents.innerHTML : "";
    for (
        let i = currPage * PAGE_SIZE;
        i < (currPage + 1) * PAGE_SIZE && i < currLoadedSermons.length;
        i++
    ) {
        const el = currLoadedSermons[i];
        if (!matchesMobile.matches) {
            sermonDiv += `<div class="sermon"><div class="container" onclick="miniplayerLoad('${el.id}', 0)"><div>${el.name}</div></div><div class="sermon-bracket"></div><img class="sermon-thumbnail" onclick="miniplayerLoad('${el.id}', 0)" src="https://i.ytimg.com/vi/${el.id}/mqdefault.jpg"/></div>`;
        } else {
            sermonDiv += `<div class="sermon"><div class="container" onclick="miniplayerLoad('${el.id}', 0)"><div>${el.name}</div><img src="https://i.ytimg.com/vi/${el.id}/mqdefault.jpg" class="mobile-thumbnail" onclick="miniplayerLoad('${el.id}', 0)"/></div></div>`;
        }
    }

    // Need to prevent further loading once we've reached the end.
    if ((currPage + 1) * PAGE_SIZE >= currLoadedSermons.length) {
        loadedAll = true;
        sermonDiv += `<div id="no-results">No${
            currLoadedSermons.length !== 0 ? ` more` : ``
        } results found.</div>`;
    }

    contents.innerHTML = sermonDiv;
    document.querySelectorAll(".sermon-thumbnail").forEach((el) => {
        el.style.height = 0 + "px";
    });

    // Increment current loaded page for further loading by scroll.
    currPage++;
    scrollFunction();
};

const search = async () => {
    // Reset current loaded page.
    loadedAll = false;
    currPage = 0;

    let normalSearch = false;

    // If the search bar is empty, load all sermons (Same as home page).
    if (keyword === "") {
        let sortedSermons = removeDuplicates(await fetchSermons());
        sortBy === "old"
            ? sortedSermons.sort((a, b) => new Date(a.date) - new Date(b.date))
            : sortedSermons.sort((a, b) => new Date(b.date) - new Date(a.date));

        currLoadedSermons = sortedSermons.filter((sermon) => {
            return betweenDates(new Date(sermon.date));
        });

        loadSermons(currLoadedSermons, currPage);
        return;
    }
    // Soundboard
    else if (keyword === "abacabb") {
        results = `<div class="match-count">Cheat code activated.</div>`;
        document.getElementById("soundboard").click();
    }
    // Papyrus font
    else if (keyword === "fontnightmare") {
        results = `<div class="match-count">Cheat code activated.</div>`;
        document
            .querySelectorAll("*")
            .forEach((el) => el.classList.add("papyrus"));
        document.querySelector(".title").classList.add("threed");
    }
    // Yap dollar
    else if (keyword === "yapdollar") {
        results = `<div class="match-count">Cheat code activated.</div>`;
        document.getElementById("screen").style.display = "block";
        searchBar.blur();
        document.getElementById("funkyyap").oncanplaythrough = async () => {
            await document.getElementById("funkyyap").play();
            document.getElementById("slideshow").src = "assets/slideshow/1.png";
            setTimeout(
                () =>
                    (document.getElementById("slideshow").src =
                        "assets/slideshow/2&11.jpg"),
                2400
            );
            setTimeout(
                () =>
                    (document.getElementById("slideshow").src =
                        "assets/slideshow/3.png"),
                5900
            );
            setTimeout(
                () =>
                    (document.getElementById("slideshow").src =
                        "assets/slideshow/4.png"),
                8400
            );
            setTimeout(
                () =>
                    (document.getElementById("slideshow").src =
                        "assets/slideshow/5&10.png"),
                9900
            );
            setTimeout(
                () =>
                    (document.getElementById("slideshow").src =
                        "assets/slideshow/6.png"),
                12900
            );
            setTimeout(
                () =>
                    (document.getElementById("slideshow").src =
                        "assets/slideshow/7.png"),
                13900
            );
            setTimeout(
                () =>
                    (document.getElementById("slideshow").src =
                        "assets/slideshow/8.png"),
                15400
            );
            setTimeout(
                () =>
                    (document.getElementById("slideshow").src =
                        "assets/slideshow/9.png"),
                16400
            );
            setTimeout(
                () =>
                    (document.getElementById("slideshow").src =
                        "assets/slideshow/5&10.png"),
                18400
            );
            setTimeout(
                () =>
                    (document.getElementById("slideshow").src =
                        "assets/slideshow/2&11.jpg"),
                19400
            );
            setTimeout(
                () =>
                    (document.getElementById("screen").style.display = "none"),
                21400
            );
        };
        await document.getElementById("funkyyap").load();
        video.src = "";
    }
    // Normal search query
    else if (keyword !== "") {
        normalSearch = true;
        let sermons = removeDuplicates(await fetchSermons());

        let totalInstances = 0;

        if (sortBy === "new" || sortBy === "top")
            await sermons.sort((a, b) => new Date(b.date) - new Date(a.date));
        else if (sortBy === "old" && !recentSermon)
            await sermons.sort((a, b) => new Date(a.date) - new Date(b.date));

        results = [];
        let entryCount = 0;
        sermons.forEach((video) => {
            const videoId = video.id;
            const times = [];

            if (betweenDates(new Date(video.date))) {
                video.transcript.forEach((entry, idx) => {
                    entryCount++;
                    if (
                        sortBy === "top" ||
                        (entryCount > searchIterations &&
                            totalInstances < loadMax)
                    ) {
                        searchIterations++;
                        const line = entry[1] ? entry[1].toLowerCase() : "";
                        const kA = keyword.split(" ");
                        let cK = 0;
                        let eT = "";
                        let fL = "";
                        if (line.includes(kA[0])) {
                            for (
                                let i = idx;
                                i < video.transcript.length;
                                i++
                            ) {
                                let chooseBreak = false;
                                const iteration = video.transcript[i];
                                for (const word of iteration[1]
                                    .toLowerCase()
                                    .replace(/[^a-zA-Z0-9 ]/g, "")
                                    .split(" ")) {
                                    if (word === kA[cK]) {
                                        cK++;
                                        if (cK === 1) eT = iteration[0];
                                        if (cK === kA.length) {
                                            fL += iteration[1];
                                            times.push([eT, fL]);
                                            totalInstances++;
                                            chooseBreak = true;
                                            break;
                                        }
                                    } else if (cK !== 0 && word !== "") {
                                        cK = 0;
                                        if (kA[cK] === word) cK++;
                                    }
                                    if (cK === 0 && word === "") {
                                        chooseBreak = true;
                                        break;
                                    } else if (word === "" && cK !== 0) {
                                        fL += iteration[1];
                                    }
                                }
                                if (chooseBreak) break;
                            }
                        }
                    }
                });
            }

            if (times.length > 0) {
                results.push({
                    id: videoId,
                    title: video.name,
                    date: video.date,
                    timestamps: times,
                });
            }
        });
    }

    if (sortBy === "top" && normalSearch && !recentSermon)
        results.sort((a, b) => b.timestamps.length - a.timestamps.length);
    loadContents();
};

const togglePastor = (pastor) => {
    const el = document.getElementById(pastor);
    const buttonEl = document.getElementById(`${pastor}-btn`);
    pastors[pastor] = !pastors[pastor];
    el.classList.toggle("checked");
    buttonEl.classList.toggle("checked");
    if (pastors[pastor]) {
        const checkedContent = pastors[pastor]
            ? (matchesMobile.matches ? " " : "") +
              checkComponent +
              (!matchesMobile.matches ? " " : "")
            : "";
        el.innerHTML = `${el.textContent}${checkedContent}`;
        buttonEl.innerHTML = `${checkedContent}${el.textContent}`;
    } else {
        el.innerHTML = `${el.textContent}`;
        buttonEl.innerHTML = `${el.textContent}`;
    }
    resetSearch();
};

const resetSearch = () => {
    page = 0;
    contents.innerHTML = "";
    totalLoadedContents = 0;
    searchIterations = 0;
    prevVideoId = "";
    keyword = searchBar.value
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, "") // Replace symbols.
        .trim();
    reachedEndOfSearch = false;
    pastReferences = false;
    search();
};

searchBar.addEventListener("keydown", (e) => {
    if (e.key === "Enter") resetSearch();
});

const toggleFilterButton = (img, content, button) => {
    if (content.style.display === "none") {
        img.src = `assets/arrow-up.svg`;
        content.style.display = "block";
    } else {
        img.src = `assets/arrow-down.svg`;
        content.style.display = "none";
    }
    if (!matchesMobile.matches) content.style.width = button.offsetWidth + "px";
};

const toggleUpload = () => {
    toggleFilterButton(uploadImg, uploadContent, uploadButton);
};

const toggleBooks = () => {
    toggleFilterButton(booksImg, booksContent, booksButton);
};

const toggleSort = () => {
    toggleFilterButton(sortImg, sortContent, sortButton);
};

const togglePastors = () => {
    toggleFilterButton(
        document.getElementById("pastors-img"),
        document.getElementById("pastors-content"),
        document.getElementById("pastors-button")
    );
};

document
    .getElementById("pastors-button")
    .addEventListener("click", () => togglePastors());
const PastorsArr = ["rob", "mark", "greg", "guests"];
for (const pastor of PastorsArr) {
    document.getElementById(pastor).addEventListener("click", () => {
        togglePastor(pastor);
    });
}

uploadButton.addEventListener("click", () => toggleUpload());
booksButton.addEventListener("click", () => toggleBooks());
sortButton.addEventListener("click", () => toggleSort());

const checkboxes = ["old", "new", "top"];

const toggleCheckbox = (e, type) => {
    if (!e.target.classList.contains("checked"))
        e.target.classList.add("checked");
    sortBy = type;

    // Uncheck other checkboxes
    checkboxes.forEach((checkbox) => {
        if (checkbox !== type) {
            document.getElementById(checkbox).classList.remove("checked");
        }
    });

    if (!matchesMobile.matches)
        document.getElementById("sort").textContent =
            type.charAt(0).toUpperCase() + type.slice(1);
    resetSearch();
};

const sortTypes = ["new", "old", "top"];
for (const sort of sortTypes) {
    document.getElementById(sort).addEventListener("click", (e) => {
        toggleCheckbox(e, sort);
    });
}

document.getElementById("search-button").addEventListener("click", resetSearch);

window.onclick = (event) => {
    if (
        !event.target.matches("#sort-button") &&
        sortContent.style.display === "block"
    ) {
        toggleSort();
    }
    if (
        !event.target.matches("#upload-button") &&
        !event.target.matches("#upload-content") &&
        uploadContent.style.display === "block" &&
        !event.target.matches("#upload-content *")
    ) {
        toggleUpload();
    }
    if (
        !event.target.matches("#books-button") &&
        !event.target.matches("#books-content") &&
        booksContent.style.display === "block" &&
        !event.target.matches("#books-content *")
    ) {
        toggleBooks();
    }
    if (
        matchesMobile.matches &&
        !event.target.matches("#pastors-button") &&
        !event.target.matches("#pastors-content") &&
        document.getElementById("pastors-content").style.display === "block" &&
        !event.target.matches("#pastors-content *")
    ) {
        togglePastors();
    }
};

const displayUpload = () => {
    if (!matchesMobile.matches)
        document.getElementById("upload").textContent =
            document.getElementById("start-date").value ||
            document.getElementById("end-date").value
                ? "Limited"
                : "Any Time";
};

const embed = miniplayer;
const resizeHandle = document.getElementById("miniplayer-resize");

let isDragging = false;
let isResizing = false;
let onMiniplayer = false;
let startX, startY, initialX, initialY, initialWidth, initialHeight;

var player;
let playerIsReady = false;

const playerReady = () => {
    playerIsReady = true;
};

function onYouTubeIframeAPIReady() {
    playerIsReady = false;
    player = new YT.Player(document.getElementById("video"), {
        events: { onReady: playerReady },
    });
}

const handleDragStart = (e) => {
    if (e.target === document.getElementById("drag-overlay")) {
        onMiniplayer = true;
        startX = e.clientX || e.touches[0].clientX;
        startY = e.clientY || e.touches[0].clientY;
        initialX = embed.offsetLeft;
        initialY = embed.offsetTop;
        document.querySelector("#drag-overlay").style.cursor = "grabbing";
        e.preventDefault();
    }
};

const handleDragMove = (e) => {
    if (onMiniplayer) {
        const dx = (e.clientX || e.touches[0].clientX) - startX;
        const dy = (e.clientY || e.touches[0].clientY) - startY;
        embed.style.left = `${initialX + dx}px`;
        embed.style.top = `${initialY + dy}px`;
        e.preventDefault();
        isDragging = true;
    }
};

const handleDragEnd = () => {
    onMiniplayer = false;
    if (isDragging) isDragging = false;
    document.querySelector("#drag-overlay").style.cursor = "grab";
};

const handleResizeStart = (e) => {
    isResizing = true;
    startX = e.clientX || e.touches[0].clientX;
    startY = e.clientY || e.touches[0].clientY;
    initialWidth = embed.offsetWidth;
    initialHeight = embed.offsetHeight;
    e.stopPropagation();
    e.preventDefault();
};

const handleResizeMove = (e) => {
    if (isResizing) {
        const dx = (e.clientX || e.touches[0].clientX) - startX;
        const dy = (e.clientY || e.touches[0].clientY) - startY;
        embed.style.width = `${Math.max(200, initialWidth + dx)}px`;
        embed.style.height = `${Math.max(150, initialHeight + dy)}px`;
        e.preventDefault();
    }
};

const handleResizeEnd = () => (isResizing = false);

// Event listeners for dragging
document
    .querySelector("#drag-overlay")
    .addEventListener("mousedown", handleDragStart);
document
    .querySelector("#drag-overlay")
    .addEventListener("touchstart", handleDragStart);
document.addEventListener("mousemove", handleDragMove);
document.addEventListener("touchmove", handleDragMove);
document
    .querySelector("#drag-overlay")
    .addEventListener("mouseup", handleDragEnd);
document
    .querySelector("#drag-overlay")
    .addEventListener("touchend", handleDragEnd);

// Event listeners for resizing
resizeHandle.addEventListener("mousedown", handleResizeStart);
resizeHandle.addEventListener("touchstart", handleResizeStart);
document.addEventListener("mousemove", handleResizeMove);
document.addEventListener("touchmove", handleResizeMove);
document.addEventListener("mouseup", handleResizeEnd);
document.addEventListener("touchend", handleResizeEnd);

const miniplayerLoad = async (id, timestamp) => {
    const miniplayer = document.getElementById("miniplayer");
    const video = document.getElementById("video");

    const fT = Math.floor(timestamp);

    miniplayer.style.display = "block";
    document.getElementById("skeleton").style.display = "none";
    video.src = `https://www.youtube.com/embed/${id}?autoplay=1&start=${fT}&enablejsapi=1`;
};

const closeMiniplayer = () => {
    document.getElementById("miniplayer").style.display = "none";
    document.getElementById("skeleton").style.display = "block";
    document.getElementById("video").src = "";
};

let arrayOfCombinations = [];
let fontNightmare = "";
window.onkeydown = (e) => {
    if (
        e.key === "ArrowUp" &&
        (arrayOfCombinations.length === 0 || arrayOfCombinations.length === 1)
    ) {
        arrayOfCombinations.push("ArrowUp");
    } else if (
        e.key === "ArrowDown" &&
        (arrayOfCombinations.length === 2 || arrayOfCombinations.length === 3)
    ) {
        arrayOfCombinations.push("ArrowDown");
    } else if (
        e.key === "ArrowLeft" &&
        (arrayOfCombinations.length === 4 || arrayOfCombinations.length === 6)
    ) {
        arrayOfCombinations.push("ArrowLeft");
    } else if (
        e.key === "ArrowRight" &&
        (arrayOfCombinations.length === 5 || arrayOfCombinations.length === 7)
    ) {
        arrayOfCombinations.push("ArrowRight");
    } else if (e.key === "b" && arrayOfCombinations.length === 8) {
        arrayOfCombinations.push("b");
    } else if (e.key === "a" && arrayOfCombinations.length === 9) {
        arrayOfCombinations = [];
        document.body.insertAdjacentHTML(
            "beforeend",
            `<img style="border-radius: 50%; position: absolute; top: 38px; left: 38px; z-index: 1600; width: 138px; height: 138px;" src="./assets/pastorrob.png"/>`
        );
        document.querySelector(".logo").outerHTML =
            "<img style='border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 20000;' onmouseenter='setEnlarge()' onclick='clickEnlarge()' src='./assets/pastorrob.png' class='logo' />";
        document.addEventListener("mousemove", (event) => {
            document.body.insertAdjacentHTML(
                "beforeend",
                `<img src="./assets/pastorrob.png" style="position: absolute; top: ${event.clientY}px; left: ${event.clientX}px; width: 50px; height: 50px; z-index: 1000;" />`
            );
        });
        document.addEventListener("click", (event) => {
            document.body.insertAdjacentHTML(
                "beforeend",
                `<img src="./assets/pastorrob.png" style="position: absolute; top: ${event.clientY}px; left: ${event.clientX}px; width: 100px; height: 100px; z-index: 1500;" />`
            );
        });
    } else {
        arrayOfCombinations = [];
    }
};

const setEnlarge = () => {
    setInterval(() => {
        document.querySelector(".logo").style.width =
            Number(
                document.querySelector(".logo").style.width.replace("px", "")
            ) +
            1 +
            "px";
        document.querySelector(".logo").style.height =
            Number(
                document.querySelector(".logo").style.height.replace("px", "")
            ) +
            1 +
            "px";
    }, 100);
};

const clickEnlarge = () => {
    setInterval(() => {
        document.querySelector(".logo").style.width =
            Number(
                document.querySelector(".logo").style.width.replace("px", "")
            ) +
            10 +
            "px";
        document.querySelector(".logo").style.height =
            Number(
                document.querySelector(".logo").style.height.replace("px", "")
            ) +
            10 +
            "px";
    }, 100);
};

const scrollFunction = () => {
    if (
        document.body.scrollTop > 20 ||
        document.documentElement.scrollTop > 20
    ) {
        document.getElementById("scroll-to-top").style.display = "block";
    } else {
        document.getElementById("scroll-to-top").style.display = "none";
    }

    // If we reach the bottom of the page, load more sermons or contents.
    if (
        Math.round(window.scrollY + window.innerHeight) >=
        document.documentElement.scrollHeight - 20
    ) {
        if (keyword === "" && !loadedAll) {
            loadSermons();
        } else if (keyword !== "" && !reachedEndOfSearch) {
            page++;
            sortBy === "top" ? loadContents() : search();
        }
    }
};

document.addEventListener("scroll", scrollFunction);

const topFunction = () => {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
};

document.getElementById("scroll-to-top").addEventListener("click", topFunction);

const toggleTestament = (testament) => {
    books.forEach((el, idx) => {
        if (
            (testament === "Old Testament" && idx === 0) ||
            (testament === "New Testament" && idx === 1)
        ) {
            let allTestament = true;
            for (const book of el) {
                if (!book[1]) allTestament = false;
            }
            for (const book of el) {
                if (allTestament) {
                    book[1] = false;
                    document.getElementById(
                        book[0].replace(" ", "").toLowerCase()
                    ).className = "book";
                } else {
                    book[1] = true;
                    document.getElementById(
                        book[0].replace(" ", "").toLowerCase()
                    ).className = "book";
                    document.getElementById(
                        book[0].replace(" ", "").toLowerCase()
                    ).className = "book checked";
                }
            }
        }
    });
    displayBooks();
    resetSearch();
};

const toggleBook = (bookInput) => {
    for (const testament of books) {
        for (const book of testament) {
            if (book[0] === bookInput) {
                book[1] = !book[1];
            }
        }
    }
    displayBooks();
    resetSearch();
};

const displayBooks = () => {
    let booksText = "";
    for (const testament of books) {
        for (const book of testament) {
            if (book[1]) booksText += `${book[0]}, `;
        }
    }
    booksText = booksText.slice(0, -2);
    if (booksText.includes(",")) booksText = "Limited";
    if (!matchesMobile.matches)
        document.getElementById("books").textContent = booksText || "All";
};

const loadFBC = () => {
    document.getElementById("fbc").click();
};

const toggleThisSermon = () => {
    recentSermon = !recentSermon;
    document.getElementById("livestream").classList.toggle("checked");
    if (recentSermon)
        document.getElementById(
            "livestream"
        ).innerHTML = `${checkComponent} Sunday's Sermon`;
    else document.getElementById("livestream").innerHTML = `Sunday's Sermon`;
    resetSearch();
};

// Mobile Methods.
const mobileDropdowns = (x) => {
    if (x.matches) {
        document.getElementById("upload-full").innerHTML = "Date";
        document.getElementById("books-full").innerHTML = "Book(s)";
        document.getElementById("sort-full").innerHTML = "Sort";
    } else {
        document.getElementById(
            "upload-full"
        ).innerHTML = `Upload Date: <span class="value" id="upload">Any Time</span>`;
        document.getElementById(
            "books-full"
        ).innerHTML = `Book(s): <span class="value" id="books">All</span>`;
        document.getElementById(
            "sort-full"
        ).innerHTML = `Sort by: <span class="value" id="sort">${
            sortBy.charAt(0).toUpperCase() + sortBy.slice(1)
        }</span>`;
        displayBooks();
        displayUpload();
    }
};

let matchesMobile = window.matchMedia("screen and (max-width: 1135px)");
mobileDropdowns(matchesMobile);
matchesMobile.addEventListener("change", () => {
    mobileDropdowns(matchesMobile);
    resetSearch();
});

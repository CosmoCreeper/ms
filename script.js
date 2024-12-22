const prefix = 'https://raw.githubusercontent.com/CosmoCreeper/prss/refs/heads/main/';
const suffix = '.json';

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


uploadContent.style.height = "150px";
booksContent.style.height = "300px";
sortContent.style.height = "160px";

document.getElementById("start-date").value = "";
document.getElementById("end-date").value = "";

const checkComponent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check2" viewBox="0 0 16 16">
        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0"/>
    </svg>
`;

let page = 0;
let max = 0;
let results = [];

let pastors = {"rob": false, "mark": false, "greg": false, "guests": false};
let books = [[false, [["1 Samuel", false, ""], ["Jeremiah", false, ""]]], [false, [["Luke", false, ""], ["2 Thessalonians", false, ""], ["Titus", false, ""], ["Hebrews", false, ""], ["Revelation", false, ""]]]];

let uploadDate = false;
let sortBy = "new";

const mSL = 25;
const dSL = 100;

let totalLoadedContents = 0;
let prevVideoId = "";
let searchIterations = 0;

window.mobileCheck = () => {
    let check = false;
    if (document.body.offsetWidth <= 1135) check = true;
    return check;
};

if (window.mobileCheck()) {
    document.getElementById("upload-full").innerHTML = "Date";
    document.getElementById("books-full").innerHTML = "Book(s)";
    document.getElementById("sort-full").innerHTML = "Sort";
    document.querySelector(".logo").outerHTML = "";
    document.querySelector(".title").outerHTML = "";
    document.body.insertAdjacentHTML("afterbegin", `<div class='mobile-title'>
            <svg class="logo" preserveAspectRatio="xMidYMid meet" data-bbox="0.595 0.694 32.311 32.306" viewBox="0.595 0.694 32.311 32.306" xmlns="http://www.w3.org/2000/svg" data-type="color" role="presentation" aria-hidden="true" aria-label="">
                <g>
                    <path d="M16.6 33h1.3V15.7h6.2v-2.4h-6.2V6.5h-2.3v6.8H9.4v2.4h6.2v14.7c-7.5-.7-13-7.3-12.4-14.8.7-7.5 7.3-13 14.8-12.4 7.5.7 13 7.3 12.4 14.8-.5 6-5 11-11 12.2v2.5c8.8-1.5 14.7-9.8 13.3-18.6C31.2 5.4 22.9-.5 14.1.9 5.3 2.4-.6 10.7.8 19.5c1.3 7.7 8 13.4 15.8 13.5z" fill="#165f7e" data-color="1"></path>
                </g>
            </svg>
        <div class='title'>Sermon Lookup</div></div>`);
    document.getElementById("pastors").outerHTML = "";
    document.getElementById("dropdowns").insertAdjacentHTML("beforeend", `
        <div class="dropdown">
            <div class="cover" id="pastors-button">
                <span id="pastors-full">Pastor(s)</span>
                <img id="pastors-img" src="assets/arrow-down.svg" width="15">
            </div>
            <div id="pastors-content" class="content" style="display: none;">
                <span class="description">Pastors</span>
                <div class="options">
                    <div class="clickable" id="rob">Rob</div>
                    <div class="clickable" id="mark">Mark</div>
                    <div class="clickable" id="greg">Greg</div>
                    <div class="clickable" id="guests">Guests</div>
                </div>
                <div class="dropdown-actions">
                    <div class="cancel-con">
                        <div class="cancel" id="pastors-cancel">Cancel</div>
                    </div>
                    <div class="ok-con">
                        <div class="ok" id="pastors-ok">OK</div>
                    </div>
                </div>
            </div>
        </div>
    `);
    uploadContent.style.width = "224.75px";
    booksContent.style.width = "131.967px";
    sortContent.style.width = "137.45px";
    document.getElementById("pastors-content").style.width = "100px";
    document.getElementById("pastors-content").style.height = "230px";
}

const loadMax = window.mobileCheck() ? mSL : dSL;

let other, specials, mark, greg, guests;

(async () => {try {
    for (const testament of books) {
        for (const book of testament[1]) {
            const response = await fetch(`${prefix + book[0].toLowerCase().replace(" ", "") + suffix}`);
            book[2] = await response.json();
        }
    }
    const otherResponse = await fetch(`${prefix}other${suffix}`);
    other = await otherResponse.json();
    const specialsResponse = await fetch(`${prefix}specials${suffix}`);
    specials = specialsResponse.json();
    const dataFetch = await fetch(`${prefix}guests${suffix}`);
    const data = await dataFetch.json();
    mark = data.filter((el) => el["name"].includes("Mark LeHew"));
    greg = data.filter((el) => el["name"].includes("Greg Ryan"));
    guests = data.filter((el) => !el["name"].includes("Greg Ryan") && !el["name"].includes("Mark LeHew"));
} catch (err) {
    console.error(err);
}})();

const fetchSermons = async () => {
    try {
        let finalResult = [];
        let all = false;
        if (!pastors["rob"] && !pastors["mark"] && !pastors["greg"] && !pastors["guests"]) all = true;
        let allBooks = true;
        let allTestaments = true;
        books.forEach((el) => {el[1].forEach((book) => {if (book[1]) allBooks = false})});
        books.forEach((el) => {if (el[0]) allTestaments = false});
        if (pastors["rob"] || all) {
            for (const testament of books) {
                for (const book of testament[1]) {
                    if (book[1] || (allBooks && allTestaments) || testament[0]) finalResult = finalResult.concat(await book[2]);
                }
            };
            if (allBooks && allTestaments) finalResult = finalResult.concat(await other);
        }
        if ((pastors["mark"] || all) && allBooks && allTestaments) finalResult = finalResult.concat(await mark);
        if ((pastors["greg"] || all) && allBooks && allTestaments) finalResult = finalResult.concat(await greg);
        if ((pastors["guests"] || all) && allBooks && allTestaments) finalResult = finalResult.concat(await guests);
        if (all && allBooks && allTestaments) finalResult = finalResult.concat(await specials);
        return finalResult;
    } catch (error) {
        console.error('Error fetching or parsing JSON:', error);
    }
}

const loadContents = () => {
    if (Array.isArray(results)) {
        let contentsTemp = "";
        let videoDiv = "";
        const keyword = searchBar.value.replace(/[^a-zA-Z0-9 ]/g, '');
        let entryCount = 0;
        let enteredCount = 0;
        let replace = false;
        /* document.getElementById("pages").textContent = `${page+1} of ${max} page${max > 1 ? "s" : ""}.`; */
        results.forEach((el) => {
            if ((sortBy === "top" && enteredCount < loadMax) || sortBy !== "top") {
                if (prevVideoId !== el.id) videoDiv += `<div class="video"><div class="instances">`;
                else replace = true;
                prevVideoId = el.id;
                el.timestamps.forEach((instance) => {
                    entryCount++;
                    if ((sortBy === "top" && entryCount > totalLoadedContents && enteredCount < loadMax) || sortBy !== "top") {
                        enteredCount++;
                        totalLoadedContents++;
                        const totalSeconds = Math.floor(instance[0]);
                        const hours = Math.floor(totalSeconds / 3600);
                        const minutes = Math.floor((totalSeconds % 3600) / 60);
                        const seconds = totalSeconds % 60;
                        const pH = String(hours).padStart(2, '0');
                        const pM = String(minutes).padStart(2, '0');
                        const pS = String(seconds).padStart(2, '0');
                        const timestamp = `${pH !== "00" ? pH + ":" : ""}${pM}:${pS}`;
                        const highlightedLine = instance[1].replace(/[^a-zA-Z0-9 ]/g, '').replace(
                            new RegExp(`(${keyword})`, 'gi'),
                            `<span class="highlight">$1</span>`
                        );
                        videoDiv += `
                            <div class="snippet">
                                <a class="time-container" ${`onclick="miniplayerLoad('${el.id}', ${instance[0]})"`} target="_blank"><div class="time" style="${pH !== "00" ? "font-size: 10px;" : ""}">${timestamp}</div></a>
                                <div class="line">
                                    ${highlightedLine}
                                </div>
                            </div>
                        `;
                    }
                });
                videoDiv += `</div><div class="bracket"></div></div>`;
                if (videoDiv.includes(`<div class="video"><div class="instances"></div><div class="bracket"></div></div>`)) videoDiv = videoDiv.replace(`<div class="video"><div class="instances"></div><div class="bracket"></div></div>`, '');
            }
        });
        contentsTemp += (page === 0 ? `<div id="match-count"></div>` : "") + videoDiv + ((results.length === 0 && page !== 0) || (enteredCount < loadMax) ? `<div id="no-results">No more results found.</div>` : results.length !== 0 ? `<div id="load-more" onclick="loadMore()">Load more...</div>` : "");
        contents.innerHTML = (page !== 0 ? replace ? contents.innerHTML.replace(/<\/div><div class="bracket"><\/div><\/div>$/, '') : contents.innerHTML : "") + contentsTemp;
        document.getElementById("match-count").textContent = `Showing ${totalLoadedContents} result${totalLoadedContents === 1 ? "" : "s"}.`;
        document.querySelectorAll(".snippet").forEach((el) => {
            if (el.children[1].offsetHeight > 40) el.children[1].style.padding = "10px 0";
            el.style.height = el.children[1].offsetHeight + "px";
            el.children[1].style.left = el.children[0].children[0].offsetWidth + 40 + "px";
            if (navigator.userAgent.toLowerCase().indexOf('firefox') >= 0) el.children[0].children[0].style.top = (el.offsetHeight / 2) - (el.children[0].children[0].offsetHeight / 2) - 4 + "px";
        });
        document.querySelectorAll(".instances").forEach((el) => {
            el.style.width = el.children[0].offsetWidth + "px";
        });
        document.querySelectorAll(".video").forEach((el) => {
            el.style.width = el.children[0].offsetWidth + 7 + "px";
        });
        contents.style.width = contents.children[1].offsetWidth + "px";
    } else {
        contents.innerHTML = results;
    }
}

const search = async () => {
    const keyword = searchBar.value.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    if (keyword !== "") {
        let sermons = await fetchSermons();

        let totalInstances = 0;

        if (sortBy === "new") await sermons.sort((a, b) => new Date(b.date) - new Date(a.date));
        else if (sortBy === "old") await sermons.sort((a, b) => new Date(a.date) - new Date(b.date));
        console.log(sortBy, await sermons[0].date, await sermons);

        results = [];
        let entryCount = 0;
        sermons.forEach(video => {
            const videoId = video.id;
            const times = [];
            const targetDate = new Date(video.date);

            const startDateValue = document.getElementById("start-date").value;
            const endDateValue = document.getElementById("end-date").value;

            let startDate = null;
            let endDate = null;

            if (startDateValue !== "") startDate = new Date(startDateValue);
            if (endDateValue !== "") endDate = new Date(endDateValue);

            const isValidStartDate = startDate instanceof Date && !isNaN(startDate);
            const isValidEndDate = endDate instanceof Date && !isNaN(endDate);

            const btwStartDate = isValidStartDate ? targetDate >= startDate : false;
            const btwEndDate = isValidEndDate ? targetDate <= endDate : false;

            if (
                (isValidStartDate && !isValidEndDate && btwStartDate) || 
                (isValidEndDate && !isValidStartDate && btwEndDate) ||
                (isValidStartDate && isValidEndDate && btwStartDate && btwEndDate) ||
                (!isValidStartDate && !isValidEndDate)
            ) {
                video.transcript.forEach((entry, idx) => {
                    entryCount++;
                    if (sortBy === "top" || (entryCount > searchIterations && totalInstances < loadMax)) {
                        searchIterations++;
                        const line = entry[1].toLowerCase();
                        const kA = keyword.split(" ");
                        let cK = 0;
                        let eT = "";
                        let fL = "";
                        if (line.includes(kA[0])) {
                            for (let i = idx; i < video.transcript.length; i++) {
                                let chooseBreak = false;
                                const iteration = video.transcript[i];
                                for (const word of iteration[1].toLowerCase().replace(/[^a-zA-Z0-9 ]/g, '').split(" ")) {
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
                                    } else if (word === "" && cK !== 0) fL += iteration[1];
                                };
                                if (chooseBreak) break;
                            }
                        }
                    }
                });
            }

            if (times.length > 0) {
                results.push({
                    id: videoId,
                    timestamps: times
                });
            }
        });
    } else {
        results = `<div class="match-count">You can't search for empty strings.</div>`;
    }

    if (sortBy === "top") results.sort((a, b) => b.timestamps.length - a.timestamps.length);
    max = Math.ceil(results.length / (window.mobileCheck() ? 5 : 30));
/*     if (!arrowLeft.classList.contains("disabled")) arrowLeft.classList.add("disabled");
    if (!arrowRight.classList.contains("disabled") && max === 1) arrowRight.classList.add("disabled");
    else if (arrowRight.classList.contains("disabled") && max !== 1) arrowRight.classList.remove("disabled"); */
    loadContents();
}

const togglePastor = (pastor) => {
    const el = document.getElementById(pastor);
    pastors[pastor] = !pastors[pastor];
    el.classList.toggle("checked");
    if (pastors[pastor] && !window.mobileCheck()) el.innerHTML = `${checkComponent} ${el.textContent}`;
    else if (pastors[pastor]) el.innerHTML = `${el.textContent} ${checkComponent}`;
    else el.innerHTML = `${el.textContent}`;
    if (searchBar.value !== "" && !window.mobileCheck()) resetSearch();
}

const resetSearch = () => {
    page = 0;
    contents.innerHTML = "";
    totalLoadedContents = 0;
    searchIterations = 0;
    prevVideoId = "";
    search();
}

searchBar.addEventListener("keydown", (e) => {if (e.key === "Enter") resetSearch();});

/* arrowLeft.addEventListener("click", () => {
    if (page !== 0) {
        page--;
        if (page === 0) arrowLeft.classList.add("disabled");
        arrowRight.classList.remove("disabled");
        loadContents();
        window.scrollTo(0,0);
    }
});

arrowRight.addEventListener("click", () => {
    if ((page + 1) !== max) {
        page++;
        if ((page + 1) === max) arrowRight.classList.add("disabled");
        arrowLeft.classList.remove("disabled");
        loadContents();
        window.scrollTo(0,0);
    }
}); */

const toggleUpload = (otherWindowsOpen = false) => {
    if (uploadContent.style.display === "none") {
        uploadImg.src = `assets/arrow-up.svg`;
        uploadContent.style.display = "block";
        document.querySelectorAll(".video").forEach((el) => el.style.zIndex = "-1");
        if (booksContent.style.display === "block") toggleBooks(true);
        if (sortContent.style.display === "block") toggleSort(true);
        if (window.mobileCheck() && document.getElementById("pastors-content").style.display === "block") togglePastors(true);
    } else {
        uploadImg.src = `assets/arrow-down.svg`;
        uploadContent.style.display = "none";
        if (!otherWindowsOpen) document.querySelectorAll(".video").forEach((el) => el.style.zIndex = "0");
    }
    if (!window.mobileCheck()) uploadContent.style.width = uploadButton.offsetWidth + "px";
}

const toggleBooks = (otherWindowsOpen = false) => {
    if (booksContent.style.display === "none") {
        booksImg.src = `assets/arrow-up.svg`;
        booksContent.style.display = "block";
        document.querySelectorAll(".video").forEach((el) => el.style.zIndex = "-1");
        if (uploadContent.style.display === "block") toggleUpload(true);
        if (sortContent.style.display === "block") toggleSort(true);
        if (window.mobileCheck() && document.getElementById("pastors-content").style.display === "block") togglePastors(true);
    } else {
        booksImg.src = `assets/arrow-down.svg`;
        booksContent.style.display = "none";
        if (!otherWindowsOpen) document.querySelectorAll(".video").forEach((el) => el.style.zIndex = "0");
    }
    if (!window.mobileCheck()) booksContent.style.width = booksButton.offsetWidth + "px";
}

const toggleSort = (otherWindowsOpen = false) => {
    if (sortContent.style.display === "none") {
        sortImg.src = `assets/arrow-up.svg`;
        sortContent.style.display = "block";
        document.querySelectorAll(".video").forEach((el) => el.style.zIndex = "-1");
        if (uploadContent.style.display === "block") toggleUpload(true);
        if (booksContent.style.display === "block") toggleBooks(true);
        if (window.mobileCheck() && document.getElementById("pastors-content").style.display === "block") togglePastors(true);
    } else {
        sortImg.src = `assets/arrow-down.svg`;
        sortContent.style.display = "none";
        if (!otherWindowsOpen) document.querySelectorAll(".video").forEach((el) => el.style.zIndex = "0");
    }
    if (!window.mobileCheck()) sortContent.style.width = sortButton.offsetWidth + "px";
}

const togglePastors = (otherWindowsOpen = false) => {
    if (document.getElementById("pastors-content").style.display === "none") {
        document.getElementById("pastors-img").src = `assets/arrow-up.svg`;
        document.getElementById("pastors-content").style.display = "block";
        document.querySelectorAll(".video").forEach((el) => el.style.zIndex = "-1");
        if (uploadContent.style.display === "block") toggleUpload(true);
        if (booksContent.style.display === "block") toggleBooks(true);
        if (sortContent.style.display === "block") toggleSort(true);
    } else {
        document.getElementById("pastors-img").src = `assets/arrow-down.svg`;
        document.getElementById("pastors-content").style.display = "none";
        if (!otherWindowsOpen) document.querySelectorAll(".video").forEach((el) => el.style.zIndex = "0");
    }
}

if (window.mobileCheck()) {
    document.getElementById("pastors-button").addEventListener("click", togglePastors);
    document.getElementById("pastors-cancel").addEventListener("click", togglePastors);
    document.getElementById("pastors-ok").addEventListener("click", () => {
        togglePastors();
        resetSearch();
    });
    document.getElementById("rob").addEventListener("click", () => togglePastor("rob"));
    document.getElementById("mark").addEventListener("click", () => togglePastor("mark"));
    document.getElementById("greg").addEventListener("click", () => togglePastor("greg"));
    document.getElementById("guests").addEventListener("click", () => togglePastor("guests"));
}

uploadButton.addEventListener("click", toggleUpload);
booksButton.addEventListener("click", toggleBooks);
sortButton.addEventListener("click", toggleSort);

document.getElementById("upload-cancel").addEventListener("click", toggleUpload);
document.getElementById("upload-ok").addEventListener("click", () => {
    toggleUpload();
    document.getElementById("upload").textContent = document.getElementById("start-date").value || document.getElementById("end-date").value ? "Limited" : "Any Time";
    resetSearch();
});

document.getElementById("books-cancel").addEventListener("click", toggleBooks);
document.getElementById("books-ok").addEventListener("click", () => {
    toggleBooks();
    let booksText = "";
    for (const testament of books) {
        if (testament[0]) {
            booksText += `${testament === books[0] ? "Old Testament" : "New Testament"}, `;
        } else {
            for (const book of testament[1]) {
                if (book[1]) booksText += `${book[0]}, `;
            }
        }
    }
    booksText = booksText.slice(0, -2);
    if (booksText.includes(",")) booksText = "Limited";
    document.getElementById("books").textContent = booksText || "All";
    resetSearch();
});

document.getElementById("new").addEventListener("click", (e) => {
    if (!e.target.classList.contains("checked")) e.target.classList.add("checked");
    sortBy = "new";
    document.getElementById("old").classList.remove("checked");
    document.getElementById("top").classList.remove("checked");
    document.getElementById("sort").textContent = "New";
    resetSearch();
});

document.getElementById("old").addEventListener("click", (e) => {
    if (!e.target.classList.contains("checked")) e.target.classList.add("checked");
    sortBy = "old";
    document.getElementById("new").classList.remove("checked");
    document.getElementById("top").classList.remove("checked");
    document.getElementById("sort").textContent = "Old";
    resetSearch();
});

document.getElementById("top").addEventListener("click", (e) => {
    if (!e.target.classList.contains("checked")) e.target.classList.add("checked");
    sortBy = "top";
    document.getElementById("new").classList.remove("checked");
    document.getElementById("old").classList.remove("checked");
    document.getElementById("sort").textContent = "Top";
    resetSearch();
});

document.getElementById("search-button").addEventListener("click", resetSearch);

window.onclick = (event) => {
    if (!event.target.matches('#sort-button') && document.querySelector("#sort-content").style.display === "block") {
        toggleSort();
    }
}

const embed = miniplayer;
const resizeHandle = document.getElementById('resize-handle');

let isDragging = false;
let isResizing = false;
let startX, startY, initialX, initialY, initialWidth, initialHeight;

const handleDragStart = (e) => {
    if (e.target !== resizeHandle) {
        isDragging = true;
        startX = e.clientX || e.touches[0].clientX;
        startY = e.clientY || e.touches[0].clientY;
        initialX = embed.offsetLeft;
        initialY = embed.offsetTop;
        document.querySelector("#drag-overlay").style.cursor = 'grabbing';
        e.preventDefault();
    }
}

const handleDragMove = (e) => {
    if (isDragging) {
        const dx = (e.clientX || e.touches[0].clientX) - startX;
        const dy = (e.clientY || e.touches[0].clientY) - startY;
        embed.style.left = `${initialX + dx}px`;
        embed.style.top = `${initialY + dy}px`;
        e.preventDefault();
    }
}

const handleDragEnd = () => {
    isDragging = false;
    document.querySelector("#drag-overlay").style.cursor = 'grab';
}

const handleResizeStart = (e) => {
    isResizing = true;
    startX = e.clientX || e.touches[0].clientX;
    startY = e.clientY || e.touches[0].clientY;
    initialWidth = embed.offsetWidth;
    initialHeight = embed.offsetHeight;
    e.stopPropagation();
    e.preventDefault();
}

const handleResizeMove = (e) => {
    if (isResizing) {
        const dx = (e.clientX || e.touches[0].clientX) - startX;
        const dy = (e.clientY || e.touches[0].clientY) - startY;
        embed.style.width = `${Math.max(200, initialWidth + dx)}px`;
        embed.style.height = `${Math.max(150, initialHeight + dy)}px`;
        e.preventDefault();
    }
}

const handleResizeEnd = () => {
    isResizing = false;
}

// Event listeners for dragging
document.querySelector("#drag-overlay").addEventListener('mousedown', handleDragStart);
document.querySelector("#drag-overlay").addEventListener('touchstart', handleDragStart);
document.addEventListener('mousemove', handleDragMove);
document.addEventListener('touchmove', handleDragMove);
document.addEventListener('mouseup', handleDragEnd);
document.addEventListener('touchend', handleDragEnd);

// Event listeners for resizing
resizeHandle.addEventListener('mousedown', handleResizeStart);
resizeHandle.addEventListener('touchstart', handleResizeStart);
document.addEventListener('mousemove', handleResizeMove);
document.addEventListener('touchmove', handleResizeMove);
document.addEventListener('mouseup', handleResizeEnd);
document.addEventListener('touchend', handleResizeEnd);

const loadMore = () => {
    document.getElementById("load-more").remove();
    page++;
    sortBy === "top" ? loadContents() : search();
}

const miniplayerLoad = (id, timestamp) => {
    const miniplayer = document.getElementById("miniplayer");
    const video = document.getElementById("video");

    const fT = Math.floor(timestamp);

    miniplayer.style.display = "block";
    video.src = `https://www.youtube.com/embed/${id}?autoplay=1&start=${fT}`;
}

const closeMiniplayer = () => {
    document.getElementById("miniplayer").style.display = "none";
    document.getElementById("video").src = "";
}


let arrayOfCombinations = [];
let fontNightmare = "";
window.onkeydown = (e) => {
    if (fontNightmare.length < 15) fontNightmare += e.key;
    else if (fontNightmare === "fontnightmareEnter") {
        document.querySelectorAll("*").forEach((el) => el.classList.add("papyrus"));
        document.querySelector(".title").classList.add("threed");
        fontNightmare = "";
    }
    if (e.key === "ArrowUp" && (arrayOfCombinations.length === 0 || arrayOfCombinations.length === 1)) {
        arrayOfCombinations.push("ArrowUp");
    } else if (e.key === "ArrowDown" && (arrayOfCombinations.length === 2 || arrayOfCombinations.length === 3)) {
        arrayOfCombinations.push("ArrowDown");
    } else if (e.key === "ArrowLeft" && (arrayOfCombinations.length === 4 || arrayOfCombinations.length === 6)) {
        arrayOfCombinations.push("ArrowLeft");
    } else if (e.key === "ArrowRight" && (arrayOfCombinations.length === 5 || arrayOfCombinations.length === 7)) {
        arrayOfCombinations.push("ArrowRight");
    } else if (e.key === "b" && (arrayOfCombinations.length === 8 || arrayOfCombinations.length === 1 || arrayOfCombinations.length === 5 || arrayOfCombinations.length === 6)) {
        arrayOfCombinations.push("b");
        if (arrayOfCombinations[0] === "a" && arrayOfCombinations[1] === "b" && arrayOfCombinations[2] === "a" && arrayOfCombinations[3] === "c" && arrayOfCombinations[4] === "a" && arrayOfCombinations[5] === "b" && arrayOfCombinations[6] === "b") {
            arrayOfCombinations = [];
            document.body.insertAdjacentHTML("beforeend", `<img style="border-radius: 50%; position: absolute; top: 38px; left: 38px; z-index: 1600; width: 138px; height: 138px;" src="./assets/pastorrob.png"/>`);
            document.querySelector(".logo").outerHTML = "<img style='border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 20000;' onmouseenter='setEnlarge()' onclick='clickEnlarge()' src='./assets/pastorrob.png' class='logo' />";
            document.addEventListener("mousemove", (event) => {
                document.body.insertAdjacentHTML("beforeend", `<img src="./assets/pastorrob.png" style="position: absolute; top: ${event.clientY}px; left: ${event.clientX}px; width: 50px; height: 50px; z-index: 1000;" />`);
            });
            document.addEventListener("click", (event) => {
                document.body.insertAdjacentHTML("beforeend", `<img src="./assets/pastorrob.png" style="position: absolute; top: ${event.clientY}px; left: ${event.clientX}px; width: 100px; height: 100px; z-index: 1500;" />`);
            });
        }
    } else if (e.key === "a" && (arrayOfCombinations.length === 9 || arrayOfCombinations.length === 0 || arrayOfCombinations.length === 2 || arrayOfCombinations.length === 4)) {
        arrayOfCombinations.push("a");
        if (arrayOfCombinations[0] === "ArrowUp" && arrayOfCombinations[1] === "ArrowUp" && arrayOfCombinations[2] === "ArrowDown" && arrayOfCombinations[3] === "ArrowDown" && arrayOfCombinations[4] === "ArrowLeft" && arrayOfCombinations[5] === "ArrowRight" && arrayOfCombinations[6] === "ArrowLeft" && arrayOfCombinations[7] === "ArrowRight" && arrayOfCombinations[8] === "b" && arrayOfCombinations[9] === "a") {
            arrayOfCombinations = [];
            document.getElementById("soundboard").click();
        }
    } else if (e.key === "c" && (arrayOfCombinations.length === 3)) {
        arrayOfCombinations.push("c");
    } else {
        arrayOfCombinations = [];
    }
}

const setEnlarge = () => {
    setInterval(() => {
        document.querySelector(".logo").style.width = Number(document.querySelector(".logo").style.width.replace("px", "")) + 1 + "px";
        document.querySelector(".logo").style.height = Number(document.querySelector(".logo").style.height.replace("px", "")) + 1 + "px";
    }, 100);
}

const clickEnlarge = () => {
    setInterval(() => {
        document.querySelector(".logo").style.width = Number(document.querySelector(".logo").style.width.replace("px", "")) + 10 + "px";
        document.querySelector(".logo").style.height = Number(document.querySelector(".logo").style.height.replace("px", "")) + 10 + "px";
    }, 100);
}

const scrollFunction = () => {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    document.getElementById("scroll-to-top").style.display = "block";
  } else {
    document.getElementById("scroll-to-top").style.display = "none";
  }
}

document.addEventListener("scroll", scrollFunction);
  
const topFunction = () => {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

document.getElementById("scroll-to-top").addEventListener("click", topFunction);

const toggleTestament = (testament) => {
    if (testament === "Old Testament") {
        books[0][0] = !books[0][0];
        for (const book of books[0][1]) {
            document.getElementById(book[0].replace(" ", "").toLowerCase()).classList.remove("checked");
            book[1] = false;
        }
    } else {
        books[1][0] = !books[1][0];
        for (const book of books[1][1]) {
            document.getElementById(book[0].replace(" ", "").toLowerCase()).classList.remove("checked");
            book[1] = false;
        }
    }
}

const toggleBook = (bookInput) => {
    for (const testament of books) {
        for (const book of testament[1]) {
            if (book[0] === bookInput) {
                book[1] = !book[1];
                testament[0] = false;
                document.getElementById(testament === books[0] ? "oldtestament" : "newtestament").classList.remove("checked");
            }
        }
    }
}
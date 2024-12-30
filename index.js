const IDs = [
    "PLDgRNhRk716aSkNKUhXQFweV-q9lQcHYz",
    "PLDgRNhRk716ZHJ16VQ5nvnzldXgWwNkbl",
    "PLDgRNhRk716Z6kWZFSGuX1M5L6WUW51mJ",
    "PLDgRNhRk716bwqel43HQDVSMxJ-yiyybL",
    "PLDgRNhRk716benBfluLMPNwF6gO2GwSo6",
    "PLDgRNhRk716beIwqVkRRG9-fzPhQbysaP",
    "PLDgRNhRk716aEdkOU0T5ep5sk1gs2_-sz",
    "PLDgRNhRk716Z5f7Gz6jIangS3zwfVDw4Z",
    "PLDgRNhRk716b7Su_PE4CuqbiHE8cJaO3n",
    "PLDgRNhRk716aAzsef8-FSiybk9_BSz02C",
    "PLDgRNhRk716Zi_OjVesxilDZa6aNY7OLQ",
];
const CNs = ["1samuel", "jeremiah", "revelation", "hebrews", "specials", "2thessalonians", "luke", "titus", "guests", "other", "live"];

/* const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin()); */
/* const xml2js = require('xml2js'); */
const axios = require('axios');
const fs = require('fs');

const TranscriptAPI = require("youtube-transcript-api");

const API_KEY = "AIzaSyBYzWvP9BCMRx3CcJwkNM2lI5g_sHQcgvY";

for (let x = 0; x < 11; x++) {
    console.clear();

    let PLAYLIST_ID = IDs[x];
    if (PLAYLIST_ID === "") PLAYLIST_ID = "PLDgRNhRk716aAzsef8-FSiybk9_BSz02C";

    const COMPLETED_TRANSCRIPTS_FILE = `${PLAYLIST_ID}.completed_transcripts.json`;
    let TRANSCRIPTS_OUTPUT_FILE = CNs[x];
    if (TRANSCRIPTS_OUTPUT_FILE === "") TRANSCRIPTS_OUTPUT_FILE = `${PLAYLIST_ID}.transcripts.txt`;

    console.clear();

    // Load completed transcripts from file
    let completedTranscripts = [];
    if (fs.existsSync(COMPLETED_TRANSCRIPTS_FILE)) {
        const data = fs.readFileSync(COMPLETED_TRANSCRIPTS_FILE);
        completedTranscripts = JSON.parse(data);
    }

    let existingJSON = [];
    if (fs.existsSync("data/" + TRANSCRIPTS_OUTPUT_FILE + ".json")) {
        const data = fs.readFileSync("data/" + TRANSCRIPTS_OUTPUT_FILE + ".json");
        existingJSON = JSON.parse(data);
    }

    async function getVideoDetails(playlistId) {
        try {
            let videoDetails = [];
            let nextPageToken = '';

            do {
                const playlistResponse = await axios.get(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&key=${API_KEY}&maxResults=50&pageToken=${nextPageToken}`);
                const items = playlistResponse.data.items;

                for (const item of items) {
                    const videoId = item.snippet.resourceId.videoId;
                    const title = item.snippet.title;
                    const publishedAt = title.split(" ")[0];
                    videoDetails.push({ videoId, title, publishedAt });
                }

                nextPageToken = playlistResponse.data.nextPageToken;
            } while (nextPageToken);

            return videoDetails;
        } catch (error) {
            console.error('Error fetching video details from playlist:', error);
            return [];
        }
    }

    async function getCaptions(videoId) {
/*         const url = `https://www.youtube.com/watch?v=${videoId}`;
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', `--disable-setuid-sandbox`, "--enable-unsafe-swiftshader"], executablePath: puppeteer.executablePath() });
        const page = await browser.newPage();
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));

        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:XX.0) Gecko/20100101 Firefox/XX.0';
        await page.setUserAgent(userAgent);

        await page.goto(url, { waitUntil: 'networkidle2' });

        await page.screenshot({ path: 'screenshot.png' });
        const htmlContent = await page.content();
        fs.writeFileSync('page.html', htmlContent);

        const captionsUrl = await page.evaluate(() => {
            if (window.ytplayer && window.ytplayer.config && window.ytplayer.config.args) {
                const rawPlayerResponse = window.ytplayer.config.args.raw_player_response;
                if (rawPlayerResponse && rawPlayerResponse.captions) {
                    const captionTracks = rawPlayerResponse.captions.playerCaptionsTracklistRenderer.captionTracks;
                    if (captionTracks && captionTracks.length > 0) {
                        return captionTracks[0].baseUrl; // Return the first caption track URL
                    }
                }
            }
            return null; // Return null if no captions are found
        }); */

        let plain = [];

        let captions;
        await TranscriptAPI.getTranscript(videoId).then((el) => captions = el);
        if (captions) {
            try {
                /* const response = await page.goto(captionsUrl, { waitUntil: 'networkidle2' });
                const xmlText = await response.text(); // Get the XML text */

                // Parse the XML
/*                 await xml2js.parseString(xmlText, (err, result) => {
                    if (err) {
                        console.error('Error parsing XML:', err);
                    } else {
                        // Extract and decode captions
                        result["transcript"]["text"].forEach((el) => {
                            const start = el.$.start;
                            let text;
                            if (el["_"]) {
                                text = he.decode(el["_"]) + " "; // Decode HTML entities
                            }
                            plain.push([start, text]);
                        });
                    }
                }); */
                for (const line of captions) {
                    const start = line["start"];
                    let text;
                    if (line["text"]) {
                        text = line["text"] + " ";
                    }
                    plain.push([start, text]);
                }
            } catch (error) {
                console.error('Error fetching captions:', error);
            }
        } else {
            console.log(`No captions URL found for video ID: ${videoId}`);
        }

        /* await browser.close(); */
        return plain;
    }

    (async () => {
        const rawVideoDetails = await getVideoDetails(PLAYLIST_ID);
        const transcriptsJSON = [];
        if (CNs[x] === "live") {
            var now = new Date();
            var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            var lastSunday = new Date(today.setDate(today.getDate()-today.getDay()));
            const videoDetails = await rawVideoDetails.filter((a) => a.publishedAt === lastSunday.toISOString().split("T")[0]);
            if (videoDetails.length > 0) {
                for (const videoObj of videoDetails) {
                    const transcript = await getCaptions(videoObj.videoId);
                    console.log(transcript, videoObj.videoId);
                    if (transcript) {
                        transcriptsJSON.push({"id": videoObj.videoId, "name": videoObj.title, "date": videoObj.publishedAt, "transcript": transcript});
                        if (transcriptsJSON) {
                            fs.writeFileSync("data/" + TRANSCRIPTS_OUTPUT_FILE + ".json", JSON.stringify(transcriptsJSON));
                            console.log(`\nAll transcripts saved to ${TRANSCRIPTS_OUTPUT_FILE}.`);
                        }
                    }
                }
            } else {
                console.log("\n\nNo livestream sermon found.\n\n");
            }
        } else {
            const videoDetails = await rawVideoDetails.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
            console.log(`Retrieved video IDs of playlist ${IDs[x]}.`);
            console.log(`0/${videoDetails.length} transcripts are completed.\n`);
            let allTranscripts = ''; // String to accumulate all transcripts
            let currTranscript = 0;

            let noneFound = false;

            if (existingJSON.length > 0) {
                const vD = videoDetails.filter(video => 
                    !existingJSON.some(existingVideo => existingVideo.id === video.videoId)
                );
                const samuel = await JSON.parse(fs.readFileSync("data/1samuel.json"));
                const jeremiah = await JSON.parse(fs.readFileSync("data/jeremiah.json"));
                const titus = await JSON.parse(fs.readFileSync("data/titus.json"));
                const luke = await JSON.parse(fs.readFileSync("data/luke.json"));
                const thessalonians = await JSON.parse(fs.readFileSync("data/2thessalonians.json"));
                const specials = await JSON.parse(fs.readFileSync("data/specials.json"));
                const hebrews = await JSON.parse(fs.readFileSync("data/hebrews.json"));
                const revelation = await JSON.parse(fs.readFileSync("data/revelation.json"));
                const guests = await JSON.parse(fs.readFileSync("data/guests.json"));

                const totalDatabase = await samuel.concat(jeremiah.concat(titus.concat(luke.concat(thessalonians.concat(specials.concat(hebrews.concat(revelation.concat(guests))))))));

                const newVideoDetails = vD.filter(video => !totalDatabase.some(obj2 => obj2["id"] === video.videoId));

                for (const transcript of existingJSON) {
                    transcriptsJSON.push(transcript);
                }
                if (newVideoDetails.length > 0) {
                    console.log(`Found ${newVideoDetails.length} new videos to process.\n`);
                    transcriptsJSON.concat(newVideoDetails);
                    for (const videoObj of newVideoDetails) {
                        currTranscript++;

                        if (videoObj.videoId === "5W5xiaEhK9M" || videoObj.videoId === "KQvhm6KpBOg" || videoObj.videoId === "eqA-3qW-i8k") continue;

                        // Skip already completed transcripts
                        if (completedTranscripts.includes(videoObj.videoId)) {
                            console.log(`Skipping already completed transcript for video ID: ${videoObj.videoId}`);
                            continue;
                        }
                    
                        try {
                            const transcript = await getCaptions(videoObj.videoId);
                            if (transcript) {
                                transcriptsJSON.push({"id": videoObj.videoId, "name": videoObj.title, "date": videoObj.publishedAt, "transcript": transcript});
                            
                                const videoName = `Video: https://youtube.com/watch?v=${videoObj.videoId}`;

                                let transcriptString = '';
                                transcript.forEach((el, idx) => {
                                    if (idx !== 0) transcriptString += "\n";
                                
                                    const time = Math.floor(Number(el[0]));
                                    const hours = Math.floor(time / 3600);
                                    const minutes = Math.floor(time / 60);
                                    const seconds = time % 60;
                                
                                    const timestamp = `${hours ? String(hours).padStart(2, '0') + ":" : ""}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                                
                                    transcriptString += `(${timestamp}) ${el[1]}`;
                                });
                            
                                // Accumulate the transcript
                                if (currTranscript === 1) allTranscripts += `--> ${videoName}\n\n${transcriptString}`;
                                else allTranscripts += `\n\n--> ${videoName}\n\n${transcriptString}`;
                                // Add the video ID to the completed list
                                completedTranscripts.push(videoObj.videoId);
                                // Save the updated list of completed transcripts to the file
                                fs.writeFileSync(COMPLETED_TRANSCRIPTS_FILE, JSON.stringify(completedTranscripts, null, 2));
                                console.log(`Completed video transcript: ${videoObj.videoId}. ${currTranscript}/${newVideoDetails.length}`);
                            }
                        } catch (error) {
                            if (error.response && error.response.data.error.code === 403) {
                                console.error('Quota exceeded. Saving current transcripts and exiting.');
                                // Save the accumulated transcripts to the output file
                                fs.writeFileSync(TRANSCRIPTS_OUTPUT_FILE, allTranscripts);
                                console.log(`Transcripts saved to ${TRANSCRIPTS_OUTPUT_FILE}. Exiting...`);
                                return; // Exit the script
                            } else {
                                console.error('Error fetching captions:', error);
                            }
                        }
                    }
                } else {
                    console.log("No new videos to process.");
                    noneFound = true;
                }
            } else {
                for (const videoObj of videoDetails) {
                    currTranscript++;

                    if (videoObj.videoId === "5W5xiaEhK9M" || videoObj.videoId === "KQvhm6KpBOg" || videoObj.videoId === "eqA-3qW-i8k") continue;
                
                    // Skip already completed transcripts
                    if (completedTranscripts.includes(videoObj.videoId)) {
                        console.log(`Skipping already completed transcript for video ID: ${videoObj.videoId}`);
                        continue;
                    }
                
                    try {
                        const transcript = await getCaptions(videoObj.videoId);
                        if (transcript) {
                            transcriptsJSON.push({"id": videoObj.videoId, "name": videoObj.title, "date": videoObj.publishedAt, "transcript": transcript});
                        
                            const videoName = `Video: https://youtube.com/watch?v=${videoObj.videoId}`;

                            let transcriptString = '';
                            transcript.forEach((el, idx) => {
                                if (idx !== 0) transcriptString += "\n";
                            
                                const time = Math.floor(Number(el[0]));
                                const hours = Math.floor(time / 3600);
                                const minutes = Math.floor(time / 60);
                                const seconds = time % 60;
                            
                                const timestamp = `${hours ? String(hours).padStart(2, '0') + ":" : ""}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                            
                                transcriptString += `(${timestamp}) ${el[1]}`;
                            });
                        
                            // Accumulate the transcript
                            if (currTranscript === 1) allTranscripts += `--> ${videoName}\n\n${transcriptString}`;
                            else allTranscripts += `\n\n--> ${videoName}\n\n${transcriptString}`;
                            // Add the video ID to the completed list
                            completedTranscripts.push(videoObj.videoId);
                            // Save the updated list of completed transcripts to the file
                            fs.writeFileSync(COMPLETED_TRANSCRIPTS_FILE, JSON.stringify(completedTranscripts, null, 2));
                            console.log(`Completed video transcript: ${videoObj.videoId}. ${currTranscript}/${videoDetails.length}`);
                        }
                    } catch (error) {
                        if (error.response && error.response.data.error.code === 403) {
                            console.error('Quota exceeded. Saving current transcripts and exiting.');
                            // Save the accumulated transcripts to the output file
                            fs.writeFileSync("backup/" + TRANSCRIPTS_OUTPUT_FILE + ".json", allTranscripts);
                            console.log(`Transcripts saved to ${TRANSCRIPTS_OUTPUT_FILE}. Exiting...`);
                            return; // Exit the script
                        } else {
                            console.error('Error fetching captions:', error);
                        }
                    }
                }
            }

            allTranscripts += "\n";

            // After processing all videos, save the accumulated transcripts to the output file
            if (allTranscripts && !noneFound) {
                fs.unlinkSync(COMPLETED_TRANSCRIPTS_FILE);
                fs.writeFileSync("data/" + TRANSCRIPTS_OUTPUT_FILE + ".json", JSON.stringify(transcriptsJSON));
                console.log(`\nAll transcripts saved to ${TRANSCRIPTS_OUTPUT_FILE}.`);
            }
        }
    })();
}

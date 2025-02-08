const IDs = [
    "PLDgRNhRk716Zi_OjVesxilDZa6aNY7OLQ",
];
const CNs = [
    "live",
];

const axios = require("axios");
const fs = require("fs");

const TranscriptAPI = require("youtube-transcript-api");



for (let x = 0; x < 1; x++) {
    console.clear();

    let PLAYLIST_ID = IDs[x];

    const COMPLETED_TRANSCRIPTS_FILE = `${PLAYLIST_ID}.completed_transcripts.json`;
    let TRANSCRIPTS_OUTPUT_FILE = CNs[x];
    if (TRANSCRIPTS_OUTPUT_FILE === "")
        TRANSCRIPTS_OUTPUT_FILE = `${PLAYLIST_ID}.transcripts.txt`;

    console.clear();

    // Load completed transcripts from file
    let completedTranscripts = [];
    if (fs.existsSync(COMPLETED_TRANSCRIPTS_FILE)) {
        const data = fs.readFileSync(COMPLETED_TRANSCRIPTS_FILE);
        completedTranscripts = JSON.parse(data);
    }

    let existingJSON = [];
    if (fs.existsSync("data/" + TRANSCRIPTS_OUTPUT_FILE + ".json")) {
        const data = fs.readFileSync(
            "data/" + TRANSCRIPTS_OUTPUT_FILE + ".json"
        );
        existingJSON = JSON.parse(data);
    }

    async function getVideoDetails(playlistId) {
        try {
            let videoDetails = [];
            let nextPageToken = "";

            do {
                const playlistResponse = await axios.get(
                    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&key=${API_KEY}&maxResults=50&pageToken=${nextPageToken}`
                );
                const items = playlistResponse.data.items;

                for (const item of items) {
                    const videoId = item.snippet.resourceId.videoId;
                    const title = item.snippet.title;
                    const publishedDate = item.snippet.publishedAt;
                    const titleDate = title.split(" ")[0];
                    const publishedAt =
                        publishedDate.split("-")[0] +
                        "-" +
                        titleDate.split("-")[1] +
                        "-" +
                        titleDate.split("-")[2];
                    videoDetails.push({ videoId, title, publishedAt });
                }

                nextPageToken = playlistResponse.data.nextPageToken;
            } while (nextPageToken);

            return videoDetails;
        } catch (error) {
            console.error("Error fetching video details from playlist:", error);
            return [];
        }
    }

    async function getCaptions(videoId) {
        let plain = [];

        let captions;
        await TranscriptAPI.getTranscript(videoId).then(
            (el) => (captions = el)
        );
        if (captions) {
            try {
                for (const line of captions) {
                    const start = line["start"];
                    let text;
                    if (line["text"]) {
                        text = line["text"] + " ";
                    }
                    plain.push([start, text]);
                }
            } catch (error) {
                console.error("Error fetching captions:", error);
            }
        } else {
            console.log(`No captions URL found for video ID: ${videoId}`);
        }

        return plain;
    }

    (async () => {
        let rawVideoDetails = await getVideoDetails(PLAYLIST_ID);
        const transcriptsJSON = [];
        if (CNs[x] === "live") {
            for (const id of IDs)
                if (id !== IDs[x])
                    rawVideoDetails = await rawVideoDetails.concat(
                        await getVideoDetails(id)
                    );
            const videoDetails = await rawVideoDetails;
            if (videoDetails.length > 0) {
                for (const videoObj of videoDetails) {
                    const transcript = await getCaptions(videoObj.videoId);
                    if (transcript) {
                        transcriptsJSON.push({
                            id: videoObj.videoId,
                            name: videoObj.title,
                            date: videoObj.publishedAt,
                            transcript: transcript,
                        });
                        if (transcriptsJSON) {
                            fs.writeFileSync(
                                "data/" + TRANSCRIPTS_OUTPUT_FILE + ".json",
                                JSON.stringify(transcriptsJSON)
                            );
                            console.log(
                                `\nAll transcripts saved to ${TRANSCRIPTS_OUTPUT_FILE}.`
                            );
                        }
                    }
                }
            } else {
                console.log("\n\nNo livestream sermon found.\n\n");
            }
        }
    })();
}

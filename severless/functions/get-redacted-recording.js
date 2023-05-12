const axios = require('axios');

// Get the Transcript SID for second call.
const getTranscript = async (voiceSID, callSID, accSID, token) => {
	const transcriptAPI = `https://ai.twilio.com/v1/Services/${voiceSID}/Transcripts?CallSid=${callSID}`;
	console.log(`input params to getTranscript: ${voiceSID}, ${callSID}, ${accSID}, ${token}`);
	try {
		const response = await axios.get(transcriptAPI, {
			headers: {
				Authorization: `Basic ${btoa(`${accSID}:${token}`)}`,
			},
		});

		return response.data.transcripts[0].sid;
	} catch (error) {
		console.log("Error fetching transcript ",error);
		return null;
	}
};

// Get the Media URL for our redacted recording.
const getMedia = async (voiceSID, tSID, accSID, token) => {
	const mediaAPI = `https://ai.twilio.com/v1/Services/${voiceSID}/Transcripts/${tSID}/Media`;
	console.log(`input params to getTranscript: ${voiceSID}, ${tSID}, ${accSID}, ${token}`);
	try {
		const response = await axios.get(mediaAPI, {
			headers: {
				Authorization: `Basic ${btoa(`${accSID}:${token}`)}`,
			},
		});

		return response.data.media_url;
	} catch (error) {
		console.log("Error fetching media url ",error);
		return null;
	}
};

exports.handler = async function (context, event, callback) {

	console.log("Get recording for call SID ",event.callsid);
	const response = new Twilio.Response();
	response.appendHeader('Access-Control-Allow-Origin', '*');
	response.appendHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
	response.appendHeader('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, If-Match, If-Modified-Since, If-None-Match, If-Unmodified-Since, Idempotency-Key');
	response.appendHeader('Access-Control-Allow-Credentials', 'true');
	response.appendHeader('Content-Type', 'application/json');

	let mediaURL = null;

	const tSID = await getTranscript(
		event.voicesid,
		event.callsid,
		context.ACCOUNT_SID,
		context.AUTH_TOKEN
	);
	console.log("tSID", tSID);
	
	if (tSID) {
		mediaURL = await getMedia(
			event.voicesid,
			tSID,
			context.ACCOUNT_SID,
			context.AUTH_TOKEN
		);
	}
	console.log("mediaURL", mediaURL);
	response.setBody({
		media_url: mediaURL,
	});

	return callback(null, response);
};

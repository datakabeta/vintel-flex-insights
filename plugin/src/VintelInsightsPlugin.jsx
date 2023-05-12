import React from 'react';
import { FlexPlugin } from '@twilio/flex-plugin';
import { Manager } from '@twilio/flex-ui';

const manager = Manager.getInstance();
const PLUGIN_NAME = 'VintelInsightsPlugin';

export default class VintelInsightsPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  async init(flex, manager) {

    flex.Actions.addListener('afterAcceptTask', async (payload) => {
      console.log('## afterAcceptTask start');
      const { task } = payload;
      const { attributes } = task;

      const participants = await waitForConferenceParticipants(task);
      const worker_callsid = await getWorkerCallSidFromParticipants(participants);

      console.log("##participants", participants);

      console.log("## worker call SID ", worker_callsid);

      const FUNCTION_URL = process.env.REACT_APP_FUNCTION_URL;
      const voiceSID = process.env.REACT_APP_VOICE_SID;

      //get existing task attributes
      const conversations = attributes.conversations || {};
      const newAttributes = attributes;
      const current_reservation_attributes =
        attributes.reservation_attributes || {};
      const reservationSid = task.sid;

      //manipulate media URL
      newAttributes.reservation_attributes = {
        ...current_reservation_attributes,
        [reservationSid]: {
          media: [
            {
              url_provider: `${FUNCTION_URL}?voicesid=${voiceSID}&callsid=${worker_callsid}`,
              type: 'VoiceRecording',
            },
          ],
        },
      };
      console.log(newAttributes);
      console.log('GGGGG - End');

      //update task attributes
      task.setAttributes(newAttributes);
      return;
    });
  };
}


const isTaskActive = (task) => {
  const { sid: reservationSid, taskStatus } = task;
  if (taskStatus === 'canceled') {
    return false;
  } else {
    return manager.workerClient.reservations.has(reservationSid);
  }
};

const waitForConferenceParticipants = (task) =>
  new Promise((resolve) => {
    const waitTimeMs = 100;
    // For outbound calls, the customer participant doesn't join the conference
    // until the called party answers. Need to allow enough time for that to happen.
    const maxWaitTimeMs = 60000;
    let waitForConferenceInterval = setInterval(async () => {
      const { conference } = task;

      if (!isTaskActive(task)) {
        console.log('## Call canceled, clearing waitForConferenceInterval');
        waitForConferenceInterval = clearInterval(waitForConferenceInterval);

        return;
      }
      if (conference === undefined) {
        console.log("## conference undefined");
        return;
      }
      const { participants } = conference;
      if (Array.isArray(participants) && participants.length < 2) {
        console.log("## is array");
        return;
      }
      const worker = participants.find(
        (p) => p.participantType === "worker"
      );
      const customer = participants.find(
        (p) => p.participantType === "customer"
      );

      if (!worker || !customer) {
        console.log("## !worker || !customer");
        return;
      }

      console.log('## Worker and customer participants joined conference');
      waitForConferenceInterval = clearInterval(waitForConferenceInterval);

      resolve(participants);
    }, waitTimeMs);

    setTimeout(() => {
      if (waitForConferenceInterval) {
        console.log(
          `## Customer participant didn't show up within ${maxWaitTimeMs / 1000
          } seconds`
        );
        clearInterval(waitForConferenceInterval);

        resolve([]);
      }
    }, maxWaitTimeMs);
  });

const getWorkerCallSidFromParticipants = (participants) => {
  const workerParticipant = participants.find((p) => p.participantType === "worker");

  if (workerParticipant) {
    console.log("workerParticipant.callSid ", workerParticipant.callSid);
    return workerParticipant.callSid;
  }

}
// import { v4 as uuid } from 'uuid';

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const getSplitKey = (debuggerEnabled?: boolean) => {
  let splitKey: string;
  const segmentID = localStorage.getItem("ajs_anonymous_id");
  if (!segmentID) {
    const storedAlleAnonId = localStorage.getItem("alle_anonymous_id");
    const alleAnonId = storedAlleAnonId ? storedAlleAnonId : uuidv4();
    splitKey = alleAnonId;
    localStorage.setItem("alle_anonymous_id", alleAnonId);

    debuggerEnabled &&
      console.log(`SETTING ALLE ANON ID FOR SPLIT AND SEGMENT: ${alleAnonId}`);
  } else {
    splitKey = JSON.parse(segmentID);
    localStorage.removeItem("alle_anonymous_id");
    debuggerEnabled &&
      console.log(`USING SEGMENT ANON ID FOR SPLIT KEY: ${splitKey}`);
  }

  return splitKey;
};

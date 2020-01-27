import nodeFetch from "node-fetch";

export default function readyCall(callbackUrl: string) {
  return nodeFetch(callbackUrl, {
    method: "PUT"
  }).then(resp => resp.text());
}

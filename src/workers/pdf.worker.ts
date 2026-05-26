import { mergePdfs } from "../lib/pdf/merge";
import { splitPdf } from "../lib/pdf/split";
import { rotatePdfPages } from "../lib/pdf/rotate";

self.onmessage = async (e: MessageEvent) => {
  const { id, type, payload } = e.data;
  
  try {
    let result;
    
    switch (type) {
      case "MERGE":
        result = await mergePdfs(payload.buffers);
        break;
      case "SPLIT":
        result = await splitPdf(payload.buffer, payload.options);
        break;
      case "ROTATE":
        result = await rotatePdfPages(payload.buffer, payload.rotations, payload.pageOrder);
        break;
      default:
        throw new Error(`Unknown worker task type: ${type}`);
    }
    
    self.postMessage({ id, success: true, result });
  } catch (error) {
    console.error("Worker error:", error);
    self.postMessage({ id, success: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
};

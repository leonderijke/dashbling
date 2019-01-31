import { EventHistory } from "./EventHistory";
import { createHistory as createInMemoryHistory } from "./InMemoryEventHistory";
import { Event } from "./Event";
import * as fs from "fs";
import * as util from "util";

const writeToFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

class FileEventHistory implements EventHistory {
  private inMemoryHistory: EventHistory;
  private historyFile: string;

  static async create(historyFile: string): Promise<FileEventHistory> {
    const history = new FileEventHistory(historyFile);
    await history.loadHistory();

    return history;
  }

  private constructor(historyFile: string) {
    this.historyFile = historyFile;

    createInMemoryHistory().then(h => {
      this.inMemoryHistory = h;
    });
  }

  async put(id: string, event: Event) {
    this.inMemoryHistory.put(id, event);
    await this.saveHistory();
  }

  async get(id: string) {
    return this.inMemoryHistory.get(id);
  }

  getAll(): Event[] {
    return this.inMemoryHistory.getAll();
  }

  private async saveHistory() {
    await writeToFile(this.historyFile, JSON.stringify(this.getAll()));
  }

  private async loadHistory() {
    let fileContents;

    try {
      fileContents = await readFile(this.historyFile);
    } catch (e) {
      if (e.code === "ENOENT") {
        return this.saveHistory();
      } else {
        throw e;
      }
    }

    if (fileContents.byteLength == 0) return;

    const serializedEvents = JSON.parse(fileContents.toString());

    serializedEvents.forEach((event: any) => {
      event.updatedAt = new Date(event.updatedAt);
      this.put(event.id, event);
    });
  }
}

export const createHistory = async (
  historyFile: string
): Promise<EventHistory> => {
  return FileEventHistory.create(historyFile);
};

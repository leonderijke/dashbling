import { EventBus, defaultReducer } from "../src/lib/eventBus";
import { mockDate, restoreDate } from "./utils";
import { createHistory } from "../src/lib/InMemoryEventHistory";

const NOW = new Date();

beforeEach(() => {
  mockDate(NOW);
});

afterEach(() => {
  restoreDate();
});

test("sends events to all subscribers", async () => {
  const subscriber1 = jest.fn();
  const subscriber2 = jest.fn();

  const history = await createHistory();
  const eventBus = new EventBus(history, defaultReducer);

  eventBus.subscribe(subscriber1);
  eventBus.subscribe(subscriber2);

  await eventBus.publish("myEvent", { arg: "1" });

  expect(subscriber1).toBeCalledWith({
    id: "myEvent",
    data: { arg: "1" },
    updatedAt: NOW
  });
  expect(subscriber2).toBeCalledWith({
    id: "myEvent",
    data: { arg: "1" },
    updatedAt: NOW
  });
});

test("passes the event data to the reducer", async () => {
  const subscriber1 = jest.fn();
  const history = await createHistory();

  const reducer = (_id, _previousState, eventData) => {
    return { wrapped: eventData };
  };

  const eventBus = new EventBus(history, reducer);

  eventBus.subscribe(subscriber1);
  await eventBus.publish("myEvent", { arg: "1" });

  expect(subscriber1).toBeCalledWith({
    id: "myEvent",
    data: { wrapped: { arg: "1" } },
    updatedAt: NOW
  });
});

test("replays previously received events", async () => {
  const subscriber = jest.fn();

  const history = await createHistory();
  const eventBus = new EventBus(history, defaultReducer);

  await eventBus.publish("myEvent", { arg: "1" });
  await eventBus.publish("myEvent", { arg: "2" }); // last per id is replayed
  await eventBus.publish("myOtherEvent", { arg: "3" });

  eventBus.subscribe(subscriber);
  eventBus.replayHistory(subscriber);

  expect(subscriber).toBeCalledWith({
    id: "myEvent",
    data: { arg: "2" },
    updatedAt: NOW
  });
  expect(subscriber).toBeCalledWith({
    id: "myOtherEvent",
    data: { arg: "3" },
    updatedAt: NOW
  });
});

test("stops sending events after unsubscribe", async () => {
  const subscriber1 = jest.fn();
  const subscriber2 = jest.fn();

  const history = await createHistory();
  const eventBus = new EventBus(history, defaultReducer);

  eventBus.subscribe(subscriber1);
  eventBus.subscribe(subscriber2);
  eventBus.unsubscribe(subscriber1);

  await eventBus.publish("myEvent", { arg: "1" });

  expect(subscriber2).toBeCalledWith({
    id: "myEvent",
    data: { arg: "1" },
    updatedAt: NOW
  });
  expect(subscriber1).not.toBeCalled();
});

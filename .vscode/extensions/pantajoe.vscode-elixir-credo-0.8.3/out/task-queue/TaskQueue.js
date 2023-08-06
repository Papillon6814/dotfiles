"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../logger");
/**
 * Provides single-threaded task queue which runs single asynchronous
 * Task at a time. This restricts concurrent execution of credo
 * processes to prevent from running out machine resource.
 */
class TaskQueue {
    constructor() {
        this.tasks = [];
        this.busy = false;
    }
    get length() {
        return this.tasks.length;
    }
    enqueue(task) {
        if (task.isEnqueued) {
            throw new Error(`Task is already enqueued. (uri: ${task.uri})`);
        }
        this.cancel(task.uri);
        task.isEnqueued = true;
        this.tasks.push(task);
        this.kick();
    }
    cancel(uri) {
        const uriString = uri.toString(true);
        this.tasks.forEach((task) => {
            if (task.uri.toString(true) === uriString) {
                task.cancel();
            }
        });
    }
    kick() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.busy) {
                return;
            }
            this.busy = true;
            while (true) {
                const task = this.tasks[0];
                if (!task) {
                    this.busy = false;
                    return;
                }
                try {
                    yield task.run();
                }
                catch (err) {
                    (0, logger_1.log)({ message: `Error while running credo: ${err.message}`, level: logger_1.LogLevel.Debug });
                }
                this.tasks.shift();
            }
        });
    }
}
exports.default = TaskQueue;
//# sourceMappingURL=TaskQueue.js.map
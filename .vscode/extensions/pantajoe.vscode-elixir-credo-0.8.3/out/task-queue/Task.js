"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Task with async operation. It will be enqueued to and managed by
 * TaskQueue. Useful for spawning ChildProcess.
 */
class Task {
    /**
     * @param body Function of task body, which returns callback called
     *             when cancelation is requested. You should call
     *             token.finished() after async operation is done.
     */
    constructor(uri, body) {
        this.isEnqueued = false;
        this.isCanceled = false;
        this.uri = uri;
        this.body = body;
    }
    run() {
        if (this.isCanceled) {
            return new Promise((resolve) => {
                resolve();
            });
        }
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const task = this;
        return new Promise((resolve, _reject) => {
            task.resolver = () => resolve();
            const token = {
                get isCanceled() {
                    return task.isCanceled;
                },
                finished() {
                    task.resolveOnce();
                },
            };
            task.onCancel = this.body(token);
        });
    }
    cancel() {
        if (this.isCanceled) {
            return;
        }
        this.isCanceled = true;
        if (this.onCancel) {
            this.onCancel();
        }
        this.resolveOnce();
    }
    resolveOnce() {
        if (this.resolver) {
            this.resolver();
            this.resolver = undefined;
        }
    }
}
exports.default = Task;
//# sourceMappingURL=Task.js.map
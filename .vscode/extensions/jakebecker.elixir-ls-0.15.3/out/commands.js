"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureCommands = void 0;
const copyDebugInfo_1 = require("./commands/copyDebugInfo");
const expandMacro_1 = require("./commands/expandMacro");
const restart_1 = require("./commands/restart");
const mixClean_1 = require("./commands/mixClean");
const manipulatePipes_1 = require("./commands/manipulatePipes");
function configureCommands(context, languageClientManager) {
    (0, copyDebugInfo_1.configureCopyDebugInfo)(context);
    (0, expandMacro_1.configureExpandMacro)(context, languageClientManager);
    (0, restart_1.configureRestart)(context, languageClientManager);
    (0, mixClean_1.configureMixClean)(context, languageClientManager, false);
    (0, mixClean_1.configureMixClean)(context, languageClientManager, true);
    (0, manipulatePipes_1.configureManipulatePipes)(context, languageClientManager, "fromPipe");
    (0, manipulatePipes_1.configureManipulatePipes)(context, languageClientManager, "toPipe");
}
exports.configureCommands = configureCommands;
//# sourceMappingURL=commands.js.map
import { registerSettings } from "./settings.js";

export let debugEnabled = 0;

export let debug = (...args) => {
    if (debugEnabled > 1) console.log("DEBUG: monks-chat-timer | ", ...args);
};
export let log = (...args) => console.log("monks-chat-timer | ", ...args);
export let warn = (...args) => {
    if (debugEnabled > 0) console.warn("WARN: monks-chat-timer | ", ...args);
};
export let error = (...args) => console.error("monks-chat-timer | ", ...args);

export const setDebugLevel = (debugText) => {
    debugEnabled = { none: 0, warn: 1, debug: 2, all: 3 }[debugText] || 0;
    // 0 = none, warnings = 1, debug = 2, all = 3
    if (debugEnabled >= 3)
        CONFIG.debug.hooks = true;
};

export let i18n = key => {
    return game.i18n.localize(key);
};
export let setting = key => {
    if (MonksChatTimer._setting.hasOwnProperty(key))
        return MonksChatTimer._setting[key];
    else
        return game.settings.get("monks-chat-timer", key);
};

export class MonksChatTimer {
    static init() {
        if (game.MonksChatTimer == undefined)
            game.MonksChatTimer = MonksChatTimer;

        try {
            Object.defineProperty(User.prototype, "isTheGM", {
                get: function isTheGM() {
                    return this == (game.users.find(u => u.hasRole("GAMEMASTER") && u.active) || game.users.find(u => u.hasRole("ASSISTANT") && u.active));
                }
            });
        } catch { }

        MonksChatTimer.SOCKET = "module.monks-chat-timer";

        registerSettings();

        MonksChatTimer.registerHotKeys();
    }

    static async ready() {
        game.socket.on(MonksChatTimer.SOCKET, MonksChatTimer.onMessage);
    }

    static registerHotKeys() {
        
    }

    static createTimer(time = "5", options = {}) {
        let timePart = time.split(':').reverse();
        let calcTime = ((Math.abs(timePart[0]) + (timePart.length > 1 ? Math.abs(timePart[1]) * 60 : 0) + (timePart.length > 2 ? Math.abs(timePart[2]) * 3600 : 0)) * 1000) * (time.startsWith('-') ? -1 : 1);

        let frmtTime = new Date(calcTime < 0 ? 0 : calcTime).toISOString().substr(11, 8);
        let content = `<div class="timer-msg"><div class="timer-flavor">${options.flavor}</div><div class="timer-time">${frmtTime}</div><div class="timer-bar"><div></div></div><div class="complete-msg">Complete</div></div>`;

        const speaker = ChatMessage._getSpeakerFromUser({ user: game.user });

        let messageData = {
            user: game.user.id,
            speaker: speaker,
            type: CONST.CHAT_MESSAGE_TYPES.OOC,
            content: content,
            flags: {
                core: { canPopout: true },
                'monks-chat-timer': {
                    time: calcTime,
                    start: Date.now(),
                    flavor: options.flavor,
                    followup: options.followup
                }
            }
        };

        if (options.whisper)
            messageData.whisper = options.whisper;

        ChatMessage.create(messageData);
    }
}

Hooks.once('init', MonksChatTimer.init);
Hooks.on("ready", MonksChatTimer.ready);

Hooks.on("chatCommandsReady", (chatCommands) => {
    if (chatCommands.register != undefined) {
        chatCommands.register({
            name: "/timer",
            module: "monks-chat-timer",
            callback: (chatlog, messageText, chatdata) => {
                let regex = /^(?:(?:(-?[01]?\d|2[0-3]):)?(-?[0-5]?\d):)?(-?[0-5]?\d)|((.*?))?$/g;
                let found = messageText.match(regex);

                let timePart = (found[0] || '5').split(':').reverse();
                let time = ((Math.abs(timePart[0]) + (timePart.length > 1 ? Math.abs(timePart[1]) * 60 : 0) + (timePart.length > 2 ? Math.abs(timePart[2]) * 3600 : 0)) * 1000) * (found[0].startsWith('-') ? -1 : 1);

                let flavor = null;
                if (found.length > 1)
                    flavor = found[1].trim();
                regex = /(\((.*?)\))?$/g;
                found = messageText.match(regex);
                let followup = null;
                if (found.length > 0) {
                    followup = found[0]
                    flavor = flavor.replace(followup, '').trim();
                    followup = followup.substr(1, followup.length - 2).trim();
                }

                chatdata.speaker = ChatMessage._getSpeakerFromUser({ user: game.user });
                chatdata.flags = {
                    core: { canPopout: true },
                    'monks-chat-timer': {
                        time: time,
                        start: Date.now(),
                        flavor: flavor,
                        followup: followup
                    }
                };
                let frmtTime = new Date(time < 0 ? 0 : time).toISOString().substr(11, 8);
                return {
                    content: '<div class="timer-msg"><div class="timer-flavor">' + flavor + '</div><div class="timer-time">' + frmtTime + '</div><div class="timer-bar"><div></div></div><div class="complete-msg">Complete</div></div>'
                };
            },
            shouldDisplayToChat: true,
            icon: '<i class="fas fa-clock"></i>',
            description: "Create chat countdown timer"
        });
    } else {
        chatCommands.registerCommand(chatCommands.createCommandFromData({
            commandKey: "/timer",
            invokeOnCommand: (chatlog, messageText, chatdata) => {
                let regex = /^(?:(?:(-?[01]?\d|2[0-3]):)?(-?[0-5]?\d):)?(-?[0-5]?\d)|((.*?))?$/g;
                let found = messageText.match(regex);

                let timePart = (found[0] || '5').split(':').reverse();
                let time = ((Math.abs(timePart[0]) + (timePart.length > 1 ? Math.abs(timePart[1]) * 60 : 0) + (timePart.length > 2 ? Math.abs(timePart[2]) * 3600 : 0)) * 1000) * (found[0].startsWith('-') ? -1 : 1);

                let flavor = null;
                if (found.length > 1)
                    flavor = found[1].trim();
                regex = /(\((.*?)\))?$/g;
                found = messageText.match(regex);
                let followup = null;
                if (found.length > 0) {
                    followup = found[0]
                    flavor = flavor.replace(followup, '').trim();
                    followup = followup.substr(1, followup.length - 2).trim();
                }

                chatdata.speaker = ChatMessage._getSpeakerFromUser({ user: game.user });
                chatdata.flags = {
                    core: { canPopout: true },
                    'monks-chat-timer': {
                        time: time,
                        start: Date.now(),
                        flavor: flavor,
                        followup: followup
                    }
                };
                let frmtTime = new Date(time < 0 ? 0 : time).toISOString().substr(11, 8);
                return '<div class="timer-msg"><div class="timer-flavor">' + flavor + '</div><div class="timer-time">' + frmtTime + '</div><div class="timer-bar"><div></div></div><div class="complete-msg">Complete</div></div>';
            },
            shouldDisplayToChat: true,
            iconClass: "fa-clock",
            description: "Create chat countdown timer"
        }));
    }
});

Hooks.on("renderChatMessage", (message, html, data) => {
    if (message.getFlag('monks-chat-timer', 'time') && !message.getFlag('monks-chat-timer', 'complete')) {
        let updateTime = function (time, start) {
            let dif = (Date.now() - start);
            let realTime = Math.abs(time);
            let remaining = (time < 0 ? realTime - dif : dif);
            if (time < 0)
                remaining = remaining + 1000;

            let frmtTime = new Date(remaining).toISOString().substr(11, 8);
            $('.timer-time', html).html(frmtTime);
            $('.timer-bar div', html).css({ width: ((dif / Math.abs(time)) * 100) + '%' });

            return dif < Math.abs(time);
        }

        let time = message.getFlag('monks-chat-timer', 'time');
        let start = message.getFlag('monks-chat-timer', 'start');

        if ((Date.now() - start) >= Math.abs(time)) {
            //the timer is finished
            let content = $(message.content);
            $(content).addClass('completed');
            updateTime(time, start);
            //$('.timer-time', content).html(parseInt(Math.abs(time) / 1000) + ' sec');
            message.update({ content: content[0].outerHTML, flags: { 'monks-chat-timer': { 'complete': true } } });
            if (message.getFlag('monks-chat-timer', 'followup'))
                ChatMessage.create({ user: game.user.id, content: message.getFlag('monks-chat-timer', 'followup') }, {});
        } else {
            //start that timer up!
            updateTime(time, start);
            /*
            let dif = (Date.now() - start);
            let remaining = parseInt(dif / 1000);
            $('.timer-time', html).html((time < 0 ? Math.abs(time) - remaining : remaining) + ' sec');
            $('.timer-bar div', html).css({ width: ((dif / Math.abs(time)) * 100) + '%' });
            */

            let timer = window.setInterval(function () {
                /*
                let dif = (Date.now() - start);
                let remaining = parseInt(dif / 1000);
                $('.timer-time', html).html((time < 0 ? Math.abs(time) - remaining : remaining) + ' sec');
                $('.timer-bar div', html).css({ width: ((dif / Math.abs(time)) * 100) + '%'});
                */
                //+++ check if message still exists
                if (!updateTime(time, start)) {
                    //the timer is finished
                    let content = $(message.content);
                    $(content).addClass('complete');
                    updateTime(time, start);
                    //$('.timer-time', content).html((time < 0 ? Math.abs(time) - remaining : remaining) + ' sec');
                    if (game.user.isTheGM) {
                        message.update({ content: content[0].outerHTML, flags: { 'monks-chat-timer': { 'complete': true } } });
                        if (message.getFlag('monks-chat-timer', 'followup')) {
                            ChatMessage.create({
                                user: game.user.id,
                                flavor: message.getFlag('monks-chat-timer', 'flavor'),
                                content: message.getFlag('monks-chat-timer', 'followup'),
                                speaker: null,
                                type: CONST.CHAT_MESSAGE_TYPES.OOC,
                                whisper: message.whisper
                            }, {});
                        }
                    }

                    window.clearInterval(timer);
                }
            }, 100);
        }
    }
});

Hooks.on("setupTileActions", (app) => {
    if (app.triggerGroups['monks-chat-timer'] == undefined)
        app.registerTileGroup('monks-chat-timer', "Monk's Chat Timer");
    app.registerTileAction('monks-chat-timer', 'chat-timer', {
        name: 'Chat Timer',
        ctrls: [
            {
                id: "duration",
                name: "Duration",
                type: "text",
                defvalue: "5",
                required: true,
            },
            {
                id: "for",
                name: "For",
                list: "for",
                type: "list",
            },
            {
                id: "flavor",
                name: "Flavor",
                type: "text",
            },
            {
                id: "followup",
                name: "Follow-up",
                type: "text",
            },
        ],
        values: {
            'for': {
                "everyone": 'Everyone',
                "gm": 'GM Only',
                'token': "Triggering Player"
            }
        },
        group: 'monks-chat-timer',
        fn: async (args = {}) => {
            const { action, tokens } = args;

            let options = {
                flavor: action.data.flavor,
                followup: action.data.followup
            };

            if (action.data.for == 'gm')
                options.whisper = ChatMessage.getWhisperRecipients("GM").map(u => u.id);
            else if (action.data.for == 'token') {
                let entities = await game.MonksActiveTiles.getEntities(args);
                let entity = (entities.length > 0 ? entities[0] : null);
                let tkn = (entity?.object || tokens[0]?.object);
                let tokenOwners = (tkn ? Object.entries(tkn?.actor.ownership).filter(([k, v]) => { return v == CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER }).map(a => { return a[0]; }) : []);
                options.whisper = Array.from(new Set(ChatMessage.getWhisperRecipients("GM").map(u => u.id).concat(tokenOwners)));
            }

            MonksChatTimer.createTimer(action.data.duration, options);
        },
        content: async (trigger, action) => {
            return `<span class="logic-style">${trigger.name}</span> count <span class="details-style">"${action.data.duration}"</span> for <span class="value-style">&lt;${i18n(trigger.values.for[action.data?.for])}&gt;</span>`;
        }
    });
});
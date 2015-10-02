/*!
 * Projekktor II - HTML5 Media Player, Projekktor Core Version: V1.2.18 r184
 * http://www.projekktor.com
 * Copyright 2010, 2011, Sascha Kluger, Spinning Airwhale Media, http://www.spinningairwhale.com
 * GNU General Public License
 * http://www.projekktor.com/license/
 */
jQuery(function($) {
    if (!!document.createElement("video").canPlayType) {
        (function() {
            if (!
            /*@cc_on!@*/
            0) {
                return 
            }
            var e = "audio,video,track,source".split(",");
            for (var i = 0; i < e.length; i++) {
                document.createElement(e[i])
            }
        })()
    }
    var projekktors = [];
    function Iterator(arr) {
        this.length = arr.length;
        this.each = function(fn) {
            $.each(arr, fn)
        };
        this.size = function() {
            return arr.length
        }
    }
    if ($.prop == undefined || $().jquery < "1.6") {
        $.fn.prop = function(arga, argb) {
            return $(this).attr(arga, argb)
        }
    }
    projekktor = $p = function() {
        var arg = arguments[0], instances = [], plugins = [];
        if (!arguments.length) {
            return projekktors[0] || null
        }
        if (typeof arg == "number") {
            return projekktors[arg]
        }
        if (typeof arg == "string") {
            if (arg == "*") {
                return new Iterator(projekktors)
            }
            for (var i = 0; i < projekktors.length; i++) {
                try {
                    if (projekktors[i].getId() == arg.id) {
                        instances.push(projekktors[i]);
                        continue
                    }
                } catch (e) {}
                try {
                    for (var j = 0; j < $(arg).length; j++) {
                        if (projekktors[i].env.playerDom.get(0) == $(arg).get(j)) {
                            instances.push(projekktors[i]);
                            continue
                        }
                    }
                } catch (e) {}
                try {
                    if (projekktors[i].getParent() == arg) {
                        instances.push(projekktors[i]);
                        continue
                    }
                } catch (e) {}
                try {
                    if (projekktors[i].getId() == arg) {
                        instances.push(projekktors[i]);
                        continue
                    }
                } catch (e) {}
            }
            if (instances.length > 0) {
                return (instances.length == 1) ? instances[0] : new Iterator(instances)
            }
        }
        if (instances.length == 0) {
            var cfg = arguments[1] || {};
            var callback = arguments[2] || {};
            if (typeof arg == "string") {
                var count = 0, playerA;
                $.each($(arg), function() {
                    playerA = new PPlayer($(this), cfg, callback);
                    projekktors.push(playerA);
                    count++
                });
                return (count > 1) ? new Iterator(projekktors) : playerA
            } else {
                if (arg) {
                    projekktors.push(new PPlayer(arg, cfg, callback));
                    return new Iterator(projekktors)
                }
            }
        }
        return null;
        function PPlayer(srcNode, cfg, onReady) {
            this.config = new projekktorConfig("1.2.18");
            this.env = {
                muted: false,
                playerDom: null,
                mediaContainer: null,
                agent: "standard",
                mouseIsOver: false,
                loading: false,
                autoSize: false,
                className: "",
                onReady: onReady
            };
            this.media = [];
            this._plugins = [];
            this._queue = [];
            this._cuePoints = {};
            this.listeners = [];
            this.playerModel = {};
            this._isReady = false;
            this._maxElapsed = 0;
            this._currentItem = null;
            this._playlistServer = "";
            this._id = "";
            this._reelUpdate = function(obj) {
                this.env.loading = true;
                var ref = this, data = obj || [{}
                ];
                this.media = [];
                try {
                    for (var props in data.config) {
                        if (typeof data.config[props].indexOf("objectfunction")>-1) {
                            continue
                        }
                        this.config[props] = eval(data.config[props])
                    }
                    if (data.config != null) {
                        $p.utils.log("Updated config var: " + props + " to " + this.config[props]);
                        this._promote("configModified");
                        delete (data.config)
                    }
                } catch (e) {}
                var files = data.playlist || data;
                for (var item in files) {
                    if (typeof files[item] == "function" || typeof files[item] == null) {
                        continue
                    }
                    if (files[item]) {
                        var itemIdx = this._addItem(this._prepareMedia({
                            file: files[item],
                            config: files[item].config || {},
                            errorCode: files[item].errorCode
                        }))
                    }
                    $.each(files[item].cuepoints || [], function() {
                        this.item = itemIdx;
                        ref.setCuePoint(this)
                    })
                }
                if (itemIdx == null) {
                    this._addItem(this._prepareMedia({
                        file: "",
                        config: {},
                        errorCode: 97
                    }))
                }
                this.env.loading = false;
                this._promote("scheduled", this.getItemCount());
                this._syncPlugins(function() {
                    ref.setActiveItem(0)
                })
            };
            this._addItem = function(data, idx, replace) {
                var resultIdx = 0;
                if (this.media.length === 1 && this.media[0].mediaModel == "NA") {
                    this._detachplayerModel();
                    this.media = []
                }
                if (idx === undefined || idx < 0 || idx > this.media.length - 1) {
                    this.media.push(data);
                    resultIdx = this.media.length - 1
                } else {
                    this.media.splice(idx, (replace === true) ? 1 : 0, data);
                    resultIdx = idx
                }
                if (this.env.loading === false) {
                    this._promote("scheduleModified", this.getItemCount())
                }
                return resultIdx
            };
            this._removeItem = function(idx) {
                var resultIdx = 0;
                if (this.media.length === 1) {
                    if (this.media[0].mediaModel == "NA") {
                        return 0
                    } else {
                        this.media[0] = this._prepareMedia({
                            file: ""
                        });
                        return 0
                    }
                }
                if (idx === undefined || idx < 0 || idx > this.media.length - 1) {
                    this.media.pop();
                    resultIdx = this.media.length
                } else {
                    this.media.splice(idx, 1);
                    resultIdx = idx
                }
                if (this.env.loading === false) {
                    this._promote("scheduleModified", this.getItemCount())
                }
                return resultIdx
            };
            this._prepareMedia = function(data) {
                var ref = this, mediaFiles = [], qualities = [], extTypes = {}, typesModels = {}, priority = [], modelSets = [], result = {}, extRegEx = [];
                for (var i in $p.mmap) {
                    platforms = (typeof $p.mmap[i]["platform"] == "object") ? $p.mmap[i]["platform"] : [$p.mmap[i]["platform"]];
                    $.each(platforms, function(_na, platform) {
                        if (!ref._canPlay($p.mmap[i].type, platform, data.config.streamType)) {
                            return true
                        }
                        $p.mmap[i].level = $.inArray(platform, ref.config._platforms);
                        $p.mmap[i].level = ($p.mmap[i].level < 0) ? 100 : $p.mmap[i].level;
                        extRegEx.push("." + $p.mmap[i].ext);
                        if (!extTypes[$p.mmap[i].ext]) {
                            extTypes[$p.mmap[i].ext] = new Array()
                        }
                        extTypes[$p.mmap[i].ext].push($p.mmap[i]);
                        if (!typesModels[$p.mmap[i].type]) {
                            typesModels[$p.mmap[i].type] = new Array()
                        }
                        typesModels[$p.mmap[i].type].push($p.mmap[i])
                    })
                }
                extRegEx = "^.*.(" + extRegEx.join("|") + ")$";
                if (typeof data.file == "string") {
                    data.file = [{
                        src: data.file
                    }
                    ];
                    if (typeof data.type == "string") {
                        data.file = [{
                            src: data.file,
                            type: data.type
                        }
                        ]
                    }
                }
                if ($.isEmptyObject(data) || data.file === false || data.file === null) {
                    data.file = [{
                        src: null
                    }
                    ]
                }
                for (var index in data.file) {
                    if (index == "config") {
                        continue
                    }
                    if (typeof data.file[index] == "string") {
                        data.file[index] = {
                            src: data.file[index]
                        }
                    }
                    if (data.file[index].src == null) {
                        continue
                    }
                    if (data.file[index].type != null && data.file[index].type !== "") {
                        try {
                            var codecMatch = data.file[index].type.split(" ").join("").split(/[\;]codecs=.([a-zA-Z0-9\,]*)[\'|\"]/i);
                            if (codecMatch[1] !== undefined) {
                                data.file[index].codec = codecMatch[1];
                                data.file[index].type = codecMatch[0].replace(/x-/, "")
                            }
                        } catch (e) {}
                    } else {
                        data.file[index].type = this._getTypeFromFileExtension(data.file[index].src)
                    }
                    var possibleTypes = $.merge(typesModels[data.file[index].type] || [], typesModels[data.file[index].type.replace(/x-/, "")] || []);
                    if (possibleTypes.length > 0) {
                        possibleTypes.sort(function(a, b) {
                            return a.level - b.level
                        });
                        modelSets.push(possibleTypes[0])
                    }
                }
                if (modelSets.length == 0) {
                    modelSets = typesModels["none/none"]
                } else {
                    modelSets.sort(function(a, b) {
                        return a.level - b.level
                    });
                    var bestMatch = modelSets[0].level;
                    modelSets = $.grep(modelSets, function(value) {
                        return value.level == bestMatch
                    })
                }
                var types = [];
                $.each(modelSets || [], function() {
                    types.push(this.type)
                });
                var modelSet = (modelSets && modelSets.length > 0) ? modelSets[0]: {
                    type: "none/none",
                    model: "NA",
                    errorCode: 11
                };
                types = $p.utils.unique(types);
                for (var index in data.file) {
                    if (data.file[index].type == null) {
                        continue
                    }
                    if (($.inArray(data.file[index].type.replace(/x-/, ""), types) < 0) && modelSet.type != "none/none") {
                        continue
                    }
                    data.file[index].src = (!$.isEmptyObject(data.config) && (data.config.streamType == "http" || data.config.streamType == null)) ? $p.utils.toAbsoluteURL(data.file[index].src) : data.file[index].src;
                    if (data.file[index].quality == null) {
                        data.file[index].quality = "default"
                    }
                    qualities.push(data.file[index].quality);
                    mediaFiles.push(data.file[index])
                }
                var _setQual = [];
                $.each(this.getConfig("playbackQualities"), function() {
                    _setQual.push(this.key || "default")
                });
                result = {
                    ID: data.config.id || $p.utils.randomId(8),
                    cat: data.config.cat || "clip",
                    file: mediaFiles,
                    platform: modelSet.platform,
                    qualities: $p.utils.intersect($p.utils.unique(_setQual), $p.utils.unique(qualities)),
                    mediaModel: modelSet.model || "NA",
                    errorCode: modelSet.errorCode || data.errorCode || 7,
                    config: data.config || {}
                };
                return result
            };
            this._modelUpdateListener = function(type, value) {
                var ref = this;
                if (!this.playerModel.init) {
                    return 
                }
                if (type != "time" && type != "progress") {
                    $p.utils.log("Update: '" + type, this.playerModel.getSrc(), this.playerModel.getModelName(), value)
                }
                switch (type) {
                case"state":
                    this._promote("state", value);
                    switch (value) {
                    case"IDLE":
                        break;
                    case"AWAKENING":
                        var modelRef = this.playerModel;
                        this._syncPlugins(function() {
                            if (modelRef.getState("AWAKENING")) {
                                modelRef.displayItem(true)
                            }
                        });
                        break;
                    case"BUFFERING":
                    case"PLAYING":
                        break;
                    case"ERROR":
                        this._addGUIListeners();
                        this._promote("error", {});
                        break;
                    case"STOPPED":
                        this._promote("stopped", {});
                        break;
                    case"PAUSED":
                        if (this.getConfig("disablePause") === true) {
                            this.playerModel.applyCommand("play", 0)
                        }
                        break;
                    case"COMPLETED":
                        if (this._currentItem + 1 >= this.media.length&&!this.getConfig("loop")) {
                            this.setFullscreen(false);
                            this._promote("done", {})
                        }
                        this.setActiveItem("next");
                        break
                    }
                    break;
                case"buffer":
                    this._promote("buffer", value);
                    break;
                case"modelReady":
                    this._maxElapsed = 0;
                    this._promote("item", ref._currentItem);
                    break;
                case"displayReady":
                    this._promote("displayReady", true);
                    var modelRef = this.playerModel;
                    this._syncPlugins(function() {
                        ref._promote("ready");
                        ref._addGUIListeners();
                        if (!modelRef.getState("IDLE")) {
                            modelRef.start()
                        }
                    });
                    break;
                case"qualityChange":
                    this.setConfig({
                        playbackQuality: value
                    });
                    this._promote("qualityChange", value);
                    break;
                case"FFreinit":
                    break;
                case"seek":
                    this._promote("seek", value);
                    break;
                case"volume":
                    this.setConfig({
                        volume: value
                    });
                    this._promote("volume", value);
                    if (value <= 0) {
                        this.env.muted = true;
                        this._promote("mute", value)
                    } else {
                        if (this.env.muted == true) {
                            this.env.muted = false;
                            this._promote("unmute", value)
                        }
                    }
                    break;
                case"playlist":
                    this.setFile(value.file, value.type);
                    break;
                case"config":
                    this.setConfig(value);
                    break;
                case"scaled":
                    if (this.env.autoSize === true) {
                        this.env.playerDom.css({
                            height: value.realHeight + "px",
                            width: value.realWidth + "px"
                        });
                        this._promote("resize", value);
                        this.env.autoSize = false;
                        break
                    }
                    this._promote("scaled", value);
                    break;
                case"time":
                    if (this._maxElapsed < value) {
                        var pct = Math.round(value * 100 / this.getDuration()), evt = false;
                        if (pct < 25) {
                            pct = 25
                        }
                        if (pct > 25 && pct < 50) {
                            evt = "firstquartile";
                            pct = 50
                        }
                        if (pct > 50 && pct < 75) {
                            evt = "midpoint";
                            pct = 75
                        }
                        if (pct > 75 && pct < 100) {
                            evt = "thirdquartile";
                            pct = 100
                        }
                        if (evt != false) {
                            this._promote(evt, value)
                        }
                        this._maxElapsed = (this.getDuration() * pct / 100)
                    }
                default:
                    this._promote(type, value);
                    break
                }
            };
            this._syncPlugins = function(callback) {
                var ref = this;
                this.env.loading = true;
                (function() {
                    try {
                        if (ref._plugins.length > 0) {
                            for (var i = 0; i < ref._plugins.length; i++) {
                                if (!ref._plugins[i].isReady()) {
                                    setTimeout(arguments.callee, 50);
                                    return 
                                }
                            }
                        }
                        ref.env.loading = false;
                        ref._promote("pluginsReady", {});
                        try {
                            callback()
                        } catch (e) {}
                    } catch (e) {}
                })()
            };
            this._MD = function(event) {
                projekktor("#" + event.currentTarget.id.replace(/_media$/, ""))._playerFocusListener(event)
            };
            this._addGUIListeners = function() {
                var ref = this;
                this._removeGUIListeners();
                if (this.getDC().get(0).addEventListener) {
                    this.getDC().get(0).addEventListener("mousedown", this._MD, true)
                } else {
                    this.getDC().mousedown(function(event) {
                        ref._playerFocusListener(event)
                    })
                }
                this.getDC().mousemove(function(event) {
                    ref._playerFocusListener(event)
                }).mouseenter(function(event) {
                    ref._playerFocusListener(event)
                }).mouseleave(function(event) {
                    ref._playerFocusListener(event)
                }).focus(function(event) {
                    ref._playerFocusListener(event)
                }).blur(function(event) {
                    ref._playerFocusListener(event)
                });
                $(window).bind("resize.projekktor" + this.getId(), function() {
                    ref.playerModel.applyCommand("resize")
                }).bind("touchstart", function() {
                    ref._windowTouchListener(event)
                });
                if (this.config.enableKeyboard === true) {
                    $(document.documentElement).unbind("keydown.pp" + this._id);
                    $(document.documentElement).bind("keydown.pp" + this._id, function(evt) {
                        ref._keyListener(evt)
                    })
                }
            };
            this._removeGUIListeners = function() {
                $("#" + this.getId()).unbind();
                this.getDC().unbind();
                if (this.getDC().get(0).removeEventListener) {
                    this.getDC().get(0).removeEventListener("mousedown", this._MD, true)
                } else {
                    this.getDC().get(0).detachEvent("onmousedown", this._MD)
                }
                $(window).unbind("resize.projekktor" + this.getId())
            };
            this._registerPlugins = function() {
                var plugins = $.merge($.merge([], this.config._plugins), this.config._addplugins), pluginName = "", pluginObj = null;
                if (this._plugins.length > 0) {
                    return 
                }
                if (plugins.length == 0) {
                    return 
                }
                for (var i = 0; i < plugins.length; i++) {
                    pluginName = "projekktor" + plugins[i].charAt(0).toUpperCase() + plugins[i].slice(1);
                    try {
                        typeof eval(pluginName)
                    } catch (e) {
                        continue
                    }
                    pluginObj = $.extend(true, {}, new projekktorPluginInterface(), eval(pluginName).prototype);
                    pluginObj.name = plugins[i].toLowerCase();
                    pluginObj.pp = this;
                    pluginObj.playerDom = this.env.playerDom;
                    pluginObj._init(this.config["plugin_" + plugins[i].toLowerCase()] || {});
                    this._plugins.push(pluginObj)
                }
            };
            this.removePlugin = function(rmvPl) {
                if (this._plugins.length == 0) {
                    return 
                }
                var pluginsToRemove = rmvPl || $.merge($.merge([], this.config._plugins), this.config._addplugins), pluginsRegistered = this._plugins.length;
                for (var j = 0; j < pluginsToRemove.length; j++) {
                    for (var k = 0; k < pluginsRegistered; k++) {
                        if (this._plugins[k] != undefined) {
                            if (this._plugins[k].name == pluginsToRemove[j].toLowerCase()) {
                                this._plugins[k].deconstruct();
                                this._plugins.splice(k, 1)
                            }
                        }
                    }
                }
            };
            this._promote = function(evt, value) {
                var event = evt, pluginData = {};
                if (typeof event == "object") {
                    if (!event._plugin) {
                        return 
                    }
                    event = "plugin_" + event._plugin + $p.utils.capitalise(event._event.toUpperCase())
                }
                if (event != "time" && event != "progress" && event != "mousemove") {
                    $p.utils.log("Event: [" + event + "]", value)
                }
                if (this._plugins.length > 0) {
                    for (var i = 0; i < this._plugins.length; i++) {
                        try {
                            this._plugins[i][event + "Handler"](value, this)
                        } catch (e) {}
                        try {
                            this._plugins[i]["eventHandler"](event, value, this)
                        } catch (e) {}
                    }
                }
                if (this.listeners.length > 0) {
                    for (var i = 0; i < this.listeners.length; i++) {
                        try {
                            if (this.listeners[i]["event"] == event || this.listeners[i]["event"] == "*") {
                                this.listeners[i]["callback"](value, this)
                            }
                        } catch (e) {}
                    }
                }
            };
            this._detachplayerModel = function() {
                this._removeGUIListeners();
                try {
                    this.playerModel.destroy();
                    this._promote("detach", {})
                } catch (e) {}
            };
            this._windowTouchListener = function(evt) {
                if (evt.touches) {
                    if (evt.touches.length > 0) {
                        if (($(document.elementFromPoint(evt.touches[0].clientX, evt.touches[0].clientY)).attr("id") || "").indexOf(this.getDC().attr("id"))>-1) {
                            if (this.env.mouseIsOver == false) {
                                this._promote("mouseenter", {})
                            }
                            this.env.mouseIsOver = true;
                            this._promote("mousemove", {});
                            evt.stopPropagation()
                        } else {
                            if (this.env.mouseIsOver) {
                                this._promote("mouseleave", {});
                                this.env.mouseIsOver = false
                            }
                        }
                    }
                }
            };
            this._playerFocusListener = function(evt) {
                var type = evt.type.toLowerCase();
                if ("|TEXTAREA|INPUT".indexOf("|" + evt.target.tagName.toUpperCase())>-1) {
                    this.env.mouseIsOver = false;
                    return 
                }
                switch (type) {
                case"mousedown":
                    if (this.env.mouseIsOver == false) {
                        break
                    }
                    if (evt.which == 3) {
                        if ($(evt.target).hasClass("context")) {
                            break
                        }
                        $(document).bind("contextmenu", function(evt) {
                            $(document).unbind("contextmenu");
                            return false
                        })
                    }
                    break;
                case"mousemove":
                    if (this.env.mouseX != evt.clientX && this.env.mouseY != evt.clientY) {
                        this.env.mouseIsOver = true
                    }
                    if (this.env.clientX == evt.clientX && this.env.clientY == evt.clientY) {
                        return 
                    }
                    this.env.clientX = evt.clientX;
                    this.env.clientY = evt.clientY;
                    break;
                case"focus":
                case"mouseenter":
                    this.env.mouseIsOver = true;
                    break;
                case"blur":
                case"mouseleave":
                    this.env.mouseIsOver = false;
                    break
                }
                this._promote(type, evt)
            };
            this._keyListener = function(evt) {
                if (!this.env.mouseIsOver) {
                    return 
                }
                var ref = this, set = (this.getConfig("keys").length > 0) ? this.getConfig("keys"): [{
                    32: function(player, evt) {
                        player.setPlayPause();
                        evt.preventDefault()
                    },
                    27: function(player) {
                        player.setFullscreen(false)
                    },
                    13: function(player) {
                        player.setFullscreen(true)
                    },
                    39: function(player, evt) {
                        player.setPlayhead("+5");
                        evt.preventDefault()
                    },
                    37: function(player, evt) {
                        player.setPlayhead("-5");
                        evt.preventDefault()
                    },
                    38: function(player, evt) {
                        player.setVolume("+0.05");
                        evt.preventDefault()
                    },
                    40: function(player, evt) {
                        player.setVolume("-0.05");
                        evt.preventDefault()
                    },
                    68: function(player) {
                        player.setDebug()
                    },
                    67: function(player) {
                        $p.utils.log("Config Dump", player.config)
                    },
                    80: function(player) {
                        $p.utils.log("Schedule Dump", player.media)
                    },
                    84: function(player) {
                        $p.utils.log("Cuepoints Dump", player.getCuePoints())
                    }
                }
                ];
                this._promote("key", evt);
                $.each(set || [], function() {
                    try {
                        this[evt.keyCode](ref, evt)
                    } catch (e) {}
                    try {
                        this["*"](ref)
                    } catch (e) {}
                })
            };
            this._enterFullViewport = function(forcePlayer, addClass) {
                var win = this.getIframeWindow() || $(window), target = this.getIframe() || this.getDC(), overflow = $(win[0].document.body).css("overflow");
                if (forcePlayer) {
                    win = $(window);
                    target = this.getDC()
                }
                target.data("fsdata", {
                    scrollTop: win.scrollTop() || 0,
                    scrollLeft: win.scrollLeft() || 0,
                    targetStyle: target.attr("style") || "",
                    bodyOverflow: (overflow == "visible") ? "auto": overflow,
                    iframeWidth: target.attr("width") || 0,
                    iframeHeight: target.attr("height") || 0
                });
                win.scrollTop(0).scrollLeft(0);
                $(win[0].document.body).css("overflow", "hidden");
                target.css({
                    position: "fixed",
                    display: "block",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 99999,
                    margin: 0,
                    padding: 0
                });
                if (addClass !== false) {
                    this.getDC().addClass("fullscreen")
                }
                return target
            };
            this._exitFullViewport = function(forcePlayer) {
                var win = this.getIframeWindow() || $(window), target = this.getIframe() || this.getDC(), fsData = target.data("fsdata") || null;
                if (forcePlayer) {
                    win = $(window);
                    target = this.getDC()
                }
                if (fsData != null) {
                    win.scrollTop(fsData.scrollTop).scrollLeft(fsData.scrollLeft);
                    $(win[0].document.body).css("overflow", fsData.bodyOverflow);
                    if (fsData.iframeWidth > 0&&!forcePlayer) {
                        target.attr("width", fsData.iframeWidth + "px");
                        target.attr("height", fsData.iframeHeight + "px")
                    }
                    target.attr("style", (fsData.targetStyle == null) ? "" : fsData.targetStyle);
                    target.data("fsdata", null)
                }
                this.getDC().removeClass("fullscreen");
                return (this.getIframe()) ? parent.window.document : document
            };
            this.pluginAPI = function() {
                var args = Array.prototype.slice.call(arguments) || null, dest = args.shift(), func = args.shift();
                if (dest != null && func != null) {
                    for (var j = 0; j < this._plugins.length; j++) {
                        if (this._plugins[j].name == dest) {
                            this._plugins[j][func](args[0]);
                            break
                        }
                    }
                }
            };
            this.getPlayerVer = function() {
                return this.config._version
            };
            this.getIsLastItem = function() {
                return ((this._currentItem == this.media.length - 1) && this.config._loop !== true)
            };
            this.getIsFirstItem = function() {
                return ((this._currentItem == 0) && this.config._loop !== true)
            };
            this.getItemConfig = function(name, itemIdx) {
                return this.getConfig(name, itemIdx)
            };
            this.getConfig = function(name, itemIdx) {
                var idx = itemIdx || this._currentItem, result = this.config["_" + name] || this.config[name];
                if (this.config["_" + name] == undefined) {
                    try {
                        if (this.media[idx]["config"][name] !== undefined) {
                            result = this.media[idx]["config"][name]
                        }
                    } catch (e) {}
                }
                if (name.indexOf("plugin_")>-1) {
                    try {
                        if (this.media[idx]["config"][name]) {
                            result = $.extend(true, {}, this.config[name], this.media[idx]["config"][name])
                        }
                    } catch (e) {}
                }
                if (result == null) {
                    return null
                }
                if (typeof result == "object" && result.length === null) {
                    result = $.extend(true, {}, result || {})
                } else {
                    if (typeof result == "object") {
                        result = $.extend(true, [], result || [])
                    }
                }
                if (typeof result == "string") {
                    switch (result) {
                    case"true":
                        result = true;
                        break;
                    case"false":
                        result = false;
                        break;
                    case"NaN":
                    case"undefined":
                    case"null":
                        result = null;
                        break
                    }
                }
                return result
            };
            this.getDC = function() {
                return this.env.playerDom
            };
            this.getState = function(isThis) {
                var result = null;
                try {
                    result = this.playerModel.getState()
                } catch (e) {
                    result = "IDLE"
                }
                if (isThis != null) {
                    return (result == isThis.toUpperCase())
                }
                return result
            };
            this.getLoadProgress = function() {
                try {
                    return this.playerModel.getLoadProgress()
                } catch (e) {
                    return 0
                }
            };
            this.getKbPerSec = function() {
                try {
                    return this.playerModel.getKbPerSec()
                } catch (e) {
                    return 0
                }
            };
            this.getItemCount = function() {
                return (this.media.length == 1 && this.media[0].mediaModel == "na") ? 0 : this.media.length
            };
            this.getItemId = function(idx) {
                return this.media[idx || this._currentItem].ID || null
            };
            this.getItemIdx = function() {
                return this._currentItem
            };
            this.getPlaylist = function() {
                return this.getItem("*")
            };
            this.getItem = function() {
                if (this.media.length == 1 && this.media[0].mediaModel == "na") {
                    return []
                }
                switch (arguments[0] || "current") {
                case"next":
                    return $.extend(true, [], this.media[this._currentItem + 1]);
                case"prev":
                    return $.extend(true, [], this.media[this._currentItem - 1]);
                case"current":
                    return $.extend(true, [], this.media[this._currentItem]);
                case"*":
                    return $.extend(true, [], this.media);
                default:
                    return $.extend(true, [], this.media[arguments[0] || this._currentItem])
                }
            };
            this.getVolume = function() {
                return (this.getConfig("fixedVolume") === true) ? this.config.volume : this.getConfig("volume")
            };
            this.getTrackId = function() {
                if (this.getConfig("trackId")) {
                    return this.config.trackId
                }
                if (this._playlistServer != null) {
                    return "pl" + this._currentItem
                }
                return null
            };
            this.getLoadPlaybackProgress = function() {
                try {
                    return this.playerModel.getLoadPlaybackProgress()
                } catch (e) {
                    return 0
                }
            };
            this.getSource = function() {
                try {
                    return this.playerModel.getSource()[0].src
                } catch (e) {
                    return false
                }
            };
            this.getDuration = function() {
                try {
                    return this.playerModel.getDuration()
                } catch (e) {
                    return 0
                }
            };
            this.getPosition = function() {
                try {
                    return this.playerModel.getPosition() || 0
                } catch (e) {
                    return 0
                }
            };
            this.getMaxPosition = function() {
                try {
                    return this.playerModel.getMaxPosition() || 0
                } catch (e) {
                    return 0
                }
            };
            this.getTimeLeft = function() {
                try {
                    return this.playerModel.getDuration() - this.playerModel.getPosition()
                } catch (e) {
                    return this.media[this._currentItem].duration
                }
            };
            this.getInFullscreen = function() {
                return this.getNativeFullscreenSupport().isFullScreen()
            };
            this.getMediaContainer = function() {
                if (this.env.mediaContainer == null) {
                    this.env.mediaContainer = $("#" + this.getMediaId())
                }
                if (this.env.mediaContainer.length == 0) {
                    if (this.env.playerDom.find("." + this.getNS() + "display").length > 0) {
                        this.env.mediaContainer = $(document.createElement("div")).attr({
                            id: this.getId() + "_media"
                        }).css({
                            overflow: "hidden",
                            height: "100%",
                            width: "100%",
                            top: 0,
                            left: 0,
                            padding: 0,
                            margin: 0,
                            display: "block"
                        }).appendTo(this.env.playerDom.find("." + this.getNS() + "display"))
                    } else {
                        this.env.mediaContainer = $(document.createElement("div")).attr({
                            id: this.getMediaId()
                        }).css({
                            width: "1px",
                            height: "1px"
                        }).appendTo($(document.body))
                    }
                }
                return this.env.mediaContainer
            };
            this.getMediaId = function() {
                return this.getId() + "_media"
            };
            this.getMediaType = function() {
                try {
                    return this._getTypeFromFileExtension(this.playerModel.getSrc()) || "na/na"
                } catch (e) {
                    return "na/na"
                }
            };
            this.getUsesFlash = function() {
                return (this.playerModel.modelId.indexOf("FLASH")>-1)
            };
            this.getModel = function() {
                try {
                    return this.media[this._currentItem].mediaModel.toUpperCase()
                } catch (e) {
                    return "NA"
                }
            };
            this.getIframeWindow = function() {
                try {
                    var result = parent.location.host || false;
                    return (result === false) ? false : $(parent.window)
                } catch (e) {
                    return false
                }
            };
            this.getIframe = function() {
                try {
                    var result = window.$(frameElement) || [];
                    return (result.length == 0) ? false : result
                } catch (e) {
                    return false
                }
            };
            this.getPlaybackQuality = function() {
                var result = "default";
                try {
                    result = this.playerModel.getPlaybackQuality()
                } catch (e) {}
                if (result == "default") {
                    result = this.getConfig("playbackQuality")
                }
                if (result == "default" || $.inArray(result, this.getPlaybackQualities())==-1) {
                    result = this.getAppropriateQuality()
                }
                if ($.inArray(result, this.getPlaybackQualities())==-1) {
                    result = "default"
                }
                return result
            };
            this.getPlaybackQualities = function() {
                try {
                    return $.extend(true, [], this.media[this._currentItem].qualities || [])
                } catch (e) {
                    return []
                }
            };
            this.getIsMobileClient = function(what) {
                var uagent = navigator.userAgent.toLowerCase();
                var mobileAgents = ["android", "windows ce", "blackberry", "palm", "mobile"];
                for (var i = 0; i < mobileAgents.length; i++) {
                    if (uagent.indexOf(mobileAgents[i])>-1) {
                        return (what) ? (mobileAgents[i].toUpperCase() == what.toUpperCase()) : true
                    }
                }
                return false
            };
            this.getCanPlay = function(type, platform, streamType) {
                return this._canPlay(type, platform, streamType)
            };
            this.getCanPlayNatively = function(type) {
                return this._canPlay(type, "NATIVE")
            };
            this._canPlay = function(type, platform, streamType) {
                var ref = this, checkIn = [], checkFor = [], st = streamType || "http", pltfrm = (typeof platform == "object") ? platform: [platform];
                if ($p._compTableCache == null) {
                    $p._compTableCache = this._testMediaSupport()
                }
                $.each(pltfrm, function(key, plt) {
                    if (plt != null) {
                        plt = plt.toUpperCase()
                    }
                    $.each($p._compTableCache[st] || [], function(key, val) {
                        if (plt != null) {
                            if (key != plt) {
                                return true
                            }
                        }
                        checkIn = $.merge(checkIn, this)
                    })
                });
                if (checkIn.length == 0) {
                    return false
                }
                switch (typeof type) {
                case"undefined":
                    return checkIn.length > 0;
                case"string":
                    if (type == "*") {
                        return checkIn
                    }
                    checkFor.push(type);
                    break;
                case"array":
                    checkFor = type;
                    break
                }
                for (var i in checkFor) {
                    if (typeof checkFor[i] !== "string") {
                        break
                    }
                    if ($.inArray(checkFor[i], checkIn)>-1) {
                        return true
                    }
                }
                return false
            };
            this.getPlatform = function() {
                return this.media[this._currentItem].platform || "error"
            };
            this.getPlatforms = function() {
                var result = [], plt = this.getConfig("platforms");
                for (var i = 0; i < plt.length; i++) {
                    try {
                        if ($p.platforms[plt[i].toUpperCase()]("*") > 0) {
                            if (this.getConfig("enable" + plt[i].toUpperCase() + "Platform") === false) {
                                continue
                            }
                            result.push(plt[i].toUpperCase())
                        }
                    } catch (e) {}
                }
                return result
            };
            this.getNativeFullscreenSupport = function() {
                var ref = this, fullScreenApi = {
                    supportsFullScreen: "semi",
                    isFullScreen: function() {
                        try {
                            return ref.getDC().hasClass("fullscreen")
                        } catch (e) {
                            return false
                        }
                    },
                    requestFullScreen: function() {
                        ref._enterFullViewport();
                        ref.playerModel.applyCommand("fullscreen", true)
                    },
                    cancelFullScreen: function() {
                        ref._exitFullViewport();
                        ref.playerModel.applyCommand("fullscreen", false)
                    },
                    prefix: "",
                    ref: this
                }, browserPrefixes = "webkit moz o ms khtml".split(" ");
                if (typeof document.cancelFullScreen != "undefined") {
                    fullScreenApi.supportsFullScreen = true
                } else {
                    for (var i = 0, il = browserPrefixes.length; i < il; i++) {
                        fullScreenApi.prefix = browserPrefixes[i];
                        if (typeof document.createElement("video")[fullScreenApi.prefix + "EnterFullscreen"] != "undefined") {
                            fullScreenApi.supportsFullScreen = "media"
                        }
                        if (typeof document[fullScreenApi.prefix + "CancelFullScreen"] != "undefined") {
                            fullScreenApi.supportsFullScreen = "dom";
                            if (fullScreenApi.prefix == "moz" && typeof document[fullScreenApi.prefix + "FullScreenEnabled"] == "undefined") {
                                fullScreenApi.supportsFullScreen = false
                            }
                        }
                        if (fullScreenApi.supportsFullScreen !== false && fullScreenApi.supportsFullScreen !== "semi") {
                            break
                        }
                    }
                }
                if (fullScreenApi.supportsFullScreen == "semi" || (fullScreenApi.supportsFullScreen == "media" && this.getConfig("forceFullViewport"))) {
                    return fullScreenApi
                }
                fullScreenApi.isFullScreen = function() {
                    var dest = (ref.getIframe()) ? parent.window.document: document;
                    switch (this.prefix) {
                    case"":
                        return dest.fullScreen;
                    case"webkit":
                        return dest.webkitIsFullScreen;
                    case"moz":
                        return dest[this.prefix + "FullScreen"] || ref.getDC().hasClass("fullscreen");
                    default:
                        return dest[this.prefix + "FullScreen"]
                    }
                };
                if (fullScreenApi.supportsFullScreen == "dom") {
                    fullScreenApi.requestFullScreen = function() {
                        if (this.isFullScreen()) {
                            return 
                        }
                        var win = ref.getIframeWindow() || $(window);
                        win.data("fsdata", {
                            scrollTop: win.scrollTop(),
                            scrollLeft: win.scrollLeft()
                        });
                        var target = ref._enterFullViewport(), apiRef = this, dest = (ref.getIframe()) ? parent.window.document: document, win = ref.getIframeWindow() || $(window);
                        $(dest).unbind(this.prefix + "fullscreenchange.projekktor");
                        $(dest).bind(this.prefix + "fullscreenchange.projekktor", function(evt) {
                            if (!apiRef.isFullScreen()) {
                                apiRef.ref._exitFullViewport();
                                apiRef.ref.playerModel.applyCommand("fullscreen", false);
                                var win = apiRef.ref.getIframeWindow() || $(window), fsData = win.data("fsdata");
                                if (fsData != null) {
                                    win.scrollTop(fsData.scrollTop);
                                    win.scrollLeft(fsData.scrollLeft)
                                }
                            } else {
                                apiRef.ref.playerModel.applyCommand("fullscreen", true)
                            }
                        });
                        if (this.prefix === "") {
                            target.get(0).requestFullScreen()
                        } else {
                            target.get(0)[this.prefix + "RequestFullScreen"]()
                        }
                        apiRef.ref.playerModel.applyCommand("fullscreen", true)
                    };
                    fullScreenApi.cancelFullScreen = function() {
                        $((ref.getIframe()) ? parent.window.document : document).unbind(this.prefix + "fullscreenchange.projekktor");
                        var target = ref._exitFullViewport();
                        if (this.prefix == "") {
                            target.cancelFullScreen()
                        } else {
                            target[this.prefix + "CancelFullScreen"]()
                        }
                        var win = ref.getIframeWindow() || $(window), fsData = win.data("fsdata");
                        if (fsData != null) {
                            win.scrollTop(fsData.scrollTop);
                            win.scrollLeft(fsData.scrollLeft)
                        }
                        ref.playerModel.applyCommand("fullscreen", false)
                    };
                    return fullScreenApi
                }
                fullScreenApi.requestFullScreen = function(el) {
                    ref.playerModel.getMediaElement().get(0)[this.prefix + "EnterFullscreen"]()
                };
                fullScreenApi.dest = {};
                fullScreenApi.cancelFullScreen = function() {};
                return fullScreenApi
            };
            this.getId = function() {
                return this._id
            };
            this.getHasGUI = function() {
                try {
                    return this.playerModel.getHasGUI()
                } catch (e) {
                    return false
                }
            };
            this.getCssPrefix = this.getNS = function() {
                return this.config._cssClassPrefix || this.config._ns || "pp"
            };
            this.getPlayerDimensions = function() {
                return {
                    width: this.config._width,
                    height: this.config._height
                }
            };
            this.getMediaDimensions = function() {
                return {
                    width: this.config._width,
                    height: this.config._height
                }
            };
            this.getAppropriateQuality = function() {
                if (this.media.length == 0) {
                    return []
                }
                var wid = this.env.playerDom.width(), hei = this.env.playerDom.height(), ratio = $p.utils.roundNumber(wid / hei, 2), quals = this.media[this._currentItem].qualities || [], temp = {};
                $.each(this.getConfig("playbackQualities") || [], function() {
                    if ($.inArray(this.key, quals) < 0) {
                        return true
                    }
                    if ((this.minHeight || 0) > hei && temp.minHeight <= hei) {
                        return true
                    }
                    if ((temp.minHeight || 0) > this.minHeight) {
                        return true
                    }
                    if (typeof this.minWidth == "number") {
                        if (this.minWidth === 0 && this.minHeight > hei) {
                            return true
                        }
                        if (this.minWidth > wid) {
                            return true
                        }
                        temp = this
                    } else {
                        if (typeof this.minWidth == "object") {
                            var ref = this;
                            $.each(this.minWidth, function() {
                                if ((this.ratio || 100) > ratio) {
                                    return true
                                }
                                if (this.minWidth > wid) {
                                    return true
                                }
                                temp = ref;
                                return true
                            })
                        }
                    }
                    return true
                });
                return temp.key || "default"
            };
            this.getFromUrl = function(url, dest, callback, customParser, dataType) {
                var data = null, ref = this, aSync=!this.getIsMobileClient();
                if (dest == ref && callback == "_reelUpdate") {
                    this._promote("scheduleLoading", 1 + this.getItemCount())
                }
                if (callback.substr(0, 1) != "_") {
                    window[callback] = function(data) {
                        try {
                            delete window[callback]
                        } catch (e) {}
                        dest[callback](data)
                    }
                } else {
                    if (dataType.indexOf("jsonp")>-1) {
                        this["_jsonp" + callback] = function(data) {
                            dest[callback](data)
                        }
                    }
                }
                if (dataType) {
                    if ($.parseJSON == undefined && dataType.indexOf("json")>-1) {
                        this._raiseError("Projekktor requires at least jQuery 1.4.2 in order to handle JSON playlists.");
                        return this
                    }
                    dataType = (dataType.indexOf("/")>-1) ? dataType.split("/")[1] : dataType
                }
                var ajaxConf = {
                    url: url,
                    complete: function(xhr, status) {
                        if (dataType == undefined) {
                            try {
                                if (xhr.getResponseHeader("Content-Type").indexOf("xml")>-1) {
                                    dataType = "xml"
                                }
                                if (xhr.getResponseHeader("Content-Type").indexOf("json")>-1) {
                                    dataType = "json"
                                }
                                if (xhr.getResponseHeader("Content-Type").indexOf("html")>-1) {
                                    dataType = "html"
                                }
                            } catch (e) {}
                        }
                        data = $p.utils.cleanResponse(xhr.responseText, dataType);
                        try {
                            data = customParser(data, xhr.responseText, dest)
                        } catch (e) {}
                        if (status != "error" && dataType != "jsonp") {
                            try {
                                dest[callback](data)
                            } catch (e) {}
                        }
                    },
                    error: function(data) {
                        if (dest[callback] && dataType != "jsonp") {
                            dest[callback](false)
                        }
                    },
                    cache: true,
                    async: aSync,
                    dataType: dataType,
                    jsonpCallback: (callback.substr(0, 1) != "_") ? false: "projekktor('" + this.getId() + "')._jsonp" + callback,
                    jsonp: (callback.substr(0, 1) != "_") ? false: "callback"
                };
                ajaxConf.xhrFields = {
                    withCredentials: true
                };
                ajaxConf.beforeSend = function(xhr) {
                    xhr.withCredentials = true
                };
                $.support.cors = true;
                $.ajax(ajaxConf);
                return this
            };
            this.setActiveItem = function(mixedData) {
                var newItem = 0, lastItem = this._currentItem, ref = this, ap = false;
                if (typeof mixedData == "string") {
                    switch (mixedData) {
                    case"previous":
                        newItem = this._currentItem - 1;
                        break;
                    case"next":
                        newItem = this._currentItem + 1;
                        break;
                    default:
                    case"poster":
                        result = 0;
                        break
                    }
                } else {
                    if (typeof mixedData == "number") {
                        newItem = parseInt(mixedData)
                    } else {
                        newItem = 0
                    }
                }
                if (newItem != this._currentItem) {
                    if (this.getConfig("disallowSkip") == true && (!this.getState("COMPLETED")&&!this.getState("IDLE"))) {
                        return this
                    }
                }
                this._detachplayerModel();
                this.env.loading = false;
                if (newItem === 0 && (lastItem == null || lastItem == newItem) && (this.config._autoplay === true || "DESTROYING|AWAKENING".indexOf(this.getState())>-1)) {
                    ap = true
                } else {
                    if (this.getItemCount() > 1 && newItem != lastItem && lastItem != null && this.config._continuous === true && newItem < this.getItemCount()) {
                        ap = true
                    }
                }
                if (newItem >= this.getItemCount() || newItem < 0) {
                    ap = this.config._loop;
                    newItem = 0
                }
                this._currentItem = newItem;
                var wasFullscreen = this.getDC().hasClass("fullscreen");
                this.getDC().attr("class", this.env.className);
                if (wasFullscreen) {
                    this.getDC().addClass("fullscreen")
                }
                var newModel = this.media[this._currentItem].mediaModel.toUpperCase();
                if (!$p.models[newModel]) {
                    newModel = "NA";
                    this.media[this._currentItem].mediaModel = newModel;
                    this.media[this._currentItem].errorCode = 8
                } else {
                    if (this.getConfig("className", null) != null) {
                        this.getDC().addClass(this.getNS() + this.getConfig("className"))
                    }
                    this.getDC().addClass(this.getNS() + (this.getConfig("streamType") || "http"));
                    if (!$p.utils.cssTransitions() || this.getIsMobileClient()) {
                        this.getDC().addClass("notransitions")
                    }
                }
                this.playerModel = new playerModel();
                $.extend(this.playerModel, $p.models[newModel].prototype);
                this._promote("syncing", "display");
                this._enqueue(function() {
                    try {
                        ref._applyCuePoints()
                    } catch (e) {}
                });
                this.playerModel._init({
                    media: $.extend(true, {}, this.media[this._currentItem]),
                    model: newModel,
                    pp: this,
                    environment: $.extend(true, {}, this.env),
                    autoplay: ap,
                    quality: this.getPlaybackQuality(),
                    fullscreen: this.getInFullscreen()
                });
                return this
            };
            this.setPlay = function() {
                this._enqueue("play", false);
                return this
            };
            this.setPause = function() {
                this._enqueue("pause", false);
                return this
            };
            this.setStop = function(toZero) {
                var ref = this;
                if (this.getState("IDLE")) {
                    return this
                }
                if (toZero) {
                    this._enqueue(function() {
                        ref._currentItem = 0;
                        ref.setActiveItem(0)
                    })
                } else {
                    this._enqueue("stop", false)
                }
                return this
            };
            this.setPlayPause = function() {
                if (!this.getState("PLAYING")) {
                    this.setPlay()
                } else {
                    this.setPause()
                }
                return this
            };
            this.setVolume = function(vol, fadeDelay) {
                if (this.getConfig("fixedVolume") == true) {
                    return this
                }
                var initalVolume = this.getVolume();
                switch (typeof vol) {
                case"string":
                    var dir = vol.substr(0, 1);
                    vol = parseFloat(vol.substr(1));
                    switch (dir) {
                    case"+":
                        vol = this.getVolume() + vol;
                        break;
                    case"-":
                        vol = this.getVolume() - vol;
                        break;
                    default:
                        vol = this.getVolume()
                    }
                case"number":
                    vol = parseFloat(vol);
                    vol = (vol > 1) ? 1 : vol;
                    vol = (vol < 0) ? 0 : vol;
                    break;
                default:
                    return this
                }
                if (vol > initalVolume && fadeDelay) {
                    if (vol - initalVolume > 0.03) {
                        for (var i = initalVolume; i <= vol; i = i + 0.03) {
                            this._enqueue("volume", i, fadeDelay)
                        }
                        this._enqueue("volume", vol, fadeDelay);
                        return this
                    }
                } else {
                    if (vol < initalVolume && fadeDelay) {
                        if (initalVolume - vol > 0.03) {
                            for (var i = initalVolume; i >= vol; i = i - 0.03) {
                                this._enqueue("volume", i, fadeDelay)
                            }
                            this._enqueue("volume", vol, fadeDelay);
                            return this
                        }
                    }
                }
                this._enqueue("volume", vol);
                return this
            };
            this.setPlayhead = function(position) {
                if (this.getConfig("disallowSkip") == true) {
                    return this
                }
                if (typeof position == "string") {
                    var dir = position.substr(0, 1);
                    position = parseFloat(position.substr(1));
                    if (dir == "+") {
                        position = this.getPosition() + position
                    } else {
                        if (dir == "-") {
                            position = this.getPosition() - position
                        } else {
                            position = this.getPosition()
                        }
                    }
                }
                if (typeof position == "number") {
                    this._enqueue("seek", position)
                }
                return this
            };
            this.setPlayerPoster = function(url) {
                var ref = this;
                this._enqueue(function() {
                    ref.setConfig({
                        poster: url
                    }, 0)
                });
                this._enqueue(function() {
                    ref.playerModel.setPosterLive()
                });
                return this
            };
            this.setConfig = function() {
                var ref = this, args = arguments;
                this._enqueue(function() {
                    ref._setConfig(args[0] || null, args[1] || null)
                });
                return this
            };
            this._setConfig = function() {
                if (!arguments.length) {
                    return result
                }
                var confObj = arguments[0], dest = "*", value = false;
                if (typeof confObj != "object") {
                    return this
                }
                if (arguments[1] == "string" || arguments[1] == "number") {
                    dest = arguments[1]
                } else {
                    dest = this._currentItem
                }
                for (var i in confObj) {
                    if (this.config["_" + i] != null) {
                        continue
                    }
                    try {
                        value = eval(confObj[i])
                    } catch (e) {
                        value = confObj[i]
                    }
                    if (dest == "*") {
                        $.each(this.media, function() {
                            if (this.config == null) {
                                this.config = {}
                            }
                            this.config[i] = value
                        });
                        continue
                    }
                    if (this.media[dest] == undefined) {
                        return this
                    }
                    if (this.media[dest]["config"] == null) {
                        this.media[dest]["config"] = {}
                    }
                    this.media[dest]["config"][i] = value
                }
                return this
            };
            this.setFullscreen = function(goFull) {
                if (this.getConfig("isCrossDomain")) {
                    return this
                }
                var nativeFullscreen = this.getNativeFullscreenSupport(), ref = this;
                goFull = (goFull == null)?!nativeFullscreen.isFullScreen() : goFull;
                if (goFull === true) {
                    nativeFullscreen.requestFullScreen()
                } else {
                    nativeFullscreen.cancelFullScreen()
                }
                return this
            };
            this.setResize = function() {
                this._modelUpdateListener("resize");
                return this
            };
            this.setSize = function(data) {
                var w = data.width || this.config._width, h = data.height || this.config._height;
                if (w.indexOf("px")==-1 && w.indexOf("%")==-1) {
                    data.width += "px"
                }
                if (h.indexOf("px")==-1 && h.indexOf("%")==-1) {
                    data.height += "px"
                }
                this.getDC().css({
                    width: data.width,
                    height: data.height
                });
                this.config._width = this.getDC().width();
                this.config._height = this.getDC().height();
                this._modelUpdateListener("resize")
            };
            this.setLoop = function(value) {
                this.config._loop = value ||!this.config._loop
            };
            this.setDebug = function(value) {
                $p.utils.logging = value ||!$p.utils.logging;
                if ($p.utils.logging) {
                    $p.utils.log("DEBUG MODE for player #" + this.getId())
                }
            };
            this.addListener = function(evt, callback) {
                var ref = this;
                this._enqueue(function() {
                    ref._addListener(evt, callback)
                });
                return this
            };
            this._addListener = function(evt, callback) {
                var listenerObj = {
                    event: evt,
                    callback: callback
                };
                this.listeners.push(listenerObj);
                return this
            };
            this.removeListener = function(evt, callback) {
                var len = this.listeners.length;
                for (var i = 0; i < len; i++) {
                    if (this.listeners[i] == undefined) {
                        continue
                    }
                    if (this.listeners[i].event != evt && evt !== "*") {
                        continue
                    }
                    if (this.listeners[i].callback != callback && callback != null) {
                        continue
                    }
                    this.listeners.splice(i, 1)
                }
                return this
            };
            this.setItem = function() {
                var itemData = arguments[0];
                var affectedIdx = 0;
                this._clearqueue();
                if (this.env.loading === true) {}
                if (itemData == null) {
                    affectedIdx = this._removeItem(arguments[1]);
                    if (affectedIdx === this._currentItem) {
                        this.setActiveItem("previous")
                    }
                } else {
                    affectedIdx = this._addItem(this._prepareMedia({
                        file: itemData,
                        config: itemData.config || {}
                    }), arguments[1], arguments[2]);
                    if (affectedIdx === this._currentItem) {
                        this.setActiveItem(this._currentItem)
                    }
                }
                return this
            };
            this.setFile = function() {
                var fileNameOrObject = arguments[0] || "", dataType = arguments[1] || this._getTypeFromFileExtension(fileNameOrObject), result = [];
                if (this.env.loading === true) {
                    return this
                }
                this._clearqueue();
                this.env.loading = true;
                this._detachplayerModel();
                if (typeof fileNameOrObject == "object") {
                    $p.utils.log("Applying incoming JS Object", fileNameOrObject);
                    this._reelUpdate(fileNameOrObject);
                    return this
                }
                result[0] = {};
                result[0].file = {};
                result[0].file.src = fileNameOrObject || "";
                result[0].file.type = dataType || this._getTypeFromFileExtension(splt[0]);
                if (result[0].file.type.indexOf("/xml")>-1 || result[0].file.type.indexOf("/json")>-1) {
                    $p.utils.log("Loading external data from " + result[0].file.src + " supposed to be " + result[0].file.type);
                    this._playlistServer = result[0].file.src;
                    this.getFromUrl(result[0].file.src, this, "_reelUpdate", this.getConfig("reelParser"), result[0].file.type);
                    return this
                }
                $p.utils.log("Applying incoming single file:" + result[0].file.src, result);
                this._reelUpdate(result);
                return this
            };
            this.setPlaybackQuality = function(quality) {
                var qual = quality || this.getAppropriateQuality();
                if ($.inArray(qual, this.media[this._currentItem].qualities || [])>-1) {
                    this.playerModel.applyCommand("quality", qual);
                    this.setConfig({
                        playbackQuality: qual
                    })
                }
                return this
            };
            this.openUrl = function(cfg) {
                cfg = cfg || {
                    url: "",
                    target: "",
                    pause: false
                };
                if (cfg.url == "") {
                    return 
                }
                if (cfg.pause === true) {
                    this.setPause()
                }
                window.open(cfg.url, cfg.target).focus();
                return this
            };
            this.selfDestruct = this.destroy = function() {
                var ref = this;
                this._enqueue(function() {
                    ref._destroy()
                });
                return this
            }, this._destroy = function() {
                var ref = this;
                $(this).unbind();
                this.removePlugin();
                this.playerModel.destroy();
                this._removeGUIListeners();
                $.each(projekktors, function(idx) {
                    try {
                        if (this.getId() == ref.getId() || this.getId() == ref.getId() || this.getParent() == ref.getId()) {
                            projekktors.splice(idx, 1);
                            return 
                        }
                    } catch (e) {}
                });
                this.env.playerDom.replaceWith(this.env.srcNode);
                this._promote("destroyed");
                this.removeListener("*");
                return this
            };
            this.reset = function() {
                var ref = this;
                this.setFullscreen(false);
                this._clearqueue();
                this._enqueue(function() {
                    ref._reset()
                });
                return this
            }, this._reset = function() {
                var cleanConfig = {}, ref = this;
                this.setFullscreen(false);
                $(this).unbind();
                $((this.getIframe()) ? parent.window.document : document).unbind(".projekktor");
                $(window).unbind(".projekktor" + this.getId());
                this.removePlugin();
                this._removeGUIListeners();
                this.env.mediaContainer = null;
                for (var i in this.config) {
                    cleanConfig[(i.substr(0, 1) == "_") ? i.substr(1): i] = this.config[i]
                }
                if (typeof this.env.onReady === "function") {
                    this._enqueue(ref.env.onReady(ref))
                }
                this._init(this.env.playerDom, cleanConfig);
                return this
            }, this.setCuePoint = function(obj, opt) {
                var item = (obj.item !== undefined) ? obj.item: this.getItemIdx(), options = $.extend(true, {
                    offset: 0
                }, opt), ref = this, cuePoint = {
                    id: obj.id || $p.utils.randomId(8),
                    group: obj.group || $p.utils.randomId(8),
                    item: item,
                    on: ($p.utils.toSeconds(obj.on) || 0) + options.offset,
                    off: ($p.utils.toSeconds(obj.off) || $p.utils.toSeconds(obj.on) || 0) + options.offset,
                    value: obj.value || null,
                    callback: obj.callback || function() {},
                    precision: (obj.precision == null) ? 0: obj.precision,
                    title: (obj.title == null) ? "": obj.title,
                    _listeners: [],
                    _unlocked: false,
                    _active: false,
                    _lastTime: 0,
                    isAvailable: function() {
                        return this._unlocked
                    },
                    _stateListener: function(state, player) {
                        if ("STOPPED|COMPLETED|DESTROYING".indexOf(state)>-1) {
                            if (this._active) {
                                try {
                                    this.callback(false, this, player)
                                } catch (e) {}
                            }
                            this._active = false;
                            this._lastTime =- 1
                        }
                    },
                    _timeListener: function(time, player) {
                        if (player.getItemIdx() !== this.item && this.item != "*") {
                            return 
                        }
                        var timeIdx = (this.precision == 0) ? Math.round(time): $p.utils.roundNumber(time, this.precision), ref = this;
                        if (this._unlocked === false) {
                            var approxMaxTimeLoaded = player.getDuration() * player.getLoadProgress() / 100;
                            if (this.on <= approxMaxTimeLoaded || this.on <= timeIdx) {
                                $.each(this._listeners.unlock || [], function() {
                                    this (ref, player)
                                });
                                this._unlocked = true
                            } else {
                                return 
                            }
                        }
                        if (this._lastTime == timeIdx) {
                            return 
                        }
                        var nat = (timeIdx - this._lastTime <= 1 && timeIdx - this._lastTime > 0);
                        if (((timeIdx >= this.on && timeIdx <= this.off) || (timeIdx >= this.on && this.on == this.off && timeIdx <= this.on + 1)) && this._active !== true) {
                            this._active = true;
                            $p.utils.log("Cue Point: [ON " + this.on + "] at " + timeIdx, this);
                            try {
                                this.callback({
                                    id: this.id,
                                    enabled: true,
                                    value: this.value,
                                    seeked: !nat,
                                    player: player
                                })
                            } catch (e) {}
                        } else {
                            if ((timeIdx < this.on || timeIdx > this.off) && this.off != this.on && this._active == true) {
                                this._active = false;
                                $p.utils.log("Cue Point: [OFF] at " + this.off, this);
                                try {
                                    this.callback({
                                        id: this.id,
                                        enabled: false,
                                        value: this.value,
                                        seeked: !nat,
                                        player: player
                                    })
                                } catch (e) {}
                            } else {
                                if (this.off == this.on && this._active && new Number(timeIdx - this.on).toPrecision(this.precision) > 1) {
                                    this._active = false
                                }
                            }
                        }
                        this._lastTime = timeIdx
                    },
                    addListener: function(event, func) {
                        if (this._listeners[event] == null) {
                            this._listeners[event] = []
                        }
                        this._listeners[event].push(func || function() {})
                    }
                };
                if (obj.unlockCallback != null) {
                    cuePoint.addListener("unlock", obj.unlockCallback)
                }
                if (this._cuePoints[item] == null) {
                    this._cuePoints[item] = []
                }
                this._cuePoints[item].push(cuePoint);
                if (!this.getState("IDLE")) {
                    this._promote("cuepointAdded")
                }
                return this
            }, this.getCuePoints = function(idx) {
                return this._cuePoints[idx || this.getItemIdx()] || this._cuePoints || {}
            }, this.getCuePointById = function(id, idx) {
                var result = false, cuePoints = this.getCuePoints(idx);
                for (var j = 0; j < cuePoints.length; j++) {
                    if (cuePoints.id == id) {
                        result = this;
                        break
                    }
                }
                return result
            }, this.removeCuePoints = function(idx, group) {
                var cuePoints = this.getCuePoints(idx) || {}, kill = [];
                for (var cIdx = 0; cIdx < cuePoints.length; cIdx++) {
                    if (cuePoints[cIdx].group == group) {
                        this.removeListener("time", cuePoints[cIdx].timeEventHandler);
                        this.removeListener("state", cuePoints[cIdx].stateEventHandler);
                        kill.push(cIdx)
                    }
                }
                for (var i = 0; i < kill.length; i++) {
                    cuePoints.splice(kill[i] - i, 1)
                }
                return this
            }, this.syncCuePoints = function() {
                var ref = this;
                this._enqueue(function() {
                    try {
                        ref._applyCuePoints()
                    } catch (e) {}
                });
                return this
            }, this._applyCuePoints = function(resync) {
                var ref = this;
                if (this._cuePoints[this._currentItem] == null && this._cuePoints["*"] == null) {
                    return 
                }
                $.each($.merge(this._cuePoints[this._currentItem] || [], this._cuePoints["*"] || []), function(key, cuePointObj) {
                    try {
                        ref.removeListener("time", cuePointObj.timeEventHandler);
                        ref.removeListener("state", cuePointObj.stateEventHandler)
                    } catch (e) {}
                    cuePointObj.timeEventHandler = function(time, player) {
                        try {
                            cuePointObj._timeListener(time, player)
                        } catch (e) {}
                    }, cuePointObj.stateEventHandler = function(state, player) {
                        try {
                            cuePointObj._stateListener(state, player)
                        } catch (e) {}
                    }, ref.addListener("time", cuePointObj.timeEventHandler);
                    ref.addListener("state", cuePointObj.stateEventHandler);
                    ref.addListener("item", function() {
                        ref.removeListener("time", cuePointObj.timeEventHandler);
                        ref.removeListener("state", cuePointObj.stateEventHandler)
                    })
                })
            }, this._enqueue = function(command, params, delay) {
                if (command == null) {
                    return 
                }
                this._queue.push({
                    command: command,
                    params: params,
                    delay: delay
                });
                this._processQueue()
            };
            this._clearqueue = function(command, params) {
                if (this._isReady !== true) {
                    return 
                }
                this._queue = []
            };
            this._processQueue = function() {
                var ref = this, modelReady = false;
                if (this._processing === true) {
                    return 
                }
                if (this.env.loading === true) {
                    return 
                }
                this._processing = true;
                (function() {
                    try {
                        modelReady = ref.playerModel.getIsReady()
                    } catch (e) {}
                    if (ref.env.loading !== true && modelReady) {
                        try {
                            var msg = ref._queue.shift();
                            if (msg != null) {
                                if (typeof msg.command == "string") {
                                    if (msg.delay > 0) {
                                        setTimeout(function() {
                                            ref.playerModel.applyCommand(msg.command, msg.params)
                                        }, msg.delay)
                                    } else {
                                        ref.playerModel.applyCommand(msg.command, msg.params)
                                    }
                                } else {
                                    msg.command(ref)
                                }
                            }
                        } catch (e) {}
                        if (ref._queue.length == 0) {
                            if (ref._isReady === false) {
                                ref._isReady = true
                            }
                            ref._processing = false;
                            return 
                        }
                        arguments.callee();
                        return 
                    }
                    setTimeout(arguments.callee, 100)
                })()
            };
            this._getTypeFromFileExtension = function(url) {
                var fileExt = "", extRegEx = [], extTypes = {}, extRegEx = [];
                for (var i in $p.mmap) {
                    extRegEx.push("\\." + $p.mmap[i].ext);
                    extTypes[$p.mmap[i].ext] = $p.mmap[i]
                }
                extRegEx = "^.*.(" + extRegEx.join("|") + ")";
                try {
                    fileExt = url.match(new RegExp(extRegEx))[1];
                    fileExt = (!fileExt) ? "NaN" : fileExt.replace(".", "")
                } catch (e) {
                    fileExt = "NaN"
                }
                return extTypes[fileExt].type
            };
            this._testMediaSupport = function() {
                var result = {}, streamType = "", ref = this;
                for (var i = 0; i < $p.mmap.length; i++) {
                    platforms = (typeof $p.mmap[i]["platform"] == "object") ? $p.mmap[i]["platform"] : [$p.mmap[i]["platform"]];
                    $.each(platforms, function(_na, platform) {
                        if (platform == null) {
                            return true
                        }
                        var platform = platform.toUpperCase();
                        streamType = $p.mmap[i]["streamType"] || ["http"];
                        $.each(streamType, function(key, st) {
                            if (result[st] == null) {
                                result[st] = {}
                            }
                            if (result[st][platform] == null) {
                                result[st][platform] = []
                            }
                            if ($.inArray($p.mmap[i]["type"], result[st][platform])>-1) {
                                return true
                            }
                            var version = $p.models[$p.mmap[i]["model"].toUpperCase()].prototype[(platform.toLowerCase()) + "Version"] || 1;
                            try {
                                if ($p.platforms[platform.toUpperCase()]($p.mmap[i]["type"]) >= version) {
                                    if (ref.getConfig("enable" + platform.toUpperCase() + "Platform") != false) {
                                        result[st][platform].push($p.mmap[i]["type"])
                                    }
                                    return true
                                }
                            } catch (e) {
                                $p.utils.log("ERROR", "platform " + platform + " not defined")
                            }
                        })
                    })
                }
                return result
            };
            this._raiseError = function(txt) {
                this.env.playerDom.html(txt).css({
                    color: "#fdfdfd",
                    backgroundColor: "#333",
                    lineHeight: this.config.height + "px",
                    textAlign: "center",
                    display: "block"
                });
                this._promote("error")
            };
            this._readMediaTag = function(domNode) {
                var result = {}, htmlTag = "", attr = [], ref = this;
                if ("VIDEOAUDIO".indexOf(domNode[0].tagName.toUpperCase())==-1) {
                    return false
                }
                if (!this.getConfig("ignoreAttributes")) {
                    result = {
                        autoplay: ((domNode.attr("autoplay") !== undefined || domNode.prop("autoplay") !== undefined) && domNode.prop("autoplay") !== false) ? true: false,
                        controls: ((domNode.attr("controls") !== undefined || domNode.prop("controls") !== undefined) && domNode.prop("controls") !== false) ? true: false,
                        loop: ((domNode.attr("autoplay") !== undefined || domNode.prop("loop") !== undefined) && domNode.prop("loop") !== false) ? true: false,
                        title: (domNode.attr("title") !== undefined && domNode.attr("title") !== false) ? domNode.attr("title"): "",
                        poster: (domNode.attr("poster") !== undefined && domNode.attr("poster") !== false) ? domNode.attr("poster"): "",
                        width: (domNode.attr("width") !== undefined && domNode.attr("width") !== false) ? domNode.attr("width"): false,
                        height: (domNode.attr("height") !== undefined && domNode.attr("height") !== false) ? domNode.attr("height"): false
                    }
                }
                htmlTag = $($("<div></div>").html($(domNode).clone())).html();
                attr = ["autoplay", "controls", "loop"];
                for (var i = 0; i < attr.length; i++) {
                    if (htmlTag.indexOf(attr[i])==-1) {
                        continue
                    }
                    result[attr[i]] = true
                }
                result.playlist = [];
                result.playlist[0] = [];
                result.playlist[0]["config"] = {
                    tracks: []
                };
                if (domNode.attr("src")) {
                    result.playlist[0].push({
                        src: domNode.attr("src"),
                        type: domNode.attr("type") || this._getTypeFromFileExtension(domNode.attr("src"))
                    })
                }
                if (!$("<video/>").get(0).canPlayType) {
                    var childNode = domNode;
                    do {
                        childNode = childNode.next("source,track");
                        if (childNode.attr("src")) {
                            switch (childNode.get(0).tagName.toUpperCase()) {
                            case"SOURCE":
                                result.playlist[0].push({
                                    src: childNode.attr("src"),
                                    type: childNode.attr("type") || this._getTypeFromFileExtension(childNode.attr("src")),
                                    quality: childNode.attr("data-quality") || ""
                                });
                                break;
                            case"TRACK":
                                if ($(this).attr("src")) {
                                    result.playlist[0]["config"]["tracks"].push({
                                        src: childNode.attr("src"),
                                        kind: childNode.attr("kind") || "subtitle",
                                        lang: childNode.attr("srclang") || null,
                                        label: childNode.attr("label") || null
                                    })
                                }
                                break
                            }
                        }
                    }
                    while (childNode.attr("src"))
                    }
                if (result.playlist[0].length == 0) {
                    domNode.children("source,track").each(function() {
                        if ($(this).attr("src")) {
                            switch ($(this).get(0).tagName.toUpperCase()) {
                            case"SOURCE":
                                result.playlist[0].push({
                                    src: $(this).attr("src"),
                                    type: $(this).attr("type") || ref._getTypeFromFileExtension($(this).attr("src")),
                                    quality: $(this).attr("data-quality") || ""
                                });
                                break;
                            case"TRACK":
                                result.playlist[0]["config"]["tracks"].push({
                                    src: $(this).attr("src"),
                                    kind: $(this).attr("kind") || "subtitle",
                                    lang: $(this).attr("srclang") || null,
                                    label: $(this).attr("label") || null
                                });
                                break
                            }
                        }
                    })
                }
                return result
            };
            this._applyDimensions = function() {
                if (this.config._height !== false && this.config._width !== false) {
                    if (this.config._width <= this.config._minWidth && this.config._iframe != true) {
                        this.config._width = this.config._minWidth;
                        this.env.autoSize = true
                    }
                    if (this.config._height <= this.config._minHeight && this.config._iframe != true) {
                        this.config._height = this.config._minHeight;
                        this.env.autoSize = true
                    }
                }
                this.env.playerDom.css({});
                if (this.config._height !== false) {
                    this.env.playerDom.css("height", this.config._height + "px")
                }
                if (this.config._width !== false) {
                    this.env.playerDom.css("width", this.config._width + "px")
                }
            };
            this._init = function(customNode, customCfg) {
                var theNode = customNode || srcNode, theCfg = customCfg || cfg, cfgBySource = this._readMediaTag(theNode);
                this.env.srcNode = theNode.wrap("<div></div>").parent().html();
                theNode.unwrap();
                this.env.className = theNode.attr("class") || "";
                this._currentItem = null;
                this._id = theNode[0].id || $p.utils.randomId(8);
                if (cfgBySource !== false) {
                    this.env.playerDom = $("<div/>").attr({
                        "class": theNode[0].className,
                        style: theNode.attr("style")
                    });
                    theNode.replaceWith(this.env.playerDom);
                    theNode.empty().removeAttr("type").removeAttr("src");
                    try {
                        theNode.get(0).pause();
                        theNode.get(0).load()
                    } catch (e) {}
                    $("<div/>").append(theNode).get(0).innerHTML = "";
                    delete (theNode);
                    theNode = null
                } else {
                    cfgBySource = {
                        width: theNode.attr("width") || theNode.css("width") || theNode.width(),
                        height: theNode.attr("height") || theNode.css("height") || theNode.height()
                    };
                    this.env.playerDom = theNode
                }
                theCfg = $.extend(true, {}, cfgBySource, theCfg);
                for (var i in theCfg) {
                    if (this.config["_" + i] != null) {
                        this.config["_" + i] = theCfg[i]
                    } else {
                        if (i.indexOf("plugin_")>-1) {
                            this.config[i] = $.extend(this.config[i], theCfg[i])
                        } else {
                            this.config[i] = theCfg[i]
                        }
                    }
                }
                $p.utils.logging = this.config._debug;
                if (this.getIsMobileClient()) {
                    this.config._autoplay = false;
                    this.config.fixedVolume = true
                }
                this.env.playerDom.attr("id", this._id);
                if (this.config._theme) {
                    switch (typeof this.config._theme) {
                    case"string":
                        break;
                    case"object":
                        this._applyTheme(this.config._theme)
                    }
                } else {
                    this._start(false)
                }
                return this
            };
            this._start = function(data) {
                var ref = this, files = [];
                this._applyDimensions();
                this._registerPlugins();
                if (this.config._iframe === true) {
                    if (this.getIframeWindow()) {
                        this.getIframeWindow().ready(function() {
                            ref._enterFullViewport(true, false)
                        })
                    } else {
                        ref._enterFullViewport(true, false)
                    }
                }
                if (this.getIframeWindow() === false) {
                    this.config._isCrossDomain = true
                }
                if (typeof onReady === "function") {
                    this._enqueue(function() {
                        onReady(ref)
                    })
                }
                for (var i in this.config._playlist[0]) {
                    if (this.config._playlist[0][i].type) {
                        if (this.config._playlist[0][i].type.indexOf("/json")>-1 || this.config._playlist[0][i].type.indexOf("/xml")>-1) {
                            this.setFile(this.config._playlist[0][i].src, this.config._playlist[0][i].type);
                            return this
                        }
                    }
                }
                this.setFile(this.config._playlist);
                return this
            };
            this._applyTheme = function(data) {
                var ref = this;
                if (data === false) {
                    this._raiseError("The Projekktor theme-set specified could not be loaded.");
                    return false
                }
                if (typeof data.css == "string") {
                    $("head").append('<style type="text/css">' + $p.utils.parseTemplate(data.css, {
                        rp: data.baseURL
                    }) + "</style>")
                }
                if (typeof data.html == "string") {
                    this.env.playerDom.html($p.utils.parseTemplate(data.html, {
                        p: this.getNS()
                    }))
                }
                this.env.playerDom.addClass(data.id).addClass(data.variation);
                this.env.className = this.env.className && this.env.className.length !== 0 ? this.env.className + " " + data.id : data.id;
                if (data.variation && data.variation.length !== 0) {
                    this.env.className += " " + data.variation
                }
                if (typeof data.config == "object") {
                    for (var i in data.config) {
                        if (this.config["_" + i] != null) {
                            this.config["_" + i] = data.config[i]
                        } else {
                            if (i.indexOf("plugin_")>-1) {
                                this.config[i] = $.extend(true, {}, this.config[i], data.config[i])
                            } else {
                                this.config[i] = data.config[i]
                            }
                        }
                    }
                    if (typeof data.config.plugins == "object") {
                        for (var i = 0; i < data.config.plugins.length; i++) {
                            try {
                                typeof eval("projekktor" + data.config.plugins[i])
                            } catch (e) {
                                this._raiseError("The applied theme requires the following Projekktor plugin(s): <b>" + data.config.plugins.join(", ") + "</b>");
                                return false
                            }
                        }
                    }
                }
                if (data.onReady) {
                    this._enqueue(function(player) {
                        eval(data.onReady)
                    })
                }
                return this._start()
            };
            return this._init()
        }
    };
    $p.mmap = [];
    $p.models = {};
    $p.newModel = function(obj, ext) {
        var result = false, extend = ($p.models[ext] && ext != undefined) ? $p.models[ext].prototype: {};
        if (typeof obj != "object") {
            return result
        }
        if (!obj.modelId) {
            return result
        }
        if ($p.models[obj.modelId]) {
            return result
        }
        $p.models[obj.modelId] = function() {};
        $p.models[obj.modelId].prototype = $.extend({}, extend, obj);
        for (var i = 0; i < obj.iLove.length; i++) {
            obj.iLove[i].model = obj.modelId.toLowerCase();
            $p.mmap.push(obj.iLove[i])
        }
        return true
    }
});
var projekktorConfig = function(a) {
    this._version = a
};
jQuery(function(a) {
    $p.utils = {
        imageDummy: function() {
            return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABBJREFUeNpi/v//PwNAgAEACQsDAUdpTjcAAAAASUVORK5CYII="
        },
        capitalise: function(b) {
            return b.charAt(0).toUpperCase() + b.slice(1).toLowerCase()
        },
        blockSelection: function(b) {
            if (b) {
                b.css({
                    "-khtml-user-select": "none",
                    "-webkit-user-select": "none",
                    MozUserSelect: "none",
                    "user-select": "none"
                }).attr("unselectable", "on").bind("selectstart", function() {
                    return false
                })
            }
            return b
        },
        unique: function(b) {
            var f = [];
            for (var c = b.length; c--;) {
                var g = b[c];
                if (a.inArray(g, f)===-1) {
                    f.unshift(g)
                }
            }
            return f
        },
        intersect: function(f, c) {
            var b = [];
            a.each(f, function(g) {
                try {
                    if (a.inArray(c, f[g])>-1) {
                        b.push(f[g])
                    }
                } catch (h) {}
                try {
                    if (a.inArray(f[g], c)>-1) {
                        b.push(f[g])
                    }
                } catch (h) {}
            });
            return b
        },
        roundNumber: function(b, c) {
            if (b <= 0 || isNaN(b)) {
                return 0
            }
            return Math.round(b * Math.pow(10, c)) / Math.pow(10, c)
        },
        randomId: function(h) {
            var g = "abcdefghiklmnopqrstuvwxyz", b = "";
            for (var f = 0; f < h; f++) {
                var c = Math.floor(Math.random() * g.length);
                b += g.substring(c, c + 1)
            }
            return b
        },
        toAbsoluteURL: function(j) {
            var b = location, g, n, k, c;
            if (j == null || j == "") {
                return ""
            }
            if (/^\w+:/.test(j)) {
                return j
            }
            g = b.protocol + "//" + b.host;
            if (j.indexOf("/") == 0) {
                return g + j
            }
            n = b.pathname.replace(/\/[^\/]*$/, "");
            k = j.match(/\.\.\//g);
            if (k) {
                j = j.substring(k.length * 3);
                for (c = k.length; c--;) {
                    n = n.substring(0, n.lastIndexOf("/"))
                }
            }
            return g + n + "/" + j
        },
        strip: function(b) {
            return b.replace(/^\s+|\s+$/g, "")
        },
        toSeconds: function(b) {
            var c = 0;
            if (typeof b != "string") {
                return b
            }
            if (b) {
                var f = b.split(":");
                if (f.length > 3) {
                    f = f.slice(0, 3)
                }
                for (i = 0; i < f.length; i++) {
                    c = c * 60 + parseFloat(f[i].replace(",", "."))
                }
            }
            return parseFloat(c)
        },
        toTimeString: function(g, k) {
            var c = Math.floor(g / (60 * 60)), h = g%(60 * 60), f = Math.floor(h / 60), b = h%60, j = Math.floor(b);
            if (c < 10) {
                c = "0" + c
            }
            if (f < 10) {
                f = "0" + f
            }
            if (j < 10) {
                j = "0" + j
            }
            return (k === true) ? c + ":" + f : c + ":" + f + ":" + j
        },
        embeddFlash: function(f, c, n) {
            var h = c.FlashVars || {}, p = "", g = "", o = "", j = "", k = f, b = "";
            if (c.src.indexOf("?")==-1) {
                c.src += "?"
            } else {
                c.src += "&"
            }
            for (var l in h) {
                if (typeof h[l] != "function") {
                    j = h[l];
                    c.src += l + "=" + encodeURIComponent(j) + "&"
                }
            }
            c.src.replace(/&$/, "");
            g = '<object id="' + c.id + '" codebase="https://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0"  name="' + c.name + '" width="' + c.width + '" height="' + c.height + '" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"><param name="movie" value="' + c.src + '"></param><param name="allowScriptAccess" value="' + c.allowScriptAccess + '"></param><param name="allowFullScreen" value="' + c.allowFullScreen + '"></param><param name="wmode" value="' + c.wmode + '"></param>';
            o = "<embed ";
            for (var l in c) {
                if (l.toUpperCase() === "FLASHVARS") {
                    continue
                }
                if (typeof c[l] != "function") {
                    o += l + '="' + c[l] + '" '
                }
            }
            o += ' pluginspage="http://www.macromedia.com/go/getflashplayer" type="application/x-shockwave-flash"></embed>';
            p = g + o;
            p += "</object>";
            if (!document.all || window.opera) {
                p = o
            }
            if (k === null) {
                return p
            }
            k.get(0).innerHTML = p;
            if (n !== false) {
                k.append(a("<div/>").attr("id", c.id + "_cc").css({
                    width: "100%",
                    height: "100%",
                    backgroundColor: ($p.utils.ieVersion() < 9) ? "#000": "transparent",
                    filter: "alpha(opacity = 0.1)",
                    position: "absolute",
                    top: 0,
                    left: 0
                }))
            }
            return a("#" + c.id)[0]
        },
        ieVersion: function() {
            var b = 3, f = document.createElement("div"), c = f.getElementsByTagName("i");
            while (f.innerHTML = "<!--[if gt IE " + (++b) + "]><i></i><![endif]-->", c[0]) {}
            return b > 4 ? b : undefined
        },
        parseTemplate: function(c, g, f) {
            if (g === undefined || g.length == 0 || typeof g != "object") {
                return c
            }
            for (var b in g) {
                c = c.replace(new RegExp("%{" + b + "}", "gi"), ((f === true) ? window.encodeURIComponent(g[b]) : g[b]))
            }
            c = c.replace(/%{(.*?)}/gi, "");
            return c
        },
        stretch: function(h, j, q, o, f, k) {
            if (j == null) {
                return false
            }
            if ((j instanceof a) == false) {
                j = a(j)
            }
            if (j.data("od") == null) {
                j.data("od", {
                    width: j.width(),
                    height: j.height()
                })
            }
            var g = (f !== undefined) ? f: j.data("od").width, b = (k !== undefined) ? k: j.data("od").height, l = (q / g), p = (o / b), c = q, n = o;
            switch (h) {
            case"none":
                c = g;
                n = b;
                break;
            case"fill":
                if (l > p) {
                    c = g * l;
                    n = b * l
                } else {
                    if (l < p) {
                        c = g * p;
                        n = b * p
                    }
                }
                break;
            case"aspectratio":
            default:
                if (l > p) {
                    c = g * p;
                    n = b * p
                } else {
                    if (l < p) {
                        c = g * l;
                        n = b * l
                    }
                }
                break
            }
            q = $p.utils.roundNumber((c / q) * 100, 0);
            o = $p.utils.roundNumber((n / o) * 100, 0);
            if (q == 0 || o == 0) {
                return false
            }
            j.css({
                margin: 0,
                padding: 0,
                width: q + "%",
                height: o + "%",
                left: (100 - q) / 2 + "%",
                top: (100 - o) / 2 + "%"
            });
            if (j.data("od").width != j.width() || j.data("od").height != j.height()) {
                return true
            }
            return false
        },
        parseUri: function(h) {
            var g = {
                strictMode: false,
                key: ["source", "protocol", "authority", "userInfo", "user", "password", "host", "port", "relative", "path", "directory", "file", "query", "anchor"],
                q: {
                    name: "queryKey",
                    parser: /(?:^|&)([^&=]*)=?([^&]*)/g
                },
                parser: {
                    strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
                    loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
                }
            }, b = g.parser[g.strictMode ? "strict": "loose"].exec(h), f = {}, c = 14;
            while (c--) {
                f[g.key[c]] = b[c] || ""
            }
            f[g.q.name] = {};
            f[g.key[12]].replace(g.q.parser, function(k, j, l) {
                if (j) {
                    f[g.q.name][j] = l
                }
            });
            return f
        },
        log: function() {
            if (this.logging == false) {
                return 
            }
            this.history = this.history || [];
            this.history.push(arguments);
            if (window.console) {
                console.log(Array.prototype.slice.call(arguments))
            }
        },
        cleanResponse: function(f, b) {
            var c = false;
            switch (b) {
            case"html":
            case"xml":
                if (window.DOMParser) {
                    c = new DOMParser();
                    c = c.parseFromString(f, "text/xml")
                } else {
                    c = new ActiveXObject("Microsoft.XMLDOM");
                    c.async = "false";
                    c.loadXML(f)
                }
                break;
            case"json":
                c = f;
                if (typeof c == "string") {
                    c = a.parseJSON(c)
                }
                break;
            case"jsonp":
                break;
            default:
                c = f;
                break
            }
            return c
        },
        cssTransitions: function() {
            m = document.createElement("z");
            s = m.style;
            function b(g) {
                for (var f in g) {
                    if (s[g[f]] != null) {
                        return true
                    }
                }
                return false
            }
            function c(g) {
                d = "Webkit Moz O ms Khtml".split(" ");
                var f = g.charAt(0).toUpperCase() + g.substr(1);
                e = (g + " " + d.join(f + " ") + f).split(" ");
                return b(e)
            }
            return c("animationName")
        },
        logging: false
    }
});
jQuery(function(a) {
    $p.platforms = {
        FLASH: function(c) {
            try {
                try {
                    var b = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");
                    try {
                        b.AllowScriptAccess = "always"
                    } catch (f) {
                        return "6,0,0"
                    }
                } catch (f) {}
                return new ActiveXObject("ShockwaveFlash.ShockwaveFlash").GetVariable("$version").replace(/\D+/g, ",").match(/^,?(.+),?$/)[1].match(/\d+/g)[0]
            } catch (f) {
                try {
                    if (navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin) {
                        return (navigator.plugins["Shockwave Flash 2.0"] || navigator.plugins["Shockwave Flash"]).description.replace(/\D+/g, ",").match(/^,?(.+),?$/)[1].match(/\d+/g)[0]
                    }
                } catch (f) {}
            }
            return 0
        },
        ANDROID: function(b) {
            try {
                return parseInt(navigator.userAgent.toLowerCase().match(/android\s+(([\d\.]+))?/)[1])
            } catch (c) {
                return 0
            }
        },
        IOS: function(c) {
            var b = navigator.userAgent.toLowerCase(), f = b.indexOf("os ");
            if ((b.indexOf("iphone")>-1 || b.indexOf("ipad")>-1) && f>-1) {
                return parseInt(b.substr(f + 3, 3).replace("_", "."))
            }
            return 0
        },
        NATIVE: function(c) {
            try {
                var b = document.createElement((c.indexOf("video")>-1) ? "video" : "audio");
                if (b.canPlayType != false) {
                    if (c == "*") {
                        return 1
                    }
                    switch (b.canPlayType(c)) {
                    case"no":
                    case"":
                        return 0;
                    default:
                        return 1
                    }
                }
            } catch (f) {
                return 0
            }
        },
        BROWSER: function(b) {
            return 1
        }
    }
});
var projekktorPluginInterface = function() {};
jQuery(function($) {
    projekktorPluginInterface.prototype = {
        pluginReady: false,
        reqVer: null,
        name: "",
        pp: {},
        config: {},
        playerDom: null,
        canvas: {
            media: null,
            projekktor: null
        },
        _appliedDOMObj: [],
        _pageDOMContainer: {},
        _childDOMContainer: {},
        _init: function(pluginConfig) {
            this.config = $.extend(true, this.config, pluginConfig);
            if (this.reqVer != null) {
                var plv = this.pp.getPlayerVer().split("."), pv = this.reqVer.split(".");
                if (plv[0] * 10000 + plv[1] * 1000 + plv[2] * 10 < pv[0] * 10000 + pv[1] * 1000 + pv[2] * 10) {
                    alert("Plugin '" + this.name + "' requires Projekktor v" + this.reqVer + " or later! Please visit http://www.projekktor.com and get the most recent version.");
                    this.pluginReary = true;
                    return 
                }
            }
            this.initialize()
        },
        getConfig: function(idx, defaultValue) {
            var result = null, def = defaultValue || null;
            if (this.pp.getConfig("plugin_" + this.name) != null) {
                result = this.pp.getConfig("plugin_" + this.name)[idx]
            }
            if (result == null) {
                result = this.pp.getConfig(idx)
            }
            if (result == null) {
                result = this.config[idx]
            }
            if (typeof result == "object" && result.length === null) {
                result = $.extend(true, {}, result, this.config[idx])
            } else {
                if (typeof result == "object") {
                    result = $.extend(true, [], this.config[idx] || [], result || [])
                }
            }
            return (result == null) ? def : result
        },
        getDA: function(name) {
            return "data-" + this.pp.getNS() + "-" + this.name + "-" + name
        },
        getCN: function(name) {
            return this.pp.getNS() + name
        },
        sendEvent: function(eventName, data) {
            this.pp._promote({
                _plugin: this.name,
                _event: eventName
            }, data)
        },
        deconstruct: function() {
            this.pluginReady = false;
            $.each(this._appliedDOMObj, function() {
                $(this).unbind().remove()
            })
        },
        applyToPlayer: function(element, fu, visible) {
            if (!element) {
                return null
            }
            var func = fu || "container", tmpClass = element.attr("class") || this.name;
            this._pageDOMContainer[func] = $("[" + this.getDA("host") + "='" + this.pp.getId() + "'][" + this.getDA("func") + "='" + func + "']");
            this._childDOMContainer[func] = this.playerDom.find("[" + this.getDA("func") + "='" + func + "'],." + this.getCN(tmpClass) + ":not([" + this.getDA("func") + "=''])");
            if (this._pageDOMContainer[func].length > 0) {
                this._pageDOMContainer[func].removeClass("active").addClass("inactive");
                return this._pageDOMContainer[func]
            }
            if (this._childDOMContainer[func].length == 0) {
                element.removeClass(tmpClass).addClass(this.pp.getNS() + tmpClass).removeClass("active").addClass("inactive").attr(this.getDA("func"), func).appendTo(this.playerDom);
                this._childDOMContainer[func] = element;
                this._appliedDOMObj.push(element);
                if (visible === true) {
                    element.addClass("active").removeClass("inactive")
                }
                return element
            }
            if (visible === true) {
                this._childDOMContainer[func].addClass("active").removeClass("inactive")
            }
            return $(this._childDOMContainer[func][0])
        },
        getElement: function(name) {
            return this.pp.env.playerDom.find("." + this.pp.getNS() + name)
        },
        setInactive: function() {
            $(this._pageDOMContainer.container).removeClass("active").addClass("inactive");
            $(this._childDOMContainer.container).removeClass("active").addClass("inactive");
            this.sendEvent("inactive", $.extend(true, {}, this._pageDOMContainer.container, this._childDOMContainer.container))
        },
        setActive: function(elm, on) {
            if (elm == null) {
                this._pageDOMContainer.container.removeClass("inactive").addClass("active");
                this._childDOMContainer.container.removeClass("inactive").addClass("active");
                this.sendEvent("active", $.extend(true, {}, this._pageDOMContainer.container, this._childDOMContainer.container));
                return 
            }
            var dest = (typeof elm == "object") ? elm: this.getElement(elm);
            if (on != false) {
                dest.addClass("active").removeClass("inactive")
            } else {
                dest.addClass("inactive").removeClass("active")
            }
            dest.css("display", "");
            return dest
        },
        getActive: function(elm) {
            return $(elm).hasClass("active")
        },
        initialize: function() {},
        isReady: function() {
            return this.pluginReady
        },
        clickHandler: function(what) {
            try {
                this.pp[this.getConfig(what + "Click").callback](this.getConfig(what + "Click").value)
            } catch (e) {
                try {
                    this.getConfig(what + "Click")(this.getConfig(what + "Click").value)
                } catch (e) {}
            }
            return false
        },
        cookie: function(key, value, exp) {
            if (document.cookie === undefined || document.cookie === false) {
                return null
            }
            if (key == null) {
                return null
            }
            if (arguments.length > 1 && value != null) {
                var t = new Date();
                t.setDate(t.getDate() + (exp || this.pp.getConfig("cookieExpiry")));
                return (document.cookie = encodeURIComponent(this.pp.getConfig("cookieName") + this.name + "_" + key) + "=" + encodeURIComponent(value) + "; expires=" + t.toUTCString() + "; path=/")
            }
            var result, returnthis = (result = new RegExp("(?:^|; )" + encodeURIComponent(this.pp.getConfig("cookieName") + this.name + "_" + key) + "=([^;]*)").exec(document.cookie)) ? decodeURIComponent(result[1]): null;
            return (returnthis == "true" || returnthis == "false") ? eval(returnthis) : returnthis
        }
    }
});
projekktorConfig.prototype = {
    "_playerName": "Projekktor",
    "_playerHome": "http:\/\/www.projekktor.com",
    "_cookieName": "projekktorplayer",
    "_cookieExpiry": 356,
    "_plugins": ["Display", "Controlbar", "Contextmenu"],
    "_addplugins": [],
    "_reelParser": null,
    "_ns": "pp",
    "_platforms": ["browser", "android", "ios", "native", "flash"],
    "_iframe": false,
    "_ignoreAttributes": false,
    "_loop": false,
    "_autoplay": false,
    "_continuous": true,
    "_playlist": [],
    "_theme": {
        "id": "projekktor",
        "baseURL": ".\/"
    },
    "_themeRepo": false,
    "_messages": {
        "0": "An error occurred.",
        "1": "You aborted the media playback. ",
        "2": "A network error caused the media download to fail part-way. ",
        "3": "The media playback was aborted due to a corruption problem. ",
        "4": "The media (%{title}) could not be loaded because the server or network failed.",
        "5": "Sorry, your browser does not support the media format of the requested file.",
        "6": "Your client is in lack of the Flash Plugin V%{flashver} or higher.",
        "7": "No media scheduled.",
        "8": "! Invalid media model configured !",
        "9": "File (%{file}) not found.",
        "10": "Invalid or missing quality settings for %{title}.",
        "11": "Invalid streamType and\/or streamServer settings for %{title}.",
        "12": "Invalid or inconsistent quality setup for %{title}.",
        "80": "The requested file does not exist or is delivered with an invalid content-type.",
        "97": "No media scheduled.",
        "98": "Invalid or malformed playlist data!",
        "99": "Click display to proceed. ",
        "100": "PLACEHOLDER",
        "500": "This Youtube video has been removed or set to private",
        "501": "The Youtube user owning this video disabled embedding.",
        "502": "Invalid Youtube Video-Id specified."
    },
    "_debug": false,
    "_width": 0,
    "_height": 0,
    "_minHeight": 40,
    "_minWidth": 40,
    "_keys": [],
    "_enableNativePlatform": true,
    "_enableFlashPlatform": true,
    "_enableIosPlatform": true,
    "_enableBrowserPlatform": true,
    "_isCrossDomain": false,
    "_forceFullViewport": false,
    "ID": 0,
    "title": null,
    "poster": false,
    "controls": true,
    "start": false,
    "stop": false,
    "volume": 0.5,
    "cover": "",
    "disablePause": false,
    "disallowSkip": false,
    "fixedVolume": false,
    "imageScaling": "aspectratio",
    "videoScaling": "aspectratio",
    "playerFlashMP4": "jarisplayer.swf",
    "playerFlashMP3": "jarisplayer.swf",
    "streamType": "http",
    "streamServer": "",
    "useYTIframeAPI": true,
    "enableKeyboard": true,
    "enableFullscreen": true,
    "playbackQuality": "medium",
    "_playbackQualities": [{
        "key": "small",
        "minHeight": 240,
        "minWidth": 240
    }, {
        "key": "medium",
        "minHeight": 360,
        "minWidth": [{
            "ratio": 1.77,
            "minWidth": 640
        }, {
            "ratio": 1.33,
            "minWidth": 480
        }
        ]
    }, {
        "key": "large",
        "minHeight": 480,
        "minWidth": [{
            "ratio": 1.77,
            "minWidth": 853
        }, {
            "ratio": 1.33,
            "minWidth": 640
        }
        ]
    }, {
        "key": "hd1080",
        "minHeight": 1080,
        "minWidth": [{
            "ratio": 1.77,
            "minWidth": 1920
        }, {
            "ratio": 1.33,
            "minWidth": 1440
        }
        ]
    }, {
        "key": "hd720",
        "minHeight": 720,
        "minWidth": [{
            "ratio": 1.77,
            "minWidth": 1280
        }, {
            "ratio": 1.33,
            "minWidth": 960
        }
        ]
    }, {
        "key": "highres",
        "minHeight": 1081,
        "minWidth": 0
    }
    ],
    "enableTestcard": true,
    "skipTestcard": false,
    "duration": 0,
    "className": ""
};
jQuery(function(a) {
    $p.newModel({
        modelId: "VIDEOFLASH",
        flashVersion: 9,
        iLove: [{
            ext: "flv",
            type: "video/flv",
            platform: "flash",
            streamType: ["http", "pseudo", "rtmp"],
            fixed: true
        }, {
            ext: "mp4",
            type: "video/mp4",
            platform: "flash",
            streamType: ["http", "pseudo", "rtmp"],
            fixed: "maybe"
        }, {
            ext: "mov",
            type: "video/quicktime",
            streamType: ["http", "pseudo", "rtmp"],
            platform: "flash"
        }, {
            ext: "m4v",
            type: "video/mp4",
            platform: "flash",
            streamType: ["http", "pseudo", "rtmp"],
            fixed: "maybe"
        }, {
            ext: "f4m",
            type: "video/abst",
            platform: "flash",
            streamType: ["httpVideoLive"]
        }
        ],
        _eventMap: {
            onprogress: "progressListener",
            ontimeupdate: "timeListener",
            ondatainitialized: "metaDataListener",
            onconnectionsuccess: "startListener",
            onplaypause: "_playpauseListener",
            onplaybackfinished: "endedListener",
            onmute: "volumeListener",
            onvolumechange: "volumeListener",
            onbuffering: "waitingListener",
            onnotbuffering: "canplayListener",
            onconnectionfailed: "errorListener"
        },
        isPseudoStream: false,
        allowRandomSeek: false,
        flashVerifyMethod: "api_source",
        _jarisVolume: 0,
        applyMedia: function(b) {
            var c = {
                id: this.pp.getMediaId() + "_flash",
                name: this.pp.getMediaId() + "_flash",
                src: this.pp.getConfig("playerFlashMP4"),
                width: "100%",
                height: "100%",
                allowScriptAccess: "always",
                allowFullScreen: "false",
                allowNetworking: "all",
                wmode: ($p.utils.ieVersion()) ? "transparent": "opaque",
                bgcolor: "#000000",
                FlashVars: {
                    type: "video",
                    streamtype: (this.pp.getConfig("streamType") != "rtmp") ? "file": "rtmp",
                    server: (this.pp.getConfig("streamType") == "rtmp") ? this.pp.getConfig("streamServer"): "",
                    autostart: "false",
                    hardwarescaling: "true",
                    controls: "false",
                    jsapi: "true",
                    aspectratio: this.pp.getConfig("videoScaling")
                }
            };
            switch (this.pp.getConfig("streamType")) {
            case"rtmp":
                this.allowRandomSeek = true;
                this.media.loadProgress = 100;
                break;
            case"pseudo":
                this.isPseudoStream = true;
                this.allowRandomSeek = true;
                this.media.loadProgress = 100;
                break
            }
            this.createFlash(c, b)
        },
        applySrc: function() {
            var c = this, b = this.getSource();
            this.mediaElement.api_source(b[0].src);
            this.seekedListener();
            if (this.getState("PLAYING")) {
                this.setPlay();
                if (c.isPseudoStream !== true) {
                    this.setSeek(this.media.position || 0)
                }
            }
        },
        addListeners: function() {
            if (this.mediaElement == null) {
                return 
            }
            var b = this;
            a.each(this._eventMap, function(c, d) {
                b.mediaElement.api_addlistener(c, "projekktor('" + b.pp.getId() + "').playerModel." + d)
            })
        },
        removeListeners: function() {
            try {
                this.mediaElement.api_removelistener("*")
            } catch (b) {}
        },
        flashReadyListener: function() {
            this.applySrc();
            this.displayReady()
        },
        errorListener: function(b) {
            this.setTestcard(4)
        },
        volumeListener: function(b) {
            if (this._jarisVolume != b.volume) {
                this._jarisVolume = b.volume;
                this.sendUpdate("volume", b.volume)
            }
        },
        _playpauseListener: function(b) {
            if (b.isplaying) {
                if (this.getModelName().indexOf("AUDIO")>-1) {
                    this.setSeek(this.media.position)
                }
                this.playingListener()
            } else {
                this.pauseListener()
            }
        },
        metaDataListener: function(c) {
            this.applyCommand("volume", this.pp.getConfig("volume"));
            try {
                this.mediaElement.api_seek(this.media.position || 0)
            } catch (b) {}
            this._setState("playing");
            if (this.modelId.indexOf("AUDIO")>-1) {
                this.mediaElement.api_removelistener("ondatainitialized");
                return 
            }
            try {
                this.videoWidth = c.width;
                this.videoHeight = c.height;
                this.sendUpdate("scaled", {
                    width: this.videoWidth,
                    height: this.videoHeight
                })
            } catch (b) {}
        },
        startListener: function(c) {
            this.applyCommand("volume", this.pp.getConfig("volume"));
            try {
                this.mediaElement.api_seek(this.media.position || 0)
            } catch (b) {}
            this._setState("playing")
        },
        setSeek: function(c) {
            if (this.isPseudoStream) {
                this.media.offset = c;
                this.timeListener({
                    position: 0
                });
                this.applySrc()
            } else {
                try {
                    this.mediaElement.api_seek(c)
                } catch (b) {}
                this.seekedListener();
                this.timeListener({
                    position: c
                })
            }
        },
        setVolume: function(b) {
            this._volume = b;
            try {
                this.mediaElement.api_volume(b)
            } catch (c) {
                return false
            }
            return b
        },
        setPause: function(b) {
            try {
                this.mediaElement.api_pause()
            } catch (c) {}
        },
        setPlay: function(b) {
            try {
                this.mediaElement.api_play()
            } catch (c) {}
        },
        getVolume: function() {
            return this._jarisVolume
        },
        detachMedia: function() {
            try {
                a(this.mediaElement).remove()
            } catch (b) {}
        }
    });
    $p.newModel({
        modelId: "AUDIOFLASH",
        iLove: [{
            ext: "mp3",
            type: "audio/mp3",
            platform: "flash",
            streamType: ["http"]
        }, {
            ext: "mp3",
            type: "audio/mpeg",
            platform: "flash",
            streamType: ["http"]
        }, {
            ext: "m4a",
            type: "audio/mp4",
            platform: "flash",
            streamType: ["http"]
        }
        ],
        applyMedia: function(b) {
            $p.utils.blockSelection(b);
            this.imageElement = this.applyImage(this.pp.getConfig("cover") || this.pp.getConfig("poster"), b);
            var c = a("#" + this.pp.getMediaId() + "_flash_container");
            if (c.length == 0) {
                c = a(document.createElement("div")).css({
                    width: "1px",
                    height: "1px"
                }).attr("id", this.pp.getMediaId() + "_flash_container").prependTo(this.pp.getDC())
            }
            var d = {
                id: this.pp.getMediaId() + "_flash",
                name: this.pp.getMediaId() + "_flash",
                src: this.pp.getConfig("playerFlashMP3"),
                width: "1px",
                height: "1px",
                allowScriptAccess: "always",
                allowFullScreen: "false",
                allowNetworking: "all",
                wmode: "transparent",
                bgcolor: "#000000",
                FlashVars: {
                    type: "audio",
                    streamtype: "file",
                    server: "",
                    autostart: "false",
                    hardwarescaling: "false",
                    controls: "false",
                    jsapi: "true"
                }
            };
            this.createFlash(d, c, false)
        }
    }, "VIDEOFLASH")
});
jQuery(function(a) {
    $p.newModel({
        modelId: "VIDEO",
        androidVersion: 2,
        iosVersion: 3,
        nativeVersion: 0,
        iLove: [{
            ext: "mp4",
            type: "video/mp4",
            platform: ["ios", "android", "native"],
            streamType: ["http", "pseudo", "httpVideo"],
            fixed: "maybe"
        }, {
            ext: "ogv",
            type: "video/ogg",
            platform: "native",
            streamType: ["http", "httpVideo"]
        }, {
            ext: "webm",
            type: "video/webm",
            platform: "native",
            streamType: ["http", "httpVideo"]
        }, {
            ext: "ogg",
            type: "video/ogg",
            platform: "native",
            streamType: ["http", "httpVideo"]
        }, {
            ext: "anx",
            type: "video/ogg",
            platform: "native",
            streamType: ["http", "httpVideo"]
        }
        ],
        _eventMap: {
            pause: "pauseListener",
            play: "playingListener",
            volumechange: "volumeListener",
            progress: "progressListener",
            timeupdate: "timeListener",
            ended: "_ended",
            waiting: "waitingListener",
            canplaythrough: "canplayListener",
            canplay: "canplayListener",
            error: "errorListener",
            suspend: "suspendListener",
            seeked: "seekedListener",
            loadstart: null
        },
        allowRandomSeek: false,
        videoWidth: 0,
        videoHeight: 0,
        wasPersistent: true,
        isPseudoStream: false,
        applyMedia: function(b) {
            if (a("#" + this.pp.getMediaId() + "_html").length == 0) {
                this.wasPersistent = false;
                b.html("").append(a("<video/>").attr({
                    id: this.pp.getMediaId() + "_html",
                    poster: (this.pp.getIsMobileClient("ANDROID")) ? this.getPoster(): $p.utils.imageDummy(),
                    loop: false,
                    autoplay: false,
                    "x-webkit-airplay": "allow"
                }).prop({
                    controls: false,
                    volume: this.getVolume()
                }).css({
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    top: 0,
                    left: 0
                }))
            }
            this.mediaElement = a("#" + this.pp.getMediaId() + "_html");
            this.applySrc()
        },
        applySrc: function() {
            var f = this, c = f.getState("PLAYING"), b = f.getState("AWAKENING");
            this.removeListener("error");
            this.removeListener("play");
            this.removeListener("loadstart");
            this.removeListener("canplay");
            this.mediaElement.find("source").remove();
            a.each(this.getSource(), function() {
                a("<source/>").appendTo(f.mediaElement).attr({
                    src: this.src,
                    type: this.type
                })
            });
            var e = function() {
                f.mediaElement.unbind("loadstart.projekktorqs" + f.pp.getId());
                f.mediaElement.unbind("loadeddata.projekktorqs" + f.pp.getId());
                f.mediaElement.unbind("canplay.projekktorqs" + f.pp.getId());
                f.addListeners("error");
                f.addListeners("play");
                f.addListeners("loadstart");
                f.addListeners("canplay");
                f.mediaElement = a("#" + f.pp.getMediaId() + "_html");
                if (b) {
                    f.displayReady();
                    return 
                }
                if (f.getState("SEEKING")) {
                    if (f._isPlaying) {
                        f.setPlay()
                    }
                    f.seekedListener();
                    return 
                }
                if (!f.isPseudoStream) {
                    f.setSeek(f.media.position || 0)
                }
                if (f._isPlaying) {
                    f.setPlay()
                }
            };
            this.mediaElement.bind("loadstart.projekktorqs" + this.pp.getId(), e);
            this.mediaElement.bind("loadeddata.projekktorqs" + this.pp.getId(), e);
            this.mediaElement.bind("canplay.projekktorqs" + this.pp.getId(), e);
            this.mediaElement.get(0).load();
            e();
            var d = navigator.userAgent;
            if (d.indexOf("Android") >= 0) {
                if (parseFloat(d.slice(d.indexOf("Android") + 8)) < 3) {
                    e()
                }
            }
        },
        detachMedia: function() {
            try {
                this.mediaElement[0].pause();
                this.mediaElement.find("source").remove();
                this.mediaElement.load()
            } catch (b) {}
        },
        addListeners: function(e, c) {
            if (this.mediaElement == null) {
                return 
            }
            var f = (c != null) ? ".projekktor" + c + this.pp.getId(): ".projekktor" + this.pp.getId(), d = this, b = (e == null) ? "*": e;
            a.each(this._eventMap, function(g, h) {
                if ((g == b || b == "*") && h != null) {
                    d.mediaElement.bind(g + f, function(i) {
                        d[h](this, i)
                    })
                }
            })
        },
        removeListener: function(b, c) {
            if (this.mediaElement == null) {
                return 
            }
            var e = (c != null) ? ".projekktor" + c + this.pp.getId(): ".projekktor" + this.pp.getId(), d = this;
            a.each(this._eventMap, function(f, g) {
                if (f == b) {
                    d.mediaElement.unbind(f + e)
                }
            })
        },
        _ended: function() {
            var d = this.mediaElement[0].duration, b = (Math.round(this.media.position) === Math.round(d)), c = ((d - this.media.maxpos) < 2) && (this.media.position === 0) || false;
            if (b || c || this.isPseudoStream) {
                this.endedListener(this)
            } else {
                this.pauseListener(this)
            }
        },
        playingListener: function(c) {
            var b = this;
            (function() {
                try {
                    if (b.mediaElement[0].currentSrc != "" && b.mediaElement[0].networkState == b.mediaElement[0].NETWORK_NO_SOURCE && b.getDuration() == 0) {
                        b.setTestcard(80);
                        return 
                    }
                    if (b.getDuration() == 0) {
                        setTimeout(arguments.callee, 500);
                        return 
                    }
                    if (b.mediaElement[0].seekable && b.mediaElement[0].seekable.length > 0) {
                        b.allowRandomSeek = true
                    }
                } catch (d) {}
            })();
            this._setState("playing")
        },
        errorListener: function(d, b) {
            try {
                switch (event.target.error.code) {
                case event.target.error.MEDIA_ERR_ABORTED:
                    this.setTestcard(1);
                    break;
                case event.target.error.MEDIA_ERR_NETWORK:
                    this.setTestcard(2);
                    break;
                case event.target.error.MEDIA_ERR_DECODE:
                    this.setTestcard(3);
                    break;
                case event.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    this.setTestcard(4);
                    break;
                default:
                    this.setTestcard(5);
                    break
                }
            } catch (c) {}
        },
        canplayListener: function(c) {
            var b = this;
            if (this.pp.getConfig("streamType") == "pseudo") {
                a.each(this.media.file, function() {
                    if (this.src.indexOf(b.mediaElement[0].currentSrc)>-1) {
                        if (this.type == "video/mp4") {
                            b.isPseudoStream = true;
                            b.allowRandomSeek = true;
                            b.media.loadProgress = 100;
                            return false
                        }
                    }
                })
            }
            this._setBufferState("full")
        },
        setPlay: function() {
            try {
                this.mediaElement[0].play()
            } catch (b) {}
        },
        setPause: function() {
            try {
                this.mediaElement[0].pause()
            } catch (b) {}
        },
        setVolume: function(b) {
            this._volume = b;
            try {
                this.mediaElement.prop("volume", b)
            } catch (c) {
                return false
            }
            return b
        },
        setSeek: function(c) {
            if (this.isPseudoStream) {
                this.media.position = 0;
                this.media.offset = c;
                this.timeListener();
                this.applySrc();
                return 
            }
            var b = this;
            (function() {
                try {
                    b.mediaElement[0].currentTime = c;
                    b.timeListener({
                        position: c
                    })
                } catch (d) {
                    if (b.mediaElement != null) {
                        setTimeout(arguments.callee, 100)
                    }
                }
            })()
        },
        setFullscreen: function(b) {
            if (this.element == "audio") {
                return 
            }
            this._scaleVideo()
        },
        setResize: function() {
            if (this.element == "audio") {
                return 
            }
            this._scaleVideo(false)
        }
    });
    $p.newModel({
        modelId: "AUDIO",
        iLove: [{
            ext: "ogg",
            type: "audio/ogg",
            platform: "native",
            streamType: ["http"]
        }, {
            ext: "oga",
            type: "audio/ogg",
            platform: "native",
            streamType: ["http"]
        }, {
            ext: "mp3",
            type: "audio/mp3",
            platform: ["ios", "android", "native"],
            streamType: ["http"]
        }, {
            ext: "mp3",
            type: "audio/mpeg",
            platform: ["ios", "android", "native"],
            streamType: ["http"]
        }
        ],
        imageElement: {},
        applyMedia: function(c) {
            var b = this;
            $p.utils.blockSelection(c);
            this.imageElement = this.applyImage(this.pp.getConfig("cover") || this.pp.getConfig("poster"), c);
            this.imageElement.css({
                border: "0px"
            });
            var d = a("#" + this.pp.getMediaId() + "_audio_container");
            if (d.length == 0) {
                d = a("<div/>").css({
                    width: "1px",
                    height: "1px",
                    marginBottom: "-1px"
                }).attr("id", this.pp.getMediaId() + "_audio_container").prependTo(this.pp.getDC())
            }
            d.html("").append(a("<audio/>").attr({
                id: this.pp.getMediaId() + "_html",
                poster: $p.utils.imageDummy(),
                loop: false,
                autoplay: false,
                "x-webkit-airplay": "allow"
            }).prop({
                controls: false,
                volume: this.getVolume()
            }).css({
                width: "1px",
                height: "1px",
                position: "absolute",
                top: 0,
                left: 0
            }));
            this.mediaElement = a("#" + this.pp.getMediaId() + "_html");
            this.applySrc()
        },
        setPosterLive: function() {
            if (this.imageElement.parent) {
                var b = this.imageElement.parent(), c = this;
                if (this.imageElement.attr("src") == c.pp.getConfig("poster")) {
                    return 
                }
                this.imageElement.fadeOut("fast", function() {
                    a(this).remove();
                    c.imageElement = c.applyImage(c.pp.getConfig("poster"), b)
                })
            }
        }
    }, "VIDEO");
    $p.newModel({
        modelId: "VIDEOHLS",
        androidVersion: 3,
        iosVersion: 4,
        iLove: [{
            ext: "m3u8",
            type: "application/mpegURL",
            platform: ["ios", "android"],
            streamType: ["http", "httpVideo", "httpVideoLive"]
        }, {
            ext: "m3u",
            type: "application/mpegURL",
            platform: ["ios", "android"],
            streamType: ["http", "httpVideo", "httpVideoLive"]
        }, {
            ext: "ts",
            type: "video/MP2T",
            platforms: ["ios", "android"],
            streamType: ["http", "httpVideo", "httpVideoLive"]
        }
        ]
    }, "VIDEO")
});
jQuery(function(a) {
    $p.newModel({
        modelId: "IMAGE",
        iLove: [{
            ext: "jpg",
            type: "image/jpeg",
            platform: "browser",
            streamType: ["http"]
        }, {
            ext: "gif",
            type: "image/gif",
            platform: "browser",
            streamType: ["http"]
        }, {
            ext: "png",
            type: "image/png",
            platform: "browser",
            streamType: ["http"]
        }
        ],
        allowRandomSeek: true,
        _position: 0,
        _duration: 0,
        applyMedia: function(b) {
            this.mediaElement = this.applyImage(this.media.file[0].src, b.html(""));
            this._duration = this.pp.getConfig("duration");
            this._position =- 1;
            this.displayReady();
            this._position =- 0.5
        },
        setPlay: function() {
            var b = this;
            this._setBufferState("full");
            this.progressListener(100);
            this.playingListener();
            if (this._duration == 0) {
                b._setState("completed");
                return 
            }(function() {
                if (b._position >= b._duration) {
                    b._setState("completed");
                    return 
                }
                if (!b.getState("PLAYING")) {
                    return 
                }
                b.timeListener({
                    duration: b._duration,
                    position: b._position
                });
                setTimeout(arguments.callee, 500);
                b._position += 0.5
            })()
        },
        detachMedia: function() {
            this.mediaElement.remove()
        },
        setPause: function() {
            this.pauseListener()
        },
        setSeek: function(b) {
            if (b < this._duration) {
                this._position = b
            }
        }
    });
    $p.newModel({
        modelId: "HTML",
        iLove: [{
            ext: "html",
            type: "text/html",
            platform: "browser",
            streamType: ["http"]
        }
        ],
        applyMedia: function(c) {
            var b = this;
            this.mediaElement = a(document.createElement("iframe")).attr({
                id: this.pp.getMediaId() + "_iframe",
                name: this.pp.getMediaId() + "_iframe",
                src: this.media.file[0].src,
                scrolling: "no",
                frameborder: "0",
                width: "100%",
                height: "100%"
            }).css({
                overflow: "hidden",
                border: "0px",
                width: "100%",
                height: "100%"
            }).appendTo(c.html(""));
            this.mediaElement.load(function(d) {
                b.success()
            });
            this.mediaElement.error(function(d) {
                b.remove()
            });
            this._duration = this.pp.getConfig("duration")
        },
        success: function() {
            this.displayReady()
        },
        remove: function() {
            this.mediaElement.remove()
        }
    }, "IMAGE")
});
jQuery(function(a) {
    $p.newModel({
        modelId: "YTVIDEO",
        iLove: [{
            ext: "youtube.com",
            type: "video/youtube",
            platform: "flash",
            fixed: "maybe"
        }
        ],
        allowRandomSeek: true,
        useIframeAPI: true,
        flashVerifyMethod: "cueVideoById",
        _ffFix: false,
        _updateTimer: null,
        init: function(c) {
            var b = this;
            this.useIframeAPI = this.pp.getConfig("useYTIframeAPI") || this.pp.getIsMobileClient();
            this.hasGUI = this.pp.getIsMobileClient();
            if (!this.useIframeAPI) {
                this.requiresFlash = 8;
                this.ready();
                return 
            }
            var d = this.pp.getId();
            if (window.ProjekktorYoutubePlayerAPIReady !== true) {
                a.getScript("http://www.youtube.com/player_api");
                (function() {
                    try {
                        if (window.ProjekktorYoutubePlayerAPIReady == true) {
                            b.ready();
                            return 
                        }
                        setTimeout(arguments.callee, 50)
                    } catch (f) {
                        setTimeout(arguments.callee, 50)
                    }
                })()
            } else {
                this.ready()
            }
            window.onYouTubePlayerAPIReady = function() {
                window.ProjekktorYoutubePlayerAPIReady = true
            }
        },
        applyMedia: function(f) {
            this._setBufferState("empty");
            var e = this, c = (this.modelId == "YTAUDIO") ? 1: "100%", b = (this.modelId == "YTAUDIO") ? 1: "100%";
            if (this.modelId == "YTAUDIO") {
                this.imageElement = this.applyImage(this.pp.getPoster(), f)
            }
            if (this.useIframeAPI) {
                f.html("").append(a("<div/>").attr("id", this.pp.getId() + "_media_youtube").css({
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    top: 0,
                    left: 0
                }));
                var d = a("<div/>").attr("id", this.pp.getId() + "_media_youtube_cc").css({
                    width: "100%",
                    height: "100%",
                    backgroundColor: ($p.utils.ieVersion()) ? "#000": "transparent",
                    filter: "alpha(opacity = 0.1)",
                    position: "absolute",
                    top: 0,
                    left: 0
                });
                f.append(d);
                this.mediaElement = new YT.Player(this.pp.getId() + "_media_youtube", {
                    width: (this.pp.getIsMobileClient()) ? this.pp.config._width: c,
                    height: (this.pp.getIsMobileClient()) ? this.pp.config._height: b,
                    playerVars: {
                        autoplay: 0,
                        disablekb: 0,
                        version: 3,
                        start: 0,
                        controls: (this.pp.getIsMobileClient()) ? 1: 0,
                        showinfo: 0,
                        enablejsapi: 1,
                        start: (this.media.position || 0),
                        origin: window.location.href,
                        wmode: "transparent",
                        modestbranding: 1
                    },
                    videoId: this.youtubeGetId(),
                    events: {
                        onReady: function(h) {
                            e.onReady(h)
                        },
                        onStateChange: function(h) {
                            e.stateChange(h)
                        },
                        onError: function(h) {
                            e.errorListener(h)
                        }
                    }
                })
            } else {
                var g = {
                    id: this.pp.getId() + "_media_youtube",
                    name: this.pp.getId() + "_media_youtube",
                    src: "http://www.youtube.com/apiplayer",
                    width: (this.pp.getIsMobileClient()) ? this.pp.config._width: c,
                    height: (this.pp.getIsMobileClient()) ? this.pp.config._height: b,
                    bgcolor: "#000000",
                    allowScriptAccess: "always",
                    wmode: "transparent",
                    FlashVars: {
                        enablejsapi: 1,
                        autoplay: 0,
                        version: 3,
                        modestbranding: 1,
                        showinfo: 0
                    }
                };
                this.createFlash(g, f)
            }
        },
        flashReadyListener: function() {
            this._youtubeResizeFix();
            this.addListeners();
            this.mediaElement.cueVideoById(this.youtubeGetId(), this.media.position || 0, this._playbackQuality)
        },
        _youtubeResizeFix: function() {
            this.applyCommand("volume", this.pp.getConfig("volume"))
        },
        addListeners: function() {
            this.mediaElement.addEventListener("onStateChange", "projekktor('" + this.pp.getId() + "').playerModel.stateChange");
            this.mediaElement.addEventListener("onError", "projekktor('" + this.pp.getId() + "').playerModel.errorListener");
            this.mediaElement.addEventListener("onPlaybackQualityChange", "projekktor('" + this.pp.getId() + "').playerModel.qualityChangeListener")
        },
        setSeek: function(c) {
            try {
                this.mediaElement.seekTo(c, true);
                if (!this.getState("PLAYING")) {
                    this.timeListener({
                        position: this.mediaElement.getCurrentTime(),
                        duration: this.mediaElement.getDuration()
                    })
                }
            } catch (b) {}
        },
        setVolume: function(b) {
            try {
                this.mediaElement.setVolume(b * 100)
            } catch (c) {}
        },
        setPause: function(b) {
            try {
                this.mediaElement.pauseVideo()
            } catch (c) {}
        },
        setPlay: function(b) {
            try {
                this.mediaElement.playVideo()
            } catch (c) {}
        },
        setQuality: function(c) {
            try {
                this.mediaElement.setPlaybackQuality(c)
            } catch (b) {}
        },
        getVolume: function() {
            try {
                return this.mediaElement.getVolume()
            } catch (b) {}
            return 0
        },
        getPoster: function() {
            return this.media.config["poster"] || this.pp.config.poster || "http://img.youtube.com/vi/" + this.youtubeGetId() + "/0.jpg"
        },
        getPlaybackQuality: function() {
            try {
                return this.mediaElement.getPlaybackQuality()
            } catch (b) {
                return false
            }
        },
        getSrc: function() {
            return this.youtubeGetId() || null
        },
        errorListener: function(b) {
            switch ((b.data == undefined) ? b : b.data) {
            case 100:
                this.setTestcard(500);
                break;
            case 101:
            case 150:
                this.setTestcard(501);
                break;
            case 2:
                this.setTestcard(502);
                break
            }
        },
        stateChange: function(b) {
            clearTimeout(this._updateTimer);
            if (this.mediaElement === null || this.getState("COMPLETED")) {
                return 
            }
            switch ((b.data == undefined) ? b : b.data) {
            case - 1:
                this.setPlay();
                this.ffFix = true;
                break;
            case 0:
                if (this.getState("AWAKENING")) {
                    break
                }
                this._setBufferState("full");
                this.endedListener({});
                break;
            case 1:
                this._setBufferState("full");
                if ((this.media.position || 0) > 0 && this._isFF() && this.ffFix) {
                    this.ffFix = false;
                    this.setSeek(this.media.position)
                }
                this.playingListener({});
                this.canplayListener({});
                this.updateInfo();
                break;
            case 2:
                this.pauseListener({});
                break;
            case 3:
                this.waitingListener({});
                break;
            case 5:
                if (this.useIframeAPI !== true) {
                    this.onReady()
                }
                break
            }
        },
        onReady: function() {
            this.setVolume(this.pp.getVolume());
            a("#" + this.pp.getId() + "_media").attr("ALLOWTRANSPARENCY", true).attr({
                scrolling: "no",
                frameborder: 0
            }).css({
                overflow: "hidden",
                display: "block",
                border: "0"
            });
            if (this.media.title || this.pp.config.title || this.pp.getIsMobileClient()) {
                this.displayReady();
                return 
            }
            var b = this;
            a.ajax({
                url: "http://gdata.youtube.com/feeds/api/videos/" + this.youtubeGetId() + "?v=2&alt=jsonc",
                async: false,
                complete: function(f, c) {
                    try {
                        data = f.responseText;
                        if (typeof data == "string") {
                            data = a.parseJSON(data)
                        }
                        if (data.data.title) {
                            b.sendUpdate("config", {
                                title: data.data.title + " (" + data.data.uploader + ")"
                            })
                        }
                    } catch (d) {}
                    b.displayReady()
                }
            })
        },
        youtubeGetId: function() {
            return encodeURIComponent(this.media.file[0].src.replace(/^[^v]+v.(.{11}).*/, "$1"))
        },
        updateInfo: function() {
            var b = this;
            clearTimeout(this._updateTimer);
            (function() {
                if (b.mediaElement == null) {
                    clearTimeout(b._updateTimer);
                    return 
                }
                try {
                    if (b.getState("PLAYING")) {
                        b.timeListener({
                            position: b.mediaElement.getCurrentTime(),
                            duration: b.mediaElement.getDuration()
                        });
                        b.progressListener({
                            loaded: b.mediaElement.getVideoBytesLoaded(),
                            total: b.mediaElement.getVideoBytesTotal()
                        });
                        b._updateTimer = setTimeout(arguments.callee, 500)
                    }
                } catch (c) {}
            })()
        }
    });
    $p.newModel({
        modelId: "YTAUDIO",
        iLove: [{
            ext: "youtube.com",
            type: "audio/youtube",
            platform: "flash",
            fixed: "maybe"
        }
        ]
    }, "YTVIDEO")
});
var playerModel = function() {};
jQuery(function(a) {
    playerModel.prototype = {
        modelId: "player",
        iLove: [],
        _currentState: null,
        _currentBufferState: null,
        _ap: false,
        _volume: 0,
        _quality: "default",
        _displayReady: false,
        _isPlaying: false,
        _id: null,
        _KbPerSec: 0,
        _bandWidthTimer: null,
        _isPoster: false,
        _isFullscreen: false,
        hasGUI: false,
        allowRandomSeek: false,
        flashVerifyMethod: "api_get",
        mediaElement: null,
        pp: {},
        media: {
            duration: 0,
            position: 0,
            maxpos: 0,
            offset: 0,
            file: false,
            poster: "",
            ended: false,
            loadProgress: 0,
            errorCode: 0
        },
        _init: function(b) {
            this.pp = b.pp || null;
            this.media = a.extend(true, {}, this.media, b.media);
            this._ap = b.autoplay;
            this._isFullscreen = b.fullscreen;
            this._id = $p.utils.randomId(8);
            this._quality = b.quality || this._quality;
            this._volume = this.pp.getVolume();
            this._playbackQuality = this.pp.getPlaybackQuality();
            this.init()
        },
        init: function(b) {
            this.ready()
        },
        ready: function() {
            this.sendUpdate("modelReady");
            if (this._ap) {
                this.sendUpdate("autostart", true);
                this._setState("awakening")
            } else {
                this.displayItem(false)
            }
        },
        displayItem: function(b) {
            if (b !== true || this.getState("STOPPED")) {
                this._setState("idle");
                this.applyImage(this.getPoster(), this.pp.getMediaContainer().html(""));
                this._isPoster = true;
                this.displayReady();
                return 
            }
            a("#" + this.pp.getMediaId() + "_image").remove();
            if (this.hasGUI) {}
            this._displayReady = false;
            this._isPoster = false;
            a("#" + this.pp.getId() + "_testcard_media").remove();
            this.applyMedia(this.pp.getMediaContainer())
        },
        applyMedia: function() {},
        sendUpdate: function(b, c) {
            this.pp._modelUpdateListener(b, c)
        },
        displayReady: function() {
            this._displayReady = true;
            this.pp._modelUpdateListener("displayReady")
        },
        start: function() {
            var b = this;
            if (this.mediaElement == null && this.modelId != "PLAYLIST") {
                return 
            }
            if (this.getState("STARTING")) {
                return 
            }
            this._setState("STARTING");
            if (!this.getState("STOPPED")) {
                this.addListeners()
            }
            if (this.pp.getIsMobileClient("ANDROID")&&!this.getState("PLAYING")) {
                setTimeout(function() {
                    b.setPlay()
                }, 500)
            }
            this.setPlay()
        },
        addListeners: function() {},
        removeListeners: function() {
            try {
                this.mediaElement.unbind(".projekktor" + this.pp.getId())
            } catch (b) {}
        },
        detachMedia: function() {},
        destroy: function() {
            this.removeListeners();
            this._setState("destroying");
            this.detachMedia();
            try {
                a("#" + this.mediaElement.id).empty()
            } catch (b) {}
            if (!this.pp.getIsMobileClient()) {
                try {
                    a("#" + this.mediaElement.id).remove()
                } catch (b) {}
                try {
                    this.mediaElement.remove()
                } catch (b) {}
                this.pp.getMediaContainer().html("")
            }
            this.mediaElement = null;
            this.media.loadProgress = 0;
            this.media.playProgress = 0;
            this.media.position = 0;
            this.media.duration = 0
        },
        reInit: function() {
            if (this.flashVersion != false ||!this._isFF() || this.getState("ERROR") || this.pp.getConfig("bypassFlashFFFix") === true) {
                return 
            }
            this.sendUpdate("FFreinit");
            this.removeListeners();
            this.displayItem((!this.getState("IDLE")))
        },
        applyCommand: function(c, b) {
            switch (c) {
            case"quality":
                this.setQuality(b);
                break;
            case"play":
                if (this.getState("ERROR")) {
                    break
                }
                if (this.getState("IDLE")) {
                    this._setState("awakening");
                    break
                }
                this.setPlay();
                break;
            case"pause":
                if (this.getState("ERROR")) {
                    break
                }
                this.setPause();
                break;
            case"volume":
                if (this.getState("ERROR")) {
                    break
                }
                if (!this.setVolume(b)) {
                    this._volume = b;
                    this.sendUpdate("volume", b)
                }
                break;
            case"stop":
                this.setStop();
                break;
            case"seek":
                if (this.getState("ERROR")) {
                    break
                }
                if (this.getState("SEEKING")) {
                    break
                }
                if (this.getState("IDLE")) {
                    break
                }
                if (this.media.loadProgress==-1) {
                    break
                }
                this._setState("seeking");
                this.sendUpdate("seek", b);
                this.setSeek(b);
                break;
            case"fullscreen":
                if (b == this._isFullscreen) {
                    break
                }
                this._isFullscreen = b;
                this.sendUpdate("fullscreen", this._isFullscreen);
                this.setFullscreen(b);
                this.reInit();
                break;
            case"resize":
                this.setResize();
                this.sendUpdate("resize", b);
                break
            }
        },
        setSeek: function(b) {},
        setPlay: function() {},
        setPause: function() {},
        setStop: function() {
            this.detachMedia();
            this._setState("stopped");
            this.displayItem(false)
        },
        setVolume: function(b) {},
        setFullscreen: function(b) {
            this.setResize()
        },
        setResize: function() {
            var b = this.pp.getMediaContainer();
            this.sendUpdate("scaled", {
                realWidth: this.videoWidth || null,
                realHeight: this.videoHeight || null,
                displayWidth: b.width(),
                displayHeight: b.height()
            })
        },
        setPosterLive: function() {},
        setQuality: function(c) {
            var b = [];
            if (this._quality == c) {
                return 
            }
            this._quality = c;
            if (this.getState("PLAYING") || this.getState("PAUSED")) {
                this.applySrc()
            }
            this.qualityChangeListener()
        },
        applySrc: function() {},
        getSource: function() {
            var c = [], e = this.media.offset || this.pp.getConfig("start") || false, d = this, b = (this.pp.getConfig("streamType") == "pseudo") ? this.pp.getConfig("startParameter"): false;
            a.each(this.media.file || [], function() {
                if (d._quality != this.quality && d._quality != null) {
                    return true
                }
                if (!b ||!e) {
                    c.push(this);
                    return true
                }
                var f = $p.utils.parseUri(this.src), h = f.protocol + "://" + f.host + f.path, g = [];
                a.each(f.queryKey, function(i, j) {
                    if (i == b) {
                        return true
                    }
                    g.push(i + "=" + j)
                });
                h += (g.length > 0) ? "?" + g.join("&") + "&" + b + "=" + e : "?" + b + "=" + e;
                this.src = h;
                c.push(this);
                return true
            });
            if (c.length == 0) {
                return this.media.file
            } else {
                return c
            }
        },
        getVolume: function() {
            if (this.mediaElement == null) {
                return this._volume
            }
            return (this.mediaElement.prop("muted") == true) ? 0 : this.mediaElement.prop("volume")
        },
        getLoadProgress: function() {
            return this.media.loadProgress || 0
        },
        getLoadPlaybackProgress: function() {
            return this.media.playProgress || 0
        },
        getPosition: function() {
            return this.media.position || 0
        },
        getDuration: function() {
            return this.media.duration || 0
        },
        getMaxPosition: function() {
            return this.media.maxpos || 0
        },
        getPlaybackQuality: function() {
            return (a.inArray(this._quality, this.media.qualities)>-1) ? this._quality : "default"
        },
        getInFullscreen: function() {
            return this.pp.getInFullscreen()
        },
        getKbPerSec: function() {
            return this._KbPerSec
        },
        getState: function(c) {
            var b = (this._currentState == null) ? "IDLE": this._currentState;
            if (c != null) {
                return (b == c.toUpperCase())
            }
            return b
        },
        getSrc: function() {
            try {
                return this.mediaElement[0].currentSrc
            } catch (b) {}
            try {
                return this.media.file[0].src
            } catch (b) {}
            try {
                return this.getPoster()
            } catch (b) {}
            return null
        },
        getModelName: function() {
            return this.modelId || null
        },
        getHasGUI: function() {
            return (this.hasGUI&&!this._isPoster)
        },
        getIsReady: function() {
            return this._displayReady
        },
        getPoster: function() {
            return this.pp.getConfig("poster")
        },
        getMediaElement: function() {
            return this.mediaElement || a("<video/>")
        },
        timeListener: function(e) {
            if (e == null) {
                return 
            }
            var b = parseFloat(e.position) || parseFloat(e.currentTime) || this.media.position || 0, d = parseFloat(e.duration) || null, c = 0;
            if (isNaN(d + b)) {
                return 
            }
            if (d != null && (d != this.media.duration&&!this.isPseudoStream) || (this.isPseudoStream && this.media.duration == 0)) {
                this.media.duration = d;
                this.sendUpdate("durationChange", d)
            }
            this.media.position = this.media.offset + b;
            this.media.maxpos = Math.max(this.media.maxpos || 0, this.media.position || 0);
            this.media.playProgress = parseFloat((this.media.position > 0 && this.media.duration > 0) ? this.media.position * 100 / this.media.duration : 0);
            this.sendUpdate("time", this.media.position);
            this.loadProgressUpdate()
        },
        loadProgressUpdate: function() {
            try {
                var d = this.mediaElement.get(0);
                if (typeof d.buffered !== "object") {
                    return 
                }
                if (typeof d.buffered.length <= 0) {
                    return 
                }
                var b = Math.round(d.buffered.end(d.buffered.length - 1) * 100) / 100, c = b * 100 / this.media.duration;
                if (c == this.media.loadProgress) {
                    return 
                }
                this.media.loadProgress = (this.allowRandomSeek === true) ? 100 : - 1;
                this.media.loadProgress = (this.media.loadProgress < 100 || this.media.loadProgress == undefined) ? c : 100;
                this.sendUpdate("progress", this.media.loadProgress)
            } catch (f) {}
        },
        progressListener: function(h, c) {
            try {
                if (typeof this.mediaElement[0].buffered == "object") {
                    if (this.mediaElement[0].buffered.length > 0) {
                        this.mediaElement.unbind("progress");
                        return 
                    }
                }
            } catch (g) {}
            if (this._bandWidthTimer == null) {
                this._bandWidthTimer = (new Date()).getTime()
            }
            var f = 0, d = 0;
            try {
                if (!isNaN(c.loaded / c.total)) {
                    f = c.loaded;
                    d = c.total
                } else {
                    if (c.originalEvent&&!isNaN(c.originalEvent.loaded / c.originalEvent.total)) {
                        f = c.originalEvent.loaded;
                        d = c.originalEvent.total
                    }
                }
            } catch (g) {
                if (h&&!isNaN(h.loaded / h.total)) {
                    f = h.loaded;
                    d = h.total
                }
            }
            var b = (f > 0 && d > 0) ? f * 100 / d: 0;
            if (Math.round(b) > Math.round(this.media.loadProgress)) {
                this._KbPerSec = ((f / 1024) / (((new Date()).getTime() - this._bandWidthTimer) / 1000))
            }
            b = (this.media.loadProgress !== 100) ? b : 100;
            b = (this.allowRandomSeek === true) ? 100 : b;
            if (this.media.loadProgress != b) {
                this.media.loadProgress = b;
                this.sendUpdate("progress", b)
            }
            if (this.media.loadProgress >= 100 && this.allowRandomSeek == false) {
                this._setBufferState("full")
            }
        },
        qualityChangeListener: function() {
            this.sendUpdate("qualityChange", this._quality)
        },
        endedListener: function(b) {
            if (this.mediaElement === null) {
                return 
            }
            if (this.media.maxpos <= 0) {
                return 
            }
            if (this.getState() == "STARTING") {
                return 
            }
            this._setState("completed")
        },
        waitingListener: function(b) {
            this._setBufferState("empty")
        },
        canplayListener: function(b) {
            this._setBufferState("full")
        },
        canplaythroughListener: function(b) {
            this._setBufferState("full")
        },
        suspendListener: function(b) {
            this._setBufferState("full")
        },
        playingListener: function(b) {
            this._setState("playing")
        },
        startListener: function(b) {
            this.applyCommand("volume", this.pp.getConfig("volume"));
            if (!this.isPseudoStream) {
                this.setSeek(this.media.position || 0)
            }
            this._setState("playing")
        },
        pauseListener: function(b) {
            this._setState("paused")
        },
        seekedListener: function(b) {
            if (this._isPlaying) {
                this._setState("PLAYING")
            } else {
                this._setState("PAUSED")
            }
        },
        volumeListener: function(b) {
            this.sendUpdate("volume", this.getVolume())
        },
        flashReadyListener: function() {
            this._displayReady = true
        },
        errorListener: function(b, c) {},
        metaDataListener: function(c) {
            try {
                this.videoWidth = c.videoWidth;
                this.videoHeight = c.videoHeight
            } catch (b) {}
            this._scaleVideo()
        },
        setTestcard: function(f, b) {
            var e = this.pp.getMediaContainer(), d = this.pp.getConfig("messages"), c = (d[f] != undefined) ? d[f]: d[0];
            c = (b != undefined && b != "") ? b : c;
            if (this.pp.getConfig("skipTestcard") && this.pp.getItemCount() > 1) {
                this._setState("completed");
                return 
            }
            if (this.pp.getItemCount() > 1) {
                c += " " + d[99]
            }
            if (c.length < 3) {
                c = "ERROR"
            }
            if (f == 100) {
                c = b
            }
            c = $p.utils.parseTemplate(c, a.extend({}, this.media, {
                title: this.pp.getConfig("title")
            }));
            e.html("").css({
                width: "100%",
                height: "100%"
            });
            this.mediaElement = a("<div>").addClass(this.pp.getNS() + "testcard").attr("id", this.pp.getId() + "_testcard_media").html("<p>" + c + "</p>").appendTo(e);
            $p.utils.blockSelection(this.mediaElement);
            this._setState("error")
        },
        applyImage: function(e, c) {
            var g = a(document.createElement("img")).hide(), f = this;
            $p.utils.blockSelection(g);
            if (e == "" || e == undefined) {
                return a(document.createElement("span")).attr({
                    id: this.pp.getMediaId() + "_image"
                }).appendTo(c)
            }
            g.html("").appendTo(c).attr({
                id: this.pp.getMediaId() + "_image",
                alt: this.pp.getConfig("title") || ""
            }).css({
                position: "absolute"
            });
            g.error(function(h) {
                a(this).remove()
            });
            var b = function(h) {
                h.realWidth = h.prop("width");
                h.realHeight = h.prop("height");
                h.width = function() {
                    return h.realWidth
                };
                h.height = function() {
                    return h.realHeight
                }
            };
            g.load(function(h) {
                g.show();
                b(g);
                $p.utils.stretch(f.pp.getConfig("imageScaling"), g, c.width(), c.height())
            });
            g.attr("src", e);
            var d = function(j, h) {
                return;
                if (h.is(":visible") === false) {
                    f.pp.removeListener("fullscreen", arguments.callee)
                }
                b(j);
                var i = h.width(), k = h.height(), l = j.width(), n = j.height();
                if ($p.utils.stretch(f.pp.getConfig("imageScaling"), j, h.width(), h.height())) {
                    try {
                        f.sendUpdate("scaled", {
                            realWidth: j._originalDimensions.width,
                            realHeight: j._originalDimensions.height,
                            displayWidth: f.mediaElement.width(),
                            displayHeight: f.mediaElement.height()
                        })
                    } catch (m) {}
                }
            };
            this.pp.addListener("fullscreen", function() {
                d(g, c)
            });
            this.pp.addListener("resize", function() {
                d(g, c)
            });
            return g
        },
        createFlash: function(d, b, c) {
            this.mediaElement = $p.utils.embeddFlash(b.html(""), d, c);
            this._waitforPlayer()
        },
        _waitforPlayer: function() {
            if (this._displayReady == true) {
                return 
            }
            this._setBufferState("empty");
            var c = this, b = 0;
            (function() {
                if (b > 6 && c._isFF()) {
                    b = 0;
                    var d = a(c.mediaElement).parent(), g = a(c.mediaElement).clone();
                    d.html("").append(g);
                    c.mediaElement = g.get(0)
                }
                var d = c.mediaElement;
                try {
                    if (a(d).attr("id").indexOf("testcard")>-1) {
                        return 
                    }
                } catch (f) {}
                b++;
                try {
                    if (d == undefined) {
                        setTimeout(arguments.callee, 200)
                    } else {
                        if (d[c.flashVerifyMethod] == undefined) {
                            setTimeout(arguments.callee, 200)
                        } else {
                            c._setBufferState("full");
                            c.flashReadyListener()
                        }
                    }
                } catch (f) {
                    setTimeout(arguments.callee, 200)
                }
            })()
        },
        _setState: function(c) {
            var b = this;
            c = c.toUpperCase();
            if (this._currentState != c) {
                if (this._currentState == "PAUSED" && c == "PLAYING") {
                    this.sendUpdate("resume", this.media);
                    this._isPlaying = true
                }
                if ((this._currentState == "IDLE" || this._currentState == "STARTING") && c == "PLAYING") {
                    this.sendUpdate("start", this.media);
                    this._isPlaying = true
                }
                if (c == "PAUSED") {
                    this._isPlaying = false
                }
                if (c == "ERROR") {
                    this.setPlay = this.setPause = function() {
                        b.sendUpdate("start")
                    }
                }
                this._currentState = c.toUpperCase();
                this.sendUpdate("state", this._currentState)
            }
        },
        _setBufferState: function(b) {
            if (this._currentBufferState != b.toUpperCase()) {
                this._currentBufferState = b.toUpperCase();
                this.sendUpdate("buffer", this._currentBufferState)
            }
        },
        _scaleVideo: function(h) {
            var d = this.pp.getMediaContainer();
            if (this.pp.getIsMobileClient()) {
                return 
            }
            try {
                var f = d.width(), i = d.height(), b = this.videoWidth, c = this.videoHeight;
                if ($p.utils.stretch(this.pp.getConfig("videoScaling"), this.mediaElement, f, i, b, c)) {
                    this.sendUpdate("scaled", {
                        realWidth: b,
                        realHeight: c,
                        displayWidth: f,
                        displayHeight: i
                    })
                }
            } catch (g) {}
        },
        _isFF: function() {
            return navigator.userAgent.toLowerCase().indexOf("firefox")>-1
        }
    }
});
jQuery(function(a) {
    $p.newModel({
        modelId: "NA",
        iLove: [{
            ext: "NaN",
            type: "none/none",
            platform: "browser"
        }
        ],
        hasGUI: true,
        applyMedia: function(c) {
            c.html("");
            var b = this;
            this.mouseClick = function(d) {
                b.pp.removeListener("mousedown", arguments.callee);
                b._setState("completed")
            };
            this.displayReady();
            if (this.pp.getConfig("enableTestcard")&&!this.pp.getIsMobileClient()) {
                this.setTestcard((this.media.file[0].src != null && this.media.errorCode === 7) ? 5 : this.media.errorCode);
                this.pp.addListener("mousedown", mouseClick)
            } else {
                this.applyCommand("stop");
                window.location.href = this.media.file[0].src
            }
        },
        detachMedia: function() {
            this.pp.removeListener("leftclick", this.mouseClick)
        }
    })
});
jQuery(function(a) {
    $p.newModel({
        modelId: "PLAYLIST",
        iLove: [{
            ext: "json",
            type: "text/json",
            platform: "browser"
        }, {
            ext: "jsonp",
            type: "text/jsonp",
            platform: "browser"
        }, {
            ext: "xml",
            type: "text/xml",
            platform: "browser"
        }, {
            ext: "json",
            type: "application/json",
            platform: "browser"
        }, {
            ext: "jsonp",
            type: "application/jsonp",
            platform: "browser"
        }, {
            ext: "xml",
            type: "application/xml",
            platform: "browser"
        }
        ],
        applyMedia: function(b) {
            this.displayReady()
        },
        setPlay: function() {
            this.sendUpdate("playlist", this.media)
        }
    })
});
var projekktorDisplay = function() {};
jQuery(function(a) {
    projekktorDisplay.prototype = {
        logo: null,
        logoIsFading: false,
        display: null,
        displayClicks: 0,
        buffIcn: null,
        buffIcnSprite: null,
        bufferDelayTimer: null,
        _controlsDims: null,
        config: {
            displayClick: {
                callback: "setPlayPause",
                value: null
            },
            displayPlayingClick: {
                callback: "setPlayPause",
                value: null
            },
            displayDblClick: {
                callback: null,
                value: null
            },
            staticControls: false,
            bufferIconDelay: 1000,
            designMode: false,
            spriteUrl: "",
            spriteWidth: 50,
            spriteHeight: 50,
            spriteTiles: 25,
            spriteOffset: 1,
            spriteCountUp: false
        },
        initialize: function() {
            this.display = this.applyToPlayer(a("<div/>"));
            this.startButton = this.applyToPlayer(a("<div/>").addClass("start"), "startbtn");
            this.buffIcn = this.applyToPlayer(a("<div/>").addClass("buffering"), "buffericn");
            this.setActive();
            if (this.config.spriteUrl != "") {
                this.buffIcnSprite = a("<div/>").appendTo(this.buffIcn).css({
                    width: this.config.spriteWidth,
                    height: this.config.spriteHeight,
                    marginLeft: ((this.buffIcn.width() - this.config.spriteWidth) / 2) + "px",
                    marginTop: ((this.buffIcn.height() - this.config.spriteHeight) / 2) + "px",
                    backgroundColor: "transparent",
                    backgroundImage: "url(" + this.config.spriteUrl + ")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "0 0"
                }).addClass("inactive")
            }
            this.pp.getMediaContainer();
            this.pluginReady = true
        },
        displayReadyHandler: function() {
            var b = this;
            this.startButton.unbind().click(function() {
                b.pp.setPlay()
            });
            this.hideStartButton();
            if (this.getConfig("designMode")) {
                this.shofBufferIcon()
            }
        },
        syncingHandler: function() {
            this.showBufferIcon();
            if (this.pp.getState("IDLE")) {
                this.hideStartButton()
            }
        },
        readyHandler: function() {
            this.hideBufferIcon();
            if (this.pp.getState("IDLE")) {
                this.showStartButton()
            }
        },
        bufferHandler: function(b) {
            if (!this.pp.getState("PLAYING")&&!this.pp.getState("AWAKENING")) {
                return 
            }
            if (b == "EMPTY") {
                this.showBufferIcon()
            } else {
                this.hideBufferIcon()
            }
        },
        stateHandler: function(b) {
            switch (b) {
            case"STARTING":
                this.showBufferIcon();
                this.hideStartButton();
                break;
            case"PLAYING":
                this.hideBufferIcon();
                this.hideStartButton();
                break;
            case"IDLE":
                this.showStartButton();
                break;
            case"AWAKENING":
                this.hideStartButton();
                break;
            case"ERROR":
                this.hideBufferIcon();
                this.hideStartButton();
                break;
            case"COMPLETED":
                this.hideBufferIcon();
                break;
            default:
                this.hideStartButton()
            }
        },
        stoppedHandler: function() {
            this.hideBufferIcon()
        },
        scheduleLoadingHandler: function() {
            this.hideStartButton();
            this.showBufferIcon()
        },
        scheduledHandler: function() {
            if (!this.getConfig("autoplay")) {
                this.showStartButton()
            }
            this.hideBufferIcon()
        },
        plugineventHandler: function(c) {
            if (c.PLUGIN == "controlbar" && c.EVENT == "show" && this.getConfig("staticControls")) {
                var b = c.height * 100 / this.pp.getDC().height();
                this.display.height((100 - b) + "%").data("sc", true)
            }
        },
        mousemoveHandler: function(b) {
            var c = this.display;
            c.css("cursor", "auto");
            clearTimeout(this._cursorTimer);
            if ("IDLE|AWAKENING|ERROR|PAUSED".indexOf(this.pp.getState())==-1) {
                this._cursorTimer = setTimeout(function() {
                    c.css("cursor", "none")
                }, 3000)
            }
        },
        mousedownHandler: function(b) {
            var c = this;
            if ((a(b.target).attr("id") || "").indexOf("_media")==-1) {
                return 
            }
            clearTimeout(this._cursorTimer);
            this.display.css("cursor", "auto");
            if (b.which != 1) {
                return 
            }
            switch (this.pp.getState()) {
            case"ERROR":
                this.pp.setConfig({
                    disallowSkip: false
                });
                this.pp.setActiveItem("next");
                return;
            case"IDLE":
                this.pp.setPlay();
                return 
            }
            if (this.pp.getHasGUI() == true) {
                return 
            }
            this.displayClicks++;
            if (this.displayClicks > 0) {
                setTimeout(function() {
                    if (c.displayClicks == 1) {
                        if (c.pp.getState() == "PLAYING") {
                            c.clickHandler("displayPlaying")
                        } else {
                            c.clickHandler("display")
                        }
                    } else {
                        if (c.displayClicks == 2) {
                            c.clickHandler("displayDbl")
                        }
                    }
                    c.displayClicks = 0
                }, 250)
            }
            return 
        },
        showStartButton: function() {
            this.startButton.addClass("active").removeClass("inactive")
        },
        hideStartButton: function() {
            this.startButton.addClass("inactive").removeClass("active")
        },
        hideBufferIcon: function() {
            var b = this;
            clearTimeout(this.bufferDelayTimer);
            this.buffIcn.addClass("inactive").removeClass("active")
        },
        showBufferIcon: function(c) {
            var e = this;
            clearTimeout(this.bufferDelayTimer);
            if (this.pp.getHasGUI()) {
                return 
            }
            if ((this.pp.getModel() === "YTAUDIO" || this.pp.getModel() === "YTVIDEO")&&!this.pp.getState("IDLE")) {
                c = true
            }
            if (c != true && this.getConfig("bufferIconDelay") > 0) {
                this.bufferDelayTimer = setTimeout(function() {
                    e.showBufferIcon(true)
                }, this.getConfig("bufferIconDelay"));
                return 
            }
            if (this.buffIcn.hasClass("active")) {
                return 
            }
            this.buffIcn.addClass("active").removeClass("inactive");
            if (e.buffIcnSprite == null) {
                return 
            }
            var b = (e.config.spriteCountUp == true) ? 0: (e.config.spriteHeight + e.config.spriteOffset) * (e.config.spriteTiles - 1), d = b;
            e.buffIcnSprite.addClass("active").removeClass("inactive");
            (function() {
                if (!e.buffIcn.is(":visible")) {
                    return 
                }
                e.buffIcnSprite.css("backgroundPosition", "0px -" + d + "px");
                if (e.config.spriteCountUp == true) {
                    d += e.config.spriteHeight + e.config.spriteOffset
                } else {
                    d -= e.config.spriteHeight + e.config.spriteOffset
                }
                if (d > (b + e.config.spriteHeight) * e.config.spriteTiles || d < e.config.spriteOffset) {
                    d = b
                }
                setTimeout(arguments.callee, 60)
            })()
        }
    }
});
var projekktorControlbar = function() {};
jQuery(function(a) {
    projekktorControlbar.prototype = {
        _cTimer: null,
        _noHide: false,
        _cFading: false,
        _vSliderAct: false,
        _storeVol: null,
        _timeTags: {},
        cb: null,
        _pos: {
            left: 0,
            right: 0
        },
        controlElements: {},
        controlElementsConfig: {
            cb: null,
            playhead: {
                on: null,
                call: null
            },
            loaded: null,
            scrubber: null,
            scrubberdrag: {
                on: ["mousedown"],
                call: "scrubberdragStartDragListener"
            },
            play: {
                on: ["touchstart", "click"],
                call: "playClk"
            },
            pause: {
                on: ["touchstart", "click"],
                call: "pauseClk"
            },
            stop: {
                on: ["touchstart", "click"],
                call: "stopClk"
            },
            prev: {
                on: ["touchstart", "click"],
                call: "prevClk"
            },
            next: {
                on: ["touchstart", "click"],
                call: "nextClk"
            },
            rewind: {
                on: ["touchstart", "click"],
                call: "rewindClk"
            },
            forward: {
                on: ["touchstart", "click"],
                call: "forwardClk"
            },
            fsexit: {
                on: ["touchstart", "click"],
                call: "exitFullscreenClk"
            },
            fsenter: {
                on: ["touchstart", "click"],
                call: "enterFullscreenClk"
            },
            loquality: {
                on: ["touchstart", "click"],
                call: "setQualityClk"
            },
            hiquality: {
                on: ["touchstart", "click"],
                call: "setQualityClk"
            },
            vslider: {
                on: ["touchstart", "click"],
                call: "vsliderClk"
            },
            vmarker: {
                on: ["touchstart", "click"],
                call: "vsliderClk"
            },
            vknob: {
                on: ["mousedown"],
                call: "vknobStartDragListener"
            },
            mute: {
                on: ["touchstart", "click"],
                call: "muteClk"
            },
            unmute: {
                on: ["touchstart", "click"],
                call: "unmuteClk"
            },
            vmax: {
                on: ["touchstart", "click"],
                call: "vmaxClk"
            },
            open: {
                on: ["touchstart", "click"],
                call: "openCloseClk"
            },
            close: {
                on: ["touchstart", "click"],
                call: "openCloseClk"
            },
            loop: {
                on: ["touchstart", "click"],
                call: "loopClk"
            },
            draghandle: {
                on: ["mousedown"],
                call: "handleStartDragListener"
            },
            controls: null,
            title: null,
            sec_dur: null,
            min_dur: null,
            hr_dur: null,
            sec_elp: null,
            min_elp: null,
            hr_elp: null,
            sec_rem: null,
            min_rem: null,
            hr_rem: null
        },
        config: {
            toggleMute: false,
            showCuePoints: false,
            fadeDelay: 2500,
            showOnStart: false,
            showOnIdle: false,
            controlsTemplate: '<ul class="left"><li><div %{play}></div><div %{pause}></div></li><li><div %{title}></div></li></ul><ul class="right"><li><div %{fsexit}></div><div %{fsenter}></div></li><li><div %{loquality}></div><div %{hiquality}></div></li><li><div %{vmax}></div></li><li><div %{vslider}><div %{vmarker}></div><div %{vknob}></div></div></li><li><div %{mute}></div></li><li><div %{timeleft}>%{hr_elp}:%{min_elp}:%{sec_elp} | %{hr_dur}:%{min_dur}:%{sec_dur}</div></li><li><div %{next}></div></li><li><div %{prev}></div></li></ul><ul class="bottom"><li><div %{scrubber}><div %{loaded}></div><div %{playhead}></div><div %{scrubberdrag}></div></div></li></ul>'
        },
        initialize: function() {
            var f = this, e = this.playerDom.html(), c = true, b = this.pp.getNS();
            for (var d in this.controlElementsConfig) {
                if (e.match(new RegExp(b + d, "gi"))) {
                    c = false;
                    break
                }
            }
            if (c) {
                this.cb = this.applyToPlayer(a(("<div/>")).addClass("controls"));
                this.applyTemplate(this.cb, this.getConfig("controlsTemplate"))
            } else {
                this.cb = this.playerDom.find("." + b + "controls")
            }
            for (var d in this.controlElementsConfig) {
                this.controlElements[d] = a(this.playerDom).find("." + b + d);
                $p.utils.blockSelection(this.controlElements[d])
            }
            this.addGuiListeners();
            this.hidecb(true);
            this.pluginReady = true
        },
        applyTemplate: function(c, f) {
            var d = this, b = this.pp.getNS();
            if (f) {
                var e = f.match(/\%{[a-zA-Z_]*\}/gi);
                if (e != null) {
                    a.each(e, function(g, h) {
                        var i = h.replace(/\%{|}/gi, "");
                        if (h.match(/\_/gi)) {
                            f = f.replace(h, '<span class="' + b + i + '"></span>')
                        } else {
                            f = f.replace(h, 'class="' + b + i + '"')
                        }
                    })
                }
                c.html(f)
            }
        },
        itemHandler: function(c) {
            var b = parseFloat(this.cookie("volume"));
            a(this.cb).find("." + this.pp.getNS() + "cuepoint").remove();
            this._storeVol = (b != null&&!isNaN(b)) ? b : this.getConfig("volume");
            this.pp.setVolume(this._storeVol);
            this.updateDisplay();
            this.hidecb(true);
            this.drawTitle();
            this.displayQualityToggle();
            this.pluginReady = true
        },
        startHandler: function() {
            this.pp.setVolume(this._storeVol);
            if (this.getConfig("showOnStart") == true) {
                this.showcb(true)
            } else {
                this.hidecb(true)
            }
        },
        readyHandler: function(b) {
            clearTimeout(this._cTimer);
            if (this.getConfig("showOnIdle")) {
                this.showcb(true);
                this.cb.removeClass("inactive").addClass("active").show()
            }
            this.pluginReady = true
        },
        durationChangeHandler: function(b) {
            this.displayCuePoints(b)
        },
        updateDisplay: function() {
            var b = this, c = this.pp.getState();
            if (this.pp.getHasGUI()) {
                return 
            }
            if (this.getConfig("controls") == false) {
                this.hidecb(true);
                return 
            }
            if (this.pp.getItemCount() < 2 || this.getConfig("disallowSkip")) {
                this._active("prev", false);
                this._active("next", false)
            } else {
                this._active("prev", true);
                this._active("next", true)
            }
            if (this.pp.getItemIdx() < 1) {
                this._active("prev", false)
            }
            if (this.pp.getItemIdx() >= this.pp.getItemCount() - 1) {
                this._active("next", false)
            }
            if (this.getConfig("disablePause")) {
                this._active("play", false);
                this._active("pause", false)
            } else {
                if (c === "PLAYING") {
                    this.drawPauseButton()
                }
                if (c === "PAUSED") {
                    this.drawPlayButton()
                }
                if (c === "IDLE") {
                    this.drawPlayButton()
                }
            }
            this._active("stop", c !== "IDLE");
            this._active("forward", c !== "IDLE");
            this._active("rewind", c !== "IDLE");
            if (this.pp.getInFullscreen() === true) {
                this.drawExitFullscreenButton()
            } else {
                this.drawEnterFullscreenButton()
            }
            if (!this.getConfig("enableFullscreen") || this.getConfig("isCrossDomain")) {
                this._active("fsexit", false);
                this._active("fsenter", false)
            }
            this._active("loop", this.pp.getConfig("loop"));
            this.displayQualityToggle();
            this.displayTime();
            this.displayVolume(this._storeVol)
        },
        stateHandler: function(b) {
            this.updateDisplay();
            if ("STOPPED|DONE|IDLE".indexOf(b)>-1) {
                this.hidecb(true);
                return 
            }
            if ("STOPPED|AWAKENING|IDLE|DONE".indexOf(b)>-1) {
                this.displayTime(0, 0, 0);
                this.displayProgress(0)
            }
            if ("ERROR".indexOf(b)>-1) {
                this._noHide = false;
                this.hidecb(true)
            }
            this.displayProgress()
        },
        scheduleModifiedHandler: function() {
            if (this.pp.getState() === "IDLE") {
                return 
            }
            this.updateDisplay();
            this.displayTime();
            this.displayProgress()
        },
        volumeHandler: function(b) {
            if (this.getConfig("fixedVolume") != true) {
                this.cookie("volume", b)
            }
            this._storeVol = b;
            this.displayVolume(b)
        },
        progressHandler: function(b) {
            this.displayProgress()
        },
        timeHandler: function(b) {
            this.displayTime();
            this.displayProgress()
        },
        qualityChangeHandler: function(b) {
            this.displayQualityToggle(b)
        },
        fullscreenHandler: function(d) {
            var c = this, b = this.pp.getNS();
            clearTimeout(this._cTimer);
            this._noHide = false;
            this._cFading = false;
            this._vSliderAct = false;
            if (!this.getConfig("controls")) {
                return 
            }
            if (!this.getConfig("enableFullscreen") || this.getConfig("isCrossDomain")) {
                return 
            }
            if (d) {
                this.cb.addClass("fullscreen");
                this.drawExitFullscreenButton()
            } else {
                this.cb.removeClass("fullscreen");
                this.drawEnterFullscreenButton()
            }
            if (this.pp.getState() == "IDLE"&&!this.getConfig("showOnIdle")) {
                this.hidecb(true)
            }
        },
        addGuiListeners: function() {
            var b = this;
            a.each(this.controlElementsConfig, function(c, d) {
                if (!d || d.on == null) {
                    return true
                }
                a.each(d.on, function(h, e) {
                    var f = ("on" + e in window.document);
                    if (!f) {
                        var g = document.createElement("div");
                        g.setAttribute("on" + e, "return;");
                        f = (typeof g["on" + e] == "function")
                    }
                    if (f) {
                        b.controlElements[c].bind(e, function(i) {
                            b.clickCatcher(i, d.call, b.controlElements[c])
                        });
                        return false
                    }
                })
            });
            this.cb.mouseenter(function(c) {
                b.controlsFocus(c)
            });
            this.cb.mouseleave(function(c) {
                b.controlsBlur(c)
            })
        },
        clickCatcher: function(b, d, c) {
            b.stopPropagation();
            b.preventDefault();
            $p.utils.log("Controlbar: Click", c, d, b);
            this[d](b, c);
            return false
        },
        drawTitle: function() {
            this.controlElements.title.html(this.getConfig("title", ""))
        },
        hidecb: function(b) {
            clearTimeout(this._cTimer);
            if (this.cb == null) {
                return 
            }
            if (this.getConfig("controls") == false) {
                this.cb.removeClass("active").addClass("inactive");
                return 
            }
            if (b) {
                this._noHide = false
            }
            if (this._noHide || this.cb.hasClass("inactive")) {
                return 
            }
            this.cb.removeClass("active").addClass("inactive");
            this.sendEvent("hide", this.cb)
        },
        showcb: function(c) {
            var b = this;
            clearTimeout(this._cTimer);
            if (this.pp.getHasGUI() || this.getConfig("controls") == false) {
                this.cb.removeClass("active").addClass("inactive");
                return 
            }
            if (this.cb == null) {
                return 
            }
            if ("IDLE|AWAKENING|ERROR".indexOf(this.pp.getState())>-1 && c != true) {
                return 
            }
            if (this.cb.hasClass("active") && c !== false) {
                this._cTimer = setTimeout(function() {
                    b.hidecb()
                }, this.getConfig("fadeDelay"));
                return 
            }
            this.cb.removeClass("inactive").addClass("active");
            this.sendEvent("show", this.cb)
        },
        displayTime: function(f, c, j) {
            if (this.pp.getHasGUI()) {
                return 
            }
            try {
                var d = (f != undefined) ? f: this.pp.getLoadPlaybackProgress(), h = (c != undefined) ? c: this.pp.getDuration(), b = (j != undefined) ? j: this.pp.getPosition()
            } catch (g) {
                var d = f || 0, h = c || 0, b = j || 0
            }
            this.controlElements.playhead.data("pct", d).css({
                width: d + "%"
            });
            var i = a.extend({}, this._clockDigits(h, "dur"), this._clockDigits(b, "elp"), this._clockDigits(h - b, "rem"));
            a.each(this.controlElements, function(e, k) {
                if (i[e]) {
                    a.each(k, function() {
                        a(this).html(i[e])
                    })
                }
            })
        },
        displayProgress: function() {
            this.controlElements.loaded.css("width", this.pp.getLoadProgress() + "%")
        },
        displayVolume: function(f) {
            var e = this;
            if (this._vSliderAct == true) {
                return 
            }
            if (f == null) {
                return 
            }
            var b = this.cb.hasClass("active"), e = this, d = this.getConfig("fixedVolume"), c = (this.controlElements.mute.hasClass("toggle") || this.controlElements.unmute.hasClass("toggle") || this.getConfig("toggleMute"));
            this._active("mute", !d);
            this._active("unmute", !d);
            this._active("vmax", !d);
            this._active("vknob", !d);
            this._active("vmarker", !d);
            this._active("vslider", !d);
            this.controlElements.vmarker.css("width", f * 100 + "%");
            this.controlElements.vknob.css("left", f * 100 + "%");
            if (c) {
                switch (parseFloat(f)) {
                case 0:
                    this._active("mute", false);
                    this._active("unmute", true);
                    this._active("vmax", true);
                    break;
                default:
                    this._active("mute", true);
                    this._active("unmute", false);
                    this._active("vmax", false);
                    break
                }
            }
            if (b) {
                this.cb.fadeTo(1, 0.99).fadeTo(1, 1, function() {
                    e.cb.removeAttr("style")
                })
            }
        },
        displayCuePoints: function(d) {
            var b = this, c = this.pp.getNS();
            if (!this.getConfig("showCuePoints")) {
                return 
            }
            b.controlElements.scrubber.remove("." + c + "cuepoint");
            a.each(this.pp.getCuePoints() || [], function() {
                var e = Math.max(100 / d, Math.round(d / 100), 1), h = (this.on * 100 / d) - ((e / 2) * 100 / d), g = this, f = b.pp, i = a(document.createElement("div")).addClass(c + "cuepoint").addClass("inactive").css("left", h + "%").css("width", e + "%").data("on", this.on);
                if (this.title != "") {
                    i.attr("title", this.title)
                }
                this.addListener("unlock", function() {
                    a(i).removeClass("inactive").addClass("active");
                    i.click(function() {
                        b.pp.setPlayhead(i.data("on"))
                    })
                });
                b.controlElements.scrubber.append(i)
            })
        },
        drawPauseButton: function(b) {
            this._active("pause", true);
            this._active("play", false)
        },
        drawPlayButton: function(b) {
            this._active("pause", false);
            this._active("play", true)
        },
        drawEnterFullscreenButton: function(b) {
            this._active("fsexit", false);
            this._active("fsenter", true)
        },
        drawExitFullscreenButton: function(b) {
            this._active("fsexit", true);
            this._active("fsenter", false)
        },
        displayQualityToggle: function(d) {
            var f = this.getConfig("playbackQualities"), e = this.pp.getPlaybackQualities(), b = this.pp.getNS();
            best = [];
            if (e.length < 2 || f.length < 2) {
                this.controlElements.loquality.removeClass().addClass("inactive").addClass(b + "loquality").data("qual", "");
                this.controlElements.hiquality.removeClass().addClass("inactive").addClass(b + "hiquality").data("qual", "");
                return 
            }
            f.sort(function(h, g) {
                return h.minHeight - g.minHeight
            });
            for (var c = f.length; c--; c > 0) {
                if (a.inArray(f[c].key, e)>-1) {
                    best.push(f[c].key)
                }
                if (best.length > 1) {
                    break
                }
            }
            if (best[0] == this.pp.getPlaybackQuality()) {
                this._active("loquality", true).addClass("qual" + best[1]).data("qual", best[1]);
                this._active("hiquality", false).addClass("qual" + best[0]).data("qual", best[0])
            } else {
                this._active("loquality", false).addClass("qual" + best[1]).data("qual", best[1]);
                this._active("hiquality", true).addClass("qual" + best[0]).data("qual", best[0])
            }
        },
        errorHandler: function(b) {
            this.hidecb(true)
        },
        leftclickHandler: function() {
            this.mouseleaveHandler()
        },
        focusHandler: function(b) {
            this.showcb()
        },
        mousemoveHandler: function(b) {
            if (this.pp.getState("STARTING")) {
                return 
            }
            this.showcb()
        },
        controlsFocus: function(b) {
            this._noHide = true
        },
        controlsBlur: function(b) {
            this._noHide = false
        },
        setQualityClk: function(b) {
            this.pp.setPlaybackQuality(a(b.currentTarget).data("qual"))
        },
        playClk: function(b) {
            this.pp.setPlay()
        },
        pauseClk: function(b) {
            this.pp.setPause()
        },
        stopClk: function(b) {
            this.pp.setStop()
        },
        startClk: function(b) {
            this.pp.setPlay()
        },
        controlsClk: function(b) {},
        prevClk: function(b) {
            this.pp.setActiveItem("previous")
        },
        nextClk: function(b) {
            this.pp.setActiveItem("next")
        },
        forwardClk: function(b) {
            this.pp.setPlayhead("+10")
        },
        rewindClk: function(b) {
            this.pp.setPlayhead("-10")
        },
        muteClk: function(b) {
            this.pp.setVolume(0)
        },
        unmuteClk: function(b) {
            if (this._storeVol <= 0) {
                this._storeVol = 1
            }
            this.pp.setVolume(this._storeVol)
        },
        vmaxClk: function(b) {
            this.pp.setVolume(1)
        },
        enterFullscreenClk: function(b) {
            this.pp.setFullscreen(true)
        },
        exitFullscreenClk: function(b) {
            this.pp.setFullscreen(false)
        },
        loopClk: function(b) {
            this.pp.setLoop(a(b.currentTarget).hasClass("inactive") || false);
            this.updateDisplay()
        },
        vmarkerClk: function(b) {
            vsliderClk(b)
        },
        openCloseClk: function(b) {
            var c = this;
            a(a(b.currentTarget).attr("class").split(/\s+/)).each(function(d, e) {
                if (e.indexOf("toggle")==-1) {
                    return 
                }
                c.playerDom.find("." + e.substring(6)).slideToggle("slow", function() {
                    c.pp.setResize()
                });
                c.controlElements.open.toggle();
                c.controlElements.close.toggle()
            })
        },
        vsliderClk: function(c) {
            if (this._vSliderAct == true) {
                return 
            }
            var g = (this.pp.getInFullscreen() === true && this.controlElements.vslider.length > 1) ? 1: 0, e = a(this.controlElements.vslider[g]), b = e.width(), d = (c.originalEvent.touches) ? c.originalEvent.touches[0].pageX: c.pageX, f = d - e.offset().left;
            if (f < 0 || isNaN(f) || f == undefined) {
                result = 0
            } else {
                result = (f / b)
            }
            this.pp.setVolume(result);
            this._storeVol = result
        },
        scrubberdragStartDragListener: function(b) {
            if (this.getConfig("disallowSkip") == true) {
                return 
            }
            this._sSliderAct = true;
            var e = this, f = (this.pp.getInFullscreen() === true && this.controlElements.scrubber.length > 1) ? 1: 0, c = a(this.controlElements.scrubberdrag[f]), g = a(this.controlElements.loaded[f]), d = 0, k = Math.abs(parseInt(c.offset().left) - b.clientX), i = function(m) {
                var l = Math.abs(c.offset().left - m.clientX);
                l = (l > c.width()) ? c.width() : l;
                l = (l > g.width()) ? g.width() : l;
                l = (l < 0) ? 0 : l;
                l = Math.abs(l / c.width()) * e.pp.getDuration();
                if (l > 0 && l != d) {
                    d = l;
                    e.pp.setPlayhead(d)
                }
            }, h = function(l) {
                l.stopPropagation();
                l.preventDefault();
                e.playerDom.unbind("mouseup.slider");
                c.unbind("mousemove", j);
                c.unbind("mouseup", h);
                e._sSliderAct = false;
                return false
            }, j = function(l) {
                clearTimeout(e._cTimer);
                l.stopPropagation();
                l.preventDefault();
                i(l);
                return false
            };
            this.playerDom.bind("mouseup.slider", h);
            c.mouseup(h);
            c.mousemove(j);
            i(b)
        },
        vknobStartDragListener: function(b, c) {
            this._vSliderAct = true;
            var f = this, g = (this.pp.getInFullscreen() === true && this.controlElements.vslider.length > 1) ? 1: 0, e = a(c[g]), d = a(this.controlElements.vslider[g]), d = a(this.controlElements.vslider[g]), k = Math.abs(parseInt(e.position().left) - b.clientX), h = 0, i = function(l) {
                f.playerDom.unbind("mouseup", i);
                d.unbind("mousemove", j);
                d.unbind("mouseup", i);
                e.unbind("mousemove", j);
                e.unbind("mouseup", i);
                f._vSliderAct = false;
                return false
            }, j = function(l) {
                clearTimeout(f._cTimer);
                var m = (l.clientX - k);
                m = (m > d.width() - e.width() / 2) ? d.width() - (e.width() / 2) : m;
                m = (m < 0) ? 0 : m;
                e.css("left", m + "px");
                h = Math.abs(m / (d.width() - (e.width() / 2)));
                f.pp.setVolume(h);
                f._storeVol = h;
                a(f.controlElements.vmarker[g]).css("width", h * 100 + "%");
                return false
            };
            this.playerDom.mouseup(i);
            d.mousemove(j);
            d.mouseup(i);
            e.mousemove(j);
            e.mouseup(i)
        },
        handleStartDragListener: function(d, g) {
            var h = this, f = Math.abs(parseInt(this.cb.position().left) - d.clientX), c = Math.abs(parseInt(this.cb.position().top) - d.clientY);
            var b = function(i) {
                i.stopPropagation();
                i.preventDefault();
                h.playerDom.unbind("mouseup", b);
                h.playerDom.unbind("mouseout", b);
                h.playerDom.unbind("mousemove", e);
                return false
            };
            var e = function(i) {
                i.stopPropagation();
                i.preventDefault();
                clearTimeout(h._cTimer);
                var k = (i.clientX - f);
                k = (k > h.playerDom.width() - h.cb.width()) ? h.playerDom.width() - h.cb.width() : k;
                k = (k < 0) ? 0 : k;
                h.cb.css("left", k + "px");
                var j = (i.clientY - c);
                j = (j > h.playerDom.height() - h.cb.height()) ? h.playerDom.height() - h.cb.height() : j;
                j = (j < 0) ? 0 : j;
                h.cb.css("top", j + "px");
                return false
            };
            this.playerDom.mousemove(e);
            this.playerDom.mouseup(b)
        },
        _active: function(d, b) {
            var c = this.controlElements[d];
            if (b == true) {
                c.addClass("active").removeClass("inactive")
            } else {
                c.addClass("inactive").removeClass("active")
            }
            return c
        },
        _clockDigits: function(e, i) {
            if (e < 0 || isNaN(e) || e == undefined) {
                e = 0
            }
            var g = Math.floor(e / (60 * 60));
            var h = e%(60 * 60);
            var d = Math.floor(h / 60);
            var c = h%60;
            var f = Math.floor(c);
            var b = {};
            b["min_" + i] = (d < 10) ? "0" + d : d;
            b["sec_" + i] = (f < 10) ? "0" + f : f;
            b["hr_" + i] = (g < 10) ? "0" + g : g;
            return b
        }
    }
});
var projekktorContextmenu = function() {};
jQuery(function(a) {
    projekktorContextmenu.prototype = {
        _dest: null,
        _items: {},
        reqVer: "1.2.13",
        initialize: function() {
            var b = this, c = this.pp.getIframeWindow() || a(window);
            this._dest = $p.utils.blockSelection(this.applyToPlayer(a("<ul/>")));
            this._items.player = {
                getContextTitle: function() {
                    return b.getConfig("playerName") + " V" + b.pp.getPlayerVer()
                },
                open: function() {
                    if (b.getConfig("playerHome") != null) {
                        c.get(0).location.href = b.getConfig("playerHome");
                        b.pp.setPause()
                    }
                }
            };
            this.pluginReady = true
        },
        mousedownHandler: function(b) {
            switch (b.which) {
            case 3:
                var c = this.pp.getDC().offset(), d = (b.pageY - c.top), g = (b.pageX - c.left);
                if (g + this._dest.width() > this.pp.getDC().width()) {
                    g = this.pp.getDC().width() - this._dest.width() - 2
                }
                if (d + this._dest.height() > this.pp.getDC().height()) {
                    d = this.pp.getDC().height() - this._dest.height() - 2
                }
                this.setActive();
                this._dest.css({
                    top: d + "px",
                    left: g + "px"
                });
                break;
            case 1:
                try {
                    this._items[a(b.target).data("plugin")].open()
                } catch (f) {}
            default:
                this.setInactive()
            }
        },
        mouseleaveHandler: function() {
            this.setInactive()
        },
        eventHandler: function(b, c) {
            if (b.indexOf("Contextmenu")>-1) {
                if (this._items[c.name] == null) {
                    this._items[c.name] = c
                }
            }
        },
        displayReadyHandler: function() {
            var d = this, c = null;
            this.setInactive();
            this._dest.html("");
            for (var b in this._items) {
                c = a("<span/>").data("plugin", b).html(this._items[b].getContextTitle() || b);
                try {
                    this._items[b].setContextEntry(c)
                } catch (f) {}
                a("<li/>").append(c).data("plugin", b).appendTo(this._dest)
            }
        }
    }
});;

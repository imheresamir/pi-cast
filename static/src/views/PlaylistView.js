define(function(require, exports, module) {
    var View = require('famous/core/View');
    var ScrollContainer = require('famous/views/ScrollContainer');
    var Modifier = require('famous/core/Modifier');
    var RenderNode = require('famous/core/RenderNode');
    var Surface = require('famous/core/Surface');
    var EventHandler = require('famous/core/EventHandler');

    var playlistItems = [];
    var eventHandler = new EventHandler();
    var index = 0;

    function PlaylistView() {
        View.apply(this, arguments);

        eventHandler.pipe(this);
        
        this.currentlySelectedIndex = 0;
        this.currentlyPlayingIndex = 0;

        this.rootContainer = new ScrollContainer({
            scrollview: {
                direction: 1,
                //edgeGrip: 1,
                //edgeDamp: 1,
                //speedLimit: 0.5,
                //friction: 1,
                //drag: 5
            }
        });

        this.on("prevSelect", function() {
            if(this.currentlySelectedIndex > 0) {
                this.currentlySelectedIndex--;
                this._eventOutput.emit("select", this.currentlySelectedIndex);
            }
        });
        this.on("nextSelect", function() {
            if(this.currentlySelectedIndex < playlistItems.length - 1) {
                this.currentlySelectedIndex++;
                this._eventOutput.emit("select", this.currentlySelectedIndex);
            }
        });
        this.on("prevPlay", function() {
            this.currentlyPlayingIndex = this.currentlySelectedIndex;
            this._eventOutput.emit("play", this.currentlyPlayingIndex);
        });
        this.on("nextPlay", function() {
            this.currentlyPlayingIndex = this.currentlySelectedIndex;
            this._eventOutput.emit("play", this.currentlyPlayingIndex);
        });

        this.on("select", function(index) {
            this.currentlySelectedIndex = index;

            for(var i = 0; i < playlistItems.length; i++) {
                if(i == index) {
                    playlistItems[i]._child._child._object.setProperties(this.options.selectedProperties);
                } else {
                    playlistItems[i]._child._child._object.setProperties(this.options.defaultProperties);
                    playlistItems[this.currentlyPlayingIndex]._child._child._object.setProperties(this.options.playingProperties);
                }
            }
        });

        this.on("play", function(index) {
            this.currentlyPlayingIndex = index;

            for(var i = 0; i < playlistItems.length; i++) {
                if(i == index) {
                    playlistItems[i]._child._child._object.setProperties(this.options.playingProperties);
                } else {
                    playlistItems[i]._child._child._object.setProperties(this.options.defaultProperties);
                }
            }
        });

        _construct.call(this);

        this.rootContainer.on("dragover", function(event) {
            event.preventDefault();

        });

        this.rootContainer.on("drop", function(event) {
            event.preventDefault();
            var data = event.dataTransfer.getData("Text");

            eventHandler.emit("playlistEntryAdded", data)

        });

        this.rootContainer.sequenceFrom(playlistItems);
        this.add(this.rootContainer);

    }

    PlaylistView.prototype = Object.create(View.prototype);
    PlaylistView.prototype.constructor = PlaylistView;
    PlaylistView.prototype.AddEntry = AddEntry;
    PlaylistView.prototype.Clear = Clear;
    PlaylistView.prototype.Reconstruct = _construct;

    PlaylistView.DEFAULT_OPTIONS = {
        entries: [],
        sizeFunction: function() {
            return [100, 100];
        },
        selectedProperties: {
            color: "white",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            textAlign: "left",
            border: "none",
            //paddingLeft: "110px",
            //paddingTop: "27.5px"
        },
        playingProperties: {
            color: "white",
            textAlign: "left",
            border: "2.5px solid rgba(6, 148, 147, 237)",
            //paddingLeft: "110px",
            //paddingTop: "27.5px"
        },
        defaultProperties: {
            color: "white",
            textAlign: "left",
            backgroundColor: "rgba(255, 255, 255, 0)",
            border: "none",
            //paddingLeft: "110px",
            //paddingTop: "27.5px"
        }

    };

    function Clear() {
        this.options.entries = [];
        this.index = 0;
    }

    function AddEntry(entry) {
        this.options.entries.push({
            Title: entry.Title,
            Artist: entry.Artist,
            Album: entry.Album,
            ArtPath: entry.ArtPath,
            Url: entry.Url
        });
    }

    function _construct() {
        for(var i = index; i < this.options.entries.length; i++, index++) {
            var itemnode = new RenderNode();
            var mod = new Modifier({
                align: [1, 0],
                origin: [1, 0],
                //transform: Transform.translate(0, 6, 0)
            });

            mod.sizeFrom(this.options.sizeFunction());

            var itemSurface = new Surface({
                content:
                    '<img src="' + this.options.entries[i].ArtPath + '" height="100" width="100" style="float:left;margin-top:7.5px;margin-left:7.5px;">'
                    + '<p style="margin-left:125px;margin-top:15px;">' + this.options.entries[i].Title
                    + '<br>' + this.options.entries[i].Artist
                    + '<br>' + this.options.entries[i].Album + '</p>',
                properties: this.options.defaultProperties
            });

            if(i == this.currentlySelectedIndex){
                itemSurface.setProperties(this.options.selectedProperties);
            }

            if(i == this.currentlyPlayingIndex){
                itemSurface.setProperties(this.options.playingProperties);
            }

            itemSurface.pipe(this.rootContainer.scrollview);

            itemnode.add(mod).add(itemSurface);

            playlistItems.push(itemnode);

            var playlistLength = this.options.entries.length;

            playlistItems[playlistItems.length - 1]._child._child._object.on("mousedown", function() {
                //console.log(playlistItems[playlistItems.length - 1]._child._child._object.getContent());
                for(var j = 0; j < playlistLength; j++) {
                    if(playlistItems[j]._child._child._object == this) {
                        break;
                    }
                }
                eventHandler.emit("itemClicked", j);

            });

            playlistItems[playlistItems.length - 1]._child._child._object.on("touchstart", function() {
                //console.log(playlistItems[playlistItems.length - 1]._child._child._object.getContent());
                for(var j = 0; j < playlistLength; j++) {
                    if(playlistItems[j]._child._child._object == this) {
                        break;
                    }
                }
                eventHandler.emit("itemClicked", j);

            });
        }
    }

    module.exports = PlaylistView;
});

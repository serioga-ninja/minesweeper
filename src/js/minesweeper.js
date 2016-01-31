;(function ($, Snap, window, undefined) {

    $.fn.disableSelection = function () {
        return this
            .attr('unselectable', 'on')
            .css('user-select', 'none')
            .on('selectstart', false);
    };

    var Field,
        i, j,
        game, media = {},
        speed = 50,
        properties = {
            xCount: 10,
            yCount: 10,
            cellWidth: 20,
            cellHeight: 20,
            minesCount: 10
        },
    // perimetr coordinates of the point
        aroundCoordinates = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ],
        Events = {
            'open-cell': function () {
            },
            'place-flag': function () {
            },
            'win': function () {
                alert('Win');
                Minesweeper.showConfigs();
            },
            'loose': function () {
            }
        },

    // TODO: Collect and return data in this function
        Evt = function (additionalData) {

        },

    // clear matrix
        clear = function (w, h) {
            var a = [];
            for (i = 0; i < w; i++) {
                var row = [];
                for (j = 0; j < h; j++) {
                    row.push(0);
                }
                a.push(row);
            }
            return a;
        },
        px = function (number) {
            return number + 'px';
        },
    // collect sum of the perimetr fields
        sum = function (x, y, matrix) {
            var sum = 0;
            for (var i = 0; i < aroundCoordinates.length; i++) {
                sum += matrix[x + aroundCoordinates[i][0]] !== undefined
                && matrix[x][y + aroundCoordinates[i][1]] !== undefined ? matrix[x + aroundCoordinates[i][0]][y + aroundCoordinates[i][1]] : 0;
            }
            return sum;
        },
        getFlaggedCells = function (x, y, matrix) {
            var sum = 0;
            for (var i = 0; i < aroundCoordinates.length; i++) {
                if (matrix[x + aroundCoordinates[i][0]] !== undefined
                    && matrix[x][y + aroundCoordinates[i][1]] !== undefined) {
                    var cell = matrix[x + aroundCoordinates[i][0]][y + aroundCoordinates[i][1]];
                    sum += cell.isFlag ? 1 : 0;
                }
            }
            return sum;
        };

    function Minesweeper() {
        return (this instanceof Minesweeper) ? this : new Minesweeper();
    }

    /**
     * Init the Main scope
     * @param field
     * @param options
     * @returns {Minesweeper}
     */
    Minesweeper.init = function init(field, options) {
        var self = this;
        var $field = $(field);
        if ($field.prop("tagName") !== 'svg') {
            $('<svg/>').appendTo($field);
            field = field + ' svg';
        }

        // disable right click on scene
        $(field).on('contextmenu', function () {
            return false;
        });

        Snap.load('media/flag.svg', function (flag) {
            media['flag'] = flag.select('g');
        });

        Snap.load('media/mine.svg', function (mine) {
            media['mine'] = mine.select('g');
        });

        var defaultSizes = {
            '8x8': {
                xCount: 8,
                yCount: 8,
                minesCount: 10
            },
            '16x16': {
                xCount: 16,
                yCount: 16,
                minesCount: 40
            },
            '30x16': {
                xCount: 30,
                yCount: 16,
                minesCount: 99
            }
        };

        $('.default-type.clickable').on('click', function (ev) {
            self._config(field, defaultSizes[$(ev.currentTarget).attr('id')]);
        });

        $('.open-custom-form').on('click', function (ev) {
            $('.configs').hide();
            $('.custom-form').show();
        });

        $('#cancel').on('click', function () {
            $('.configs').show();
            $('.custom-form').hide();
        });

        $('#start').on('click', function (ev) {
            var properties = {};
            $.each($(ev.currentTarget).parents('form').serializeArray(), function (index, obj) {
                properties[obj.name] = obj.value;
            });

            self._config(field, properties);
        });

        return Minesweeper;
    };

    Minesweeper.on = function (event, callback) {
        if (typeof callback === 'function') {
            Events[event] = callback;
        }
    };

    Minesweeper.fire = function (event, arguments) {
        if (Events[event])
            Events[event].call(Minesweeper, Evt(arguments));
    };

    Minesweeper._config = function (field, options) {
        $.extend(properties, options || {});

        game = new Game(properties);
        $('#available-flags-count').text(game.getAvailableFlagsCount());

        Field = new BattleField(field);
        $('.configs').hide();
        $('.custom-form').hide();
    };

    Minesweeper.showConfigs = function () {
        $('.configs').show();
    };

    Minesweeper._draw = function () {

    };

    var Game = function (options) {
        var game = this,
            availableFlagsCount = options.minesCount,
            totalMinesCount = options.minesCount,
            closedCellCount = options.xCount * options.yCount;

        game.placeFlag = function () {
            if (availableFlagsCount > 0) {
                availableFlagsCount--;
                closedCellCount--;
                game.updateFlagNumber();
                return true;
            }
            return false;
        };

        game.removeFlag = function () {
            availableFlagsCount++;
            closedCellCount++;
            game.updateFlagNumber();
            return true;
        };

        game.getAvailableFlagsCount = function () {
            return availableFlagsCount;
        };

        game.updateFlagNumber = function () {
            $('#available-flags-count').text(game.getAvailableFlagsCount());
            game.checkState();
        };

        game.open = function () {
            closedCellCount--;
            game.checkState();
        };

        // return true on win
        game.checkState = function () {
            var win = closedCellCount === 0;
            if (win) {
                Minesweeper.fire('win');
            }
            return win;
        };

        return game;
    };

    $.extend(Game.prototype, {});

    var BattleField = function (selector) {
        var field = this,
            ready = false,

            width = properties.xCount * properties.cellWidth,
            height = properties.yCount * properties.cellHeight,

            svgField = Snap(selector),
            $Field = $(selector),

            FieldMatrix = [],
            MinesMap = [],
            CountsMap = [],
            MatrixElement = function (data) {
                return $.extend({}, {
                    cell: undefined,
                    opened: false,
                    isMine: false,
                    isFlag: false,
                    minesCount: 0,
                    coordX: 0,
                    coordY: 0,
                    indexX: 0,
                    indexY: 0,
                    open: function () {
                        var self = this;
                        if (this.opened || this.isFlag) {
                            return false;
                        }
                        this.opened = true;
                        if (this.isMine > 0) {
                            self.cell = new Elements.Mine(self.indexX, self.indexY);
                            Minesweeper.fire('lose');
                        } else if (this.minesCount > 0) {
                            self.cell = new Elements.NumberCell(self.indexX, self.indexY, self.minesCount);
                            game.open();
                        } else {
                            setTimeout(function () {
                                game.open();
                                field.open(self.indexX, self.indexY);
                                self.cell = new Elements.Opened(self.indexX, self.indexY);
                            }, speed);
                        }
                    },
                    // place the flag on the scene
                    triggerFlag: function (val) {
                        if (this.opened || !ready) {
                            return;
                        }
                        if (!this.isFlag && game.placeFlag()) {
                            this.isFlag = !this.isFlag;
                            this.cell.remove();
                            this.cell = new Elements.Flag(this.indexX, this.indexY);
                        } else if (this.isFlag) {
                            this.isFlag = !this.isFlag;
                            game.removeFlag();
                            this.cell.selectAll().remove();
                            this.cell.remove();
                            this.cell = new Elements.DummyCell(this.indexX, this.indexY);
                        }
                    },
                    // when double click on numbered cell we open all around
                    openFromNumber: function () {
                        var flaggedCells = getFlaggedCells(this.indexX, this.indexY, FieldMatrix);
                        if (flaggedCells !== this.minesCount) {
                            return false;
                        }
                        field.open(this.indexX, this.indexY);
                    }
                }, data);
            },

            Elements = (function () {
                function events(cell, indexX, indexY) {
                    var coordX = indexX * properties.cellHeight;
                    var coordY = indexY * properties.cellWidth;
                    var group = svgField.group();
                    var eventRect = svgField.rect(0, 0, properties.cellWidth, properties.cellHeight).attr({
                        fill: 'white',
                        stroke: "#000",
                        strokeWidth: 1
                    });
                    if (!(cell instanceof Array)) {
                        cell = [cell];
                    }

                    group.transform('t' + coordX + ',' + coordY);

                    group.append(eventRect);
                    for (var i = 0; i < cell.length; i++) {
                        group.append(cell[i]);
                    }
                    group.mousedown(function (ev) {
                        switch (ev.button) {
                            case 0: //left mouse button
                                if (!ready) {
                                    field.init(indexX, indexY);
                                } else {
                                    FieldMatrix[indexX][indexY].open();
                                }
                                break;
                            case 2: // right mouse button
                                FieldMatrix[indexX][indexY].triggerFlag();
                                return false;
                                break;
                        }
                    });
                    return group;
                }

                return {
                    DummyCell: function (indexX, indexY) {
                        var cell = svgField.rect(0, 0, properties.cellWidth, properties.cellHeight).attr({
                            fill: '#ccc'
                        }).toggleClass('cell');

                        return events(cell, indexX, indexY);
                    },
                    Flag: function (indexX, indexY) {
                        var flag = [];
                        flag.push(svgField.path('m 4.8895534,16.712231 c 0,0.275901 0.2116869,0.499635 0.4727347,0.499635 l 1.5599037,0 c 0.2610476,0 0.4727346,-0.223734 0.4727346,-0.499635 l 0,-6.052 9.8347566,-3.9478226 c 0.190261,-0.076381 0.312938,-0.2728632 0.304424,-0.4878532 -0.0085,-0.21499 -0.146307,-0.4000978 -0.34192,-0.459394 L 5.4926679,2.2179458 C 5.3499972,2.1747676 5.1963708,2.204674 5.0778522,2.2991737 4.9592879,2.3935531 4.8895534,2.5412596 4.8895534,2.6982144 l 0,14.0140166 z m 1.5600048,-0.49963 -0.6145405,0 0,-4.926214 0.6145405,-0.246626 0,5.17284 z m -0.6145405,-5.995081 0,-6.8562475 9.7306383,2.9503296 -9.7306383,3.9059179 z'));
                        flag.push(svgField.path('m 5.8507581,6.7864117 c 0,-3.2400918 0.00152,-3.4109429 0.030196,-3.4026976 0.3605537,0.1037358 9.6188099,2.9182916 9.6275399,2.9268191 0.0069,0.00673 -0.124993,0.066702 -0.29306,0.1332818 -0.168071,0.066575 -2.3303,0.9343717 -4.804951,1.9284364 -2.4746502,0.9940589 -4.5129382,1.8114726 -4.5295285,1.8164616 -0.028679,0.0086 -0.030196,-0.162054 -0.030196,-3.4023013 z').attr({
                            fill: '#ff0000'
                        }));
                        return events(flag, indexX, indexY);
                    },
                    NumberCell: function (indexX, indexY, text) {
                        var coordX = indexX * properties.cellHeight;
                        var coordY = indexY * properties.cellWidth;
                        var group = svgField.group();

                        var cell = svgField.text(5, 15, text).toggleClass('cell');
                        var eventRect = svgField.rect(0, 0, properties.cellWidth - 1, properties.cellHeight - 1).attr({
                            fill: 'yellow'
                        });

                        group.transform('t' + coordX + ',' + coordY);

                        group.append(eventRect);
                        group.append(cell);
                        group.dblclick(function () {
                            FieldMatrix[indexX][indexY].openFromNumber();
                        });

                        $('text.cell').disableSelection();
                        return group;
                    },
                    Mine: function (indexX, indexY) {
                        return events(media.mine, indexX, indexY);
                    },
                    Opened: function (indexX, indexY) {
                        var coordX = indexX * properties.cellHeight;
                        var coordY = indexY * properties.cellWidth;
                        var group = svgField.group();
                        var eventRect = svgField.rect(0, 0, properties.cellWidth, properties.cellHeight).attr({
                            fill: 'green',
                            stroke: "#000",
                            strokeWidth: 1
                        });
                        group.transform('t' + coordX + ',' + coordY);
                        group.append(eventRect);
                        return group;
                    }
                };
            })();

        /**
         * Calculate properties and dimentions for game area
         */
        (function buildField() {
            $Field.css({
                'display': 'block',
                'width': px(width),
                'height': px(height + 5)
            });
        })();

        /**
         * First draw dummy elements
         */
        (function draw() {
            var coordX, coordY;
            for (i = 0; i < properties.xCount; i++) {
                var row = [];
                for (j = 0; j < properties.yCount; j++) {
                    coordX = i * properties.cellHeight;
                    coordY = j * properties.cellWidth;
                    row.push(new MatrixElement({
                        cell: new Elements.DummyCell(i, j),
                        coordX: coordX,
                        coordY: coordY,
                        indexX: i,
                        indexY: j
                    }));
                }
                FieldMatrix.push(row);
            }
        })();

        field.open = function (indexX, indexY) {
            for (var t = 0; t < aroundCoordinates.length; t++) {
                if (FieldMatrix[indexX + aroundCoordinates[t][0]] !== undefined
                    && FieldMatrix[indexX][indexY + aroundCoordinates[t][1]] !== undefined) {
                    var elem = FieldMatrix[indexX + aroundCoordinates[t][0]][indexY + aroundCoordinates[t][1]];
                    elem.open();
                }
            }
        };

        field.init = function (indexX, indexY) {
            var minesCount = properties.minesCount;
            ready = true;
            // empty the mines map
            MinesMap = clear(properties.xCount, properties.yCount);
            CountsMap = clear(properties.xCount, properties.yCount);

            if ((properties.xCount * properties.yCount) / 2 < minesCount) {
                throw 'There are too many mines!'
            }

            // generate isMine field
            while (minesCount > 0) {
                var _x = parseInt(Math.random() * (properties.xCount - 0) + 0, 10);
                var _y = parseInt(Math.random() * (properties.yCount - 0) + 0, 10);
                var distance = Math.sqrt((indexX - _x) * (indexX - _x) + (indexY - _y) * (indexY - _y));


                if (MinesMap[_x][_y] !== 1 && distance > 3) {
                    MinesMap[_x][_y] = 1;
                    minesCount--;
                }
            }

            // generate count map
            for (i = 0; i < properties.xCount; i++) {
                for (j = 0; j < properties.yCount; j++) {
                    CountsMap[i][j] = sum(i, j, MinesMap);
                }
            }

            // generate battle field
            for (i = 0; i < properties.xCount; i++) {
                for (j = 0; j < properties.yCount; j++) {
                    FieldMatrix[i][j].isMine = MinesMap[i][j];
                    FieldMatrix[i][j].minesCount = CountsMap[i][j];
                }
            }

            field.open(indexX, indexY);
        };

        field.reload = function () {
            for (i = 0; i < properties.xCount; i++) {
                for (j = 0; j < properties.yCount; j++) {
                    if (FieldMatrix[i][j])
                        FieldMatrix[i][j].cell.remove();
                }
            }

            field = new BattleField(selector);
        };

        return field;
    };

    window.Minesweeper = Minesweeper;
})(jQuery, Snap, window);